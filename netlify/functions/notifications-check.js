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
    
    // Simular dados de teste
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
      newSources: []
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
