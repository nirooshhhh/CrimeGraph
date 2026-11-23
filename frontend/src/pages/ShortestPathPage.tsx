import React, { useState, useEffect } from 'react'
import { useOutletContext, useSearchParams } from 'react-router-dom'
import {
  Route,
  Search,
  ArrowRight,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  GitBranch,
  Shield,
  Layers,
  ChevronRight,
  Compass,
} from 'lucide-react'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { LoadingState } from '../components/ui/LoadingState'
import { EmptyState } from '../components/ui/EmptyState'
import { graphService } from '../services/graphService'
import { entitiesService } from '../services/entitiesService'
import { DEMO_ENTITIES, DEMO_CASES, DEMO_RELATIONSHIPS } from '../data/demoData'
import { Entity, ShortestPathResult, Case } from '../types'
import { ENTITY_COLORS } from '../lib/utils'

export const ShortestPathPage: React.FC = () => {
  const [searchParams] = useSearchParams()
  const { cases, activeCaseId, isLiveApi } = useOutletContext<{
    cases: Case[]
    activeCaseId: string
    isLiveApi: boolean
  }>()

  const [selectedCaseId, setSelectedCaseId] = useState<string>(
    searchParams.get('case') || (activeCaseId === 'all' ? (cases[0]?.id || 'case-001') : activeCaseId)
  )

  const [entities, setEntities] = useState<Entity[]>(DEMO_ENTITIES)
  const [startEntityId, setStartEntityId] = useState<string>('ent-001')
  const [endEntityId, setEndEntityId] = useState<string>('ent-010')

  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<ShortestPathResult | null>(null)
  const [hasSearched, setHasSearched] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Fetch entities for chosen case
  useEffect(() => {
    async function fetchCaseEntities() {
      try {
        if (isLiveApi && selectedCaseId) {
          const all = await entitiesService.getEntities()
          const scoped = all.filter(
            (e) => e.case_id === selectedCaseId || e.case_ids?.includes(selectedCaseId)
          )
          if (scoped.length > 0) {
            setEntities(scoped)
            setStartEntityId(scoped[0]?.id || '')
            setEndEntityId(scoped[1]?.id || '')
          }
        } else {
          const scoped = DEMO_ENTITIES.filter(
            (e) => e.case_id === selectedCaseId || e.case_ids?.includes(selectedCaseId)
          )
          setEntities(scoped.length > 0 ? scoped : DEMO_ENTITIES)
          setStartEntityId('ent-001')
          setEndEntityId('ent-010')
        }
      } catch (err) {
        setEntities(DEMO_ENTITIES)
      }
    }
    fetchCaseEntities()
  }, [selectedCaseId, isLiveApi])

  const handleAnalyze = async () => {
    if (!startEntityId || !endEntityId) {
      setErrorMessage('Please select both a source entity and destination entity.')
      return
    }

    if (startEntityId === endEntityId) {
      setErrorMessage('Source and destination entities must be distinct.')
      return
    }

    setIsLoading(true)
    setErrorMessage(null)
    setHasSearched(true)

    try {
      if (isLiveApi) {
        const pathData = await graphService.getShortestPath(
          selectedCaseId,
          startEntityId,
          endEntityId
        )
        setResult(pathData)
      } else {
        // Deterministic synthetic shortest path computation between entities
        if (startEntityId === 'ent-001' && endEntityId === 'ent-010') {
          // Viktor Vane -> Apex Global Holdings -> Freight Semi-Truck -> Pier 42
          setResult({
            found: true,
            path_length: 3,
            total_weight: 4,
            sequence: ['ent-001', 'ent-004', 'ent-008', 'ent-010'],
            nodes: [
              DEMO_ENTITIES[0],
              DEMO_ENTITIES[3],
              DEMO_ENTITIES[7],
              DEMO_ENTITIES[9],
            ],
            edges: [
              {
                id: 'rel-001',
                source: 'ent-001',
                target: 'ent-004',
                label: 'BENEFICIAL OWNER OF',
                relationship_type: 'BENEFICIAL_OWNER_OF',
                weight: 1,
              },
              {
                id: 'rel-008',
                source: 'ent-004',
                target: 'ent-008',
                label: 'VEHICLE REGISTERED OWNER',
                relationship_type: 'VEHICLE_REGISTERED_OWNER',
                weight: 1,
              },
              {
                id: 'rel-011',
                source: 'ent-008',
                target: 'ent-010',
                label: 'SIGHTED AT BERTH',
                relationship_type: 'FREQUENT_BERTH_VISIT',
                weight: 2,
              },
            ],
          })
        } else {
          // Check if directly connected or no path
          const directRel = DEMO_RELATIONSHIPS.find(
            (r) =>
              (r.source_entity_id === startEntityId && r.target_entity_id === endEntityId) ||
              (r.target_entity_id === startEntityId && r.source_entity_id === endEntityId)
          )

          if (directRel) {
            const nStart = DEMO_ENTITIES.find((e) => e.id === startEntityId)!
            const nEnd = DEMO_ENTITIES.find((e) => e.id === endEntityId)!
            setResult({
              found: true,
              path_length: 1,
              total_weight: directRel.weight || 1,
              sequence: [startEntityId, endEntityId],
              nodes: [nStart, nEnd],
              edges: [
                {
                  id: directRel.id,
                  source: directRel.source_entity_id || startEntityId,
                  target: directRel.target_entity_id || endEntityId,
                  label: directRel.relationship_type,
                  weight: directRel.weight || 1,
                },
              ],
            })
          } else {
            setResult({
              found: false,
              path_length: 0,
              nodes: [],
              edges: [],
            })
          }
        }
      }
    } catch (err: any) {
      setErrorMessage(
        err.message || 'Error occurred querying shortest-path endpoint on backend'
      )
      setResult(null)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-border-subtle">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-text-primary">
            Shortest Path Discovery
          </h2>
          <p className="text-xs text-text-muted mt-0.5">
            Dijkstra pathfinding analysis to discover intermediate hops, intermediaries, and illicit transit chains between nodes.
          </p>
        </div>
      </div>

      {/* Query Selector Card */}
      <Card className="p-6 bg-bg-secondary/90 border-border-subtle space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Investigation Selector */}
          <div className="space-y-1.5">
            <label className="block text-xs font-mono font-semibold text-text-muted uppercase">
              1. Investigation Dossier
            </label>
            <select
              value={selectedCaseId}
              onChange={(e) => setSelectedCaseId(e.target.value)}
              className="w-full bg-bg-elevated border border-border-subtle rounded-lg px-3 py-2 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-amber-forensic"
            >
              {cases.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.case_number} — {c.title}
                </option>
              ))}
            </select>
          </div>

          {/* Start Entity */}
          <div className="space-y-1.5">
            <label className="block text-xs font-mono font-semibold text-text-muted uppercase">
              2. Source Entity Node
            </label>
            <select
              value={startEntityId}
              onChange={(e) => setStartEntityId(e.target.value)}
              className="w-full bg-bg-elevated border border-border-subtle rounded-lg px-3 py-2 text-xs text-amber-forensic font-semibold focus:outline-none focus:ring-1 focus:ring-amber-forensic"
            >
              {entities.map((e) => (
                <option key={e.id} value={e.id}>
                  [{e.entity_type.toUpperCase()}] {e.label || e.name} ({e.id})
                </option>
              ))}
            </select>
          </div>

          {/* End Entity */}
          <div className="space-y-1.5">
            <label className="block text-xs font-mono font-semibold text-text-muted uppercase">
              3. Destination Entity Node
            </label>
            <select
              value={endEntityId}
              onChange={(e) => setEndEntityId(e.target.value)}
              className="w-full bg-bg-elevated border border-border-subtle rounded-lg px-3 py-2 text-xs text-sky-400 font-semibold focus:outline-none focus:ring-1 focus:ring-amber-forensic"
            >
              {entities.map((e) => (
                <option key={e.id} value={e.id}>
                  [{e.entity_type.toUpperCase()}] {e.label || e.name} ({e.id})
                </option>
              ))}
            </select>
          </div>
        </div>

        {errorMessage && (
          <p className="text-xs font-mono text-rose-400 bg-rose-500/10 p-2.5 rounded-lg border border-rose-500/20">
            {errorMessage}
          </p>
        )}

        <div className="flex items-center justify-between pt-2 border-t border-border-subtle">
          <p className="text-[11px] font-mono text-text-muted">
            API: POST /api/graph/case/:caseId/shortest-path
          </p>
          <Button
            size="md"
            variant="primary"
            onClick={handleAnalyze}
            isLoading={isLoading}
            icon={<Route className="w-4 h-4" />}
            className="font-mono text-xs font-bold"
          >
            Execute Pathfinding Analysis
          </Button>
        </div>
      </Card>

      {/* Results Workspace */}
      {isLoading ? (
        <LoadingState message="Traversing graph adjacency matrix..." subMessage="Computing weighted shortest connection path" />
      ) : hasSearched && result ? (
        result.found ? (
          <div className="space-y-5 animate-fade-in">
            {/* Summary KPI Card */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card className="p-4 bg-bg-secondary/80 border-border-subtle text-center">
                <span className="text-xs font-mono text-text-muted uppercase">Path Status</span>
                <p className="text-base font-bold text-emerald-400 font-mono mt-1 flex items-center justify-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> LINKAGE ESTABLISHED
                </p>
              </Card>

              <Card className="p-4 bg-bg-secondary/80 border-border-subtle text-center">
                <span className="text-xs font-mono text-text-muted uppercase">Total Path Hops</span>
                <p className="text-2xl font-bold font-mono text-amber-forensic mt-1">
                  {result.path_length || result.edges?.length || 1}
                </p>
              </Card>

              <Card className="p-4 bg-bg-secondary/80 border-border-subtle text-center">
                <span className="text-xs font-mono text-text-muted uppercase">Cumulative Edge Weight</span>
                <p className="text-2xl font-bold font-mono text-teal-forensic mt-1">
                  {result.total_weight || result.path_length || 1}
                </p>
              </Card>
            </div>

            {/* Sequence Pathway Visualizer */}
            <Card className="p-6 bg-bg-secondary/90 border-border-subtle space-y-6">
              <div>
                <h3 className="text-sm font-bold text-text-primary tracking-wide">
                  Topological Path Sequence & Intermediate Intermediaries
                </h3>
                <p className="text-xs text-text-muted mt-0.5">
                  Step-by-step traversal linking source target to destination terminal.
                </p>
              </div>

              {/* Horizontal Stepper Diagram */}
              <div className="flex flex-col md:flex-row items-center gap-2 overflow-x-auto p-4 bg-bg-elevated/40 rounded-xl border border-border-subtle scrollbar-thin">
                {result.nodes.map((node, idx) => {
                  const isFirst = idx === 0
                  const isLast = idx === result.nodes.length - 1
                  const edge = result.edges[idx]
                  const type = node.type || node.entity_type || 'person'
                  const styling = ENTITY_COLORS[type]

                  return (
                    <React.Fragment key={node.id}>
                      <div className="flex flex-col items-center p-3 rounded-lg bg-bg-secondary border border-border-subtle min-w-[160px] text-center space-y-1">
                        <span
                          className="w-3 h-3 rounded-full mb-1"
                          style={{ backgroundColor: styling?.hex || '#F2A900' }}
                        />
                        <span
                          className={`text-[9px] font-mono px-1.5 py-0.2 rounded border uppercase font-bold ${styling?.bg} ${styling?.text} ${styling?.border}`}
                        >
                          {type}
                        </span>
                        <p className="text-xs font-bold text-text-primary truncate max-w-[140px]">
                          {node.label || node.id}
                        </p>
                        <span className="text-[10px] text-text-muted font-mono">{node.id}</span>
                      </div>

                      {!isLast && edge && (
                        <div className="flex flex-col items-center px-2 py-1 text-center min-w-[120px]">
                          <span className="text-[9px] font-mono text-amber-forensic font-semibold uppercase truncate max-w-[120px]">
                            {edge.label || edge.relationship_type || 'LINK'}
                          </span>
                          <ArrowRight className="w-4 h-4 text-border-strong my-1" />
                          <span className="text-[9px] font-mono text-text-muted">
                            Weight: {edge.weight || 1}
                          </span>
                        </div>
                      )}
                    </React.Fragment>
                  )
                })}
              </div>

              {/* Step-by-Step Relationship Table */}
              <div className="space-y-3">
                <h4 className="text-xs font-mono font-semibold uppercase text-text-muted tracking-wider">
                  Relationship Segment Details
                </h4>
                <div className="space-y-2">
                  {result.edges.map((edge, idx) => (
                    <div
                      key={edge.id || idx}
                      className="p-3 rounded-lg bg-bg-elevated/30 border border-border-subtle flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-bg-secondary border border-border-subtle flex items-center justify-center font-mono text-[10px] text-text-muted">
                          {idx + 1}
                        </span>
                        <span className="font-mono text-amber-forensic font-bold">{edge.source}</span>
                        <span className="text-text-muted font-mono text-[10px]">
                          —[{edge.label || edge.relationship_type}]→
                        </span>
                        <span className="font-mono text-teal-forensic font-bold">{edge.target}</span>
                      </div>
                      <span className="text-[10px] font-mono text-text-muted">
                        Segment Weight: {edge.weight || 1}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>
        ) : (
          <EmptyState
            icon={<AlertCircle className="w-6 h-6 text-text-muted" />}
            title="No Direct or Transitive Path Discovered"
            description="The selected source and destination entities have no registered relationships or intermediate chain connecting them within this case dossier."
          />
        )
      ) : (
        <Card className="p-16 text-center text-xs text-text-muted border-dashed bg-bg-secondary/40">
          Configure source and destination entity nodes above, then click Execute Pathfinding Analysis.
        </Card>
      )}
    </div>
  )
}
