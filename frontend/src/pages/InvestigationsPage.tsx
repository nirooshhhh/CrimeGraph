import React, { useState, useEffect } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import {
  FolderOpen,
  Search,
  Filter,
  Plus,
  ArrowUpDown,
  ExternalLink,
  Users,
  GitBranch,
  FileText,
  ShieldAlert,
  Calendar,
} from 'lucide-react'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { EmptyState } from '../components/ui/EmptyState'
import { casesService } from '../services/casesService'
import { DEMO_CASES } from '../data/demoData'
import { Case } from '../types'
import {
  formatDate,
  formatRelativeTime,
  SEVERITY_BADGES,
  STATUS_BADGES,
} from '../lib/utils'

export const InvestigationsPage: React.FC = () => {
  const navigate = useNavigate()
  const { isLiveApi } = useOutletContext<{ isLiveApi: boolean }>()

  const [cases, setCases] = useState<Case[]>(DEMO_CASES)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortBy, setSortBy] = useState<'date' | 'priority' | 'title'>('date')
  const [isLoading, setIsLoading] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // New Case Form
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('financial_crime')
  const [priority, setPriority] = useState('high')
  const [leadInvestigator, setLeadInvestigator] = useState('Analyst R. Vance')
  const [isCreating, setIsCreating] = useState(false)

  const fetchCases = async () => {
    setIsLoading(true)
    try {
      if (isLiveApi) {
        const data = await casesService.getCases()
        if (data && data.length > 0) setCases(data)
      }
    } catch (e) {
      console.warn('Failed to load live cases', e)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchCases()
  }, [isLiveApi])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    setIsCreating(true)
    try {
      if (isLiveApi) {
        const created = await casesService.createCase({
          title: title.trim(),
          description: description.trim(),
          category,
          priority,
          lead_investigator: leadInvestigator.trim(),
        })
        setCases((prev) => [created, ...prev])
      } else {
        const synthetic: Case = {
          id: `case-${Date.now()}`,
          case_number: `CR-2024-${Math.floor(1000 + Math.random() * 9000)}`,
          title: title.trim(),
          description: description.trim(),
          category,
          status: 'active',
          priority: priority as any,
          lead_investigator: leadInvestigator.trim(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          entity_count: 0,
          relationship_count: 0,
          document_count: 0,
          alert_count: 0,
        }
        setCases((prev) => [synthetic, ...prev])
      }
      setIsModalOpen(false)
      setTitle('')
      setDescription('')
    } catch (err) {
      console.error(err)
    } finally {
      setIsCreating(false)
    }
  }

  // Filter & Sort
  const filteredCases = cases
    .filter((c) => {
      const matchesSearch =
        c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.case_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.description && c.description.toLowerCase().includes(searchTerm.toLowerCase()))
      const matchesCat = categoryFilter === 'all' || c.category === categoryFilter
      const matchesStat = statusFilter === 'all' || c.status === statusFilter
      return matchesSearch && matchesCat && matchesStat
    })
    .sort((a, b) => {
      if (sortBy === 'priority') {
        const weights: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1 }
        return (weights[b.priority] || 0) - (weights[a.priority] || 0)
      }
      if (sortBy === 'title') {
        return a.title.localeCompare(b.title)
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-border-subtle">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-text-primary">
            Active Criminal Investigations
          </h2>
          <p className="text-xs text-text-muted mt-0.5">
            Operational case dossiers, jurisdictional boundaries, and cross-case intelligence indices.
          </p>
        </div>
        <Button
          size="sm"
          variant="primary"
          onClick={() => setIsModalOpen(true)}
          icon={<Plus className="w-4 h-4" />}
          className="font-mono text-xs font-semibold"
        >
          Initialize Dossier
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4 bg-bg-secondary/80 border-border-subtle">
        <div className="flex flex-col md:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              placeholder="Filter by case number, title, or keywords..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-bg-elevated border border-border-subtle rounded-lg pl-9 pr-4 py-2 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-amber-forensic"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-bg-elevated border border-border-subtle rounded-lg px-3 py-2 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-amber-forensic"
            >
              <option value="all">All Offense Types</option>
              <option value="financial_crime">Financial Crime</option>
              <option value="organized_crime">Organized Crime</option>
              <option value="cybercrime">Cybercrime</option>
              <option value="narcotics">Narcotics</option>
              <option value="corruption">Public Corruption</option>
              <option value="smuggling">Smuggling / Maritime</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-bg-elevated border border-border-subtle rounded-lg px-3 py-2 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-amber-forensic"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="under_review">Under Review</option>
              <option value="closed">Closed</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-bg-elevated border border-border-subtle rounded-lg px-3 py-2 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-amber-forensic"
            >
              <option value="date">Sort by Date</option>
              <option value="priority">Sort by Priority</option>
              <option value="title">Sort by Title</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Cases List */}
      {filteredCases.length === 0 ? (
        <EmptyState
          title="No Investigation Files Found"
          description="Adjust your search criteria or register a new criminal investigation dossier."
          actionLabel="Create Dossier"
          onAction={() => setIsModalOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredCases.map((c) => (
            <Card
              key={c.id}
              onClick={() => navigate(`/investigations/${c.id}`)}
              interactive
              glow="amber"
              className="p-5 flex flex-col justify-between group space-y-4 bg-bg-secondary/90 border-border-subtle hover:border-amber-forensic/40"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-mono text-xs font-bold text-amber-forensic tracking-wider">
                      {c.case_number}
                    </span>
                    <span className={`badge ${STATUS_BADGES[c.status] || 'badge-gray'}`}>
                      {c.status}
                    </span>
                    <span className={`badge ${SEVERITY_BADGES[c.priority] || 'badge-gray'}`}>
                      {c.priority}
                    </span>
                  </div>
                  <ExternalLink className="w-4 h-4 text-text-muted group-hover:text-amber-forensic transition-colors flex-shrink-0" />
                </div>

                <div>
                  <h3 className="text-sm font-bold text-text-primary group-hover:text-amber-light transition-colors line-clamp-1">
                    {c.title}
                  </h3>
                  <p className="text-xs text-text-muted mt-1.5 line-clamp-2 leading-relaxed">
                    {c.description || 'No operational summary provided.'}
                  </p>
                </div>
              </div>

              {/* Metrics & Metadata */}
              <div className="pt-3 border-t border-border-subtle space-y-2.5">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-bg-elevated/40 p-1.5 rounded border border-border-subtle/40">
                    <span className="text-xs font-mono font-bold text-sky-400">
                      {c.entity_count ?? '—'}
                    </span>
                    <p className="text-[9px] text-text-muted uppercase font-mono">Entities</p>
                  </div>
                  <div className="bg-bg-elevated/40 p-1.5 rounded border border-border-subtle/40">
                    <span className="text-xs font-mono font-bold text-teal-forensic">
                      {c.relationship_count ?? '—'}
                    </span>
                    <p className="text-[9px] text-text-muted uppercase font-mono">Links</p>
                  </div>
                  <div className="bg-bg-elevated/40 p-1.5 rounded border border-border-subtle/40">
                    <span className="text-xs font-mono font-bold text-purple-400">
                      {c.document_count ?? '—'}
                    </span>
                    <p className="text-[9px] text-text-muted uppercase font-mono">Docs</p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-text-muted font-mono pt-1">
                  <span className="truncate max-w-[150px]">
                    {c.lead_investigator || 'Unit ISE'}
                  </span>
                  <span>{formatRelativeTime(c.created_at)}</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Initialize Investigation Dossier"
        subtitle="POST /api/cases — Register official investigation record in graph database."
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="Case / Operation Title"
            placeholder="e.g., Operation DarkHorizon"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-text-secondary">Offense Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-bg-elevated border border-border-subtle rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-amber-forensic"
            >
              <option value="financial_crime">Financial Crime / Money Laundering</option>
              <option value="organized_crime">Organized Crime Syndicate</option>
              <option value="cybercrime">Cybercrime / Dark Web Escrow</option>
              <option value="narcotics">Narcotics Distribution</option>
              <option value="corruption">Public Corruption</option>
              <option value="smuggling">Smuggling & Port Logistics</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-text-secondary">Priority Level</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full bg-bg-elevated border border-border-subtle rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-amber-forensic"
              >
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
            <Input
              label="Assigned Lead Agent"
              value={leadInvestigator}
              onChange={(e) => setLeadInvestigator(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-text-secondary">
              Investigative Scope & Summary
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe criminal syndication, operational leads, and targeted jurisdictions..."
              className="w-full bg-bg-elevated border border-border-subtle rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-amber-forensic resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-border-subtle">
            <Button type="button" variant="ghost" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={isCreating}>
              Create Investigation
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
