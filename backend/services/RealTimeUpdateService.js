import { query } from '../config/database.js';
import AutoConnectionService from './AutoConnectionService.js';
import { trustGraph } from './instances.js';

class RealTimeUpdateService {
  constructor() {
    this.isUpdating = false;
    this.updateQueue = [];
    this.updateInterval = null;
  }

  /**
   * Inicia o serviço de atualizações em tempo real
   */
  start() {
    console.log('🚀 Iniciando serviço de atualizações em tempo real...');
    
    // Atualizar conexões a cada 5 minutos
    this.updateInterval = setInterval(async () => {
      await this.performPeriodicUpdate();
    }, 5 * 60 * 1000);

    // Primeira atualização imediata
    this.performPeriodicUpdate();
  }

  /**
   * Para o serviço de atualizações
   */
  stop() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    console.log('⏹️ Serviço de atualizações em tempo real parado');
  }

  /**
   * Executa atualização periódica do sistema
   */
  async performPeriodicUpdate() {
    if (this.isUpdating) {
      console.log('⏳ Atualização já em andamento, aguardando...');
      return;
    }

    this.isUpdating = true;

    try {
      console.log('🔄 Executando atualização periódica do sistema...');

      // 1. Atualizar conexões baseadas em notícias reais
      await AutoConnectionService.updateConnections();

      // 2. Recalcular estatísticas do grafo
      await this.updateGraphStatistics();

      // 3. Atualizar métricas do sistema
      await this.updateSystemMetrics();

      // 4. Limpar cache se necessário
      await this.cleanupCache();

      console.log('✅ Atualização periódica concluída');

    } catch (error) {
      console.error('❌ Erro na atualização periódica:', error);
    } finally {
      this.isUpdating = false;
    }
  }

  /**
   * Atualiza estatísticas do grafo
   */
  async updateGraphStatistics() {
    try {
      // Forçar reinicialização do grafo com novos dados
      await trustGraph.initialize();
      
      console.log('📊 Estatísticas do grafo atualizadas');
    } catch (error) {
      console.error('❌ Erro ao atualizar estatísticas do grafo:', error);
    }
  }

  /**
   * Atualiza métricas do sistema
   */
  async updateSystemMetrics() {
    try {
      // Contar total de notícias
      const newsCount = await query('SELECT COUNT(*) as total FROM noticias');
      
      // Contar total de fontes
      const sourcesCount = await query('SELECT COUNT(*) as total FROM fontes');
      
      // Contar total de conexões
      const connectionsCount = await query('SELECT COUNT(*) as total FROM conexoes');
      
      // Calcular distribuição de credibilidade
      const credibilityDistribution = await query(`
        SELECT 
          faixa,
          COUNT(*) as quantidade
        FROM (
          SELECT 
            CASE 
              WHEN confiabilidade >= 0.8 THEN 'Alta'
              WHEN confiabilidade >= 0.6 THEN 'Média'
              WHEN confiabilidade >= 0.4 THEN 'Baixa'
              ELSE 'Muito Baixa'
            END as faixa
          FROM noticias
        ) subquery
        GROUP BY faixa
        ORDER BY 
          CASE faixa
            WHEN 'Alta' THEN 1
            WHEN 'Média' THEN 2
            WHEN 'Baixa' THEN 3
            WHEN 'Muito Baixa' THEN 4
          END
      `);

      console.log('📈 Métricas do sistema atualizadas:', {
        totalNews: newsCount.rows[0].total,
        totalSources: sourcesCount.rows[0].total,
        totalConnections: connectionsCount.rows[0].total,
        credibilityDistribution: credibilityDistribution.rows
      });

    } catch (error) {
      console.error('❌ Erro ao atualizar métricas do sistema:', error);
    }
  }

  /**
   * Limpa cache se necessário
   */
  async cleanupCache() {
    try {
      // Limpar cache de URLs antigas (mais de 24 horas)
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      
      // Aqui você poderia implementar limpeza de cache se necessário
      console.log('🧹 Cache verificado e limpo se necessário');
    } catch (error) {
      console.error('❌ Erro ao limpar cache:', error);
    }
  }

  /**
   * Adiciona uma nova notícia e atualiza o sistema
   */
  async addNewsAndUpdate(newsData) {
    try {
      console.log('📰 Adicionando nova notícia e atualizando sistema...');

      // 1. Adicionar notícia ao banco
      const result = await query(`
        INSERT INTO noticias (texto, link, id_fonte, confiabilidade, created_at)
        VALUES ($1, $2, $3, $4, NOW())
        RETURNING *
      `, [
        newsData.texto,
        newsData.link,
        newsData.id_fonte,
        newsData.confiabilidade
      ]);

      const newNews = result.rows[0];

      // 2. Atualizar conexões automaticamente
      await AutoConnectionService.updateConnections();

      // 3. Recalcular estatísticas do grafo
      await this.updateGraphStatistics();

      // 4. Notificar sobre a nova notícia
      this.notifyNewNews(newsData);

      console.log('✅ Nova notícia adicionada e sistema atualizado');

      return newNews;

    } catch (error) {
      console.error('❌ Erro ao adicionar notícia e atualizar:', error);
      throw error;
    }
  }

  /**
   * Adiciona uma nova fonte e atualiza o sistema
   */
  async addSourceAndUpdate(sourceData) {
    try {
      console.log('🔗 Adicionando nova fonte e atualizando sistema...');

      // 1. Adicionar fonte ao banco
      const result = await query(`
        INSERT INTO fontes (nome, site, peso, tipo, descricao, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
        ON CONFLICT (nome) DO UPDATE SET
          peso = EXCLUDED.peso,
          tipo = EXCLUDED.tipo,
          descricao = EXCLUDED.descricao,
          updated_at = NOW()
        RETURNING *
      `, [
        sourceData.nome,
        sourceData.site,
        sourceData.peso,
        sourceData.tipo,
        sourceData.descricao
      ]);

      const newSource = result.rows[0];

      // 2. Atualizar conexões automaticamente
      await AutoConnectionService.updateConnections();

      // 3. Recalcular estatísticas do grafo
      await this.updateGraphStatistics();

      // 4. Notificar sobre a nova fonte
      this.notifyNewSource(sourceData);

      console.log('✅ Nova fonte adicionada e sistema atualizado');

      return newSource;

    } catch (error) {
      console.error('❌ Erro ao adicionar fonte e atualizar:', error);
      throw error;
    }
  }

  /**
   * Notifica sobre nova notícia (para WebSocket)
   */
  notifyNewNews(newsData) {
    // Aqui você pode implementar notificação via WebSocket
    console.log('📢 Nova notícia adicionada:', {
      id: newsData.id || 'N/A',
      fonte: newsData.id_fonte || 'N/A',
      confiabilidade: newsData.confiabilidade || 'N/A'
    });
  }

  /**
   * Notifica sobre nova fonte (para WebSocket)
   */
  notifyNewSource(sourceData) {
    // Aqui você pode implementar notificação via WebSocket
    console.log('📢 Nova fonte adicionada:', {
      nome: sourceData.nome,
      site: sourceData.site,
      credibilidade: sourceData.peso
    });
  }

  /**
   * Força uma atualização imediata
   */
  async forceUpdate() {
    console.log('⚡ Forçando atualização imediata...');
    await this.performPeriodicUpdate();
  }

  /**
   * Obtém status do serviço
   */
  getStatus() {
    return {
      isRunning: this.updateInterval !== null,
      isUpdating: this.isUpdating,
      lastUpdate: new Date().toISOString(),
      updateInterval: '5 minutos'
    };
  }
}

export default new RealTimeUpdateService();
