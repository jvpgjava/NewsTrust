import express from 'express';
import multer from 'multer';
import fileProcessor from '../services/FileProcessor.js';
import AIFactChecker from '../services/AIFactChecker.js';

const aiFactChecker = new AIFactChecker();

const router = express.Router();

// Configurar multer para upload em memória
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB
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
                error: 'Arquivo muito grande. Tamanho máximo: 5MB'
            });
        }

        // Processar arquivo
        const { title, content, fileInfo } = await fileProcessor.processFile(
            req.file.buffer,
            req.file.mimetype,
            req.file.originalname
        );

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

export default router;
