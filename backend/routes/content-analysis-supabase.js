import express from 'express'
import Joi from 'joi'
import AIFactChecker from '../services/AIFactChecker.js'
import SupabaseAPI from '../services/SupabaseAPI.js'

const router = express.Router()
const factChecker = new AIFactChecker()
const supabaseAPI = new SupabaseAPI()

// Schema de validação para análise de conteúdo
const contentAnalysisSchema = Joi.object({
    title: Joi.string().min(3).max(500).required(),
    content: Joi.string().min(10).max(15000).required()
})

/**
 * @swagger
 * /api/content-analysis:
 *   post:
 *     summary: Analisa o conteúdo de uma notícia usando IA gratuita + busca na web
 *     tags: [Content Analysis]
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
 *                 minLength: 3
 *                 maxLength: 500
 *                 description: Título da notícia
 *               content:
 *                 type: string
 *                 minLength: 10
 *                 maxLength: 15000
 *                 description: Conteúdo da notícia
 *     responses:
 *       200:
 *         description: Análise realizada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 analysis:
 *                   type: object
 *                   properties:
 *                     isFakeNews:
 *                       type: boolean
 *                     confidence:
 *                       type: number
 *                     riskLevel:
 *                       type: string
 *                     reasons:
 *                       type: array
 *                     recommendations:
 *                       type: array
 *                     detailedAnalysis:
 *                       type: string
 *       400:
 *         description: Dados inválidos
 *       500:
 *         description: Erro interno do servidor
 */
router.post('/', async (req, res) => {
    try {
        console.log('📝 Recebendo dados para análise:', {
            title: req.body.title,
            content: req.body.content?.substring(0, 100) + '...'
        });

        // Validar dados de entrada
        const { error, value } = contentAnalysisSchema.validate(req.body)
        if (error) {
            return res.status(400).json({
                error: 'Dados inválidos',
                details: error.details[0].message
            })
        }

        const { title, content } = value

        console.log('🤖 Iniciando análise com IA gratuita + busca na web...')

        // Realizar análise com IA
        const analysis = await factChecker.analyzeContent(title, content)

        // 💾 Salvar via Supabase API
        console.log('💾 Salvando análise via Supabase API...');
        
        try {
            await supabaseAPI.saveContentAnalysis({
                title,
                content,
                confidence: analysis.confidence,
                riskLevel: analysis.riskLevel,
                isFakeNews: analysis.isFakeNews,
                reasons: analysis.reasons,
                recommendations: analysis.recommendations,
                detailedAnalysis: analysis.detailedAnalysis,
                source: analysis.aiAnalysis?.source || 'Groq'
            });

            console.log('✅ Análise salva com sucesso via Supabase API');
        } catch (apiError) {
            console.error('⚠️ Erro ao salvar via Supabase API, continuando sem salvar:', apiError.message);
            // Continuar mesmo se não conseguir salvar
        }

        // Retornar resultado
        res.json({
            success: true,
            analysis: {
                isFakeNews: analysis.isFakeNews,
                confidence: analysis.confidence,
                riskLevel: analysis.riskLevel,
                reasons: analysis.reasons,
                recommendations: analysis.recommendations,
                detailedAnalysis: analysis.detailedAnalysis,
                score: analysis.score,
                webResults: analysis.webResults,
                aiAnalysis: analysis.aiAnalysis,
                searchCoverage: analysis.searchCoverage
            }
        })

    } catch (error) {
        console.error('❌ Erro na análise de conteúdo:', error)
        res.status(500).json({
            error: 'Erro na análise de conteúdo',
            details: error.message
        })
    }
})

export default router
