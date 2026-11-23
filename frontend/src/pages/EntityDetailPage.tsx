import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, useOutletContext } from 'react-router-dom'
import {
  Users,
  ArrowLeft,
  Network,
  GitBranch,
  FileText,
  Shield,
  Tag,
  Plus,
  Trash2,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  FolderOpen,
} from 'lucide-react'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Modal } from '../components/ui/Modal'
import { Input } from '../components/ui/Input'
import { EmptyState } from '../components/ui/EmptyState'
import { LoadingState } from '../components/ui/LoadingState'
import { entitiesService } from '../services/entitiesService'
import { graphService } from '../services/graphService'
import { documentsService } from '../services/documentsService'
import {
  DEMO_ENTITIES,
  DEMO_RELATIONSHIPS,
  DEMO_DOCUMENTS,
  DEMO_CASES,
} from '../data/demoData'
import { Entity, Relationship, DocumentItem, EntityAlias, Case } from '../types'
import {
  formatDate,
  formatRelativeTime,
  ENTITY_COLORS,
  SEVERITY_BADGES,
} from '../lib/utils'

export const EntityDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { cases, isLiveApi } = useOutletContext<{ cases: Case[]; isLiveApi: boolean }>()

  const [entity, setEntity] = useState<Entity | null>(null)
  const [relationships, setRelationships] = useState<Relationship[]>([])
  const [documents, setDocuments] = useState<DocumentItem[]>([])
  const [aliases, setAliases] = useState<EntityAlias[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Alias modal
  const [isAliasModalOpen, setIsAliasModalOpen] = useState(false)
  const [newAlias, setNewAlias] = useState('')
  const [aliasType, setAliasType] = useState('known_alias')
  const [isSubmittingAlias, setIsSubmittingAlias] = useState(false)

  useEffect(() => {
    async function loadEntityDossier() {
      setIsLoading(true)
      try {
        if (isLiveApi && id) {
          const ent = await entitiesService.getEntityById(id)
          setEntity(ent)

          const [relRes, aliasRes] = await Promise.allSettled([
            entitiesService.getEntityRelationships(id),
            entitiesService.getEntityAliases(),
          ])

          if (relRes.status === 'fulfilled') setRelationships(relRes.value)
          if (aliasRes.status === 'fulfilled') {
            setAliases(aliasRes.value.filter((a) => a.entity_id === id))
          }
        } else {
          const found = DEMO_ENTITIES.find((e) => e.id === id) || DEMO_ENTITIES[0]
          setEntity(found)
          setRelationships(
            DEMO_RELATIONSHIPS.filter(
              (r) => r.source_entity_id === found.id || r.target_entity_id === found.id
            )
          )
          setDocuments(DEMO_DOCUMENTS.filter((d) => d.case_id === found.case_id))
          // Mock aliases
          setAliases([
            { id: 'al-1', entity_id: found.id, alias: 'Apex Leader', alias_type: 'Moniker' },
            { id: 'al-2', entity_id: found.id, alias: 'V. Vanov', alias_type: 'Passport Alias' },
          ])
        }
      } catch (err) {
        console.warn('Fallback entity details', err)
        const found = DEMO_ENTITIES.find((e) => e.id === id) || DEMO_ENTITIES[0]
        setEntity(found)
      } finally {
        setIsLoading(false)
      }
    }

    loadEntityDossier()
  }, [id, isLiveApi])

  const handleAddAlias = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newAlias.trim() || !entity) return

    setIsSubmittingAlias(true)
    try {
      if (isLiveApi) {
        const created = await entitiesService.createEntityAlias({
          entity_id: entity.id,
          alias: newAlias.trim(),
          alias_type: aliasType,
        })
        setAliases((prev) => [...prev, created])
      } else {
        const synthetic: EntityAlias = {
          id: `alias-${Date.now()}`,
          entity_id: entity.id,
          alias: newAlias.trim(),
          alias_type: aliasType,
          created_at: new Date().toISOString(),
        }
        setAliases((prev) => [...prev, synthetic])
      }
      setIsAliasModalOpen(false)
      setNewAlias('')
    } catch (e) {
      console.error(e)
    } finally {
      setIsSubmittingAlias(false)
    }
  }

  const handleDeleteAlias = async (aliasId: string) => {
    try {
      if (isLiveApi) {
        await entitiesService.deleteEntityAlias(aliasId)
      }
      setAliases((prev) => prev.filter((a) => a.id !== aliasId))
    } catch (e) {
      console.error(e)
    }
  }

  if (isLoading) return <LoadingState message="Retrieving Entity Intelligence Profile..." />

  if (!entity) {
    return (
      <EmptyState
        title="Entity Not Found"
        description="The requested entity record does not exist in the intelligence database."
        actionLabel="Back to Entities"
        onAction={() => navigate('/entities')}
      />
    )
  }

  const styling = ENTITY_COLORS[entity.entity_type] || {
    bg: 'bg-slate-500/10',
    text: 'text-slate-400',
    border: 'border-slate-500/30',
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Breadcrumb */}
      <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
        <button
          onClick={() => navigate('/entities')}
          className="flex items-center gap-2 text-xs font-mono text-text-muted hover:text-amber-forensic transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>RETURN TO ENTITY CATALOG</span>
        </button>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="primary"
            onClick={() => navigate(`/link-analysis?node=${entity.id}`)}
            icon={<Network className="w-3.5 h-3.5" />}
            className="text-xs font-mono"
          >
            Locate in Graph
          </Button>
        </div>
      </div>

      {/* Entity Profile Card */}
      <Card className="p-6 bg-bg-secondary/90 border-border-subtle space-y-4">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded border uppercase ${styling.bg} ${styling.text} ${styling.border}`}
              >
                {entity.entity_type}
              </span>
              {entity.risk_level && (
                <span className={`badge ${SEVERITY_BADGES[entity.risk_level] || 'badge-gray'}`}>
                  RISK: {entity.risk_level.toUpperCase()}
                </span>
              )}
              {entity.is_verified ? (
                <span className="badge badge-green flex items-center gap-1 font-mono">
                  <CheckCircle2 className="w-3 h-3" /> VERIFIED IDENTITY
                </span>
              ) : (
                <span className="badge badge-amber font-mono">UNVERIFIED LEAD</span>
              )}
            </div>

            <h1 className="text-2xl font-bold text-text-primary tracking-tight">
              {entity.label || entity.name}
            </h1>
            <p className="text-xs font-mono text-text-muted">
              Identifier: {entity.identifier || entity.normalized_value || 'None assigned'}
            </p>
          </div>

          <div className="p-3 rounded-lg bg-bg-elevated/50 border border-border-subtle text-xs font-mono space-y-1 min-w-[220px]">
            <div className="flex justify-between">
              <span className="text-text-muted">Indexed Date:</span>
              <span className="text-text-primary">{formatDate(entity.created_at)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted">Associated Dossier:</span>
              <span className="text-amber-forensic font-bold">{entity.case_id || 'Cross-Case'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted">Confidence:</span>
              <span className="text-emerald-400 font-bold">
                {Math.round((entity.confidence_score || 0.95) * 100)}%
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Two Column Layout: Attributes/Aliases & Relationships/Documents */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Attributes and Aliases (5 Cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Attributes */}
          <Card className="p-5 bg-bg-secondary/80 border-border-subtle space-y-3">
            <h3 className="text-sm font-semibold text-text-primary">Recorded Attributes</h3>
            {entity.attributes && Object.keys(entity.attributes).length > 0 ? (
              <div className="space-y-2 text-xs">
                {Object.entries(entity.attributes).map(([k, v]) => (
                  <div
                    key={k}
                    className="p-2.5 rounded bg-bg-elevated/40 border border-border-subtle/50 flex flex-col gap-1"
                  >
                    <span className="text-[10px] text-text-muted uppercase font-mono tracking-wider">
                      {k.replace(/_/g, ' ')}
                    </span>
                    <span className="font-mono text-text-primary">
                      {Array.isArray(v) ? v.join(', ') : String(v)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-text-muted italic">No extended attributes recorded.</p>
            )}
          </Card>

          {/* Aliases & Known Monikers */}
          <Card className="p-5 bg-bg-secondary/80 border-border-subtle space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-text-primary">
                Aliases & Monikers ({aliases.length})
              </h3>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setIsAliasModalOpen(true)}
                icon={<Plus className="w-3.5 h-3.5" />}
                className="text-xs"
              >
                Add Alias
              </Button>
            </div>

            <div className="space-y-2">
              {aliases.length === 0 ? (
                <p className="text-xs text-text-muted italic">No recorded aliases or monikers.</p>
              ) : (
                aliases.map((al) => (
                  <div
                    key={al.id}
                    className="p-2.5 rounded bg-bg-elevated/40 border border-border-subtle flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-semibold text-text-primary font-mono">{al.alias}</span>
                      {al.alias_type && (
                        <p className="text-[10px] text-text-muted">{al.alias_type}</p>
                      )}
                    </div>
                    <button
                      onClick={() => handleDeleteAlias(al.id)}
                      className="text-text-muted hover:text-rose-400 transition-colors p-1"
                      title="Remove alias"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        {/* Right: Relationships & Supporting Evidence (7 Cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Related Entities & Edges */}
          <Card className="p-5 bg-bg-secondary/80 border-border-subtle space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <GitBranch className="w-4 h-4 text-teal-forensic" />
                <h3 className="text-sm font-semibold text-text-primary">
                  Connected Entities & Relationships ({relationships.length})
                </h3>
              </div>
            </div>

            <div className="space-y-2.5">
              {relationships.length === 0 ? (
                <p className="text-xs text-text-muted italic p-4 text-center">
                  No verified relationships established in graph database.
                </p>
              ) : (
                relationships.map((rel) => {
                  const isSource = (rel.source_entity_id || rel.source_id) === entity.id
                  const peerId = isSource
                    ? rel.target_entity_id || rel.target_id
                    : rel.source_entity_id || rel.source_id

                  return (
                    <div
                      key={rel.id}
                      className="p-3 rounded-lg bg-bg-elevated/40 border border-border-subtle flex items-center justify-between hover:bg-bg-elevated/60 transition-colors text-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-amber-forensic font-semibold">{rel.relationship_type}</span>
                          <span className="text-text-muted text-[10px]">with</span>
                          <span
                            onClick={() => navigate(`/entities/${peerId}`)}
                            className="font-mono text-sky-400 font-bold hover:underline cursor-pointer"
                          >
                            {peerId}
                          </span>
                        </div>
                        {rel.notes && <p className="text-[11px] text-text-muted italic">{rel.notes}</p>}
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-mono text-text-muted">
                          {rel.evidence_count || 1} Evidence Records
                        </span>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </Card>

          {/* Related Documents */}
          <Card className="p-5 bg-bg-secondary/80 border-border-subtle space-y-3">
            <h3 className="text-sm font-semibold text-text-primary">Supporting Evidence Documents</h3>
            <div className="space-y-2">
              {documents.map((d) => (
                <div
                  key={d.id}
                  onClick={() => navigate('/documents')}
                  className="p-2.5 rounded bg-bg-elevated/30 hover:bg-bg-elevated/60 border border-border-subtle flex items-center justify-between text-xs cursor-pointer"
                >
                  <div className="flex items-center gap-2 truncate">
                    <FileText className="w-3.5 h-3.5 text-amber-forensic flex-shrink-0" />
                    <span className="font-medium text-text-primary truncate">{d.title || d.filename}</span>
                  </div>
                  <span className="text-[10px] font-mono text-text-muted">
                    {formatRelativeTime(d.created_at)}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Modal: Add Alias */}
      <Modal
        isOpen={isAliasModalOpen}
        onClose={() => setIsAliasModalOpen(false)}
        title="Register Entity Alias / Moniker"
        subtitle="POST /api/entity-aliases — Attach known aliases, cryptonyms, or alternate phonetic spellings."
        maxWidth="sm"
      >
        <form onSubmit={handleAddAlias} className="space-y-4">
          <Input
            label="Alias / Alternate Name"
            placeholder="e.g., The Broker, Victor Vanov"
            value={newAlias}
            onChange={(e) => setNewAlias(e.target.value)}
            required
          />

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-text-secondary">Alias Category</label>
            <select
              value={aliasType}
              onChange={(e) => setAliasType(e.target.value)}
              className="w-full bg-bg-elevated border border-border-subtle rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-amber-forensic"
            >
              <option value="known_alias">Known Street / Syndicate Moniker</option>
              <option value="passport_alias">Foreign Passport / Official ID Alias</option>
              <option value="cyber_handle">Darknet / Telegram / Cryptographic Handle</option>
              <option value="phonetic_variation">Phonetic / Transliterated Spelling</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-border-subtle">
            <Button type="button" variant="ghost" size="sm" onClick={() => setIsAliasModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={isSubmittingAlias}>
              Attach Alias
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
