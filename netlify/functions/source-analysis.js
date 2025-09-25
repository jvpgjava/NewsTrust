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
    console.log('🔍 Analisando fonte...');
    
    // Parse do body da requisição
    const body = JSON.parse(event.body || '{}');
    const { name, url, description } = body;

    if (!name || !url) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Nome e URL são obrigatórios' 
        })
      };
    }

    // Simular análise de fonte
    const analysisResult = {
      id: Date.now(),
      name: name,
      url: url,
      description: description || '',
      trustScore: Math.floor(Math.random() * 40) + 60, // 60-100
      credibility: Math.floor(Math.random() * 30) + 70, // 70-100
      reliability: Math.floor(Math.random() * 25) + 75, // 75-100
      analysis: {
        domain: new URL(url).hostname,
        ssl: true,
        reputation: Math.random() > 0.3 ? 'good' : 'neutral',
        history: Math.floor(Math.random() * 5) + 1, // 1-5 anos
        socialMedia: Math.random() > 0.5,
        contactInfo: Math.random() > 0.4,
        aboutPage: Math.random() > 0.3,
        riskFactors: [
          {
            factor: 'domain_age',
            score: 0.2,
            description: 'Domínio relativamente novo'
          },
          {
            factor: 'ssl_certificate',
            score: 0.1,
            description: 'Certificado SSL válido'
          }
        ],
        recommendations: [
          'Verificar histórico da fonte',
          'Consultar outras fontes',
          'Analisar credibilidade'
        ]
      },
      createdAt: new Date().toISOString(),
      status: 'completed'
    };

    console.log('✅ Análise de fonte concluída:', analysisResult.trustScore);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(analysisResult)
    };

  } catch (error) {
    console.error('❌ Erro na análise de fonte:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Erro interno do servidor',
        message: error.message 
      })
    };
  }
};
