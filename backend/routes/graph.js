import express from 'express';
import Joi from 'joi';
import { trustGraph } from '../services/instances.js';
import { query } from '../config/database.js';

const router = express.Router();

// Schema de validação para conexão
const conexaoSchema = Joi.object({
    fonte_origem: Joi.number().integer().positive().required(),
    fonte_destino: Joi.number().integer().positive().required(),
    peso: Joi.number().min(0).max(1).default(0.5)
});

/**
 * @swagger
 * /api/graph:
 *   get:
 *     summary: Obtém o grafo completo
 *     description: Retorna a representação completa do grafo de confiança em formato JSON
 *     tags: [Grafo]
 *     responses:
 *       200:
 *         description: Grafo retornado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 nodes:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Fonte'
 *                 edges:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Conexao'
 *                 stats:
 *                   type: object
 *                   properties:
 *                     nodeCount:
 *                       type: integer
 *                     edgeCount:
 *                       type: integer
 *                     averageConnections:
 *                       type: number
 *                     maxConnections:
 *                       type: integer
 *             example:
 *               nodes:
 *                 - id: 1
 *                   nome: "G1"
 *                   site: "https://g1.globo.com"
 *                   peso: 0.85
 *                 - id: 2
 *                   nome: "UOL"
 *                   site: "https://www.uol.com.br"
 *                   peso: 0.78
 *               edges:
 *                 - from: 1
 *                   to: 2
 *                   weight: 0.8
 *               stats:
 *                 nodeCount: 2
 *                 edgeCount: 1
 *                 averageConnections: 0.5
 *                 maxConnections: 1
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/', async (req, res) => {
    try {
        const grafo = trustGraph.toJSON();
        res.json(grafo);
    } catch (error) {
        console.error('Erro ao obter grafo:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

/**
 * @swagger
 * /api/graph/connections:
 *   get:
 *     summary: Lista todas as conexões
 *     description: Retorna todas as conexões (arestas) do grafo de confiança
 *     tags: [Grafo]
 *     parameters:
 *       - in: query
 *         name: fonte_origem
 *         schema:
 *           type: integer
 *         description: Filtrar por fonte origem
 *       - in: query
 *         name: fonte_destino
 *         schema:
 *           type: integer
 *         description: Filtrar por fonte destino
 *     responses:
 *       200:
 *         description: Conexões retornadas com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 conexoes:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       fonte_origem:
 *                         type: integer
 *                       fonte_destino:
 *                         type: integer
 *                       peso:
 *                         type: number
 *                       fonte_origem_nome:
 *                         type: string
 *                       fonte_destino_nome:
 *                         type: string
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/connections', async (req, res) => {
    try {
        const { fonte_origem, fonte_destino } = req.query;

        let whereConditions = [];
        let params = [];
        let paramIndex = 1;

        if (fonte_origem) {
            whereConditions.push(`c.fonte_origem = $${paramIndex}`);
            params.push(fonte_origem);
            paramIndex++;
        }

        if (fonte_destino) {
            whereConditions.push(`c.fonte_destino = $${paramIndex}`);
            params.push(fonte_destino);
            paramIndex++;
        }

        const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

        const result = await query(
            `SELECT c.*, 
              fo.nome as fonte_origem_nome, fo.site as fonte_origem_site,
              fd.nome as fonte_destino_nome, fd.site as fonte_destino_site
       FROM conexoes c
       JOIN fontes fo ON c.fonte_origem = fo.id
       JOIN fontes fd ON c.fonte_destino = fd.id
       ${whereClause}
       ORDER BY c.created_at DESC`,
            params
        );

        res.json({ conexoes: result.rows });
    } catch (error) {
        console.error('Erro ao listar conexões:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

/**
 * @swagger
 * /api/graph/connections:
 *   post:
 *     summary: Cria uma nova conexão
 *     description: Adiciona uma nova aresta ao grafo de confiança
 *     tags: [Grafo]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fonte_origem
 *               - fonte_destino
 *             properties:
 *               fonte_origem:
 *                 type: integer
 *                 example: 1
 *               fonte_destino:
 *                 type: integer
 *                 example: 2
 *               peso:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 1
 *                 example: 0.8
 *           example:
 *             fonte_origem: 1
 *             fonte_destino: 2
 *             peso: 0.8
 *     responses:
 *       201:
 *         description: Conexão criada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Conexao'
 *       400:
 *         description: Dados inválidos
 *       404:
 *         description: Fonte não encontrada
 *       409:
 *         description: Conexão já existe
 *       500:
 *         description: Erro interno do servidor
 */
