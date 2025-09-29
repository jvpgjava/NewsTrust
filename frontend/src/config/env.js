// Configuração de ambiente para desenvolvimento e produção
const isDevelopment = process.env.NODE_ENV === 'development' || window.location.hostname === 'localhost';

export const config = {
  API_URL: isDevelopment 
    ? 'http://localhost:3001' 
    : process.env.REACT_APP_API_URL || 'https://newstrust-backend.vercel.app',
  WS_URL: isDevelopment 
    ? 'ws://localhost:3001' 
    : process.env.REACT_APP_WS_URL || 'wss://newstrust-backend.vercel.app'
};

console.log('🔧 Configuração carregada:', config);
console.log('🌍 Ambiente:', isDevelopment ? 'desenvolvimento' : 'produção');
