// Teste de conexão com Supabase
import pkg from 'pg';
const { Pool } = pkg;

const testConnection = async () => {
  try {
    console.log('🔍 Testando conexão com Supabase...');
    
    // Usar a mesma configuração do backend
    const poolConfig = {
      connectionString: 'postgresql://postgres:Newstrust2024!@wbbxqslgutfxldmyuekb.supabase.co:5432/postgres',
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
      ssl: {
        rejectUnauthorized: false,
        require: true
      }
    };
    
    const pool = new Pool(poolConfig);
    
    // Testar conexão
    const client = await pool.connect();
    console.log('✅ Conectado ao Supabase!');
    
    // Testar query simples
    const result = await client.query('SELECT NOW() as current_time');
    console.log('✅ Query funcionando:', result.rows[0]);
    
    // Testar se as tabelas existem
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('fontes', 'analises_conteudo', 'conexoes_confianca', 'noticias')
      ORDER BY table_name
    `);
    
    console.log('📊 Tabelas encontradas:', tablesResult.rows.map(row => row.table_name));
    
    // Testar contagem de registros
    for (const table of tablesResult.rows) {
      const countResult = await client.query(`SELECT COUNT(*) FROM ${table.table_name}`);
      console.log(`📊 ${table.table_name}: ${countResult.rows[0].count} registros`);
    }
    
    client.release();
    await pool.end();
    
    console.log('✅ Teste concluído com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro na conexão:', error);
  }
};

testConnection();
