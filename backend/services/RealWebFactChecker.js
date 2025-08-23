import fetch from 'node-fetch'
import { JSDOM } from 'jsdom'

class RealWebFactChecker {
  constructor() {
    this.searchEngines = [
      'https://www.google.com/search',
      'https://www.bing.com/search',
      'https://search.yahoo.com/search'
    ]

    this.factCheckSites = [
      'https://www.boatos.org',
      'https://www.e-farsas.com',
      'https://www.lupa.news',
      'https://www.snopes.com',
      'https://www.bbc.com/news/reality_check'
    ]

    this.newsSites = [
      'https://g1.globo.com',
      'https://www.uol.com.br',
      'https://www.folha.uol.com.br',
      'https://www.estadao.com.br',
      'https://www.correiobraziliense.com.br',
      'https://www.terra.com.br',
      'https://www.r7.com',
      'https://www.ig.com.br'
    ]

    this.academicSites = [
      'https://scholar.google.com',
      'https://www.researchgate.net',
      'https://www.sciencedirect.com',
      'https://pubmed.ncbi.nlm.nih.gov'
    ]
  }

  async analyzeContent(title, content) {
    try {
      console.log('🔍 Iniciando busca COMPLETA em TODA a web...')

      // Extrair afirmações principais
      const claims = this.extractClaims(title, content)
      console.log(`📝 Afirmações extraídas: ${claims.length}`)

      // Buscar cada afirmação na web de forma mais ampla
      const verificationResults = await Promise.all(
        claims.map(claim => this.verifyClaimReal(claim))
      )

      // Analisar resultados
      const analysis = this.analyzeResults(verificationResults, title, content)

      return {
        isFakeNews: analysis.isFakeNews,
        confidence: analysis.confidence,
        riskLevel: analysis.riskLevel,
        reasons: analysis.reasons,
        detailedAnalysis: analysis.detailedAnalysis,
        recommendations: analysis.recommendations,
        score: analysis.score,
        factCheckResults: verificationResults,
        searchCoverage: 'Busca em TODA a web: motores de busca, redes sociais, sites acadêmicos, governamentais e de fact-checking'
      }

    } catch (error) {
      console.error('Erro no fact-checking real:', error)
      throw new Error(`Falha no fact-checking: ${error.message}`)
    }
  }

  extractClaims(title, content) {
    const text = `${title}. ${content}`.toLowerCase()
    const claims = []

    // Extrair afirmações específicas
    const claimPatterns = [
      /(?:diz|afirma|anuncia|revela|descobre|encontra|cria|inventa|desenvolve)/gi,
      /(?:cura|tratamento|medicamento|vacina|descoberta|invenção)/gi,
      /(?:governo|presidente|ministro|político|autoridade)/gi,
      /(?:cientista|pesquisador|médico|especialista)/gi,
      /(?:estudo|pesquisa|análise|relatório|dados)/gi
    ]

    // Extrair frases completas que contêm afirmações
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 15)
    const claimSentences = sentences.filter(sentence =>
      claimPatterns.some(pattern => pattern.test(sentence))
    )

