import express from 'express';
import SupabaseAPI from '../services/SupabaseAPI.js';

const router = express.Router();
const supabaseAPI = new SupabaseAPI();

// Endpoint para verificar atualizações (polling)
router.get('/check', async (req, res) => {
    try {
        console.log('🔍 Verificando atualizações...');

        // Buscar análises recentes via Supabase API
        const recentAnalyses = await supabaseAPI.getRecentAnalyses(5);
        
        // Contar análises via Supabase API
        const counts = await supabaseAPI.getAnalysisCounts();
        
        console.log('📊 Dados do Supabase:', {
            total: counts.total,
            fake: counts.fake,
            recent: recentAnalyses.length
        });

        // Dados do dashboard
        const dashboardData = {
            sourcesCount: 13, // Valor fixo por enquanto
            newsCount: counts.total,
            fakeNewsCount: counts.fake,
            averageCredibility: recentAnalyses.length > 0 ? 
                recentAnalyses.reduce((sum, a) => sum + a.confidence, 0) / recentAnalyses.length : 0,
            recentAnalyses: recentAnalyses.map(analysis => ({
                id: analysis.id,
                title: analysis.title,
                texto: analysis.content,
                credibility: analysis.confidence,
                risk_level: analysis.risk_level,
                is_fake_news: analysis.is_fake_news
            })),
            riskDistribution: {
                low: recentAnalyses.filter(a => a.risk_level === 'baixo').length,
                medium: recentAnalyses.filter(a => a.risk_level === 'medio').length,
                high: recentAnalyses.filter(a => a.risk_level === 'alto').length
            },
            trendData: [], // Por enquanto vazio
            connectionsCount: networkData.news.connections.length
        };

        // Dados da rede (simplificado)
        const networkData = {
            sources: {
                nodes: [],
                connections: []
            },
            news: {
                nodes: recentAnalyses.map(analysis => ({
                    id: analysis.id,
                    name: analysis.title || 'Notícia sem título',
                    title: analysis.title || 'Notícia sem título',
                    content: analysis.content,
                    credibility: analysis.confidence,
                    isFakeNews: analysis.is_fake_news,
                    riskLevel: analysis.risk_level,
                    type: 'news'
                })),
                connections: []
            }
        };

        // Adicionar conexões entre notícias similares
        if (networkData.news.nodes.length > 1) {
            networkData.news.connections = [];
            for (let i = 0; i < networkData.news.nodes.length; i++) {
                for (let j = i + 1; j < networkData.news.nodes.length; j++) {
                    if (Math.random() > 0.7) { // 30% chance de conexão
                        networkData.news.connections.push({
                            source: networkData.news.nodes[i].id,
                            target: networkData.news.nodes[j].id,
                            strength: Math.random() * 0.5 + 0.5
                        });
                    }
                }
            }
        }

        console.log('✅ Dados carregados via Supabase API:', {
            sources: dashboardData.sourcesCount,
            news: dashboardData.newsCount,
            fake: dashboardData.fakeNewsCount,
            recent: recentAnalyses.length
        });

        res.json({
            success: true,
            dashboard: dashboardData,
            network: networkData,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ Erro ao verificar atualizações:', error);
        res.status(500).json({
            error: 'Erro ao verificar atualizações',
            details: error.message
        });
    }
});

export default router;
