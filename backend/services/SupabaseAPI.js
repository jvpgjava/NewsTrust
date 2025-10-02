import fetch from 'node-fetch';

class SupabaseAPI {
    constructor() {
        this.url = process.env.SUPABASE_URL || 'https://wbbxqslgutfxldmyuekb.supabase.co';
        this.apiKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndiYnhxc2xndXRmeGxkbXl1ZWtiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4MTAyMTYsImV4cCI6MjA3NDM4NjIxNn0.BhJwsc7g-4WBXYvcvDY11FVFoG1mXHKjF3zpms_lNKc';
        this.serviceKey = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndiYnhxc2xndXRmeGxkbXl1ZWtiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODgxMDIxNiwiZXhwIjoyMDc0Mzg2MjE2fQ.a71p5Aigaq2Hz1tarGJi5r2g2o6X9EYtJGurEG8PRZE';
        
        console.log('🔗 SupabaseAPI inicializado');
        console.log('URL:', this.url);
        console.log('API Key configurada:', !!this.apiKey);
        console.log('Service Key configurada:', !!this.serviceKey);
        console.log('API Key (primeiros 10 chars):', this.apiKey?.substring(0, 10));
        console.log('Service Key (primeiros 10 chars):', this.serviceKey?.substring(0, 10));
    }

    // Salvar análise de conteúdo
    async saveContentAnalysis(analysisData) {
        try {
            console.log('💾 Salvando análise via Supabase API...');
            
            const payload = {
                title: analysisData.title,
                content: analysisData.content,
                confidence: analysisData.confidence,
                risk_level: analysisData.riskLevel,
                is_fake_news: analysisData.isFakeNews,
                reasons: JSON.stringify(analysisData.reasons),
                recommendations: JSON.stringify(analysisData.recommendations),
                detailed_analysis: analysisData.detailedAnalysis,
                source: analysisData.source || 'Groq'
            };
            
            console.log('🔍 Payload para Supabase:', payload);
            console.log('🔍 URL completa:', `${this.url}/rest/v1/analises_conteudo`);
            
            const response = await fetch(`${this.url}/rest/v1/analises_conteudo`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.serviceKey}`,
                    'apikey': this.apiKey,
                    'Prefer': 'return=minimal'
                },
                body: JSON.stringify(payload)
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
