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
                reasons: Array.isArray(analysisData.reasons) ? analysisData.reasons : [],
                recommendations: Array.isArray(analysisData.recommendations) ? analysisData.recommendations : [],
                detailed_analysis: analysisData.detailedAnalysis || ''
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
            
            const response = await fetch(`${this.url}/rest/v1/analises_conteudo?select=*&order=created_at.desc&limit=${limit}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.serviceKey}`,
                    'apikey': this.apiKey,
                    'Content-Type': 'application/json'
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
            
            // Total de análises - buscar todos os registros
            const totalResponse = await fetch(`${this.url}/rest/v1/analises_conteudo?select=id`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.serviceKey}`,
                    'apikey': this.apiKey,
                    'Content-Type': 'application/json'
                }
            });

            // Fake news - buscar apenas fake news
            const fakeResponse = await fetch(`${this.url}/rest/v1/analises_conteudo?is_fake_news=eq.true&select=id`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.serviceKey}`,
                    'apikey': this.apiKey,
                    'Content-Type': 'application/json'
                }
            });

            const totalData = totalResponse.ok ? await totalResponse.json() : [];
            const fakeData = fakeResponse.ok ? await fakeResponse.json() : [];

            console.log(`📊 Total: ${totalData.length}, Fake: ${fakeData.length}`);

            return {
                total: Array.isArray(totalData) ? totalData.length : 0,
                fake: Array.isArray(fakeData) ? fakeData.length : 0
            };

        } catch (error) {
            console.error('❌ Erro ao contar análises via Supabase API:', error);
            return { total: 0, fake: 0 };
        }
    }

    // Buscar fontes recentes
    async getRecentSources(limit = 10) {
        try {
            console.log('📊 Buscando fontes recentes via Supabase API...');
            
            const response = await fetch(`${this.url}/rest/v1/fontes?select=*&order=created_at.desc&limit=${limit}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.serviceKey}`,
                    'apikey': this.apiKey,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`Supabase API error: ${response.status}`);
            }

            const data = await response.json();
            console.log(`✅ ${data.length} fontes encontradas via Supabase API`);
            return data;

        } catch (error) {
            console.error('❌ Erro ao buscar fontes via Supabase API:', error);
            return [];
        }
    }

    // Contar fontes
    async getSourceCounts() {
        try {
            console.log('📊 Contando fontes via Supabase API...');
            
            const response = await fetch(`${this.url}/rest/v1/fontes?select=id`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.serviceKey}`,
                    'apikey': this.apiKey,
                    'Content-Type': 'application/json'
                }
            });

            const data = response.ok ? await response.json() : [];
            console.log(`📊 Total de fontes: ${data.length}`);

            return {
                total: Array.isArray(data) ? data.length : 0
            };

        } catch (error) {
            console.error('❌ Erro ao contar fontes via Supabase API:', error);
            return { total: 0 };
        }
    }

    // Salvar análise de fonte
    async saveSourceAnalysis(sourceData) {
        try {
            console.log('💾 Salvando fonte via Supabase API...');
            
            const payload = {
                nome: sourceData.nome,
                site: sourceData.site,
                peso: sourceData.peso,
                tipo: sourceData.tipo,
                descricao: sourceData.descricao,
                external_data: sourceData.externalData || {}
            };
            
            console.log('🔍 Payload para Supabase (fontes):', payload);
            
            const response = await fetch(`${this.url}/rest/v1/fontes`, {
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

            console.log('✅ Fonte salva com sucesso via Supabase API');
            return { success: true };

        } catch (error) {
            console.error('❌ Erro ao salvar fonte via Supabase API:', error);
            throw error;
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
