import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// Endpoint para verificar atualizações (polling)
router.get('/check', async (req, res) => {
  try {
    console.log('🔍 Verificando atualizações...');
    
    // Verificar se há notícias novas (últimas 2 minutos)
    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
    
    const newNews = await prisma.news.findMany({
      where: {
        createdAt: {
          gte: twoMinutesAgo
        }
      },
      include: {
        source: true,
        analysis: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10
    });

    // Verificar se há análises novas
    const newAnalyses = await prisma.analysis.findMany({
      where: {
        createdAt: {
          gte: twoMinutesAgo
        }
      },
      include: {
        news: {
          include: {
            source: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10
    });

    // Verificar se há fontes novas
    const newSources = await prisma.source.findMany({
      where: {
        createdAt: {
          gte: twoMinutesAgo
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10
    });

    const hasUpdates = newNews.length > 0 || newAnalyses.length > 0 || newSources.length > 0;

    if (hasUpdates) {
      console.log(`📨 ${newNews.length} notícias, ${newAnalyses.length} análises, ${newSources.length} fontes novas`);
    }

    // Dados iniciais (apenas na primeira chamada ou se solicitado)
    const initialData = req.query.initial === 'true' ? await getInitialData() : null;

    res.json({
      hasUpdates,
      timestamp: new Date().toISOString(),
      newNews,
      newAnalyses,
      newSources,
      initialData
    });

  } catch (error) {
    console.error('❌ Erro ao verificar atualizações:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      hasUpdates: false 
    });
  }
});

// Função para obter dados iniciais
async function getInitialData() {
  try {
    // Estatísticas gerais
    const totalNews = await prisma.news.count();
    const totalAnalyses = await prisma.analysis.count();
    const totalSources = await prisma.source.count();

    // Notícias recentes
    const recentNews = await prisma.news.findMany({
      include: {
        source: true,
        analysis: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 5
    });

    // Análises recentes
    const recentAnalyses = await prisma.analysis.findMany({
      include: {
        news: {
          include: {
            source: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 5
    });

    // Dados do gráfico de fontes
    const sourcesGraphData = await getSourcesGraphData();
    const newsGraphData = await getNewsGraphData();

    return {
      stats: {
        totalNews,
        totalAnalyses,
        totalSources,
        recentNews,
        recentAnalyses
      },
      sourcesGraphData,
      newsGraphData
    };
  } catch (error) {
    console.error('❌ Erro ao obter dados iniciais:', error);
    return null;
  }
}

// Função para obter dados do gráfico de fontes
async function getSourcesGraphData() {
  try {
    const sources = await prisma.source.findMany({
      include: {
        news: {
          include: {
            analysis: true
          }
        }
      }
    });

    const nodes = sources.map(source => ({
      id: source.id,
      name: source.name,
      url: source.url,
      type: 'source',
      trustScore: source.trustScore || 0,
      newsCount: source.news.length
    }));

    const links = [];
    
    // Criar links entre fontes baseado em análises similares
    for (let i = 0; i < sources.length; i++) {
      for (let j = i + 1; j < sources.length; j++) {
        const source1 = sources[i];
        const source2 = sources[j];
        
        // Calcular similaridade baseada em análises
        const similarity = calculateSimilarity(source1, source2);
        
        if (similarity > 0.3) {
          links.push({
            source: source1.id,
            target: source2.id,
            weight: similarity
          });
        }
      }
    }

    return { nodes, links };
  } catch (error) {
    console.error('❌ Erro ao obter dados do gráfico de fontes:', error);
    return { nodes: [], links: [] };
  }
}

// Função para obter dados do gráfico de notícias
async function getNewsGraphData() {
  try {
    const news = await prisma.news.findMany({
      include: {
        source: true,
        analysis: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 50
    });

    const nodes = news.map(article => ({
      id: article.id,
      title: article.title,
      url: article.url,
      type: 'news',
      trustScore: article.trustScore || 0,
      sourceId: article.sourceId
    }));

    const links = [];
    
    // Criar links entre notícias baseado em similaridade de conteúdo
    for (let i = 0; i < news.length; i++) {
      for (let j = i + 1; j < news.length; j++) {
        const news1 = news[i];
        const news2 = news[j];
        
        // Calcular similaridade baseada em título e conteúdo
        const similarity = calculateNewsSimilarity(news1, news2);
        
        if (similarity > 0.2) {
          links.push({
            source: news1.id,
            target: news2.id,
            weight: similarity
          });
        }
      }
    }

    return { nodes, links };
  } catch (error) {
    console.error('❌ Erro ao obter dados do gráfico de notícias:', error);
    return { nodes: [], links: [] };
  }
}

// Função para calcular similaridade entre fontes
function calculateSimilarity(source1, source2) {
  // Implementação simples de similaridade
  // Pode ser melhorada com algoritmos mais sofisticados
  const news1 = source1.news.length;
  const news2 = source2.news.length;
  
  if (news1 === 0 || news2 === 0) return 0;
  
  // Similaridade baseada na quantidade de notícias
  const newsSimilarity = Math.min(news1, news2) / Math.max(news1, news2);
  
  // Similaridade baseada no trust score
  const trustScore1 = source1.trustScore || 0;
  const trustScore2 = source2.trustScore || 0;
  const trustSimilarity = 1 - Math.abs(trustScore1 - trustScore2) / 100;
  
  return (newsSimilarity + trustSimilarity) / 2;
}

// Função para calcular similaridade entre notícias
function calculateNewsSimilarity(news1, news2) {
  // Implementação simples de similaridade
  // Pode ser melhorada com algoritmos mais sofisticados
  const title1 = news1.title.toLowerCase();
  const title2 = news2.title.toLowerCase();
  
  // Similaridade baseada em palavras comuns
  const words1 = title1.split(' ');
  const words2 = title2.split(' ');
  
  const commonWords = words1.filter(word => words2.includes(word));
  const totalWords = new Set([...words1, ...words2]).size;
  
  return commonWords.length / totalWords;
}

export default router;
