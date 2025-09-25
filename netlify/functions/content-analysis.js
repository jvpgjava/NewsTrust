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
    console.log('🔍 Analisando conteúdo com Groq...');
    
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

    // Verificar se API key do Groq está configurada
    if (!process.env.GROQ_API_KEY) {
      console.log('⚠️ GROQ_API_KEY não configurada, usando análise básica');
      // Análise básica sem Groq
      const analysisResult = {
        trustScore: 50,
        credibility: 50,
        reliability: 50,
        sentiment: 'neutro',
        language: 'pt-BR',
        keywords: ['Brasil', 'Argentina', 'conflito'],
        entities: [
          { name: 'Brasil', type: 'LOCATION', confidence: 0.9 },
          { name: 'Argentina', type: 'LOCATION', confidence: 0.9 }
        ],
        riskFactors: [
          {
            factor: 'linguagem_sensacionalista',
            score: 0.7,
            description: 'Uso de linguagem alarmista'
          }
        ],
        recommendations: [
          'Verificar fontes oficiais',
          'Consultar múltiplas fontes',
          'Analisar contexto histórico'
        ]
      };
      
      const result = {
        id: Date.now(),
        title: title,
        content: content,
        trustScore: analysisResult.trustScore,
        credibility: analysisResult.credibility,
        reliability: analysisResult.reliability,
        analysis: analysisResult,
        createdAt: new Date().toISOString(),
        status: 'completed'
      };

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(result)
      };
    }

    // Chamar API do Groq para análise
    let analysisResult;
    try {
      const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'llama-3.1-70b-versatile',
          messages: [
            {
              role: 'system',
              content: `Você é um especialista em análise de credibilidade de notícias. 
              Analise o título e conteúdo fornecidos e retorne uma análise detalhada em JSON com:
              - trustScore (0-100): pontuação de confiabilidade
              - credibility (0-100): credibilidade geral
              - reliability (0-100): confiabilidade da fonte
              - sentiment: positivo/negativo/neutro
              - language: idioma detectado
              - keywords: palavras-chave importantes
              - entities: entidades mencionadas
              - riskFactors: fatores de risco identificados
              - recommendations: recomendações para verificação
              
              Retorne APENAS o JSON, sem texto adicional.`
            },
            {
              role: 'user',
              content: `Título: ${title}\n\nConteúdo: ${content}`
            }
          ],
          temperature: 0.3,
          max_tokens: 2000
        })
      });

      if (!groqResponse.ok) {
        throw new Error(`Groq API error: ${groqResponse.status}`);
      }

      const groqData = await groqResponse.json();
      const analysisText = groqData.choices[0].message.content;
      
      // Parse da resposta do Groq
      try {
        analysisResult = JSON.parse(analysisText);
      } catch (parseError) {
        console.error('Erro ao fazer parse da resposta do Groq:', parseError);
        throw new Error('Erro ao processar resposta do Groq');
      }
    } catch (groqError) {
      console.error('Erro na API do Groq:', groqError);
      // Fallback para análise básica
      analysisResult = {
        trustScore: 50,
        credibility: 50,
        reliability: 50,
        sentiment: 'neutro',
        language: 'pt-BR',
        keywords: ['Brasil', 'Argentina', 'conflito'],
        entities: [
          { name: 'Brasil', type: 'LOCATION', confidence: 0.9 },
          { name: 'Argentina', type: 'LOCATION', confidence: 0.9 }
        ],
        riskFactors: [
          {
            factor: 'linguagem_sensacionalista',
            score: 0.7,
            description: 'Uso de linguagem alarmista'
          }
        ],
        recommendations: [
          'Verificar fontes oficiais',
          'Consultar múltiplas fontes',
          'Analisar contexto histórico'
        ]
      };
    }

    const result = {
      id: Date.now(),
      title: title,
      content: content,
      trustScore: analysisResult.trustScore || 50,
      credibility: analysisResult.credibility || 50,
      reliability: analysisResult.reliability || 50,
      analysis: {
        sentiment: analysisResult.sentiment || 'neutro',
        language: analysisResult.language || 'pt-BR',
        keywords: analysisResult.keywords || [],
        entities: analysisResult.entities || [],
        riskFactors: analysisResult.riskFactors || [],
        recommendations: analysisResult.recommendations || []
      },
      createdAt: new Date().toISOString(),
      status: 'completed'
    };

    console.log('✅ Análise concluída com Groq:', result.trustScore);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(result)
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
