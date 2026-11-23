import React, { useState, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import {
  ShieldAlert,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText,
  Users,
  ChevronRight,
  ExternalLink,
  Shield,
  Layers,
} from 'lucide-react'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { EmptyState } from '../components/ui/EmptyState'
import { alertsService } from '../services/alertsService'
import { DEMO_ALERTS, DEMO_CASES } from '../data/demoData'
import { Alert, AlertStatus, AlertSeverity, Case } from '../types'
import { formatDate, formatRelativeTime, SEVERITY_BADGES, STATUS_BADGES } from '../lib/utils'

export const AlertsPage: React.FC = () => {
  const { cases, activeCaseId, isLiveApi } = useOutletContext<{
    cases: Case[]
    activeCaseId: string
    isLiveApi: boolean
  }>()

  const [alerts, setAlerts] = useState<Alert[]>(DEMO_ALERTS)
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(DEMO_ALERTS[0] || null)
  const [searchTerm, setSearchTerm] = useState('')
  const [severityFilter, setSeverityFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [isLoading, setIsLoading] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)

  const fetchAlerts = async () => {
    setIsLoading(true)
    try {
      if (isLiveApi) {
        const data =
          activeCaseId === 'all'
            ? await alertsService.getAlerts()
            : await alertsService.getAlertsByCase(activeCaseId)
        if (data && data.length > 0) {
          setAlerts(data)
          setSelectedAlert(data[0])
        }
      }
    } catch (err) {
      console.warn('Failed loading alerts from live backend', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchAlerts()
  }, [activeCaseId, isLiveApi])

  const handleUpdateStatus = async (alertId: string, status: AlertStatus) => {
    setIsUpdating(true)
    try {
      if (isLiveApi) {
        const updated = await alertsService.updateAlertStatus(alertId, status)
        setAlerts((prev) => prev.map((a) => (a.id === alertId ? { ...a, ...updated, status } : a)))
        setSelectedAlert((prev) => (prev ? { ...prev, status } : null))
      } else {
        setAlerts((prev) => prev.map((a) => (a.id === alertId ? { ...a, status } : a)))
        setSelectedAlert((prev) => (prev ? { ...prev, status } : null))
      }
    } catch (err) {
      console.error(err)
    } finally {
      setIsUpdating(false)
    }
  }

  const filteredAlerts = alerts.filter((a) => {
    const matchesSearch =
      a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (a.description && a.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (a.alert_type && a.alert_type.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesSeverity = severityFilter === 'all' || a.severity === severityFilter
    const matchesStatus = statusFilter === 'all' || a.status === statusFilter
    const matchesCase = activeCaseId === 'all' || a.case_id === activeCaseId

    return matchesSearch && matchesSeverity && matchesStatus && matchesCase
  })

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-border-subtle">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-text-primary">
            Automated Investigative Alerts
          </h2>
          <p className="text-xs text-text-muted mt-0.5">
            Automated anomaly monitors: transaction smurfing, burner telephony bursts, and perimeter breaches.
          </p>
        </div>
      </div>

      {/* Main Grid: Left List (5 Cols), Right Details (7 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Filter and Alert Cards (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <Card className="p-3 bg-bg-secondary/80 border-border-subtle space-y-3">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                placeholder="Search alerts by title or pattern..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-bg-elevated border border-border-subtle rounded-lg pl-8 pr-3 py-1.5 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-amber-forensic"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
                className="bg-bg-elevated border border-border-subtle rounded-lg px-2.5 py-1.5 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-amber-forensic"
              >
                <option value="all">All Severities</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-bg-elevated border border-border-subtle rounded-lg px-2.5 py-1.5 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-amber-forensic"
              >
                <option value="all">All Statuses</option>
                <option value="new">New (Unreviewed)</option>
                <option value="investigating">Investigating</option>
                <option value="resolved">Resolved</option>
                <option value="dismissed">Dismissed</option>
              </select>
            </div>
          </Card>

          {/* List of Alerts */}
          <div className="space-y-2.5 max-h-[640px] overflow-y-auto pr-1">
            {filteredAlerts.length === 0 ? (
              <EmptyState
                title="No Alerts Found"
                description="No investigative anomalies match the current filter criteria."
              />
            ) : (
              filteredAlerts.map((a) => {
                const isSelected = selectedAlert?.id === a.id
                return (
                  <div
                    key={a.id}
                    onClick={() => setSelectedAlert(a)}
                    className={`p-3.5 rounded-lg border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-amber-forensic/10 border-amber-forensic/50 shadow-sm'
                        : 'bg-bg-secondary/90 border-border-subtle hover:bg-bg-elevated/70'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className={`badge ${SEVERITY_BADGES[a.severity] || 'badge-gray'} text-[10px]`}>
                          {a.severity.toUpperCase()}
                        </span>
                        <span className={`badge ${STATUS_BADGES[a.status] || 'badge-gray'} text-[10px]`}>
                          {a.status.toUpperCase()}
                        </span>
                      </div>
                      <span className="text-[10px] text-text-muted font-mono">
                        {formatRelativeTime(a.created_at)}
                      </span>
                    </div>

                    <h4 className="text-xs font-semibold text-text-primary truncate">{a.title}</h4>
                    <p className="text-[11px] text-text-muted mt-1 line-clamp-2 leading-relaxed">
                      {a.description}
                    </p>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Right Column: Alert Detail Workspace (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          {selectedAlert ? (
            <Card className="p-6 bg-bg-secondary/90 border-border-subtle space-y-5">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-4 border-b border-border-subtle">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-bold text-amber-forensic">
                      ALERT #{selectedAlert.id}
                    </span>
                    <span className={`badge ${SEVERITY_BADGES[selectedAlert.severity]}`}>
                      {selectedAlert.severity.toUpperCase()}
                    </span>
                    <span className={`badge ${STATUS_BADGES[selectedAlert.status]}`}>
                      {selectedAlert.status.toUpperCase()}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-text-primary">{selectedAlert.title}</h3>
                </div>

                <div className="p-2.5 rounded-lg bg-bg-elevated text-xs font-mono text-text-muted">
                  Case: {selectedAlert.case_id}
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <h4 className="text-xs font-mono uppercase tracking-wider text-text-muted">
                  Incident Description
                </h4>
                <p className="text-xs text-text-secondary leading-relaxed bg-bg-elevated/40 p-3 rounded-lg border border-border-subtle">
                  {selectedAlert.description}
                </p>
              </div>

              {/* Automated Explanation Section */}
              {selectedAlert.explanation && (
                <div className="space-y-1.5">
                  <h4 className="text-xs font-mono uppercase tracking-wider text-text-muted">
                    Automated Model Explanation
                  </h4>
                  <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/25 text-xs text-amber-200/90 leading-relaxed font-mono">
                    {selectedAlert.explanation}
                  </div>
                </div>
              )}

              {/* Supporting Records Table */}
              {selectedAlert.supporting_records && selectedAlert.supporting_records.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-mono uppercase tracking-wider text-text-muted">
                    Evidentiary Records Triggering Alert
                  </h4>
                  <div className="p-3 rounded-lg bg-bg-elevated/50 border border-border-subtle font-mono text-xs overflow-x-auto space-y-2">
                    {selectedAlert.supporting_records.map((rec, idx) => (
                      <div key={idx} className="flex gap-4 text-text-secondary border-b border-border-subtle/50 pb-1.5 last:border-0 last:pb-0">
                        {Object.entries(rec).map(([k, v]) => (
                          <span key={k}>
                            <strong className="text-text-muted capitalize">{k.replace(/_/g, ' ')}:</strong>{' '}
                            <span className="text-text-primary">{String(v)}</span>
                          </span>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Status Update Actions */}
              <div className="pt-3 border-t border-border-subtle space-y-2">
                <span className="text-xs font-mono text-text-muted uppercase">
                  Investigative Workflow Actions:
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    isLoading={isUpdating}
                    onClick={() => handleUpdateStatus(selectedAlert.id, 'investigating')}
                    icon={<Clock className="w-3.5 h-3.5 text-sky-400" />}
                  >
                    Mark Investigating
                  </Button>
                  <Button
                    size="sm"
                    variant="primary"
                    isLoading={isUpdating}
                    onClick={() => handleUpdateStatus(selectedAlert.id, 'resolved')}
                    icon={<CheckCircle2 className="w-3.5 h-3.5" />}
                  >
                    Resolve Anomaly
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    isLoading={isUpdating}
                    onClick={() => handleUpdateStatus(selectedAlert.id, 'dismissed')}
                    className="text-xs text-text-muted hover:text-text-primary"
                  >
                    Dismiss (False Positive)
                  </Button>
                </div>
              </div>
            </Card>
          ) : (
            <Card className="p-16 text-center text-xs text-text-muted border-dashed">
              Select an alert from the left panel to inspect evidentiary records.
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
