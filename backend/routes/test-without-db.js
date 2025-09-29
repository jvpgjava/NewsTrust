import express from 'express';
import AIFactChecker from '../services/AIFactChecker.js';

const router = express.Router();

// Teste de análise SEM banco de dados
router.post('/analyze', async (req, res) => {
  try {
    console.log('🧪 Teste de análise SEM banco de dados...');
    
    const { title, content } = req.body;
    
    if (!title || !content) {
      return res.status(400).json({ error: 'Título e conteúdo são obrigatórios' });
    }

    // Usar AIFactChecker diretamente (sem salvar no banco)
    const aiFactChecker = new AIFactChecker();
    const analysis = await aiFactChecker.analyzeContent(title, content);
    
    console.log('✅ Análise concluída sem banco:', analysis);
    
    res.json({
      success: true,
      analysis: analysis,
      message: 'Análise realizada sem salvar no banco'
    });

  } catch (error) {
    console.error('❌ Erro no teste sem banco:', error);
    res.status(500).json({ 
      error: 'Erro na análise', 
      details: error.message 
    });
  }
});

export default router;
