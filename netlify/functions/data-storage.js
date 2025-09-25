// Armazenamento simples em memória para as análises
// Em produção, isso deveria ser um banco de dados real

let analysesData = {
  sources: [],
  news: [],
  analyses: [],
  dashboard: {
    sourcesCount: 0,
    connectionsCount: 0,
    newsCount: 0,
    fakeNewsCount: 0,
    trendData: [],
    riskDistribution: { low: 0, medium: 0, high: 0 }
  }
};

// Função para adicionar nova análise de fonte
function addSourceAnalysis(analysis) {
  analysesData.sources.push({
    id: Date.now(),
    name: analysis.name,
    url: analysis.url,
    credibility: analysis.credibility,
    trustScore: analysis.trustScore,
    createdAt: new Date().toISOString()
  });
  
  // Atualizar contadores
  analysesData.dashboard.sourcesCount = analysesData.sources.length;
  analysesData.dashboard.connectionsCount = Math.floor(analysesData.sources.length * 2.8);
  
  // Atualizar distribuição de risco
  updateRiskDistribution();
  
  console.log('📊 Nova análise de fonte adicionada:', analysis.name);
}

// Função para adicionar nova análise de conteúdo
function addContentAnalysis(analysis) {
  analysesData.analyses.push({
    id: Date.now(),
    title: analysis.title,
    credibility: analysis.credibility,
    riskLevel: analysis.riskLevel,
    createdAt: new Date().toISOString()
  });
  
  // Atualizar contadores
  analysesData.dashboard.newsCount = analysesData.analyses.length;
  analysesData.dashboard.fakeNewsCount = analysesData.analyses.filter(a => a.riskLevel === 'high').length;
  
  // Atualizar distribuição de risco
  updateRiskDistribution();
  
  console.log('📊 Nova análise de conteúdo adicionada:', analysis.title);
}

// Função para atualizar distribuição de risco
function updateRiskDistribution() {
  const allAnalyses = [...analysesData.sources, ...analysesData.analyses];
  const total = allAnalyses.length;
  
  if (total === 0) {
    analysesData.dashboard.riskDistribution = { low: 0, medium: 0, high: 0 };
    return;
  }
  
  const low = allAnalyses.filter(a => a.credibility >= 80).length;
  const medium = allAnalyses.filter(a => a.credibility >= 60 && a.credibility < 80).length;
  const high = allAnalyses.filter(a => a.credibility < 60).length;
  
  analysesData.dashboard.riskDistribution = {
    low: Math.round((low / total) * 100),
    medium: Math.round((medium / total) * 100),
    high: Math.round((high / total) * 100)
  };
}

// Função para gerar dados da rede
function generateNetworkData() {
  const sources = analysesData.sources.map((source, index) => ({
    id: source.id,
    name: source.name,
    credibility: source.credibility,
    type: 'source'
  }));
  
  const news = analysesData.analyses.map((analysis, index) => ({
    id: analysis.id,
    title: analysis.title,
    credibility: analysis.credibility,
    type: 'news'
  }));
  
  // Gerar conexões baseadas nas análises
  const connections = [];
  for (let i = 0; i < sources.length - 1; i++) {
    if (Math.random() > 0.5) {
      connections.push({
        source: sources[i].id,
        target: sources[i + 1].id,
        strength: Math.random() * 0.5 + 0.3
      });
    }
  }
  
  return {
    sources: {
      nodes: sources,
      connections: connections
    },
    news: {
      nodes: news,
      connections: []
    }
  };
}

// Função para obter dados atualizados
function getUpdatedData() {
  const network = generateNetworkData();
  
  return {
    hasUpdates: true,
    timestamp: new Date().toISOString(),
    newNews: [],
    newAnalyses: analysesData.analyses.slice(-5), // Últimas 5 análises
    newSources: analysesData.sources.slice(-5), // Últimas 5 fontes
    dashboard: analysesData.dashboard,
    recentAnalyses: analysesData.analyses.slice(-10), // Últimas 10 análises
    network: network
  };
}

module.exports = {
  addSourceAnalysis,
  addContentAnalysis,
  getUpdatedData,
  analysesData
};
