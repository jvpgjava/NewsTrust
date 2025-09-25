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
    
    // Simular dados de teste com estrutura correta
    const testData = {
      hasUpdates: true,
      timestamp: new Date().toISOString(),
      newNews: [
        {
          id: 1,
          title: 'Notícia de teste',
          url: 'https://example.com',
          createdAt: new Date().toISOString()
        }
      ],
      newAnalyses: [],
      newSources: [],
      // Dados do dashboard que o frontend espera
      dashboard: {
        sourcesCount: 25,
        connectionsCount: 150,
        newsCount: 1200,
        fakeNewsCount: 45,
        trendData: [
          { date: '2025-01-20', value: 85 },
          { date: '2025-01-21', value: 87 },
          { date: '2025-01-22', value: 89 },
          { date: '2025-01-23', value: 91 },
          { date: '2025-01-24', value: 88 }
        ],
        riskDistribution: {
          low: 60,
          medium: 30,
          high: 10
        }
      },
      recentAnalyses: [
        {
          id: 1,
          title: 'Análise de teste',
          trustScore: 85,
          createdAt: new Date().toISOString()
        }
      ]
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(testData)
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
