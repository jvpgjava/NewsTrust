import fetch from 'node-fetch';
import { query } from '../config/database.js';

class ExternalSourceAnalyzer {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 24 * 60 * 60 * 1000; // 24 horas

    // Limpar cache na inicialização para garantir dados frescos
    this.cache.clear();
    console.log('🧹 Cache limpo na inicialização');
  }

  /**
   * Analisa uma fonte externa e retorna informações de credibilidade
   */
  async analyzeExternalSource(url, title, content) {
    try {
      console.log(`🔍 Analisando fonte externa: ${url}`);

      // Extrair domínio da URL
      const domain = this.extractDomain(url);
      console.log(`🌐 Domínio extraído: ${domain}`);

      // Verificar cache primeiro
      if (this.cache.has(domain)) {
        const cached = this.cache.get(domain);
        if (Date.now() - cached.timestamp < this.cacheTimeout) {
          console.log(`📋 Usando dados em cache para: ${domain}`);
          return cached.data;
        }
      }

      // Buscar informações usando apenas ScamAdviser
      const analysis = await this.gatherSourceInformation(domain, url, title, content);

      // Calcular credibilidade baseada apenas nos dados do ScamAdviser
      const credibility = this.calculateCredibility(analysis);

      const result = {
        nome: analysis.siteName || domain,
        site: domain,
        peso: credibility,
        tipo: analysis.type || 'general',
        descricao: analysis.description || `Fonte analisada automaticamente: ${domain}`,
        externalData: analysis
      };

      console.log(`📊 Resultado da análise:`, {
        nome: result.nome,
        site: result.site,
        peso: result.peso,
        tipo: result.tipo
      });

      // Salvar no cache
      this.cache.set(domain, {
        data: result,
        timestamp: Date.now()
      });

      console.log(`✅ Análise externa concluída para ${domain}: ${(credibility * 100).toFixed(1)}%`);
      return result;

    } catch (error) {
      console.error(`❌ Erro ao analisar fonte externa ${url}:`, error.message);

      // Retornar análise padrão para fontes com erro
      return {
        nome: this.extractDomain(url),
        site: this.extractDomain(url),
        peso: 0.3, // Credibilidade baixa para fontes com erro
        tipo: 'unknown',
        descricao: 'Fonte não pôde ser analisada automaticamente',
        externalData: { error: error.message }
      };
    }
  }

  /**
   * Extrai o domínio de uma URL
   */
  extractDomain(url) {
    try {
      const urlObj = new URL(url);
      let hostname = urlObj.hostname.replace('www.', '');

      // Para redes sociais, extrair o nome do usuário/canal
      if (hostname === 'x.com' || hostname === 'twitter.com') {
        const pathParts = urlObj.pathname.split('/');
        if (pathParts.length >= 2 && pathParts[1]) {
          return pathParts[1]; // Retorna o nome do usuário (ex: "choquei")
        }
      }

      return hostname;
    } catch {
      // Se não for uma URL válida, tentar extrair domínio
      const match = url.match(/(?:https?:\/\/)?(?:www\.)?([^\/\s]+)/);
      return match ? match[1] : url;
    }
  }

  /**
   * Coleta informações usando apenas a API do ScamAdviser
   */
  async gatherSourceInformation(domain, url, title, content) {
    const analysis = {
      siteName: domain,
      type: 'general',
      description: '',
      scamAdviserData: {}
    };

    try {
      // Buscar dados do ScamAdviser
      analysis.scamAdviserData = await this.getScamAdviserData(domain);

      // Determinar tipo de fonte baseado apenas nos dados do ScamAdviser
      analysis.type = this.determineSourceType(analysis);
      analysis.siteName = domain;
      analysis.description = this.generateDescriptionFromScamAdviser(analysis);

    } catch (error) {
      console.error('Erro ao coletar informações do ScamAdviser:', error);
    }

    return analysis;
  }

  /**
   * Busca dados do ScamAdviser
   */
  async getScamAdviserData(domain) {
    try {
      console.log(`🔍 Buscando dados do ScamAdviser para: ${domain}`);

      // URL da API do ScamAdviser
      const apiUrl = `https://www.scamadviser.com/check-website/${domain}`;

      // Fazer requisição para a página do ScamAdviser
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        },
        timeout: 10000
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const html = await response.text();

      // Extrair dados do HTML usando regex
      const scamAdviserData = this.parseScamAdviserHTML(html, domain);

      console.log(`✅ Dados do ScamAdviser obtidos para ${domain}:`, scamAdviserData);
      return scamAdviserData;

    } catch (error) {
      console.error(`❌ Erro ao buscar dados do ScamAdviser para ${domain}:`, error.message);

      // Retornar dados padrão em caso de erro
      return {
        trustScore: 50,
        riskLevel: 'medium',
        isScam: false,
        confidence: 'low',
        country: 'Brasil',
        language: 'Português',
        description: 'Fonte analisada automaticamente',
        domainAge: 'Não disponível',
        error: error.message
      };
    }
  }

  /**
   * Extrai dados do HTML do ScamAdviser
   */
  parseScamAdviserHTML(html, domain) {
    try {
      const data = {
        trustScore: 50,
        riskLevel: 'medium',
        isScam: false,
        confidence: 'medium',
        country: 'Brasil',
        language: 'Português',
        description: '',
        domainAge: 'Não disponível',
        factors: []
      };

      // Tentar extrair score de confiança de diferentes padrões
      const trustScorePatterns = [
        /data-rating="(\d+)"/i,
        /data-score="(\d+)"/i,
        /trustscore[:\s]*(\d+)/i,
        /trust score[:\s]*(\d+)/i,
        /score[:\s]*(\d+)/i,
        /rating[:\s]*(\d+)/i,
        /(\d+)\s*\/\s*100/i,
        /(\d+)\s*out of\s*100/i,
        /(\d+)\s*de\s*100/i,
        /(\d+)\s*\/\s*100\s*points/i,
        /trust\s*score[:\s]*(\d+)/i,
        /website\s*score[:\s]*(\d+)/i,
        /overall\s*score[:\s]*(\d+)/i
      ];

      for (const pattern of trustScorePatterns) {
        const match = html.match(pattern);
        if (match) {
          const score = parseInt(match[1]);
          if (score >= 0 && score <= 100) {
            data.trustScore = score;
            console.log(`🎯 Score encontrado: ${score} usando padrão: ${pattern}`);
            break;
          }
        }
      }

      // Verificar se encontrou dados válidos ou se é página genérica
      const hasValidData = data.trustScore !== 50 && data.trustScore > 0;
      const isGenericPage = !hasValidData && (
        html.includes('Search a website') ||
        html.includes('Enter a website') ||
        html.includes('Check a website') ||
        html.includes('Check Website') ||
        html.includes('Enter Website') ||
        html.includes('Search Website') ||
        !html.includes(domain)
      );

      if (isGenericPage) {
        console.log(`⚠️ Página genérica detectada para ${domain}, usando fallback`);
        return this.getDefaultScamAdviserData(domain);
      }

      // Determinar nível de risco baseado no score
      if (data.trustScore >= 80) {
        data.riskLevel = 'low';
        data.isScam = false;
        data.confidence = 'high';
      } else if (data.trustScore >= 60) {
        data.riskLevel = 'medium';
        data.isScam = false;
        data.confidence = 'medium';
      } else if (data.trustScore >= 40) {
        data.riskLevel = 'medium';
        data.isScam = false;
        data.confidence = 'medium';
      } else {
        data.riskLevel = 'high';
        data.isScam = true;
        data.confidence = 'high';
      }

      // Extrair país usando diferentes padrões
      const countryPatterns = [
        /country[:\s]*([a-zA-Z\s]+)/i,
        /based in[:\s]*([a-zA-Z\s]+)/i,
        /located in[:\s]*([a-zA-Z\s]+)/i,
        /from[:\s]*([a-zA-Z\s]+)/i,
        /origin[:\s]*([a-zA-Z\s]+)/i
      ];

      for (const pattern of countryPatterns) {
        const match = html.match(pattern);
        if (match) {
          const country = match[1].trim();
          if (country && country.length > 0 && country !== 'the company is based' && country.length > 1) {
            // Mapear países para nomes em português
            const countryMap = {
              'brazil': 'Brasil',
              'brasil': 'Brasil',
              'united states': 'Estados Unidos',
              'usa': 'Estados Unidos',
              'portugal': 'Portugal',
              'spain': 'Espanha',
              'france': 'França',
              'germany': 'Alemanha',
              'italy': 'Itália',
              'uk': 'Reino Unido',
              'england': 'Inglaterra'
            };
            data.country = countryMap[country.toLowerCase()] || country;
            break;
          }
        }
      }

      // Verificar se o domínio é brasileiro (.br)
      if (domain.includes('.br') && (!data.country || data.country === 'Brasil')) {
        data.country = 'Brasil';
      }

      // Extrair idioma
      const languagePatterns = [
        /language[:\s]*([a-zA-Z\s]+)/i,
        /content language[:\s]*([a-zA-Z\s]+)/i,
        /portuguese/i,
        /português/i,
        /english/i,
        /spanish/i,
        /french/i,
        /german/i,
        /italian/i
      ];

      for (const pattern of languagePatterns) {
        const match = html.match(pattern);
        if (match) {
          const language = match[1] ? match[1].trim() : pattern.source.replace(/[\/i]/g, '');
          if (language && language.length > 0 && language !== 'unknown') {
            // Mapear idiomas para português
            const languageMap = {
              'portuguese': 'Português',
              'português': 'Português',
              'english': 'Inglês',
              'spanish': 'Espanhol',
              'french': 'Francês',
              'german': 'Alemão',
              'italian': 'Italiano'
            };
            data.language = languageMap[language.toLowerCase()] || language;
            break;
          }
        }
      }

      // Tentar extrair idade do domínio
      const domainAgePatterns = [
        /domain age[:\s]*([^<>\n"]+)/i,
        /age[:\s]*([^<>\n"]+)/i,
        /created[:\s]*([^<>\n"]+)/i,
        /registered[:\s]*([^<>\n"]+)/i
      ];

      for (const pattern of domainAgePatterns) {
        const match = html.match(pattern);
        if (match) {
          const age = match[1].trim();
          // Verificar se é uma idade válida (contém números e não tem palavras inválidas)
          if (age &&
            age.length > 0 &&
            age.length < 50 &&
            !age.includes('unknown') &&
            !age.includes('content') &&
            !age.includes('width') &&
            !age.includes('height') &&
            !age.includes('style') &&
            !age.includes('class') &&
            !age.includes('png') &&
            !age.includes('jpg') &&
            !age.includes('jpeg') &&
            !age.includes('gif') &&
            !age.includes('svg') &&
            !age.includes('_') &&
            !age.includes('x') &&
            /\d/.test(age) &&
            /[a-zA-Z]/.test(age)) { // Deve conter pelo menos uma letra
            data.domainAge = age;
            console.log(`📅 Idade do domínio extraída: ${age}`);
            break;
          }
        }
      }

      // Extrair descrição do meta tag
      const descriptionMatch = html.match(/<meta[^>]*description[^>]*content="([^"]*)"/i);
      if (descriptionMatch) {
        data.description = descriptionMatch[1];
      }

      // Extrair fatores de risco
      const riskFactors = [];
      const riskMatches = html.match(/risk[:\s]*([^<>\n]+)/gi);
      if (riskMatches) {
        riskMatches.forEach(match => {
          const factor = match.replace(/risk[:\s]*/i, '').trim();
          if (factor && factor.length > 3 && !factor.includes('|') && !factor.includes('>')) {
            riskFactors.push(factor);
          }
        });
      }
      data.factors = riskFactors.slice(0, 3); // Limitar a 3 fatores

      // Se não conseguimos extrair dados válidos, usar dados padrão
      if (data.trustScore < 10) {
        return this.getDefaultScamAdviserData(domain);
      }

      // Se não conseguiu extrair idade do domínio, definir como "Desconhecida"
      if (!data.domainAge) {
        data.domainAge = "Desconhecida";
        console.log(`⚠️ Idade do domínio não encontrada para ${domain}, definindo como "Desconhecida"`);
      }

      return data;

    } catch (error) {
      console.error('Erro ao fazer parse do HTML do ScamAdviser:', error);
      return this.getDefaultScamAdviserData(domain);
    }
  }

  /**
   * Retorna dados padrão do ScamAdviser baseados no domínio
   */
  getDefaultScamAdviserData(domain) {
    return {
      trustScore: 50,
      riskLevel: 'medium',
      isScam: false,
      confidence: 'low',
      country: 'Brasil',
      language: 'Português',
      description: 'Fonte analisada automaticamente',
      domainAge: 'Não disponível',
      factors: ['Domínio não encontrado na base de dados externa']
    };
  }

  /**
   * Calcula credibilidade baseada apenas nos dados do ScamAdviser
   */
  calculateCredibility(analysis) {
    const scamData = analysis.scamAdviserData;

    if (!scamData || scamData.error) {
      return 0.3; // Credibilidade baixa se não conseguir dados
    }

    // Usar diretamente o trust score do ScamAdviser
    const trustScore = scamData.trustScore || 50;
    return trustScore / 100; // Converter para 0-1
  }

  /**
   * Determina o tipo de fonte baseado apenas nos dados do ScamAdviser
   */
  determineSourceType(analysis) {
    const scamData = analysis.scamAdviserData;

    if (!scamData) return 'unknown';

    if (scamData.isScam) {
      return 'suspicious';
    }

    if (scamData.trustScore >= 80) {
      return 'reliable';
    } else if (scamData.trustScore >= 60) {
      return 'moderate';
    } else {
      return 'suspicious';
    }
  }

  /**
   * Gera descrição baseada nos dados do ScamAdviser
   */
  generateDescriptionFromScamAdviser(analysis) {
    const scamData = analysis.scamAdviserData;

    if (!scamData) {
      return 'Fonte analisada automaticamente';
    }

    if (scamData.error) {
      return 'Fonte analisada automaticamente';
    }

    const score = scamData.trustScore || 50;
    const risk = scamData.riskLevel || 'medium';

    // Descrição mais limpa e concisa
    let description = `Score de confiança: ${score}/100`;

    if (scamData.country && scamData.country !== 'Brasil') {
      description += `, País: ${scamData.country}`;
    }

    return description;
  }

  /**
   * Adiciona fonte ao banco de dados
   */
  async addSourceToDatabase(sourceData) {
    try {
      console.log(`💾 Adicionando fonte ao banco:`, {
        nome: sourceData.nome,
        site: sourceData.site,
        peso: sourceData.peso,
        tipo: sourceData.tipo
      });

      // Verificar se a fonte já existe pelo SITE (mais específico)
      const existingSource = await query(
        'SELECT id, nome, site FROM fontes WHERE site = $1',
        [sourceData.site]
      );

      if (existingSource.rows.length > 0) {
        console.log(`🔄 Fonte existente encontrada:`, existingSource.rows[0]);
        // Atualizar fonte existente
        const result = await query(
          `UPDATE fontes 
           SET nome = $1, peso = $2, tipo = $3, descricao = $4, updated_at = NOW()
           WHERE id = $5
           RETURNING id, nome, site`,
          [sourceData.nome, sourceData.peso, sourceData.tipo, sourceData.descricao, existingSource.rows[0].id]
        );
        console.log(`✅ Fonte atualizada:`, result.rows[0]);
        return result.rows[0].id;
      } else {
        // Inserir nova fonte
        const result = await query(
          `INSERT INTO fontes (nome, site, peso, tipo, descricao, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
           RETURNING id, nome, site`,
          [sourceData.nome, sourceData.site, sourceData.peso, sourceData.tipo, sourceData.descricao]
        );
        console.log(`✅ Nova fonte inserida:`, result.rows[0]);
        return result.rows[0].id;
      }
    } catch (error) {
      console.error('Erro ao adicionar fonte ao banco:', error);
      throw error;
    }
  }
}

export default ExternalSourceAnalyzer;
