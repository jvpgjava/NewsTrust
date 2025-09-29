// Script para verificar dados na tabela analises_conteudo
import pool from './config/database.js';

async function checkAnalisesConteudo() {
  try {
    console.log('🔍 Verificando tabela analises_conteudo...');
    
    const client = await pool.connect();
    
    // Verificar estrutura da tabela analises_conteudo
    const structure = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'analises_conteudo' 
      ORDER BY ordinal_position
    `);
    
    console.log('📊 Estrutura da tabela analises_conteudo:');
    structure.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type} (${row.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
    });
    
    // Verificar contagem
    const count = await client.query('SELECT COUNT(*) FROM analises_conteudo');
    console.log(`\n📊 Total de análises: ${count.rows[0].count}`);
    
    // Verificar dados de exemplo
    if (parseInt(count.rows[0].count) > 0) {
      const sample = await client.query('SELECT * FROM analises_conteudo LIMIT 3');
      console.log('\n📰 Amostra de análises:');
      sample.rows.forEach((analysis, index) => {
        console.log(`  ${index + 1}. ID: ${analysis.id}, Título: ${analysis.title?.substring(0, 50)}..., Confiança: ${analysis.confidence}, Fake News: ${analysis.is_fake_news}`);
      });
    }
    
    client.release();
    console.log('\n✅ Verificação concluída!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao verificar análises:', error);
    process.exit(1);
  }
}

checkAnalisesConteudo();
