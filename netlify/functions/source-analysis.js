const { addSourceAnalysis } = require('./data-storage');

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
    const https = require('https');
    const http = require('http');
    
    const scamAdviserUrl = `https://api.scamadviser.com/v1/check?domain=${domain}`;
    
    const scamAdviserResponse = await new Promise((resolve, reject) => {
      const request = https.get(scamAdviserUrl, {
        headers: {
          'User-Agent': 'NewsTrust/1.0',
          'Accept': 'application/json'
        }
      }, (response) => {
        let data = '';
        response.on('data', (chunk) => {
          data += chunk;
        });
        response.on('end', () => {
          resolve({
            ok: response.statusCode >= 200 && response.statusCode < 300,
            status: response.statusCode,
            json: () => JSON.parse(data)
          });
        });
      });
      
      request.on('error', (error) => {
        reject(error);
      });
      
      request.setTimeout(10000, () => {
        request.destroy();
        reject(new Error('Request timeout'));
      });
    });

    if (!scamAdviserResponse.ok) {
      console.error('ScamAdviser API error:', scamAdviserResponse.status);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: 'Erro na API do ScamAdviser',
          details: `Status: ${scamAdviserResponse.status}`
        })
      };
    }

    const scamAdviserData = await scamAdviserResponse.json();

    // Processar dados do ScamAdviser
    const trustScore = scamAdviserData?.trust_score || 50;
    const credibility = Math.max(0, Math.min(100, trustScore));
    const reliability = Math.max(0, Math.min(100, trustScore + 10));

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

    // Salvar análise no armazenamento para atualizar dashboard e network
    addSourceAnalysis(analysisResult);

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
