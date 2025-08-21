import express from 'express'
import Joi from 'joi'
import { query } from '../config/database.js'
import { newsAnalyzer } from '../services/instances.js'
import RealTimeUpdateService from '../services/RealTimeUpdateService.js'

const router = express.Router()

// Schema de validação para análise
const analysisSchema = Joi.object({
  title: Joi.string().min(5).max(500).required(),
  content: Joi.string().min(10).max(10000).required(),
  url: Joi.string().uri().optional(),
  author: Joi.string().max(200).allow('').optional()
})

/**
 * @swagger
 * /api/analysis:
 *   post:
 *     summary: Analisa uma notícia
 *     description: Analisa o conteúdo de uma notícia e retorna sua confiabilidade
 *     tags: [Análise]
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
 *                 minLength: 10
 *                 maxLength: 10000
 *                 example: "Texto completo da notícia..."
 *               url:
 *                 type: string
 *                 format: uri
 *                 example: "https://exemplo.com/noticia"
 *               author:
 *                 type: string
 *                 maxLength: 200
 *                 example: "João Silva"
 *           example:
 *             title: "Pesquisadores descobrem novo tratamento para diabetes"
 *             content: "Texto completo da notícia..."
 *             url: "https://exemplo.com/noticia"
 *             author: "João Silva"
 *     responses:
 *       200:
 *         description: Análise concluída com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 score:
 *                   type: number
 *                   minimum: 0
 *                   maximum: 1
 *                 riskLevel:
 *                   type: string
 *                   enum: [LOW, MEDIUM, HIGH]
 *                 source:
 *                   $ref: '#/components/schemas/Fonte'
 *                 analysis:
 *                   type: object
 *                   properties:
 *                     factors:
 *                       type: array
 *                       items:
 *                         type: object
 *                     recommendations:
 *                       type: array
 *                       items:
 *                         type: string
 *             example:
 *               score: 0.85
 *               riskLevel: "LOW"
 *               source:
 *                 id: 1
 *                 nome: "Folha de S.Paulo"
 *                 site: "folha.uol.com.br"
 *                 peso: 0.85
 *               analysis:
 *                 factors:
 *                   - factor: "Fonte confiável"
 *                     weight: 0.85
 *                   - factor: "Linguagem neutra"
 *                     weight: 0.90
 *                 recommendations:
 *                   - "Notícia parece confiável"
 *                   - "Verificar outras fontes para confirmação"
 *       400:
 *         description: Dados inválidos
 *       500:
 *         description: Erro interno do servidor
 */
router.post('/', async (req, res) => {
  try {
    const { error, value } = analysisSchema.validate(req.body)

    if (error) {
      return res.status(400).json({
        error: 'Dados inválidos',
        details: error.details[0].message
      })
    }

    const { title, content, url, author } = value

    // Analisar a notícia
    const analysisResult = await newsAnalyzer.analyzeNews({
      texto: content,
      link: url || '',
      titulo: title,
      autor: author || 'Anônimo'
    })



    // Determinar nível de risco baseado na credibilidade
    let riskLevel = 'BAIXO'
    if (analysisResult.confiabilidade >= 0.7) {
      riskLevel = 'BAIXO'
    } else if (analysisResult.confiabilidade >= 0.4) {
      riskLevel = 'MÉDIO'
    } else {
      riskLevel = 'ALTO'
    }

    // Preparar resposta usando APENAS dados externos
    const response = {
      score: analysisResult.confiabilidade,
      riskLevel,
      sourceName: analysisResult.fonte?.nome || 'Fonte não identificada',
      sourceCredibility: analysisResult.confiabilidade, // Usar o mesmo score calculado com dados externos
      timestamp: new Date().toISOString()
    }

    // Se uma nova fonte foi descoberta, atualizar o sistema em tempo real
    if (analysisResult.fonte && analysisResult.fonte.id) {
      try {
        // Atualizar conexões automaticamente
        await RealTimeUpdateService.addNewsAndUpdate({
          texto: content,
          link: url || '',
          id_fonte: analysisResult.fonte.id,
          confiabilidade: analysisResult.confiabilidade
        });

        console.log('🔄 Sistema atualizado em tempo real após análise');
      } catch (updateError) {
        console.error('⚠️ Erro ao atualizar sistema em tempo real:', updateError);
        // Não falhar a análise por causa do erro de atualização
      }
    }

    res.json(response)

  } catch (error) {
    console.error('Erro ao analisar notícia:', error)
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
})

export default router
