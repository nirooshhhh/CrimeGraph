import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, useOutletContext } from 'react-router-dom'
import {
  FolderOpen,
  ArrowLeft,
  Users,
  FileText,
  GitBranch,
  ShieldAlert,
  PhoneCall,
  ArrowLeftRight,
  ScrollText,
  Network,
  Download,
  Calendar,
  Shield,
  Layers,
  ChevronRight,
} from 'lucide-react'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { EmptyState } from '../components/ui/EmptyState'
import { LoadingState } from '../components/ui/LoadingState'
import { casesService } from '../services/casesService'
import { entitiesService } from '../services/entitiesService'
import { documentsService } from '../services/documentsService'
import { alertsService } from '../services/alertsService'
import { callRecordsService } from '../services/callRecordsService'
import { transactionsService } from '../services/transactionsService'
import { auditLogsService } from '../services/auditLogsService'
import { graphService } from '../services/graphService'
import {
  DEMO_CASES,
  DEMO_ENTITIES,
  DEMO_DOCUMENTS,
  DEMO_RELATIONSHIPS,
  DEMO_ALERTS,
  DEMO_CALL_RECORDS,
  DEMO_TRANSACTIONS,
  DEMO_AUDIT_LOGS,
} from '../data/demoData'
import {
  Case,
  Entity,
  DocumentItem,
  Relationship,
  Alert,
  CallRecord,
  Transaction,
  AuditLog,
} from '../types'
import {
  formatDate,
  formatRelativeTime,
  formatCurrency,
  formatDuration,
  formatBytes,
  ENTITY_COLORS,
  SEVERITY_BADGES,
  STATUS_BADGES,
} from '../lib/utils'

type TabType =
  | 'overview'
  | 'entities'
  | 'documents'
  | 'relationships'
  | 'alerts'
  | 'call-records'
  | 'transactions'
  | 'activity'

