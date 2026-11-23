import React, { useState, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import {
  ScrollText,
  Search,
  Filter,
  Clock,
  User,
  Shield,
  Layers,
  ArrowUpDown,
  FileText,
  GitBranch,
} from 'lucide-react'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Badge } from '../components/ui/Badge'
import { EmptyState } from '../components/ui/EmptyState'
import { auditLogsService } from '../services/auditLogsService'
import { DEMO_AUDIT_LOGS, DEMO_CASES } from '../data/demoData'
import { AuditLog, Case } from '../types'
import { formatDate, formatRelativeTime } from '../lib/utils'

export const ActivityLogsPage: React.FC = () => {
  const { activeCaseId, isLiveApi } = useOutletContext<{
    activeCaseId: string
    isLiveApi: boolean
  }>()

  const [logs, setLogs] = useState<AuditLog[]>(DEMO_AUDIT_LOGS)
  const [searchTerm, setSearchTerm] = useState('')
  const [actionFilter, setActionFilter] = useState('all')
  const [isLoading, setIsLoading] = useState(false)

  const fetchAuditLogs = async () => {
    setIsLoading(true)
    try {
      if (isLiveApi) {
        const data = await auditLogsService.getAuditLogs()
        if (data && data.length > 0) setLogs(data)
      }
    } catch (err) {
      console.warn('Failed to load audit logs from live API', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchAuditLogs()
  }, [isLiveApi])

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.actor && log.actor.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (log.resource_type &&
        log.resource_type.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (log.resource_id && log.resource_id.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesAction = actionFilter === 'all' || log.action === actionFilter
    const matchesCase = activeCaseId === 'all' || log.case_id === activeCaseId

    return matchesSearch && matchesAction && matchesCase
  })

  const actionTypes = Array.from(new Set(logs.map((l) => l.action)))

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-border-subtle">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-text-primary">
            Chain of Custody & Activity Audit Trail
          </h2>
          <p className="text-xs text-text-muted mt-0.5">
            Immutable log of forensic queries, document uploads, entity matching verdicts, and shortest-path executions.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-3 bg-bg-secondary/80 border-border-subtle">
        <div className="flex flex-col md:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              placeholder="Search by action name, analyst actor, or resource ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-bg-elevated border border-border-subtle rounded-lg pl-8 pr-3 py-1.5 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-amber-forensic"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="bg-bg-elevated border border-border-subtle rounded-lg px-2.5 py-1.5 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-amber-forensic"
            >
              <option value="all">All Action Types</option>
              {actionTypes.map((action) => (
                <option key={action} value={action}>
                  {action}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Audit Log Table */}
      <Card className="p-0 bg-bg-secondary/90 border-border-subtle overflow-hidden">
        {filteredLogs.length === 0 ? (
          <div className="p-12 text-center text-xs text-text-muted">
            No audit log entries found matching criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border-subtle bg-bg-elevated/40 text-text-muted uppercase font-mono">
                  <th className="py-3 px-4">Action / Event</th>
                  <th className="py-3 px-4">Operator / Actor</th>
                  <th className="py-3 px-4">Resource Scope</th>
                  <th className="py-3 px-4">Dossier</th>
                  <th className="py-3 px-4">Details / Metadata</th>
                  <th className="py-3 px-4">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle/50 font-mono">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-bg-elevated/50 transition-colors">
                    <td className="py-3 px-4">
                      <span className="font-bold text-amber-forensic">{log.action}</span>
                    </td>
                    <td className="py-3 px-4 text-text-primary">{log.actor || 'System Daemon'}</td>
                    <td className="py-3 px-4 text-text-secondary text-[11px]">
                      {log.resource_type} ({log.resource_id || 'Global'})
                    </td>
                    <td className="py-3 px-4 text-text-muted text-[11px]">{log.case_id || '—'}</td>
                    <td className="py-3 px-4 text-text-muted font-sans text-[11px] max-w-xs truncate">
                      {log.details ? JSON.stringify(log.details) : '—'}
                    </td>
                    <td className="py-3 px-4 text-text-muted font-sans text-xs whitespace-nowrap">
                      {formatDate(log.timestamp)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
