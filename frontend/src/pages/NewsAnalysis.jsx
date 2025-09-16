import React, { useState, useRef } from 'react'
import { Brain, Globe, CheckCircle, AlertTriangle, Clock, TrendingUp, Shield, Target, Zap, Upload, FileText, X, Trash2 } from 'lucide-react'
import axios from 'axios'
import toast from 'react-hot-toast'

const NewsAnalysis = () => {
  const [activeTab, setActiveTab] = useState('content')
  const [loading, setLoading] = useState(false)
  const [contentResult, setContentResult] = useState(null)
  const [sourceResult, setSourceResult] = useState(null)

  // Estados para análise de conteúdo
  const [contentData, setContentData] = useState({
    title: '',
    content: ''
  })

  // Estados para análise de fonte
  const [sourceData, setSourceData] = useState({
    url: ''
  })

  // Estados para upload de arquivo
  const [uploadedFile, setUploadedFile] = useState(null)
  const [fileContent, setFileContent] = useState('')
  const fileInputRef = useRef(null)

  const handleFileUpload = async (file) => {
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
    ]
    const maxSize = 5 * 1024 * 1024 // 5MB

    if (!allowedTypes.includes(file.type)) {
      toast.error('Tipo de arquivo não suportado. Use PDF, TXT, DOCX ou imagens (JPEG, PNG, etc.).')
      return
    }

    if (file.size > maxSize) {
      toast.error('Arquivo muito grande. Tamanho máximo: 5MB')
      return
    }

    setUploadedFile(file)
    
    // Se for um arquivo de texto, ler o conteúdo
    if (file.type === 'text/plain') {
      const reader = new FileReader()
      reader.onload = (e) => {
        const content = e.target.result
        setFileContent(content)
        setContentData(prev => ({
          ...prev,
          title: file.name.replace(/\.[^/.]+$/, ""),
          content: content
        }))
      }
      reader.readAsText(file)
    } else {
      // Para PDF e DOCX, apenas definir o título - conteúdo será extraído no backend
      setContentData(prev => ({
        ...prev,
        title: file.name.replace(/\.[^/.]+$/, ""),
        content: "" // Limpar conteúdo para forçar extração do arquivo
      }))
    }
  }

  const removeFile = () => {
    setUploadedFile(null)
    setFileContent('')
    setContentData(prev => ({
      ...prev,
      title: '',
      content: ''
    }))
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleContentSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      let response
      
      if (uploadedFile) {
        // Upload de arquivo para análise
        const formData = new FormData()
        formData.append('file', uploadedFile)
        
        response = await axios.post('http://localhost:3001/api/file-upload/analyze-file', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        })
      } else {
        // Análise de conteúdo manual
        response = await axios.post('http://localhost:3001/api/content-analysis', contentData)
      }
      
      setContentResult(response.data)
      toast.success('Análise de conteúdo concluída!')
    } catch (error) {
      console.error('Erro na análise de conteúdo:', error)
      toast.error('Erro na análise de conteúdo')
    } finally {
      setLoading(false)
    }
  }

  const handleSourceSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await axios.post('http://localhost:3001/api/source-analysis', sourceData)
      setSourceResult(response.data)
      toast.success('Análise de fonte concluída!')
    } catch (error) {
      console.error('Erro na análise de fonte:', error)
      toast.error('Erro na análise de fonte')
    } finally {
      setLoading(false)
    }
  }

  const clearContentForm = () => {
    setContentData({ title: '', content: '' })
    setContentResult(null)
    removeFile()
    toast.success('Formulário de conteúdo limpo!')
  }

  const clearSourceForm = () => {
    setSourceData({ url: '' })
    setSourceResult(null)
    toast.success('Formulário de fonte limpo!')
  }

  const getRiskLevelColor = (level) => {
    if (!level) return 'text-gray-600 bg-gray-50 border-gray-200';

    const normalizedLevel = level.toUpperCase();
    switch (normalizedLevel) {
      case 'BAIXO':
      case 'LOW':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'MÉDIO':
      case 'MEDIO':
      case 'MEDIUM':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'ALTO':
      case 'HIGH':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  }

  const getRiskLevelBgColor = (level) => {
    if (!level) return 'from-gray-50 to-gray-100 border-gray-200';

    const normalizedLevel = level.toUpperCase();
    switch (normalizedLevel) {
      case 'BAIXO':
      case 'LOW':
        return 'from-green-50 to-emerald-100 border-green-200';
      case 'MÉDIO':
      case 'MEDIO':
      case 'MEDIUM':
        return 'from-yellow-50 to-orange-100 border-yellow-200';
      case 'ALTO':
      case 'HIGH':
        return 'from-red-50 to-red-100 border-red-200';
      default:
        return 'from-gray-50 to-gray-100 border-gray-200';
    }
  }

  const getConfidenceColor = (confidence) => {
    const value = parseFloat(confidence);
    if (isNaN(value)) return 'text-gray-600';
    if (value >= 0.8) return 'text-green-600';
    if (value >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  }

  const getConfidenceIcon = (confidence) => {
    const value = parseFloat(confidence);
    if (isNaN(value)) return <Shield className="h-5 w-5 text-gray-600" />;
    if (value >= 0.8) return <Shield className="h-5 w-5 text-green-600" />;
    if (value >= 0.6) return <Target className="h-5 w-5 text-yellow-600" />;
    return <AlertTriangle className="h-5 w-5 text-red-600" />;
  }

  const getConfidenceBgColor = (confidence) => {
    const value = parseFloat(confidence);
    if (isNaN(value)) return 'bg-gray-100';
    if (value >= 0.8) return 'bg-green-100';
    if (value >= 0.6) return 'bg-yellow-100';
    return 'bg-red-100';
  }

  const getConfidenceTextColor = (confidence) => {
    const value = parseFloat(confidence);
    if (isNaN(value)) return 'text-gray-600';
    if (value >= 0.8) return 'text-green-700';
    if (value >= 0.6) return 'text-yellow-700';
    return 'text-red-700';
  }

  const getRiskLevelBarColor = (level) => {
    if (!level) return 'bg-gray-500';

    const normalizedLevel = level.toUpperCase();
    switch (normalizedLevel) {
      case 'BAIXO':
      case 'LOW':
        return 'bg-green-500';
      case 'MÉDIO':
      case 'MEDIO':
      case 'MEDIUM':
        return 'bg-yellow-500';
      case 'ALTO':
      case 'HIGH':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  }

  const getRiskLevelBarWidth = (level) => {
    if (!level) return '0%';

    const normalizedLevel = level.toUpperCase();
    switch (normalizedLevel) {
      case 'BAIXO':
      case 'LOW':
        return '25%';
      case 'MÉDIO':
      case 'MEDIO':
      case 'MEDIUM':
        return '50%';
      case 'ALTO':
      case 'HIGH':
        return '90%';
      default:
        return '0%';
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-blue-700 rounded-full mb-6">
            <Zap className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent mb-4">
            Análise de Notícias
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Analise a credibilidade de fontes e o conteúdo de notícias
          </p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="p-2 bg-gradient-to-r from-gray-50 to-blue-50">
            <nav className="flex bg-white rounded-xl p-1 shadow-sm">
              <button
                onClick={() => setActiveTab('content')}
                className={`flex-1 flex items-center justify-center py-4 px-6 rounded-lg font-medium text-sm transition-all duration-300 ${activeTab === 'content'
                  ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg transform scale-105'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                  }`}
              >
                <div className={`p-2 rounded-full mr-3 transition-all duration-300 ${activeTab === 'content' ? 'bg-white/20' : 'bg-gray-100'
                  }`}>
                  <Brain className={`h-5 w-5 ${activeTab === 'content' ? 'text-white' : 'text-gray-500'
                    }`} />
                </div>
                <span className="font-semibold">Análise de Conteúdo</span>
              </button>
              <button
                onClick={() => setActiveTab('source')}
                className={`flex-1 flex items-center justify-center py-4 px-6 rounded-lg font-medium text-sm transition-all duration-300 ${activeTab === 'source'
                  ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg transform scale-105'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                  }`}
              >
                <div className={`p-2 rounded-full mr-3 transition-all duration-300 ${activeTab === 'source' ? 'bg-white/20' : 'bg-gray-100'
                  }`}>
                  <Globe className={`h-5 w-5 ${activeTab === 'source' ? 'text-white' : 'text-gray-500'
                    }`} />
                </div>
                <span className="font-semibold">Análise de Fonte</span>
              </button>
            </nav>
          </div>

          {/* Content */}
          <div className="p-8">
            {activeTab === 'content' ? (
              <div className="w-full">
                {/* Form and Results */}
                <div className="space-y-6 w-full">
                  <div className="bg-white rounded-xl p-8 w-full">
                    <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                      <Brain className="h-6 w-6 mr-3 text-blue-600" />
                      Análise de Conteúdo
                    </h3>
                    <form onSubmit={handleContentSubmit} className="space-y-6">
                      {/* Seção de Upload de Arquivo */}
                      <div className="bg-white p-6 rounded-xl border border-blue-200">
                        <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                          <Upload className="h-5 w-5 mr-2 text-blue-600" />
                          Upload de Arquivo (Opcional)
                        </h4>
                        
                        {!uploadedFile ? (
                          <div className="border-2 border-dashed border-blue-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
                            <input
                              ref={fileInputRef}
                              type="file"
                              accept=".pdf,.txt,.docx"
                              onChange={(e) => e.target.files[0] && handleFileUpload(e.target.files[0])}
                              className="hidden"
                            />
                            <div className="space-y-3">
                              <FileText className="h-12 w-12 text-blue-400 mx-auto" />
                              <div>
                                <p className="text-lg font-medium text-gray-700">
                                  Arraste um arquivo aqui ou clique para selecionar
                                </p>
                                <p className="text-sm text-gray-500 mt-1">
                                  Suporta PDF, TXT, DOCX e imagens (JPEG, PNG, etc.) - máx. 5MB
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                              >
                                Selecionar Arquivo
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="bg-white p-4 rounded-lg border border-green-200">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <FileText className="h-8 w-8 text-green-600" />
                                <div>
                                  <p className="font-medium text-gray-800">{uploadedFile.name}</p>
                                  <p className="text-sm text-gray-500">
                                    {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                                  </p>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={removeFile}
                                className="text-red-500 hover:text-red-700 p-1"
                              >
                                <X className="h-5 w-5" />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-base font-medium text-gray-700 mb-3">
                          Título da Notícia
                        </label>
                        <input
                          type="text"
                          value={contentData.title}
                          onChange={(e) => setContentData({ ...contentData, title: e.target.value })}
                          className="w-full px-5 py-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-lg"
                          placeholder="Digite o título do conteúdo"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-base font-medium text-gray-700 mb-3">
                          Conteúdo da Notícia
                        </label>
                        <textarea
                          value={contentData.content}
                          onChange={(e) => setContentData({ ...contentData, content: e.target.value })}
                          rows="8"
                          className="w-full px-5 py-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-y text-lg"
                          placeholder={uploadedFile ? "Conteúdo será extraído automaticamente do arquivo (PDF/DOCX) ou análise de imagem..." : "Descreva aqui o conteúdo encontrado..."}
                          required={!uploadedFile}
                        ></textarea>
                      </div>
                      <div className="flex space-x-4">
                        <button
                          type="submit"
                          className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white py-5 px-8 rounded-lg font-semibold text-lg shadow-md hover:from-blue-700 hover:to-blue-800 transition duration-300 ease-in-out flex items-center justify-center"
                          disabled={loading}
                        >
                          {loading ? (
                            <svg className="animate-spin h-6 w-6 text-white mr-3" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                          ) : (
                            <>
                              <Target className="h-6 w-6 mr-3" />
                              Analisar Conteúdo
                            </>
                          )}
                        </button>
                        
                        <button
                          type="button"
                          onClick={clearContentForm}
                          className="bg-gray-500 text-white py-5 px-6 rounded-lg font-semibold text-lg shadow-md hover:bg-gray-600 transition duration-300 ease-in-out flex items-center justify-center"
                        >
                          <Trash2 className="h-5 w-5 mr-2" />
                          Limpar
                        </button>
                      </div>
                    </form>

                    {/* Resultados da Análise de Conteúdo */}
                    {contentResult ? (
                      <div className="mt-8 pt-8 border-t border-blue-200">
                        <div className="bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden">
                          <div className="bg-gradient-to-r from-green-50 to-blue-50 px-6 py-4 border-b border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                              <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
                              Resultado da Análise
                            </h3>
                          </div>

                          <div className="p-6 space-y-6">
                            <div className="space-y-4">
                              <div className={`p-6 rounded-xl border ${getConfidenceBgColor(contentResult.confidence)}`}>
                                <span className={`text-sm font-medium ${getConfidenceTextColor(contentResult.confidence)}`}>Credibilidade</span>
                                <div className="flex items-center mt-3">
                                  {getConfidenceIcon(contentResult.confidence)}
                                  <p className={`text-3xl font-bold ml-3 ${getConfidenceColor(contentResult.confidence)}`}>
                                    {contentResult.confidence && !isNaN(contentResult.confidence) ? Math.round(contentResult.confidence * 100) : 0}%
                                  </p>
                                </div>
                              </div>

                              {/* Informações do Arquivo */}
                              {contentResult.fileInfo && (
                                <div className="bg-white p-6 rounded-xl border border-blue-200">
                                  <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                                    <FileText className="h-5 w-5 mr-2 text-blue-600" />
                                    Informações do Arquivo
                                  </h4>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                      <span className="text-sm font-medium text-gray-600">Nome:</span>
                                      <p className="text-lg font-semibold text-gray-800">{contentResult.fileInfo.name}</p>
                                    </div>
                                    <div>
                                      <span className="text-sm font-medium text-gray-600">Tipo:</span>
                                      <p className="text-lg font-semibold text-gray-800">{contentResult.fileInfo.type}</p>
                                    </div>
                                    <div>
                                      <span className="text-sm font-medium text-gray-600">Tamanho:</span>
                                      <p className="text-lg font-semibold text-gray-800">
                                        {(contentResult.fileInfo.size / 1024 / 1024).toFixed(2)} MB
                                      </p>
                                    </div>
                                    <div>
                                      <span className="text-sm font-medium text-gray-600">Processado em:</span>
                                      <p className="text-lg font-semibold text-gray-800">
                                        {new Date(contentResult.fileInfo.processedAt).toLocaleString('pt-BR')}
                                      </p>
                                    </div>
                                  </div>
                                  {contentResult.fileInfo.extractedContent && (
                                    <div className="mt-4">
                                      <span className="text-sm font-medium text-gray-600">Conteúdo extraído (preview):</span>
                                      <p className="text-sm text-gray-700 mt-2 bg-white p-3 rounded border">
                                        {contentResult.fileInfo.extractedContent}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              )}

                              <div className="bg-white p-6 rounded-xl border border-gray-200">
                                <span className="text-sm font-medium text-gray-700">Nível de Risco</span>
                                <div className="mt-3">
                                  <div className="mb-2">
                                    <span className="text-lg font-bold text-gray-900">
                                      {contentResult.riskLevel ? contentResult.riskLevel.toUpperCase() : 'N/A'}
                                    </span>
                                  </div>
                                  <div className="w-full bg-gray-200 rounded-full h-3">
                                    <div
                                      className={`h-3 rounded-full transition-all duration-500 ${getRiskLevelBarColor(contentResult.riskLevel)}`}
                                      style={{
                                        width: getRiskLevelBarWidth(contentResult.riskLevel)
                                      }}
                                    ></div>
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="bg-gradient-to-br from-blue-50 to-indigo-100 p-4 rounded-xl border border-blue-200">
                              <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                                <Target className="h-4 w-4 mr-2 text-blue-600" />
                                Razões
                              </h4>
                              <ul className="list-disc list-inside text-sm space-y-1">
                                {Array.isArray(contentResult.reasons) ? contentResult.reasons.map((reason, index) => (
                                  <li key={index}>{reason}</li>
                                )) : (
                                  <li>Análise concluída</li>
                                )}
                              </ul>
                            </div>

                            <div className="bg-gradient-to-br from-green-50 to-emerald-100 p-4 rounded-xl border border-green-200">
                              <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                                <Shield className="h-4 w-4 mr-2 text-green-600" />
                                Recomendações
                              </h4>
                              <ul className="list-disc list-inside text-sm space-y-1">
                                {Array.isArray(contentResult.recommendations) ? contentResult.recommendations.map((rec, index) => (
                                  <li key={index}>{rec}</li>
                                )) : (
                                  <li>Verificar fontes confiáveis</li>
                                )}
                              </ul>
                            </div>

                            <div className="bg-white p-4 rounded-xl border border-blue-200">
                              <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                                <Zap className="h-4 w-4 mr-2 text-blue-600" />
                                Análise Detalhada
                              </h4>
                              <p className="text-sm text-gray-700">
                                Análise na Web + IA - Resultados: {contentResult.webResults?.totalResults || 0}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-8 pt-8 border-t border-blue-200 flex items-center justify-center min-h-[200px]">
                        <p className="text-gray-500 text-lg">Aguardando Análise...</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="w-full">
                {/* Form and Results */}
                <div className="space-y-6 w-full">
                  <div className="bg-white rounded-xl p-8 w-full">
                    <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                      <Globe className="h-6 w-6 mr-3 text-blue-600" />
                      Análise de Fonte
                    </h3>
                    <form onSubmit={handleSourceSubmit} className="space-y-6">
                      <div>
                        <label className="block text-base font-medium text-gray-700 mb-3">
                          URL da Fonte
                        </label>
                        <input
                          type="url"
                          value={sourceData.url}
                          onChange={(e) => setSourceData({ ...sourceData, url: e.target.value })}
                          className="w-full px-5 py-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-lg"
                          placeholder="https://exemplo.com"
                          required
                        />
                      </div>
                      <div className="flex space-x-4">
                        <button
                          type="submit"
                          disabled={loading}
                          className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white py-5 px-8 rounded-lg font-medium hover:from-blue-700 hover:to-blue-800 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transform hover:scale-105 text-lg"
                        >
                          {loading ? (
                            <>
                              <Clock className="h-6 w-6 mr-3 animate-spin" />
                              Analisando...
                            </>
                          ) : (
                            <>
                              <Globe className="h-6 w-6 mr-3" />
                              Analisar Fonte
                            </>
                          )}
                        </button>
                        
                        <button
                          type="button"
                          onClick={clearSourceForm}
                          className="bg-gray-500 text-white py-5 px-6 rounded-lg font-medium hover:bg-gray-600 transition-all duration-300 flex items-center justify-center"
                        >
                          <Trash2 className="h-5 w-5 mr-2" />
                          Limpar
                        </button>
                      </div>
                    </form>

                    {/* Results inside the form card */}
                    {sourceResult && (
                      <div className="mt-8 pt-8 border-t border-blue-200">
                        <div className="bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden">
                          <div className="bg-gradient-to-r from-green-50 to-blue-50 px-6 py-4 border-b border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                              <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
                              Resultado da Análise
                            </h3>
                          </div>

                          <div className="p-6 space-y-6">
                            <div className="space-y-4">
                              <div className="bg-white p-6 rounded-xl border border-gray-200">
                                <span className="text-sm font-medium text-gray-700">Domínio</span>
                                <p className="text-xl font-bold text-gray-900 mt-2 break-all">
                                  {sourceResult.domain}
                                </p>
                              </div>

                              <div className={`p-6 rounded-xl border ${getConfidenceBgColor(sourceResult.credibility)}`}>
                                <span className={`text-sm font-medium ${getConfidenceTextColor(sourceResult.credibility)}`}>Credibilidade</span>
                                <div className="flex items-center mt-3">
                                  {getConfidenceIcon(sourceResult.credibility)}
                                  <p className={`text-3xl font-bold ml-3 ${getConfidenceColor(sourceResult.credibility)}`}>
                                    {Math.round(sourceResult.credibility * 100)}%
                                  </p>
                                </div>
                              </div>

                              <div className="bg-white p-6 rounded-xl border border-gray-200">
                                <span className="text-sm font-medium text-gray-700">Nível de Risco</span>
                                <div className="mt-3">
                                  <div className="mb-2">
                                    <span className="text-lg font-bold text-gray-900">
                                      {sourceResult.riskLevel ? sourceResult.riskLevel.toUpperCase() : 'N/A'}
                                    </span>
                                  </div>
                                  <div className="w-full bg-gray-200 rounded-full h-3">
                                    <div
                                      className={`h-3 rounded-full transition-all duration-500 ${getRiskLevelBarColor(sourceResult.riskLevel)}`}
                                      style={{
                                        width: getRiskLevelBarWidth(sourceResult.riskLevel)
                                      }}
                                    ></div>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {sourceResult.scamAdviserData && Object.keys(sourceResult.scamAdviserData).length > 0 && (
                              <div className="bg-gradient-to-br from-indigo-50 to-blue-50 p-4 rounded-xl border border-indigo-200">
                                <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                                  <Shield className="h-4 w-4 mr-2 text-indigo-600" />
                                  Dados
                                </h4>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                  {sourceResult.scamAdviserData.domainAge && (
                                    <div className="bg-white p-3 rounded-lg border border-indigo-100">
                                      <span className="text-indigo-600 font-medium">Idade do Domínio:</span>
                                      <p className="font-bold text-gray-900">{sourceResult.scamAdviserData.domainAge}</p>
                                    </div>
                                  )}
                                  {sourceResult.scamAdviserData.language && (
                                    <div className="bg-white p-3 rounded-lg border border-indigo-100">
                                      <span className="text-indigo-600 font-medium">Idioma:</span>
                                      <p className="font-bold text-gray-900">{sourceResult.scamAdviserData.language}</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default NewsAnalysis
