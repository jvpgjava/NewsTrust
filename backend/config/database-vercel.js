import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

// Configuração da pool de conexões para Vercel
let poolConfig;

if (process.env.DATABASE_URL) {
  // Usar DATABASE_URL (seu banco local ou externo)
  console.log('✅ Usando DATABASE_URL para conexão');
  poolConfig = {
    connectionString: process.env.DATABASE_URL,
    max: 10, // máximo de conexões na pool (Vercel tem limite)
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
    ssl: process.env.NODE_ENV === 'production' ? {
      rejectUnauthorized: false
    } : false,
  };
} else {
  // Usar variáveis individuais
  console.log('⚠️ DATABASE_URL não encontrada, usando variáveis individuais');
  poolConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'newstrust',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
    ssl: process.env.NODE_ENV === 'production' ? {
      rejectUnauthorized: false
    } : false,
  };
}

const pool = new Pool(poolConfig);

// Testar conexão
pool.on('connect', () => {
  console.log('✅ Conectado ao banco de dados PostgreSQL');
});

pool.on('error', (err) => {
  console.error('❌ Erro na pool de conexões:', err);
});

// Função para testar a conexão
export async function testConnection() {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    client.release();
    console.log('✅ Teste de conexão bem-sucedido:', result.rows[0]);
    return true;
  } catch (error) {
    console.error('❌ Erro no teste de conexão:', error);
    return false;
  }
}

// Função para inicializar o banco (criar tabelas se não existirem)
export async function initializeDatabase() {
  try {
    console.log('🔧 Inicializando banco de dados...');
    
    // Executar script SQL
    const client = await pool.connect();
    
    // Verificar se as tabelas existem
    const tablesCheck = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('fontes', 'noticias', 'conexoes')
    `);
    
    if (tablesCheck.rows.length === 0) {
      console.log('📊 Criando tabelas...');
      // Aqui você pode executar seu script SQL
      // await client.query('CREATE TABLE IF NOT EXISTS...');
    } else {
      console.log('✅ Tabelas já existem');
    }
    
    client.release();
    console.log('✅ Banco de dados inicializado com sucesso');
    return true;
  } catch (error) {
    console.error('❌ Erro ao inicializar banco:', error);
    return false;
  }
}

export default pool;
