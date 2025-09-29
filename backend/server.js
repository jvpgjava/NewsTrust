import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import dotenv from 'dotenv';
import { createServer } from 'http';

import { initializeDatabase } from './config/database.js';
import { trustGraph, newsAnalyzer, initializeInstances } from './services/instances.js';
import realTimeService from './services/RealTimeService.js';
import AutoConnectionService from './services/AutoConnectionService.js';
import RealTimeUpdateService from './services/RealTimeUpdateService.js';

// Importar rotas
import sourcesRoutes from './routes/sources.js';
import newsRoutes from './routes/news.js';
import graphRoutes from './routes/graph.js';
import analysisRoutes from './routes/analysis.js';
import contentAnalysisRoutes from './routes/content-analysis.js';
import contentAnalysisSupabaseRoutes from './routes/content-analysis-supabase.js';
import sourceAnalysisRoutes from './routes/source-analysis.js';
import sourceAnalysisSupabaseRoutes from './routes/source-analysis-supabase.js';
import systemRouter from './routes/system.js';
import fileUploadRoutes from './routes/file-upload.js';
import contactRoutes from './routes/contact.js';
import notificationsRoutes from './routes/notifications-simple.js';
import notificationsSupabaseRoutes from './routes/notifications-supabase.js';
import testSupabaseDataRoutes from './routes/test-supabase-data.js';
import testSaveAnalysisRoutes from './routes/test-save-analysis.js';
import fixSupabaseRlsRoutes from './routes/fix-supabase-rls.js';
import testSimpleSaveRoutes from './routes/test-simple-save.js';
import testDbRoutes from './routes/test-db.js';
import simpleTestRoutes from './routes/simple-test.js';
import testWithoutDbRoutes from './routes/test-without-db.js';

// Configuração do dotenv
dotenv.config();

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 3001;

// Configuração do Swagger
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'NewsTrust API',
      version: '1.0.0',
      description: 'API para o sistema NewsTrust - Detector de Fake News com Rede de Confiabilidade',
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,
        description: 'Servidor de Desenvolvimento'
      }
    ],
    components: {
      schemas: {
        Fonte: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            nome: { type: 'string', example: 'G1' },
            site: { type: 'string', example: 'https://g1.globo.com' },
            peso: { type: 'number', example: 0.85 },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' }
          }
        },
        Noticia: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            texto: { type: 'string', example: 'Texto da notícia aqui...' },
            link: { type: 'string', example: 'https://exemplo.com/noticia' },
            id_fonte: { type: 'integer' },
            confiabilidade: { type: 'number', example: 0.75 },
            created_at: { type: 'string', format: 'date-time' }
          }
        },
        Conexao: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            fonte_origem: { type: 'integer' },
            fonte_destino: { type: 'integer' },
            peso: { type: 'number', example: 0.8 },
            created_at: { type: 'string', format: 'date-time' }
          }
        }
      }
    }
  },
  apis: ['./routes/*.js']
};

const specs = swaggerJsdoc(swaggerOptions);

// Rate limiting - muito permissivo para desenvolvimento
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 1 * 60 * 1000, // 1 minuto
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 10000, // limite muito alto para desenvolvimento
  message: {
    error: 'Muitas requisições deste IP, tente novamente mais tarde.'
  }
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: [
    'http://localhost:3000', 
    'https://newstrust.me', 
    'https://www.newstrust.me',
    'https://api.newstrust.me', 
    'http://localhost:3001'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.use(compression());
app.use(morgan('combined'));
// Rate limiting desabilitado para desenvolvimento
// app.use(limiter);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

// Instâncias globais já inicializadas em services/instances.js

// Inicializar banco de dados e grafo
async function initializeApp() {
  try {
    await initializeDatabase();
    await initializeInstances();
    console.log('✅ Banco de dados e grafo inicializados');
  } catch (error) {
    console.error('❌ Erro ao inicializar:', error);
    process.exit(1);
  }
}

// Inicializar aplicação
initializeApp().then(() => {
  server.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
    console.log(`📚 Documentação: http://localhost:${PORT}/api-docs`);
    console.log(`🔌 WebSocket: ws://localhost:${PORT}`);
  });

  // Inicializar WebSocket
  realTimeService.initialize(server);

  // Inicializar serviço de conexões automáticas
  AutoConnectionService.schedulePeriodicUpdate(30); // Atualizar a cada 30 minutos

  // Iniciar serviço de atualizações em tempo real
  RealTimeUpdateService.start();
  console.log('🔄 Serviço de conexões automáticas inicializado');
});

// Rotas
app.use('/api/sources', sourcesRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/graph', graphRoutes);
app.use('/api/analysis', analysisRoutes);
app.use('/api/content-analysis', contentAnalysisSupabaseRoutes);
app.use('/api/content-analysis-old', contentAnalysisRoutes);
app.use('/api/source-analysis', sourceAnalysisSupabaseRoutes);
app.use('/api/source-analysis-old', sourceAnalysisRoutes);
app.use('/api/system', systemRouter);
app.use('/api/file-upload', fileUploadRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/notifications', notificationsSupabaseRoutes);
app.use('/api/notifications-old', notificationsRoutes);
app.use('/api/test-supabase', testSupabaseDataRoutes);
app.use('/api/test-save', testSaveAnalysisRoutes);
app.use('/api/fix-rls', fixSupabaseRlsRoutes);
app.use('/api/test-simple', testSimpleSaveRoutes);
app.use('/api/test-db', testDbRoutes);
app.use('/api/simple-test', simpleTestRoutes);
app.use('/api/test-without-db', testWithoutDbRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: process.env.NODE_ENV,
    graphNodes: trustGraph.getNodeCount(),
    graphEdges: trustGraph.getEdgeCount()
  });
});

// Rota raiz
app.get('/', (req, res) => {
  res.json({
    message: 'NewsTrust API - Detector de Fake News com Rede de Confiabilidade',
    version: '1.0.0',
    documentation: '/api-docs',
    health: '/health'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Erro:', err);

  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Erro de validação',
      details: err.message
    });
  }

  if (err.name === 'DatabaseError') {
    return res.status(500).json({
      error: 'Erro no banco de dados',
      details: err.message
    });
  }

  res.status(500).json({
    error: 'Erro interno do servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Algo deu errado'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Rota não encontrada',
    path: req.originalUrl
  });
});

//  Vercel
export default app;
