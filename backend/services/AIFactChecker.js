import fetch from 'node-fetch'
import { JSDOM } from 'jsdom'

class AIFactChecker {
    constructor() {
        this.ollamaUrl = 'http://localhost:11434' // Ollama local (gratuito)
        this.freeAIApis = [
            'https://api.free-ai.com/v1/chat/completions', // Exemplo de API gratuita
            'https://api.openai.com/v1/chat/completions' // OpenAI (pode ter tier gratuito)
        ]
    }

    async analyzeContent(title, content) {
        try {
            console.log('🤖 Iniciando análise com IA gratuita + busca na web...')

            // Primeiro fazer busca na web
            const webResults = await this.searchWeb(title, content)

            // Depois analisar com IA gratuita
            const aiAnalysis = await this.analyzeWithFreeAI(title, content, webResults)

            // Combinar resultados
            const combinedAnalysis = this.combineResults(webResults, aiAnalysis)

            return {
                isFakeNews: combinedAnalysis.isFakeNews,
                confidence: combinedAnalysis.confidence,
                riskLevel: combinedAnalysis.riskLevel,
                reasons: combinedAnalysis.reasons,
                detailedAnalysis: combinedAnalysis.detailedAnalysis,
                recommendations: combinedAnalysis.recommendations,
                score: combinedAnalysis.score,
                webResults: webResults,
                aiAnalysis: aiAnalysis,
                searchCoverage: 'Busca na web + Análise de IA gratuita (Ollama + APIs gratuitas)'
            }

        } catch (error) {
            console.error('Erro na análise com IA:', error)
            throw new Error(`Falha na análise: ${error.message}`)
        }
    }

    async searchWeb(title, content) {
        try {
            console.log('🔍 Buscando na web...')

            // Busca simples usando DuckDuckGo
            const searchQuery = `${title} ${content}`.substring(0, 100)
            const response = await fetch(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(searchQuery)}`, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            })

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`)
            }

            const html = await response.text()
            const dom = new JSDOM(html)
            const document = dom.window.document

            const results = []
            const resultElements = document.querySelectorAll('.result__title')

            resultElements.forEach((element, index) => {
                if (index < 10) {
                    const title = element.textContent?.trim()
                    const link = element.querySelector('a')?.href
                    if (title && link) {
                        results.push({ title, link })
                    }
                }
            })

