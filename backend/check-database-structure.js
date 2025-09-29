// Script para verificar a estrutura real do banco
import pool from './config/database.js';

async function checkDatabaseStructure() {
  try {
    console.log('🔍 Verificando estrutura do banco de dados...');
    
    const client = await pool.connect();
    
    // Verificar tabelas existentes
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log('📊 Tabelas encontradas:');
    tablesResult.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });
    
    // Verificar estrutura da tabela noticias
    const noticiasStructure = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'noticias' 
      ORDER BY ordinal_position
    `);
    
    console.log('\n📰 Estrutura da tabela noticias:');
    noticiasStructure.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type} (${row.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
    });
    
    // Verificar estrutura da tabela fontes
    const fontesStructure = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'fontes' 
      ORDER BY ordinal_position
    `);
    
    console.log('\n🔗 Estrutura da tabela fontes:');
    fontesStructure.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type} (${row.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
    });
    
    // Verificar dados nas tabelas
    const noticiasCount = await client.query('SELECT COUNT(*) FROM noticias');
    const fontesCount = await client.query('SELECT COUNT(*) FROM fontes');
    
    console.log('\n📊 Contadores:');
    console.log(`  - Notícias: ${noticiasCount.rows[0].count}`);
    console.log(`  - Fontes: ${fontesCount.rows[0].count}`);
    
    // Verificar algumas notícias de exemplo
    if (parseInt(noticiasCount.rows[0].count) > 0) {
      const sampleNews = await client.query('SELECT * FROM noticias LIMIT 3');
      console.log('\n📰 Amostra de notícias:');
      sampleNews.rows.forEach((news, index) => {
        console.log(`  ${index + 1}. ID: ${news.id}, Texto: ${news.texto?.substring(0, 50)}..., Confiabilidade: ${news.confiabilidade}`);
      });
    }
    
    // Verificar algumas fontes de exemplo
    if (parseInt(fontesCount.rows[0].count) > 0) {
      const sampleSources = await client.query('SELECT * FROM fontes LIMIT 3');
      console.log('\n🔗 Amostra de fontes:');
      sampleSources.rows.forEach((source, index) => {
        console.log(`  ${index + 1}. ID: ${source.id}, Nome: ${source.nome}, Site: ${source.site}, Peso: ${source.peso}`);
      });
    }
    
    client.release();
    console.log('\n✅ Verificação concluída!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao verificar banco:', error);
    process.exit(1);
  }
}

checkDatabaseStructure();
