// Armazenamento persistente usando arquivo JSON
const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join('/tmp', 'analyses-data.json');

// Função para carregar dados do arquivo
function loadData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = fs.readFileSync(DATA_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Erro ao carregar dados:', error);
  }
  
  // Retornar dados padrão se não conseguir carregar
  return {
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
}

// Função para salvar dados no arquivo
function saveData(data) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
    console.log('💾 Dados salvos com sucesso');
  } catch (error) {
    console.error('Erro ao salvar dados:', error);
  }
}

// Carregar dados iniciais
let analysesData = loadData();

// Função para adicionar nova análise de fonte
function addSourceAnalysis(analysis) {
  // Recarregar dados do arquivo
  analysesData = loadData();
  
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
  
  // Salvar dados no arquivo
  saveData(analysesData);
  
  console.log('📊 Nova análise de fonte adicionada:', analysis.name);
}

// Função para adicionar nova análise de conteúdo
function addContentAnalysis(analysis) {
  // Recarregar dados do arquivo
  analysesData = loadData();
  
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
  
  // Salvar dados no arquivo
  saveData(analysesData);
  
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
function generateNetworkData(data) {
  const sources = data.sources.map((source, index) => ({
    id: source.id,
    name: source.name,
    credibility: source.credibility,
    type: 'source'
  }));
  
  const news = data.analyses.map((analysis, index) => ({
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
  // Sempre recarregar dados do arquivo para ter os mais recentes
  const currentData = loadData();
  const network = generateNetworkData(currentData);
  
  return {
    hasUpdates: true,
    timestamp: new Date().toISOString(),
    newNews: [],
    newAnalyses: currentData.analyses.slice(-5), // Últimas 5 análises
    newSources: currentData.sources.slice(-5), // Últimas 5 fontes
    dashboard: currentData.dashboard,
    recentAnalyses: currentData.analyses.slice(-10), // Últimas 10 análises
    network: network
  };
}

module.exports = {
  addSourceAnalysis,
  addContentAnalysis,
  getUpdatedData,
  analysesData
};
