import { Handler } from '@netlify/functions';
import { Pool } from 'pg';
import nodemailer from 'nodemailer';

// Configuração do banco de dados
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// Configuração do email
const transporter = nodemailer.createTransporter({
  service: 'gmail',
  auth: {
    user: 'newstrust.contato@gmail.com',
    pass: process.env.EMAIL_PASSWORD,
  },
});

// Função para inicializar o banco
async function initializeDatabase() {
  try {
    const client = await pool.connect();
    
    // Criar tabelas se não existirem
    await client.query(`
      CREATE TABLE IF NOT EXISTS fontes (
        id SERIAL PRIMARY KEY,
        nome VARCHAR(255) NOT NULL UNIQUE,
        site VARCHAR(500) NOT NULL UNIQUE,
        peso DECIMAL(3,2) DEFAULT 0.5,
        tipo VARCHAR(50) DEFAULT 'general',
        descricao TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS noticias (
        id SERIAL PRIMARY KEY,
        texto TEXT NOT NULL,
        link VARCHAR(1000),
        id_fonte INTEGER REFERENCES fontes(id) ON DELETE CASCADE,
        confiabilidade DECIMAL(3,2) DEFAULT 0.5,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS conexoes (
        id SERIAL PRIMARY KEY,
        fonte_origem INTEGER REFERENCES fontes(id) ON DELETE CASCADE,
        fonte_destino INTEGER REFERENCES fontes(id) ON DELETE CASCADE,
        peso DECIMAL(3,2) DEFAULT 0.5,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(fonte_origem, fonte_destino)
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS feedback (
        id SERIAL PRIMARY KEY,
        id_noticia INTEGER REFERENCES noticias(id) ON DELETE CASCADE,
        tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('confiavel', 'fake')),
        comentario TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

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

    client.release();
    console.log('✅ Banco de dados inicializado');
  } catch (error) {
    console.error('❌ Erro ao inicializar banco:', error);
    throw error;
  }
}

// Handler principal
export const handler = async (event, context) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  try {
    // Inicializar banco
    await initializeDatabase();

    const { httpMethod, path } = event;
    const route = path.replace('/api/', '');

    // Rotas
    switch (route) {
      case 'health':
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ status: 'OK', timestamp: new Date().toISOString() }),
        };

      case 'contact':
        if (httpMethod === 'POST') {
          const { name, email, message } = JSON.parse(event.body);
          
          // Enviar email
          await transporter.sendMail({
            from: 'newstrust.contato@gmail.com',
            to: 'newstrust.contato@gmail.com',
            subject: `Contato de ${name}`,
            html: `
              <h2>Novo contato recebido</h2>
              <p><strong>Nome:</strong> ${name}</p>
              <p><strong>Email:</strong> ${email}</p>
              <p><strong>Mensagem:</strong></p>
              <p>${message}</p>
            `,
          });

          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ message: 'Email enviado com sucesso!' }),
          };
        }
        break;

      default:
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ error: 'Rota não encontrada' }),
        };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: 'API funcionando!' }),
    };

  } catch (error) {
    console.error('❌ Erro na API:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Erro interno do servidor' }),
    };
  }
};
