import express from 'express'
import Joi from 'joi'
import ExternalSourceAnalyzer from '../services/ExternalSourceAnalyzer.js'
import SupabaseAPI from '../services/SupabaseAPI.js'

const router = express.Router()
const sourceAnalyzer = new ExternalSourceAnalyzer()
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
        console.log('🔍 Recebendo requisição de análise de fonte:', req.body);

        // Validar dados de entrada
        const { error, value } = sourceAnalysisSchema.validate(req.body)
        if (error) {
            return res.status(400).json({
                error: 'Dados inválidos',
                details: error.details[0].message
            })
        }

        const { url } = value

        console.log('🔍 Iniciando análise de fonte com ScamAdviser:', url)

        // Extrair domínio da URL
        const domain = sourceAnalyzer.extractDomain(url)

        // Analisar fonte usando ScamAdviser
        const analysis = await sourceAnalyzer.analyzeExternalSource(url, '', '')

        console.log('📊 Resultado da análise ScamAdviser:', {
            peso: analysis.peso,
            tipo: analysis.tipo,
            descricao: analysis.descricao
        });

        // Determinar nível de risco baseado na credibilidade
        let riskLevel = 'baixo'
        if (analysis.peso >= 0.7) {
            riskLevel = 'baixo'
        } else if (analysis.peso >= 0.4) {
            riskLevel = 'medio'
        } else {
            riskLevel = 'alto'
        }

        // 💾 Salvar fonte via Supabase API
        console.log('💾 Salvando fonte via Supabase API...');
        
        try {
            await supabaseAPI.saveSourceAnalysis({
                nome: domain,
                site: url,
                peso: analysis.peso,
                tipo: analysis.tipo || 'Site',
                descricao: analysis.descricao || 'Fonte analisada automaticamente',
                externalData: analysis.externalData || {}
            });

            console.log('✅ Fonte salva com sucesso via Supabase API');
        } catch (apiError) {
            console.error('⚠️ Erro ao salvar fonte via Supabase API:', apiError.message);
            // Continuar mesmo se não conseguir salvar
        }

        // Retornar resultado no formato esperado pelo frontend
        const response = {
            domain: domain,
            credibility: analysis.peso,
            riskLevel: riskLevel,
            sourceType: analysis.tipo || 'Site',
            description: analysis.descricao || 'Fonte analisada automaticamente',
            scamAdviserData: analysis.externalData?.scamAdviserData || {},
            timestamp: new Date().toISOString()
        }

        console.log('✅ Resposta da análise de fonte:', response);

        res.json(response)

    } catch (error) {
        console.error('❌ Erro na análise de fonte:', error)
        res.status(500).json({
            error: 'Erro na análise de fonte',
            details: error.message
        })
    }
})

export default router
