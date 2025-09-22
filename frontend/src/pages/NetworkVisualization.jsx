"use client"

import { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { Network, Zap, Globe, FileText, Award, ZoomIn, ZoomOut, MoreVertical } from "lucide-react"
import * as d3 from "d3"
import websocketService from "../services/websocket.js"
import toast from "react-hot-toast"

export default function NetworkVisualization() {
  const [sourcesGraphData, setSourcesGraphData] = useState({ nodes: [], links: [] })
  const [newsGraphData, setNewsGraphData] = useState({ nodes: [], links: [] })
  const [selectedNode, setSelectedNode] = useState(null)
  const [loading, setLoading] = useState(true)
  const [simulation, setSimulation] = useState(null)
  const [zoomLevel, setZoomLevel] = useState(1)
  const [activeGraph, setActiveGraph] = useState('sources') // 'sources' ou 'news'
  const svgRef = useRef()

  useEffect(() => {
    // Conectar WebSocket
    websocketService.connect();

    // Listener para dados iniciais
    const handleInitialData = (data) => {
      console.log('📊 Dados iniciais recebidos:', data);

      if (data.network) {
        setSourcesGraphData({
          nodes: data.network.sources?.nodes || [],
          links: data.network.sources?.connections || []
        });
        setNewsGraphData({
          nodes: data.network.news?.nodes || [],
          links: data.network.news?.connections || []
        });

        console.log('📊 Dados iniciais processados:', {
          sources: {
            nodes: data.network.sources?.nodes?.length || 0,
            connections: data.network.sources?.connections?.length || 0
          },
          news: {
            nodes: data.network.news?.nodes?.length || 0,
            connections: data.network.news?.connections?.length || 0
          }
        });
      }

      setLoading(false);
    };

    // Listener para atualizações
    const handleUpdate = (data) => {
      console.log('🔄 Atualização recebida:', data);

      // Atualizar dados dos grafos
      if (data.network) {
        setSourcesGraphData({
          nodes: data.network.sources?.nodes || [],
          links: data.network.sources?.connections || []
        });
        setNewsGraphData({
          nodes: data.network.news?.nodes || [],
          links: data.network.news?.connections || []
        });

        console.log('📊 Grafos atualizados:', {
          sources: {
            nodes: data.network.sources?.nodes?.length || 0,
            connections: data.network.sources?.connections?.length || 0
          },
          news: {
            nodes: data.network.news?.nodes?.length || 0,
            connections: data.network.news?.connections?.length || 0
          }
        });
      }
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

  useEffect(() => {
    const currentGraphData = activeGraph === 'sources' ? sourcesGraphData : newsGraphData;
    console.log(`🎯 Recriando visualização para grafo ${activeGraph}:`, {
      nodes: currentGraphData.nodes.length,
      links: currentGraphData.links.length
    });

    if (currentGraphData.nodes.length > 0) {
      // Parar simulação anterior se existir
      if (simulation) {
        simulation.stop();
      }

      createVisualization(currentGraphData);
    }
  }, [sourcesGraphData, newsGraphData, activeGraph]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      const currentGraphData = activeGraph === 'sources' ? sourcesGraphData : newsGraphData;
      if (currentGraphData.nodes.length > 0) {
        createVisualization(currentGraphData);
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [sourcesGraphData, newsGraphData, activeGraph])

  const handleZoomIn = () => {
    if (svgRef.current) {
      const svg = d3.select(svgRef.current)
      const g = svg.select("g")

      let currentScale = zoomLevel
      const currentTransform = g.attr("transform")
      if (currentTransform) {
        const scaleMatch = currentTransform.match(/scale\(([^)]+)\)/)
        if (scaleMatch) {
          currentScale = parseFloat(scaleMatch[1])
        }
      }

      const newScale = Math.min(currentScale + 0.1, 2.0)
      g.transition().duration(200).attr("transform", `translate(0,0) scale(${newScale})`)
      setZoomLevel(newScale)
    }
  }

  const handleZoomOut = () => {
    if (svgRef.current) {
      const svg = d3.select(svgRef.current)
      const g = svg.select("g")

      let currentScale = zoomLevel
      const currentTransform = g.attr("transform")
      if (currentTransform) {
        const scaleMatch = currentTransform.match(/scale\(([^)]+)\)/)
        if (scaleMatch) {
          currentScale = parseFloat(scaleMatch[1])
        }
      }

      const newScale = Math.max(currentScale - 0.1, 0.1)
      g.transition().duration(200).attr("transform", `translate(0,0) scale(${newScale})`)
      setZoomLevel(newScale)
    }
  }

  const handleResetZoom = () => {
    if (svgRef.current) {
      const svg = d3.select(svgRef.current)
      const g = svg.select("g")
      g.transition().duration(200).attr("transform", "translate(0,0) scale(1)")
      setZoomLevel(1)
    }
  }

  const createVisualization = (graphData) => {
    console.log('🎨 Criando visualização com dados:', {
      nodes: graphData.nodes.length,
      links: graphData.links.length
    });

    const svg = d3.select(svgRef.current)
    svg.selectAll("*").remove()

    const container = svgRef.current.parentElement
    const width = Math.min(container.clientWidth - 48, 1200)
    const height = 600
    const margin = { top: 10, right: 10, bottom: 10, left: 10 }

    svg.attr("width", "100%").attr("height", height)
    svg.attr("viewBox", `0 0 ${width} ${height}`)
    svg.attr("preserveAspectRatio", "xMidYMid meet")

    const g = svg.append("g")

    const zoom = d3.zoom()
      .scaleExtent([0.1, 2.0])
      .on("zoom", (event) => {
        g.attr("transform", event.transform)
        setZoomLevel(event.transform.k)
      })

    svg.call(zoom)

    // Create force simulation
    const simulation = d3.forceSimulation(graphData.nodes)
      .force("link", d3.forceLink(graphData.links).id(d => d.id).distance(100))
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius(30))

    setSimulation(simulation)

    // Create links
    const link = g.append("g")
      .selectAll("line")
      .data(graphData.links)
      .enter().append("line")
      .attr("stroke", d => {
        // Cor baseada no tipo de conexão e grafo ativo
        if (activeGraph === 'sources') {
          // Para fontes: azul para similaridade de credibilidade
          return "#3B82F6"; // Azul
        } else {
          // Para notícias: roxo para similaridade de conteúdo
          return "#8B5CF6"; // Roxo
        }
      })
      .attr("stroke-opacity", 0.7)
      .attr("stroke-width", d => Math.sqrt(d.weight || 1) * 3)
      .style("cursor", "pointer")
      .on("mouseover", function (event, d) {
        d3.select(this).attr("stroke-opacity", 1).attr("stroke-width", Math.sqrt(d.weight || 1) * 4);

        // Mostrar tooltip com informações da conexão
        const tooltip = d3.select("body").append("div")
          .attr("class", "tooltip")
          .style("position", "absolute")
          .style("background", "rgba(0,0,0,0.8)")
          .style("color", "white")
          .style("padding", "8px")
          .style("border-radius", "4px")
          .style("font-size", "12px")
          .style("pointer-events", "none")
          .style("z-index", "1000");

        tooltip.html(`
          <strong>${d.label}</strong><br/>
          Tipo: ${d.type === 'credibility_similarity' ? 'Similaridade de Credibilidade' : 'Similaridade de Conteúdo'}<br/>
          Peso: ${(d.weight * 100).toFixed(1)}%
        `)
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 10) + "px");
      })
      .on("mouseout", function (event, d) {
        d3.select(this).attr("stroke-opacity", 0.7).attr("stroke-width", Math.sqrt(d.weight || 1) * 3);
        d3.selectAll(".tooltip").remove();
      })

    // Create nodes
    const node = g.append("g")
      .selectAll("circle")
      .data(graphData.nodes)
      .enter().append("circle")
      .attr("r", d => {
        if (activeGraph === 'sources') {
          const credibility = d.credibility || d.peso || 0.5
          return Math.max(8, credibility * 20)
        } else {
          const confidence = d.confidence || 0.5
          return Math.max(8, confidence * 20)
        }
      })
      .attr("fill", d => getNodeColor(d))
      .attr("stroke", "#fff")
      .attr("stroke-width", 2)
      .style("cursor", "pointer")
      .on("click", (event, d) => {
        setSelectedNode(d)
        toast.success(`Selecionado: ${d.name}`)
      })
      .on("mouseover", function (event, d) {
        d3.select(this).attr("stroke-width", 4)
        d3.select(this).attr("r", d => {
          if (activeGraph === 'sources') {
            const credibility = d.credibility || d.peso || 0.5
            return Math.max(10, credibility * 22)
          } else {
            const confidence = d.confidence || 0.5
            return Math.max(10, confidence * 22)
          }
        })
      })
      .on("mouseout", function (event, d) {
        d3.select(this).attr("stroke-width", 2)
        d3.select(this).attr("r", d => {
          if (activeGraph === 'sources') {
            const credibility = d.credibility || d.peso || 0.5
            return Math.max(8, credibility * 20)
          } else {
            const confidence = d.confidence || 0.5
            return Math.max(8, confidence * 20)
          }
        })
      })

    // Add labels
    const label = g.append("g")
      .selectAll("text")
      .data(graphData.nodes)
      .enter().append("text")
      .text(d => d.name.length > 15 ? d.name.substring(0, 15) + "..." : d.name)
      .attr("font-size", "12px")
      .attr("text-anchor", "middle")
      .attr("dy", "0.35em")
      .attr("fill", "#333")
      .style("pointer-events", "none")

    // Update positions on tick
    simulation.on("tick", () => {
      link
        .attr("x1", d => d.source.x)
        .attr("y1", d => d.source.y)
        .attr("x2", d => d.target.x)
        .attr("y2", d => d.target.y)

      node
        .attr("cx", d => d.x)
        .attr("cy", d => d.y)

      label
        .attr("x", d => d.x)
        .attr("y", d => d.y)
    })

    // Drag behavior
    node.call(d3.drag()
      .on("start", dragstarted)
      .on("drag", dragged)
      .on("end", dragended))

    function dragstarted(event, d) {
      if (!event.active) simulation.alphaTarget(0.3).restart()
      d.fx = d.x
      d.fy = d.y
    }

    function dragged(event, d) {
      d.fx = event.x
      d.fy = event.y
    }

    function dragended(event, d) {
      if (!event.active) simulation.alphaTarget(0)
      d.fx = null
      d.fy = null
    }
  }

  const getNodeColor = (node) => {
    if (activeGraph === 'sources') {
      const credibility = node.credibility || node.peso || 0.5
      if (credibility >= 0.8) return "#10B981" // Verde (alta credibilidade)
      if (credibility >= 0.6) return "#3B82F6" // Azul (média credibilidade)
      if (credibility >= 0.4) return "#F59E0B" // Amarelo (baixa credibilidade)
      return "#EF4444" // Vermelho (muito baixa credibilidade)
    } else {
      // Para notícias, usar baseado em confiança
      const confidence = node.confidence || 0.5
      if (node.isFakeNews) {
        // Fake news - cores baseadas na confiança da detecção
        if (confidence >= 0.8) return "#EF4444" // Vermelho (fake news detectada com alta confiança)
        if (confidence >= 0.6) return "#F59E0B" // Amarelo (fake news detectada com média confiança)
        return "#DC2626" // Vermelho escuro (fake news detectada com baixa confiança)
      } else {
        // Notícia confiável - cores baseadas na confiança
        if (confidence >= 0.8) return "#10B981" // Verde (alta confiança)
        if (confidence >= 0.6) return "#3B82F6" // Azul (média confiança)
        return "#F59E0B" // Amarelo (baixa confiança)
      }
    }
  }

  const getTypeIcon = (node) => {
    if (activeGraph === 'sources') {
      return "🌐"
    } else {
      return node.isFakeNews ? "❌" : "✅"
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const currentGraphData = activeGraph === 'sources' ? sourcesGraphData : newsGraphData

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="px-4 sm:px-0">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">Rede de Confiança</h1>
        <p className="mt-1 sm:mt-2 text-sm sm:text-base lg:text-lg text-gray-600">Visualização interativa da rede de confiança entre fontes e notícias</p>
      </div>

      {/* Graph Type Selector */}
      <div className="bg-white p-3 sm:p-4 rounded-lg shadow">
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
          <button
            onClick={() => setActiveGraph('sources')}
            className={`flex items-center justify-center px-3 sm:px-4 py-2 rounded-lg font-medium transition-all text-sm sm:text-base ${activeGraph === 'sources'
              ? 'bg-blue-100 text-blue-700 border border-blue-200'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
          >
            <Globe className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
            Grafo de Fontes
          </button>
          <button
            onClick={() => setActiveGraph('news')}
            className={`flex items-center justify-center px-3 sm:px-4 py-2 rounded-lg font-medium transition-all text-sm sm:text-base ${activeGraph === 'news'
              ? 'bg-green-100 text-green-700 border border-green-200'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
          >
            <FileText className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
            Grafo de Notícias
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              {activeGraph === 'sources' ? <Globe className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" /> : <FileText className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />}
            </div>
            <div className="ml-3 sm:ml-4">
              <p className="text-xs sm:text-sm font-medium text-gray-500">
                {activeGraph === 'sources' ? 'Nós (Fontes)' : 'Nós (Notícias)'}
              </p>
              <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">
                {currentGraphData.nodes.length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Zap className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
            </div>
            <div className="ml-3 sm:ml-4">
              <p className="text-xs sm:text-sm font-medium text-gray-500">Conexões</p>
              <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">
                {currentGraphData.links.length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-lg shadow sm:col-span-2 lg:col-span-1">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Award className="h-6 w-6 sm:h-8 sm:w-8 text-purple-600" />
            </div>
            <div className="ml-3 sm:ml-4">
              <p className="text-xs sm:text-sm font-medium text-gray-500">
                {activeGraph === 'sources' ? 'Credibilidade Média' : 'Credibilidade Média'}
              </p>
              <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">
                {(() => {
                  if (currentGraphData.nodes.length === 0) return "0%";
                  const validNodes = currentGraphData.nodes.filter(node => {
                    const credibility = activeGraph === 'sources' ? (node.credibility || node.peso) : (node.confidence);
                    return credibility !== null && credibility !== undefined && !isNaN(credibility);
                  });

                  if (validNodes.length === 0) return "0%";

                  const avg = validNodes.reduce((acc, node) => {
                    const credibility = activeGraph === 'sources' ? (node.credibility || node.peso || 0.5) : (node.confidence || 0.5);
                    return acc + credibility;
                  }, 0) / validNodes.length;

                  return `${(avg * 100).toFixed(1)}%`;
                })()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Network Graph */}
        <div className="lg:col-span-2 bg-white p-4 sm:p-6 rounded-lg shadow">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2 sm:gap-0">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900">
              {activeGraph === 'sources' ? 'Grafo da Rede de Fontes' : 'Grafo da Rede de Notícias'}
            </h3>

            <div className="flex items-center space-x-1 sm:space-x-2">
              <button
                onClick={handleZoomIn}
                className="p-1 sm:p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                title="Zoom In"
              >
                <ZoomIn className="h-3 w-3 sm:h-4 sm:w-4" />
              </button>
              <span className="text-xs sm:text-sm text-gray-500 font-medium">
                {Math.round(zoomLevel * 100)}%
              </span>
              <button
                onClick={handleZoomOut}
                className="p-1 sm:p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                title="Zoom Out"
              >
                <ZoomOut className="h-3 w-3 sm:h-4 sm:w-4" />
              </button>
              <button
                onClick={handleResetZoom}
                className="p-1 sm:p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                title="Reset Zoom"
              >
                <MoreVertical className="h-3 w-3 sm:h-4 sm:w-4" />
              </button>
            </div>
          </div>

          {/* Legend */}
          <div className="mb-3 sm:mb-4 flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm">
            <div className="flex items-center space-x-1 sm:space-x-2">
              <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-green-500"></div>
              <span>Alta Credibilidade</span>
            </div>
            <div className="flex items-center space-x-1 sm:space-x-2">
              <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-blue-500"></div>
              <span>Média</span>
            </div>
            <div className="flex items-center space-x-1 sm:space-x-2">
              <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-yellow-500"></div>
              <span>Baixa</span>
            </div>
            <div className="flex items-center space-x-1 sm:space-x-2">
              <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-red-500"></div>
              <span>Muito Baixa</span>
            </div>
          </div>

          {/* Legenda das Conexões */}
          <div className="mb-3 sm:mb-4 p-2 sm:p-3 bg-gray-50 rounded-lg">
            <h4 className="text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">Conexões por Similaridade:</h4>
            <div className="flex flex-wrap gap-2 sm:gap-4 text-xs">
              {activeGraph === 'sources' ? (
                <div className="flex items-center space-x-1 sm:space-x-2">
                  <div className="w-3 h-0.5 sm:w-4 sm:h-0.5 bg-blue-500"></div>
                  <span className="text-gray-600">Similaridade de Credibilidade</span>
                </div>
              ) : (
                <div className="flex items-center space-x-1 sm:space-x-2">
                  <div className="w-3 h-0.5 sm:w-4 sm:h-0.5 bg-purple-500"></div>
                  <span className="text-gray-600">Similaridade de Conteúdo</span>
                </div>
              )}
            </div>
          </div>

          {/* SVG Container */}
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <svg ref={svgRef} className="w-full h-[400px] sm:h-[500px] lg:h-[600px] bg-gray-50"></svg>
          </div>

          <div className="mt-3 sm:mt-4 text-xs sm:text-sm text-gray-600">
            <p>
              <strong>Instruções:</strong> Use a roda do mouse para zoom in/out. Clique e arraste para mover o grafo.
              Clique e arraste os nós para reorganizar. Clique em um nó para ver detalhes.
              O tamanho dos nós representa a credibilidade.
            </p>
          </div>
        </div>

        {/* Node Details */}
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">
            {activeGraph === 'sources' ? 'Detalhes da Fonte' : 'Detalhes da Notícia'}
          </h3>

          {selectedNode ? (
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-center space-x-2 sm:space-x-3">
                <div
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-white font-semibold text-sm sm:text-base"
                  style={{ backgroundColor: getNodeColor(selectedNode) }}
                >
                  {selectedNode.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="font-medium text-gray-900 text-sm sm:text-base truncate">{selectedNode.name}</h4>
                  <p className="text-xs sm:text-sm text-gray-500 flex items-center">
                    <span className="mr-1">{getTypeIcon(selectedNode)}</span>
                    {activeGraph === 'sources' ? selectedNode.type : (selectedNode.isFakeNews ? 'Fake news' : 'Notícia Confiável')}
                  </p>
                </div>
              </div>

              <div className="space-y-2 sm:space-y-3">
                {activeGraph === 'sources' ? (
                  <>
                    <div className="flex justify-between">
                      <span className="text-xs sm:text-sm text-gray-600">Credibilidade:</span>
                      <span className="text-xs sm:text-sm font-medium">
                        {((selectedNode.credibility || selectedNode.peso || 0.5) * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs sm:text-sm text-gray-600">Site:</span>
                      <span className="text-xs sm:text-sm font-medium text-blue-600 truncate ml-2">
                        {selectedNode.site || 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs sm:text-sm text-gray-600">Conexões:</span>
                      <span className="text-xs sm:text-sm font-medium">
                        {currentGraphData.links.filter(
                          (link) => link.source.id === selectedNode.id || link.target.id === selectedNode.id,
                        ).length}
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex justify-between">
                      <span className="text-xs sm:text-sm text-gray-600">Credibilidade:</span>
                      <span className="text-xs sm:text-sm font-medium">
                        {((selectedNode.confidence || 0.5) * 100).toFixed(1)}%
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-xs sm:text-sm text-gray-600">Nível de Risco:</span>
                      <span className="text-xs sm:text-sm font-medium">
                        {selectedNode.riskLevel ? selectedNode.riskLevel.charAt(0).toUpperCase() + selectedNode.riskLevel.slice(1).toLowerCase() : 'N/A'}
                      </span>
                    </div>
                    {selectedNode.content && (
                      <div className="mt-3 sm:mt-4 p-2 sm:p-3 bg-gray-50 rounded-lg">
                        <span className="text-xs sm:text-sm text-gray-600">Conteúdo:</span>
                        <p className="text-xs sm:text-sm text-gray-800 mt-1">
                          {selectedNode.content.length > 150
                            ? selectedNode.content.substring(0, 150) + '...'
                            : selectedNode.content}
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-6 sm:py-8 text-gray-500">
              <Network className="h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-3 sm:mb-4 opacity-50" />
              <p className="text-xs sm:text-sm">Clique em um nó no grafo para ver os detalhes</p>
            </div>
          )}
        </div>
      </div>

      {/* Network Analysis */}
      <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Análise da Rede</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          <div className="text-center">
            <div className="text-xl sm:text-2xl font-bold text-green-600">
              {currentGraphData.nodes.filter((n) => {
                if (activeGraph === 'sources') {
                  const credibility = n.credibility || n.peso || 0.5;
                  return credibility >= 0.6;
                } else {
                  return !n.isFakeNews;
                }
              }).length}
            </div>
            <div className="text-xs sm:text-sm text-gray-600">
              {activeGraph === 'sources' ? 'Fontes Confiáveis' : 'Notícias Confiáveis'}
            </div>
          </div>

          <div className="text-center">
            <div className="text-xl sm:text-2xl font-bold text-red-600">
              {currentGraphData.nodes.filter((n) => {
                if (activeGraph === 'sources') {
                  const credibility = n.credibility || n.peso || 0.5;
                  return credibility < 0.6;
                } else {
                  return n.isFakeNews;
                }
              }).length}
            </div>
            <div className="text-xs sm:text-sm text-gray-600">
              {activeGraph === 'sources' ? 'Fontes Não Confiáveis' : 'Fake news Detectadas'}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

