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
    console.log('📧 Processando contato...');
    
    // Parse do body da requisição
    const body = JSON.parse(event.body || '{}');
    const { name, email, message } = body;

    if (!name || !email || !message) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Nome, email e mensagem são obrigatórios' 
        })
      };
    }

    // Simular processamento do contato
    const contactResult = {
      id: Date.now(),
      name: name,
      email: email,
      message: message,
      status: 'received',
      createdAt: new Date().toISOString(),
      response: 'Mensagem recebida com sucesso! Entraremos em contato em breve.'
    };

    console.log('✅ Contato processado:', contactResult.id);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(contactResult)
    };

  } catch (error) {
    console.error('❌ Erro no processamento do contato:', error);
    
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
