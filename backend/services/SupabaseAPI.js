import fetch from 'node-fetch';

class SupabaseAPI {
    constructor() {
        this.url = process.env.SUPABASE_URL || 'https://wbbxqslgutfxldmyuekb.supabase.co';
        this.apiKey = process.env.SUPABASE_ANON_KEY || 'sb_publishable_87nAXikdyxSnlidI9ybD8g_GB79tsNX';
        this.serviceKey = process.env.SUPABASE_SERVICE_KEY || 'sb_secret_y9EP8_t7JHNGbdaRAHdRzA_zY4AsKZD';
        
        console.log('🔗 SupabaseAPI inicializado');
        console.log('URL:', this.url);
        console.log('API Key configurada:', !!this.apiKey);
    }

    // Salvar análise de conteúdo
    async saveContentAnalysis(analysisData) {
        try {
            console.log('💾 Salvando análise via Supabase API...');
            
            const response = await fetch(`${this.url}/rest/v1/analises_conteudo`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.serviceKey}`,
                    'apikey': this.apiKey,
                    'Prefer': 'return=minimal'
                },
                body: JSON.stringify({
                    title: analysisData.title,
                    content: analysisData.content,
                    confidence: analysisData.confidence,
                    risk_level: analysisData.riskLevel,
                    is_fake_news: analysisData.isFakeNews,
                    reasons: JSON.stringify(analysisData.reasons),
                    recommendations: JSON.stringify(analysisData.recommendations),
                    detailed_analysis: analysisData.detailedAnalysis,
                    source: analysisData.source || 'Groq'
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Supabase API error: ${response.status} - ${errorText}`);
            }

            console.log('✅ Análise salva com sucesso via Supabase API');
            return { success: true };

        } catch (error) {
            console.error('❌ Erro ao salvar via Supabase API:', error);
            throw error;
        }
    }

    // Buscar análises recentes
    async getRecentAnalyses(limit = 5) {
        try {
            console.log('📊 Buscando análises recentes via Supabase API...');
            
            const response = await fetch(`${this.url}/rest/v1/analises_conteudo?order=created_at.desc&limit=${limit}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.serviceKey}`,
                    'apikey': this.apiKey
                }
            });

            if (!response.ok) {
                throw new Error(`Supabase API error: ${response.status}`);
            }

            const data = await response.json();
            console.log(`✅ ${data.length} análises encontradas via Supabase API`);
            return data;

        } catch (error) {
            console.error('❌ Erro ao buscar análises via Supabase API:', error);
            return [];
        }
    }

    // Contar análises
    async getAnalysisCounts() {
        try {
            console.log('📊 Contando análises via Supabase API...');
            
            // Total de análises
            const totalResponse = await fetch(`${this.url}/rest/v1/analises_conteudo?select=count`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.serviceKey}`,
                    'apikey': this.apiKey
                }
            });

            // Fake news
            const fakeResponse = await fetch(`${this.url}/rest/v1/analises_conteudo?is_fake_news=eq.true&select=count`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.serviceKey}`,
                    'apikey': this.apiKey
                }
            });

            const totalCount = totalResponse.ok ? await totalResponse.json() : 0;
            const fakeCount = fakeResponse.ok ? await fakeResponse.json() : 0;

            return {
                total: Array.isArray(totalCount) ? totalCount.length : 0,
                fake: Array.isArray(fakeCount) ? fakeCount.length : 0
            };

        } catch (error) {
            console.error('❌ Erro ao contar análises via Supabase API:', error);
            return { total: 0, fake: 0 };
        }
    }

    // Testar conexão
    async testConnection() {
        try {
            console.log('🔍 Testando conexão com Supabase API...');
            
            const response = await fetch(`${this.url}/rest/v1/analises_conteudo?select=id&limit=1`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.serviceKey}`,
                    'apikey': this.apiKey
                }
            });

            if (response.ok) {
                console.log('✅ Conexão com Supabase API funcionando');
                return true;
            } else {
                console.log('❌ Erro na conexão com Supabase API:', response.status);
                return false;
            }

        } catch (error) {
            console.error('❌ Erro ao testar Supabase API:', error);
            return false;
        }
    }
}

export default SupabaseAPI;
