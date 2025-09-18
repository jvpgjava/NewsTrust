"use client"

import { useState, useEffect } from "react"
import { TrendingUp, TrendingDown, Users, Network, CheckCircle, XCircle, Activity } from "lucide-react"
import websocketService from "../services/websocket.js"
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
    // Conectar WebSocket
    websocketService.connect();

    // Listener para dados iniciais
    const handleInitialData = (data) => {
      console.log('📊 Dashboard - Dados iniciais recebidos:', data);
      setStats({
        sourcesCount: data.dashboard.sourcesCount,
        connectionsCount: data.dashboard.connectionsCount,
        newsCount: data.dashboard.newsCount,
        fakeNewsCount: data.dashboard.fakeNewsCount,
        trendData: data.dashboard.trendData,
        riskDistribution: data.dashboard.riskDistribution
      });
      setRecentAnalyses(data.recentAnalyses || []);
      setLoading(false);
    };

    // Listener para atualizações
    const handleUpdate = (data) => {
      setStats({
        sourcesCount: data.dashboard.sourcesCount,
        connectionsCount: data.dashboard.connectionsCount,
        newsCount: data.dashboard.newsCount,
        fakeNewsCount: data.dashboard.fakeNewsCount,
        trendData: data.dashboard.trendData,
        riskDistribution: data.dashboard.riskDistribution
      });
      setRecentAnalyses(data.recentAnalyses || []);
    };

    // Adicionar listeners
    websocketService.addListener('initial_data', handleInitialData);
    websocketService.addListener('update', handleUpdate);

    // Cleanup
    return () => {
      websocketService.removeListener('initial_data', handleInitialData);
      websocketService.removeListener('update', handleUpdate);
      // Não desconectar o WebSocket aqui, apenas remover os listeners
    };
  }, []);

  // Chart data from stats (only real data)
  const trendData = stats?.trendData || []

  // Converter riskDistribution de objeto para array
  const riskDistribution = stats?.riskDistribution ? [
    { name: 'Baixo Risco', value: stats.riskDistribution.baixo || 0, color: '#10B981' },
    { name: 'Médio Risco', value: stats.riskDistribution.medio || 0, color: '#F59E0B' },
    { name: 'Alto Risco', value: stats.riskDistribution.alto || 0, color: '#EF4444' }
  ] : [
    { name: 'Baixo Risco', value: 0, color: '#10B981' },
    { name: 'Médio Risco', value: 0, color: '#F59E0B' },
    { name: 'Alto Risco', value: 0, color: '#EF4444' }
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="px-4 sm:px-0">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 sm:mt-2 text-sm sm:text-base text-gray-600">Visão geral das notícias verificadas</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Users className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
            </div>
            <div className="ml-3 sm:ml-4">
              <p className="text-xs sm:text-sm font-medium text-gray-500">Fontes Analisadas</p>
              <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">{stats?.sourcesCount || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Network className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
            </div>
            <div className="ml-3 sm:ml-4">
              <p className="text-xs sm:text-sm font-medium text-gray-500">Conexões de Confiança</p>
              <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">{stats?.connectionsCount || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CheckCircle className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
            </div>
            <div className="ml-3 sm:ml-4">
              <p className="text-xs sm:text-sm font-medium text-gray-500">Notícias Verificadas</p>
              <p className="text-lg sm:text-xl lg:text-2xl font-bold text-green-600">{stats?.newsCount || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <XCircle className="h-6 w-6 sm:h-8 sm:w-8 text-red-600" />
            </div>
            <div className="ml-3 sm:ml-4">
              <p className="text-xs sm:text-sm font-medium text-gray-500">Fake News Detectadas</p>
              <p className="text-lg sm:text-xl lg:text-2xl font-bold text-red-600">{stats?.fakeNewsCount || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Trend Chart */}
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Tendência de Detecção</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#3B82F6" strokeWidth={2} name="Análises" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Risk Distribution */}
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Distribuição de Risco</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={riskDistribution}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
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
          <div className="mt-3 sm:mt-4 space-y-1 sm:space-y-2">
            {riskDistribution.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full mr-2" style={{ backgroundColor: item.color }} />
                  <span className="text-xs sm:text-sm text-gray-600">{item.name}</span>
                </div>
                <span className="text-xs sm:text-sm font-medium text-gray-900">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Analyses */}
      <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900">Análises Recentes</h3>
          <Activity className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
        </div>
        <div className="space-y-3 sm:space-y-4">
          {recentAnalyses.length > 0 ? (
            recentAnalyses.map((analysis) => (
              <div key={analysis.id} className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-lg">
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs sm:text-sm font-medium text-gray-900 mb-1 truncate">
                    {analysis.title ? (analysis.title.length > 40 ? analysis.title.substring(0, 40) + '...' : analysis.title) : 'Análise de Notícia'}
                  </h4>
                  <p className="text-xs text-gray-500">
                    {analysis.created_at ? new Date(analysis.created_at).toLocaleString("pt-BR") : 'Data não disponível'}
                  </p>
                </div>
                <div className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0">
                  <div className="text-right">
                    <p className="text-xs sm:text-sm font-medium text-gray-900">
                      {analysis.credibility && !isNaN(parseFloat(analysis.credibility)) ? (parseFloat(analysis.credibility) * 100).toFixed(0) : 'N/A'}%
                    </p>
                    <p className="text-xs text-gray-500">Confiabilidade</p>
                  </div>
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${(!analysis.credibility || isNaN(parseFloat(analysis.credibility)) || parseFloat(analysis.credibility) < 0.6)
                      ? "bg-red-100 text-red-800"
                      : "bg-green-100 text-green-800"
                      }`}
                  >
                    {(!analysis.credibility || isNaN(parseFloat(analysis.credibility)) || parseFloat(analysis.credibility) < 0.6)
                      ? "Não Confiável"
                      : "Confiável"}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-6 sm:py-8 text-gray-500">
              <p className="text-sm sm:text-base">Nenhuma análise recente encontrada</p>
              <p className="text-xs sm:text-sm">As análises aparecerão aqui conforme você analisar notícias</p>
            </div>
          )}
        </div>
      </div>

    </div>
  )
}
