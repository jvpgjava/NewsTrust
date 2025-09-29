// Teste de CORS
const testCORS = async () => {
  try {
    console.log('🔍 Testando CORS...');
    
    // Testar rota de teste do banco
    const testResponse = await fetch('https://api.newstrust.me/api/test-db/test');
    console.log('Test DB status:', testResponse.status);
    
    if (testResponse.ok) {
      const testData = await testResponse.json();
      console.log('Test DB data:', testData);
    } else {
      const errorText = await testResponse.text();
      console.log('Test DB error:', errorText);
    }
    
  } catch (error) {
    console.error('❌ Erro no teste CORS:', error);
  }
};

// Executar teste
testCORS();
