import { query } from '../config/database.js';
import { URL } from 'url';
import ExternalSourceAnalyzer from './ExternalSourceAnalyzer.js';

/**
 * Classe NewsAnalyzer - Analisa notícias usando o grafo de confiança
 * Implementa algoritmos de análise e extração de fontes
 */
export class NewsAnalyzer {
    constructor(trustGraph) {
        this.trustGraph = trustGraph;
        this.urlCache = new Map(); // Hash Table para cache de URLs
        this.externalAnalyzer = new ExternalSourceAnalyzer(); // Instanciar o analisador externo
    }

    /**
     * Extrai o domínio de uma URL
     * @param {string} url - URL para extrair domínio
     * @returns {string} Domínio extraído
     */
    extractDomain(url) {
        try {
            const urlObj = new URL(url);
            let hostname = urlObj.hostname.toLowerCase().replace(/^www\./, '');
            // Normalizar: reduzir subdomínios para domínio base (ex.: portal.pucrs.br -> pucrs.br)
            const parts = hostname.split('.');
            if (parts.length >= 3) {
                const last = parts[parts.length - 1];
                const secondLast = parts[parts.length - 2];
                hostname = `${secondLast}.${last}`;
            }
            return hostname;
        } catch (error) {
            console.error('Erro ao extrair domínio:', error);
            return null;
        }
    }

