"use client"

import { useState } from "react"
import { Search, AlertTriangle, CheckCircle, XCircle, Loader, FileText } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import toast from "react-hot-toast"
import { api } from "../services/api"

export default function NewsAnalysis() {
  const [newsData, setNewsData] = useState({
    title: "",
    content: "",
    url: "",
    author: "",
    sources: [],
  })
  const [analysis, setAnalysis] = useState(null)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const [showErrors, setShowErrors] = useState(false)

  const handleInputChange = (field, value) => {
    setNewsData((prev) => ({
      ...prev,
      [field]: value,
    }))

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }))
    }
  }

  const validateForm = () => {
    const newErrors = {}

    // Required fields
    if (!newsData.title.trim()) {
      newErrors.title = "Título é obrigatório"
    }
    if (!newsData.content.trim()) {
      newErrors.content = "Conteúdo é obrigatório"
    }
    if (!newsData.url.trim()) {
      newErrors.url = "URL é obrigatória"
    }

    // Author is optional, no validation needed

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const analyzeNews = async () => {
    setShowErrors(true)

    if (!validateForm()) {
      toast.error("Preencha os campos obrigatórios")
      return
    }

    setLoading(true)
    try {
      // Preparar dados da requisição, omitindo autor se estiver vazio
      const requestData = {
        title: newsData.title,
        content: newsData.content,
        url: newsData.url
      }

      // Só incluir autor se não estiver vazio
      if (newsData.author.trim()) {
        requestData.author = newsData.author.trim()
      }

      const response = await api.post("/api/analysis", requestData)

      setAnalysis(response.data)
      toast.success("Análise concluída!")
    } catch (error) {
      console.error("Error analyzing news:", error)
      toast.error("Erro ao analisar notícia")
    } finally {
      setLoading(false)
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

  const clearForm = () => {
    setNewsData({
      title: "",
      content: "",
      url: "",
      author: "",
      sources: [],
    })
    setAnalysis(null)
    setErrors({})
    setShowErrors(false)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Análise de Notícias</h1>
        <p className="mt-2 text-gray-600">Insira os dados da notícia para verificar sua credibilidade</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Form */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Dados da Notícia</h2>
          <p className="text-sm text-gray-600 mb-4">* Campos obrigatórios</p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Título da Notícia *</label>
              <input
                type="text"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${showErrors && errors.title
                  ? 'border-red-500 focus:ring-red-500'
                  : 'border-gray-300'
                  }`}
                placeholder="Digite o título da notícia..."
                value={newsData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
              />
              {showErrors && errors.title && (
                <p className="mt-1 text-sm text-red-600">{errors.title}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Conteúdo *</label>
              <textarea
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 h-32 resize-none ${showErrors && errors.content
                  ? 'border-red-500 focus:ring-red-500'
                  : 'border-gray-300'
                  }`}
                placeholder="Cole o conteúdo da notícia aqui..."
                value={newsData.content}
                onChange={(e) => handleInputChange("content", e.target.value)}
              />
              {showErrors && errors.content && (
                <p className="mt-1 text-sm text-red-600">{errors.content}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">URL da Notícia *</label>
                <input
                  type="url"
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${showErrors && errors.url
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-gray-300'
                    }`}
                  placeholder="https://..."
                  value={newsData.url}
                  onChange={(e) => handleInputChange("url", e.target.value)}
                />
                {showErrors && errors.url && (
                  <p className="mt-1 text-sm text-red-600">{errors.url}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Autor (Opcional)</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Nome do autor"
                  value={newsData.author}
                  onChange={(e) => handleInputChange("author", e.target.value)}
                />
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={analyzeNews}
                disabled={loading}
                className="flex-1 flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader className="animate-spin h-4 w-4 mr-2" />
                    Analisando...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4 mr-2" />
                    Analisar Notícia
                  </>
                )}
              </button>

              <button
                onClick={clearForm}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Limpar
              </button>
            </div>
          </div>
        </div>

        {/* Analysis Results */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Resultado da Análise</h2>

          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-12"
              >
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                <p className="text-gray-600">Processando análise...</p>
              </motion.div>
            ) : analysis ? (
              <motion.div
                key="results"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                {/* Risk Level */}
                <div className={`p-4 rounded-lg border-2 ${getRiskColor(analysis.riskLevel)}`}>
                  <div className="flex items-center">
                    {getRiskIcon(analysis.riskLevel)}
                    <div className="ml-3">
                      <h3 className="text-lg font-semibold">
                        {analysis.riskLevel === "ALTO"
                          ? "Alto Risco de Fake News"
                          : analysis.riskLevel === "MÉDIO"
                            ? "Risco Moderado"
                            : "Baixo Risco - Aparenta ser Confiável"}
                      </h3>
                      <p className="text-sm opacity-75">
                        Pontuação: {analysis.score ? (analysis.score * 100).toFixed(1) : 'N/A'}%
                      </p>
                    </div>
                  </div>
                </div>

                {/* Detailed Analysis */}
                <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">Detalhes da Análise</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Fonte Identificada:</span>
                        <span className="text-sm font-medium">
                          {analysis.sourceName || 'Não identificada'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Credibilidade da Fonte:</span>
                        <span className="text-sm font-medium">
                          {analysis.sourceCredibility ? (analysis.sourceCredibility * 100).toFixed(1) : 'N/A'}%
                        </span>
                      </div>
                      <div className="pt-2 border-t border-gray-200">
                        <p className="text-xs text-gray-500 leading-relaxed">
                          {analysis.sourceName === 'Fonte não identificada' || analysis.sourceName === 'Fonte Desconhecida'
                            ? `Por ser uma fonte desconhecida, ela possui maior risco do que fontes já catalogadas e analisadas. Recomenda-se extrema cautela e verificação com fontes confiáveis antes de considerar a informação como verdadeira.`
                            : analysis.sourceCredibility >= 0.8
                              ? `A fonte "${analysis.sourceName}" possui alto índice de confiabilidade baseado em análises prévias. É considerada uma fonte confiável para busca de informações.`
                              : analysis.sourceCredibility >= 0.6
                                ? `A fonte "${analysis.sourceName}" possui credibilidade moderada. Recomenda-se verificar informações com outras fontes para confirmação.`
                                : `A fonte "${analysis.sourceName}" possui baixo índice de confiabilidade. Recomenda-se cautela e verificação com fontes mais confiáveis.`
                          }
                        </p>
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
                <FileText className="h-12 w-12 mb-4 opacity-50" />
                <p>Insira os dados da notícia e clique em "Analisar" para ver os resultados</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>



    </div>
  )
}
