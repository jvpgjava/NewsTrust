import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

// 🔍 DEBUG: Verificar variáveis de ambiente
console.log('🔍 DEBUG - Variáveis de ambiente:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('DATABASE_URL existe:', !!process.env.DATABASE_URL);
console.log('DATABASE_URL (primeiros 50 chars):', process.env.DATABASE_URL ? process.env.DATABASE_URL.substring(0, 50) + '...' : 'undefined');

// Configuração da pool de conexões para SUPABASE
let poolConfig;

if (process.env.DATABASE_URL) {
  // Usar DATABASE_URL do Supabase
  console.log('✅ Usando DATABASE_URL do Supabase para conexão');
  poolConfig = {
    connectionString: process.env.DATABASE_URL,
    max: 10, // máximo de conexões na pool (Vercel tem limite)
    idleTimeoutMillis: 30000, // tempo limite de inatividade
    connectionTimeoutMillis: 10000, // tempo limite de conexão
    // SSL obrigatório para Supabase em produção
    ssl: {
      rejectUnauthorized: false,
      require: true
    },
    // Configurações específicas do Supabase
    application_name: 'newstrust-backend',
    statement_timeout: 30000, // 30 segundos
    query_timeout: 30000, // 30 segundos
  };
  console.log('🔧 Configuração da pool para Supabase:', {
    max: poolConfig.max,
    idleTimeoutMillis: poolConfig.idleTimeoutMillis,
    connectionTimeoutMillis: poolConfig.connectionTimeoutMillis,
    ssl: poolConfig.ssl,
    application_name: poolConfig.application_name
  });
} else {
  // Fallback para variáveis individuais (desenvolvimento)
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
      rejectUnauthorized: false,
      require: true
    } : false,
  };
}

const pool = new Pool(poolConfig);

// Testar conexão
pool.on('connect', () => {
  console.log('🔗 Conectado ao Supabase PostgreSQL');
});

pool.on('error', (err) => {
  console.error('❌ Erro na pool do Supabase:', err);
});

// Função para testar a conexão
export async function testConnection() {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW() as current_time, version() as postgres_version');
    client.release();
    console.log('✅ Teste de conexão com Supabase bem-sucedido:', result.rows[0]);
    return true;
  } catch (error) {
    console.error('❌ Erro no teste de conexão com Supabase:', error);
    return false;
  }
}

// Função para inicializar o banco de dados
export async function initializeDatabase() {
  try {
    console.log('🔧 Inicializando banco de dados Supabase...');
    
    const client = await pool.connect();

    // Verificar se as tabelas existem
    const tablesCheck = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('fontes', 'noticias', 'conexoes', 'analises_conteudo', 'conexoes_confianca')
    `);
    
    console.log('📊 Tabelas encontradas:', tablesCheck.rows.map(row => row.table_name));

    // Criar tabela de fontes se não existir
    await client.query(`
      CREATE TABLE IF NOT EXISTS fontes (
        id SERIAL PRIMARY KEY,
        nome VARCHAR(255) NOT NULL UNIQUE,
        site VARCHAR(500) NOT NULL UNIQUE,
        peso DECIMAL(3,2) DEFAULT 0.5 CHECK (peso >= 0 AND peso <= 1),
        tipo VARCHAR(50) DEFAULT 'general',
        descricao TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Criar tabela de notícias se não existir
    await client.query(`
      CREATE TABLE IF NOT EXISTS noticias (
        id SERIAL PRIMARY KEY,
        texto TEXT NOT NULL,
        link VARCHAR(1000),
        id_fonte INTEGER REFERENCES fontes(id) ON DELETE CASCADE,
        confiabilidade DECIMAL(3,2) DEFAULT 0.5 CHECK (confiabilidade >= 0 AND confiabilidade <= 1),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Criar tabela de conexões se não existir
    await client.query(`
      CREATE TABLE IF NOT EXISTS conexoes (
        id SERIAL PRIMARY KEY,
        fonte_origem INTEGER REFERENCES fontes(id) ON DELETE CASCADE,
        fonte_destino INTEGER REFERENCES fontes(id) ON DELETE CASCADE,
        peso DECIMAL(3,2) DEFAULT 0.5 CHECK (peso >= 0 AND peso <= 1),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(fonte_origem, fonte_destino)
      )
    `);

    // Criar tabela de análises de conteúdo se não existir
    await client.query(`
      CREATE TABLE IF NOT EXISTS analises_conteudo (
        id SERIAL PRIMARY KEY,
        title VARCHAR(500) NOT NULL,
        content TEXT NOT NULL,
        is_fake_news BOOLEAN NOT NULL,
        confidence DECIMAL(3,2) NOT NULL,
        risk_level VARCHAR(20) NOT NULL,
        reasons TEXT[],
        recommendations TEXT[],
        detailed_analysis TEXT,
        score DECIMAL(3,2),
        web_results JSONB,
        ai_analysis JSONB,
        search_coverage TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Criar tabela de conexões de confiança se não existir
    await client.query(`
      CREATE TABLE IF NOT EXISTS conexoes_confianca (
        id SERIAL PRIMARY KEY,
        fonte_origem_id INTEGER REFERENCES fontes(id) ON DELETE CASCADE,
        fonte_destino_id INTEGER REFERENCES fontes(id) ON DELETE CASCADE,
        peso_conexao DECIMAL(3,2) NOT NULL,
        tipo_conexao VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(fonte_origem_id, fonte_destino_id)
      )
    `);

    // Criar índices para melhor performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_noticias_id_fonte ON noticias(id_fonte);
      CREATE INDEX IF NOT EXISTS idx_conexoes_origem ON conexoes(fonte_origem);
      CREATE INDEX IF NOT EXISTS idx_conexoes_destino ON conexoes(fonte_destino);
      CREATE INDEX IF NOT EXISTS idx_fontes_site ON fontes(site);
      CREATE INDEX IF NOT EXISTS idx_noticias_link ON noticias(link);
      CREATE INDEX IF NOT EXISTS idx_analises_conteudo_created_at ON analises_conteudo(created_at);
      CREATE INDEX IF NOT EXISTS idx_analises_conteudo_is_fake_news ON analises_conteudo(is_fake_news);
      CREATE INDEX IF NOT EXISTS idx_conexoes_confianca_origem ON conexoes_confianca(fonte_origem_id);
      CREATE INDEX IF NOT EXISTS idx_conexoes_confianca_destino ON conexoes_confianca(fonte_destino_id);
    `);

    client.release();
    console.log('✅ Banco de dados Supabase inicializado com sucesso');

  } catch (error) {
    console.error('❌ Erro ao inicializar banco Supabase:', error);
    throw error;
  }
}

// Função para executar queries
export async function query(text, params) {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('📊 Query executada no Supabase:', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('❌ Erro na query do Supabase:', error);
    throw error;
  }
}

// Função para obter cliente da pool
export async function getClient() {
  return await pool.connect();
}

// Função para fechar a pool
export async function closePool() {
  await pool.end();
}

export default pool;
