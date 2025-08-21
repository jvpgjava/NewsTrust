import express from 'express';
import Joi from 'joi';
import { newsAnalyzer } from '../services/instances.js';
import { query } from '../config/database.js';

const router = express.Router();

// Schema de validação para notícia
const noticiaSchema = Joi.object({
    texto: Joi.string().min(10).max(10000).required(),
    link: Joi.string().uri().optional(),
    id_fonte: Joi.number().integer().positive().required(),
    confiabilidade: Joi.number().min(0).max(1).default(0.5)
});

/**
 * @swagger
 * /api/news:
 *   get:
 *     summary: Lista todas as notícias
 *     description: Retorna uma lista paginada de todas as notícias analisadas
 *     tags: [Notícias]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Número da página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Número de itens por página
 *       - in: query
 *         name: fonte_id
 *         schema:
 *           type: integer
 *         description: Filtrar por ID da fonte
 *       - in: query
 *         name: min_confiabilidade
 *         schema:
 *           type: number
 *           minimum: 0
 *           maximum: 1
 *         description: Confiabilidade mínima
 *     responses:
 *       200:
 *         description: Lista de notícias retornada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 noticias:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Noticia'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     pages:
 *                       type: integer
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/', async (req, res) => {
    try {
        const { page = 1, limit = 10, fonte_id, min_confiabilidade } = req.query;
        const offset = (page - 1) * limit;

        let whereConditions = [];
        let params = [];
        let paramIndex = 1;

        if (fonte_id) {
            whereConditions.push(`n.id_fonte = $${paramIndex}`);
            params.push(fonte_id);
            paramIndex++;
        }

        if (min_confiabilidade) {
            whereConditions.push(`n.confiabilidade >= $${paramIndex}`);
            params.push(min_confiabilidade);
            paramIndex++;
        }

        const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

        // Buscar notícias com dados da fonte
        const noticiasResult = await query(
            `SELECT n.*, f.nome as fonte_nome, f.site as fonte_site 
       FROM noticias n 
       JOIN fontes f ON n.id_fonte = f.id 
       ${whereClause} 
       ORDER BY n.created_at DESC 
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
            [...params, limit, offset]
        );

        // Contar total
        const countResult = await query(
            `SELECT COUNT(*) as total 
       FROM noticias n 
       JOIN fontes f ON n.id_fonte = f.id 
       ${whereClause}`,
            params
        );

        const total = parseInt(countResult.rows[0].total);
        const pages = Math.ceil(total / limit);

        res.json({
            noticias: noticiasResult.rows,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages
            }
        });
    } catch (error) {
        console.error('Erro ao listar notícias:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

/**
 * @swagger
 * /api/news/{id}:
 *   get:
 *     summary: Busca uma notícia específica
 *     description: Retorna os detalhes de uma notícia pelo ID
 *     tags: [Notícias]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da notícia
 *     responses:
 *       200:
 *         description: Notícia encontrada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 noticia:
 *                   $ref: '#/components/schemas/Noticia'
 *                 fonte:
 *                   $ref: '#/components/schemas/Fonte'
 *       404:
 *         description: Notícia não encontrada
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const result = await query(
            `SELECT n.*, f.nome as fonte_nome, f.site as fonte_site, f.peso as fonte_peso
       FROM noticias n 
       JOIN fontes f ON n.id_fonte = f.id 
       WHERE n.id = $1`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Notícia não encontrada' });
        }

        const noticia = result.rows[0];

        res.json({
            noticia: {
                id: noticia.id,
                texto: noticia.texto,
                link: noticia.link,
                confiabilidade: noticia.confiabilidade,
                created_at: noticia.created_at,
                updated_at: noticia.updated_at
            },
            fonte: {
                id: noticia.id_fonte,
                nome: noticia.fonte_nome,
                site: noticia.fonte_site,
                peso: noticia.fonte_peso
            }
        });
    } catch (error) {
        console.error('Erro ao buscar notícia:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

/**
 * @swagger
 * /api/news:
 *   post:
 *     summary: Cria uma nova notícia
 *     description: Cadastra uma nova notícia no sistema
 *     tags: [Notícias]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - texto
 *               - id_fonte
 *             properties:
 *               texto:
 *                 type: string
 *                 minLength: 10
 *                 maxLength: 10000
 *                 example: "Texto da notícia aqui..."
 *               link:
 *                 type: string
 *                 format: uri
 *                 example: "https://exemplo.com/noticia"
 *               id_fonte:
 *                 type: integer
 *                 example: 1
 *               confiabilidade:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 1
 *                 example: 0.75
 *           example:
 *             texto: "Texto da notícia aqui..."
 *             link: "https://exemplo.com/noticia"
 *             id_fonte: 1
 *             confiabilidade: 0.75
 *     responses:
 *       201:
 *         description: Notícia criada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Noticia'
 *       400:
 *         description: Dados inválidos
 *       404:
 *         description: Fonte não encontrada
 *       500:
 *         description: Erro interno do servidor
 */
router.post('/', async (req, res) => {
    try {
        const { error, value } = noticiaSchema.validate(req.body);

        if (error) {
            return res.status(400).json({
                error: 'Dados inválidos',
                details: error.details[0].message
            });
        }

        const { texto, link, id_fonte, confiabilidade } = value;

        // Verificar se a fonte existe
        const fonteResult = await query(
            'SELECT id FROM fontes WHERE id = $1',
            [id_fonte]
        );

        if (fonteResult.rows.length === 0) {
            return res.status(404).json({ error: 'Fonte não encontrada' });
        }

        // Criar notícia
        const result = await query(
            'INSERT INTO noticias (texto, link, id_fonte, confiabilidade) VALUES ($1, $2, $3, $4) RETURNING *',
            [texto, link, id_fonte, confiabilidade]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Erro ao criar notícia:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

/**
 * @swagger
 * /api/news/{id}:
 *   delete:
 *     summary: Remove uma notícia
 *     description: Remove uma notícia do sistema
 *     tags: [Notícias]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da notícia
 *     responses:
 *       200:
 *         description: Notícia removida com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 deleted_id:
 *                   type: integer
 *       404:
 *         description: Notícia não encontrada
 *       500:
 *         description: Erro interno do servidor
 */
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Verificar se existe
        const existingResult = await query(
            'SELECT id FROM noticias WHERE id = $1',
            [id]
        );

        if (existingResult.rows.length === 0) {
            return res.status(404).json({ error: 'Notícia não encontrada' });
        }

        // Remover notícia (cascade para feedback)
        await query('DELETE FROM noticias WHERE id = $1', [id]);

        res.json({
            message: 'Notícia removida com sucesso',
            deleted_id: parseInt(id)
        });
    } catch (error) {
        console.error('Erro ao remover notícia:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

export default router;
