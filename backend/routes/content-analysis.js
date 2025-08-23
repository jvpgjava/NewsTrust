import express from 'express'
import Joi from 'joi'
import AIFactChecker from '../services/AIFactChecker.js'
import { query } from '../config/database.js'
import realTimeService from '../services/RealTimeService.js'

const router = express.Router()
const factChecker = new AIFactChecker()

// Schema de validação para análise de conteúdo
const contentAnalysisSchema = Joi.object({
    title: Joi.string().min(5).max(500).required(),
    content: Joi.string().min(20).max(15000).required()
})

/**
 * @swagger
 * /api/content-analysis:
 *   post:
 *     summary: Analisa o conteúdo de uma notícia usando IA gratuita + busca na web
 *     description: Combina análise de IA gratuita (Ollama + APIs gratuitas) com busca real na internet
 *     tags: [Análise de Conteúdo]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - content
 *             properties:
 *               title:
 *                 type: string
 *                 minLength: 5
 *                 maxLength: 500
 *                 example: "Pesquisadores descobrem novo tratamento para diabetes"
 *               content:
 *                 type: string
 *                 minLength: 20
 *                 maxLength: 15000
 *                 example: "Texto completo da notícia para análise..."
 *           example:
 *             title: "Pesquisadores descobrem novo tratamento para diabetes"
 *             content: "Texto completo da notícia para análise..."
 *     responses:
 *       200:
 *         description: Análise de conteúdo concluída com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 isFakeNews:
 *                   type: boolean
 *                 confidence:
 *                   type: number
 *                   minimum: 0
 *                   maximum: 1
 *                 riskLevel:
 *                   type: string
 *                   enum: [BAIXO, MÉDIO, ALTO]
 *                 score:
 *                   type: number
 *                   minimum: 0
 *                   maximum: 1
 *                 reasons:
 *                   type: array
 *                   items:
 *                     type: string
 *                 detailedAnalysis:
 *                   type: string
 *                 recommendations:
 *                   type: array
 *                   items:
 *                     type: string
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *             example:
 *               isFakeNews: false
 *               confidence: 0.85
 *               riskLevel: "BAIXO"
 *               score: 0.85
 *               reasons:
 *                 - "Linguagem neutra e objetiva"
 *                 - "Presença de fontes citadas"
 *                 - "Tom jornalístico profissional"
 *               detailedAnalysis: "A notícia apresenta características de conteúdo confiável..."
 *               recommendations:
 *                 - "Verificar outras fontes para confirmação"
 *                 - "Consultar especialistas na área"
 *               timestamp: "2024-01-15T10:30:00.000Z"
 *       400:
 *         description: Dados inválidos
 *       500:
 *         description: Erro interno do servidor
 */
router.post('/', async (req, res) => {
    try {
        const { error, value } = contentAnalysisSchema.validate(req.body)

        if (error) {
            return res.status(400).json({
                error: 'Dados inválidos',
                details: error.details[0].message
            })
        }

        const { title, content } = value

        console.log('🤖 Iniciando análise com IA gratuita + busca na web...')

        // Analisar conteúdo usando IA gratuita + busca na web
        const analysis = await factChecker.analyzeContent(title, content)

        console.log('💾 Salvando análise no banco de dados...');

        // Salvar análise no banco de dados
        const savedAnalysis = await query(`
            INSERT INTO analises_conteudo (
                title, content, is_fake_news, confidence, risk_level, 
                reasons, recommendations, detailed_analysis, score, 
                web_results, ai_analysis, search_coverage
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            RETURNING id, created_at
        `, [
            title,
            content,
            analysis.isFakeNews,
            analysis.confidence,
            analysis.riskLevel,
            analysis.reasons,
            analysis.recommendations,
            analysis.detailedAnalysis,
            analysis.score,
            JSON.stringify(analysis.webResults),
            JSON.stringify(analysis.aiAnalysis),
            analysis.searchCoverage
        ]);

        console.log('✅ Análise salva no banco:', savedAnalysis.rows[0]);

        const response = {
            id: savedAnalysis.rows[0].id,
            ...analysis,
            timestamp: savedAnalysis.rows[0].created_at.toISOString()
        }

        console.log('✅ Análise de conteúdo concluída:', {
            isFakeNews: analysis.isFakeNews,
            riskLevel: analysis.riskLevel,
            confidence: analysis.confidence
        })

        // Notificar via WebSocket
        await realTimeService.notifyNewContentAnalysis(response)

        res.json(response)

    } catch (error) {
        console.error('❌ Erro na análise de conteúdo:', error)

        // Verificar se é erro de configuração
        if (error.message.includes('API_KEY')) {
            return res.status(500).json({
                error: 'API não configurada',
                details: 'Verifique as configurações das APIs'
            })
        }

        res.status(500).json({
            error: 'Erro na análise de conteúdo',
            details: error.message
        })
    }
})

export default router
