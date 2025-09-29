import express from 'express'
import Joi from 'joi'
import AIFactChecker from '../services/AIFactChecker.js'
import SupabaseAPI from '../services/SupabaseAPI.js'

const router = express.Router()
const factChecker = new AIFactChecker()
const supabaseAPI = new SupabaseAPI()

// Schema de validação para análise de fonte
const sourceAnalysisSchema = Joi.object({
    url: Joi.string().uri().required()
})

/**
 * @swagger
 * /api/source-analysis:
 *   post:
 *     summary: Analisa uma fonte de notícias usando IA gratuita + busca na web
 *     tags: [Source Analysis]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - url
 *             properties:
 *               url:
 *                 type: string
 *                 format: uri
 *                 description: URL da fonte de notícias
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
        console.log('📝 Recebendo dados para análise de fonte:', {
            url: req.body.url
        });

        // Validar dados de entrada
        const { error, value } = sourceAnalysisSchema.validate(req.body)
        if (error) {
            return res.status(400).json({
                error: 'Dados inválidos',
                details: error.details[0].message
            })
        }

        const { url } = value

        console.log('🤖 Iniciando análise de fonte com IA gratuita + busca na web...')

        // Realizar análise com IA (usando URL como título e conteúdo)
        const analysis = await factChecker.analyzeContent(url, `Análise da fonte: ${url}`)

        // 💾 Salvar via Supabase API
        console.log('💾 Salvando análise de fonte via Supabase API...');
        
        try {
            await supabaseAPI.saveContentAnalysis({
                title: `Análise de Fonte: ${url}`,
                content: `URL analisada: ${url}`,
                confidence: analysis.confidence,
                riskLevel: analysis.riskLevel,
                isFakeNews: analysis.isFakeNews,
                reasons: analysis.reasons,
                recommendations: analysis.recommendations,
                detailedAnalysis: analysis.detailedAnalysis,
                source: analysis.aiAnalysis?.source || 'Groq'
            });

            console.log('✅ Análise de fonte salva com sucesso via Supabase API');
        } catch (apiError) {
            console.error('⚠️ Erro ao salvar análise de fonte via Supabase API, continuando sem salvar:', apiError.message);
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
        console.error('❌ Erro na análise de fonte:', error)
        res.status(500).json({
            error: 'Erro na análise de fonte',
            details: error.message
        })
    }
})

export default router
