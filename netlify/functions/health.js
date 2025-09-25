export const handler = async (event, context) => {
  console.log('🔍 Health check chamado');
  
  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ 
      status: 'OK', 
      timestamp: new Date().toISOString(),
      message: 'NewsTrust API funcionando!'
    }),
  };
};
