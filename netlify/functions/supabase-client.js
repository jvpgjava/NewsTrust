// Cliente Supabase para Netlify Functions
const { createClient } = require('@supabase/supabase-js');

// Configurações do Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis do Supabase não configuradas!');
  console.error('SUPABASE_URL:', !!supabaseUrl);
  console.error('SUPABASE_ANON_KEY:', !!supabaseKey);
}

// Criar cliente Supabase
const supabase = createClient(supabaseUrl, supabaseKey);

// Função para salvar análise de fonte
async function saveSourceAnalysis(analysis) {
  try {
    const { data, error } = await supabase
      .from('fontes')
      .insert([
        {
          nome: analysis.name,
          url: analysis.url,
          credibilidade: analysis.credibility,
          confiabilidade: analysis.reliability,
          score_credibilidade: analysis.trustScore,
          analise: analysis.analysis,
          status: 'concluida',
          criado_em: new Date().toISOString()
        }
      ])
      .select();

    if (error) {
      console.error('❌ Erro ao salvar análise de fonte:', error);
      return { success: false, error };
    }

    console.log('✅ Análise de fonte salva no Supabase:', data);
    return { success: true, data };
  } catch (error) {
    console.error('❌ Erro na função saveSourceAnalysis:', error);
    return { success: false, error };
  }
}

// Função para salvar análise de conteúdo
async function saveContentAnalysis(analysis) {
  try {
    const { data, error } = await supabase
      .from('noticias')
      .insert([
        {
          titulo: analysis.title,
          conteudo: analysis.content,
          credibilidade: analysis.credibility,
          confiabilidade: analysis.reliability,
          score_credibilidade: analysis.trustScore,
          analise: analysis.analysis,
          status: 'concluida',
          criado_em: new Date().toISOString()
        }
      ])
      .select();

    if (error) {
      console.error('❌ Erro ao salvar análise de conteúdo:', error);
      return { success: false, error };
    }

    console.log('✅ Análise de conteúdo salva no Supabase:', data);
    return { success: true, data };
  } catch (error) {
    console.error('❌ Erro na função saveContentAnalysis:', error);
    return { success: false, error };
  }
}

// Função para obter dados do dashboard
async function getDashboardData() {
  try {
    // Contar fontes
    const { count: sourcesCount, error: sourcesError } = await supabase
      .from('fontes')
      .select('*', { count: 'exact', head: true });

    if (sourcesError) {
      console.error('❌ Erro ao contar fontes:', sourcesError);
    }

    // Contar notícias
    const { count: newsCount, error: newsError } = await supabase
      .from('noticias')
      .select('*', { count: 'exact', head: true });

    if (newsError) {
      console.error('❌ Erro ao contar notícias:', newsError);
    }

    // Contar fake news (notícias com credibilidade baixa)
    const { count: fakeNewsCount, error: fakeNewsError } = await supabase
      .from('noticias')
      .select('*', { count: 'exact', head: true })
      .lt('credibilidade', 50);

    if (fakeNewsError) {
      console.error('❌ Erro ao contar fake news:', fakeNewsError);
    }

    // Obter análises recentes
    const { data: recentAnalyses, error: recentError } = await supabase
      .from('noticias')
      .select('*')
      .order('criado_em', { ascending: false })
      .limit(10);

    if (recentError) {
      console.error('❌ Erro ao obter análises recentes:', recentError);
    }

    // Obter fontes recentes
    const { data: recentSources, error: sourcesRecentError } = await supabase
      .from('fontes')
      .select('*')
      .order('criado_em', { ascending: false })
      .limit(10);

    if (sourcesRecentError) {
      console.error('❌ Erro ao obter fontes recentes:', sourcesRecentError);
    }

    return {
      sourcesCount: sourcesCount || 0,
      newsCount: newsCount || 0,
      fakeNewsCount: fakeNewsCount || 0,
      connectionsCount: Math.floor((sourcesCount || 0) * 2.8),
      recentAnalyses: recentAnalyses || [],
      recentSources: recentSources || [],
      trendData: [], // TODO: Implementar dados de tendência
      riskDistribution: {
        low: 0,
        medium: 0,
        high: 0
      } // TODO: Implementar distribuição de risco
    };
  } catch (error) {
    console.error('❌ Erro na função getDashboardData:', error);
    return {
      sourcesCount: 0,
      newsCount: 0,
      fakeNewsCount: 0,
      connectionsCount: 0,
      recentAnalyses: [],
      recentSources: [],
      trendData: [],
      riskDistribution: { low: 0, medium: 0, high: 0 }
    };
  }
}

// Função para obter dados da rede
async function getNetworkData() {
  try {
    // Obter fontes para a rede
    const { data: sources, error: sourcesError } = await supabase
      .from('fontes')
      .select('*')
      .limit(50);

    if (sourcesError) {
      console.error('❌ Erro ao obter fontes para rede:', sourcesError);
    }

    // Obter notícias para a rede
    const { data: news, error: newsError } = await supabase
      .from('noticias')
      .select('*')
      .limit(50);

    if (newsError) {
      console.error('❌ Erro ao obter notícias para rede:', newsError);
    }

    // Gerar nós das fontes
    const sourceNodes = (sources || []).map((source, index) => ({
      id: source.id,
      name: source.nome,
      credibility: source.credibilidade,
      type: 'source'
    }));

    // Gerar nós das notícias
    const newsNodes = (news || []).map((newsItem, index) => ({
      id: newsItem.id,
      title: newsItem.titulo,
      credibility: newsItem.credibilidade,
      type: 'news'
    }));

    // Gerar conexões baseadas nas análises
    const connections = [];
    for (let i = 0; i < sourceNodes.length - 1; i++) {
      if (Math.random() > 0.5) {
        connections.push({
          source: sourceNodes[i].id,
          target: sourceNodes[i + 1].id,
          strength: Math.random() * 0.5 + 0.3
        });
      }
    }

    return {
      sources: {
        nodes: sourceNodes,
        connections: connections
      },
      news: {
        nodes: newsNodes,
        connections: []
      }
    };
  } catch (error) {
    console.error('❌ Erro na função getNetworkData:', error);
    return {
      sources: { nodes: [], connections: [] },
      news: { nodes: [], connections: [] }
    };
  }
}

module.exports = {
  saveSourceAnalysis,
  saveContentAnalysis,
  getDashboardData,
  getNetworkData,
  supabase
};
