import express from 'express';
import fetch from 'node-fetch';

const router = express.Router();

// Endpoint para testar salvamento simples
router.post('/test-simple', async (req, res) => {
    try {
        console.log('🧪 Testando salvamento simples no Supabase...');
        
        const supabaseUrl = process.env.SUPABASE_URL || 'https://wbbxqslgutfxldmyuekb.supabase.co';
        const serviceKey = process.env.SUPABASE_SERVICE_KEY || 'sb_secret_y9EP8_t7JHNGbdaRAHdRzA_zY4AsKZD';
        const apiKey = process.env.SUPABASE_ANON_KEY || 'sb_publishable_87nAXikdyxSnlidI9ybD8g_GB79tsNX';
        
        const testData = {
            title: 'Teste RLS - ' + new Date().toISOString(),
            content: 'Teste para verificar se RLS está bloqueando',
            confidence: 0.75,
            risk_level: 'medio',
            is_fake_news: false,
            reasons: '["Teste de RLS"]',
            recommendations: '["Verificar RLS"]',
            detailed_analysis: 'Teste para verificar se o RLS está bloqueando o salvamento',
            source: 'Teste RLS'
        };
        
        console.log('🔍 Dados de teste:', testData);
        console.log('🔍 URL:', `${supabaseUrl}/rest/v1/analises_conteudo`);
        console.log('🔍 Service Key (primeiros 10):', serviceKey?.substring(0, 10));
        
        const response = await fetch(`${supabaseUrl}/rest/v1/analises_conteudo`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${serviceKey}`,
                'apikey': apiKey,
                'Prefer': 'return=minimal'
            },
            body: JSON.stringify(testData)
        });
        
        console.log('🔍 Status da resposta:', response.status);
        console.log('🔍 Headers da resposta:', Object.fromEntries(response.headers.entries()));
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Erro na resposta:', errorText);
            throw new Error(`Supabase API error: ${response.status} - ${errorText}`);
        }
        
        console.log('✅ Salvamento bem-sucedido!');
        
        res.json({
            success: true,
            message: 'Teste de salvamento bem-sucedido',
            data: testData,
            status: response.status
        });
        
    } catch (error) {
        console.error('❌ Erro no teste:', error);
        res.status(500).json({
            error: 'Erro no teste de salvamento',
            details: error.message,
            stack: error.stack
        });
    }
});

export default router;
