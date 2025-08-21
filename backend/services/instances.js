import { TrustGraph } from './TrustGraph.js';
import { NewsAnalyzer } from './NewsAnalyzer.js';

// Instâncias globais
export const trustGraph = new TrustGraph();
export const newsAnalyzer = new NewsAnalyzer(trustGraph);

// Função para inicializar as instâncias
export async function initializeInstances() {
  try {
    await trustGraph.initialize();
    console.log('✅ Instâncias globais inicializadas');
  } catch (error) {
    console.error('❌ Erro ao inicializar instâncias:', error);
    throw error;
  }
}
