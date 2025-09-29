import express from 'express';

const router = express.Router();

// Endpoint de teste super simples
router.get('/test', (req, res) => {
  try {
    console.log('🔍 Teste simples funcionando');
    res.json({
      success: true,
      message: 'Backend funcionando!',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV
    });
  } catch (error) {
    console.error('❌ Erro no teste simples:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
