import express from 'express';
import pool from '../config/database.js';

const router = express.Router();

// Endpoint de teste simples
router.get('/test', async (req, res) => {
  try {
    console.log('🔍 Testando conexão com banco...');
    
    const client = await pool.connect();
    
    try {
      // Teste simples - verificar se consegue conectar
      const result = await client.query('SELECT NOW() as current_time');
      console.log('✅ Conexão com banco funcionando:', result.rows[0]);
      
      res.json({
        success: true,
        message: 'Conexão com banco funcionando',
        timestamp: result.rows[0].current_time
      });
      
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('❌ Erro na conexão com banco:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erro na conexão com banco',
      details: error.message
    });
  }
});

export default router;
