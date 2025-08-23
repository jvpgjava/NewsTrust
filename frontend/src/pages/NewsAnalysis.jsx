"use client"

import { useState } from "react"
import { Search, AlertTriangle, CheckCircle, XCircle, Loader, FileText, Globe, Brain } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import toast from "react-hot-toast"
import { contentAnalysisAPI, sourceAnalysisAPI } from "../services/api"

export default function NewsAnalysis() {
  const [activeTab, setActiveTab] = useState('content') // 'content' ou 'source'

  // Estados para análise de conteúdo
  const [contentData, setContentData] = useState({
    title: "",
    content: ""
  })
  const [contentAnalysis, setContentAnalysis] = useState(null)
  const [contentLoading, setContentLoading] = useState(false)
  const [contentErrors, setContentErrors] = useState({})
  const [showContentErrors, setShowContentErrors] = useState(false)

  // Estados para análise de fonte
  const [sourceData, setSourceData] = useState({
    url: ""
  })
  const [sourceAnalysis, setSourceAnalysis] = useState(null)
  const [sourceLoading, setSourceLoading] = useState(false)
  const [sourceErrors, setSourceErrors] = useState({})
  const [showSourceErrors, setShowSourceErrors] = useState(false)

  // Handlers para análise de conteúdo
  const handleContentInputChange = (field, value) => {
    setContentData((prev) => ({
      ...prev,
      [field]: value,
    }))

    if (contentErrors[field]) {
      setContentErrors(prev => ({
        ...prev,
        [field]: null
      }))
    }
  }

  const validateContentForm = () => {
    const newErrors = {}

    if (!contentData.title.trim()) {
      newErrors.title = "Título é obrigatório"
    }
    if (!contentData.content.trim()) {
      newErrors.content = "Conteúdo é obrigatório"
    }
    if (contentData.content.trim().length < 20) {
      newErrors.content = "Conteúdo deve ter pelo menos 20 caracteres"
    }

    setContentErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const analyzeContent = async () => {
    setShowContentErrors(true)

    if (!validateContentForm()) {
      toast.error("Preencha os campos obrigatórios")
      return
    }

    setContentLoading(true)
    try {
      const response = await contentAnalysisAPI.analyze(contentData)
      setContentAnalysis(response.data)
      toast.success("Análise de conteúdo concluída!")
    } catch (error) {
      console.error("Error analyzing content:", error)
      toast.error("Erro ao analisar conteúdo")
    } finally {
      setContentLoading(false)
    }
  }

  // Handlers para análise de fonte
  const handleSourceInputChange = (field, value) => {
    setSourceData((prev) => ({
      ...prev,
      [field]: value,
    }))

    if (sourceErrors[field]) {
      setSourceErrors(prev => ({
        ...prev,
        [field]: null
      }))
    }
  }

  const validateSourceForm = () => {
    const newErrors = {}

    if (!sourceData.url.trim()) {
      newErrors.url = "URL é obrigatória"
    } else if (!sourceData.url.startsWith('http')) {
      newErrors.url = "URL deve começar com http:// ou https://"
    }

    setSourceErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const analyzeSource = async () => {
    setShowSourceErrors(true)

    if (!validateSourceForm()) {
      toast.error("Preencha os campos obrigatórios")
      return
    }

    setSourceLoading(true)
    try {
      const response = await sourceAnalysisAPI.analyze(sourceData)
      setSourceAnalysis(response.data)
      toast.success("Análise de fonte concluída!")
    } catch (error) {
      console.error("Error analyzing source:", error)
      toast.error("Erro ao analisar fonte")
    } finally {
      setSourceLoading(false)
    }
  }

  const getRiskColor = (riskLevel) => {
    switch (riskLevel) {
      case "ALTO":
        return "text-red-600 bg-red-50 border-red-200"
      case "MÉDIO":
        return "text-yellow-600 bg-yellow-50 border-yellow-200"
      case "BAIXO":
        return "text-green-600 bg-green-50 border-green-200"
      default:
        return "text-gray-600 bg-gray-50 border-gray-200"
    }
  }

  const getRiskIcon = (riskLevel) => {
    switch (riskLevel) {
      case "ALTO":
        return <XCircle className="h-5 w-5" />
      case "MÉDIO":
        return <AlertTriangle className="h-5 w-5" />
      case "BAIXO":
        return <CheckCircle className="h-5 w-5" />
      default:
        return <AlertTriangle className="h-5 w-5" />
    }
  }

  const translateSourceType = (sourceType) => {
    switch (sourceType) {
      case 'reliable':
        return 'Confiável'
      case 'moderate':
        return 'Moderado'
      case 'suspicious':
        return 'Suspeito'
      case 'general':
        return 'Geral'
      default:
        return 'Geral'
    }
  }

  const translateRiskLevel = (riskLevel) => {
    switch (riskLevel) {
      case 'low':
        return 'Baixo'
      case 'medium':
        return 'Médio'
      case 'high':
        return 'Alto'
      default:
        return 'Médio'
    }
  }

  const formatDomainAge = (domainAge) => {
    if (!domainAge || domainAge === 'Não disponível' || domainAge.includes('content') || domainAge.includes('width')) {
      return 'Não disponível'
    }

    // Se contém números, provavelmente é uma idade válida
    if (/\d/.test(domainAge)) {
      return domainAge
    }

    return 'Não disponível'
  }

  const clearContentForm = () => {
    setContentData({
      title: "",
      content: ""
    })
    setContentAnalysis(null)
    setContentErrors({})
    setShowContentErrors(false)
  }

  const clearSourceForm = () => {
    setSourceData({
      url: ""
    })
    setSourceAnalysis(null)
    setSourceErrors({})
    setShowSourceErrors(false)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Análise de Notícias</h1>
        <p className="mt-2 text-gray-600">Analise o conteúdo de notícias ou a credibilidade de fontes</p>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100">
        <div className="p-2">
          <nav className="flex bg-gray-50 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('content')}
              className={`flex-1 flex items-center justify-center py-3 px-4 rounded-md font-medium text-sm transition-all duration-200 ${activeTab === 'content'
                ? 'bg-white text-blue-600 shadow-sm border border-blue-100'
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                }`}
            >
              <div className={`p-2 rounded-full mr-3 transition-all duration-200 ${activeTab === 'content' ? 'bg-blue-100' : 'bg-gray-200'
                }`}>
                <Brain className={`h-5 w-5 ${activeTab === 'content' ? 'text-blue-600' : 'text-gray-500'
                  }`} />
              </div>
              <span className="font-semibold">Análise de Conteúdo</span>
            </button>
            <button
              onClick={() => setActiveTab('source')}
              className={`flex-1 flex items-center justify-center py-3 px-4 rounded-md font-medium text-sm transition-all duration-200 ${activeTab === 'source'
                ? 'bg-white text-green-600 shadow-sm border border-green-100'
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                }`}
            >
              <div className={`p-2 rounded-full mr-3 transition-all duration-200 ${activeTab === 'source' ? 'bg-green-100' : 'bg-gray-200'
                }`}>
                <Globe className={`h-5 w-5 ${activeTab === 'source' ? 'text-green-600' : 'text-gray-500'
                  }`} />
              </div>
              <span className="font-semibold">Análise de Fonte</span>
            </button>
          </nav>
        </div>

        <div className="p-6">
          <AnimatePresence mode="wait">
            {activeTab === 'content' ? (
              <motion.div
                key="content"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="grid grid-cols-1 lg:grid-cols-2 gap-6"
              >
                {/* Content Analysis Form */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-100 shadow-sm">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                    <div className="p-2 bg-blue-100 rounded-lg mr-3">
                      <Brain className="h-6 w-6 text-blue-600" />
                    </div>
                    Análise de Conteúdo com IA
                  </h2>
                  <p className="text-sm text-gray-600 mb-4">Analise o conteúdo da notícia usando inteligência artificial</p>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Título da Notícia *</label>
                      <input
                        type="text"
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${showContentErrors && contentErrors.title
                          ? 'border-red-500 focus:ring-red-500'
                          : 'border-gray-300'
                          }`}
                        placeholder="Digite o título da notícia..."
                        value={contentData.title}
                        onChange={(e) => handleContentInputChange("title", e.target.value)}
                      />
                      {showContentErrors && contentErrors.title && (
                        <p className="mt-1 text-sm text-red-600">{contentErrors.title}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Conteúdo da Notícia *</label>
                      <textarea
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 h-40 resize-none ${showContentErrors && contentErrors.content
                          ? 'border-red-500 focus:ring-red-500'
                          : 'border-gray-300'
                          }`}
                        placeholder="Cole o conteúdo da notícia aqui..."
                        value={contentData.content}
                        onChange={(e) => handleContentInputChange("content", e.target.value)}
                      />
                      {showContentErrors && contentErrors.content && (
                        <p className="mt-1 text-sm text-red-600">{contentErrors.content}</p>
                      )}
                    </div>

                    <div className="flex space-x-3">
                      <button
                        onClick={analyzeContent}
                        disabled={contentLoading}
                        className="flex-1 flex items-center justify-center px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transition-all duration-200 font-semibold"
                      >
                        {contentLoading ? (
                          <>
                            <Loader className="animate-spin h-5 w-5 mr-2" />
                            Analisando...
                          </>
                        ) : (
                          <>
                            <Brain className="h-5 w-5 mr-2" />
                            Analisar Conteúdo
                          </>
                        )}
                      </button>

                      <button
                        onClick={clearContentForm}
                        className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 font-semibold"
                      >
                        Limpar
                      </button>
                    </div>
                  </div>
                </div>

                {/* Content Analysis Results */}
                <div className="bg-gradient-to-br from-gray-50 to-blue-50 p-6 rounded-xl border border-gray-200 shadow-sm">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                    <div className="p-2 bg-gray-100 rounded-lg mr-3">
                      <FileText className="h-6 w-6 text-gray-600" />
                    </div>
                    Resultado da Análise de Conteúdo
                  </h2>

                  <AnimatePresence mode="wait">
                    {contentLoading ? (
                      <motion.div
                        key="loading"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex flex-col items-center justify-center py-12"
                      >
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                        <p className="text-gray-600">Analisando conteúdo com IA...</p>
                      </motion.div>
                    ) : contentAnalysis ? (
                      <motion.div
                        key="results"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="space-y-6"
                      >
                        {/* Risk Level */}
                        <div className={`p-4 rounded-lg border-2 ${getRiskColor(contentAnalysis.riskLevel)}`}>
                          <div className="flex items-center">
                            {getRiskIcon(contentAnalysis.riskLevel)}
                            <div className="ml-3">
                              <h3 className="text-lg font-semibold">
                                {contentAnalysis.isFakeNews ? "Fake News Detectada" : "Conteúdo Confiável"}
                              </h3>
                              <p className="text-sm opacity-75">
                                Confiança: {contentAnalysis.confidence ? (contentAnalysis.confidence * 100).toFixed(1) : 'N/A'}%
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Detailed Analysis */}
                        <div className="space-y-4">
                          <div className="bg-white p-4 rounded-lg">
                            <h4 className="font-medium text-gray-900 mb-2">Análise Detalhada</h4>
                            <p className="text-sm text-gray-700 leading-relaxed">
                              {contentAnalysis.detailedAnalysis}
                            </p>
                          </div>

                          {contentAnalysis.reasons && contentAnalysis.reasons.length > 0 && (
                            <div className="bg-white p-4 rounded-lg">
                              <h4 className="font-medium text-gray-900 mb-2">Razões</h4>
                              <ul className="space-y-1">
                                {contentAnalysis.reasons.map((reason, index) => (
                                  <li key={index} className="text-sm text-gray-700 flex items-start">
                                    <span className="text-blue-500 mr-2">•</span>
                                    {reason}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {contentAnalysis.recommendations && contentAnalysis.recommendations.length > 0 && (
                            <div className="bg-white p-4 rounded-lg">
                              <h4 className="font-medium text-gray-900 mb-2">Recomendações</h4>
                              <ul className="space-y-1">
                                {contentAnalysis.recommendations.map((rec, index) => (
                                  <li key={index} className="text-sm text-gray-700 flex items-start">
                                    <span className="text-green-500 mr-2">•</span>
                                    {rec}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="empty"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex flex-col items-center justify-center py-12 text-gray-500"
                      >
                        <Brain className="h-12 w-12 mb-4 opacity-50" />
                        <p>Insira o título e conteúdo da notícia para análise com IA</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="source"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="grid grid-cols-1 lg:grid-cols-2 gap-6"
              >
                {/* Source Analysis Form */}
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-xl border border-green-100 shadow-sm">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                    <div className="p-2 bg-green-100 rounded-lg mr-3">
                      <Globe className="h-6 w-6 text-green-600" />
                    </div>
                    Análise de Fonte
                  </h2>
                  <p className="text-sm text-gray-600 mb-4">Verifique a credibilidade de um site ou domínio</p>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">URL do Site *</label>
                      <input
                        type="url"
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${showSourceErrors && sourceErrors.url
                          ? 'border-red-500 focus:ring-red-500'
                          : 'border-gray-300'
                          }`}
                        placeholder="https://exemplo.com"
                        value={sourceData.url}
                        onChange={(e) => handleSourceInputChange("url", e.target.value)}
                      />
                      {showSourceErrors && sourceErrors.url && (
                        <p className="mt-1 text-sm text-red-600">{sourceErrors.url}</p>
                      )}
                    </div>

                    <div className="flex space-x-3">
                      <button
                        onClick={analyzeSource}
                        disabled={sourceLoading}
                        className="flex-1 flex items-center justify-center px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transition-all duration-200 font-semibold"
                      >
                        {sourceLoading ? (
                          <>
                            <Loader className="animate-spin h-5 w-5 mr-2" />
                            Analisando...
                          </>
                        ) : (
                          <>
                            <Globe className="h-5 w-5 mr-2" />
                            Analisar Fonte
                          </>
                        )}
                      </button>

                      <button
                        onClick={clearSourceForm}
                        className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 font-semibold"
                      >
                        Limpar
                      </button>
                    </div>
                  </div>
                </div>

                {/* Source Analysis Results */}
                <div className="bg-gradient-to-br from-gray-50 to-green-50 p-6 rounded-xl border border-gray-200 shadow-sm">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                    <div className="p-2 bg-gray-100 rounded-lg mr-3">
                      <FileText className="h-6 w-6 text-gray-600" />
                    </div>
                    Resultado da Análise de Fonte
                  </h2>

                  <AnimatePresence mode="wait">
                    {sourceLoading ? (
                      <motion.div
                        key="loading"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex flex-col items-center justify-center py-12"
                      >
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mb-4"></div>
                        <p className="text-gray-600">Analisando fonte...</p>
                      </motion.div>
                    ) : sourceAnalysis ? (
                      <motion.div
                        key="results"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="space-y-6"
                      >
                        {/* Risk Level */}
                        <div className={`p-4 rounded-lg border-2 ${getRiskColor(sourceAnalysis.riskLevel)}`}>
                          <div className="flex items-center">
                            {getRiskIcon(sourceAnalysis.riskLevel)}
                            <div className="ml-3">
                              <h3 className="text-lg font-semibold">
                                {sourceAnalysis.domain}
                              </h3>
                              <p className="text-sm opacity-75">
                                Credibilidade: {sourceAnalysis.credibility ? (sourceAnalysis.credibility * 100).toFixed(1) : 'N/A'}%
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Detailed Analysis */}
                        <div className="space-y-4">
                          <div className="bg-white p-4 rounded-lg">
                            <h4 className="font-medium text-gray-900 mb-2">Informações da Fonte</h4>
                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <span className="text-sm text-gray-600">País:</span>
                                <span className="text-sm font-medium">{sourceAnalysis.scamAdviserData?.country || 'Brasil'}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm text-gray-600">Idade do Domínio:</span>
                                <span className="text-sm font-medium">{formatDomainAge(sourceAnalysis.scamAdviserData?.domainAge)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm text-gray-600">Nível de Risco:</span>
                                <span className="text-sm font-medium">{translateRiskLevel(sourceAnalysis.scamAdviserData?.riskLevel)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="empty"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex flex-col items-center justify-center py-12 text-gray-500"
                      >
                        <Globe className="h-12 w-12 mb-4 opacity-50" />
                        <p>Insira a URL do site para análise de credibilidade</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
