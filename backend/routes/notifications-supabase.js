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

        // Dados do dashboard
        const dashboardData = {
            sourcesCount: 13, // Valor fixo por enquanto
            newsCount: counts.total,
            fakeNewsCount: counts.fake,
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
            connectionsCount: 0 // Por enquanto vazio
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
