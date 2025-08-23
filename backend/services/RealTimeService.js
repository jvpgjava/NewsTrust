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

      // Contar conexões de confiança
      const connectionsResult = await query('SELECT COUNT(*) as count FROM conexoes_confianca');
      const connectionsCount = parseInt(connectionsResult.rows[0].count);

      // Contar notícias verificadas (análises de conteúdo)
      const newsResult = await query('SELECT COUNT(*) as count FROM analises_conteudo');
      const newsCount = parseInt(newsResult.rows[0].count);

      // Contar fake news detectadas
      const fakeNewsResult = await query('SELECT COUNT(*) as count FROM analises_conteudo WHERE is_fake_news = true');
      const fakeNewsCount = parseInt(fakeNewsResult.rows[0].count);

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
        credibility: row.peso,
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
        confidence: row.confidence,
        riskLevel: row.risk_level,
        nodeType: 'news'
      }));

      const result = {
        sources: {
          nodes: sourcesNodes,
          connections: [] // Implementar conexões baseadas em similaridade
        },
        news: {
          nodes: newsNodes,
          connections: [] // Implementar conexões baseadas em conteúdo similar
        }
      };

      console.log('✅ Dados da rede preparados:', {
        sources: result.sources.nodes.length,
        news: result.news.nodes.length
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
        dashboard: dashboardData.sourcesCount,
        network: {
          sources: networkData.sources.nodes.length,
          news: networkData.news.nodes.length
        },
        recentAnalyses: recentAnalyses.length
      });

      // Enviar para todos os clientes conectados
      let sentCount = 0;
      this.clients.forEach(client => {
        if (client.readyState === 1) { // WebSocket.OPEN
          client.send(JSON.stringify(updateMessage));
          sentCount++;
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
}

export default new RealTimeService();
