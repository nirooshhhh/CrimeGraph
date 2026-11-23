import React, { useState, useEffect } from 'react'
import {
  Settings,
  Server,
  Activity,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Shield,
  Layers,
  Database,
  Terminal,
  Code2,
  ExternalLink,
} from 'lucide-react'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { systemService } from '../services/systemService'
import { ApiHealthResponse } from '../types'

export const SettingsPage: React.FC = () => {
  const [healthData, setHealthData] = useState<ApiHealthResponse | null>(null)
  const [isChecking, setIsChecking] = useState(false)
  const [lastChecked, setLastChecked] = useState<string | null>(null)
  const [healthError, setHealthError] = useState<string | null>(null)

  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'

  const checkHealth = async () => {
    setIsChecking(true)
    setHealthError(null)
    try {
      const res = await systemService.getHealth()
      setHealthData(res)
      setLastChecked(new Date().toLocaleTimeString())
    } catch (err: any) {
      setHealthData(null)
      setHealthError(
        `Unable to reach API health check at ${apiBaseUrl}/api/health. Error: ${err.message}`
      )
      setLastChecked(new Date().toLocaleTimeString())
    } finally {
      setIsChecking(false)
    }
  }

  useEffect(() => {
    checkHealth()
  }, [])

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-border-subtle">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-text-primary">
            System & Gateway Settings
          </h2>
          <p className="text-xs text-text-muted mt-0.5">
            API gateway configuration, live endpoint diagnostics, and project architecture specifications.
          </p>
        </div>
        <Button
          size="sm"
          variant="secondary"
          onClick={checkHealth}
          isLoading={isChecking}
          icon={<RefreshCw className="w-3.5 h-3.5 text-amber-forensic" />}
          className="text-xs font-mono"
        >
          Check API Health
        </Button>
      </div>

      {/* Gateway Status Card */}
      <Card className="p-6 bg-bg-secondary/90 border-border-subtle space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
          <div className="flex items-center gap-2.5">
            <Server className="w-5 h-5 text-amber-forensic" />
            <div>
              <h3 className="text-sm font-bold text-text-primary">Node.js / Express API Gateway</h3>
              <p className="text-[11px] text-text-muted font-mono">{apiBaseUrl}</p>
            </div>
          </div>
          {healthData ? (
            <span className="badge badge-green font-mono text-xs flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" /> GATEWAY OPERATIONAL
            </span>
          ) : (
            <span className="badge badge-amber font-mono text-xs flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5" /> DEMO FALLBACK MODE
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs">
          <div className="p-3 rounded-lg bg-bg-elevated/40 border border-border-subtle space-y-1">
            <span className="text-text-muted text-[10px] uppercase">Base Endpoint</span>
            <p className="text-text-primary font-bold truncate">{apiBaseUrl}</p>
          </div>
          <div className="p-3 rounded-lg bg-bg-elevated/40 border border-border-subtle space-y-1">
            <span className="text-text-muted text-[10px] uppercase">Health Check URL</span>
            <p className="text-text-primary font-bold truncate">{apiBaseUrl}/api/health</p>
          </div>
          <div className="p-3 rounded-lg bg-bg-elevated/40 border border-border-subtle space-y-1">
            <span className="text-text-muted text-[10px] uppercase">Last Heartbeat</span>
            <p className="text-text-primary font-bold">{lastChecked || 'Not checked'}</p>
          </div>
        </div>

        {healthError ? (
          <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/25 text-xs text-amber-300 font-mono">
            {healthError}
          </div>
        ) : (
          healthData && (
            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 font-mono">
              Status: {healthData.status} • Version: {healthData.version || '1.0.0'} • Service: {healthData.service || 'Express Gateway'}
            </div>
          )
        )}
      </Card>

      {/* Endpoint Architecture Specifications */}
      <Card className="p-6 bg-bg-secondary/90 border-border-subtle space-y-4">
        <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
          <Terminal className="w-4 h-4 text-sky-400" />
          Gateway Contract Endpoints (Strictly Connected)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
          <div className="p-3 rounded bg-bg-elevated/40 border border-border-subtle/60 space-y-1">
            <p className="text-amber-forensic font-bold">Investigation Files</p>
            <p className="text-text-muted">GET /api/cases</p>
            <p className="text-text-muted">POST /api/cases</p>
            <p className="text-text-muted">GET /api/cases/:id</p>
          </div>
          <div className="p-3 rounded bg-bg-elevated/40 border border-border-subtle/60 space-y-1">
            <p className="text-sky-400 font-bold">Evidence & OCR</p>
            <p className="text-text-muted">GET /api/documents</p>
            <p className="text-text-muted">POST /api/documents/upload (multipart/form-data)</p>
            <p className="text-text-muted">GET /api/documents/:id/mentions</p>
          </div>
          <div className="p-3 rounded bg-bg-elevated/40 border border-border-subtle/60 space-y-1">
            <p className="text-teal-forensic font-bold">Link Analysis & Pathfinding</p>
            <p className="text-text-muted">GET /api/graph/case/:caseId</p>
            <p className="text-text-muted">GET /api/graph/case/:caseId/analyze</p>
            <p className="text-text-muted">POST /api/graph/case/:caseId/shortest-path</p>
          </div>
          <div className="p-3 rounded bg-bg-elevated/40 border border-border-subtle/60 space-y-1">
            <p className="text-purple-400 font-bold">Entity Resolution Candidates</p>
            <p className="text-text-muted">GET /api/entity-match-candidates</p>
            <p className="text-text-muted">POST /api/entity-match-candidates</p>
            <p className="text-text-muted">PATCH /api/entity-match-candidates/:id/review</p>
          </div>
        </div>
      </Card>

      {/* About Project & Academic Disclaimer */}
      <Card className="p-6 bg-bg-secondary/90 border-border-subtle space-y-3">
        <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
          <Shield className="w-4 h-4 text-amber-forensic" />
          About CrimeGraph
        </h3>
        <p className="text-xs text-text-secondary leading-relaxed">
          <strong>CrimeGraph</strong> (Tagline: <em>Every clue has a connection.</em>) is an AI-powered criminal network
          analysis intelligence workspace developed for the Department of Information Science and Engineering.
        </p>
        <p className="text-xs text-text-muted leading-relaxed font-mono">
          All data loaded during demonstration is synthetic academic test data. The system is designed to support human investigators
          in organizing fragmented records, identifying correlations, and discovering shortest network pathways.
        </p>
      </Card>
    </div>
  )
}
