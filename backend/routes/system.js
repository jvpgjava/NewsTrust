import express from 'express';
import { query } from '../config/database.js';
import RealTimeUpdateService from '../services/RealTimeUpdateService.js';
import realTimeService from '../services/RealTimeService.js';

const router = express.Router();



/**
 * @swagger
 * /api/system/force-update:
 *   post:
 *     summary: Força uma atualização imediata do sistema
 *     description: Executa uma atualização manual de todas as métricas e conexões do sistema
 *     tags: [System]
 *     responses:
 *       200:
 *         description: Atualização forçada executada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Atualização forçada executada com sucesso"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       500:
 *         description: Erro ao executar atualização
 */
router.post('/force-update', async (req, res) => {
  try {
    console.log('⚡ Forçando atualização manual do sistema...');

    await RealTimeUpdateService.forceUpdate();

    res.json({
      message: 'Atualização forçada executada com sucesso',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Erro ao forçar atualização:', error);
    res.status(500).json({
      error: 'Erro ao executar atualização forçada',
      details: error.message
    });
  }
});

/**
 * @swagger
 * /api/system/health:
 *   get:
 *     summary: Verifica a saúde do sistema
 *     description: Endpoint simples para verificar se o sistema está funcionando
 *     tags: [System]
 *     responses:
 *       200:
 *         description: Sistema saudável
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "healthy"
 *                 uptime:
 *                   type: number
 *                   example: 3600
 */
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

/**
 * @swagger
 * /api/system/dashboard:
 *   get:
 *     summary: Obtém dados do dashboard
 *     description: Retorna estatísticas e dados para o dashboard em tempo real
 *     tags: [System]
 *     responses:
 *       200:
 *         description: Dados do dashboard retornados com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 sourcesCount:
 *                   type: integer
 *                 connectionsCount:
 *                   type: integer
 *                 newsCount:
 *                   type: integer
 *                 fakeNewsCount:
 *                   type: integer
 *                 trendData:
 *                   type: array
 *                 riskDistribution:
 *                   type: object
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/dashboard', async (req, res) => {
  try {
    console.log('📊 Buscando dados do dashboard...');
    
    const dashboardData = await realTimeService.getDashboardData();
    
    res.json(dashboardData);
  } catch (error) {
    console.error('❌ Erro ao buscar dados do dashboard:', error);
    res.status(500).json({
      error: 'Erro ao buscar dados do dashboard',
      details: error.message
    });
  }
});

export default router;
