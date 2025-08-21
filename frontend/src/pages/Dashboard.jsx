"use client"

import { useState, useEffect } from "react"
import { TrendingUp, TrendingDown, Users, Network, CheckCircle, XCircle, Activity } from "lucide-react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { api } from "../services/api"

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [recentAnalyses, setRecentAnalyses] = useState([])
  const [loading, setLoading] = useState(true)


  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const [statsResponse, recentAnalysesResponse] = await Promise.all([
          api.get("/api/graph/stats"),
          api.get("/api/news?limit=5")
        ])

        setStats(statsResponse.data)
        setRecentAnalyses(recentAnalysesResponse.data.noticias || [])
      } catch (error) {
        console.error("Error loading dashboard data:", error)
      } finally {
        setLoading(false)
      }
    }

    loadDashboardData()

    // Atualizar dados a cada 30 segundos
    const interval = setInterval(loadDashboardData, 30000)

    // WebSocket para atualizações em tempo real
    const ws = new WebSocket('ws://localhost:3001')

    ws.onopen = () => {
      console.log('WebSocket conectado para dashboard')
    }

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)
      if (data.type === 'news_analyzed' || data.type === 'stats_updated') {
        loadDashboardData()
      }
    }

    ws.onerror = (error) => {
      console.error('WebSocket error:', error)
    }

    return () => {
      clearInterval(interval)
      ws.close()
    }
  }, [])

  // Chart data from stats (only real data)
  const trendData = stats?.monthlyTrends || []
  const riskDistribution = stats?.riskDistribution || []

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-gray-600">Visão geral do sistema de detecção de fake news</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Users className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Fontes Analisadas</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.nodeCount || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Network className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Conexões de Confiança</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.edgeCount || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Notícias Verificadas</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.totalNews || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Fake News Detectadas</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.fakeNewsCount || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trend Chart */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Tendência de Detecção</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="realNews" stroke="#22c55e" strokeWidth={2} name="Notícias Reais" />
              <Line type="monotone" dataKey="fakeNews" stroke="#ef4444" strokeWidth={2} name="Fake News" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Risk Distribution */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Distribuição de Risco</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={riskDistribution}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
              >
                {riskDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-4 space-y-2">
            {riskDistribution.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: item.color }} />
                  <span className="text-sm text-gray-600">{item.name}</span>
                </div>
                <span className="text-sm font-medium text-gray-900">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Analyses */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Análises Recentes</h3>
          <Activity className="h-5 w-5 text-gray-400" />
        </div>
        <div className="space-y-4">
          {recentAnalyses.length > 0 ? (
            recentAnalyses.map((analysis) => (
              <div key={analysis.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-gray-900 mb-1">
                    {analysis.texto ? (analysis.texto.length > 50 ? analysis.texto.substring(0, 50) + '...' : analysis.texto) : 'Análise de Notícia'}
                  </h4>
                  <p className="text-xs text-gray-500">
                    {analysis.created_at ? new Date(analysis.created_at).toLocaleString("pt-BR") : 'Data não disponível'}
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      {analysis.confiabilidade ? (parseFloat(analysis.confiabilidade) * 100).toFixed(0) : 'N/A'}%
                    </p>
                    <p className="text-xs text-gray-500">Confiabilidade</p>
                  </div>
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${(parseFloat(analysis.confiabilidade) || 0) < 0.4
                      ? "bg-red-100 text-red-800"
                      : (parseFloat(analysis.confiabilidade) || 0) < 0.7
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-green-100 text-green-800"
                      }`}
                  >
                    {(parseFloat(analysis.confiabilidade) || 0) < 0.4
                      ? "Alto Risco"
                      : (parseFloat(analysis.confiabilidade) || 0) < 0.7
                        ? "Médio Risco"
                        : "Baixo Risco"}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>Nenhuma análise recente encontrada</p>
              <p className="text-sm">As análises aparecerão aqui conforme você analisar notícias</p>
            </div>
          )}
        </div>
      </div>

      {/* Top Sources */}
      {stats?.topSources && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Fontes Mais Confiáveis (Automático)</h3>
          <div className="space-y-3">
            {stats.topSources.map((source, index) => (
              <div key={source.id} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-blue-600">{index + 1}</span>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">{source.name}</p>
                    <p className="text-xs text-gray-500 capitalize">{source.type}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {(source.calculatedCredibility * 100).toFixed(1)}%
                  </p>
                  <p className="text-xs text-gray-500">Credibilidade</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
