import { query } from '../config/database.js';

class AutoConnectionService {
  constructor() {
    this.isUpdating = false;
  }

  /**
   * Atualiza as conexões automaticamente quando novas notícias são adicionadas
   */
  async updateConnections() {
    if (this.isUpdating) {
      console.log('🔄 Atualização de conexões já em andamento...');
      return;
    }

    this.isUpdating = true;
    
    try {
      console.log('🔄 Atualizando conexões baseadas em notícias reais...');
      
      // Buscar fontes que têm notícias
      const sourcesWithNews = await query(`
        SELECT 
          f.id,
          f.nome,
          f.peso,
          COUNT(n.id) as total_noticias,
          AVG(n.confiabilidade) as media_confiabilidade
        FROM fontes f
        INNER JOIN noticias n ON f.id = n.id_fonte
        GROUP BY f.id, f.nome, f.peso
        ORDER BY total_noticias DESC
      `);
      
      if (sourcesWithNews.rows.length < 2) {
        console.log('⚠️  Poucas fontes com notícias para criar conexões');
        return;
      }
      
      // Limpar conexões existentes
      await query('DELETE FROM conexoes');
      
      const connections = [];
      
      // Gerar conexões baseadas em similaridade
      for (let i = 0; i < sourcesWithNews.rows.length; i++) {
        const source1 = sourcesWithNews.rows[i];
        
        for (let j = i + 1; j < sourcesWithNews.rows.length; j++) {
          const source2 = sourcesWithNews.rows[j];
          
          const connectionWeight = this.calculateConnectionWeight(source1, source2);
          
          if (connectionWeight > 0.3) {
            connections.push({
              fonte_origem: source1.id,
              fonte_destino: source2.id,
              peso: Math.round(connectionWeight * 100) / 100
            });
          }
        }
      }
      
      // Inserir novas conexões
      for (const connection of connections) {
        await query(`
          INSERT INTO conexoes (fonte_origem, fonte_destino, peso, created_at, updated_at) 
          VALUES ($1, $2, $3, NOW(), NOW())
        `, [connection.fonte_origem, connection.fonte_destino, connection.peso]);
      }
      
      console.log(`✅ ${connections.length} conexões atualizadas automaticamente`);
      
    } catch (error) {
      console.error('❌ Erro ao atualizar conexões:', error.message);
    } finally {
      this.isUpdating = false;
    }
  }

  /**
   * Calcula o peso da conexão entre duas fontes
   */
  calculateConnectionWeight(source1, source2) {
    // Similaridade de credibilidade
    const credibilityDiff = Math.abs(source1.peso - source2.peso);
    const credibilitySimilarity = 1 - credibilityDiff;
    
    // Similaridade de volume de notícias
    const newsCount1 = parseInt(source1.total_noticias);
    const newsCount2 = parseInt(source2.total_noticias);
    const newsSimilarity = Math.min(newsCount1, newsCount2) / Math.max(newsCount1, newsCount2);
    
    // Similaridade de tipo de fonte
    const typeSimilarity = this.getTypeSimilarity(source1.nome, source2.nome);
    
    // Peso final
    return (
      credibilitySimilarity * 0.4 +
      newsSimilarity * 0.3 +
      typeSimilarity * 0.3
    );
  }

  /**
   * Determina a similaridade de tipo entre duas fontes
   */
  getTypeSimilarity(name1, name2) {
    const getSourceType = (name) => {
      if (name.includes('Nature') || name.includes('Science') || name.includes('The Lancet') || name.includes('JAMA')) return 'scientific';
      if (name.includes('Financial Times') || name.includes('Wall Street Journal') || name.includes('The Economist')) return 'financial';
      if (name.includes('Folha') || name.includes('Estado') || name.includes('Globo') || name.includes('G1')) return 'news';
      if (name.includes('Agência Brasil') || name.includes('Reuters')) return 'agency';
      return 'general';
    };
    
    const type1 = getSourceType(name1);
    const type2 = getSourceType(name2);
    
    return type1 === type2 ? 0.8 : 0.3;
  }

  /**
   * Agenda atualização periódica das conexões
   */
  schedulePeriodicUpdate(intervalMinutes = 30) {
    setInterval(() => {
      this.updateConnections();
    }, intervalMinutes * 60 * 1000);
    
    console.log(`⏰ Agendada atualização automática de conexões a cada ${intervalMinutes} minutos`);
  }
}

export default new AutoConnectionService();
