import fetch from 'node-fetch'

class AIFactChecker {
    constructor() {
        console.log('🤖 AIFactChecker inicializado - Usando Groq e Perplexity')
        
        // APIs gratuitas
        this.apis = {
            groq: {
                url: 'https://api.groq.com/openai/v1/chat/completions',
                model: 'llama-3.1-8b-instant',
                keyEnv: 'GROQ_API_KEY'
            },
            perplexity: {
                url: 'https://api.perplexity.ai/chat/completions',
                model: 'llama-3.1-8b-instant',
                keyEnv: 'PERPLEXITY_API_KEY'
            }
        }
    }

    async analyzeContent(title, content) {
        try {
            console.log('🤖 Iniciando análise com Groq e Perplexity...')

            // Busca na web
            const webResults = await this.searchWeb(title, content)

            // Análise com APIs (Groq primeiro, depois Perplexity)
            const aiAnalysis = await this.analyzeWithAPIs(title, content, webResults)

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
                searchCoverage: `Análise com ${aiAnalysis.source}`
            }

        } catch (error) {
            console.error('Erro na análise com IA:', error)
            throw new Error(`Falha na análise: ${error.message}`)
        }
    }

    async searchWeb(title, content) {
        try {
            console.log('🔍 Buscando na web...')

            // Busca usando DuckDuckGo (gratuito)
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
            
            // Extrair resultados simples (sem JSDOM)
            const results = []
            const titleMatches = html.match(/<a[^>]*class="result__title"[^>]*>([^<]+)<\/a>/g)
            
            if (titleMatches) {
                titleMatches.slice(0, 5).forEach(match => {
                    const title = match.replace(/<[^>]*>/g, '').trim()
                    if (title) {
                        results.push({ title, link: '#' })
                    }
                })
            }

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

    async analyzeWithAPIs(title, content, webResults) {
        console.log('🤖 Analisando com APIs (Groq e Perplexity)...')

        // Tentar Groq primeiro
        try {
            const groqResult = await this.analyzeWithGroq(title, content, webResults)
            if (groqResult) {
                console.log('✅ Análise concluída com Groq')
                return groqResult
            }
        } catch (error) {
            console.log(`⚠️ Groq falhou: ${error.message}`)
        }

        // Se Groq falhar, tentar Perplexity
        try {
            const perplexityResult = await this.analyzeWithPerplexity(title, content, webResults)
            if (perplexityResult) {
                console.log('✅ Análise concluída com Perplexity')
                return perplexityResult
            }
        } catch (error) {
            console.log(`⚠️ Perplexity falhou: ${error.message}`)
        }

        // Se ambas falharem, retornar erro
        throw new Error('Todas as APIs falharam. Configure GROQ_API_KEY ou PERPLEXITY_API_KEY.')
    }

    // Análise com Groq
    async analyzeWithGroq(title, content, webResults) {
        const apiKey = process.env.GROQ_API_KEY
        if (!apiKey) {
            throw new Error('GROQ_API_KEY não configurada')
        }

        const prompt = this.createAnalysisPrompt(title, content, webResults)
        
        const response = await fetch(this.apis.groq.url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: this.apis.groq.model,
                messages: [{ role: 'user', content: prompt }],
                max_tokens: 500,
                temperature: 0.3
            })
        })

        if (!response.ok) {
            throw new Error(`Groq API error: ${response.status}`)
        }

        const data = await response.json()
        return this.parseAIResponse(data.choices[0].message.content, 'Groq')
    }

    // Análise com Perplexity
    async analyzeWithPerplexity(title, content, webResults) {
        const apiKey = process.env.PERPLEXITY_API_KEY
        if (!apiKey) {
            throw new Error('PERPLEXITY_API_KEY não configurada')
        }

        const prompt = this.createAnalysisPrompt(title, content, webResults)
        
        const response = await fetch(this.apis.perplexity.url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: this.apis.perplexity.model,
                messages: [{ role: 'user', content: prompt }],
                max_tokens: 500
            })
        })

        if (!response.ok) {
            throw new Error(`Perplexity API error: ${response.status}`)
        }

        const data = await response.json()
        return this.parseAIResponse(data.choices[0].message.content, 'Perplexity')
    }

    // Cria o prompt para análise
    createAnalysisPrompt(title, content, webResults) {
        return `
Analise esta notícia e determine se é fake news ou confiável:

TÍTULO: ${title}
CONTEÚDO: ${content.substring(0, 500)}...

RESULTADOS DA BUSCA WEB:
${webResults.results.map(r => `- ${r.title}`).join('\n')}

Responda APENAS em formato JSON válido:
{
  "isFakeNews": true/false,
  "confidence": 0.0-1.0,
  "riskLevel": "baixo/medio/alto",
  "reasons": ["razão1", "razão2"],
  "recommendations": ["recomendação1", "recomendação2"],
  "detailedAnalysis": "análise detalhada"
}
        `.trim()
    }

    // Parseia a resposta da IA
    parseAIResponse(response, source) {
        try {
            // Tentar extrair JSON da resposta
            const jsonMatch = response.match(/\{[\s\S]*\}/)
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0])
                return {
                    isFakeNews: parsed.isFakeNews || false,
                    confidence: parsed.confidence || 0.5,
                    riskLevel: parsed.riskLevel || 'medio',
                    reasons: parsed.reasons || [],
                    recommendations: parsed.recommendations || [],
                    detailedAnalysis: parsed.detailedAnalysis || response,
                    source: source
                }
            }

            // Fallback: análise simples baseada em palavras-chave
            return this.analyzeTextResponse(response, source)

        } catch (error) {
            console.error('Erro ao parsear resposta da IA:', error)
            return this.analyzeTextResponse(response, source)
        }
    }

    // Análise de texto quando JSON falha
    analyzeTextResponse(text, source) {
        const lowerText = text.toLowerCase()

        let isFakeNews = false
        let confidence = 0.5
        let riskLevel = 'medio'
        const reasons = []
        const recommendations = []

        // Análise baseada em palavras-chave mais sofisticada
        let fakeScore = 0
        let realScore = 0

        // Palavras que indicam fake news
        const fakeKeywords = [
            'alienígena', 'alienigena', 'ufo', 'ovni', 'nave espacial', 'extraterrestre',
            'conspiração', 'conspiracao', 'mentira', 'falso', 'fake', 'fraude',
            'milagre', 'sobrenatural', 'fantasma', 'demônio', 'demonio',
            'terra plana', 'nasa mente', 'governo esconde', 'verdade oculta',
            'imortal', 'cura milagrosa', 'poderes especiais', 'telepatia'
        ]

        // Palavras que indicam notícia real
        const realKeywords = [
            'estudo', 'pesquisa', 'universidade', 'cientista', 'revista científica',
            'publicado', 'confirmado', 'verificado', 'evidência', 'evidencia',
            'dados', 'estatística', 'estatistica', 'relatório', 'relatorio',
            'análise', 'analise', 'resultado', 'descoberta', 'inovação'
        ]

        // Contar palavras-chave
        fakeKeywords.forEach(keyword => {
            if (lowerText.includes(keyword)) {
                fakeScore += 1
            }
        })

        realKeywords.forEach(keyword => {
            if (lowerText.includes(keyword)) {
                realScore += 1
            }
        })

        // Determinar se é fake news baseado no score
        if (fakeScore > realScore) {
            isFakeNews = true
            // Quanto mais palavras fake, menor a confiança
            if (fakeScore >= 3) {
                confidence = 0.15 // Muito óbvio fake
            } else if (fakeScore >= 2) {
                confidence = 0.25 // Óbvio fake
            } else {
                confidence = 0.35 // Moderadamente fake
            }
            riskLevel = 'alto'
            reasons.push(`IA detectou ${fakeScore} padrões de fake news`)
        } else if (realScore > fakeScore) {
            isFakeNews = false
            // Quanto mais palavras reais, maior a confiança
            if (realScore >= 3) {
                confidence = 0.85 // Muito confiável
            } else if (realScore >= 2) {
                confidence = 0.75 // Confiável
            } else {
                confidence = 0.65 // Moderadamente confiável
            }
            riskLevel = 'baixo'
            reasons.push(`IA detectou ${realScore} padrões de notícia confiável`)
        } else {
            // Empate - usar análise mais simples
            if (lowerText.includes('fake') || lowerText.includes('falso') || lowerText.includes('mentira')) {
                isFakeNews = true
                confidence = 0.3
                riskLevel = 'alto'
                reasons.push('IA detectou padrões de fake news')
            } else if (lowerText.includes('verdadeiro') || lowerText.includes('confiável') || lowerText.includes('verificado')) {
                isFakeNews = false
                confidence = 0.8
                riskLevel = 'baixo'
                reasons.push('IA identificou como informação confiável')
            }
        }

        return {
            isFakeNews,
            confidence,
            riskLevel,
            reasons,
            recommendations,
            detailedAnalysis: text,
            source: `${source} (Análise de Texto)`
        }
    }

    // Combina resultados da web e IA
    combineResults(webResults, aiAnalysis) {
        const isFakeNews = aiAnalysis.isFakeNews
        let riskLevel = aiAnalysis.riskLevel || 'medio'
        let confidence = aiAnalysis.confidence || 0.5

        // Ajustar confiança baseado no tipo de notícia
        if (isFakeNews) {
            // Fake news = confiança baixa (10-60%)
            // Quanto mais óbvio for fake, menor a confiança
            if (confidence > 0.8) {
                confidence = 0.15 // Muito óbvio fake
            } else if (confidence > 0.6) {
                confidence = 0.25 // Óbvio fake
            } else if (confidence > 0.4) {
                confidence = 0.35 // Moderadamente fake
            } else {
                confidence = Math.max(0.1, confidence) // Manter baixo
            }
            riskLevel = 'alto'
        } else {
            // Notícia confiável = confiança alta (60-95%)
            if (confidence < 0.3) {
                confidence = 0.75 // Muito confiável
            } else if (confidence < 0.5) {
                confidence = 0.85 // Confiável
            } else {
                confidence = Math.min(0.95, confidence + 0.2) // Aumentar confiança
            }
            riskLevel = 'baixo'
        }

        // Ajustar confiança baseado nos resultados da web
        if (webResults.hasResults) {
            if (isFakeNews) {
                // Para fake news, mais informações na web = confiança ainda mais baixa
                confidence = Math.max(0.05, confidence - 0.05)
            } else {
                // Para notícia confiável, mais informações na web = confiança ainda mais alta
                confidence = Math.min(0.95, confidence + 0.05)
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
            detailedAnalysis: `Análise com ${aiAnalysis.source}: Web (${webResults.totalResults} resultados) + IA. ${isFakeNews ? 'FAKE NEWS DETECTADA' : 'NOTÍCIA APARENTA SER REAL'}. Confiança: ${(confidence * 100).toFixed(1)}%`,
            recommendations: aiAnalysis.recommendations,
            score: isFakeNews ? 0.2 : 0.8
        }
    }
}

export default AIFactChecker
