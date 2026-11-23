import React, { useState, useEffect, useRef } from 'react'
import { useOutletContext, useSearchParams } from 'react-router-dom'
import cytoscape, { Core, EventObject } from 'cytoscape'
import {
  Network,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  RotateCcw,
  Search,
  Filter,
  Info,
  Layers,
  Sparkles,
  Shield,
  HelpCircle,
  Eye,
  FileText,
  X,
  Share2,
  Compass,
} from 'lucide-react'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { graphService } from '../services/graphService'
import { DEMO_GRAPH_DATA, DEMO_GRAPH_ANALYSIS, DEMO_CASES } from '../data/demoData'
import { GraphData, GraphAnalysis, GraphNode, GraphEdge, Case, EntityType } from '../types'
import { ENTITY_COLORS } from '../lib/utils'

export const LinkAnalysisPage: React.FC = () => {
  const [searchParams] = useSearchParams()
  const { cases, activeCaseId, isLiveApi } = useOutletContext<{
    cases: Case[]
    activeCaseId: string
    isLiveApi: boolean
  }>()

  const [selectedCaseId, setSelectedCaseId] = useState<string>(
    searchParams.get('case') || (activeCaseId === 'all' ? (cases[0]?.id || 'case-001') : activeCaseId)
  )

  const containerRef = useRef<HTMLDivElement>(null)
  const cyRef = useRef<Core | null>(null)

  const [graphData, setGraphData] = useState<GraphData>(DEMO_GRAPH_DATA)
  const [analysisMetrics, setAnalysisMetrics] = useState<GraphAnalysis>(DEMO_GRAPH_ANALYSIS)
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null)
  const [selectedEdge, setSelectedEdge] = useState<GraphEdge | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTypes, setSelectedTypes] = useState<Record<EntityType, boolean>>({
    person: true,
    phone: true,
    vehicle: true,
    location: true,
    organization: true,
  })

  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showGuide, setShowGuide] = useState(true)
  const [showMetrics, setShowMetrics] = useState(false)
  const [layoutName, setLayoutName] = useState<'cose' | 'concentric' | 'circle' | 'breadthfirst'>('cose')
  const [isLoading, setIsLoading] = useState(false)

  // Fetch graph data from backend
  const loadGraph = async (caseId: string) => {
    setIsLoading(true)
    try {
      if (isLiveApi && caseId) {
        const [gRes, aRes] = await Promise.allSettled([
          graphService.getGraphByCase(caseId),
          graphService.getGraphAnalysis(caseId),
        ])

        if (gRes.status === 'fulfilled' && gRes.value.nodes.length > 0) {
          setGraphData(gRes.value)
        } else {
          setGraphData(DEMO_GRAPH_DATA)
        }

        if (aRes.status === 'fulfilled') {
          setAnalysisMetrics(aRes.value)
        } else {
          setAnalysisMetrics(DEMO_GRAPH_ANALYSIS)
        }
      } else {
        setGraphData(DEMO_GRAPH_DATA)
        setAnalysisMetrics(DEMO_GRAPH_ANALYSIS)
      }
    } catch (e) {
      console.warn('Fallback to demo graph data', e)
      setGraphData(DEMO_GRAPH_DATA)
      setAnalysisMetrics(DEMO_GRAPH_ANALYSIS)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadGraph(selectedCaseId)
  }, [selectedCaseId, isLiveApi])

  // Initialize and mount Cytoscape
  useEffect(() => {
    if (!containerRef.current) return

    // Transform graphData into cytoscape elements
    const elements: cytoscape.ElementDefinition[] = []

    graphData.nodes.forEach((n) => {
      const type = (n.type || n.entity_type || 'person') as EntityType
      if (!selectedTypes[type]) return

      elements.push({
        group: 'nodes',
        data: {
          id: n.id,
          label: n.label || n.id,
          type: type,
          color: ENTITY_COLORS[type]?.hex || '#A0AAB7',
          raw: n,
        },
      })
    })

    const visibleNodeIds = new Set(elements.map((el) => el.data.id))

    graphData.edges.forEach((e) => {
      if (visibleNodeIds.has(e.source) && visibleNodeIds.has(e.target)) {
        elements.push({
          group: 'edges',
          data: {
            id: e.id,
            source: e.source,
            target: e.target,
            label: (e.label || e.type || e.relationship_type || '').replace(/_/g, ' '),
            confidence: e.confidence || 0.9,
            weight: e.weight || 1,
            raw: e,
          },
        })
      }
    })

    const cy = cytoscape({
      container: containerRef.current,
      elements: elements,
      style: [
        {
          selector: 'node',
          style: {
            'background-color': 'data(color)',
            label: 'data(label)',
            color: '#F4F3EF',
            'font-family': 'Inter, system-ui, sans-serif',
            'font-size': '11px',
            'font-weight': '600',
            'text-valign': 'bottom',
            'text-margin-y': 6,
            'text-background-color': '#101419',
            'text-background-opacity': 0.85,
            'text-background-padding': '3px',
            'text-background-shape': 'roundrectangle',
            width: 32,
            height: 32,
            'border-width': 2,
            'border-color': '#2D3844',
            'transition-property': 'background-color, border-color, border-width, width, height',
            'transition-duration': 0.2,
          },
        },
        {
          selector: 'edge',
          style: {
            width: 2,
            'line-color': '#3D4B59',
            'target-arrow-color': '#3D4B59',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier',
            label: 'data(label)',
            'font-family': 'JetBrains Mono, monospace',
            'font-size': '9px',
            color: '#8A99AD',
            'text-rotation': 'autorotate',
            'text-background-color': '#101419',
            'text-background-opacity': 0.9,
            'text-background-padding': '2px',
            'text-background-shape': 'roundrectangle',
            'arrow-scale': 1.1,
          },
        },
        // Selected node styling
        {
          selector: 'node:selected',
          style: {
            'border-color': '#FFFFFF',
            'border-width': 4,
            width: 40,
            height: 40,
            'text-background-color': '#202832',
            'text-background-opacity': 1,
          },
        },
        // Highlighted neighbour state
        {
          selector: 'node.highlighted',
          style: {
            'border-color': '#FFB800',
            'border-width': 3,
            opacity: 1,
          },
        },
        {
          selector: 'edge.highlighted',
          style: {
            'line-color': '#FFB800',
            'target-arrow-color': '#FFB800',
            width: 3.5,
            opacity: 1,
          },
        },
        // Dimmed state during focus
        {
          selector: 'node.faded',
          style: {
            opacity: 0.15,
          },
        },
        {
          selector: 'edge.faded',
          style: {
            opacity: 0.08,
          },
        },
      ],
      layout: {
        name: layoutName,
        padding: 50,
        animate: true,
        animationDuration: 500,
      } as any,
    })

    // Node Click Handlers
    cy.on('tap', 'node', (evt: EventObject) => {
      const node = evt.target
      const rawData = node.data('raw')
      setSelectedNode(rawData)
      setSelectedEdge(null)

      // Highlight neighbourhood
      cy.elements().removeClass('highlighted faded')
      const neighborhood = node.neighborhood().add(node)
      cy.elements().difference(neighborhood).addClass('faded')
      neighborhood.addClass('highlighted')
    })

    // Edge Click Handlers
    cy.on('tap', 'edge', (evt: EventObject) => {
      const edge = evt.target
      const rawData = edge.data('raw')
      setSelectedEdge(rawData)
      setSelectedNode(null)

      cy.elements().removeClass('highlighted faded')
      edge.connectedNodes().addClass('highlighted')
      edge.addClass('highlighted')
    })

    // Background Click Clears Selection
    cy.on('tap', (evt: EventObject) => {
      if (evt.target === cy) {
        cy.elements().removeClass('highlighted faded')
        setSelectedNode(null)
        setSelectedEdge(null)
      }
    })

    cyRef.current = cy

    return () => {
      cy.destroy()
    }
  }, [graphData, selectedTypes, layoutName])

  // Search Highlight
  useEffect(() => {
    if (!cyRef.current) return
    const cy = cyRef.current

    if (!searchTerm.trim()) {
      cy.elements().removeClass('faded highlighted')
      return
    }

    const matches = cy.nodes().filter((n) => {
      const lbl = String(n.data('label') || '').toLowerCase()
      const id = String(n.data('id') || '').toLowerCase()
      return lbl.includes(searchTerm.toLowerCase()) || id.includes(searchTerm.toLowerCase())
    })

    if (matches.length > 0) {
      cy.elements().addClass('faded').removeClass('highlighted')
      matches.removeClass('faded').addClass('highlighted')
      matches.neighborhood().removeClass('faded')
      cy.center(matches)
    }
  }, [searchTerm])

  // Canvas Actions
  const handleZoomIn = () => cyRef.current?.zoom(cyRef.current.zoom() * 1.25)
  const handleZoomOut = () => cyRef.current?.zoom(cyRef.current.zoom() * 0.8)
  const handleFit = () => cyRef.current?.fit(undefined, 50)
  const handleReset = () => {
    cyRef.current?.elements().removeClass('faded highlighted')
    setSelectedNode(null)
    setSelectedEdge(null)
    setSearchTerm('')
    cyRef.current?.layout({ name: layoutName, animate: true } as any).run()
  }

  const toggleType = (t: EntityType) => {
    setSelectedTypes((prev) => ({ ...prev, [t]: !prev[t] }))
  }

  return (
    <div
      className={`space-y-4 animate-fade-in ${
        isFullscreen ? 'fixed inset-0 z-50 bg-bg-primary p-6 overflow-hidden' : ''
      }`}
    >
      {/* Top Controls Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-2 border-b border-border-subtle">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-forensic/10 border border-amber-forensic/30 flex items-center justify-center text-amber-forensic">
            <Network className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-lg font-bold tracking-tight text-text-primary">
              Interactive Criminal Network Graph
            </h2>
            <p className="text-[11px] text-text-muted font-mono">
              Cytoscape.js link analysis engine • Dynamic topological projection
            </p>
          </div>
        </div>

        {/* Case selector & metrics toggle */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-2 bg-bg-secondary px-3 py-1.5 rounded-lg border border-border-subtle text-xs">
            <span className="text-text-muted">Investigation:</span>
            <select
              value={selectedCaseId}
              onChange={(e) => setSelectedCaseId(e.target.value)}
              className="bg-transparent text-amber-forensic font-mono font-semibold focus:outline-none cursor-pointer"
            >
              {cases.map((c) => (
                <option key={c.id} value={c.id} className="bg-bg-secondary text-text-primary">
                  {c.case_number} — {c.title}
                </option>
              ))}
            </select>
          </div>

          <Button
            size="sm"
            variant="secondary"
            onClick={() => setShowMetrics(!showMetrics)}
            icon={<Compass className="w-3.5 h-3.5 text-teal-forensic" />}
            className="text-xs"
          >
            Graph Metrics
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowGuide(!showGuide)}
            icon={<HelpCircle className="w-3.5 h-3.5 text-text-muted" />}
            className="text-xs"
          >
            Usage Guide
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsFullscreen(!isFullscreen)}
            icon={
              isFullscreen ? (
                <Minimize2 className="w-3.5 h-3.5" />
              ) : (
                <Maximize2 className="w-3.5 h-3.5" />
              )
            }
            className="text-xs"
          >
            {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          </Button>
        </div>
      </div>

      {/* First-time Help Banner */}
      {showGuide && (
        <div className="flex items-start justify-between gap-3 p-3.5 rounded-xl bg-bg-elevated/70 border border-border-subtle text-xs text-text-secondary">
          <div className="flex items-start gap-2.5">
            <Info className="w-4 h-4 text-amber-forensic flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-semibold text-text-primary tracking-wide">
                GRAPH NAVIGATION GUIDE
              </span>
              <p className="leading-relaxed">
                • <strong>Click a Node:</strong> Highlights first-degree relationships and opens entity intelligence dossier.
                <br />• <strong>Click an Edge:</strong> Inspects underlying evidentiary basis and confidence rating.
                <br />• <strong>Pan & Zoom:</strong> Drag canvas to pan; scroll wheel to zoom. Drag nodes to reposition.
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowGuide(false)}
            className="text-text-muted hover:text-text-primary p-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Metrics Bar Modal Drawer */}
      {showMetrics && (
        <Card className="p-4 bg-bg-secondary/95 border-amber-forensic/40 space-y-3 animate-slide-in-up">
          <div className="flex items-center justify-between pb-2 border-b border-border-subtle">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-amber-forensic" />
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-text-primary">
                Network Topology & Graph Analytics (GET /api/graph/case/:caseId/analyze)
              </h3>
            </div>
            <button onClick={() => setShowMetrics(false)} className="text-text-muted hover:text-text-primary">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="p-2.5 rounded bg-bg-elevated/40 border border-border-subtle">
              <span className="text-base font-mono font-bold text-amber-forensic">
                {analysisMetrics.node_count ?? graphData.nodes.length}
              </span>
              <p className="text-[10px] text-text-muted font-mono uppercase">Nodes</p>
            </div>
            <div className="p-2.5 rounded bg-bg-elevated/40 border border-border-subtle">
              <span className="text-base font-mono font-bold text-teal-forensic">
                {analysisMetrics.edge_count ?? graphData.edges.length}
              </span>
              <p className="text-[10px] text-text-muted font-mono uppercase">Edges</p>
            </div>
            <div className="p-2.5 rounded bg-bg-elevated/40 border border-border-subtle">
              <span className="text-base font-mono font-bold text-sky-400">
                {analysisMetrics.density ? Number(analysisMetrics.density).toFixed(3) : '0.106'}
              </span>
              <p className="text-[10px] text-text-muted font-mono uppercase">Density</p>
            </div>
            <div className="p-2.5 rounded bg-bg-elevated/40 border border-border-subtle">
              <span className="text-base font-mono font-bold text-purple-400">
                {analysisMetrics.connected_components ?? 1}
              </span>
              <p className="text-[10px] text-text-muted font-mono uppercase">Components</p>
            </div>
          </div>

          {analysisMetrics.top_nodes_by_degree && (
            <div className="pt-2 border-t border-border-subtle text-xs">
              <span className="text-[10px] font-mono text-text-muted uppercase">
                High Degree Centrality Nodes (Hubs):
              </span>
              <div className="flex flex-wrap gap-2 mt-1">
                {analysisMetrics.top_nodes_by_degree.map((hub) => (
                  <span
                    key={hub.entity_id}
                    className="px-2 py-0.5 rounded bg-bg-elevated text-xs font-mono text-amber-light border border-border-subtle"
                  >
                    {hub.label} ({hub.degree} connections)
                  </span>
                ))}
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Main Canvas + Overlay Panels Container */}
      <div className="relative w-full h-[640px] rounded-xl overflow-hidden border border-border-subtle bg-[#101419] shadow-2xl">
        {/* Cytoscape Container */}
        <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

        {/* Top-Left Search and Filter Overlay */}
        <div className="absolute top-4 left-4 z-10 flex flex-col gap-2 max-w-xs">
          {/* Node Search Bar */}
          <div className="relative bg-bg-secondary/90 backdrop-blur-md rounded-lg border border-border-subtle p-1 shadow-lg">
            <div className="relative flex items-center">
              <Search className="w-3.5 h-3.5 absolute left-2.5 text-text-muted" />
              <input
                type="text"
                placeholder="Find entity in graph..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-transparent pl-8 pr-3 py-1 text-xs text-text-primary placeholder:text-text-muted focus:outline-none"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="p-1 text-text-muted hover:text-text-primary"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Entity Type Visibility Filters */}
          <div className="bg-bg-secondary/90 backdrop-blur-md rounded-lg border border-border-subtle p-2 space-y-1.5 shadow-lg">
            <span className="text-[10px] font-mono uppercase text-text-muted font-semibold tracking-wider block">
              Node Filters
            </span>
            <div className="flex flex-wrap gap-1.5">
              {(Object.keys(selectedTypes) as EntityType[]).map((t) => {
                const isSelected = selectedTypes[t]
                const color = ENTITY_COLORS[t]?.hex || '#A0AAB7'

                return (
                  <button
                    key={t}
                    onClick={() => toggleType(t)}
                    className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-bg-elevated text-text-primary border-border-strong font-semibold'
                        : 'opacity-40 bg-bg-secondary text-text-muted border-transparent'
                    }`}
                  >
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: color }}
                    />
                    <span className="capitalize">{t}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Top-Right Layout & View Controls */}
        <div className="absolute top-4 right-4 z-10 flex flex-col items-end gap-2">
          {/* Zoom & Fit Toolbar */}
          <div className="flex items-center gap-1 bg-bg-secondary/90 backdrop-blur-md p-1 rounded-lg border border-border-subtle shadow-lg">
            <button
              onClick={handleZoomIn}
              className="p-1.5 rounded hover:bg-bg-elevated text-text-secondary hover:text-text-primary transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={handleZoomOut}
              className="p-1.5 rounded hover:bg-bg-elevated text-text-secondary hover:text-text-primary transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={handleFit}
              className="p-1.5 rounded hover:bg-bg-elevated text-text-secondary hover:text-text-primary transition-colors"
              title="Fit to Screen"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
            <button
              onClick={handleReset}
              className="p-1.5 rounded hover:bg-bg-elevated text-text-secondary hover:text-text-primary transition-colors"
              title="Reset View & Layout"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          {/* Layout Algorithm Switcher */}
          <div className="bg-bg-secondary/90 backdrop-blur-md px-2 py-1 rounded-lg border border-border-subtle text-[11px] font-mono text-text-muted shadow-lg">
            <span>Layout: </span>
            <select
              value={layoutName}
              onChange={(e) => setLayoutName(e.target.value as any)}
              className="bg-transparent text-amber-forensic font-semibold focus:outline-none cursor-pointer"
            >
              <option value="cose" className="bg-bg-secondary text-text-primary">
                CoSE (Force-Directed)
              </option>
              <option value="concentric" className="bg-bg-secondary text-text-primary">
                Concentric (Hierarchy)
              </option>
              <option value="circle" className="bg-bg-secondary text-text-primary">
                Circular Ring
              </option>
              <option value="breadthfirst" className="bg-bg-secondary text-text-primary">
                Breadth-First Tree
              </option>
            </select>
          </div>
        </div>

        {/* Bottom Legend */}
        <div className="absolute bottom-4 left-4 z-10 hidden sm:flex items-center gap-3 bg-bg-secondary/85 backdrop-blur-md px-3 py-1.5 rounded-lg border border-border-subtle text-[11px] font-mono shadow-lg">
          <span className="text-text-muted uppercase tracking-wider text-[10px]">Legend:</span>
          {Object.entries(ENTITY_COLORS).map(([type, color]) => (
            <div key={type} className="flex items-center gap-1.5 text-text-secondary">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color.hex }} />
              <span className="capitalize">{type}</span>
            </div>
          ))}
        </div>

        {/* Detail Inspector Drawer (Appears when Node or Edge is Selected) */}
        {selectedNode && (
          <div className="absolute bottom-4 right-4 z-20 w-80 bg-bg-secondary/95 backdrop-blur-md p-4 rounded-xl border border-amber-forensic/40 shadow-2xl space-y-3 animate-fade-in">
            <div className="flex items-start justify-between">
              <div>
                <span
                  className="text-[10px] font-mono px-2 py-0.5 rounded border uppercase font-bold"
                  style={{
                    backgroundColor: `${ENTITY_COLORS[selectedNode.type]?.hex}20`,
                    color: ENTITY_COLORS[selectedNode.type]?.hex,
                    borderColor: `${ENTITY_COLORS[selectedNode.type]?.hex}40`,
                  }}
                >
                  {selectedNode.type}
                </span>
                <h4 className="text-sm font-bold text-text-primary mt-1">
                  {selectedNode.label || selectedNode.id}
                </h4>
              </div>
              <button
                onClick={() => setSelectedNode(null)}
                className="text-text-muted hover:text-text-primary p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1.5 text-xs font-mono bg-bg-elevated/50 p-2.5 rounded-lg border border-border-subtle">
              <div className="flex justify-between">
                <span className="text-text-muted">Node ID:</span>
                <span className="text-text-primary">{selectedNode.id}</span>
              </div>
              {selectedNode.attributes &&
                Object.entries(selectedNode.attributes).map(([k, v]) => (
                  <div key={k} className="flex justify-between">
                    <span className="text-text-muted capitalize">{k.replace(/_/g, ' ')}:</span>
                    <span className="text-text-primary truncate max-w-[140px]">
                      {Array.isArray(v) ? v.join(', ') : String(v)}
                    </span>
                  </div>
                ))}
            </div>

            <Button
              size="sm"
              variant="secondary"
              onClick={() => window.open(`/entities/${selectedNode.id}`, '_self')}
              className="w-full text-xs font-mono"
            >
              Open Full Dossier
            </Button>
          </div>
        )}

        {selectedEdge && (
          <div className="absolute bottom-4 right-4 z-20 w-80 bg-bg-secondary/95 backdrop-blur-md p-4 rounded-xl border border-teal-forensic/40 shadow-2xl space-y-3 animate-fade-in">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-teal-500/15 text-teal-400 border border-teal-500/30 uppercase font-bold">
                  RELATIONSHIP LINK
                </span>
                <h4 className="text-sm font-bold text-text-primary mt-1">
                  {selectedEdge.label || selectedEdge.relationship_type || selectedEdge.type}
                </h4>
              </div>
              <button
                onClick={() => setSelectedEdge(null)}
                className="text-text-muted hover:text-text-primary p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1.5 text-xs font-mono bg-bg-elevated/50 p-2.5 rounded-lg border border-border-subtle">
              <div className="flex justify-between">
                <span className="text-text-muted">Source:</span>
                <span className="text-amber-forensic font-semibold">{selectedEdge.source}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Target:</span>
                <span className="text-teal-forensic font-semibold">{selectedEdge.target}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Confidence:</span>
                <span className="text-emerald-400 font-bold">
                  {Math.round((selectedEdge.confidence || 0.9) * 100)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Evidence Count:</span>
                <span className="text-text-primary">{selectedEdge.evidence_count || 1} records</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
