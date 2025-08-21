import { query } from '../config/database.js';

/**
 * Classe TrustGraph - Implementa um grafo direcionado ponderado para rede de confiança
 * Utiliza Hash Table para indexação rápida e BFS para rastreamento de conexões
 */
export class TrustGraph {
  constructor() {
    this.nodes = new Map(); // Hash Table para indexação rápida
    this.adjacencyList = new Map(); // Lista de adjacência
    this.nodeCount = 0;
    this.edgeCount = 0;
  }

  /**
   * Inicializa o grafo carregando dados do banco
   */
  async initialize() {
    try {
      // Carregar todas as fontes
      const fontesResult = await query('SELECT * FROM fontes');
      const fontes = fontesResult.rows;

      // Adicionar nós ao grafo
      for (const fonte of fontes) {
        this.addNode(fonte.id, fonte);
      }

      // Carregar todas as conexões
      const conexoesResult = await query('SELECT * FROM conexoes');
      const conexoes = conexoesResult.rows;

      // Adicionar arestas ao grafo
      for (const conexao of conexoes) {
        this.addEdge(conexao.fonte_origem, conexao.fonte_destino, conexao.peso);
      }

      console.log(`✅ Grafo inicializado com ${this.nodeCount} nós e ${this.edgeCount} arestas`);
    } catch (error) {
      console.error('❌ Erro ao inicializar grafo:', error);
      throw error;
    }
  }

  /**
   * Adiciona um nó ao grafo
   * @param {number} id - ID da fonte
   * @param {Object} data - Dados da fonte
   */
  addNode(id, data) {
    if (!this.nodes.has(id)) {
      this.nodes.set(id, data);
      this.adjacencyList.set(id, new Map());
      this.nodeCount++;
    }
  }

  /**
   * Verifica se um nó existe no grafo
   * @param {number} id - ID da fonte
   * @returns {boolean} True se o nó existe
   */
  hasNode(id) {
    return this.nodes.has(id);
  }

  /**
   * Adiciona uma aresta ponderada ao grafo
   * @param {number} from - ID da fonte origem
   * @param {number} to - ID da fonte destino
   * @param {number} weight - Peso da conexão (0-1)
   */
  addEdge(from, to, weight) {
    if (!this.nodes.has(from) || !this.nodes.has(to)) {
      throw new Error('Nós não existem no grafo');
    }

    if (weight < 0 || weight > 1) {
      throw new Error('Peso deve estar entre 0 e 1');
    }

    this.adjacencyList.get(from).set(to, weight);
    this.edgeCount++;
  }

  /**
   * Remove uma aresta do grafo
   * @param {number} from - ID da fonte origem
   * @param {number} to - ID da fonte destino
   */
  removeEdge(from, to) {
    if (this.adjacencyList.has(from)) {
      const removed = this.adjacencyList.get(from).delete(to);
      if (removed) this.edgeCount--;
    }
  }

  /**
   * Busca em Largura (BFS) para rastrear conexões
   * @param {number} startId - ID da fonte inicial
   * @param {number} maxDepth - Profundidade máxima da busca
   * @returns {Object} Resultado da busca com caminhos e confiabilidade
   */
  bfs(startId, maxDepth = 3) {
    if (!this.nodes.has(startId)) {
      throw new Error('Fonte inicial não encontrada');
    }

    const visited = new Set();
    const queue = [{ id: startId, depth: 0, path: [startId], trust: 1.0 }];
    const paths = [];
    const connections = new Map();

    while (queue.length > 0) {
      const { id, depth, path, trust } = queue.shift();

      if (visited.has(id) || depth > maxDepth) continue;
      visited.add(id);

      // Adicionar ao resultado
      paths.push({
        id,
        depth,
        path: [...path],
        trust,
        node: this.nodes.get(id)
      });

      connections.set(id, {
        node: this.nodes.get(id),
        trust,
        depth
      });

      // Se não atingiu a profundidade máxima, continuar busca
      if (depth < maxDepth) {
        const neighbors = this.adjacencyList.get(id);
        if (neighbors) {
          for (const [neighborId, weight] of neighbors) {
            if (!visited.has(neighborId)) {
              const newTrust = trust * weight;
              queue.push({
                id: neighborId,
                depth: depth + 1,
                path: [...path, neighborId],
                trust: newTrust
              });
            }
          }
        }
      }
    }

    return {
      paths,
      connections: Array.from(connections.values()),
      totalConnections: connections.size,
      maxDepth: Math.max(...paths.map(p => p.depth))
    };
  }

