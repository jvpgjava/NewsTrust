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
    console.log('🔍 Analisando fonte com ScamAdviser...');
    
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

    // Extrair domínio da URL
    let domain;
    try {
      domain = new URL(url).hostname;
    } catch (urlError) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'URL inválida' 
        })
      };
    }

    // Chamar API do ScamAdviser
    const scamAdviserResponse = await fetch(`https://api.scamadviser.com/v1/check?domain=${domain}`, {
      method: 'GET',
      headers: {
        'User-Agent': 'NewsTrust/1.0'
      }
    });

    let scamAdviserData = null;
    if (scamAdviserResponse.ok) {
      scamAdviserData = await scamAdviserResponse.json();
    }

    // Processar dados do ScamAdviser
    const trustScore = scamAdviserData?.trust_score || 50;
    const credibility = Math.max(0, Math.min(100, trustScore));
    const reliability = Math.max(0, Math.min(100, trustScore + 10));

    const analysisResult = {
      id: Date.now(),
      name: name,
      url: url,
      description: description || '',
      trustScore: credibility,
      credibility: credibility,
      reliability: reliability,
      analysis: {
        domain: domain,
        ssl: scamAdviserData?.ssl || false,
        reputation: scamAdviserData?.reputation || 'unknown',
        history: scamAdviserData?.domain_age_days || 0,
        socialMedia: scamAdviserData?.social_media_count || 0,
        contactInfo: scamAdviserData?.contact_info || false,
        aboutPage: scamAdviserData?.about_page || false,
        riskFactors: [
          {
            factor: 'domain_age',
            score: scamAdviserData?.domain_age_days < 365 ? 0.8 : 0.2,
            description: scamAdviserData?.domain_age_days < 365 ? 'Domínio muito novo' : 'Domínio estabelecido'
          },
          {
            factor: 'ssl_certificate',
            score: scamAdviserData?.ssl ? 0.1 : 0.9,
            description: scamAdviserData?.ssl ? 'Certificado SSL válido' : 'Sem certificado SSL'
          },
          {
            factor: 'reputation',
            score: scamAdviserData?.reputation === 'good' ? 0.1 : 0.7,
            description: `Reputação: ${scamAdviserData?.reputation || 'desconhecida'}`
          }
        ],
        recommendations: [
          'Verificar histórico da fonte',
          'Consultar outras fontes',
          'Analisar credibilidade'
        ],
        scamAdviserData: scamAdviserData
      },
      createdAt: new Date().toISOString(),
      status: 'completed'
    };

    console.log('✅ Análise de fonte concluída com ScamAdviser:', analysisResult.trustScore);

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
