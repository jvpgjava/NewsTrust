import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carregar .env.local em desenvolvimento, .env em produção
const envFile = process.env.NODE_ENV === 'production' ? '.env' : '.env.local';
dotenv.config({ path: path.join(__dirname, '..', envFile) });

// 🔍 DEBUG: Verificar variáveis de ambiente
console.log('🔍 DEBUG - Variáveis de ambiente:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('DATABASE_URL existe:', !!process.env.DATABASE_URL);
console.log('DATABASE_URL (primeiros 50 chars):', process.env.DATABASE_URL ? process.env.DATABASE_URL.substring(0, 50) + '...' : 'undefined');
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_PORT:', process.env.DB_PORT);
console.log('DB_NAME:', process.env.DB_NAME);

// ✅ USAR SUPABASE EM PRODUÇÃO
if (process.env.NODE_ENV === 'production') {
  console.log('✅ Usando Supabase em produção');
  // Manter DATABASE_URL do Supabase
}

// Configuração da pool de conexões
// Priorizar DATABASE_URL se disponível, senão usar variáveis individuais
let poolConfig;

if (process.env.DATABASE_URL) {
  // Usar DATABASE_URL (Railway/Supabase)
  console.log('✅ Usando DATABASE_URL para conexão');
  poolConfig = {
    connectionString: process.env.DATABASE_URL,
    max: 20, // máximo de conexões na pool
    idleTimeoutMillis: 30000, // tempo limite de inatividade
    connectionTimeoutMillis: 10000, // aumento tempo limite para Railway
    // SSL obrigatório para Railway em produção
    ssl: process.env.NODE_ENV === 'production' ? {
      rejectUnauthorized: false
    } : false,
  };
  console.log('🔧 Configuração da pool:', {
    max: poolConfig.max,
    idleTimeoutMillis: poolConfig.idleTimeoutMillis,
    connectionTimeoutMillis: poolConfig.connectionTimeoutMillis,
    ssl: poolConfig.ssl
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
    max: 20, // máximo de conexões na pool
    idleTimeoutMillis: 30000, // tempo limite de inatividade
    connectionTimeoutMillis: 10000, // aumento tempo limite para Railway
    // SSL obrigatório para Railway em produção
    ssl: process.env.NODE_ENV === 'production' ? {
      rejectUnauthorized: false
    } : false,
  };
}

const pool = new Pool(poolConfig);

// Testar conexão
pool.on('connect', () => {
  console.log('🔗 Conectado ao PostgreSQL');
});

pool.on('error', (err) => {
  console.error('❌ Erro na pool do PostgreSQL:', err);
});

// Função para inicializar o banco de dados
export async function initializeDatabase() {
  try {
    // Verificar se as tabelas existem
    const client = await pool.connect();

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

    // Criar tabela de conexões (arestas do grafo) se não existir
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

    // Criar tabela de feedback se não existir
    await client.query(`
      CREATE TABLE IF NOT EXISTS feedback (
        id SERIAL PRIMARY KEY,
        id_noticia INTEGER REFERENCES noticias(id) ON DELETE CASCADE,
        tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('confiavel', 'fake')),
        comentario TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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

    // Criar função para atualizar updated_at automaticamente
    await client.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ language 'plpgsql';
    `);

    // Criar triggers para atualizar updated_at
    await client.query(`
      DROP TRIGGER IF EXISTS update_fontes_updated_at ON fontes;
      CREATE TRIGGER update_fontes_updated_at
        BEFORE UPDATE ON fontes
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    `);

    await client.query(`
      DROP TRIGGER IF EXISTS update_noticias_updated_at ON noticias;
      CREATE TRIGGER update_noticias_updated_at
        BEFORE UPDATE ON noticias
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    `);

    await client.query(`
      DROP TRIGGER IF EXISTS update_conexoes_updated_at ON conexoes;
      CREATE TRIGGER update_conexoes_updated_at
        BEFORE UPDATE ON conexoes
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    `);

    client.release();
    console.log('✅ Tabelas e índices criados/verificados com sucesso');

  } catch (error) {
    console.error('❌ Erro ao inicializar banco de dados:', error);
    throw error;
  }
}

// Função para executar queries
export async function query(text, params) {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('📊 Query executada:', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('❌ Erro na query:', error);
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
