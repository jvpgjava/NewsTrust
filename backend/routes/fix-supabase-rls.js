import express from 'express';
import fetch from 'node-fetch';

const router = express.Router();

// Endpoint para corrigir RLS no Supabase
router.post('/enable-rls', async (req, res) => {
    try {
        console.log('🔧 Tentando habilitar RLS nas tabelas...');
        
        const supabaseUrl = process.env.SUPABASE_URL || 'https://wbbxqslgutfxldmyuekb.supabase.co';
        const serviceKey = process.env.SUPABASE_SERVICE_KEY || 'sb_secret_y9EP8_t7JHNGbdaRAHdRzA_zY4AsKZD';
        
        const tables = [
            'analises_conteudo',
            'noticias', 
            'fontes',
            'conexoes',
            'conexoes_confianca'
        ];
        
        const results = [];
        
        for (const table of tables) {
            try {
                console.log(`🔧 Habilitando RLS para tabela: ${table}`);
                
                // Habilitar RLS
                const rlsResponse = await fetch(`${supabaseUrl}/rest/v1/rpc/enable_rls`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${serviceKey}`,
                        'apikey': serviceKey
                    },
                    body: JSON.stringify({ table_name: table })
                });
                
                // Criar política permissiva (temporária)
                const policyResponse = await fetch(`${supabaseUrl}/rest/v1/rpc/create_policy`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${serviceKey}`,
                        'apikey': serviceKey
                    },
                    body: JSON.stringify({
                        table_name: table,
                        policy_name: `allow_all_${table}`,
                        policy_definition: 'true'
                    })
                });
                
                results.push({
                    table,
                    rls: rlsResponse.ok,
                    policy: policyResponse.ok
                });
                
            } catch (error) {
                console.error(`❌ Erro na tabela ${table}:`, error.message);
                results.push({
                    table,
                    error: error.message
                });
            }
        }
        
        res.json({
            success: true,
            message: 'Tentativa de habilitar RLS concluída',
            results
        });
        
    } catch (error) {
        console.error('❌ Erro ao habilitar RLS:', error);
        res.status(500).json({
            error: 'Erro ao habilitar RLS',
            details: error.message
        });
    }
});

export default router;
