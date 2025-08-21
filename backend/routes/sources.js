import express from 'express';
import { query } from '../config/database.js';

const router = express.Router();

/**
 * @swagger
 * /api/sources/top:
 *   get:
 *     summary: Lista as fontes mais confiáveis
 *     description: Retorna ranking das fontes com maior credibilidade
 *     tags: [Fontes]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Número de fontes a retornar
 *     responses:
 *       200:
 *         description: Ranking de fontes retornado com sucesso
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/top', async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    console.log('🔍 Executando rota /top...');

    const result = await query(
      `SELECT f.*, 
              COALESCE(AVG(c.peso), 0) as avg_connection_weight,
              COUNT(c.id) as connection_count
       FROM fontes f
       LEFT JOIN conexoes c ON f.id = c.fonte_destino
       GROUP BY f.id
       ORDER BY f.peso DESC, avg_connection_weight DESC
       LIMIT $1`,
      [parseInt(limit)]
    );

    const ranking = result.rows.map(row => ({
      id: row.id,
      nome: row.nome,
      site: row.site,
      peso: parseFloat(row.peso),
      trust_score: parseFloat(row.peso),
      connection_count: parseInt(row.connection_count),
      avg_connection_weight: parseFloat(row.avg_connection_weight)
    }));

    console.log(`✅ Ranking retornado: ${ranking.length} fontes`);
    res.json({ ranking });
  } catch (error) {
    console.error('Erro ao obter ranking:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * @swagger
 * /api/sources/{id}:
 *   get:
 *     summary: Busca uma fonte específica
 *     description: Retorna os detalhes de uma fonte pelo ID
 *     tags: [Fontes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da fonte
 *     responses:
 *       200:
 *         description: Fonte encontrada com sucesso
 *       404:
 *         description: Fonte não encontrada
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      'SELECT * FROM fontes WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Fonte não encontrada' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao buscar fonte:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

export default router;
