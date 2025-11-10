import axios from 'axios';
import FormData from 'form-data';

class FileProcessingService {
  constructor() {
    // URL do microserviço de processamento de arquivos
    const externalURL = 'https://backend-fileprocessing.vercel.app';
    this.baseURL =
      process.env.FILE_PROCESSING_URL ||
      (process.env.FILE_PROCESSING_ENV === 'local'
        ? 'http://localhost:9091'
        : externalURL);
    console.log('🔧 FileProcessingService configurado com URL:', this.baseURL);
    this.api = axios.create({
      baseURL: this.baseURL,
      timeout: 5 * 60 * 1000, // 5 minutos para processamento (mesmo timeout do Go)
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  /**
   * Processa um arquivo enviado
   * @param {File} file - Arquivo para processar
   * @returns {Promise<Object>} Resultado do processamento
   */
  async processFile(file) {
    try {
      const originalName = file?.originalname || file?.name || 'upload.bin';
      const mimeType = file?.mimetype || 'application/octet-stream';
      const size = file?.size || 0;

      console.log('📁 Enviando arquivo para processamento:', {
        originalName,
        mimeType,
        size,
        hasBuffer: !!file?.buffer,
      });

      // Montar form-data compatível com Node (buffer do Multer)
      const formData = new FormData();
      if (file?.buffer) {
        formData.append('file', file.buffer, {
          filename: originalName,
          contentType: mimeType,
          knownLength: size,
        });
      } else {
        // Fallback: caso receba um objeto File/Blob (ambiente browser)
        formData.append('file', file, originalName);
      }

      const response = await this.api.post('/api/v1/files/process', formData, {
        headers: {
          ...formData.getHeaders?.(), // form-data (Node)
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
      });

      console.log('✅ Arquivo processado com sucesso');
      return {
        success: true,
        data: response.data
      };

    } catch (error) {
      console.error('❌ Erro ao processar arquivo:', error);
      console.error('❌ Erro completo:', {
        message: error.message,
        code: error.code,
        response: error.response?.data,
        status: error.response?.status
      });
      
      if (error.response) {
        // Erro da API (400, 500, etc)
        const responseData = error.response.data;
        return {
          success: false,
          error: responseData?.error?.message || responseData?.message || 'Erro no processamento',
          details: responseData?.error?.details || responseData?.details || error.message,
          status: error.response.status
        };
      } else if (error.request) {
        // Erro de rede (serviço não disponível)
        return {
          success: false,
          error: 'Serviço de processamento indisponível',
          details: `Não foi possível conectar ao serviço em ${this.baseURL}. Verifique se o serviço Go está rodando na porta 9091.`
        };
      } else {
        // Outro erro
        return {
          success: false,
          error: 'Erro interno',
          details: error.message
        };
      }
    }
  }

  /**
   * Verifica se o serviço está funcionando
   * @returns {Promise<Object>} Status do serviço
   */
  async checkHealth() {
    try {
      const response = await this.api.get('/api/v1/health');
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: 'Serviço indisponível',
        details: error.message
      };
    }
  }

  /**
   * Obtém tipos de arquivo suportados
   * @returns {Promise<Object>} Tipos suportados
   */
  async getSupportedTypes() {
    try {
      const response = await this.api.get('/api/v1/files/supported-types');
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: 'Erro ao obter tipos suportados',
        details: error.message
      };
    }
  }

  /**
   * Processa arquivo e extrai texto para análise
   * @param {File} file - Arquivo para processar
   * @returns {Promise<Object>} Texto extraído e metadados
   */
  async extractTextForAnalysis(file) {
    try {
      const result = await this.processFile(file);
      
      if (!result.success) {
        return result;
      }

      const { data } = result.data;
      
      // O Go retorna: { success: true, data: { text: "...", info: {...} } }
      const extractedText = data.text || '';
      const fileInfo = data.info || {};
      const processedAt = fileInfo.processedAt
        ? new Date(fileInfo.processedAt)
        : new Date();
      const formattedProcessedAt = !isNaN(processedAt)
        ? processedAt.toISOString()
        : new Date().toISOString();
      
      console.log('✅ Resposta do Go recebida:', {
        textLength: extractedText.length,
        fileName: fileInfo.fileName,
        fileType: fileInfo.fileType,
        fileSize: fileInfo.fileSize,
        processingTime: fileInfo.processingTime
      });
      
      // Estruturar dados para análise
      return {
        success: true,
        data: {
          extractedText: extractedText,
          fileName: fileInfo.fileName || 'arquivo',
          fileType: fileInfo.fileType || '',
          fileSize: fileInfo.fileSize || 0,
          processingTime: fileInfo.processingTime || '',
          confidence: 1.0, // O Go não retorna confidence, usar 1.0 como padrão
          // Dados para análise de conteúdo
          title: this.extractTitle(extractedText),
          content: extractedText,
          metadata: {
            originalFileName: fileInfo.fileName || 'arquivo',
            processedAt: formattedProcessedAt,
            processingService: 'file-processing-microservice'
          }
        }
      };

    } catch (error) {
      console.error('❌ Erro ao extrair texto:', error);
      return {
        success: false,
        error: 'Erro ao extrair texto do arquivo',
        details: error.message
      };
    }
  }

  /**
   * Extrai título do texto (primeira linha ou até 100 caracteres)
   * @param {string} text - Texto extraído
   * @returns {string} Título extraído
   */
  extractTitle(text) {
    if (!text || typeof text !== 'string') {
      return 'Documento sem título';
    }

    // Pegar primeira linha ou primeiros 100 caracteres
    const firstLine = text.split('\n')[0].trim();
    if (firstLine.length > 0 && firstLine.length <= 100) {
      return firstLine;
    }

    // Se primeira linha for muito longa, pegar primeiros 100 caracteres
    return text.substring(0, 100).trim() + (text.length > 100 ? '...' : '');
  }
}

export default new FileProcessingService();
