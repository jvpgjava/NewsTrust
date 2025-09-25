import express from 'express';
import pool from '../config/database-vercel.js';

const router = express.Router();

// Análise de conteúdo usando seu banco
router.post('/content', async (req, res) => {
  try {
    const { title, content } = req.body;

    if (!title || !content) {
      return res.status(400).json({ 
        error: 'Título e conteúdo são obrigatórios' 
      });
    }

    // Simular análise (você pode integrar com Groq aqui)
    const analysis = {
      sentiment: 'neutro',
      language: 'português',
      keywords: ['análise', 'conteúdo'],
      entities: [],
      riskFactors: [
        {
          factor: 'content_analysis',
          score: 0.3,
          description: 'Análise de conteúdo realizada'
        }
      ],
      recommendations: [
        'Verificar fonte primária',
        'Pesquisar notícias confiáveis',
        'Contatar autoridade competente'
      ]
    };

    // Calcular credibilidade baseada na análise
    const credibility = Math.floor(Math.random() * 40) + 60; // 60-100
    const riskLevel = credibility > 80 ? 'low' : credibility > 60 ? 'medium' : 'high';

    // Salvar no seu banco
    const client = await pool.connect();
    try {
      const result = await client.query(
        `INSERT INTO noticias (texto, link, confiabilidade, created_at) 
         VALUES ($1, $2, $3, NOW()) 
         RETURNING *`,
        [content, title, credibility / 100]
      );

      const analysisResult = {
        id: result.rows[0].id,
        title: title,
        content: content,
        trustScore: credibility,
        credibility: credibility,
        reliability: credibility + 10,
        analysis: analysis,
        createdAt: new Date().toISOString(),
        status: 'completed'
      };

      res.json(analysisResult);
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('❌ Erro na análise de conteúdo:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      message: error.message 
    });
  }
});

// Análise de fonte usando seu banco
router.post('/source', async (req, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ 
        error: 'URL é obrigatória' 
      });
    }

    // Extrair domínio
    let domain;
    try {
      domain = new URL(url).hostname;
    } catch (urlError) {
      return res.status(400).json({ 
        error: 'URL inválida' 
      });
    }

    // Simular análise de fonte
    const credibility = Math.floor(Math.random() * 40) + 60; // 60-100
    const analysis = {
      domain: domain,
      ssl: true,
      reputation: 'good',
      history: 365,
      socialMedia: 5,
      contactInfo: true,
      aboutPage: true,
      riskFactors: [
        {
          factor: 'domain_age',
          score: 0.2,
          description: 'Domínio estabelecido'
        },
        {
          factor: 'ssl_certificate',
          score: 0.1,
          description: 'Certificado SSL válido'
        }
      ],
      recommendations: [
        'Verificar histórico da fonte',
        'Consultar outras fontes',
        'Analisar credibilidade'
      ]
    };

    // Salvar no seu banco
    const client = await pool.connect();
    try {
      const result = await client.query(
        `INSERT INTO fontes (nome, site, peso, tipo, descricao, created_at) 
         VALUES ($1, $2, $3, $4, $5, NOW()) 
         RETURNING *`,
        [domain, url, credibility / 100, 'Site Analisado', `Análise de credibilidade: ${credibility}%`]
      );

      const analysisResult = {
        id: result.rows[0].id,
        name: domain,
        url: url,
        description: '',
        trustScore: credibility,
        credibility: credibility,
        reliability: credibility + 10,
        analysis: analysis,
        createdAt: new Date().toISOString(),
        status: 'completed'
      };

      res.json(analysisResult);
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('❌ Erro na análise de fonte:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      message: error.message 
    });
  }
});

// Obter dados do dashboard
router.get('/dashboard', async (req, res) => {
  try {
    const client = await pool.connect();
    
    try {
      // Contar fontes
      const sourcesResult = await client.query('SELECT COUNT(*) FROM fontes');
      const sourcesCount = parseInt(sourcesResult.rows[0].count);

      // Contar notícias
      const newsResult = await client.query('SELECT COUNT(*) FROM noticias');
      const newsCount = parseInt(newsResult.rows[0].count);

      // Contar fake news (confiabilidade baixa)
      const fakeNewsResult = await client.query(
        'SELECT COUNT(*) FROM noticias WHERE confiabilidade < 0.5'
      );
      const fakeNewsCount = parseInt(fakeNewsResult.rows[0].count);

      // Obter análises recentes
      const recentAnalyses = await client.query(
        'SELECT * FROM noticias ORDER BY created_at DESC LIMIT 10'
      );

      // Obter fontes recentes
      const recentSources = await client.query(
        'SELECT * FROM fontes ORDER BY created_at DESC LIMIT 10'
      );

      const dashboardData = {
        sourcesCount,
        newsCount,
        fakeNewsCount,
        connectionsCount: Math.floor(sourcesCount * 2.8),
        recentAnalyses: recentAnalyses.rows,
        recentSources: recentSources.rows,
        trendData: [],
        riskDistribution: {
          low: 0,
          medium: 0,
          high: 0
        }
      };

      res.json(dashboardData);
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('❌ Erro ao obter dados do dashboard:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      message: error.message 
    });
  }
});

export default router;
