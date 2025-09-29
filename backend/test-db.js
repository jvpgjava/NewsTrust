// Teste de conexão com banco de dados
import pool from './config/database.js';

async function testDB() {
  try {
    console.log('🔍 Testando conexão com banco de dados...');
    
    const client = await pool.connect();
    console.log('✅ Conectado ao banco!');
    
    // Testar tabelas
    const sources = await client.query('SELECT COUNT(*) FROM fontes');
    const news = await client.query('SELECT COUNT(*) FROM noticias');
    
    console.log('📊 Fontes:', sources.rows[0].count);
    console.log('📰 Notícias:', news.rows[0].count);
    
    // Mostrar algumas fontes
    const sampleSources = await client.query('SELECT * FROM fontes LIMIT 3');
    console.log('🔍 Amostra de fontes:', sampleSources.rows);
    
    // Mostrar algumas notícias
    const sampleNews = await client.query('SELECT * FROM noticias LIMIT 3');
    console.log('📰 Amostra de notícias:', sampleNews.rows);
    
    client.release();
    console.log('✅ Teste concluído!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

testDB();
