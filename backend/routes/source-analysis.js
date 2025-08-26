import express from 'express'
import Joi from 'joi'
import ExternalSourceAnalyzer from '../services/ExternalSourceAnalyzer.js'
import realTimeService from '../services/RealTimeService.js'
import { query } from '../config/database.js'

const router = express.Router()
const sourceAnalyzer = new ExternalSourceAnalyzer()

// Schema de validação para análise de fonte
const sourceAnalysisSchema = Joi.object({
  url: Joi.string().uri().required()
})

/**
 * @swagger
 * /api/source-analysis:
 *   post:
 *     summary: Analisa a credibilidade de uma fonte
 *     description: Utiliza a API ScamAdviser para analisar a credibilidade de um domínio
 *     tags: [Análise de Fonte]
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
 *                 example: "https://exemplo.com"
 *           example:
 *             url: "https://exemplo.com"
 *     responses:
 *       200:
 *         description: Análise de fonte concluída com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 domain:
 *                   type: string
 *                 credibility:
 *                   type: number
 *                   minimum: 0
 *                   maximum: 1
 *                 riskLevel:
 *                   type: string
 *                   enum: [BAIXO, MÉDIO, ALTO]
 *                 sourceType:
 *                   type: string
 *                 description:
 *                   type: string
 *                 scamAdviserData:
 *                   type: object
 *                   properties:
 *                     trustScore:
 *                       type: number
 *                     riskScore:
 *                       type: number
 *                     country:
 *                       type: string
 *                     domainAge:
 *                       type: string
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *             example:
 *               domain: "exemplo.com"
 *               credibility: 0.85
 *               riskLevel: "BAIXO"
 *               sourceType: "Site de Notícias"
 *               description: "Site confiável com boa reputação"
 *               scamAdviserData:
 *                 trustScore: 85
 *                 riskScore: 15
 *                 country: "Brasil"
 *                 domainAge: "5 anos"
 *               timestamp: "2024-01-15T10:30:00.000Z"
 *       400:
 *         description: Dados inválidos
 *       500:
 *         description: Erro interno do servidor
 */
router.post('/', async (req, res) => {
  try {
    console.log('🔍 Recebendo requisição de análise de fonte:', req.body);
    
    const { error, value } = sourceAnalysisSchema.validate(req.body)

    if (error) {
      return res.status(400).json({
        error: 'Dados inválidos',
        details: error.details[0].message
      })
    }

    const { url } = value

    console.log('🔍 Iniciando análise de fonte:', url)

    // Extrair domínio da URL
    const domain = sourceAnalyzer.extractDomain(url)

    // Analisar fonte usando ScamAdviser (método existente)
    const analysis = await sourceAnalyzer.analyzeExternalSource(url, '', '')

    // Determinar nível de risco baseado na credibilidade
    let riskLevel = 'BAIXO'
    if (analysis.peso >= 0.7) {
      riskLevel = 'BAIXO'
    } else if (analysis.peso >= 0.4) {
      riskLevel = 'MÉDIO'
    } else {
      riskLevel = 'ALTO'
    }

    // Verificar se a fonte já existe
    const existingSource = await query(`
      SELECT id, peso, tipo, descricao FROM fontes WHERE site = $1
      ORDER BY created_at DESC LIMIT 1
    `, [url]);

    let sourceId, finalPeso, finalTipo, finalDescricao;

    if (existingSource.rows.length > 0) {
      // Fonte já existe - atualizar dados
      const existing = existingSource.rows[0];
      sourceId = existing.id;
      finalPeso = analysis.peso;
      finalTipo = analysis.tipo || existing.tipo || 'Site';
      finalDescricao = analysis.descricao || existing.descricao || 'Fonte analisada automaticamente';

      await query(`
        UPDATE fontes 
        SET peso = $1, tipo = $2, descricao = $3, updated_at = NOW()
        WHERE id = $4
      `, [finalPeso, finalTipo, finalDescricao, sourceId]);

      console.log('🔄 Fonte existente atualizada:', sourceId);
    } else {
      // Nova fonte - inserir
      const insertResult = await query(`
        INSERT INTO fontes (nome, site, peso, tipo, descricao, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
        RETURNING id
      `, [
        domain,
        url,
        analysis.peso,
        analysis.tipo || 'Site',
        analysis.descricao || 'Fonte analisada automaticamente'
      ]);

      sourceId = insertResult.rows[0].id;
      finalPeso = analysis.peso;
      finalTipo = analysis.tipo || 'Site';
      finalDescricao = analysis.descricao || 'Fonte analisada automaticamente';

      console.log('✅ Nova fonte inserida:', sourceId);
    }

    const response = {
      id: sourceId,
      domain: domain,
      credibility: finalPeso,
      riskLevel: riskLevel,
      sourceType: finalTipo,
      description: finalDescricao,
      scamAdviserData: analysis.externalData?.scamAdviserData || {},
      timestamp: new Date().toISOString()
    }

    console.log('✅ Análise de fonte concluída e salva no banco:', {
      id: response.id,
      domain: domain,
      credibility: analysis.peso,
      riskLevel: riskLevel
    })

    // Notificar via WebSocket
    await realTimeService.notifyNewSource(response)

    res.json(response)

  } catch (error) {
    console.error('❌ Erro na análise de fonte:', error)
    console.error('❌ Stack trace:', error.stack)

    res.status(500).json({
      error: 'Erro na análise de fonte',
      details: error.message
    })
  }
})

export default router
