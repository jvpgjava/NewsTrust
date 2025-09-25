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
    
    // Retornar dados reais ou vazios
    const realData = {
      hasUpdates: false, // Sem atualizações por enquanto
      timestamp: new Date().toISOString(),
      newNews: [],
      newAnalyses: [],
      newSources: [],
      // Dados do dashboard - inicialmente vazios
      dashboard: {
        sourcesCount: 0,
        connectionsCount: 0,
        newsCount: 0,
        fakeNewsCount: 0,
        trendData: [],
        riskDistribution: {
          low: 0,
          medium: 0,
          high: 0
        }
      },
      recentAnalyses: []
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