export const InvestigationDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { isLiveApi } = useOutletContext<{ isLiveApi: boolean }>()

  const [activeTab, setActiveTab] = useState<TabType>('overview')
  const [caseData, setCaseData] = useState<Case | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Associated datasets
  const [entities, setEntities] = useState<Entity[]>([])
  const [documents, setDocuments] = useState<DocumentItem[]>([])
  const [relationships, setRelationships] = useState<Relationship[]>([])
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [callRecords, setCallRecords] = useState<CallRecord[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])

  useEffect(() => {
    async function loadCaseDossier() {
      setIsLoading(true)
      try {
        if (isLiveApi && id) {
          const res = await casesService.getCaseById(id)
          setCaseData(res)

          // Load case specific tabs data
          const [eRes, dRes, aRes] = await Promise.allSettled([
            entitiesService.getEntities(),
            documentsService.getDocumentsByCase(id),
            alertsService.getAlertsByCase(id),
          ])

          if (eRes.status === 'fulfilled') {
            setEntities(eRes.value.filter((e) => e.case_id === id || e.case_ids?.includes(id)))
          }
          if (dRes.status === 'fulfilled') setDocuments(dRes.value)
          if (aRes.status === 'fulfilled') setAlerts(aRes.value)
        } else {
          // Demo fallback
          const found = DEMO_CASES.find((c) => c.id === id) || DEMO_CASES[0]
          setCaseData(found)
          setEntities(DEMO_ENTITIES.filter((e) => e.case_id === found.id || e.case_ids?.includes(found.id)))
          setDocuments(DEMO_DOCUMENTS.filter((d) => d.case_id === found.id))
          setRelationships(DEMO_RELATIONSHIPS.filter((r) => r.case_id === found.id))
          setAlerts(DEMO_ALERTS.filter((a) => a.case_id === found.id))
          setCallRecords(DEMO_CALL_RECORDS.filter((c) => c.case_id === found.id))
          setTransactions(DEMO_TRANSACTIONS.filter((t) => t.case_id === found.id))
          setAuditLogs(DEMO_AUDIT_LOGS.filter((a) => a.case_id === found.id))
        }
      } catch (err) {
        console.warn('Error loading case dossier', err)
        const found = DEMO_CASES.find((c) => c.id === id) || DEMO_CASES[0]
        setCaseData(found)
      } finally {
        setIsLoading(false)
      }
    }

    loadCaseDossier()
  }, [id, isLiveApi])

  if (isLoading) {
    return <LoadingState message="Decryption & Ingestion of Case Dossier..." />
  }

  if (!caseData) {
    return (
      <EmptyState
        title="Dossier Not Found"
        description="The requested investigation file does not exist or has been archived."
        actionLabel="Back to Investigations"
        onAction={() => navigate('/investigations')}
      />
    )
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: FolderOpen },
    { id: 'entities', label: `Entities (${entities.length})`, icon: Users },
    { id: 'documents', label: `Documents (${documents.length})`, icon: FileText },
    { id: 'relationships', label: `Relationships (${relationships.length})`, icon: GitBranch },
    { id: 'alerts', label: `Alerts (${alerts.length})`, icon: ShieldAlert },
    { id: 'call-records', label: `Call Records (${callRecords.length})`, icon: PhoneCall },
    { id: 'transactions', label: `Transactions (${transactions.length})`, icon: ArrowLeftRight },
    { id: 'activity', label: 'Activity Trail', icon: ScrollText },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Breadcrumb & Action bar */}
      <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
        <button
          onClick={() => navigate('/investigations')}
          className="flex items-center gap-2 text-xs font-mono text-text-muted hover:text-amber-forensic transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>RETURN TO INVESTIGATIONS</span>
        </button>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="primary"
            onClick={() => navigate(`/link-analysis?case=${caseData.id}`)}
            icon={<Network className="w-3.5 h-3.5" />}
            className="text-xs font-mono"
          >
            Launch Graph Visualizer
          </Button>
        </div>
      </div>

      {/* Case Header Card */}
      <Card className="p-6 bg-bg-secondary/90 border-border-subtle space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-sm font-bold text-amber-forensic px-2.5 py-0.5 rounded bg-amber-forensic/10 border border-amber-forensic/30">
                {caseData.case_number}
              </span>
              <span className={`badge ${STATUS_BADGES[caseData.status] || 'badge-gray'}`}>
                {caseData.status.toUpperCase()}
              </span>
              <span className={`badge ${SEVERITY_BADGES[caseData.priority] || 'badge-gray'}`}>
                PRIORITY: {caseData.priority.toUpperCase()}
              </span>
              <span className="text-xs font-mono text-text-muted px-2 py-0.5 rounded bg-bg-elevated border border-border-subtle">
                {caseData.category.replace(/_/g, ' ').toUpperCase()}
              </span>
            </div>

            <h1 className="text-xl font-bold text-text-primary tracking-tight">
              {caseData.title}
            </h1>
            <p className="text-xs text-text-secondary leading-relaxed max-w-3xl">
              {caseData.description || 'No operational brief attached to this file.'}
            </p>
          </div>

          <div className="flex flex-col gap-1.5 p-3.5 rounded-lg bg-bg-elevated/50 border border-border-subtle text-xs font-mono min-w-[240px]">
            <div className="flex items-center justify-between text-text-muted">
              <span>Lead Agent:</span>
              <span className="text-text-primary font-medium">{caseData.lead_investigator || 'Unit ISE'}</span>
            </div>
            <div className="flex items-center justify-between text-text-muted">
              <span>Opened:</span>
              <span className="text-text-primary">{formatDate(caseData.created_at)}</span>
            </div>
            <div className="flex items-center justify-between text-text-muted">
              <span>Last Modified:</span>
              <span className="text-text-primary">{formatRelativeTime(caseData.updated_at)}</span>
            </div>
          </div>
        </div>

        {/* 8 Tabs Header */}
        <div className="flex items-center gap-1 overflow-x-auto border-t border-border-subtle pt-3 scrollbar-thin">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-amber-forensic text-bg-primary font-semibold shadow-sm'
                    : 'text-text-secondary hover:text-text-primary hover:bg-bg-elevated'
                }`}
              >
                <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>
      </Card>

      {/* Tab Content Panels */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <Card className="p-5 md:col-span-2 bg-bg-secondary/80 border-border-subtle space-y-4">
            <h3 className="text-sm font-semibold text-text-primary">Investigative Synopsis</h3>
            <p className="text-xs text-text-secondary leading-relaxed">
              This case correlates data across multiple evidence records including maritime manifests,
              wire records, burner telephony, and surveillance sightings. The goal is to illuminate
              the structure of the syndicate, uncover cross-case links, and evaluate risk vectors.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-border-subtle text-center">
              <div className="p-3 rounded-lg bg-bg-elevated/40 border border-border-subtle">
                <span className="text-lg font-mono font-bold text-amber-forensic">
                  {entities.length}
                </span>
                <p className="text-[10px] text-text-muted font-mono uppercase">Key Entities</p>
              </div>
              <div className="p-3 rounded-lg bg-bg-elevated/40 border border-border-subtle">
                <span className="text-lg font-mono font-bold text-teal-forensic">
                  {relationships.length}
                </span>
                <p className="text-[10px] text-text-muted font-mono uppercase">Links</p>
              </div>
              <div className="p-3 rounded-lg bg-bg-elevated/40 border border-border-subtle">
                <span className="text-lg font-mono font-bold text-purple-400">
                  {documents.length}
                </span>
                <p className="text-[10px] text-text-muted font-mono uppercase">Evidence Files</p>
              </div>
              <div className="p-3 rounded-lg bg-bg-elevated/40 border border-border-subtle">
                <span className="text-lg font-mono font-bold text-rose-400">
                  {alerts.length}
                </span>
                <p className="text-[10px] text-text-muted font-mono uppercase">Alert Signals</p>
              </div>
            </div>
          </Card>

          <Card className="p-5 bg-bg-secondary/80 border-border-subtle space-y-3">
            <h3 className="text-sm font-semibold text-text-primary">Key Targets</h3>
            <div className="space-y-2">
              {entities.slice(0, 4).map((e) => (
                <div
                  key={e.id}
                  onClick={() => navigate(`/entities/${e.id}`)}
                  className="p-2 rounded bg-bg-elevated/40 hover:bg-bg-elevated flex items-center justify-between text-xs cursor-pointer"
                >
                  <span className="font-medium text-text-primary truncate max-w-[140px]">
                    {e.label || e.name}
                  </span>
                  <span className="font-mono text-[10px] text-amber-forensic uppercase">
                    {e.entity_type}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'entities' && (
        <Card className="p-5 bg-bg-secondary/80 border-border-subtle space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-text-primary">Associated Entities ({entities.length})</h3>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => navigate('/entities')}
              className="text-xs"
            >
              Add Entity
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {entities.map((e) => (
              <div
                key={e.id}
                onClick={() => navigate(`/entities/${e.id}`)}
                className="p-3.5 rounded-lg bg-bg-elevated/40 hover:bg-bg-elevated border border-border-subtle hover:border-amber-forensic/30 cursor-pointer transition-all space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs text-text-primary truncate">
                    {e.label || e.name}
                  </span>
                  <span
                    className={`text-[9px] font-mono px-1.5 py-0.5 rounded border uppercase ${
                      ENTITY_COLORS[e.entity_type]?.bg
                    } ${ENTITY_COLORS[e.entity_type]?.text} ${
                      ENTITY_COLORS[e.entity_type]?.border
                    }`}
                  >
                    {e.entity_type}
                  </span>
                </div>
                <p className="text-[11px] text-text-muted font-mono truncate">
                  {e.identifier || e.normalized_value || 'No identifier registered'}
                </p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {activeTab === 'documents' && (
        <Card className="p-5 bg-bg-secondary/80 border-border-subtle space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-text-primary">
              Evidentiary Documents & Transcripts ({documents.length})
            </h3>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => navigate('/documents')}
              className="text-xs"
            >
              Upload Document
            </Button>
          </div>
          <div className="space-y-2.5">
            {documents.map((d) => (
              <div
                key={d.id}
                className="p-3 rounded-lg bg-bg-elevated/40 border border-border-subtle flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <FileText className="w-4 h-4 text-amber-forensic flex-shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-text-primary">{d.title || d.filename}</p>
                    <p className="text-[10px] text-text-muted font-mono">
                      {d.filename} • {formatBytes(d.file_size)} • {formatDate(d.created_at)}
                    </p>
                  </div>
                </div>
                <Badge variant="teal">{d.status.toUpperCase()}</Badge>
              </div>
            ))}
          </div>
        </Card>
      )}

      {activeTab === 'relationships' && (
        <Card className="p-5 bg-bg-secondary/80 border-border-subtle space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-text-primary">
              Recorded Entity Relationships ({relationships.length})
            </h3>
            <Button
              size="sm"
              variant="primary"
              onClick={() => navigate(`/link-analysis?case=${caseData.id}`)}
              icon={<Network className="w-3.5 h-3.5" />}
              className="text-xs"
            >
              View in Graph
            </Button>
          </div>
          <div className="space-y-2.5">
            {relationships.map((r) => (
              <div
                key={r.id}
                className="p-3 rounded-lg bg-bg-elevated/40 border border-border-subtle flex items-center justify-between text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-amber-400 font-semibold">
                      {r.source_entity_id || r.source_id}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-bg-secondary text-text-secondary font-mono border border-border-subtle">
                      {r.relationship_type}
                    </span>
                    <span className="font-mono text-teal-400 font-semibold">
                      {r.target_entity_id || r.target_id}
                    </span>
                  </div>
                  {r.notes && <p className="text-[11px] text-text-muted italic">{r.notes}</p>}
                </div>
                <span className="text-[10px] font-mono text-text-muted">
                  Confidence: {Math.round((r.confidence || 0.9) * 100)}%
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {activeTab === 'alerts' && (
        <Card className="p-5 bg-bg-secondary/80 border-border-subtle space-y-4">
          <h3 className="text-sm font-semibold text-text-primary">Case Alerts ({alerts.length})</h3>
          <div className="space-y-3">
            {alerts.map((a) => (
              <div
                key={a.id}
                className="p-3.5 rounded-lg bg-bg-elevated/40 border border-border-subtle space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`badge ${SEVERITY_BADGES[a.severity] || 'badge-gray'}`}>
                      {a.severity.toUpperCase()}
                    </span>
                    <span className="text-xs font-semibold text-text-primary">{a.title}</span>
                  </div>
                  <span className="text-[10px] text-text-muted font-mono">
                    {formatRelativeTime(a.created_at)}
                  </span>
                </div>
                <p className="text-xs text-text-secondary">{a.description}</p>
                {a.explanation && (
                  <p className="text-[11px] text-amber-300/80 bg-amber-500/10 p-2 rounded border border-amber-500/20 font-mono">
                    Analysis: {a.explanation}
                  </p>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {activeTab === 'call-records' && (
        <Card className="p-5 bg-bg-secondary/80 border-border-subtle space-y-4">
          <h3 className="text-sm font-semibold text-text-primary">Telephony & Call Detail Records ({callRecords.length})</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border-subtle text-text-muted uppercase font-mono">
                  <th className="py-2 px-3">Caller</th>
                  <th className="py-2 px-3">Receiver</th>
                  <th className="py-2 px-3">Timestamp</th>
                  <th className="py-2 px-3">Duration</th>
                  <th className="py-2 px-3">Cell Mast</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle/40">
                {callRecords.map((c) => (
                  <tr key={c.id} className="hover:bg-bg-elevated/40">
                    <td className="py-2.5 px-3 font-mono font-medium text-sky-400">
                      {c.caller_number}
                    </td>
                    <td className="py-2.5 px-3 font-mono font-medium text-amber-400">
                      {c.receiver_number}
                    </td>
                    <td className="py-2.5 px-3 text-text-muted">{formatDate(c.call_timestamp)}</td>
                    <td className="py-2.5 px-3 font-mono">{formatDuration(c.duration_seconds)}</td>
                    <td className="py-2.5 px-3 text-text-secondary">{c.cell_tower_location || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {activeTab === 'transactions' && (
        <Card className="p-5 bg-bg-secondary/80 border-border-subtle space-y-4">
          <h3 className="text-sm font-semibold text-text-primary">Financial Ledger & Fund Transfers ({transactions.length})</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border-subtle text-text-muted uppercase font-mono">
                  <th className="py-2 px-3">Sender Account</th>
                  <th className="py-2 px-3">Beneficiary</th>
                  <th className="py-2 px-3">Amount</th>
                  <th className="py-2 px-3">Date</th>
                  <th className="py-2 px-3">Type</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle/40">
                {transactions.map((t) => (
                  <tr key={t.id} className="hover:bg-bg-elevated/40">
                    <td className="py-2.5 px-3 font-mono text-text-primary truncate max-w-[200px]">
                      {t.sender_account}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-text-secondary truncate max-w-[200px]">
                      {t.receiver_account}
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-amber-forensic">
                      {formatCurrency(t.amount, t.currency)}
                    </td>
                    <td className="py-2.5 px-3 text-text-muted">{formatDate(t.transaction_timestamp)}</td>
                    <td className="py-2.5 px-3 font-mono text-[10px] text-text-muted">
                      {t.transaction_type}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {activeTab === 'activity' && (
        <Card className="p-5 bg-bg-secondary/80 border-border-subtle space-y-4">
          <h3 className="text-sm font-semibold text-text-primary">Chain of Custody & Audit Trail ({auditLogs.length})</h3>
          <div className="space-y-3">
            {auditLogs.map((log) => (
              <div
                key={log.id}
                className="p-3 rounded-lg bg-bg-elevated/40 border border-border-subtle flex items-start justify-between text-xs font-mono"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-amber-forensic font-bold">{log.action}</span>
                    <span className="text-text-muted">by {log.actor || 'System'}</span>
                  </div>
                  <p className="text-text-secondary font-sans">
                    Resource: {log.resource_type} ({log.resource_id})
                  </p>
                </div>
                <span className="text-[10px] text-text-muted">{formatDate(log.timestamp)}</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