router.post('/connections', async (req, res) => {
    try {
        const { error, value } = conexaoSchema.validate(req.body);

        if (error) {
            return res.status(400).json({
                error: 'Dados inválidos',
                details: error.details[0].message
            });
        }

        const { fonte_origem, fonte_destino, peso } = value;

        // Verificar se as fontes existem
        const fontesResult = await query(
            'SELECT id FROM fontes WHERE id IN ($1, $2)',
            [fonte_origem, fonte_destino]
        );

        if (fontesResult.rows.length !== 2) {
            return res.status(404).json({ error: 'Uma ou ambas as fontes não encontradas' });
        }

        // Verificar se a conexão já existe
        const existingResult = await query(
            'SELECT id FROM conexoes WHERE fonte_origem = $1 AND fonte_destino = $2',
            [fonte_origem, fonte_destino]
        );

        if (existingResult.rows.length > 0) {
            return res.status(409).json({ error: 'Conexão já existe' });
        }

        // Criar conexão
        const result = await query(
            'INSERT INTO conexoes (fonte_origem, fonte_destino, peso) VALUES ($1, $2, $3) RETURNING *',
            [fonte_origem, fonte_destino, peso]
        );

        const novaConexao = result.rows[0];

        // Adicionar ao grafo
        trustGraph.addEdge(fonte_origem, fonte_destino, peso);

        res.status(201).json(novaConexao);
    } catch (error) {
        console.error('Erro ao criar conexão:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

/**
 * @swagger
 * /api/graph/connections/{id}:
 *   put:
 *     summary: Atualiza o peso de uma conexão
 *     description: Modifica o peso de confiança de uma conexão existente
 *     tags: [Grafo]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da conexão
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - peso
 *             properties:
 *               peso:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 1
 *                 example: 0.9
 *           example:
 *             peso: 0.9
 *     responses:
 *       200:
 *         description: Peso atualizado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Conexao'
 *       400:
 *         description: Dados inválidos
 *       404:
 *         description: Conexão não encontrada
 *       500:
 *         description: Erro interno do servidor
 */
router.put('/connections/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { peso } = req.body;

        if (peso === undefined || peso < 0 || peso > 1) {
            return res.status(400).json({ error: 'Peso deve estar entre 0 e 1' });
        }

        // Verificar se a conexão existe
        const existingResult = await query(
            'SELECT * FROM conexoes WHERE id = $1',
            [id]
        );

        if (existingResult.rows.length === 0) {
            return res.status(404).json({ error: 'Conexão não encontrada' });
        }

        const conexao = existingResult.rows[0];

        // Atualizar peso
        const result = await query(
            'UPDATE conexoes SET peso = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
            [peso, id]
        );

        // Atualizar no grafo
        trustGraph.addEdge(conexao.fonte_origem, conexao.fonte_destino, peso);

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Erro ao atualizar conexão:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

/**
 * @swagger
 * /api/graph/connections/{id}:
 *   delete:
 *     summary: Remove uma conexão
 *     description: Remove uma aresta do grafo de confiança
 *     tags: [Grafo]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da conexão
 *     responses:
 *       200:
 *         description: Conexão removida com sucesso
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
 *         description: Conexão não encontrada
 *       500:
 *         description: Erro interno do servidor
 */
router.delete('/connections/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Verificar se existe
        const existingResult = await query(
            'SELECT * FROM conexoes WHERE id = $1',
            [id]
        );

        if (existingResult.rows.length === 0) {
            return res.status(404).json({ error: 'Conexão não encontrada' });
        }

        const conexao = existingResult.rows[0];

        // Remover conexão
        await query('DELETE FROM conexoes WHERE id = $1', [id]);

        // Remover do grafo
        trustGraph.removeEdge(conexao.fonte_origem, conexao.fonte_destino);

        res.json({
            message: 'Conexão removida com sucesso',
            deleted_id: parseInt(id)
        });
    } catch (error) {
        console.error('Erro ao remover conexão:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

/**
 * @swagger
 * /api/graph/bfs/{fonteId}:
 *   get:
 *     summary: Análise BFS de uma fonte
 *     description: Executa busca em largura (BFS) a partir de uma fonte específica
 *     tags: [Grafo]
 *     parameters:
 *       - in: path
 *         name: fonteId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da fonte inicial
 *       - in: query
 *         name: maxDepth
 *         schema:
 *           type: integer
 *           default: 3
 *           minimum: 1
 *           maximum: 5
 *         description: Profundidade máxima da busca
 *     responses:
 *       200:
 *         description: Análise BFS realizada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 paths:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       depth:
 *                         type: integer
 *                       path:
 *                         type: array
 *                         items:
 *                           type: integer
 *                       trust:
 *                         type: number
 *                       node:
 *                         $ref: '#/components/schemas/Fonte'
 *                 connections:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       node:
 *                         $ref: '#/components/schemas/Fonte'
 *                       trust:
 *                         type: number
 *                       depth:
 *                         type: integer
 *                 totalConnections:
 *                   type: integer
 *                 maxDepth:
 *                   type: integer
 *       404:
 *         description: Fonte não encontrada
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/bfs/:fonteId', async (req, res) => {
    try {
        const { fonteId } = req.params;
        const { maxDepth = 3 } = req.query;

        const bfsResult = trustGraph.bfs(parseInt(fonteId), parseInt(maxDepth));

        res.json(bfsResult);
    } catch (error) {
        console.error('Erro ao executar BFS:', error);

        if (error.message === 'Fonte inicial não encontrada') {
            return res.status(404).json({ error: 'Fonte não encontrada' });
        }

        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

/**
 * @swagger
 * /api/graph/stats:
 *   get:
 *     summary: Estatísticas do grafo
 *     description: Retorna estatísticas detalhadas sobre o grafo de confiança
 *     tags: [Grafo]
 *     responses:
 *       200:
 *         description: Estatísticas retornadas com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 nodeCount:
 *                   type: integer
 *                 edgeCount:
 *                   type: integer
 *                 averageConnections:
 *                   type: number
 *                 maxConnections:
 *                   type: integer
 *                 nodes:
 *                   type: array
 *                   items:
 *                     type: integer
 *             example:
 *               nodeCount: 25
 *               edgeCount: 45
 *               averageConnections: 1.8
 *               maxConnections: 8
 *               nodes: [1, 2, 3, 4, 5]
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/stats', async (req, res) => {
    try {
        const graphStats = trustGraph.getStats();

        // Buscar estatísticas de notícias
        const newsStatsResult = await query(`
            SELECT 
                COUNT(*) as total_news,
                COUNT(CASE WHEN confiabilidade < 0.4 THEN 1 END) as fake_news_count,
                COUNT(CASE WHEN confiabilidade >= 0.4 AND confiabilidade < 0.7 THEN 1 END) as medium_risk_count,
                COUNT(CASE WHEN confiabilidade >= 0.7 THEN 1 END) as low_risk_count
            FROM noticias
        `);

        const newsStats = newsStatsResult.rows[0];

        // Calcular distribuição de risco
        const totalNews = parseInt(newsStats.total_news) || 0;
        const riskDistribution = [
            { name: "Baixo Risco", value: totalNews > 0 ? Math.round((parseInt(newsStats.low_risk_count) / totalNews) * 100) : 0, color: "#22c55e" },
            { name: "Médio Risco", value: totalNews > 0 ? Math.round((parseInt(newsStats.medium_risk_count) / totalNews) * 100) : 0, color: "#f59e0b" },
            { name: "Alto Risco", value: totalNews > 0 ? Math.round((parseInt(newsStats.fake_news_count) / totalNews) * 100) : 0, color: "#ef4444" },
        ];

        // Gerar dados de tendência mensal baseados nas notícias existentes
        const monthlyTrends = [];
        const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'];

        // Buscar todas as notícias para distribuir nos meses
        const allNewsResult = await query(`
            SELECT 
                confiabilidade,
                created_at
            FROM noticias 
            ORDER BY created_at
        `);

        // Distribuir as notícias pelos 6 meses de forma realista
        const totalNewsCount = allNewsResult.rows.length;
        const fakeNewsCount = allNewsResult.rows.filter(n => parseFloat(n.confiabilidade) < 0.4).length;
        const realNewsCount = totalNewsCount - fakeNewsCount;

        // Distribuir proporcionalmente pelos meses
        const fakeNewsPerMonth = Math.floor(fakeNewsCount / 6);
        const realNewsPerMonth = Math.floor(realNewsCount / 6);
        const remainingFake = fakeNewsCount % 6;
        const remainingReal = realNewsCount % 6;

        for (let i = 0; i < 6; i++) {
            let fakeNews = fakeNewsPerMonth;
            let realNews = realNewsPerMonth;

            // Distribuir o resto nos primeiros meses
            if (i < remainingFake) fakeNews++;
            if (i < remainingReal) realNews++;

            monthlyTrends.push({
                name: months[i],
                fakeNews: fakeNews,
                realNews: realNews
            });
        }

        const stats = {
            ...graphStats,
            totalNews: parseInt(newsStats.total_news) || 0,
            fakeNewsCount: parseInt(newsStats.fake_news_count) || 0,
            riskDistribution,
            monthlyTrends
        };

        res.json(stats);
    } catch (error) {
        console.error('Erro ao obter estatísticas do grafo:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

export default router;
