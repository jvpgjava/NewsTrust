// Script para inserir dados de exemplo no banco
import pool from './config/database.js';

async function insertTestData() {
  try {
    console.log('🔍 Inserindo dados de exemplo...');
    
    const client = await pool.connect();
    
    // Inserir algumas notícias de exemplo
    const testNews = [
      {
        texto: 'Brasil anuncia nova política econômica para 2025',
        link: 'https://exemplo.com/noticia1',
        confiabilidade: 0.85 // 85% confiável
      },
      {
        texto: 'Descoberta científica revoluciona tratamento de câncer',
        link: 'https://exemplo.com/noticia2', 
        confiabilidade: 0.92 // 92% confiável
      },
      {
        texto: 'Fake news sobre vacinação causa pânico na população',
        link: 'https://exemplo.com/noticia3',
        confiabilidade: 0.15 // 15% confiável (fake news)
      },
      {
        texto: 'Tecnologia de IA avança em diagnóstico médico',
        link: 'https://exemplo.com/noticia4',
        confiabilidade: 0.78 // 78% confiável
      },
      {
        texto: 'Conspiração sobre alienígenas é desmentida por especialistas',
        link: 'https://exemplo.com/noticia5',
        confiabilidade: 0.25 // 25% confiável (fake news)
      }
    ];
    
    for (const news of testNews) {
      await client.query(
        'INSERT INTO noticias(texto, link, confiabilidade) VALUES($1, $2, $3)',
        [news.texto, news.link, news.confiabilidade]
      );
      console.log(`✅ Notícia inserida: ${news.texto.substring(0, 50)}...`);
    }
    
    // Verificar quantas notícias temos agora
    const countResult = await client.query('SELECT COUNT(*) FROM noticias');
    console.log(`📊 Total de notícias no banco: ${countResult.rows[0].count}`);
    
    // Verificar fake news
    const fakeNewsResult = await client.query('SELECT COUNT(*) FROM noticias WHERE confiabilidade < 0.5');
    console.log(`📊 Total de fake news: ${fakeNewsResult.rows[0].count}`);
    
    client.release();
    console.log('✅ Dados de exemplo inseridos com sucesso!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao inserir dados:', error);
    process.exit(1);
  }
}

insertTestData();
