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

        // DEBUG: Verificar se há dados reais
        console.log('🔍 DEBUG - recentAnalyses:', recentAnalyses);
        console.log('🔍 DEBUG - counts:', counts);
        
        // DEBUG: Verificar se as tabelas têm dados
        if (recentAnalyses.length === 0) {
            console.log('⚠️ AVISO: Nenhuma análise encontrada no Supabase!');
            console.log('🔍 Verificando se a tabela analises_conteudo tem dados...');
        }

        // Dados da rede (simplificado) - DECLARAR PRIMEIRO
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

        // Adicionar conexões entre notícias similares (baseado em conteúdo)
        // Por enquanto, não criar conexões aleatórias - implementar análise de similaridade no futuro
        networkData.news.connections = [];

        // Dados do dashboard - AGORA PODE USAR networkData
        const dashboardData = {
            sourcesCount: 0, // Começar com 0 - será calculado dinamicamente
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
                low: recentAnalyses.length > 0 ? 
                    Math.round((recentAnalyses.filter(a => a.risk_level === 'baixo').length / recentAnalyses.length) * 100) : 0,
                medium: recentAnalyses.length > 0 ? 
                    Math.round((recentAnalyses.filter(a => a.risk_level === 'medio').length / recentAnalyses.length) * 100) : 0,
                high: recentAnalyses.length > 0 ? 
                    Math.round((recentAnalyses.filter(a => a.risk_level === 'alto').length / recentAnalyses.length) * 100) : 0
            },
            trendData: recentAnalyses.map((analysis, index) => {
                const date = new Date(analysis.created_at || new Date());
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const year = date.getFullYear();
                return {
                    date: `${month}/${year}`,
                    count: recentAnalyses.length - index,
                    fakeCount: analysis.is_fake_news ? 1 : 0
                };
            }),
            connectionsCount: networkData.news.connections.length
        };

        // DEBUG: Verificar dados finais
        console.log('🔍 DEBUG - dashboardData:', {
            sourcesCount: dashboardData.sourcesCount,
            newsCount: dashboardData.newsCount,
            fakeNewsCount: dashboardData.fakeNewsCount,
            averageCredibility: dashboardData.averageCredibility,
            connectionsCount: dashboardData.connectionsCount
        });

        console.log('✅ Dados carregados via Supabase API:', {
            sources: dashboardData.sourcesCount,
            news: dashboardData.newsCount,
            fake: dashboardData.fakeNewsCount,
            recent: recentAnalyses.length
        });

        res.json({
            success: true,
            dashboard: dashboardData,
            recentAnalyses: dashboardData.recentAnalyses, // Adicionar na raiz para o frontend
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
