import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mammoth from 'mammoth';
import Tesseract from 'tesseract.js';
// pdf-parse removido - causa problemas no Vercel serverless

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class FileProcessor {
    constructor() {
        // No Vercel, não criar pasta de uploads
        if (process.env.NODE_ENV === 'production' && process.env.VERCEL) {
            this.uploadDir = null; // Não usar uploads no Vercel
        } else {
            this.uploadDir = path.join(__dirname, '../uploads');
            this.ensureUploadDir();
        }
    }

    ensureUploadDir() {
        if (this.uploadDir && !fs.existsSync(this.uploadDir)) {
            fs.mkdirSync(this.uploadDir, { recursive: true });
        }
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
            console.log('📄 Iniciando processamento de PDF com OCR (Tesseract)...', {
                bufferSize: buffer.length,
                bufferType: Buffer.isBuffer(buffer) ? 'Buffer válido' : 'Não é Buffer'
            });
            
            // Usar Tesseract OCR diretamente para processar o PDF
            // Tesseract pode processar PDFs como imagens
            console.log('🔍 Extraindo texto do PDF enviado pelo usuário...');
            
            const { data: { text } } = await Tesseract.recognize(
                buffer,
                'por+eng', // Português + Inglês
                {
                    logger: m => {
                        if (m.status === 'recognizing text') {
                            console.log(`📖 OCR Progress: ${Math.round(m.progress * 100)}%`);
                        }
                    }
                }
            );
            
            const extractedText = text.trim();
            console.log(`✅ Texto extraído do PDF do usuário: ${extractedText.length} caracteres`);
            
            if (extractedText.length === 0) {
                throw new Error('PDF não contém texto extraível. O arquivo pode estar vazio, corrompido ou com texto muito pequeno.');
            }
            
            return extractedText;
            
        } catch (error) {
            console.error('❌ Erro ao processar PDF:', {
                message: error.message,
                stack: error.stack,
                code: error.code
            });
            throw new Error(`Erro ao processar PDF: ${error.message}`);
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
            console.log('🔍 Iniciando OCR para extrair texto da imagem...');
            
            const { data: { text } } = await Tesseract.recognize(
                buffer,
                'por+eng', // Português + Inglês
                {
                    logger: m => {
                        if (m.status === 'recognizing text') {
                            console.log(`📖 OCR Progress: ${Math.round(m.progress * 100)}%`);
                        }
                    }
                }
            );
            
            const extractedText = text.trim();
            console.log(`✅ OCR concluído. Texto extraído: ${extractedText.length} caracteres`);
            
            if (extractedText.length === 0) {
                return `[IMAGEM ${this.getImageTypeName(mimetype).toUpperCase()}] - Nenhum texto detectado na imagem.`;
            }
            
            return extractedText;
            
        } catch (error) {
            console.error('❌ Erro no processamento de imagem:', error);
            throw new Error(`Erro ao processar imagem: ${error.message}`);
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
