import React, { useState, useEffect } from 'react'
import { useNavigate, useOutletContext, useSearchParams } from 'react-router-dom'
import {
  Users,
  Search,
  Filter,
  Plus,
  Phone,
  Car,
  MapPin,
  Building2,
  User,
  Shield,
  ExternalLink,
  Tag,
  CheckCircle2,
  Clock,
  Layers,
} from 'lucide-react'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { Badge } from '../components/ui/Badge'
import { EmptyState } from '../components/ui/EmptyState'
import { entitiesService } from '../services/entitiesService'
import { DEMO_ENTITIES, DEMO_CASES } from '../data/demoData'
import { Entity, EntityType, Case } from '../types'
import {
  formatDate,
  formatRelativeTime,
  ENTITY_COLORS,
  SEVERITY_BADGES,
} from '../lib/utils'

export const EntitiesPage: React.FC = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { cases, activeCaseId, isLiveApi } = useOutletContext<{
    cases: Case[]
    activeCaseId: string
    isLiveApi: boolean
  }>()

  const [entities, setEntities] = useState<Entity[]>(DEMO_ENTITIES)
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '')
  const [selectedType, setSelectedType] = useState<string>('all')
  const [riskFilter, setRiskFilter] = useState<string>('all')
  const [isLoading, setIsLoading] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // New Entity Form
  const [entityType, setEntityType] = useState<EntityType>('person')
  const [label, setLabel] = useState('')
  const [identifier, setIdentifier] = useState('')
  const [targetCaseId, setTargetCaseId] = useState(activeCaseId === 'all' ? (cases[0]?.id || 'case-001') : activeCaseId)
  const [riskLevel, setRiskLevel] = useState<'low' | 'medium' | 'high' | 'critical'>('medium')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fetchEntities = async () => {
    setIsLoading(true)
    try {
      if (isLiveApi) {
        const data = await entitiesService.getEntities()
        if (data && data.length > 0) setEntities(data)
      }
    } catch (err) {
      console.warn('Live entities failed, keeping demo dataset', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchEntities()
  }, [isLiveApi])

  const handleCreateEntity = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!label.trim()) return

    setIsSubmitting(true)
    try {
      const payload = {
        entity_type: entityType,
        label: label.trim(),
        name: label.trim(),
        identifier: identifier.trim(),
        case_id: targetCaseId,
        risk_level: riskLevel,
        confidence_score: 0.95,
      }

      if (isLiveApi) {
        const created = await entitiesService.createEntity(payload)
        setEntities((prev) => [created, ...prev])
      } else {
        const synthetic: Entity = {
          id: `ent-${Date.now()}`,
          case_id: targetCaseId,
          case_ids: [targetCaseId],
          entity_type: entityType,
          label: payload.label,
          name: payload.label,
          identifier: payload.identifier,
          normalized_value: payload.label.toUpperCase(),
          confidence_score: 0.95,
          risk_level: riskLevel,
          created_at: new Date().toISOString(),
          is_verified: true,
        }
        setEntities((prev) => [synthetic, ...prev])
      }

      setIsModalOpen(false)
      setLabel('')
      setIdentifier('')
    } catch (err) {
      console.error(err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const typeConfig: Record<string, { label: string; icon: React.ElementType }> = {
    all: { label: 'All Entity Classes', icon: Layers },
    person: { label: 'People', icon: User },
    phone: { label: 'Phone Numbers', icon: Phone },
    vehicle: { label: 'Vehicles', icon: Car },
    location: { label: 'Locations', icon: MapPin },
    organization: { label: 'Organizations', icon: Building2 },
  }

  const filteredEntities = entities.filter((e) => {
    const matchesSearch =
      (e.label && e.label.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (e.name && e.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (e.identifier && e.identifier.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (e.normalized_value && e.normalized_value.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesType = selectedType === 'all' || e.entity_type === selectedType
    const matchesRisk = riskFilter === 'all' || e.risk_level === riskFilter
    const matchesCase =
      activeCaseId === 'all' ||
      e.case_id === activeCaseId ||
      e.case_ids?.includes(activeCaseId)

    return matchesSearch && matchesType && matchesRisk && matchesCase
  })

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-border-subtle">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-text-primary">
            Entity Intelligence Catalog
          </h2>
          <p className="text-xs text-text-muted mt-0.5">
            Indexed nodes across investigations: People, Phone Numbers, Vehicles, Locations, and Organizations.
          </p>
        </div>
        <Button
          size="sm"
          variant="primary"
          onClick={() => setIsModalOpen(true)}
          icon={<Plus className="w-4 h-4" />}
          className="font-mono text-xs font-semibold"
        >
          Register Entity Node
        </Button>
      </div>

      {/* Filter and Category Pills */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
          {Object.entries(typeConfig).map(([key, config]) => {
            const Icon = config.icon
            const isSelected = selectedType === key
            const count =
              key === 'all'
                ? entities.length
                : entities.filter((e) => e.entity_type === key).length

            return (
              <button
                key={key}
                onClick={() => setSelectedType(key)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap cursor-pointer border ${
                  isSelected
                    ? 'bg-amber-forensic/15 text-amber-forensic border-amber-forensic/40 font-semibold'
                    : 'bg-bg-secondary/70 text-text-secondary border-border-subtle hover:text-text-primary hover:bg-bg-elevated'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{config.label}</span>
                <span className="font-mono text-[10px] px-1.5 py-0.2 rounded-full bg-bg-elevated text-text-muted">
                  {count}
                </span>
              </button>
            )
          })}
        </div>

        {/* Search & Risk Filter */}
        <Card className="p-3 bg-bg-secondary/80 border-border-subtle">
          <div className="flex flex-col md:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                placeholder="Search by entity name, alias, license plate, MSISDN, or identifier..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-bg-elevated border border-border-subtle rounded-lg pl-8 pr-3 py-1.5 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-amber-forensic"
              />
            </div>
            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              className="bg-bg-elevated border border-border-subtle rounded-lg px-2.5 py-1.5 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-amber-forensic"
            >
              <option value="all">All Risk Levels</option>
              <option value="critical">Critical Risk</option>
              <option value="high">High Risk</option>
              <option value="medium">Medium Risk</option>
              <option value="low">Low Risk</option>
            </select>
          </div>
        </Card>
      </div>

      {/* Entities Grid */}
      {filteredEntities.length === 0 ? (
        <EmptyState
          title="No Entities Found"
          description="Adjust your search criteria or register a new target entity."
          actionLabel="Register Entity"
          onAction={() => setIsModalOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEntities.map((ent) => {
            const styling = ENTITY_COLORS[ent.entity_type] || {
              bg: 'bg-slate-500/10',
              text: 'text-slate-400',
              border: 'border-slate-500/30',
              hex: '#94A3B8',
            }

            return (
              <Card
                key={ent.id}
                onClick={() => navigate(`/entities/${ent.id}`)}
                interactive
                className="p-4 bg-bg-secondary/90 border-border-subtle hover:border-amber-forensic/40 flex flex-col justify-between space-y-3 group"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase font-semibold ${styling.bg} ${styling.text} ${styling.border}`}
                    >
                      {ent.entity_type}
                    </span>
                    {ent.risk_level && (
                      <span className={`badge ${SEVERITY_BADGES[ent.risk_level] || 'badge-gray'} text-[9px]`}>
                        {ent.risk_level.toUpperCase()} RISK
                      </span>
                    )}
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-text-primary group-hover:text-amber-light transition-colors truncate">
                      {ent.label || ent.name}
                    </h3>
                    <p className="text-[11px] text-text-muted font-mono truncate mt-0.5">
                      {ent.identifier || ent.normalized_value || 'No identifier recorded'}
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-border-subtle/60 flex items-center justify-between text-[11px] text-text-muted font-mono">
                  <div className="flex items-center gap-1.5">
                    {ent.is_verified ? (
                      <span className="flex items-center gap-1 text-emerald-400">
                        <CheckCircle2 className="w-3 h-3" /> Verified
                      </span>
                    ) : (
                      <span className="text-amber-400 font-sans text-[10px]">Unverified Lead</span>
                    )}
                  </div>
                  <span className="flex items-center gap-1 group-hover:text-amber-forensic transition-colors">
                    Dossier <ExternalLink className="w-3 h-3" />
                  </span>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Modal: Register Entity */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Register New Entity Record"
        subtitle="POST /api/entities — Add a verified or unverified entity node into the investigation database."
        maxWidth="md"
      >
        <form onSubmit={handleCreateEntity} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-text-secondary">Entity Type</label>
            <select
              value={entityType}
              onChange={(e) => setEntityType(e.target.value as EntityType)}
              className="w-full bg-bg-elevated border border-border-subtle rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-amber-forensic"
            >
              <option value="person">Person (Suspect, Witness, Broker)</option>
              <option value="phone">Phone Number (MSISDN, Burner, VoIP)</option>
              <option value="vehicle">Vehicle (License Plate, VIN)</option>
              <option value="location">Location (Terminal, Warehouse, Address)</option>
              <option value="organization">Organization (Shell Co., Trust, Fleet)</option>
            </select>
          </div>

          <Input
            label="Entity Label / Name"
            placeholder="e.g., Viktor Vane, +1 (555) 019-2834, NY-772-K9"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            required
          />

          <Input
            label="Official Identifier / Code (Optional)"
            placeholder="e.g., PASSPORT-K99281, VIN-WDB463, CORP-REG-DE"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
          />

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-text-secondary">
                Investigation Scope
              </label>
              <select
                value={targetCaseId}
                onChange={(e) => setTargetCaseId(e.target.value)}
                className="w-full bg-bg-elevated border border-border-subtle rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-amber-forensic"
              >
                {cases.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.case_number}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-text-secondary">Risk Profile</label>
              <select
                value={riskLevel}
                onChange={(e) => setRiskLevel(e.target.value as any)}
                className="w-full bg-bg-elevated border border-border-subtle rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-amber-forensic"
              >
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-border-subtle">
            <Button type="button" variant="ghost" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
              Register Entity
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
