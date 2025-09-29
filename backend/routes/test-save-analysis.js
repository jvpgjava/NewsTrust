import express from 'express';
import SupabaseAPI from '../services/SupabaseAPI.js';

const router = express.Router();
const supabaseAPI = new SupabaseAPI();

// Endpoint para testar salvamento de análise
router.post('/test-save', async (req, res) => {
    try {
        console.log('🧪 Testando salvamento de análise no Supabase...');
        
        const testData = {
            title: 'Teste de Análise - ' + new Date().toISOString(),
            content: 'Este é um teste de salvamento no Supabase',
            confidence: 0.85,
            riskLevel: 'medio',
            isFakeNews: false,
            reasons: ['Teste de funcionalidade'],
            recommendations: ['Verificar se salvou corretamente'],
            detailedAnalysis: 'Análise de teste para verificar se o Supabase está funcionando',
            source: 'Teste'
        };
        
        console.log('🔍 Dados de teste:', testData);
        
        const result = await supabaseAPI.saveContentAnalysis(testData);
        
        console.log('✅ Resultado do salvamento:', result);
        
        res.json({
            success: true,
            message: 'Análise de teste salva com sucesso',
            data: testData,
            result: result
        });
        
    } catch (error) {
        console.error('❌ Erro ao testar salvamento:', error);
        res.status(500).json({
            error: 'Erro ao testar salvamento',
            details: error.message,
            stack: error.stack
        });
    }
});

export default router;
