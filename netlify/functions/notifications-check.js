exports.handler = async (event, context) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  try {
    console.log('🔍 Verificando atualizações...');
    
    // Retornar dados de exemplo para teste
    const realData = {
      hasUpdates: true, // Com atualizações para teste
      timestamp: new Date().toISOString(),
      newNews: [
        {
          id: 1,
          title: "Notícia de exemplo",
          source: "Fonte confiável",
          credibility: 85,
          riskLevel: "low"
        }
      ],
      newAnalyses: [
        {
          id: 1,
          title: "Análise de exemplo",
          credibility: 80,
          riskLevel: "medium",
          createdAt: new Date().toISOString()
        }
      ],
      newSources: [
        {
          id: 1,
          name: "Fonte exemplo",
          credibility: 90,
          trustScore: 85
        }
      ],
      // Dados do dashboard - com valores de exemplo
      dashboard: {
        sourcesCount: 15,
        connectionsCount: 42,
        newsCount: 128,
        fakeNewsCount: 8,
        trendData: [
          { month: '2025-01', count: 12 },
          { month: '2025-02', count: 18 },
          { month: '2025-03', count: 22 },
          { month: '2025-04', count: 25 },
          { month: '2025-05', count: 28 }
        ],
        riskDistribution: {
          low: 45,
          medium: 30,
          high: 25
        }
      },
      recentAnalyses: [
        {
          id: 1,
          title: "Análise recente 1",
          credibility: 85,
          riskLevel: "low",
          createdAt: new Date(Date.now() - 3600000).toISOString()
        },
        {
          id: 2,
          title: "Análise recente 2", 
          credibility: 60,
          riskLevel: "medium",
          createdAt: new Date(Date.now() - 7200000).toISOString()
        }
      ],
      // Dados da rede para NetworkVisualization
      network: {
        sources: {
          nodes: [
            { id: 1, name: "Fonte 1", credibility: 90, type: "source" },
            { id: 2, name: "Fonte 2", credibility: 75, type: "source" },
            { id: 3, name: "Fonte 3", credibility: 85, type: "source" }
          ],
          connections: [
            { source: 1, target: 2, strength: 0.8 },
            { source: 2, target: 3, strength: 0.6 }
          ]
        },
        news: {
          nodes: [
            { id: 1, title: "Notícia 1", credibility: 80, type: "news" },
            { id: 2, title: "Notícia 2", credibility: 70, type: "news" }
          ],
          connections: [
            { source: 1, target: 2, strength: 0.7 }
          ]
        }
      }
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(realData)
    };

  } catch (error) {
    console.error('❌ Erro ao verificar atualizações:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Erro interno do servidor',
        hasUpdates: false 
      })
    };
  }
};
