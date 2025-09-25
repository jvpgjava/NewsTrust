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
    console.log('🔍 Analisando conteúdo...');
    
    // Parse do body da requisição
    const body = JSON.parse(event.body || '{}');
    const { title, content } = body;

    if (!title || !content) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Título e conteúdo são obrigatórios' 
        })
      };
    }

    // Simular análise de conteúdo
    const analysisResult = {
      id: Date.now(),
      title: title,
      content: content,
      trustScore: Math.floor(Math.random() * 40) + 60, // 60-100
      credibility: Math.floor(Math.random() * 30) + 70, // 70-100
      reliability: Math.floor(Math.random() * 25) + 75, // 75-100
      analysis: {
        sentiment: Math.random() > 0.5 ? 'positive' : 'negative',
        language: 'pt-BR',
        keywords: ['governo', 'Brasil', 'Argentina', 'destruído'],
        entities: [
          { name: 'Brasil', type: 'LOCATION', confidence: 0.95 },
          { name: 'Argentina', type: 'LOCATION', confidence: 0.90 },
          { name: 'governo', type: 'ORGANIZATION', confidence: 0.85 }
        ],
        riskFactors: [
          {
            factor: 'linguagem_sensacionalista',
            score: 0.8,
            description: 'Uso de linguagem exagerada e alarmista'
          },
          {
            factor: 'falta_fontes',
            score: 0.9,
            description: 'Ausência de fontes confiáveis'
          }
        ],
        recommendations: [
          'Verificar fontes oficiais',
          'Consultar múltiplas fontes',
          'Analisar contexto histórico'
        ]
      },
      createdAt: new Date().toISOString(),
      status: 'completed'
    };

    console.log('✅ Análise concluída:', analysisResult.trustScore);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(analysisResult)
    };

  } catch (error) {
    console.error('❌ Erro na análise de conteúdo:', error);
    
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
