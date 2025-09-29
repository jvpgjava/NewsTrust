import express from 'express';
import fetch from 'node-fetch';

const router = express.Router();

// Endpoint para criar políticas RLS corretas
router.post('/create-policies', async (req, res) => {
    try {
        console.log('🔧 Criando políticas RLS corretas...');
        
        const supabaseUrl = process.env.SUPABASE_URL || 'https://wbbxqslgutfxldmyuekb.supabase.co';
        const serviceKey = process.env.SUPABASE_SERVICE_KEY || 'sb_secret_y9EP8_t7JHNGbdaRAHdRzA_zY4AsKZD';
        
        const policies = [
            // Política para analises_conteudo (mais importante)
            {
                table: 'analises_conteudo',
                name: 'allow_all_analises_conteudo',
                definition: 'true',
                description: 'Permite todas as operações na tabela analises_conteudo'
            },
            // Política para noticias
            {
                table: 'noticias', 
                name: 'allow_all_noticias',
                definition: 'true',
                description: 'Permite todas as operações na tabela noticias'
            },
            // Política para fontes
            {
                table: 'fontes',
                name: 'allow_all_fontes', 
                definition: 'true',
                description: 'Permite todas as operações na tabela fontes'
            },
            // Política para conexoes
            {
                table: 'conexoes',
                name: 'allow_all_conexoes',
                definition: 'true', 
                description: 'Permite todas as operações na tabela conexoes'
            },
            // Política para conexoes_confianca
            {
                table: 'conexoes_confianca',
                name: 'allow_all_conexoes_confianca',
                definition: 'true',
                description: 'Permite todas as operações na tabela conexoes_confianca'
            }
        ];
        
        const results = [];
        
        for (const policy of policies) {
            try {
                console.log(`🔧 Criando política para ${policy.table}...`);
                
                // SQL para criar a política
                const sql = `
                    DROP POLICY IF EXISTS "${policy.name}" ON public.${policy.table};
                    CREATE POLICY "${policy.name}" ON public.${policy.table}
                    FOR ALL
                    TO service_role
                    USING (true)
                    WITH CHECK (true);
                `;
                
                const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${serviceKey}`,
                        'apikey': serviceKey
                    },
                    body: JSON.stringify({ sql })
                });
                
                if (response.ok) {
                    console.log(`✅ Política criada para ${policy.table}`);
                    results.push({
                        table: policy.table,
                        success: true,
                        message: 'Política criada com sucesso'
                    });
                } else {
                    const errorText = await response.text();
                    console.error(`❌ Erro ao criar política para ${policy.table}:`, errorText);
                    results.push({
                        table: policy.table,
                        success: false,
                        error: errorText
                    });
                }
                
            } catch (error) {
                console.error(`❌ Erro na tabela ${policy.table}:`, error.message);
                results.push({
                    table: policy.table,
                    success: false,
                    error: error.message
                });
            }
        }
        
        res.json({
            success: true,
            message: 'Tentativa de criar políticas RLS concluída',
            results
        });
        
    } catch (error) {
        console.error('❌ Erro ao criar políticas:', error);
        res.status(500).json({
            error: 'Erro ao criar políticas',
            details: error.message
        });
    }
});

export default router;
