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
    const { url } = body;

    if (!url) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'URL é obrigatória' 
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

    // Chamar API do ScamAdviser (sem API key necessária)
    let scamAdviserData = null;
    try {
      const scamAdviserResponse = await fetch(`https://api.scamadviser.com/v1/check?domain=${domain}`, {
        method: 'GET',
        headers: {
          'User-Agent': 'NewsTrust/1.0',
          'Accept': 'application/json'
        }
      });

      if (scamAdviserResponse.ok) {
        scamAdviserData = await scamAdviserResponse.json();
      } else {
        console.log('⚠️ ScamAdviser API não disponível, usando análise básica');
      }
    } catch (scamAdviserError) {
      console.log('⚠️ Erro na API do ScamAdviser:', scamAdviserError.message);
      // Continuar com análise básica
    }

    // Processar dados do ScamAdviser ou usar análise básica
    let trustScore, credibility, reliability;
    
    if (scamAdviserData) {
      trustScore = scamAdviserData.trust_score || 50;
      credibility = Math.max(0, Math.min(100, trustScore));
      reliability = Math.max(0, Math.min(100, trustScore + 10));
    } else {
      // Análise básica baseada no domínio
      const isKnownDomain = domain.includes('gov.br') || domain.includes('edu.br') || 
                           domain.includes('g1.com.br') || domain.includes('uol.com.br') ||
                           domain.includes('folha.com.br') || domain.includes('estadao.com.br');
      
      trustScore = isKnownDomain ? 75 : 50;
      credibility = trustScore;
      reliability = trustScore + 5;
    }

    const analysisResult = {
      id: Date.now(),
      name: domain, // Usar o domínio como nome
      url: url,
      description: '',
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
