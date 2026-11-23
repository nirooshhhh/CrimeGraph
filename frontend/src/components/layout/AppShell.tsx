import React, { useState, useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { TopNav } from './TopNav'
import { StatusBanner } from '../ui/StatusBanner'
import { ResponsibleNotice } from '../ui/ResponsibleNotice'
import { Modal } from '../ui/Modal'
import { Input } from '../ui/Input'
import { Button } from '../ui/Button'
import { casesService } from '../../services/casesService'
import { systemService } from '../../services/systemService'
import { DEMO_CASES, DEMO_ALERTS, DEMO_MATCH_CANDIDATES } from '../../data/demoData'
import { Case } from '../../types'

export const AppShell: React.FC = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [cases, setCases] = useState<Case[]>(DEMO_CASES)
  const [activeCaseId, setActiveCaseId] = useState<string>('all')
  const [isLiveApi, setIsLiveApi] = useState<boolean>(false)
  const [apiError, setApiError] = useState<string | null>(null)
  const [isCheckingApi, setIsCheckingApi] = useState<boolean>(false)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  // Form state for creating a new investigation
  const [newTitle, setNewTitle] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [newCategory, setNewCategory] = useState('financial_crime')
  const [newPriority, setNewPriority] = useState('high')
  const [newInvestigator, setNewInvestigator] = useState('Analyst R. Vance')
  const [isSubmittingCase, setIsSubmittingCase] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  // Check backend health & fetch live cases on mount
  const checkConnection = async () => {
    setIsCheckingApi(true)
    try {
      const health = await systemService.getHealth()
      if (health && (health.status === 'ok' || health.status === 'healthy')) {
        setIsLiveApi(true)
        setApiError(null)
        // Load live cases
        try {
          const liveCases = await casesService.getCases()
          if (liveCases && liveCases.length > 0) {
            setCases(liveCases)
          }
        } catch (e) {
          console.warn('Could not retrieve live cases, retaining fallback data', e)
        }
      } else {
        setIsLiveApi(false)
      }
    } catch (err: any) {
      setIsLiveApi(false)
      setApiError(
        'Backend gateway at http://localhost:5000 is unreachable. Using synthetic demonstration repository.'
      )
      // Keep demo cases loaded
      setCases(DEMO_CASES)
    } finally {
      setIsCheckingApi(false)
    }
  }

  useEffect(() => {
    checkConnection()
  }, [])

  const handleCreateCase = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTitle.trim()) {
      setFormError('Investigation title is required')
      return
    }
    setIsSubmittingCase(true)
    setFormError(null)

    const payload = {
      title: newTitle.trim(),
      description: newDescription.trim(),
      category: newCategory,
      priority: newPriority,
      lead_investigator: newInvestigator.trim(),
    }

    try {
      if (isLiveApi) {
        const created = await casesService.createCase(payload)
        setCases((prev) => [created, ...prev])
      } else {
        // Create in-memory synthetic case
        const syntheticCase: Case = {
          id: `case-${Date.now()}`,
          case_number: `CR-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
          title: payload.title,
          description: payload.description,
          category: payload.category,
          status: 'active',
          priority: payload.priority as any,
          lead_investigator: payload.lead_investigator,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          entity_count: 0,
          relationship_count: 0,
          document_count: 0,
          alert_count: 0,
        }
        setCases((prev) => [syntheticCase, ...prev])
      }
      setIsCreateModalOpen(false)
      setNewTitle('')
      setNewDescription('')
    } catch (err: any) {
      setFormError(err.message || 'Failed to initialize investigation dossier')
    } finally {
      setIsSubmittingCase(false)
    }
  }

  const pendingAlerts = DEMO_ALERTS.filter((a) => a.status === 'new').length
  const pendingMatches = DEMO_MATCH_CANDIDATES.filter((m) => m.status === 'pending').length

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-bg-primary text-text-primary">
      {/* Sidebar */}
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        alertCount={pendingAlerts}
        matchCount={pendingMatches}
      />

      {/* Main Workspace Frame */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Status indicator bar */}
        <StatusBanner
          isLive={isLiveApi}
          isChecking={isCheckingApi}
          error={apiError}
          onRetry={checkConnection}
          usingDemoFallback={!isLiveApi}
        />

        {/* Global Navigation Bar */}
        <TopNav
          cases={cases}
          activeCaseId={activeCaseId}
          onSelectCase={setActiveCaseId}
          onOpenCreateCase={() => setIsCreateModalOpen(true)}
          pendingAlertsCount={pendingAlerts}
        />

        {/* Scrollable Viewport */}
        <main className="flex-1 overflow-y-auto px-6 py-6 scrollbar-thin">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Responsible analysis notice */}
            <ResponsibleNotice />

            {/* Child Page Content */}
            <Outlet context={{ cases, activeCaseId, isLiveApi, onRefreshCases: checkConnection }} />
          </div>
        </main>
      </div>

      {/* Create Investigation Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Initialize New Investigation Dossier"
        subtitle="Register an operational crime file, assign lead investigator and taxonomy."
        maxWidth="md"
      >
        <form onSubmit={handleCreateCase} className="space-y-4">
          <Input
            label="Case / Operation Title"
            placeholder="e.g., Operation DarkHorizon — Port Smuggling"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            required
          />

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-text-secondary">Category</label>
            <select
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              className="w-full bg-bg-elevated border border-border-subtle rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-amber-forensic"
            >
              <option value="financial_crime">Financial Crime & Laundering</option>
              <option value="organized_crime">Organized Crime Syndicate</option>
              <option value="cybercrime">Cybercrime & Infrastructure</option>
              <option value="narcotics">Narcotics Trafficking</option>
              <option value="corruption">Public Corruption & Fraud</option>
              <option value="smuggling">Smuggling & Port Logistics</option>
              <option value="other">Other Federal / State Offense</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-text-secondary">Priority</label>
              <select
                value={newPriority}
                onChange={(e) => setNewPriority(e.target.value)}
                className="w-full bg-bg-elevated border border-border-subtle rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-amber-forensic"
              >
                <option value="critical">Critical (Immediate)</option>
                <option value="high">High Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="low">Low Priority</option>
              </select>
            </div>
            <Input
              label="Lead Analyst / Agent"
              placeholder="e.g., Det. Insp. R. Vance"
              value={newInvestigator}
              onChange={(e) => setNewInvestigator(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-text-secondary">Scope Summary</label>
            <textarea
              rows={3}
              placeholder="Provide context on initial intelligence, suspected modus operandi, and jurisdictional scope..."
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              className="w-full bg-bg-elevated border border-border-subtle rounded-lg px-3.5 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-amber-forensic resize-none"
            />
          </div>

          {formError && (
            <p className="text-xs text-rose-400 bg-rose-500/10 p-2.5 rounded-lg border border-rose-500/20 font-mono">
              {formError}
            </p>
          )}

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-border-subtle">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsCreateModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isSubmittingCase}
            >
              Open Investigation
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
