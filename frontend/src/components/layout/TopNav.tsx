import React from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  Search,
  Bell,
  FolderOpen,
  Plus,
  Shield,
  Activity,
  UserCheck,
  ChevronRight,
} from 'lucide-react'
import { Button } from '../ui/Button'
import { Case } from '../../types'

interface TopNavProps {
  cases: Case[]
  activeCaseId: string
  onSelectCase: (caseId: string) => void
  onOpenCreateCase?: () => void
  pendingAlertsCount?: number
}

const PAGE_TITLES: Record<string, { title: string; category: string }> = {
  '/': { title: 'Intelligence Overview', category: 'Executive Dashboard' },
  '/overview': { title: 'Intelligence Overview', category: 'Executive Dashboard' },
  '/investigations': { title: 'Investigation Files', category: 'Case Management' },
  '/documents': { title: 'Evidence & Ingestion', category: 'Document Forensics' },
  '/entities': { title: 'Entity Intelligence Catalog', category: 'Entity Resolution' },
  '/entity-matches': { title: 'Entity Match Candidate Review', category: 'Identity Resolution' },
  '/link-analysis': { title: 'Interactive Link Analysis Graph', category: 'Visual Analytics' },
  '/shortest-path': { title: 'Shortest Path Discovery', category: 'Network Analytics' },
  '/alerts': { title: 'Pattern & Anomaly Alerts', category: 'Monitoring' },
  '/call-records': { title: 'Call Detail Record (CDR) Analysis', category: 'Surveillance' },
  '/transactions': { title: 'Financial Transaction Ledger', category: 'Financial Forensics' },
  '/activity-logs': { title: 'Investigation Audit & Trail', category: 'Chain of Custody' },
  '/settings': { title: 'System & Gateway Settings', category: 'Configuration' },
}

export const TopNav: React.FC<TopNavProps> = ({
  cases,
  activeCaseId,
  onSelectCase,
  onOpenCreateCase,
  pendingAlertsCount = 0,
}) => {
  const location = useLocation()
  const navigate = useNavigate()

  // Match title
  const currentPath = location.pathname
  const isCaseDetail = currentPath.startsWith('/investigations/') && currentPath !== '/investigations'
  const isEntityDetail = currentPath.startsWith('/entities/') && currentPath !== '/entities'

  let pageMeta = PAGE_TITLES[currentPath] || {
    title: 'Investigative Intelligence',
    category: 'CrimeGraph',
  }

  if (isCaseDetail) {
    pageMeta = { title: 'Investigation Dossier', category: 'Case Detail' }
  } else if (isEntityDetail) {
    pageMeta = { title: 'Entity Profile Dossier', category: 'Entity Detail' }
  }

  return (
    <header className="h-16 bg-bg-secondary border-b border-border-subtle px-6 flex items-center justify-between z-20 flex-shrink-0">
      {/* Breadcrumb / Title Area */}
      <div className="flex items-center gap-3">
        <div>
          <div className="flex items-center gap-1.5 text-[11px] font-mono text-text-muted">
            <span>CrimeGraph</span>
            <ChevronRight className="w-3 h-3 text-border-strong" />
            <span className="text-amber-forensic/80 font-medium">{pageMeta.category}</span>
          </div>
          <h1 className="text-sm font-bold text-text-primary tracking-tight font-sans">
            {pageMeta.title}
          </h1>
        </div>
      </div>

      {/* Center / Right controls */}
      <div className="flex items-center gap-4">
        {/* Global Case Filter Selector */}
        <div className="hidden md:flex items-center gap-2 bg-bg-elevated/70 border border-border-subtle rounded-lg px-2.5 py-1.5">
          <FolderOpen className="w-3.5 h-3.5 text-amber-forensic flex-shrink-0" />
          <span className="text-xs text-text-muted font-medium">Scope:</span>
          <select
            value={activeCaseId}
            onChange={(e) => onSelectCase(e.target.value)}
            className="bg-transparent text-xs font-medium text-text-primary focus:outline-none cursor-pointer pr-2 max-w-[200px] truncate"
          >
            <option value="all" className="bg-bg-secondary text-text-primary">
              All Active Investigations
            </option>
            {cases.map((c) => (
              <option key={c.id} value={c.id} className="bg-bg-secondary text-text-primary">
                {c.case_number} — {c.title}
              </option>
            ))}
          </select>
        </div>

        {/* Global Quick Search Button */}
        <div className="relative hidden lg:block w-56">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Search clues, entities..."
            className="w-full bg-bg-elevated border border-border-subtle rounded-lg pl-8 pr-3 py-1.5 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-amber-forensic/50"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const target = (e.target as HTMLInputElement).value
                if (target.trim()) {
                  navigate(`/entities?search=${encodeURIComponent(target.trim())}`)
                }
              }
            }}
          />
        </div>

        {/* Create Case Quick Action */}
        {onOpenCreateCase && (
          <Button
            size="sm"
            variant="primary"
            onClick={onOpenCreateCase}
            icon={<Plus className="w-3.5 h-3.5" />}
            className="text-xs font-mono font-semibold"
          >
            New Dossier
          </Button>
        )}

        {/* Alerts Bell */}
        <button
          onClick={() => navigate('/alerts')}
          className="relative p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-elevated transition-colors border border-transparent hover:border-border-subtle"
          title="Investigative Alerts"
        >
          <Bell className="w-4 h-4" />
          {pendingAlertsCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-bg-secondary animate-pulse" />
          )}
        </button>

        {/* Security / Analyst Badge */}
        <div className="flex items-center gap-2 pl-2 border-l border-border-subtle">
          <div className="w-7 h-7 rounded-full bg-amber-forensic/20 border border-amber-forensic/30 flex items-center justify-center text-amber-forensic font-mono text-xs font-bold">
            IV
          </div>
          <div className="hidden xl:block text-left">
            <p className="text-xs font-semibold text-text-primary leading-tight">Analyst R. Vance</p>
            <p className="text-[10px] text-text-muted font-mono leading-tight">ISE Lead Unit</p>
          </div>
        </div>
      </div>
    </header>
  )
}
