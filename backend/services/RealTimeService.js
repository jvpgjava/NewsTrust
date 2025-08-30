import { WebSocketServer } from 'ws';
import { query } from '../config/database.js';

class RealTimeService {
  constructor() {
    this.wss = null;
    this.clients = new Set();
    this.updateInterval = null;
  }

  initialize(server) {
    this.wss = new WebSocketServer({ server });

    this.wss.on('connection', (ws) => {
      console.log('🔌 Cliente WebSocket conectado');
      this.clients.add(ws);

      // Enviar dados iniciais
      this.sendInitialData(ws);

      ws.on('close', () => {
        console.log('🔌 Cliente WebSocket desconectado');
        this.clients.delete(ws);
      });

      ws.on('error', (error) => {
        console.error('❌ Erro no WebSocket:', error);
        this.clients.delete(ws);
      });
    });

    console.log('✅ Serviço de tempo real inicializado');
  }

  async sendInitialData(ws) {
    try {
      const dashboardData = await this.getDashboardData();
      const networkData = await this.getNetworkData();
      const recentAnalyses = await this.getRecentAnalyses();

      ws.send(JSON.stringify({
        type: 'initial_data',
        data: {
          dashboard: dashboardData,
          network: networkData,
          recentAnalyses: recentAnalyses
        }
      }));
    } catch (error) {
      console.error('❌ Erro ao enviar dados iniciais:', error);
    }
  }

  async getDashboardData() {
    try {
      // Contar fontes analisadas
      const sourcesResult = await query('SELECT COUNT(*) as count FROM fontes');
      const sourcesCount = parseInt(sourcesResult.rows[0].count);

      // Contar notícias verificadas (análises de conteúdo)
      const newsResult = await query('SELECT COUNT(*) as count FROM analises_conteudo');
      const newsCount = parseInt(newsResult.rows[0].count);

      // Contar fake news detectadas
      const fakeNewsResult = await query('SELECT COUNT(*) as count FROM analises_conteudo WHERE is_fake_news = true');
      const fakeNewsCount = parseInt(fakeNewsResult.rows[0].count);

      // Gerar conexões dinamicamente para contar
      const networkData = await this.getNetworkData();
      const connectionsCount = networkData.sources.connections.length + networkData.news.connections.length;

      // Dados de tendência (últimos 6 meses)
      const trendResult = await query(`
        SELECT 
          DATE_TRUNC('month', created_at) as month,
          COUNT(*) as count
        FROM analises_conteudo 
        WHERE created_at >= NOW() - INTERVAL '6 months'
        GROUP BY DATE_TRUNC('month', created_at)
        ORDER BY month
      `);

      const trendData = trendResult.rows.map(row => ({
        month: row.month.toISOString().slice(0, 7),
        count: parseInt(row.count)
      }));

      // Distribuição de risco
      const riskResult = await query(`
        SELECT 
          risk_level,
          COUNT(*) as count
        FROM (
          SELECT 
            CASE 
              WHEN peso >= 0.8 THEN 'baixo'
              WHEN peso >= 0.6 THEN 'medio'
              ELSE 'alto'
            END as risk_level
          FROM fontes
          UNION ALL
          SELECT 
            CASE 
              WHEN confidence >= 0.8 THEN 'baixo'
              WHEN confidence >= 0.6 THEN 'medio'
              ELSE 'alto'
            END as risk_level
          FROM analises_conteudo
        ) risk_data
        GROUP BY risk_level
      `);

      const riskDistribution = {
        baixo: 0,
        medio: 0,
        alto: 0
      };

      riskResult.rows.forEach(row => {
        riskDistribution[row.risk_level] = parseInt(row.count);
      });

      const totalRisk = riskDistribution.baixo + riskDistribution.medio + riskDistribution.alto;

      return {
        sourcesCount,
        connectionsCount,
        newsCount,
        fakeNewsCount,
        trendData,
        riskDistribution: {
          baixo: totalRisk > 0 ? Math.round((riskDistribution.baixo / totalRisk) * 100) : 0,
          medio: totalRisk > 0 ? Math.round((riskDistribution.medio / totalRisk) * 100) : 0,
          alto: totalRisk > 0 ? Math.round((riskDistribution.alto / totalRisk) * 100) : 0
        }
      };
    } catch (error) {
      console.error('❌ Erro ao buscar dados do dashboard:', error);
      return {
        sourcesCount: 0,
        connectionsCount: 0,
        newsCount: 0,
        fakeNewsCount: 0,
        trendData: [],
        riskDistribution: { baixo: 0, medio: 0, alto: 0 }
      };
    }
  }

