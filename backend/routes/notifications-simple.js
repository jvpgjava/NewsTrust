import express from 'express';
import pool from '../config/database.js';

const router = express.Router();

// Endpoint para verificar atualizações (polling)
router.get('/check', async (req, res) => {
  try {
    console.log('🔍 Verificando atualizações...');
    
    const client = await pool.connect();
    
    try {
      // Contar fontes
      const sourcesResult = await client.query('SELECT COUNT(*) FROM fontes');
      const sourcesCount = parseInt(sourcesResult.rows[0].count);

      // Contar análises de conteúdo (notícias)
      const newsResult = await client.query('SELECT COUNT(*) FROM analises_conteudo');
      const newsCount = parseInt(newsResult.rows[0].count);

      // Contar fake news (is_fake_news = true)
      const fakeNewsResult = await client.query(
        'SELECT COUNT(*) FROM analises_conteudo WHERE is_fake_news = true'
      );
      const fakeNewsCount = parseInt(fakeNewsResult.rows[0].count);

      // Obter análises recentes (analises_conteudo)
      const recentAnalyses = await client.query(`
        SELECT 
          id,
          title,
          content as texto,
          confidence as credibility,
          created_at,
          risk_level,
          is_fake_news
        FROM analises_conteudo 
        ORDER BY created_at DESC 
        LIMIT 10
      `);

      // Obter fontes recentes
      const recentSources = await client.query(`
        SELECT 
          id,
          nome as name,
          site as url,
          peso as credibility,
          created_at
        FROM fontes 
        ORDER BY created_at DESC 
        LIMIT 10
      `);

      // Calcular distribuição de risco baseada nas análises reais
      const riskDistributionResult = await client.query(`
        SELECT 
          risk_level,
          COUNT(*) as count
        FROM analises_conteudo 
        GROUP BY risk_level
        ORDER BY risk_level
      `);

      const riskDistribution = {
        low: 0,
        medium: 0,
        high: 0
      };
      
      riskDistributionResult.rows.forEach(row => {
        if (row.risk_level === 'baixo' || row.risk_level === 'low' || row.risk_level === 'Low') {
          riskDistribution.low = parseInt(row.count);
        } else if (row.risk_level === 'médio' || row.risk_level === 'medium' || row.risk_level === 'Medium') {
          riskDistribution.medium = parseInt(row.count);
        } else if (row.risk_level === 'alto' || row.risk_level === 'high' || row.risk_level === 'High') {
          riskDistribution.high = parseInt(row.count);
        }
      });

      // Gerar dados de tendência baseados nas análises reais (apenas meses com dados)
      const trendDataResult = await client.query(`
        SELECT 
          TO_CHAR(created_at, 'YYYY-MM') as month,
          COUNT(*) as count,
          COUNT(CASE WHEN is_fake_news = true THEN 1 END) as fake_count
        FROM analises_conteudo 
        GROUP BY TO_CHAR(created_at, 'YYYY-MM')
        ORDER BY month
      `);

      // Usar apenas os meses que têm dados reais
      const trendData = trendDataResult.rows.map(row => ({
        month: row.month,
        count: parseInt(row.count),
        fake_count: parseInt(row.fake_count)
      }));

      // Função para calcular similaridade de credibilidade entre fontes
      const calculateCredibilitySimilarity = (sources) => {
        const connections = [];
        for (let i = 0; i < sources.length; i++) {
          for (let j = i + 1; j < sources.length; j++) {
            const source1 = sources[i];
            const source2 = sources[j];
            const cred1 = parseFloat(source1.credibility || source1.peso || 0.5);
            const cred2 = parseFloat(source2.credibility || source2.peso || 0.5);
            
            // Calcular diferença de credibilidade
            const diff = Math.abs(cred1 - cred2);
            
            // Se a diferença for menor que 0.3 (mais permissivo), criar conexão
            if (diff <= 0.3) {
              connections.push({
                source: source1.id,
                target: source2.id,
                similarity: Math.max(0.1, 1 - diff), // Similaridade mínima de 0.1
                type: 'credibility'
              });
            }
          }
        }
        return connections;
      };

      // Função para calcular similaridade de conteúdo entre notícias
      const calculateContentSimilarity = (analyses) => {
        const connections = [];
        for (let i = 0; i < analyses.length; i++) {
          for (let j = i + 1; j < analyses.length; j++) {
            const analysis1 = analyses[i];
            const analysis2 = analyses[j];
            
            // Calcular similaridade baseada em palavras-chave comuns
            const title1 = (analysis1.title || '').toLowerCase();
            const title2 = (analysis2.title || '').toLowerCase();
            const content1 = (analysis1.texto || analysis1.content || '').toLowerCase();
            const content2 = (analysis2.texto || analysis2.content || '').toLowerCase();
            
            // Extrair palavras-chave (remover palavras comuns)
            const commonWords = ['de', 'da', 'do', 'das', 'dos', 'em', 'na', 'no', 'nas', 'nos', 'com', 'para', 'por', 'que', 'se', 'a', 'o', 'e', 'é', 'um', 'uma'];
            const words1 = title1.split(/\s+/).filter(word => word.length > 2 && !commonWords.includes(word));
            const words2 = title2.split(/\s+/).filter(word => word.length > 2 && !commonWords.includes(word));
            
            // Calcular interseção de palavras
            const intersection = words1.filter(word => words2.includes(word));
            const union = [...new Set([...words1, ...words2])];
            
            if (union.length > 0) {
              const similarity = intersection.length / union.length;
              
              // Se similaridade for maior que 0.2 (mais permissivo), criar conexão
              if (similarity > 0.2) {
                connections.push({
                  source: analysis1.id,
                  target: analysis2.id,
                  similarity: Math.max(0.1, similarity), // Similaridade mínima de 0.1
                  type: 'content'
                });
              }
            }
          }
        }
        return connections;
      };

      // Calcular conexões reais baseadas nas similaridades
      const sourcesConnections = calculateCredibilitySimilarity(recentSources.rows || []);
      const newsConnections = calculateContentSimilarity(recentAnalyses.rows || []);
      const totalConnections = sourcesConnections.length + newsConnections.length;
      
      console.log('🔗 Conexões calculadas:', {
        sourcesConnections: sourcesConnections.length,
        newsConnections: newsConnections.length,
        totalConnections: totalConnections
      });
      
      console.log('🔍 Primeiras conexões de fontes:', sourcesConnections.slice(0, 3));
      console.log('🔍 Fontes disponíveis:', (recentSources.rows || []).slice(0, 3).map(s => ({ id: s.id, name: s.name || s.nome })));

      const dashboardData = {
        sourcesCount,
        newsCount,
        fakeNewsCount,
        connectionsCount: totalConnections,
        recentAnalyses: recentAnalyses.rows,
        recentSources: recentSources.rows,
        trendData: trendData,
        riskDistribution: riskDistribution
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
            nodes: (dashboardData.recentSources || []).map(source => ({
              id: source.id,
              name: source.name || source.nome,
              url: source.url || source.site,
              credibility: source.credibility || source.peso,
              type: 'source'
            })),
            connections: sourcesConnections
          },
          news: {
            nodes: (dashboardData.recentAnalyses || []).map(analysis => ({
              id: analysis.id,
              name: analysis.title || 'Notícia sem título',
              title: analysis.title || 'Notícia sem título',
              content: analysis.texto || analysis.content,
              credibility: analysis.credibility,
              isFakeNews: analysis.is_fake_news,
              riskLevel: analysis.risk_level,
              type: 'news'
            })),
            connections: newsConnections
          }
        }
      };

      console.log('📊 Dados enviados para frontend:', {
        sourcesCount: responseData.dashboard.sourcesCount,
        newsCount: responseData.dashboard.newsCount,
        recentSources: responseData.newSources.length,
        recentAnalyses: responseData.newAnalyses.length
      });

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

export default router;
