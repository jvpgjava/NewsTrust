const { getDashboardData, getNetworkData } = require('./supabase-client');

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
    
    // Obter dados do Supabase
    const dashboardData = await getDashboardData();
    const networkData = await getNetworkData();

    const realData = {
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
      network: networkData
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