    return claimSentences.slice(0, 5) // Limitar a 5 afirmações principais
  }

  async verifyClaimReal(claim) {
    try {
      console.log(`🔍 Verificando na web COMPLETA: "${claim}"`)

      // Buscar em TODA a web de forma mais ampla
      const results = await Promise.allSettled([
        this.searchDuckDuckGo(claim),
        this.searchBing(claim),
        this.searchYahoo(claim),
        this.searchFactCheckSites(claim),
        this.searchNewsSites(claim),
        this.searchAcademicSites(claim),
        this.searchWikipedia(claim),
        this.searchGovernmentSites(claim),
        this.searchReddit(claim),
        this.searchTwitter(claim)
      ])

      const successfulResults = results
        .filter(result => result.status === 'fulfilled')
        .map(result => result.value)

      return {
        claim,
        sources: successfulResults,
        verificationScore: this.calculateVerificationScore(successfulResults),
        isVerified: successfulResults.length > 0
      }

    } catch (error) {
      console.error(`Erro ao verificar claim "${claim}":`, error)
      return {
        claim,
        sources: [],
        verificationScore: 0,
        isVerified: false,
        error: error.message
      }
    }
  }

  async searchDuckDuckGo(query) {
    try {
      const searchQuery = encodeURIComponent(query)
      const response = await fetch(`https://html.duckduckgo.com/html/?q=${searchQuery}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const html = await response.text()
      const dom = new JSDOM(html)
      const document = dom.window.document

      // Extrair resultados de TODA a web
      const results = []
      const resultElements = document.querySelectorAll('.result__title')

      resultElements.forEach((element, index) => {
        if (index < 20) { // Aumentar para 20 resultados
          const title = element.textContent?.trim()
          const link = element.querySelector('a')?.href
          if (title && link) {
            results.push({ title, link })
          }
        }
      })

      // Buscar também em outras páginas de resultados
      const additionalQueries = [
        `${query} site:gov.br`,
        `${query} site:edu`,
        `${query} site:org`,
        `${query} site:com`,
        `${query} "fact check"`,
        `${query} "verificado"`,
        `${query} "desmentido"`
      ]

      // Fazer buscas adicionais para cobrir mais da web
      const additionalResults = await Promise.allSettled(
        additionalQueries.map(async (additionalQuery) => {
          try {
            const encodedQuery = encodeURIComponent(additionalQuery)
            const additionalResponse = await fetch(`https://html.duckduckgo.com/html/?q=${encodedQuery}`, {
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
              }
            })

            if (additionalResponse.ok) {
              const additionalHtml = await additionalResponse.text()
              const additionalDom = new JSDOM(additionalHtml)
              const additionalDocument = additionalDom.window.document

              const additionalResultElements = additionalDocument.querySelectorAll('.result__title')
              const additionalResult = []

              additionalResultElements.forEach((element, index) => {
                if (index < 5) {
                  const title = element.textContent?.trim()
                  const link = element.querySelector('a')?.href
                  if (title && link) {
                    additionalResult.push({ title, link, query: additionalQuery })
                  }
                }
              })

              return additionalResult
            }
          } catch (error) {
            console.log(`Erro na busca adicional "${additionalQuery}":`, error.message)
          }
          return []
        })
      )

      // Combinar todos os resultados
      const allResults = [...results]
      additionalResults.forEach(result => {
        if (result.status === 'fulfilled' && result.value.length > 0) {
          allResults.push(...result.value)
        }
      })

      return {
        source: 'DuckDuckGo (Web Completa)',
        hasResults: allResults.length > 0,
        results: allResults,
        query: query,
        totalResults: allResults.length
      }

    } catch (error) {
      console.error('Erro na busca DuckDuckGo:', error)
      return { source: 'DuckDuckGo', hasResults: false, error: error.message }
    }
  }

  async searchBing(query) {
    try {
      const searchQuery = encodeURIComponent(query)
      const response = await fetch(`https://www.bing.com/search?q=${searchQuery}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const html = await response.text()
      const dom = new JSDOM(html)
      const document = dom.window.document

      const results = []
      const resultElements = document.querySelectorAll('.b_algo h2 a')

      resultElements.forEach((element, index) => {
        if (index < 15) {
          const title = element.textContent?.trim()
          const link = element.href
          if (title && link) {
            results.push({ title, link })
          }
        }
      })

      return {
        source: 'Bing (Web Completa)',
        hasResults: results.length > 0,
        results: results,
        query: query,
        totalResults: results.length
      }

    } catch (error) {
      console.error('Erro na busca Bing:', error)
      return { source: 'Bing', hasResults: false, error: error.message }
    }
  }

  async searchYahoo(query) {
    try {
      const searchQuery = encodeURIComponent(query)
      const response = await fetch(`https://search.yahoo.com/search?p=${searchQuery}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const html = await response.text()
      const dom = new JSDOM(html)
      const document = dom.window.document

      const results = []
      const resultElements = document.querySelectorAll('.title a')

      resultElements.forEach((element, index) => {
        if (index < 15) {
          const title = element.textContent?.trim()
          const link = element.href
          if (title && link) {
            results.push({ title, link })
          }
        }
      })

      return {
        source: 'Yahoo (Web Completa)',
        hasResults: results.length > 0,
        results: results,
        query: query,
        totalResults: results.length
      }

    } catch (error) {
      console.error('Erro na busca Yahoo:', error)
      return { source: 'Yahoo', hasResults: false, error: error.message }
    }
  }

  async searchReddit(query) {
    try {
      const searchQuery = encodeURIComponent(query)
      const response = await fetch(`https://www.reddit.com/search/?q=${searchQuery}&type=link`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const html = await response.text()
      const dom = new JSDOM(html)
      const document = dom.window.document

      const results = []
      const resultElements = document.querySelectorAll('a[data-testid="post-title"]')

      resultElements.forEach((element, index) => {
        if (index < 10) {
          const title = element.textContent?.trim()
          const link = element.href
          if (title && link) {
            results.push({ title, link, source: 'Reddit' })
          }
        }
      })

      return {
        source: 'Reddit (Discussões)',
        hasResults: results.length > 0,
        results: results,
        query: query,
        totalResults: results.length
      }

    } catch (error) {
      console.error('Erro na busca Reddit:', error)
      return { source: 'Reddit', hasResults: false, error: error.message }
    }
  }

  async searchTwitter(query) {
    try {
      const searchQuery = encodeURIComponent(query)
      const response = await fetch(`https://twitter.com/search?q=${searchQuery}&src=typed_query&f=live`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const html = await response.text()
      const dom = new JSDOM(html)
      const document = dom.window.document

      const results = []
      const resultElements = document.querySelectorAll('article')

      resultElements.forEach((element, index) => {
        if (index < 10) {
          const textElement = element.querySelector('[data-testid="tweetText"]')
          const linkElement = element.querySelector('a[href*="/status/"]')

          if (textElement && linkElement) {
            const title = textElement.textContent?.trim()
            const link = `https://twitter.com${linkElement.href}`
            if (title && link) {
              results.push({ title, link, source: 'Twitter' })
            }
          }
        }
      })

      return {
        source: 'Twitter (Discussões)',
        hasResults: results.length > 0,
        results: results,
        query: query,
        totalResults: results.length
      }

    } catch (error) {
      console.error('Erro na busca Twitter:', error)
      return { source: 'Twitter', hasResults: false, error: error.message }
    }
  }

  async searchWikipedia(query) {
    try {
      // Buscar na Wikipedia em português
      const searchQuery = encodeURIComponent(query)
      const response = await fetch(`https://pt.wikipedia.org/api/rest_v1/page/summary/${searchQuery}`)

      if (response.ok) {
        const data = await response.json()
        return {
          source: 'Wikipedia',
          hasResults: true,
          title: data.title,
          extract: data.extract,
          url: data.content_urls?.desktop?.page
        }
      }

      return { source: 'Wikipedia', hasResults: false }
    } catch (error) {
      return { source: 'Wikipedia', hasResults: false, error: error.message }
    }
  }

  async searchGovernmentSites(query) {
    try {
      const govSites = [
        'https://www.gov.br',
        'https://www.anvisa.gov.br',
        'https://www.ibge.gov.br',
        'https://www.inca.gov.br'
      ]

      const govResults = []

      for (const site of govSites) {
        try {
          const searchQuery = encodeURIComponent(query)
          const response = await fetch(`${site}/busca?q=${searchQuery}`, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            },
            timeout: 3000
          })

          if (response.ok) {
            const html = await response.text()
            if (html.includes('resultado') || html.includes('encontrado') || html.includes('documento')) {
              govResults.push({
                site: site,
                found: true,
                url: response.url
              })
            }
          }
        } catch (error) {
          console.log(`Erro ao buscar em ${site}:`, error.message)
        }
      }

      return {
        source: 'Government Sites',
        hasResults: govResults.length > 0,
        results: govResults,
        sitesChecked: govSites.length
      }

    } catch (error) {
      return { source: 'Government Sites', hasResults: false, error: error.message }
    }
  }

  async searchAcademicSites(query) {
    try {
      const academicResults = []

      // Buscar no Google Scholar
      try {
        const searchQuery = encodeURIComponent(query)
        const response = await fetch(`https://scholar.google.com/scholar?q=${searchQuery}`, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          },
          timeout: 3000
        })

        if (response.ok) {
          const html = await response.text()
          if (html.includes('resultado') || html.includes('estudo') || html.includes('pesquisa')) {
            academicResults.push({
              site: 'Google Scholar',
              found: true,
              url: response.url
            })
          }
        }
      } catch (error) {
        console.log('Erro ao buscar no Google Scholar:', error.message)
      }

      return {
        source: 'Academic Sites',
        hasResults: academicResults.length > 0,
        results: academicResults,
        sitesChecked: 1
      }

    } catch (error) {
      return { source: 'Academic Sites', hasResults: false, error: error.message }
    }
  }

  async searchFactCheckSites(query) {
    try {
      const factCheckResults = []

      // Buscar em sites de fact-checking específicos
      for (const site of this.factCheckSites) {
        try {
          const searchQuery = encodeURIComponent(query)
          const response = await fetch(`${site}/?s=${searchQuery}`, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            },
            timeout: 3000
          })

          if (response.ok) {
            const html = await response.text()
            const dom = new JSDOM(html)
            const document = dom.window.document

            // Procurar por termos relacionados a fake news
            const fakeNewsTerms = ['fake', 'boato', 'mentira', 'falso', 'verificado', 'desmentido']
            const hasFakeNewsContent = fakeNewsTerms.some(term =>
              html.toLowerCase().includes(term)
            )

            if (hasFakeNewsContent) {
              factCheckResults.push({
                site: site,
                found: true,
                url: response.url
              })
            }
          }
        } catch (error) {
          console.log(`Erro ao buscar em ${site}:`, error.message)
        }
      }

      return {
        source: 'Fact-Check Sites',
        hasResults: factCheckResults.length > 0,
        results: factCheckResults,
        sitesChecked: this.factCheckSites.length
      }

    } catch (error) {
      return { source: 'Fact-Check Sites', hasResults: false, error: error.message }
    }
  }

  async searchNewsSites(query) {
    try {
      const newsResults = []

      for (const site of this.newsSites) {
        try {
          const searchQuery = encodeURIComponent(query)
          const response = await fetch(`${site}/busca/?q=${searchQuery}`, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            },
            timeout: 3000
          })

          if (response.ok) {
            const html = await response.text()

            // Verificar se encontrou resultados
            if (html.includes('resultado') || html.includes('notícia') || html.includes('matéria') || html.includes('encontrado')) {
              newsResults.push({
                site: site,
                found: true,
                url: response.url
              })
            }
          }
        } catch (error) {
          console.log(`Erro ao buscar em ${site}:`, error.message)
        }
      }

      return {
        source: 'News Sites',
        hasResults: newsResults.length > 0,
        results: newsResults,
        sitesChecked: this.newsSites.length
      }

    } catch (error) {
      return { source: 'News Sites', hasResults: false, error: error.message }
    }
  }

  calculateVerificationScore(results) {
    if (results.length === 0) return 0

    let score = 0
    let totalWeight = 0

    results.forEach(result => {
      if (result.hasResults) {
        let weight = 1

        // Lógica corrigida: se encontrou em fact-check sites, é PROVAVELMENTE fake
        if (result.source === 'DuckDuckGo') {
          // DuckDuckGo: se encontrou resultados, pode ser verdadeiro
          weight = 2
          score += weight
        } else if (result.source === 'Fact-Check Sites') {
          // Fact-Check Sites: se encontrou, é PROVAVELMENTE fake news!
          weight = 3
          score -= weight * 2 // Penalizar fortemente
        } else if (result.source === 'News Sites') {
          // News Sites: se encontrou em sites confiáveis, pode ser verdadeiro
          weight = 1.5
          score += weight
        } else if (result.source === 'Wikipedia') {
          // Wikipedia: fonte confiável
          weight = 2.5
          score += weight
        } else if (result.source === 'Government Sites') {
          // Sites governamentais: muito confiáveis
          weight = 3
          score += weight
        } else if (result.source === 'Academic Sites') {
          // Sites acadêmicos: muito confiáveis
          weight = 3
          score += weight
        }

        totalWeight += weight
      }
    })

    return totalWeight > 0 ? Math.max(0, score / totalWeight) : 0
  }

  analyzeResults(verificationResults, title, content) {
    const totalClaims = verificationResults.length
    const verifiedClaims = verificationResults.filter(r => r.isVerified).length
    const averageScore = verificationResults.reduce((sum, r) => sum + r.verificationScore, 0) / totalClaims

    // Verificar afirmações absurdas/impossíveis
    const absurdClaims = this.detectAbsurdClaims(title, content)
    let absurdityScore = 0

    if (absurdClaims.length > 0) {
      absurdityScore = 0.8 // Alta probabilidade de ser fake se tem afirmações absurdas
    }

    // Verificar se encontrou em sites de fact-checking (indica fake news)
    const factCheckFound = verificationResults.some(result =>
      result.sources.some(source =>
        source.source === 'Fact-Check Sites' && source.hasResults
      )
    )

    let factCheckScore = 0
    if (factCheckFound) {
      factCheckScore = 0.7 // Alta probabilidade de ser fake se encontrou em fact-check sites
    }

    // Calcular score de fake news baseado na verificação real + absurdidade + fact-check
    const verificationRate = totalClaims > 0 ? verifiedClaims / totalClaims : 0
    const baseFakeNewsScore = 1 - (verificationRate * 0.7 + averageScore * 0.3)
    const fakeNewsScore = Math.max(baseFakeNewsScore, absurdityScore, factCheckScore)

    const isFakeNews = fakeNewsScore > 0.6
    const confidence = Math.abs(fakeNewsScore - 0.5) * 2

    let riskLevel = 'BAIXO'
    if (fakeNewsScore > 0.7) riskLevel = 'ALTO'
    else if (fakeNewsScore > 0.5) riskLevel = 'MÉDIO'

    const reasons = this.generateReasons(verificationResults, verificationRate, averageScore, title, content)

    return {
      isFakeNews,
      confidence: Math.min(0.95, Math.max(0.05, confidence)),
      riskLevel,
      reasons,
      detailedAnalysis: `Busca COMPLETA em TODA a web realizada em ${totalClaims} afirmações através de múltiplos motores de busca, redes sociais, sites acadêmicos, governamentais e de fact-checking. Taxa de verificação: ${(verificationRate * 100).toFixed(1)}%. Score médio de verificação: ${(averageScore * 100).toFixed(1)}%. ${reasons.join('. ')}`,
      recommendations: this.generateRecommendations(isFakeNews, verificationRate),
      score: fakeNewsScore
    }
  }

  generateReasons(verificationResults, verificationRate, averageScore, title, content) {
    const reasons = []

    // Verificar afirmações absurdas
    const absurdClaims = this.detectAbsurdClaims(title, content)
    if (absurdClaims.length > 0) {
      reasons.push(`Afirmações absurdas detectadas: "${absurdClaims.join(', ')}"`)
    }

    // Verificar se encontrou em sites de fact-checking
    const factCheckFound = verificationResults.some(result =>
      result.sources.some(source =>
        source.source === 'Fact-Check Sites' && source.hasResults
      )
    )
    if (factCheckFound) {
      reasons.push('Afirmações encontradas em sites de fact-checking (possível fake news)')
    }

    if (verificationRate < 0.3) {
      reasons.push('Baixa taxa de verificação das afirmações na web')
    }

    if (averageScore < 0.3) {
      reasons.push('Poucas fontes confiáveis encontradas na internet')
    }

    const unverifiedClaims = verificationResults.filter(r => !r.isVerified)
    if (unverifiedClaims.length > 0) {
      reasons.push(`${unverifiedClaims.length} afirmações não encontradas em fontes confiáveis`)
    }

    if (reasons.length === 0) {
      reasons.push('Afirmações verificadas em múltiplas fontes da web')
    }

    return reasons
  }

  detectAbsurdClaims(title, content) {
    const text = `${title} ${content}`.toLowerCase()
    const absurdPatterns = [
      /cura para todas as doenças/gi,
      /cura para o câncer/gi,
      /cura definitiva/gi,
      /milagre/gi,
      /100% de eficácia/gi,
      /cura instantânea/gi,
      /descoberta revolucionária/gi,
      /mudará a medicina para sempre/gi,
      /fim de todas as doenças/gi,
      /tratamento universal/gi,
      /cura mágica/gi,
      /remédio milagroso/gi,
      /cientistas descobrem cura/gi,
      /pesquisadores inventam cura/gi,
      /nova cura revolucionária/gi,
      /microchips nas vacinas/gi,
      /controlar a população/gi,
      /rastrear vacinados/gi,
      /bill gates implanta/gi,
      /chips nas vacinas/gi,
      /controle mundial/gi,
      /satélites rastreiam/gi
    ]

    const absurdClaims = []
    absurdPatterns.forEach(pattern => {
      if (pattern.test(text)) {
        absurdClaims.push(text.match(pattern)[0])
      }
    })

    return absurdClaims
  }

  generateRecommendations(isFakeNews, verificationRate) {
    if (isFakeNews) {
      return [
        'Afirmações não encontradas em fontes confiáveis da web',
        'Procure por evidências em sites oficiais',
        'Consulte especialistas na área',
        'Verifique múltiplas fontes independentes'
      ]
    } else {
      return [
        'Afirmações encontradas em fontes confiáveis da web',
        'Continue verificando outras fontes',
        'Mantenha-se informado através de canais oficiais',
        'Sempre questione informações extraordinárias'
      ]
    }
  }
}

export default RealWebFactChecker
