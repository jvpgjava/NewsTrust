import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import dotenv from 'dotenv';

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
import systemRouter from './routes/system.js';

// Configuração do dotenv
dotenv.config();

const app = express();
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

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutos
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limite por IP
  message: {
    error: 'Muitas requisições deste IP, tente novamente mais tarde.'
  }
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));
app.use(compression());
app.use(morgan('combined'));
app.use(limiter);
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
  const server = app.listen(PORT, () => {
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
app.use('/api/system', systemRouter);

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