    /**
     * Escapa string para uso seguro em RegExp
     */
    escapeRegex(str) {
        return String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    /**
     * Encontra a fonte baseada na URL ou texto
     * @param {string} url - URL da notícia
     * @param {string} text - Texto da notícia (opcional)
     * @returns {Object|null} Fonte encontrada ou null
     */
    async findSource(url, text = '') {
        try {
            let domain = null;

            // Se temos URL, extrair domínio
            if (url) {
                domain = this.extractDomain(url);

                // Verificar cache primeiro
                if (this.urlCache.has(domain)) {
                    return this.urlCache.get(domain);
                }
            }

            // SEMPRE tentar análise externa primeiro para URLs de redes sociais ou sites suspeitos
            if (url || text) {
                console.log('🔍 Iniciando análise externa prioritária...');

                try {
                    // Extrair título do texto (primeira linha)
                    const title = text ? text.split('\n')[0].substring(0, 100) : '';

                    // Analisar fonte externa
                    const externalSource = await this.externalAnalyzer.analyzeExternalSource(url, title, text);

                    // Adicionar ao banco de dados
                    const sourceId = await this.externalAnalyzer.addSourceToDatabase(externalSource);

                    // Buscar a fonte completa do banco
                    const fonteResult = await query('SELECT * FROM fontes WHERE id = $1', [sourceId]);
                    const fonteCompleta = fonteResult.rows[0];

                    // Adicionar ao grafo em memória
                    this.trustGraph.addNode(sourceId, fonteCompleta);

                    console.log(`✅ Fonte "${fonteCompleta.nome}" adicionada ao banco (ID: ${sourceId}) e ao grafo`);

                    // Retornar fonte com ID do banco e dados externos
                    return {
                        id: sourceId,
                        nome: externalSource.nome,
                        site: externalSource.site,
                        peso: externalSource.peso,
                        tipo: externalSource.tipo,
                        descricao: externalSource.descricao,
                        externalData: externalSource.externalData // Preservar dados do ScamAdviser
                    };

                } catch (error) {
                    console.error('❌ Erro na análise externa:', error);
                    // Continuar com busca interna
                }
            }

            // Buscar por domínio no banco (apenas se análise externa falhou)
            if (domain) {
                const result = await query(
                    'SELECT * FROM fontes WHERE site LIKE $1 OR site LIKE $2',
                    [`%${domain}%`, `%${domain.replace('www.', '')}%`]
                );

                if (result.rows.length > 0) {
                    const fonte = result.rows[0];
                    this.urlCache.set(domain, fonte);
                    return fonte;
                }
            }

            // Se não encontrou por URL, tentar extrair do texto
            if (text) {
                const textLower = text.toLowerCase();

                // Buscar por menções de fontes conhecidas no texto
                const fontesResult = await query('SELECT * FROM fontes');

                for (const fonte of fontesResult.rows) {
                    const nomeLower = (fonte.nome || '').toLowerCase();
                    const siteLower = (fonte.site || '').toLowerCase();

                    // Casar domínio do site como palavra inteira
                    if (siteLower) {
                        const sitePattern = new RegExp(`\\b${this.escapeRegex(siteLower)}\\b`, 'i');
                        if (sitePattern.test(textLower)) {
                            return fonte;
                        }
                    }

                    // Evitar falsos positivos com nomes curtos (ex.: "ig")
                    if (nomeLower && nomeLower.length >= 3) {
                        const namePattern = new RegExp(`\\b${this.escapeRegex(nomeLower)}\\b`, 'i');
                        if (namePattern.test(textLower)) {
                            return fonte;
                        }
                    }
                }
            }

            return null;
        } catch (error) {
            console.error('Erro ao encontrar fonte:', error);
            return null;
        }
    }

    /**
     * Analisa uma notícia e calcula sua confiabilidade
     * @param {Object} newsData - Dados da notícia
     * @returns {Object} Resultado da análise
     */
    async analyzeNews(newsData) {
        try {
            const { texto, link } = newsData;

            if (!texto && !link) {
                throw new Error('Texto ou link da notícia é obrigatório');
            }

            // Encontrar fonte
            const fonte = await this.findSource(link, texto);

            if (!fonte) {
                // Se ainda não encontrou fonte após análise externa, criar uma temporária
                const tempFonte = {
                    id: null,
                    nome: 'Fonte não identificada',
                    site: link ? this.extractDomain(link) : 'desconhecido',
                    peso: 0.3 // Peso baixo para fontes desconhecidas
                };

                return {
                    fonte: tempFonte,
                    confiabilidade: 0.3,
                    analise: {
                        tipo: 'fonte_desconhecida',
                        mensagem: 'Fonte não pôde ser analisada automaticamente',
                        recomendacao: 'Verificar a fonte manualmente'
                    },
                    grafo: null
                };
            }

            // Calcular confiabilidade baseada APENAS nos dados da API externa (ScamAdviser)
            let confiabilidade;

            // Verificar se temos dados externos da fonte (ScamAdviser)
            if (fonte.externalData && fonte.externalData.scamAdviserData) {
                const scamData = fonte.externalData.scamAdviserData;

                // Usar APENAS o trust score do ScamAdviser (0-100) convertido para 0-1
                confiabilidade = scamData.trustScore / 100;

                console.log(`📊 Credibilidade calculada APENAS com dados ScamAdviser: ${(confiabilidade * 100).toFixed(1)}% (ScamAdviser: ${scamData.trustScore}%)`);

            } else {
                // Se não temos dados externos, usar credibilidade neutra
                confiabilidade = 0.5;
                console.log(`📊 Credibilidade neutra (sem dados externos): ${(confiabilidade * 100).toFixed(1)}%`);
            }

            // Obter análise do grafo (apenas se a fonte já existe no grafo)
            let grafoAnalise = { totalConnections: 0, maxDepth: 0, connections: [], paths: [] };
            try {
                if (fonte.id && this.trustGraph.hasNode(fonte.id)) {
                    grafoAnalise = this.trustGraph.bfs(fonte.id, 2);
                }
            } catch (error) {
                console.log(`⚠️ Fonte ${fonte.nome} ainda não está no grafo, usando análise externa apenas`);
            }

            // Determinar tipo de análise baseado APENAS na credibilidade externa
            let tipoAnalise = 'confiavel';
            let mensagem = 'Fonte confiável';
            let recomendacao = 'Notícia parece confiável';

            if (confiabilidade < 0.4) {
                tipoAnalise = 'baixa_confianca';
                mensagem = 'Fonte com baixa confiabilidade';
                recomendacao = 'Verificar informações com outras fontes';
            } else if (confiabilidade < 0.7) {
                tipoAnalise = 'confianca_media';
                mensagem = 'Fonte com confiabilidade média';
                recomendacao = 'Considerar verificar com fontes mais confiáveis';
            }

            // Salvar notícia no banco (apenas se a fonte tem ID)
            let noticia = null;
            if (fonte.id) {
                const noticiaResult = await query(
                    'INSERT INTO noticias (texto, link, id_fonte, confiabilidade) VALUES ($1, $2, $3, $4) RETURNING *',
                    [texto, link, fonte.id, confiabilidade]
                );
                noticia = noticiaResult.rows[0];
            }

            return {
                noticia,
                fonte,
                confiabilidade,
                analise: {
                    tipo: tipoAnalise,
                    mensagem,
                    recomendacao,
                    conexoes_analisadas: grafoAnalise.totalConnections,
                    profundidade_maxima: grafoAnalise.maxDepth
                },
                grafo: {
                    fonte_central: fonte,
                    conexoes: grafoAnalise.connections,
                    caminhos: grafoAnalise.paths
                }
            };
        } catch (error) {
            console.error('Erro ao analisar notícia:', error);
            throw error;
        }
    }

    /**
     * Analisa múltiplas notícias em lote
     * @param {Array} newsList - Lista de notícias
     * @returns {Array} Resultados das análises
     */
    async analyzeBatch(newsList) {
        const results = [];

        for (const news of newsList) {
            try {
                const result = await this.analyzeNews(news);
                results.push({
                    ...result,
                    success: true
                });
            } catch (error) {
                results.push({
                    news,
                    success: false,
                    error: error.message
                });
            }
        }

        return results;
    }

    /**
     * Processa feedback do usuário e atualiza pesos
     * @param {number} noticiaId - ID da notícia
     * @param {string} tipo - Tipo de feedback ('confiavel' ou 'fake')
     * @param {string} comentario - Comentário opcional
     * @returns {Object} Resultado do processamento
     */
    async processFeedback(noticiaId, tipo, comentario = '') {
        try {
            // Buscar notícia
            const noticiaResult = await query(
                'SELECT n.*, f.* FROM noticias n JOIN fontes f ON n.id_fonte = f.id WHERE n.id = $1',
                [noticiaId]
            );

            if (noticiaResult.rows.length === 0) {
                throw new Error('Notícia não encontrada');
            }

            const noticia = noticiaResult.rows[0];

            // Salvar feedback
            await query(
                'INSERT INTO feedback (id_noticia, tipo, comentario) VALUES ($1, $2, $3)',
                [noticiaId, tipo, comentario]
            );

            // Calcular ajuste de peso baseado no feedback
            const ajustePeso = tipo === 'confiavel' ? 0.1 : -0.1;
            const novoPeso = Math.max(0, Math.min(1, noticia.peso + ajustePeso));

            // Atualizar peso da fonte
            await query(
                'UPDATE fontes SET peso = $1 WHERE id = $2',
                [novoPeso, noticia.id_fonte]
            );

            // Atualizar no grafo
            this.trustGraph.nodes.get(noticia.id_fonte).peso = novoPeso;

            // Ajustar pesos das conexões relacionadas
            const conexoes = this.trustGraph.getNeighbors(noticia.id_fonte);
            for (const [destinoId, pesoAtual] of conexoes) {
                const novoPesoConexao = tipo === 'confiavel'
                    ? Math.min(1, pesoAtual + 0.05)
                    : Math.max(0, pesoAtual - 0.05);

                await this.trustGraph.updateConnectionWeight(noticia.id_fonte, destinoId, novoPesoConexao);
            }

            console.log(`✅ Feedback processado: ${tipo} para notícia ${noticiaId}`);

            return {
                success: true,
                noticia_id: noticiaId,
                fonte_id: noticia.id_fonte,
                novo_peso_fonte: novoPeso,
                ajuste_aplicado: ajustePeso,
                mensagem: `Peso da fonte ajustado com base no feedback: ${tipo}`
            };
        } catch (error) {
            console.error('Erro ao processar feedback:', error);
            throw error;
        }
    }

    /**
     * Gera relatório de análise
     * @param {number} noticiaId - ID da notícia
     * @returns {Object} Relatório detalhado
     */
    async generateReport(noticiaId) {
        try {
            // Buscar notícia com fonte
            const noticiaResult = await query(
                `SELECT n.*, f.nome as fonte_nome, f.site as fonte_site, f.peso as fonte_peso
         FROM noticias n 
         JOIN fontes f ON n.id_fonte = f.id 
         WHERE n.id = $1`,
                [noticiaId]
            );

            if (noticiaResult.rows.length === 0) {
                throw new Error('Notícia não encontrada');
            }

            const noticia = noticiaResult.rows[0];

            // Buscar feedback
            const feedbackResult = await query(
                'SELECT * FROM feedback WHERE id_noticia = $1 ORDER BY created_at DESC',
                [noticiaId]
            );

            // Análise do grafo
            const grafoAnalise = this.trustGraph.bfs(noticia.id_fonte, 3);

            // Estatísticas
            const statsResult = await query(
                `SELECT 
           COUNT(*) as total_noticias,
           AVG(confiabilidade) as media_confiabilidade,
           COUNT(CASE WHEN confiabilidade > 0.7 THEN 1 END) as noticias_confiaveis,
           COUNT(CASE WHEN confiabilidade < 0.4 THEN 1 END) as noticias_baixa_confianca
         FROM noticias 
         WHERE id_fonte = $1`,
                [noticia.id_fonte]
            );

            const stats = statsResult.rows[0];

            return {
                noticia: {
                    id: noticia.id,
                    texto: noticia.texto,
                    link: noticia.link,
                    confiabilidade: noticia.confiabilidade,
                    created_at: noticia.created_at
                },
                fonte: {
                    id: noticia.id_fonte,
                    nome: noticia.fonte_nome,
                    site: noticia.fonte_site,
                    peso: noticia.fonte_peso
                },
                analise_grafo: {
                    total_conexoes: grafoAnalise.totalConnections,
                    profundidade_maxima: grafoAnalise.maxDepth,
                    caminhos_analisados: grafoAnalise.paths.length
                },
                feedback: feedbackResult.rows,
                estatisticas_fonte: {
                    total_noticias: parseInt(stats.total_noticias),
                    media_confiabilidade: parseFloat(stats.media_confiabilidade),
                    noticias_confiaveis: parseInt(stats.noticias_confiaveis),
                    noticias_baixa_confianca: parseInt(stats.noticias_baixa_confianca)
                },
                recomendacoes: this.generateRecommendations(noticia.confiabilidade, grafoAnalise)
            };
        } catch (error) {
            console.error('Erro ao gerar relatório:', error);
            throw error;
        }
    }

    /**
     * Gera recomendações baseadas na análise
     * @param {number} confiabilidade - Confiabilidade da notícia
     * @param {Object} grafoAnalise - Análise do grafo
     * @returns {Array} Lista de recomendações
     */
    generateRecommendations(confiabilidade, grafoAnalise) {
        const recomendacoes = [];

        if (confiabilidade < 0.4) {
            recomendacoes.push('Verificar informações com múltiplas fontes confiáveis');
            recomendacoes.push('Considerar a possibilidade de fake news');
        } else if (confiabilidade < 0.7) {
            recomendacoes.push('Buscar confirmação em fontes mais confiáveis');
            recomendacoes.push('Avaliar o contexto da notícia');
        } else {
            recomendacoes.push('Fonte considerada confiável');
            recomendacoes.push('Informações parecem verídicas');
        }

        if (grafoAnalise.totalConnections < 3) {
            recomendacoes.push('Fonte com poucas conexões na rede de confiança');
        }

        return recomendacoes;
    }

    /**
     * Limpa o cache de URLs
     */
    clearCache() {
        this.urlCache.clear();
        console.log('✅ Cache de URLs limpo');
    }

    /**
     * Obtém estatísticas do analisador
     * @returns {Object} Estatísticas
     */
    getStats() {
        return {
            cacheSize: this.urlCache.size,
            graphStats: this.trustGraph.getStats()
        };
    }
}
