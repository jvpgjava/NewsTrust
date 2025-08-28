import React, { useState } from 'react'
import { Brain, Globe, CheckCircle, AlertTriangle, Clock, TrendingUp, Shield, Target, Zap } from 'lucide-react'
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

  const handleContentSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await axios.post('http://localhost:3001/api/content-analysis', contentData)
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

  const getRiskLevelColor = (level) => {
    switch (level) {
      case 'BAIXO': return 'text-green-600 bg-green-50 border-green-200'
      case 'MÉDIO': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'ALTO': return 'text-red-600 bg-red-50 border-red-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getRiskLevelBgColor = (level) => {
    switch (level) {
      case 'BAIXO': return 'from-green-50 to-emerald-100 border-green-200'
      case 'MÉDIO': return 'from-yellow-50 to-orange-100 border-yellow-200'
      case 'ALTO': return 'from-red-50 to-red-100 border-red-200'
      default: return 'from-gray-50 to-gray-100 border-gray-200'
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full mb-6">
            <Zap className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
            Análise de Notícias
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Analise a credibilidade de fontes e o conteúdo de notícias usando IA avançada
          </p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="p-2 bg-gradient-to-r from-gray-50 to-blue-50">
            <nav className="flex bg-white rounded-xl p-1 shadow-sm">
              <button
                onClick={() => setActiveTab('content')}
                className={`flex-1 flex items-center justify-center py-4 px-6 rounded-lg font-medium text-sm transition-all duration-300 ${activeTab === 'content'
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg transform scale-105'
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
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg transform scale-105'
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
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-8 w-full">
                    <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                      <Brain className="h-6 w-6 mr-3 text-purple-600" />
                      Análise de Conteúdo
                    </h3>
                    <form onSubmit={handleContentSubmit} className="space-y-6">
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
                          placeholder="Descreva aqui o conteúdo encontrado..."
                          required
                        ></textarea>
                      </div>
                      <button
                        type="submit"
                        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-5 px-8 rounded-lg font-semibold text-lg shadow-md hover:from-blue-700 hover:to-purple-700 transition duration-300 ease-in-out flex items-center justify-center"
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
                              <div className={`p-6 rounded-xl border ${contentResult.isFakeNews ? 'bg-gradient-to-br from-red-50 to-pink-100 border-red-200' : 'bg-gradient-to-br from-green-50 to-emerald-100 border-green-200'}`}>
                                <span className={`text-sm font-medium ${contentResult.isFakeNews ? 'text-red-700' : 'text-green-700'}`}>Fake News</span>
                                <div className="flex items-center mt-3">
                                  {contentResult.isFakeNews ? (
                                    <AlertTriangle className="h-6 w-6 text-red-600" />
                                  ) : (
                                    <CheckCircle className="h-6 w-6 text-green-600" />
                                  )}
                                  <p className="text-3xl font-bold ml-3 text-gray-900">
                                    {contentResult.isFakeNews ? 'Sim' : 'Não'}
                                  </p>
                                </div>
                              </div>

                              <div className="bg-gradient-to-br from-green-50 to-emerald-100 p-6 rounded-xl border border-green-200">
                                <span className="text-sm font-medium text-green-700">Credibilidade</span>
                                <div className="flex items-center mt-3">
                                  {getConfidenceIcon(contentResult.confidence)}
                                  <p className={`text-3xl font-bold ml-3 ${getConfidenceColor(contentResult.confidence)}`}>
                                    {contentResult.confidence && !isNaN(contentResult.confidence) ? Math.round(contentResult.confidence * 100) : 0}%
                                  </p>
                                </div>
                              </div>

                              <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-6 rounded-xl border border-gray-200">
                                <span className="text-sm font-medium text-gray-700">Nível de Risco</span>
                                <div className="mt-3">
                                  <div className="mb-2">
                                    <span className="text-lg font-bold text-gray-900">{contentResult.riskLevel?.toUpperCase()}</span>
                                  </div>
                                  <div className="w-full bg-gray-200 rounded-full h-3">
                                    <div
                                      className={`h-3 rounded-full transition-all duration-500 ${contentResult.riskLevel === 'BAIXO' ? 'bg-green-500' :
                                        contentResult.riskLevel === 'MÉDIO' ? 'bg-yellow-500' : 'bg-red-500'
                                        }`}
                                      style={{
                                        width: contentResult.riskLevel === 'BAIXO' ? '25%' :
                                          contentResult.riskLevel === 'MÉDIO' ? '60%' : '90%'
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

                            <div className="bg-gradient-to-br from-purple-50 to-pink-100 p-4 rounded-xl border border-purple-200">
                              <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                                <Zap className="h-4 w-4 mr-2 text-purple-600" />
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
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-8 w-full">
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
                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-5 px-8 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transform hover:scale-105 text-lg"
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
                              <div className="bg-gradient-to-br from-blue-50 to-indigo-100 p-6 rounded-xl border border-blue-200">
                                <span className="text-sm font-medium text-blue-700">Domínio</span>
                                <p className="text-xl font-bold text-gray-900 mt-2 break-all">
                                  {sourceResult.domain}
                                </p>
                              </div>

                              <div className="bg-gradient-to-br from-green-50 to-emerald-100 p-6 rounded-xl border border-green-200">
                                <span className="text-sm font-medium text-green-700">Credibilidade</span>
                                <div className="flex items-center mt-3">
                                  {getConfidenceIcon(sourceResult.credibility)}
                                  <p className={`text-3xl font-bold ml-3 ${getConfidenceColor(sourceResult.credibility)}`}>
                                    {Math.round(sourceResult.credibility * 100)}%
                                  </p>
                                </div>
                              </div>

                              <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-6 rounded-xl border border-gray-200">
                                <span className="text-sm font-medium text-gray-700">Nível de Risco</span>
                                <div className="mt-3">
                                  <div className="mb-2">
                                    <span className="text-lg font-bold text-gray-900">{sourceResult.riskLevel?.toUpperCase()}</span>
                                  </div>
                                  <div className="w-full bg-gray-200 rounded-full h-3">
                                    <div
                                      className={`h-3 rounded-full transition-all duration-500 ${sourceResult.riskLevel === 'BAIXO' ? 'bg-green-500' :
                                        sourceResult.riskLevel === 'MÉDIO' ? 'bg-yellow-500' : 'bg-red-500'
                                        }`}
                                      style={{
                                        width: sourceResult.riskLevel === 'BAIXO' ? '25%' :
                                          sourceResult.riskLevel === 'MÉDIO' ? '60%' : '90%'
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