  /**
   * Calcula a confiabilidade de uma fonte baseada em suas conexões
   * @param {number} sourceId - ID da fonte
   * @param {number} maxDepth - Profundidade máxima para análise
   * @returns {number} Pontuação de confiabilidade (0-1)
   */
  calculateTrustScore(sourceId, maxDepth = 3) {
    try {
      const bfsResult = this.bfs(sourceId, maxDepth);

      if (bfsResult.connections.length === 0) {
        // Se não há conexões, retorna o peso base da fonte
        const sourceNode = this.nodes.get(sourceId);
        return sourceNode ? parseFloat(sourceNode.peso) || 0.5 : 0.5;
      }

      // Calcular média ponderada das confiabilidades
      let totalWeight = 0;
      let weightedSum = 0;

      for (const connection of bfsResult.connections) {
        const weight = 1 / (connection.depth + 1); // Peso inverso à profundidade
        totalWeight += weight;
        weightedSum += (parseFloat(connection.trust) || 0.5) * weight;
      }

      // Adicionar peso da fonte original
      const sourceNode = this.nodes.get(sourceId);
      if (sourceNode) {
        totalWeight += 1;
        weightedSum += parseFloat(sourceNode.peso) || 0.5;
      }

      const result = totalWeight > 0 ? weightedSum / totalWeight : 0.5;

      // Garantir que o resultado seja um número válido entre 0 e 1
      const finalResult = Math.max(0, Math.min(1, parseFloat(result) || 0.5));

      console.log(`📊 Trust score calculado para fonte ${sourceId}: ${finalResult}`);
      return finalResult;
    } catch (error) {
      console.error('Erro ao calcular confiabilidade:', error);
      return 0.5; // Valor padrão em caso de erro
    }
  }

  /**
   * Atualiza o peso de uma conexão
   * @param {number} from - ID da fonte origem
   * @param {number} to - ID da fonte destino
   * @param {number} newWeight - Novo peso
   */
  async updateConnectionWeight(from, to, newWeight) {
    try {
      // Atualizar no banco de dados
      await query(
        'UPDATE conexoes SET peso = $1, updated_at = CURRENT_TIMESTAMP WHERE fonte_origem = $2 AND fonte_destino = $3',
        [newWeight, from, to]
      );

      // Atualizar no grafo em memória
      if (this.adjacencyList.has(from)) {
        this.adjacencyList.get(from).set(to, newWeight);
      }

      console.log(`✅ Peso da conexão ${from} -> ${to} atualizado para ${newWeight}`);
    } catch (error) {
      console.error('❌ Erro ao atualizar peso da conexão:', error);
      throw error;
    }
  }

  /**
   * Adiciona uma nova fonte ao grafo
   * @param {Object} fonteData - Dados da fonte
   * @returns {Object} Fonte criada
   */
  async addSource(fonteData) {
    try {
      const result = await query(
        'INSERT INTO fontes (nome, site, peso) VALUES ($1, $2, $3) RETURNING *',
        [fonteData.nome, fonteData.site, fonteData.peso]
      );

      const newFonte = result.rows[0];
      this.addNode(newFonte.id, newFonte);

      console.log(`✅ Fonte "${newFonte.nome}" adicionada com ID ${newFonte.id}`);
      return newFonte;
    } catch (error) {
      console.error('❌ Erro ao adicionar fonte:', error);
      throw error;
    }
  }

