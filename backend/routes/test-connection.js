import express from 'express';
import SupabaseAPI from '../services/SupabaseAPI.js';

const router = express.Router();
const supabaseAPI = new SupabaseAPI();

// Testar conexão com Supabase
router.get('/test', async (req, res) => {
    try {
        console.log('🔍 Testando conexão com Supabase...');
        
        // Testar inserção simples
        const testData = {
            title: 'Teste de Conexão',
            content: 'Este é um teste de conexão com Supabase',
            confidence: 0.5,
            riskLevel: 'medio',
            isFakeNews: false,
            reasons: JSON.stringify(['Teste de conexão']),
            recommendations: JSON.stringify(['Verificar se salvou']),
            detailedAnalysis: 'Teste de conexão com Supabase',
            source: 'Teste'
        };
        
        console.log('📝 Dados de teste:', testData);
        
        const result = await supabaseAPI.saveContentAnalysis(testData);
        console.log('✅ Resultado do teste:', result);
        
        res.json({
            success: true,
            message: 'Teste de conexão realizado',
            result: result
        });
        
    } catch (error) {
        console.error('❌ Erro no teste de conexão:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            details: error.stack
        });
    }
});

export default router;
