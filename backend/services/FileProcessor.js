import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mammoth from 'mammoth';
import { createWorker } from 'tesseract.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class FileProcessor {
    constructor() {
        console.log('🔧 FileProcessor v4.0 - OCR otimizado para Vercel');
        // No Vercel, não criar pasta de uploads
        if (process.env.NODE_ENV === 'production' && process.env.VERCEL) {
            this.uploadDir = null; // Não usar uploads no Vercel
        } else {
            this.uploadDir = path.join(__dirname, '../uploads');
            this.ensureUploadDir();
        }
        
        // Worker reutilizável para OCR
        this.worker = null;
    }

    ensureUploadDir() {
        if (this.uploadDir && !fs.existsSync(this.uploadDir)) {
            fs.mkdirSync(this.uploadDir, { recursive: true });
        }
    }

    async getWorker() {
        if (!this.worker) {
            try {
                console.log('🔄 Inicializando worker OCR...');
                
                // No Vercel, usar configuração mais simples
                const options = process.env.VERCEL ? {
                    logger: m => {
                        if (m.status === 'loading tesseract core' || m.status === 'initializing tesseract' || m.status === 'loading language traineddata') {
                            console.log(`📦 ${m.status}... ${m.progress ? Math.round(m.progress * 100) + '%' : ''}`);
                        }
                    }
                } : {
                    logger: m => {
                        if (m.status === 'loading tesseract core' || m.status === 'initializing tesseract' || m.status === 'loading language traineddata') {
                            console.log(`📦 ${m.status}... ${m.progress ? Math.round(m.progress * 100) + '%' : ''}`);
                        }
                    }
                };
                
                this.worker = await createWorker('por+eng', 1, options);
                console.log('✅ Worker OCR pronto!');
            } catch (error) {
                console.error('❌ Erro ao inicializar worker OCR:', error);
                throw new Error('Falha ao inicializar OCR. Use TXT ou DOCX para análise completa.');
            }
        }
        return this.worker;
    }

    async processFile(buffer, mimetype, originalName) {
        try {
            let content = '';
            let fileInfo = {
                name: originalName,
                type: mimetype,
                size: buffer.length,
                processedAt: new Date().toISOString()
            };

            if (mimetype === 'text/plain') {
                content = await this.processTextBuffer(buffer);
            } else if (mimetype === 'application/pdf') {
                content = await this.processPdfBuffer(buffer);
            } else if (mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
                content = await this.processDocxBuffer(buffer);
            } else if (this.isImageType(mimetype)) {
                content = await this.processImageBuffer(buffer, mimetype);
            } else {
                throw new Error(`Tipo de arquivo não suportado: ${mimetype}`);
            }

            // Extrair título do nome do arquivo
            const title = this.extractTitleFromFilename(originalName);

            return {
                title,
                content: content.trim(),
                fileInfo
            };
        } catch (error) {
            throw new Error(`Erro ao processar arquivo: ${error.message}`);
        }
    }

    async processTextBuffer(buffer) {
        return buffer.toString('utf-8');
    }

    async processPdfBuffer(buffer) {
        try {
            console.log('📄 Tentando processar PDF com OCR...', {
                bufferSize: buffer.length
            });
            
            // No ambiente Vercel, usar fallback mais simples
            if (process.env.VERCEL) {
                console.log('🌐 Ambiente Vercel detectado - usando fallback para PDF');
                return `[PDF] - Para análise completa, converta o PDF para PNG/JPG ou use DOCX/TXT. Tamanho do arquivo: ${Math.round(buffer.length / 1024)}KB.`;
            }
            
            // Obter worker reutilizável
            const worker = await this.getWorker();
            
            console.log('🖼️ Usando OCR (Tesseract) para extrair texto do PDF...');
            
            const { data: { text } } = await worker.recognize(buffer, {
                rotateAuto: true
            });
            
            const extractedText = text.trim();
            console.log(`✅ Texto extraído: ${extractedText.length} caracteres`);
            
            if (extractedText.length < 10) {
                return `[PDF] - Texto não detectado. Para análise completa, converta o PDF para PNG/JPG ou use DOCX/TXT.`;
            }
            
            return extractedText;
            
        } catch (error) {
            console.error('❌ Erro ao processar PDF:', error.message);
            return `[PDF] - Erro no processamento. Para análise completa, converta o PDF para PNG/JPG ou use DOCX/TXT.`;
        }
    }

    async processDocxBuffer(buffer) {
        try {
            const result = await mammoth.extractRawText({ buffer });
            return result.value;
        } catch (error) {
            throw new Error(`Erro ao processar DOCX: ${error.message}`);
        }
    }

    async processImageBuffer(buffer, mimetype) {
        try {
            console.log('🔍 Iniciando OCR para extrair texto da imagem...', {
                mimetype,
                bufferSize: buffer.length
            });
            
            // No ambiente Vercel, usar fallback mais simples
            if (process.env.VERCEL) {
                console.log('🌐 Ambiente Vercel detectado - usando fallback para imagem');
                return `[IMAGEM ${this.getImageTypeName(mimetype).toUpperCase()}] - Para análise completa, use TXT ou DOCX. Tamanho: ${Math.round(buffer.length / 1024)}KB.`;
            }
            
            // Obter worker reutilizável
            const worker = await this.getWorker();
            
            const { data: { text } } = await worker.recognize(buffer, {
                rotateAuto: true
            });
            
            const extractedText = text.trim();
            console.log(`✅ OCR concluído. Texto extraído: ${extractedText.length} caracteres`);
            
            if (extractedText.length === 0) {
                return `[IMAGEM ${this.getImageTypeName(mimetype).toUpperCase()}] - Nenhum texto detectado na imagem.`;
            }
            
            return extractedText;
            
        } catch (error) {
            console.error('❌ Erro no processamento de imagem:', error);
            return `[IMAGEM ${this.getImageTypeName(mimetype).toUpperCase()}] - Erro no processamento. Para análise completa, use TXT ou DOCX.`;
        }
    }

    isValidFileType(mimetype) {
        const allowedTypes = [
            'text/plain',
            'application/pdf',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            // Tipos de imagem
            'image/jpeg',
            'image/jpg',
            'image/png',
            'image/gif',
            'image/bmp',
            'image/webp',
            'image/tiff'
        ];
        return allowedTypes.includes(mimetype);
    }

    isValidFileSize(size) {
        const maxSize = 5 * 1024 * 1024; // 5MB
        return size <= maxSize;
    }

    extractTitleFromFilename(filename) {
        // Remove extensão e substitui underscores/hífens por espaços
        const nameWithoutExt = path.parse(filename).name;
        return nameWithoutExt
            .replace(/[_-]/g, ' ')
            .replace(/\b\w/g, l => l.toUpperCase());
    }

    isImageType(mimetype) {
        return mimetype.startsWith('image/');
    }

    getImageTypeName(mimetype) {
        const imageTypes = {
            'image/jpeg': 'JPEG',
            'image/jpg': 'JPEG',
            'image/png': 'PNG',
            'image/gif': 'GIF',
            'image/bmp': 'BMP',
            'image/webp': 'WEBP',
            'image/tiff': 'TIFF'
        };
        return imageTypes[mimetype] || 'IMAGEM';
    }
}

export default new FileProcessor();
