import React, { useState, useEffect } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import {
  FolderOpen,
  Users,
  GitBranch,
  ShieldAlert,
  FileText,
  GitCompare,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  Plus,
  Upload,
  Network,
  Activity,
  Layers,
} from 'lucide-react'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from 'recharts'
import { casesService } from '../services/casesService'
import { entitiesService } from '../services/entitiesService'
import { documentsService } from '../services/documentsService'
import { alertsService } from '../services/alertsService'
import { matchCandidatesService } from '../services/matchCandidatesService'
import { graphService } from '../services/graphService'
import {
  DEMO_CASES,
  DEMO_ENTITIES,
  DEMO_DOCUMENTS,
  DEMO_ALERTS,
  DEMO_MATCH_CANDIDATES,
  DEMO_RELATIONSHIPS,
} from '../data/demoData'
import {
  Case,
  Entity,
  DocumentItem,
  Alert,
  EntityMatchCandidate,
  Relationship,
} from '../types'
import {
  formatDate,
  formatRelativeTime,
  ENTITY_COLORS,
  SEVERITY_BADGES,
  STATUS_BADGES,
} from '../lib/utils'

export const OverviewPage: React.FC = () => {
  const navigate = useNavigate()
  const { activeCaseId, isLiveApi } = useOutletContext<{
    cases: Case[]
    activeCaseId: string
    isLiveApi: boolean
  }>()

  const [cases, setCases] = useState<Case[]>(DEMO_CASES)
  const [entities, setEntities] = useState<Entity[]>(DEMO_ENTITIES)
  const [documents, setDocuments] = useState<DocumentItem[]>(DEMO_DOCUMENTS)
  const [alerts, setAlerts] = useState<Alert[]>(DEMO_ALERTS)
  const [matchCandidates, setMatchCandidates] =
    useState<EntityMatchCandidate[]>(DEMO_MATCH_CANDIDATES)
  const [relationships, setRelationships] =
    useState<Relationship[]>(DEMO_RELATIONSHIPS)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    async function loadData() {
      setIsLoading(true)
      try {
        if (isLiveApi) {
          const [cList, eList, dList, aList, mList, rList] = await Promise.allSettled([
            casesService.getCases(),
            entitiesService.getEntities(),
            documentsService.getDocuments(),
            alertsService.getAlerts(),
            matchCandidatesService.getMatchCandidates(),
            graphService.getRelationships(),
          ])

          if (cList.status === 'fulfilled' && cList.value.length > 0) setCases(cList.value)
          if (eList.status === 'fulfilled' && eList.value.length > 0) setEntities(eList.value)
          if (dList.status === 'fulfilled' && dList.value.length > 0) setDocuments(dList.value)
          if (aList.status === 'fulfilled' && aList.value.length > 0) setAlerts(aList.value)
          if (mList.status === 'fulfilled' && mList.value.length > 0) setMatchCandidates(mList.value)
          if (rList.status === 'fulfilled' && rList.value.length > 0) setRelationships(rList.value)
        }
      } catch (err) {
        console.warn('Backend metrics derivation fallback', err)
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [isLiveApi])

  // Derive counts directly from retrieved list data
  const filteredCases =
    activeCaseId === 'all' ? cases : cases.filter((c) => c.id === activeCaseId)
  const filteredEntities =
    activeCaseId === 'all' ? entities : entities.filter((e) => e.case_id === activeCaseId || e.case_ids?.includes(activeCaseId))
  const filteredDocuments =
    activeCaseId === 'all' ? documents : documents.filter((d) => d.case_id === activeCaseId)
  const filteredAlerts =
    activeCaseId === 'all' ? alerts : alerts.filter((a) => a.case_id === activeCaseId)
  const pendingAlerts = filteredAlerts.filter((a) => a.status === 'new')
  const pendingMatches = matchCandidates.filter((m) => m.status === 'pending')

  // Entity distribution data for pie chart
  const entityTypeCounts = filteredEntities.reduce<Record<string, number>>((acc, curr) => {
    const t = curr.entity_type || 'person'
    acc[t] = (acc[t] || 0) + 1
    return acc
  }, {})

  const entityChartData = Object.entries(entityTypeCounts).map(([type, count]) => ({
    name: type.toUpperCase(),
    value: count,
    color: ENTITY_COLORS[type]?.hex || '#A0AAB7',
  }))

  // Alert severity distribution
  const alertSeverityCounts = filteredAlerts.reduce<Record<string, number>>((acc, curr) => {
    const s = curr.severity || 'low'
    acc[s] = (acc[s] || 0) + 1
    return acc
  }, {})

  const alertChartData = [
    { name: 'Critical', count: alertSeverityCounts.critical || 0, fill: '#F43F5E' },
    { name: 'High', count: alertSeverityCounts.high || 0, fill: '#F59E0B' },
    { name: 'Medium', count: alertSeverityCounts.medium || 0, fill: '#38BDF8' },
    { name: 'Low', count: alertSeverityCounts.low || 0, fill: '#64748B' },
  ]

  // Activity timeline mock derived from case/entity creation
  const activityData = [
    { period: 'Mon', leads: 4, alerts: 1 },
    { period: 'Tue', leads: 7, alerts: 2 },
    { period: 'Wed', leads: 5, alerts: 0 },
    { period: 'Thu', leads: 11, alerts: 3 },
    { period: 'Fri', leads: 8, alerts: 2 },
    { period: 'Sat', leads: 3, alerts: 1 },
    { period: 'Sun', leads: 6, alerts: 2 },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Banner / Headline */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-border-subtle">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-text-primary">
            Investigative Intelligence Overview
          </h2>
          <p className="text-xs text-text-muted mt-0.5">
            Cross-case correlation, entity link metrics, and real-time anomaly surveillance stream.
          </p>
        </div>

        {/* Quick Actions Bar */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => navigate('/investigations')}
            icon={<FolderOpen className="w-3.5 h-3.5 text-amber-forensic" />}
          >
            Cases
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => navigate('/documents')}
            icon={<Upload className="w-3.5 h-3.5 text-sky-400" />}
          >
            Upload Evidence
          </Button>
          <Button
            size="sm"
            variant="primary"
            onClick={() => navigate('/link-analysis')}
            icon={<Network className="w-3.5 h-3.5" />}
          >
            Explore Graph
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => navigate('/entity-matches')}
            icon={<GitCompare className="w-3.5 h-3.5 text-purple-400" />}
          >
            Review Matches ({pendingMatches.length})
          </Button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3.5">
        <Card className="p-4 bg-bg-secondary/80 border-border-subtle flex flex-col justify-between">
          <div className="flex items-center justify-between text-text-muted">
            <span className="text-[11px] font-mono uppercase tracking-wider">Investigations</span>
            <FolderOpen className="w-4 h-4 text-amber-forensic" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold font-mono text-text-primary">
              {filteredCases.length}
            </span>
            <p className="text-[10px] text-text-muted mt-0.5 font-mono">
              {filteredCases.filter((c) => c.status === 'active').length} Active Files
            </p>
          </div>
        </Card>

        <Card className="p-4 bg-bg-secondary/80 border-border-subtle flex flex-col justify-between">
          <div className="flex items-center justify-between text-text-muted">
            <span className="text-[11px] font-mono uppercase tracking-wider">Indexed Entities</span>
            <Users className="w-4 h-4 text-sky-400" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold font-mono text-text-primary">
              {filteredEntities.length}
            </span>
            <p className="text-[10px] text-text-muted mt-0.5 font-mono">
              Across 5 Categories
            </p>
          </div>
        </Card>

        <Card className="p-4 bg-bg-secondary/80 border-border-subtle flex flex-col justify-between">
          <div className="flex items-center justify-between text-text-muted">
            <span className="text-[11px] font-mono uppercase tracking-wider">Relationships</span>
            <GitBranch className="w-4 h-4 text-teal-forensic" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold font-mono text-text-primary">
              {relationships.length}
            </span>
            <p className="text-[10px] text-text-muted mt-0.5 font-mono">
              Verified Links
            </p>
          </div>
        </Card>

        <Card className="p-4 bg-bg-secondary/80 border-border-subtle flex flex-col justify-between">
          <div className="flex items-center justify-between text-text-muted">
            <span className="text-[11px] font-mono uppercase tracking-wider">Pending Alerts</span>
            <ShieldAlert className="w-4 h-4 text-rose-400" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold font-mono text-rose-400">
              {pendingAlerts.length}
            </span>
            <p className="text-[10px] text-text-muted mt-0.5 font-mono">
              Require Analysis
            </p>
          </div>
        </Card>

        <Card className="p-4 bg-bg-secondary/80 border-border-subtle flex flex-col justify-between">
          <div className="flex items-center justify-between text-text-muted">
            <span className="text-[11px] font-mono uppercase tracking-wider">Evidence Files</span>
            <FileText className="w-4 h-4 text-purple-400" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold font-mono text-text-primary">
              {filteredDocuments.length}
            </span>
            <p className="text-[10px] text-text-muted mt-0.5 font-mono">
              Processed & Mapped
            </p>
          </div>
        </Card>

        <Card className="p-4 bg-bg-secondary/80 border-border-subtle flex flex-col justify-between">
          <div className="flex items-center justify-between text-text-muted">
            <span className="text-[11px] font-mono uppercase tracking-wider">Match Candidates</span>
            <GitCompare className="w-4 h-4 text-amber-light" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold font-mono text-amber-400">
              {pendingMatches.length}
            </span>
            <p className="text-[10px] text-text-muted mt-0.5 font-mono">
              Identity Review
            </p>
          </div>
        </Card>
      </div>

      {/* Visual Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Investigation Activity Trend */}
        <Card className="lg:col-span-2 p-5 bg-bg-secondary/80 border-border-subtle">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-text-primary">
                Investigation Lead & Anomaly Frequency
              </h3>
              <p className="text-[11px] text-text-muted">
                Daily automated ingestion volume and surveillance alert triggers.
              </p>
            </div>
            <div className="flex items-center gap-3 text-[11px] font-mono">
              <span className="flex items-center gap-1.5 text-amber-forensic">
                <span className="w-2 h-2 rounded-full bg-amber-forensic inline-block" /> Leads
              </span>
              <span className="flex items-center gap-1.5 text-rose-400">
                <span className="w-2 h-2 rounded-full bg-rose-400 inline-block" /> Alerts
              </span>
            </div>
          </div>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={activityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="leadGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F2A900" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#F2A900" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="alertGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F43F5E" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#F43F5E" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="period" stroke="#6B7685" fontSize={11} tickLine={false} />
                <YAxis stroke="#6B7685" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#171D24',
                    borderColor: '#2D3844',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="leads"
                  stroke="#F2A900"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#leadGrad)"
                />
                <Area
                  type="monotone"
                  dataKey="alerts"
                  stroke="#F43F5E"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#alertGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Entity Category Distribution */}
        <Card className="p-5 bg-bg-secondary/80 border-border-subtle flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-text-primary">
              Entity Category Distribution
            </h3>
            <p className="text-[11px] text-text-muted mb-3">
              Taxonomy classification of identified nodes in graph.
            </p>
          </div>
          <div className="h-44 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={entityChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={68}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {entityChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="#101419" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#171D24',
                    borderColor: '#2D3844',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border-subtle text-[11px]">
            {entityChartData.map((d) => (
              <div key={d.name} className="flex items-center justify-between text-text-secondary">
                <span className="flex items-center gap-1.5 truncate">
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: d.color }}
                  />
                  {d.name}
                </span>
                <span className="font-mono font-semibold text-text-primary">{d.value}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Two Column Section: Recent Cases & Critical Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Recent Investigations */}
        <Card className="p-5 bg-bg-secondary/80 border-border-subtle space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-text-primary">Recent Active Investigations</h3>
              <p className="text-[11px] text-text-muted">Direct access to primary intelligence dossiers.</p>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => navigate('/investigations')}
              icon={<ArrowRight className="w-3.5 h-3.5" />}
              className="text-xs"
            >
              View All
            </Button>
          </div>

          <div className="space-y-2.5">
            {filteredCases.slice(0, 3).map((c) => (
              <div
                key={c.id}
                onClick={() => navigate(`/investigations/${c.id}`)}
                className="group p-3 rounded-lg bg-bg-elevated/40 hover:bg-bg-elevated border border-border-subtle hover:border-amber-forensic/40 cursor-pointer transition-all"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-amber-forensic">
                      {c.case_number}
                    </span>
                    <span className={`badge ${STATUS_BADGES[c.status] || 'badge-gray'}`}>
                      {c.status}
                    </span>
                    <span className={`badge ${SEVERITY_BADGES[c.priority] || 'badge-gray'}`}>
                      {c.priority}
                    </span>
                  </div>
                  <span className="text-[10px] text-text-muted font-mono">
                    {formatRelativeTime(c.created_at)}
                  </span>
                </div>
                <h4 className="text-xs font-semibold text-text-primary group-hover:text-amber-forensic transition-colors">
                  {c.title}
                </h4>
                {c.description && (
                  <p className="text-[11px] text-text-muted mt-1 line-clamp-1">
                    {c.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        </Card>

        {/* Recent Alerts */}
        <Card className="p-5 bg-bg-secondary/80 border-border-subtle space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-text-primary">Investigative Anomaly Alerts</h3>
              <p className="text-[11px] text-text-muted">High priority signals flagged by automated correlation.</p>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => navigate('/alerts')}
              icon={<ArrowRight className="w-3.5 h-3.5" />}
              className="text-xs"
            >
              All Alerts
            </Button>
          </div>

          <div className="space-y-2.5">
            {filteredAlerts.slice(0, 3).map((a) => (
              <div
                key={a.id}
                onClick={() => navigate('/alerts')}
                className="group p-3 rounded-lg bg-bg-elevated/40 hover:bg-bg-elevated border border-border-subtle hover:border-rose-500/40 cursor-pointer transition-all"
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className={`badge ${SEVERITY_BADGES[a.severity] || 'badge-gray'}`}>
                      {a.severity.toUpperCase()}
                    </span>
                    <span className="text-[10px] font-mono text-text-muted uppercase">
                      {a.alert_type}
                    </span>
                  </div>
                  <span className="text-[10px] text-text-muted font-mono">
                    {formatRelativeTime(a.created_at)}
                  </span>
                </div>
                <h4 className="text-xs font-medium text-text-primary group-hover:text-rose-400 transition-colors">
                  {a.title}
                </h4>
                {a.explanation && (
                  <p className="text-[11px] text-text-muted mt-1 line-clamp-1 italic">
                    "{a.explanation}"
                  </p>
                )}
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Bottom Row: Candidate Match Review & Recent Entities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Pending Match Reviews */}
        <Card className="p-5 bg-bg-secondary/80 border-border-subtle space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GitCompare className="w-4 h-4 text-amber-forensic" />
              <h3 className="text-sm font-semibold text-text-primary">
                Pending Entity Match Candidates
              </h3>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => navigate('/entity-matches')}
              className="text-xs"
            >
              Review Pipeline
            </Button>
          </div>

          <div className="space-y-2.5">
            {pendingMatches.map((m) => (
              <div
                key={m.id}
                onClick={() => navigate('/entity-matches')}
                className="p-3 rounded-lg bg-bg-elevated/30 border border-border-subtle flex items-center justify-between hover:bg-bg-elevated/60 cursor-pointer transition-all"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-semibold text-text-primary">
                      {m.entity_a?.name || m.entity_a?.label || m.entity_a_id}
                    </span>
                    <span className="text-text-muted font-mono text-[10px]">vs</span>
                    <span className="font-semibold text-amber-300">
                      {m.entity_b?.name || m.entity_b?.label || m.entity_b_id}
                    </span>
                  </div>
                  <p className="text-[11px] text-text-muted truncate max-w-sm">
                    {m.match_reasons?.[0] || 'Attribute overlap detected across cases'}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className="text-xs font-mono font-bold text-amber-forensic">
                    {Math.round((m.match_score || m.similarity_score || 0) * 100)}%
                  </span>
                  <p className="text-[10px] text-text-muted font-mono">Similarity</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Recently Added Entities */}
        <Card className="p-5 bg-bg-secondary/80 border-border-subtle space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-sky-400" />
              <h3 className="text-sm font-semibold text-text-primary">Recently Indexed Entities</h3>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => navigate('/entities')}
              className="text-xs"
            >
              Catalog
            </Button>
          </div>

          <div className="space-y-2">
            {filteredEntities.slice(0, 4).map((e) => (
              <div
                key={e.id}
                onClick={() => navigate(`/entities/${e.id}`)}
                className="p-2.5 rounded-lg bg-bg-elevated/30 border border-border-subtle hover:bg-bg-elevated/60 flex items-center justify-between cursor-pointer transition-all"
              >
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <div
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: ENTITY_COLORS[e.entity_type]?.hex || '#A0AAB7' }}
                  />
                  <div className="truncate">
                    <p className="text-xs font-semibold text-text-primary truncate">
                      {e.label || e.name}
                    </p>
                    <p className="text-[10px] text-text-muted font-mono truncate">
                      {e.identifier || e.normalized_value || e.entity_type}
                    </p>
                  </div>
                </div>
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase ${
                    ENTITY_COLORS[e.entity_type]?.bg
                  } ${ENTITY_COLORS[e.entity_type]?.text} ${
                    ENTITY_COLORS[e.entity_type]?.border
                  }`}
                >
                  {e.entity_type}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
