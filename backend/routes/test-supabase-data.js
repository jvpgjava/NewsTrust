import express from 'express';
import SupabaseAPI from '../services/SupabaseAPI.js';

const router = express.Router();
const supabaseAPI = new SupabaseAPI();

// Endpoint para testar dados do Supabase
router.get('/check-data', async (req, res) => {
    try {
        console.log('🔍 Testando dados do Supabase...');
        
        // Buscar todas as análises (sem limite)
        const allAnalyses = await supabaseAPI.getRecentAnalyses(100);
        const counts = await supabaseAPI.getAnalysisCounts();
        
        console.log('📊 Dados encontrados:', {
            totalAnalyses: allAnalyses.length,
            counts: counts,
            firstAnalysis: allAnalyses[0] || 'Nenhuma análise encontrada'
        });
        
        res.json({
            success: true,
            data: {
                totalAnalyses: allAnalyses.length,
                counts: counts,
                analyses: allAnalyses.slice(0, 5), // Primeiras 5 análises
                message: allAnalyses.length === 0 ? 'Nenhuma análise encontrada no Supabase' : `${allAnalyses.length} análises encontradas`
            }
        });
        
    } catch (error) {
        console.error('❌ Erro ao testar Supabase:', error);
        res.status(500).json({
            error: 'Erro ao testar Supabase',
            details: error.message
        });
    }
});

export default router;
