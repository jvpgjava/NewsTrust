import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Importar configuração do banco para produção
import pool, { testConnection, initializeDatabase } from './config/database-production.js';

// Importar rotas
import notificationsRoutes from './routes/notifications-simple.js';
import fileUploadRoutes from './routes/file-upload.js';
import contentAnalysisRoutes from './routes/content-analysis.js';
import sourceAnalysisRoutes from './routes/source-analysis.js';
import contactRoutes from './routes/contact.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carregar variáveis de ambiente
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// CORS para produção
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'https://newstrust.me',
      'https://www.newstrust.me',
      'https://api.newstrust.me'
    ];
    
    if (!origin || allowedOrigins.includes(origin) || origin.includes('.vercel.app') || origin.includes('localhost')) {
      callback(null, true);
    } else {
      callback(null, true);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin', 'Access-Control-Request-Method', 'Access-Control-Request-Headers'],
  exposedHeaders: ['Content-Length', 'Content-Type'],
  preflightContinue: false,
  optionsSuccessStatus: 204
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Rate limiting para produção
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000, // 15 minutos
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // 100 requests por window
  message: {
    error: 'Muitas requisições. Tente novamente em alguns minutos.',
    retryAfter: Math.ceil((parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000) / 1000)
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);

// Middleware de logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/health', async (req, res) => {
  try {
    const dbStatus = await testConnection();
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: dbStatus ? 'connected' : 'disconnected',
      environment: process.env.NODE_ENV
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      database: 'error',
      error: error.message
    });
  }
});

// Rotas da API
app.use('/api/notifications', notificationsRoutes);
app.use('/api/file-upload', fileUploadRoutes);
app.use('/api/content-analysis', contentAnalysisRoutes);
app.use('/api/source-analysis', sourceAnalysisRoutes);
app.use('/api/contact', contactRoutes);

// Rota de teste
app.get('/api/test', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW() as current_time, version() as postgres_version');
    res.json({
      message: 'Backend funcionando!',
      database: 'Conectado ao Supabase',
      timestamp: result.rows[0].current_time,
      postgres_version: result.rows[0].postgres_version
    });
  } catch (error) {
    res.status(500).json({
      error: 'Erro ao conectar com o banco',
      details: error.message
    });
  }
});

// Middleware de tratamento de erros
app.use((err, req, res, next) => {
  console.error('Erro no servidor:', err);
  res.status(500).json({
    error: 'Erro interno do servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Algo deu errado'
  });
});

// Rota 404
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Rota não encontrada',
    path: req.originalUrl
  });
});

// Inicializar servidor
async function startServer() {
  try {
    console.log('🚀 Iniciando servidor de produção...');
    
    // Testar conexão com Supabase
    console.log('🔍 Testando conexão com Supabase...');
    const dbConnected = await testConnection();
    
    if (!dbConnected) {
      throw new Error('Falha ao conectar com o Supabase');
    }
    
    // Inicializar banco de dados
    console.log('🔧 Inicializando banco de dados...');
    await initializeDatabase();
    
    // Iniciar servidor
    app.listen(PORT, () => {
      console.log(`✅ Servidor rodando na porta ${PORT}`);
      console.log(`🌍 Ambiente: ${process.env.NODE_ENV}`);
      console.log(`🗄️ Banco: Supabase conectado`);
      console.log(`🔗 Health check: http://localhost:${PORT}/health`);
      console.log(`🧪 Teste: http://localhost:${PORT}/api/test`);
    });
    
  } catch (error) {
    console.error('❌ Erro ao iniciar servidor:', error);
    process.exit(1);
  }
}

// Inicializar servidor
startServer();

export default app;