            return {
                hasResults: results.length > 0,
                results: results,
                totalResults: results.length
            }

        } catch (error) {
            console.error('Erro na busca web:', error)
            return { hasResults: false, results: [], totalResults: 0 }
        }
    }

    async analyzeWithFreeAI(title, content, webResults) {
        try {
            console.log('🤖 Analisando com IA gratuita...')

            // Tentar Ollama primeiro (local, gratuito)
            let ollamaResult = await this.analyzeWithOllama(title, content, webResults)

            if (ollamaResult) {
                return ollamaResult
            }

            // Se Ollama falhar, tentar APIs gratuitas
            let freeAPIResult = await this.analyzeWithFreeAPIs(title, content, webResults)

            if (freeAPIResult) {
                return freeAPIResult
            }

            // Fallback: análise baseada em regras
            return this.fallbackAnalysis(title, content, webResults)

        } catch (error) {
            console.error('Erro na análise com IA:', error)
            return this.fallbackAnalysis(title, content, webResults)
        }
    }

    async analyzeWithOllama(title, content, webResults) {
        try {
            const prompt = this.buildAIPrompt(title, content, webResults)

            const response = await fetch(`${this.ollamaUrl}/api/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: 'llama2', // Modelo gratuito
                    prompt: prompt,
                    stream: false
                })
            })

            if (!response.ok) {
                console.log('Ollama não disponível, tentando outras opções...')
                return null
            }

            const data = await response.json()
            const aiResponse = data.response

            return this.parseAIResponse(aiResponse)

        } catch (error) {
            console.log('Ollama não disponível:', error.message)
            return null
        }
    }

    async analyzeWithFreeAPIs(title, content, webResults) {
        try {
            const prompt = this.buildAIPrompt(title, content, webResults)

            // Tentar APIs gratuitas
            for (const apiUrl of this.freeAIApis) {
                try {
                    const response = await fetch(apiUrl, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            model: 'gpt-3.5-turbo',
                            messages: [
                                {
                                    role: 'system',
                                    content: 'Você é um especialista em fact-checking. Analise se a notícia é fake news ou não.'
                                },
                                {
                                    role: 'user',
                                    content: prompt
                                }
                            ],
                            max_tokens: 500
                        })
                    })

                    if (response.ok) {
                        const data = await response.json()
                        const aiResponse = data.choices[0].message.content

                        return this.parseAIResponse(aiResponse)
                    }
                } catch (error) {
                    console.log(`API ${apiUrl} não disponível:`, error.message)
                    continue
                }
            }

            return null

        } catch (error) {
            console.error('Erro nas APIs gratuitas:', error)
            return null
        }
    }

    buildAIPrompt(title, content, webResults) {
        const webInfo = webResults.hasResults
            ? `Encontrei ${webResults.totalResults} resultados relacionados na web.`
            : 'Não encontrei resultados específicos na web.'

        return `
ANÁLISE DE FACT-CHECKING

TÍTULO: ${title}
CONTEÚDO: ${content}

INFORMAÇÕES DA WEB: ${webInfo}

Por favor, analise se esta notícia é fake news ou não. Considere:

1. Se as afirmações são verificáveis
2. Se há evidências na web
3. Se o conteúdo parece crível
4. Se há padrões típicos de fake news

Responda no formato JSON:
{
  "isFakeNews": true/false,
  "confidence": 0.0-1.0,
  "riskLevel": "BAIXO/MÉDIO/ALTO",
  "reasons": ["razão1", "razão2"],
  "recommendations": ["rec1", "rec2"]
}
`
    }

    parseAIResponse(aiResponse) {
        try {
            // Tentar extrair JSON da resposta
            const jsonMatch = aiResponse.match(/\{[\s\S]*\}/)
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0])
                return {
                    isFakeNews: parsed.isFakeNews || false,
                    confidence: parsed.confidence || 0.5,
                    riskLevel: parsed.riskLevel || 'MÉDIO',
                    reasons: parsed.reasons || [],
                    recommendations: parsed.recommendations || [],
                    source: 'IA Gratuita'
                }
            }

            // Se não conseguir extrair JSON, fazer análise de texto
            return this.analyzeTextResponse(aiResponse)

        } catch (error) {
            console.error('Erro ao parsear resposta da IA:', error)
            return this.analyzeTextResponse(aiResponse)
        }
    }

    analyzeTextResponse(text) {
        const lowerText = text.toLowerCase()

        let isFakeNews = false
        let confidence = 0.5
        let riskLevel = 'MÉDIO'
        const reasons = []
        const recommendations = []

        // Análise baseada em palavras-chave
        if (lowerText.includes('fake') || lowerText.includes('falso') || lowerText.includes('mentira')) {
            isFakeNews = true
            confidence = 0.7
            riskLevel = 'ALTO'
            reasons.push('IA detectou padrões de fake news')
        }

        if (lowerText.includes('verdadeiro') || lowerText.includes('confiável') || lowerText.includes('verificado')) {
            isFakeNews = false
            confidence = 0.6
            riskLevel = 'BAIXO'
            reasons.push('IA identificou como informação confiável')
        }

        return {
            isFakeNews,
            confidence,
            riskLevel,
            reasons,
            recommendations,
            source: 'IA Gratuita (Análise de Texto)'
        }
    }

    fallbackAnalysis(title, content, webResults) {
        console.log('🔄 Usando análise de fallback...')

        const text = `${title} ${content}`.toLowerCase()

        // Detectar padrões de fake news mais abrangentes
        const fakeNewsPatterns = [
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
            /satélites rastreiam/gi,
            /distribuído gratuitamente em todo o mundo/gi,
            /descoberta revolucionária/gi,
            /todas as doenças conhecidas/gi
        ]

        const hasFakePatterns = fakeNewsPatterns.some(pattern => pattern.test(text))

        // Detectar múltiplos padrões para aumentar certeza
        const matchedPatterns = fakeNewsPatterns.filter(pattern => pattern.test(text))

        // Extrair os textos que matcharam para mostrar ao usuário
        const matchedTexts = matchedPatterns.slice(0, 3).map(pattern => {
            const match = text.match(pattern)
            return match ? match[0] : ''
        }).filter(text => text.length > 0)

        return {
            isFakeNews: hasFakePatterns,
            confidence: 0.85, // Confiança na análise (sempre alta quando detecta padrões)
            riskLevel: hasFakePatterns ? 'ALTO' : 'BAIXO',
            reasons: hasFakePatterns
                ? [`Padrões típicos de fake news detectados: "${matchedTexts.join(', ')}"`]
                : ['Análise básica não detectou padrões suspeitos'],
            recommendations: hasFakePatterns
                ? ['Verifique fontes oficiais', 'Consulte especialistas', 'Procure por evidências científicas']
                : ['Continue verificando outras fontes'],
            source: 'Análise de Fallback'
        }
    }

    combineResults(webResults, aiAnalysis) {
        // Determinar se é fake news ou não
        const isFakeNews = aiAnalysis.isFakeNews

        // Determinar nível de risco primeiro
        let riskLevel = 'BAIXO'
        let confidence = 0.8 // Alta confiança para baixo risco

        if (isFakeNews) {
            // Se é fake news, verificar se tem padrões claros
            const hasClearPatterns = aiAnalysis.reasons.some(reason =>
                reason.includes('Padrões típicos de fake news detectados')
            )

            if (hasClearPatterns) {
                riskLevel = 'ALTO' // Padrões claros = alto risco
                confidence = 0.3   // Baixa confiança (sistema não tem certeza absoluta)
            } else {
                riskLevel = 'MÉDIO' // Sem padrões claros = risco médio
                confidence = 0.5    // Confiança média
            }
        } else {
            // Se não é fake news
            if (webResults.hasResults) {
                confidence = 0.9 // Alta confiança se encontrou informações na web
            } else {
                confidence = 0.7 // Confiança moderada se não encontrou
            }
        }

        const reasons = [
            ...aiAnalysis.reasons,
            webResults.hasResults
                ? 'Informações encontradas na web'
                : 'Poucas informações encontradas na web'
        ]

        return {
            isFakeNews,
            confidence: Math.min(0.95, Math.max(0.05, confidence)),
            riskLevel,
            reasons,
            detailedAnalysis: `Análise combinada: Web (${webResults.totalResults} resultados) + IA (${aiAnalysis.source}). ${isFakeNews ? 'FAKE NEWS DETECTADA' : 'NOTÍCIA APARENTA SER REAL'}. Confiança na análise: ${(confidence * 100).toFixed(1)}%`,
            recommendations: aiAnalysis.recommendations,
            score: isFakeNews ? 0.8 : 0.2 // Score alto para fake news, baixo para real
        }
    }
}

export default AIFactChecker
