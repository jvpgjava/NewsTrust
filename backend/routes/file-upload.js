import express from 'express';
import multer from 'multer';
import fileProcessor from '../services/FileProcessor.js';
import fileProcessingService from '../services/FileProcessingService.js';
import AIFactChecker from '../services/AIFactChecker.js';

const aiFactChecker = new AIFactChecker();

const router = express.Router();

// Configurar multer para upload em memória
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 25 * 1024 * 1024 // 25MB (aumentado)
    },
    fileFilter: (req, file, cb) => {
        if (fileProcessor.isValidFileType(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Tipo de arquivo não suportado. Use PDF, TXT ou DOCX.'), false);
        }
    }
});

// Endpoint para upload e análise de arquivo
router.post('/analyze-file', upload.single('file'), async (req, res) => {
    try {
        console.log('📁 Recebendo arquivo para análise...', {
            hasFile: !!req.file,
            mimetype: req.file?.mimetype,
            size: req.file?.size,
            originalName: req.file?.originalname
        });

        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: 'Nenhum arquivo foi enviado'
            });
        }

        // Validar tamanho do arquivo
        if (!fileProcessor.isValidFileSize(req.file.size)) {
            return res.status(400).json({
                success: false,
                error: 'Arquivo muito grande. Tamanho máximo: 25MB'
            });
        }

        console.log('🔄 Iniciando processamento do arquivo...', {
            mimetype: req.file.mimetype,
            size: req.file.size,
            name: req.file.originalname
        });

        // Processar arquivo
        const { title, content, fileInfo } = await fileProcessor.processFile(
            req.file.buffer,
            req.file.mimetype,
            req.file.originalname
        );

        console.log('📄 Conteúdo extraído:', {
            title,
            contentLength: content?.length || 0,
            contentPreview: content?.substring(0, 100) + '...'
        });

        if (!content || content.trim().length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Não foi possível extrair conteúdo do arquivo'
            });
        }

        // Analisar conteúdo com IA
        console.log('🔍 Analisando conteúdo:', { title, contentLength: content.length });
        const analysisResult = await aiFactChecker.analyzeContent(title, content);
        console.log('✅ Resultado da análise:', analysisResult);

        res.json({
            success: true,
            ...analysisResult,
            fileInfo: {
                ...fileInfo,
                extractedContent: content.substring(0, 200) + (content.length > 200 ? '...' : '')
            }
        });

    } catch (error) {
        console.error('❌ Erro no upload e análise:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Erro interno do servidor'
        });
    }
});

// Endpoint para validar arquivo (opcional)
router.post('/validate-file', upload.single('file'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: 'Nenhum arquivo foi enviado'
            });
        }

        const isValid = fileProcessor.isValidFileType(req.file.mimetype) && 
                       fileProcessor.isValidFileSize(req.file.size);

        res.json({
            success: true,
            valid: isValid,
            fileInfo: {
                name: req.file.originalname,
                type: req.file.mimetype,
                size: req.file.size
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Nova rota usando microserviço de processamento
router.post('/analyze-file-microservice', upload.single('file'), async (req, res) => {
    try {
        console.log('📁 Recebendo arquivo para análise via microserviço...', {
            hasFile: !!req.file,
            mimetype: req.file?.mimetype,
            size: req.file?.size,
            originalName: req.file?.originalname
        });

        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: 'Nenhum arquivo foi enviado'
            });
        }

        // Validar tamanho do arquivo
        if (!fileProcessor.isValidFileSize(req.file.size)) {
            return res.status(400).json({
                success: false,
                error: 'Arquivo muito grande. Tamanho máximo: 25MB'
            });
        }

        console.log('🔄 Enviando arquivo para microserviço de processamento...');

        // Usar microserviço Go para processar arquivo (OBRIGATÓRIO - não usar fallback Node.js!)
        let processingResult = await fileProcessingService.extractTextForAnalysis(req.file);

        // Se o Go falhar, retornar erro - NÃO usar fallback Node.js
        if (!processingResult.success) {
            console.error('❌ Erro ao processar arquivo no Go:', {
                error: processingResult.error,
                details: processingResult.details,
                status: processingResult.status
            });
            
            return res.status(processingResult.status || 500).json({
                success: false,
                error: 'Erro ao processar arquivo',
                details: processingResult.error || processingResult.details,
                suggestion: 'Verifique se o serviço Go está rodando na porta 9091 e se GEMINI_API_KEY está configurada'
            });
        }

        // Processamento continua apenas se Go processou com sucesso

        const { data } = processingResult;
        console.log('✅ Arquivo processado com sucesso:', {
            fileName: data.fileName,
            fileType: data.fileType,
            textLength: data.content.length,
            processingTime: data.processingTime
        });

        // Analisar conteúdo extraído com IA
        let analysisResult;
        
        // Se o Gemini já analisou o PDF diretamente, usar essa análise
        if (processingResult.directAnalysis) {
            console.log('🤖 Usando análise direta do Gemini (PDF analisado diretamente)...');
            analysisResult = processingResult.directAnalysis;
        } else {
            console.log('🤖 Iniciando análise de conteúdo com IA...');
            analysisResult = await aiFactChecker.analyzeContent(data.title, data.content);
        }

        // Normalizar confidence (garantir que seja 0-1 e arredondar)
        const normalizedConfidence = analysisResult.confidence != null 
            ? Math.max(0, Math.min(1, parseFloat(analysisResult.confidence))) 
            : 0;
        
        console.log('✅ Análise concluída:', {
            isFakeNews: analysisResult.isFakeNews,
            confidence: normalizedConfidence,
            confidenceOriginal: analysisResult.confidence,
            riskLevel: analysisResult.riskLevel,
            source: analysisResult.source || 'Groq'
        });

        // Criar objeto de análise normalizado
        const normalizedAnalysis = {
            ...analysisResult,
            confidence: normalizedConfidence
        };

        // Resposta completa
        const processedAtIso = data.metadata?.processedAt || new Date().toISOString();
        const extractedPreview = data.content
            ? `${data.content.substring(0, 200)}${data.content.length > 200 ? '...' : ''}`
            : '';

        const responseData = {
            success: true,
            data: {
                // Dados do arquivo
                file: {
                    name: data.fileName,
                    type: data.fileType,
                    size: data.fileSize,
                    processedAt: processedAtIso,
                    processingTime: data.processingTime,
                    confidence: data.confidence,
                    extractedContent: extractedPreview
                },
                // Texto extraído
                extractedText: data.content,
                title: data.title,
                // Análise de conteúdo (com confidence normalizado)
                analysis: normalizedAnalysis,
                // Metadados
                metadata: {
                    ...data.metadata,
                    processedAt: processedAtIso
                }
            }
        };
        
        console.log('📤 Enviando resposta ao frontend:', {
            hasAnalysis: !!responseData.data.analysis,
            confidence: responseData.data.analysis?.confidence,
            riskLevel: responseData.data.analysis?.riskLevel
        });

        res.json(responseData);

    } catch (error) {
        console.error('❌ Erro na análise de arquivo:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor',
            details: error.message
        });
    }
});

// Rota para verificar status do microserviço
router.get('/file-processing-status', async (req, res) => {
    try {
        const healthCheck = await fileProcessingService.checkHealth();
        
        res.json({
            success: true,
            data: {
                microservice: healthCheck,
                timestamp: new Date().toISOString()
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Erro ao verificar status do microserviço',
            details: error.message
        });
    }
});

export default router;
