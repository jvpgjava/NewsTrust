// Teste do backend
const testBackend = async () => {
  try {
    console.log('🔍 Testando backend...');
    
    // Testar health check
    const healthResponse = await fetch('https://api.newstrust.me/health');
    console.log('Health check status:', healthResponse.status);
    
    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log('Health check data:', healthData);
    }
    
    // Testar endpoint de notificações
    const notificationsResponse = await fetch('https://api.newstrust.me/api/notifications/check');
    console.log('Notifications status:', notificationsResponse.status);
    
    if (notificationsResponse.ok) {
      const notificationsData = await notificationsResponse.json();
      console.log('Notifications data:', notificationsData);
    } else {
      const errorText = await notificationsResponse.text();
      console.log('Error response:', errorText);
    }
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
};

// Executar teste
testBackend();