  async getNetworkData() {
    try {
      console.log('🔍 Buscando dados da rede...');

      // Dados para o grafo de fontes
      const sourcesResult = await query(`
        SELECT 
          id,
          nome,
          site,
          peso,
          tipo
        FROM fontes 
        ORDER BY created_at DESC
      `);

      console.log('📊 Fontes encontradas:', sourcesResult.rows.length);

      const sourcesNodes = sourcesResult.rows.map(row => ({
        id: row.id,
        name: row.nome,
        site: row.site,
        credibility: parseFloat(row.peso) || 0.5,
        type: row.tipo,
        nodeType: 'source'
      }));

      // Dados para o grafo de notícias
      const newsResult = await query(`
        SELECT 
          id,
          title,
          content,
          is_fake_news,
          confidence,
          risk_level
        FROM analises_conteudo 
        ORDER BY created_at DESC
      `);

      console.log('📊 Notícias encontradas:', newsResult.rows.length);

      const newsNodes = newsResult.rows.map(row => ({
        id: `news_${row.id}`,
        name: row.title.substring(0, 30) + (row.title.length > 30 ? '...' : ''),
        content: row.content,
        isFakeNews: row.is_fake_news,
        confidence: parseFloat(row.confidence) || 0.5,
        riskLevel: row.risk_level,
        nodeType: 'news'
      }));

      // Gerar conexões entre fontes baseadas em similaridade de credibilidade
      const sourceConnections = this.generateSourceConnections(sourcesNodes);

      // Gerar conexões entre notícias baseadas em similaridade de conteúdo e credibilidade
      const newsConnections = this.generateNewsConnections(newsNodes);

      const result = {
        sources: {
          nodes: sourcesNodes,
          connections: sourceConnections
        },
        news: {
          nodes: newsNodes,
          connections: newsConnections
        }
      };

      console.log('✅ Dados da rede preparados:', {
        sources: {
          nodes: result.sources.nodes.length,
          connections: result.sources.connections.length
        },
        news: {
          nodes: result.news.nodes.length,
          connections: result.news.connections.length
        },
        totalConnections: result.sources.connections.length + result.news.connections.length
      });

      return result;
    } catch (error) {
      console.error('❌ Erro ao buscar dados da rede:', error);
      return {
        sources: { nodes: [], connections: [] },
        news: { nodes: [], connections: [] }
      };
    }
  }

