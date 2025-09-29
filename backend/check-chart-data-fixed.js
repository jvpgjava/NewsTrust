// Script para verificar dados para gráficos
import pool from './config/database.js';

async function checkChartData() {
  try {
    console.log('🔍 Verificando dados para gráficos...');
    
    const client = await pool.connect();
    
    // Verificar análises por data para tendência
    const trendData = await client.query(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as count,
        COUNT(CASE WHEN is_fake_news = true THEN 1 END) as fake_count
      FROM analises_conteudo 
      WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
      GROUP BY DATE(created_at)
      ORDER BY date
    `);
    
    console.log('📈 Dados de tendência (últimos 7 dias):');
    trendData.rows.forEach(row => {
      console.log(`  ${row.date}: ${row.count} análises (${row.fake_count} fake news)`);
    });
    
    // Verificar distribuição de risco
    const riskDistribution = await client.query(`
      SELECT 
        risk_level,
        COUNT(*) as count
      FROM analises_conteudo 
      GROUP BY risk_level
      ORDER BY risk_level
    `);
    
    console.log('\n🎯 Distribuição de risco:');
    riskDistribution.rows.forEach(row => {
      console.log(`  ${row.risk_level}: ${row.count} análises`);
    });
    
    // Verificar análises por confiança (corrigido)
    const confidenceDistribution = await client.query(`
      SELECT 
        CASE 
          WHEN confidence >= 0.8 THEN 'Alta'
          WHEN confidence >= 0.6 THEN 'Média'
          WHEN confidence >= 0.4 THEN 'Baixa'
          ELSE 'Muito Baixa'
        END as faixa,
        COUNT(*) as count
      FROM analises_conteudo 
      GROUP BY 
        CASE 
          WHEN confidence >= 0.8 THEN 'Alta'
          WHEN confidence >= 0.6 THEN 'Média'
          WHEN confidence >= 0.4 THEN 'Baixa'
          ELSE 'Muito Baixa'
        END
      ORDER BY 
        CASE 
          WHEN confidence >= 0.8 THEN 1
          WHEN confidence >= 0.6 THEN 2
          WHEN confidence >= 0.4 THEN 3
          ELSE 4
        END
    `);
    
    console.log('\n📊 Distribuição por confiança:');
    confidenceDistribution.rows.forEach(row => {
      console.log(`  ${row.faixa}: ${row.count} análises`);
    });
    
    client.release();
    console.log('\n✅ Verificação concluída!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao verificar dados:', error);
    process.exit(1);
  }
}

checkChartData();
