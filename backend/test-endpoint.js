// Teste direto do endpoint de polling
import express from 'express';
import cors from 'cors';
import pool from './config/database.js';

const app = express();
app.use(cors());
app.use(express.json());

// Endpoint de teste
app.get('/api/notifications/check', async (req, res) => {
  try {
    console.log('🔍 Testando endpoint de polling...');
    
    const client = await pool.connect();
    
    try {
      // Contar fontes
      const sourcesResult = await client.query('SELECT COUNT(*) FROM fontes');
      const sourcesCount = parseInt(sourcesResult.rows[0].count);

      // Contar notícias
      const newsResult = await client.query('SELECT COUNT(*) FROM noticias');
      const newsCount = parseInt(newsResult.rows[0].count);

      // Contar fake news (confiabilidade baixa)
      const fakeNewsResult = await client.query(
        'SELECT COUNT(*) FROM noticias WHERE confiabilidade < 0.5'
      );
      const fakeNewsCount = parseInt(fakeNewsResult.rows[0].count);

      // Obter análises recentes
      const recentAnalyses = await client.query(
        'SELECT * FROM noticias ORDER BY created_at DESC LIMIT 10'
      );

      // Obter fontes recentes
      const recentSources = await client.query(
        'SELECT * FROM fontes ORDER BY created_at DESC LIMIT 10'
      );

      console.log('📊 Dados encontrados:');
      console.log('- Fontes:', sourcesCount);
      console.log('- Notícias:', newsCount);
      console.log('- Fake News:', fakeNewsCount);
      console.log('- Fontes recentes:', recentSources.rows.length);
      console.log('- Análises recentes:', recentAnalyses.rows.length);

      const dashboardData = {
        sourcesCount,
        newsCount,
        fakeNewsCount,
        connectionsCount: Math.floor(sourcesCount * 2.8),
        recentAnalyses: recentAnalyses.rows,
        recentSources: recentSources.rows,
        trendData: [],
        riskDistribution: {
          low: 0,
          medium: 0,
          high: 0
        }
      };

      const responseData = {
        hasUpdates: true,
        timestamp: new Date().toISOString(),
        newNews: [],
        newAnalyses: dashboardData.recentAnalyses || [],
        newSources: dashboardData.recentSources || [],
        dashboard: {
          sourcesCount: dashboardData.sourcesCount,
          connectionsCount: dashboardData.connectionsCount,
          newsCount: dashboardData.newsCount,
          fakeNewsCount: dashboardData.fakeNewsCount,
          trendData: dashboardData.trendData,
          riskDistribution: dashboardData.riskDistribution
        },
        recentAnalyses: dashboardData.recentAnalyses || [],
        network: {
          sources: {
            nodes: dashboardData.recentSources || [],
            connections: []
          },
          news: {
            nodes: dashboardData.recentAnalyses || [],
            connections: []
          }
        }
      };

      console.log('✅ Resposta enviada:', JSON.stringify(responseData, null, 2));
      res.json(responseData);
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('❌ Erro ao verificar atualizações:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      hasUpdates: false 
    });
  }
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`🚀 Servidor de teste rodando na porta ${PORT}`);
  console.log(`🔗 Teste: http://localhost:${PORT}/api/notifications/check`);
});
