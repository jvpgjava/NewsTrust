"use client"

import { useState, useEffect, useRef } from "react"
import { Network, Zap } from "lucide-react"
import * as d3 from "d3"
import { api } from "../services/api"
import toast from "react-hot-toast"

export default function NetworkVisualization() {
  const [graphData, setGraphData] = useState({ nodes: [], links: [] })
  const [selectedNode, setSelectedNode] = useState(null)
  const [loading, setLoading] = useState(true)
  const [simulation, setSimulation] = useState(null)
  const [zoomLevel, setZoomLevel] = useState(1)
  const svgRef = useRef()

  useEffect(() => {
    loadGraphData()
  }, [])

  useEffect(() => {
    if (graphData.nodes.length > 0) {
      createVisualization()
    }
  }, [graphData])

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (graphData.nodes.length > 0) {
        createVisualization()
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [graphData])

  const loadGraphData = async () => {
    try {
      const response = await api.get("/api/graph")
      const graphData = response.data
      setGraphData({
        nodes: graphData.nodes || [],
        links: graphData.edges || []
      })
    } catch (error) {
      console.error("Error loading graph data:", error)
      toast.error("Erro ao carregar dados do grafo")
      setGraphData({ nodes: [], links: [] })
    } finally {
      setLoading(false)
    }
  }

  const handleZoomIn = () => {
    if (svgRef.current && graphData.nodes.length > 0) {
      const svg = d3.select(svgRef.current)
      const g = svg.select("g")

      // Obter escala atual do estado ou do DOM
      let currentScale = zoomLevel
      const currentTransform = g.attr("transform")
      if (currentTransform) {
        const scaleMatch = currentTransform.match(/scale\(([^)]+)\)/)
        if (scaleMatch) {
          currentScale = parseFloat(scaleMatch[1])
        }
      }

      const newScale = Math.min(currentScale + 0.01, 1.5) // +1% até 150%

      // Aplicar nova escala diretamente
      g.transition().duration(200).attr("transform", `translate(0,0) scale(${newScale})`)
      setZoomLevel(newScale)

      console.log(`🔍 Zoom In: ${Math.round(currentScale * 100)}% → ${Math.round(newScale * 100)}%`)
    }
  }

  const handleZoomOut = () => {
    if (svgRef.current && graphData.nodes.length > 0) {
      const svg = d3.select(svgRef.current)
      const g = svg.select("g")

      // Obter escala atual do estado ou do DOM
      let currentScale = zoomLevel
      const currentTransform = g.attr("transform")
      if (currentTransform) {
        const scaleMatch = currentTransform.match(/scale\(([^)]+)\)/)
        if (scaleMatch) {
          currentScale = parseFloat(scaleMatch[1])
        }
      }

      const newScale = Math.max(currentScale - 0.01, 0.01) // -1% até 1%

      // Aplicar nova escala diretamente
      g.transition().duration(200).attr("transform", `translate(0,0) scale(${newScale})`)
      setZoomLevel(newScale)

      console.log(`🔍 Zoom Out: ${Math.round(currentScale * 100)}% → ${Math.round(newScale * 100)}%`)
    }
  }

  const handleResetZoom = () => {
    if (svgRef.current && graphData.nodes.length > 0) {
      const svg = d3.select(svgRef.current)
      const g = svg.select("g")

      // Resetar zoom
      g.transition().duration(200).attr("transform", "translate(0,0) scale(1)")
      setZoomLevel(1)

      console.log('🔄 Zoom resetado para 100%')
    }
  }

  const createVisualization = () => {
    const svg = d3.select(svgRef.current)
    svg.selectAll("*").remove()

    // Get container dimensions
    const container = svgRef.current.parentElement
    const width = Math.min(container.clientWidth - 48, 1200)
    const height = 600
    const margin = { top: 10, right: 10, bottom: 10, left: 10 }

    // Set SVG dimensions to be responsive
    svg.attr("width", "100%").attr("height", height)
    svg.attr("viewBox", `0 0 ${width} ${height}`)
    svg.attr("preserveAspectRatio", "xMidYMid meet")

    // Add zoom behavior
    const zoom = d3.zoom()
      .scaleExtent([0.01, 1.5])
      .on("zoom", (event) => {
        g.attr("transform", event.transform)
        setZoomLevel(event.transform.k)
      })
      .on("end", () => {
        // Garantir que o estado seja atualizado após o zoom do mouse
        const currentTransform = g.attr("transform")
        if (currentTransform) {
          const scaleMatch = currentTransform.match(/scale\(([^)]+)\)/)
          if (scaleMatch) {
            setZoomLevel(parseFloat(scaleMatch[1]))
          }
        }
      })

    svg.call(zoom)

    const g = svg.append("g").attr("transform", `translate(0,0)`)

      // Initialize nodes with random positions spread across entire screen
      ; (graphData.nodes || []).forEach((d, i) => {
        // Distribute nodes randomly across the entire screen with margins
        d.x = Math.random() * (width - 80) + 40
        d.y = Math.random() * (height - 80) + 40
        // Add some velocity for initial movement
        d.vx = (Math.random() - 0.5) * 4
        d.vy = (Math.random() - 0.5) * 4
      })

    // Create optimized simulation with performance improvements
    const sim = d3
      .forceSimulation(graphData.nodes || [])
      .alphaDecay(0.05) // Faster cooling for better performance
      .velocityDecay(0.7) // Higher friction to stabilize faster
      .force(
        "link",
        d3
          .forceLink(graphData.links || [])
          .id((d) => d.id || d.from || d.to)
          .distance((d) => 400 + (1 - (d.weight || 0.5)) * 500) // Much longer distances
          .strength(0.03) // Very weak link strength
      )
      .force("charge", d3.forceManyBody()
        .strength(-4000) // Very strong repulsion
        .distanceMax(600) // Limit calculation distance for performance
      )
      .force("center", d3.forceCenter(width / 2, height / 2).strength(0.001)) // Almost no centering
      .force(
        "collision",
        d3.forceCollide()
          .radius((d) => 20 + (d.peso || 0.5) * 10)
          .strength(0.9) // Strong collision force
      )
      // Very weak boundary forces
      .force("x", d3.forceX(width / 2).strength(0.001))
      .force("y", d3.forceY(height / 2).strength(0.001))

    setSimulation(sim)

    // Auto-stop simulation after 10 seconds to prevent infinite calculations
    setTimeout(() => {
      if (sim) {
        sim.stop()
        console.log('🛑 Simulação parada automaticamente para otimização')
      }
    }, 10000)

    // Skip heavy visual effects for better performance

    // Create simplified links for better performance
    const link = g
      .append("g")
      .selectAll("line")
      .data(graphData.links || [])
      .enter()
      .append("line")
      .attr("stroke", (d) => ((d.weight || 0.5) > 0.7 ? "#22c55e" : (d.weight || 0.5) > 0.5 ? "#3b82f6" : "#f59e0b"))
      .attr("stroke-opacity", 0.6)
      .attr("stroke-width", (d) => 1 + (d.weight || 0.5) * 3) // Thinner lines for performance

    // Create nodes with enhanced visual feedback
    const node = g
      .append("g")
      .selectAll("circle")
      .data(graphData.nodes || [])
      .enter()
      .append("circle")
      .attr("r", (d) => 2 + (d.peso || 0.5) * 4) // Smaller nodes for better spacing
      .attr("fill", (d) => getNodeColor(d))
      .attr("stroke", "#fff")
      .attr("stroke-width", 1) // Thinner stroke for performance
      .style("cursor", "pointer")
      .call(d3.drag().on("start", dragstarted).on("drag", dragged).on("end", dragended))
      .on("click", (event, d) => {
        setSelectedNode(d)
        // Add pulse animation on click
        d3.select(event.target)
          .transition()
          .duration(200)
          .attr("r", (d) => 4 + d.peso * 8)
          .transition()
          .duration(200)
          .attr("r", (d) => 2 + d.peso * 4)
      })
      .on("mouseover", (event, d) => {
        // Highlight connected nodes
        link.style("opacity", (l) => (l.source.id === d.id || l.target.id === d.id ? 1 : 0.2))
        node.style("opacity", (n) => {
          const connected = (graphData.links || []).some(
            (l) => (l.source.id === d.id && l.target.id === n.id) || (l.target.id === d.id && l.source.id === n.id),
          )
          return n.id === d.id || connected ? 1 : 0.3
        })
      })
      .on("mouseout", () => {
        // Reset highlighting
        link.style("opacity", 0.8)
        node.style("opacity", 1)
      })

    // Add labels
    const label = g
      .append("g")
      .selectAll("text")
      .data(graphData.nodes || [])
      .enter()
      .append("text")
      .text((d) => ((d.name || d.nome || '').length > 12 ? (d.name || d.nome || '').substring(0, 12) + "..." : (d.name || d.nome || '')))
      .attr("font-size", "9px")
      .attr("dx", 25)
      .attr("dy", 4)
      .style("pointer-events", "none")

    // Optimized tick with throttling for better performance
    let tickCount = 0
    sim.on("tick", () => {
      tickCount++
      // Update only every 2nd tick for better performance
      if (tickCount % 2 === 0) {
        link
          .attr("x1", (d) => d.source.x)
          .attr("y1", (d) => d.source.y)
          .attr("x2", (d) => d.target.x)
          .attr("y2", (d) => d.target.y)

        node.attr("cx", (d) => d.x).attr("cy", (d) => d.y)
        label.attr("x", (d) => d.x).attr("y", (d) => d.y)
      }
    })

    function dragstarted(event, d) {
      if (!event.active) sim.alphaTarget(0.3).restart()
      d.fx = d.x
      d.fy = d.y
    }

    function dragged(event, d) {
      d.fx = event.x
      d.fy = event.y
    }

    function dragended(event, d) {
      if (!event.active) sim.alphaTarget(0)
      d.fx = null
      d.fy = null
    }
  }

  const getNodeColor = (node) => {
    const credibility = node.peso || node.credibility || 0.5
    if (credibility > 0.8) return "#22c55e" // High credibility - green
    if (credibility > 0.6) return "#3b82f6" // Medium credibility - blue
    if (credibility > 0.4) return "#f59e0b" // Low credibility - yellow
    return "#ef4444" // Very low credibility - red
  }

  const getTypeIcon = (type) => {
    switch (type) {
      case "newspaper":
        return "📰"
      case "website":
        return "🌐"
      case "journalist":
        return "👤"
      case "social_media":
        return "📱"
      default:
        return "📄"
    }
  }



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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Rede de Confiança</h1>
          <p className="mt-2 text-gray-600">Visualização interativa da rede de fontes e suas relações</p>
        </div>
      </div>

      {/* Network Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <Network className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Nós (Fontes)</p>
              <p className="text-2xl font-bold text-gray-900">{graphData.nodes.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <Zap className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Conexões</p>
              <p className="text-2xl font-bold text-gray-900">{graphData.links.length}</p>
            </div>
          </div>
        </div>



        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-green-600 font-semibold text-sm">A</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Credibilidade Média</p>
              <p className="text-2xl font-bold text-gray-900">
                {graphData.nodes.length > 0
                  ? (
                    (graphData.nodes.reduce((sum, node) => sum + node.peso, 0) / graphData.nodes.length) *
                    100
                  ).toFixed(0)
                  : 0}
                %
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Network Visualization */}
        <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow relative">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center space-x-4">
              <h3 className="text-lg font-semibold text-gray-900">Grafo da Rede</h3>

              {/* Zoom Controls - Next to title */}
              <div className="flex items-center space-x-1 bg-gray-50 border border-gray-200 rounded-lg p-1">
                <button
                  onClick={handleZoomIn}
                  className="p-1 text-gray-600 hover:text-gray-900 hover:bg-white rounded transition-colors"
                  title="Zoom In (+1%)"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
                <span className="px-2 text-xs text-gray-700 font-medium min-w-[35px] text-center">
                  {Math.round(zoomLevel * 100)}%
                </span>
                <button
                  onClick={handleZoomOut}
                  className="p-1 text-gray-600 hover:text-gray-900 hover:bg-white rounded transition-colors"
                  title="Zoom Out (-1%)"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                  </svg>
                </button>
                <button
                  onClick={handleResetZoom}
                  className="p-1 text-gray-600 hover:text-gray-900 hover:bg-white rounded transition-colors"
                  title="Reset Zoom"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="flex items-center space-x-4 text-sm">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                <span>Alta Credibilidade</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                <span>Média</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                <span>Baixa</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                <span>Muito Baixa</span>
              </div>
            </div>
          </div>



          <div className="bg-gray-50 rounded-lg p-4 overflow-hidden w-full flex justify-center">
            <svg ref={svgRef} className="w-full h-[600px] max-w-5xl"></svg>
          </div>

          <div className="mt-4 text-sm text-gray-600">
            <p>
              <strong>Instruções:</strong> Use a roda do mouse para zoom in/out. Clique e arraste para mover o grafo.
              Clique e arraste os nós para reorganizar. Clique em um nó para ver detalhes.
              O tamanho dos nós representa a credibilidade, e a espessura das linhas representa o peso da confiança.
            </p>
          </div>
        </div>

        {/* Node Details */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Detalhes da Fonte</h3>

          {selectedNode ? (
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold"
                  style={{ backgroundColor: getNodeColor(selectedNode) }}
                >
                  {selectedNode.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">{selectedNode.name}</h4>
                  <p className="text-sm text-gray-500 flex items-center">
                    <span className="mr-1">{getTypeIcon(selectedNode.type)}</span>
                    {selectedNode.type}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Credibilidade:</span>
                  <span className="text-sm font-medium">{((selectedNode.peso || selectedNode.credibility || 0.5) * 100).toFixed(1)}%</span>
                </div>



                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Conexões:</span>
                  <span className="text-sm font-medium">
                    {
                      graphData.links.filter(
                        (link) => link.source.id === selectedNode.id || link.target.id === selectedNode.id,
                      ).length
                    }
                  </span>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <h5 className="text-sm font-medium text-gray-900 mb-2">Conexões Diretas</h5>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {graphData.links
                    .filter((link) => link.source.id === selectedNode.id || link.target.id === selectedNode.id)
                    .map((link, index) => {
                      const connectedNode =
                        link.source.id === selectedNode.id
                          ? graphData.nodes.find((n) => n.id === link.target.id)
                          : graphData.nodes.find((n) => n.id === link.source.id)
                      return (
                        <div key={index} className="flex items-center justify-between text-sm">
                          <span className="text-gray-600 truncate">{connectedNode?.name}</span>
                          <span className="text-gray-900 font-medium">{(link.weight * 100).toFixed(0)}%</span>
                        </div>
                      )
                    })}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Network className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Clique em um nó no grafo para ver os detalhes</p>
            </div>
          )}
        </div>
      </div>

      {/* Network Analysis */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Análise da Rede</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {graphData.nodes.filter((n) => (n.peso || n.credibility || 0.5) > 0.8).length}
            </div>
            <div className="text-sm text-gray-600">Fontes Altamente Confiáveis</div>
          </div>

          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {graphData.nodes.filter((n) => (n.peso || n.credibility || 0.5) < 0.4).length}
            </div>
            <div className="text-sm text-gray-600">Fontes de Baixa Confiança</div>
          </div>

          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {graphData.links.filter((l) => l.weight > 0.7).length}
            </div>
            <div className="text-sm text-gray-600">Conexões Fortes</div>
          </div>
        </div>
      </div>
    </div>
  )
}