  async getRecentAnalyses() {
    try {
      // Análises de fonte recentes
      const sourceAnalyses = await query(`
        SELECT 
          'source' as type,
          nome as title,
          site as url,
          peso as credibility,
          created_at
        FROM fontes 
        ORDER BY created_at DESC 
        LIMIT 5
      `);

      // Análises de conteúdo recentes
      const contentAnalyses = await query(`
        SELECT 
          'content' as type,
          title,
          '' as url,
          confidence as credibility,
          created_at
        FROM analises_conteudo 
        ORDER BY created_at DESC 
        LIMIT 5
      `);

      // Combinar e ordenar por data
      const allAnalyses = [...sourceAnalyses.rows, ...contentAnalyses.rows]
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 10);

      return allAnalyses.map(analysis => ({
        ...analysis,
        created_at: analysis.created_at.toISOString()
      }));
    } catch (error) {
      console.error('❌ Erro ao buscar análises recentes:', error);
      return [];
    }
  }

  // Método para notificar todos os clientes sobre uma nova análise
  async notifyNewAnalysis(analysisType, analysisData) {
    try {
      console.log(`📡 Notificando nova análise: ${analysisType}`);
      console.log(`📊 Clientes conectados: ${this.clients.size}`);

      // Buscar dados atualizados
      const dashboardData = await this.getDashboardData();
      const networkData = await this.getNetworkData();
      const recentAnalyses = await this.getRecentAnalyses();

      const updateMessage = {
        type: 'update',
        data: {
          dashboard: dashboardData,
          network: networkData,
          recentAnalyses: recentAnalyses,
          newAnalysis: {
            type: analysisType,
            data: analysisData
          }
        }
      };

      console.log('📨 Mensagem de atualização preparada:', {
        dashboard: {
          sources: dashboardData.sourcesCount,
          news: dashboardData.newsCount,
          fakeNews: dashboardData.fakeNewsCount,
          connections: dashboardData.connectionsCount
        },
        network: {
          sources: networkData.sources.nodes.length,
          news: networkData.news.nodes.length,
          sourceConnections: networkData.sources.connections.length,
          newsConnections: networkData.news.connections.length
        },
        recentAnalyses: recentAnalyses.length
      });

      // Enviar para todos os clientes conectados
      let sentCount = 0;
      this.clients.forEach(client => {
        if (client.readyState === 1) { // WebSocket.OPEN
          try {
            client.send(JSON.stringify(updateMessage));
            sentCount++;
          } catch (sendError) {
            console.error('❌ Erro ao enviar para cliente:', sendError);
            this.clients.delete(client);
          }
        } else {
          // Remover clientes não conectados
          this.clients.delete(client);
        }
      });

      console.log(`✅ Atualização enviada para ${sentCount}/${this.clients.size} clientes`);
    } catch (error) {
      console.error('❌ Erro ao notificar nova análise:', error);
    }
  }

  // Método para notificar sobre nova fonte
  async notifyNewSource(sourceData) {
    console.log('📡 Notificando nova fonte:', sourceData);
    await this.notifyNewAnalysis('source', sourceData);
  }

  // Método para notificar sobre nova análise de conteúdo
  async notifyNewContentAnalysis(contentData) {
    await this.notifyNewAnalysis('content', contentData);
  }

  /**
   * Gera conexões entre fontes baseadas APENAS em similaridade de credibilidade
   */
  generateSourceConnections(sources) {
    const connections = [];

    // Se há menos de 2 fontes, não há conexões possíveis
    if (sources.length < 2) {
      console.log('🔗 Poucas fontes para gerar conexões');
      return connections;
    }

    for (let i = 0; i < sources.length; i++) {
      for (let j = i + 1; j < sources.length; j++) {
        const source1 = sources[i];
        const source2 = sources[j];

        // Calcular similaridade de credibilidade (0-1)
        const credibilityDiff = Math.abs(source1.credibility - source2.credibility);
        const similarity = 1 - credibilityDiff; // Quanto mais similar, maior o valor

        // Conectar APENAS se a similaridade de credibilidade for maior que 0.7 (70%)
        // Isso garante que apenas fontes com credibilidade realmente similar se conectem
        if (similarity > 0.7) {
          console.log(`🔗 Conectando fontes: ${source1.name} (${(source1.credibility * 100).toFixed(0)}%) ↔ ${source2.name} (${(source2.credibility * 100).toFixed(0)}%) - Similaridade: ${(similarity * 100).toFixed(0)}%`);
          connections.push({
            source: source1.id,
            target: source2.id,
            weight: similarity,
            type: 'credibility_similarity',
            label: `Similaridade: ${(similarity * 100).toFixed(0)}%`
          });
        } else {
          console.log(`❌ Não conectando: ${source1.name} (${(source1.credibility * 100).toFixed(0)}%) ↔ ${source2.name} (${(source2.credibility * 100).toFixed(0)}%) - Similaridade: ${(similarity * 100).toFixed(0)}% (muito baixa)`);
        }
      }
    }

    console.log(`🔗 Geradas ${connections.length} conexões entre ${sources.length} fontes (baseadas em credibilidade similar)`);
    return connections;
  }

  /**
   * Gera conexões entre notícias baseadas APENAS em similaridade de conteúdo
   */
  generateNewsConnections(news) {
    const connections = [];

    // Se há menos de 2 notícias, não há conexões possíveis
    if (news.length < 2) {
      console.log('🔗 Poucas notícias para gerar conexões');
      return connections;
    }

    for (let i = 0; i < news.length; i++) {
      for (let j = i + 1; j < news.length; j++) {
        const news1 = news[i];
        const news2 = news[j];

        // Calcular similaridade de conteúdo (baseado em palavras-chave)
        const contentSimilarity = this.calculateContentSimilarity(news1.content, news2.content);

        // Conectar se a similaridade de conteúdo for maior que 0.2 (20%)
        if (contentSimilarity > 0.2) {
          connections.push({
            source: news1.id,
            target: news2.id,
            weight: contentSimilarity,
            type: 'content_similarity',
            label: `Similaridade: ${(contentSimilarity * 100).toFixed(0)}%`
          });
        }
      }
    }

    console.log(`🔗 Geradas ${connections.length} conexões entre ${news.length} notícias (baseadas em conteúdo)`);
    return connections;
  }

  /**
   * Calcula similaridade de conteúdo entre duas notícias
   */
  calculateContentSimilarity(content1, content2) {
    try {
      if (!content1 || !content2) return 0;

      // Extrair palavras-chave (palavras com mais de 2 caracteres)
      const words1 = content1.toLowerCase()
        .replace(/[^\w\s]/g, '')
        .split(/\s+/)
        .filter(word => word.length > 2);

      const words2 = content2.toLowerCase()
        .replace(/[^\w\s]/g, '')
        .split(/\s+/)
        .filter(word => word.length > 2);

      // Se não há palavras suficientes, retornar similaridade baixa mas não zero
      if (words1.length < 2 || words2.length < 2) {
        return 0.1; // Similaridade mínima
      }

      // Calcular interseção de palavras
      const set1 = new Set(words1);
      const set2 = new Set(words2);
      const intersection = new Set([...set1].filter(x => set2.has(x)));

      // Calcular união de palavras
      const union = new Set([...set1, ...set2]);

      // Similaridade Jaccard
      const similarity = union.size > 0 ? intersection.size / union.size : 0;

      // Garantir que sempre há alguma similaridade mínima
      return Math.max(similarity, 0.05);
    } catch (error) {
      console.error('Erro ao calcular similaridade de conteúdo:', error);
      return 0.05; // Similaridade mínima em caso de erro
    }
  }
}

export default new RealTimeService();
