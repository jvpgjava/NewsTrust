"use client"

import { useState, useEffect } from "react"
import { TrendingUp, TrendingDown, Users, Network, CheckCircle, XCircle, Activity } from "lucide-react"
import pollingService from "../services/polling.js"
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
    // Conectar Polling
    pollingService.connect();

    // Timeout para parar loading se não receber dados
    const loadingTimeout = setTimeout(() => {
      console.log('⏰ Timeout: Parando loading sem dados');
      setLoading(false);
    }, 5000); // 5 segundos

    // Listener para dados iniciais
    const handleInitialData = (data) => {
      console.log('📊 Dashboard - Dados iniciais recebidos:', data);
      console.log('📊 Dashboard - sourcesCount:', data.dashboard?.sourcesCount);
      console.log('📊 Dashboard - newsCount:', data.dashboard?.newsCount);
      console.log('📊 Dashboard - recentAnalyses:', data.recentAnalyses?.length);
      console.log('📊 Dashboard - data.dashboard completo:', data.dashboard);
      
      clearTimeout(loadingTimeout); // Cancelar timeout
      
      const newStats = {
        sourcesCount: data.dashboard?.sourcesCount || 0,
        connectionsCount: data.dashboard?.connectionsCount || 0,
        newsCount: data.dashboard?.newsCount || 0,
        fakeNewsCount: data.dashboard?.fakeNewsCount || 0,
        averageCredibility: data.dashboard?.averageCredibility || 0,
        trendData: data.dashboard?.trendData || [],
        riskDistribution: data.dashboard?.riskDistribution || { low: 0, medium: 0, high: 0 }
      };
      
      console.log('📊 Dashboard - Stats que serão definidos:', newStats);
      setStats(newStats);
      setRecentAnalyses(data.recentAnalyses || []);
      setLoading(false);
    };

    // Listener para atualizações
    const handleUpdate = (data) => {
      setStats({
        sourcesCount: data.dashboard?.sourcesCount || 0,
        connectionsCount: data.dashboard?.connectionsCount || 0,
        newsCount: data.dashboard?.newsCount || 0,
        fakeNewsCount: data.dashboard?.fakeNewsCount || 0,
        trendData: data.dashboard?.trendData || [],
        riskDistribution: data.dashboard?.riskDistribution || { low: 0, medium: 0, high: 0 }
      });
      setRecentAnalyses(data.recentAnalyses || []);
    };

    // Adicionar listeners
    pollingService.addListener('initial_data', handleInitialData);
    pollingService.addListener('update', handleUpdate);

    // Cleanup
    return () => {
      clearTimeout(loadingTimeout);
      pollingService.removeListener('initial_data', handleInitialData);
      pollingService.removeListener('update', handleUpdate);
    };
  }, []);

  // Chart data from stats (only real data)
  const trendData = stats?.trendData || []

  // Converter riskDistribution de objeto para array
  const riskDistribution = stats?.riskDistribution ? [
    { name: 'Baixo Risco', value: stats.riskDistribution.low || 0, color: '#10B981' },
    { name: 'Médio Risco', value: stats.riskDistribution.medium || 0, color: '#F59E0B' },
    { name: 'Alto Risco', value: stats.riskDistribution.high || 0, color: '#EF4444' }
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
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 sm:mt-2 text-sm sm:text-base lg:text-lg text-gray-600">Visão geral das notícias verificadas</p>
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
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Tendência de Detecção</h3>
          <div className="w-full h-[350px] flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 30, right: 40, left: 30, bottom: 30 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="month" 
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => {
                    const [year, month] = value.split('-');
                    return `${month}/${year.slice(2)}`;
                  }}
                  axisLine={{ stroke: '#e0e0e0' }}
                  tickLine={{ stroke: '#e0e0e0' }}
                />
                <YAxis 
                  domain={[0, 25]}
                  tick={{ fontSize: 12 }}
                  axisLine={{ stroke: '#e0e0e0' }}
                  tickLine={{ stroke: '#e0e0e0' }}
                  tickCount={6}
                />
                <Tooltip 
                  labelFormatter={(value) => {
                    const [year, month] = value.split('-');
                    return `Mês: ${month}/${year}`;
                  }}
                  formatter={(value) => [`${value} análises`, 'Total']}
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="count" 
                  stroke="#3B82F6" 
                  strokeWidth={3} 
                  name="Análises"
                  dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: '#3B82F6', strokeWidth: 2, fill: 'white' }}
                  connectNulls={false}
                />
            </LineChart>
          </ResponsiveContainer>
          </div>
          
          {/* Legenda do Gráfico de Detecção */}
          <div className="mt-3 sm:mt-4 space-y-1 sm:space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-0.5 bg-blue-500 mr-3 flex-shrink-0"></div>
                <span className="text-xs sm:text-sm text-gray-600">Tendência de Análises</span>
              </div>
              <span className="text-xs sm:text-sm font-medium text-gray-900">Linha Principal</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-blue-500 mr-3 flex-shrink-0"></div>
                <span className="text-xs sm:text-sm text-gray-600">Pontos de Dados</span>
              </div>
              <span className="text-xs sm:text-sm font-medium text-gray-900">Valores Mensais</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 border-2 border-blue-500 rounded-full mr-3 flex-shrink-0"></div>
                <span className="text-xs sm:text-sm text-gray-600">Hover Interativo</span>
              </div>
              <span className="text-xs sm:text-sm font-medium text-gray-900">Detalhes</span>
            </div>
          </div>
        </div>

        {/* Risk Distribution */}
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Distribuição de Risco</h3>
          <div className="w-full h-[350px] flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
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
          </div>
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