  /**
   * Adiciona uma nova conexão entre fontes
   * @param {number} from - ID da fonte origem
   * @param {number} to - ID da fonte destino
   * @param {number} weight - Peso da conexão
   * @returns {Object} Conexão criada
   */
  async addConnection(from, to, weight) {
    try {
      const result = await query(
        'INSERT INTO conexoes (fonte_origem, fonte_destino, peso) VALUES ($1, $2, $3) RETURNING *',
        [from, to, weight]
      );

      const newConnection = result.rows[0];
      this.addEdge(from, to, weight);

      console.log(`✅ Conexão ${from} -> ${to} adicionada com peso ${weight}`);
      return newConnection;
    } catch (error) {
      console.error('❌ Erro ao adicionar conexão:', error);
      throw error;
    }
  }

  /**
   * Obtém o ranking das fontes mais confiáveis
   * @param {number} limit - Limite de resultados
   * @returns {Array} Ranking de fontes
   */
  async getTopSources(limit = 10) {
    try {
      console.log('🔍 Executando getTopSources...');

      const result = await query(
        `SELECT f.*, 
                COALESCE(AVG(c.peso), 0) as avg_connection_weight,
                COUNT(c.id) as connection_count
         FROM fontes f
         LEFT JOIN conexoes c ON f.id = c.fonte_destino
         GROUP BY f.id
         ORDER BY f.peso DESC, avg_connection_weight DESC
         LIMIT $1`,
        [limit]
      );

      console.log(`📊 ${result.rows.length} fontes encontradas`);

      const ranking = result.rows.map(row => ({
        id: row.id,
        nome: row.nome,
        site: row.site,
        peso: parseFloat(row.peso),
        trust_score: parseFloat(row.peso),
        connection_count: parseInt(row.connection_count),
        avg_connection_weight: parseFloat(row.avg_connection_weight)
      }));

      console.log('✅ Ranking processado com sucesso');
      return ranking;
    } catch (error) {
      console.error('❌ Erro ao obter ranking de fontes:', error);
      throw error;
    }
  }

  /**
   * Obtém estatísticas do grafo
   * @returns {Object} Estatísticas
   */
  getStats() {
    return {
      nodeCount: this.nodeCount,
      edgeCount: this.edgeCount,
      averageConnections: this.nodeCount > 0 ? this.edgeCount / this.nodeCount : 0,
      nodes: Array.from(this.nodes.keys()),
      maxConnections: Math.max(...Array.from(this.adjacencyList.values()).map(adj => adj.size))
    };
  }

  /**
   * Exporta o grafo em formato JSON
   * @returns {Object} Representação JSON do grafo
   */
  toJSON() {
    const nodes = Array.from(this.nodes.entries()).map(([id, data]) => ({
      id: parseInt(id),
      name: data.nome,
      nome: data.nome,
      site: data.site,
      peso: parseFloat(data.peso) || 0.5
    }));

    const edges = [];
    for (const [from, neighbors] of this.adjacencyList.entries()) {
      for (const [to, weight] of neighbors.entries()) {
        edges.push({
          source: parseInt(from),
          target: parseInt(to),
          from: parseInt(from),
          to: parseInt(to),
          weight: parseFloat(weight) || 0.5
        });
      }
    }

    console.log(`📊 Exportando grafo: ${nodes.length} nós, ${edges.length} arestas`);

    return {
      nodes,
      edges,
      stats: this.getStats()
    };
  }

  // Getters
  getNodeCount() {
    return this.nodeCount;
  }

  getEdgeCount() {
    return this.edgeCount;
  }

  getNode(id) {
    return this.nodes.get(id);
  }

  getNeighbors(id) {
    return this.adjacencyList.get(id) || new Map();
  }
}
