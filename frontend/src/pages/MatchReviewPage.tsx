import React, { useState, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import {
  GitCompare,
  CheckCircle2,
  XCircle,
  Clock,
  HelpCircle,
  AlertTriangle,
  Shield,
  Layers,
  ChevronRight,
  ExternalLink,
  Sparkles,
} from 'lucide-react'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { EmptyState } from '../components/ui/EmptyState'
import { LoadingState } from '../components/ui/LoadingState'
import { matchCandidatesService } from '../services/matchCandidatesService'
import { DEMO_MATCH_CANDIDATES } from '../data/demoData'
import { EntityMatchCandidate, MatchReviewStatus, Case } from '../types'
import { formatDate, formatRelativeTime, ENTITY_COLORS } from '../lib/utils'

export const MatchReviewPage: React.FC = () => {
  const { isLiveApi } = useOutletContext<{ isLiveApi: boolean }>()

  const [candidates, setCandidates] = useState<EntityMatchCandidate[]>(DEMO_MATCH_CANDIDATES)
  const [selectedMatch, setSelectedMatch] = useState<EntityMatchCandidate | null>(
    DEMO_MATCH_CANDIDATES[0] || null
  )
  const [statusFilter, setStatusFilter] = useState<'all' | MatchReviewStatus>('all')
  const [isLoading, setIsLoading] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [reviewNotes, setReviewNotes] = useState('')
  const [updateFeedback, setUpdateFeedback] = useState<string | null>(null)

  const fetchCandidates = async () => {
    setIsLoading(true)
    try {
      if (isLiveApi) {
        const data = await matchCandidatesService.getMatchCandidates()
        if (data && data.length > 0) {
          setCandidates(data)
          setSelectedMatch(data[0])
        }
      }
    } catch (err) {
      console.warn('Failed to load match candidates from live backend', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchCandidates()
  }, [isLiveApi])

  const handleReviewAction = async (status: MatchReviewStatus) => {
    if (!selectedMatch) return
    setIsUpdating(true)
    setUpdateFeedback(null)

    try {
      if (isLiveApi) {
        const updated = await matchCandidatesService.reviewMatchCandidate(
          selectedMatch.id,
          status,
          reviewNotes.trim() || undefined
        )
        setCandidates((prev) =>
          prev.map((c) => (c.id === selectedMatch.id ? { ...c, ...updated, status } : c))
        )
        setSelectedMatch((prev) => (prev ? { ...prev, ...updated, status } : null))
      } else {
        // Synthetic state update
        setCandidates((prev) =>
          prev.map((c) =>
            c.id === selectedMatch.id
              ? {
                  ...c,
                  status,
                  reviewer_notes: reviewNotes.trim(),
                  reviewed_at: new Date().toISOString(),
                }
              : c
          )
        )
        setSelectedMatch((prev) =>
          prev
            ? {
                ...prev,
                status,
                reviewer_notes: reviewNotes.trim(),
                reviewed_at: new Date().toISOString(),
              }
            : null
        )
      }

      setUpdateFeedback(`Candidate status successfully marked as: ${status.toUpperCase()}`)
      setReviewNotes('')
    } catch (err: any) {
      setUpdateFeedback(`Error updating review status: ${err.message}`)
    } finally {
      setIsUpdating(false)
    }
  }

  const filteredCandidates = candidates.filter((c) =>
    statusFilter === 'all' ? true : c.status === statusFilter
  )

  const statusBadges: Record<MatchReviewStatus, string> = {
    pending: 'badge-amber',
    approved: 'badge-green',
    rejected: 'badge-red',
    further_review: 'badge-purple',
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-border-subtle">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-text-primary">
            Entity Match Candidate Review
          </h2>
          <p className="text-xs text-text-muted mt-0.5">
            Side-by-side probabilistic resolution workspace. Human verification required before confirming identity equivalence.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2">
          {(['all', 'pending', 'approved', 'rejected', 'further_review'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 rounded-lg text-xs font-mono font-medium border transition-colors cursor-pointer ${
                statusFilter === st
                  ? 'bg-amber-forensic/15 text-amber-forensic border-amber-forensic/40'
                  : 'bg-bg-secondary text-text-muted border-border-subtle hover:text-text-primary'
              }`}
            >
              {st === 'all' ? 'All Candidates' : st.replace('_', ' ').toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Left Pipeline (4 Cols), Right Comparison (8 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Candidates List Pipeline (4 Cols) */}
        <div className="lg:col-span-4 space-y-3">
          <Card className="p-3 bg-bg-secondary/80 border-border-subtle">
            <h3 className="text-xs font-mono uppercase tracking-wider text-text-muted mb-2">
              Match Pipeline Queue ({filteredCandidates.length})
            </h3>
            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
              {filteredCandidates.length === 0 ? (
                <p className="text-xs text-text-muted italic p-4 text-center">
                  No match candidates found.
                </p>
              ) : (
                filteredCandidates.map((c) => {
                  const isSelected = selectedMatch?.id === c.id
                  const score = Math.round((c.match_score || c.similarity_score || 0) * 100)

                  return (
                    <div
                      key={c.id}
                      onClick={() => setSelectedMatch(c)}
                      className={`p-3 rounded-lg border cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-amber-forensic/10 border-amber-forensic/50 shadow-sm'
                          : 'bg-bg-elevated/40 border-border-subtle hover:bg-bg-elevated/70'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className={`badge ${statusBadges[c.status]} text-[10px]`}>
                          {c.status.replace('_', ' ').toUpperCase()}
                        </span>
                        <span className="font-mono text-xs font-bold text-amber-forensic">
                          {score}% MATCH
                        </span>
                      </div>
                      <div className="text-xs font-medium text-text-primary truncate">
                        {c.entity_a?.name || c.entity_a?.label || c.entity_a_id}
                        <span className="text-text-muted font-mono mx-1.5">↔</span>
                        <span className="text-amber-light">
                          {c.entity_b?.name || c.entity_b?.label || c.entity_b_id}
                        </span>
                      </div>
                      <p className="text-[10px] text-text-muted font-mono mt-1">
                        {c.case_id || 'Cross-Case'} • {formatRelativeTime(c.created_at)}
                      </p>
                    </div>
                  )
                })
              )}
            </div>
          </Card>
        </div>

        {/* Side-by-Side Comparison Workspace (8 Cols) */}
        <div className="lg:col-span-8 space-y-4">
          {selectedMatch ? (
            <Card className="p-6 bg-bg-secondary/90 border-border-subtle space-y-6">
              {/* Match Header Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border-subtle">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-amber-forensic">
                      CANDIDATE #{selectedMatch.id}
                    </span>
                    <span className={`badge ${statusBadges[selectedMatch.status]}`}>
                      STATUS: {selectedMatch.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-text-primary">
                    Probabilistic Entity Resolution Comparison
                  </h3>
                </div>

                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-bg-elevated border border-border-subtle text-right">
                  <div>
                    <span className="text-xs font-mono font-bold text-amber-light">
                      {Math.round(
                        (selectedMatch.match_score || selectedMatch.similarity_score || 0) * 100
                      )}
                      %
                    </span>
                    <p className="text-[9px] text-text-muted font-mono uppercase">Confidence</p>
                  </div>
                </div>
              </div>

              {/* Side-by-Side Entities Comparison */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Entity A Card */}
                <div className="p-4 rounded-xl bg-bg-elevated/40 border border-border-subtle space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-bg-secondary text-text-muted uppercase border border-border-subtle">
                      Entity Record A (Primary)
                    </span>
                    <span className="text-[10px] font-mono text-text-muted">
                      {selectedMatch.entity_a?.case_id || selectedMatch.case_id || 'Case File A'}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-text-primary">
                      {selectedMatch.entity_a?.name ||
                        selectedMatch.entity_a?.label ||
                        selectedMatch.entity_a_id}
                    </h4>
                    <p className="text-xs font-mono text-text-muted mt-0.5">
                      {selectedMatch.entity_a?.identifier ||
                        selectedMatch.entity_a?.normalized_value ||
                        'No Identifier'}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-border-subtle/60 text-xs space-y-1.5">
                    <div className="flex justify-between text-text-muted">
                      <span>Type:</span>
                      <span className="font-mono text-amber-forensic uppercase">
                        {selectedMatch.entity_a?.entity_type || 'person'}
                      </span>
                    </div>
                    {selectedMatch.entity_a?.attributes &&
                      Object.entries(selectedMatch.entity_a.attributes).map(([k, v]) => (
                        <div key={k} className="flex justify-between text-text-muted">
                          <span className="capitalize">{k.replace(/_/g, ' ')}:</span>
                          <span className="font-mono text-text-primary">
                            {Array.isArray(v) ? v.join(', ') : String(v)}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Entity B Card */}
                <div className="p-4 rounded-xl bg-bg-elevated/40 border border-amber-forensic/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-forensic/10 text-amber-forensic uppercase border border-amber-forensic/30">
                      Entity Record B (Candidate)
                    </span>
                    <span className="text-[10px] font-mono text-text-muted">
                      {selectedMatch.entity_b?.case_id || 'Cross-Case Dossier'}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-amber-light">
                      {selectedMatch.entity_b?.name ||
                        selectedMatch.entity_b?.label ||
                        selectedMatch.entity_b_id}
                    </h4>
                    <p className="text-xs font-mono text-text-muted mt-0.5">
                      {selectedMatch.entity_b?.identifier ||
                        selectedMatch.entity_b?.normalized_value ||
                        'No Identifier'}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-border-subtle/60 text-xs space-y-1.5">
                    <div className="flex justify-between text-text-muted">
                      <span>Type:</span>
                      <span className="font-mono text-amber-forensic uppercase">
                        {selectedMatch.entity_b?.entity_type || 'person'}
                      </span>
                    </div>
                    {selectedMatch.entity_b?.attributes &&
                      Object.entries(selectedMatch.entity_b.attributes).map(([k, v]) => (
                        <div key={k} className="flex justify-between text-text-muted">
                          <span className="capitalize">{k.replace(/_/g, ' ')}:</span>
                          <span className="font-mono text-text-primary">
                            {Array.isArray(v) ? v.join(', ') : String(v)}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              </div>

              {/* Match Reasons & Discrepancies */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-mono font-semibold uppercase tracking-wider text-text-muted">
                  Heuristic & Attribute Breakdown
                </h4>

                {/* Matching Attributes */}
                <div className="p-3.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 space-y-1 text-xs">
                  <div className="flex items-center gap-1.5 text-emerald-400 font-bold font-mono">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Overlapping Matches:
                  </div>
                  {selectedMatch.match_reasons && selectedMatch.match_reasons.length > 0 ? (
                    <ul className="list-disc list-inside text-emerald-300/90 space-y-0.5 pl-1">
                      {selectedMatch.match_reasons.map((r, i) => (
                        <li key={i}>{r}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-text-muted italic">Fuzzy phonetic and token similarity</p>
                  )}
                </div>

                {/* Differing Attributes */}
                {selectedMatch.differing_attributes && (
                  <div className="p-3.5 rounded-lg bg-rose-500/10 border border-rose-500/20 space-y-1 text-xs">
                    <div className="flex items-center gap-1.5 text-rose-400 font-bold font-mono">
                      <XCircle className="w-3.5 h-3.5" /> Discrepant Attributes:
                    </div>
                    <div className="space-y-1 text-rose-300/90 pl-1">
                      {Object.entries(selectedMatch.differing_attributes).map(([k, v]) => (
                        <div key={k} className="flex gap-2">
                          <span className="font-semibold text-rose-300">{k}:</span>
                          <span>{String(v)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Analyst Decision & Notes */}
              <div className="p-4 rounded-xl bg-bg-elevated/50 border border-border-subtle space-y-3">
                <h4 className="text-xs font-semibold text-text-primary uppercase font-mono tracking-wider">
                  Analyst Verification Verdict
                </h4>
                <textarea
                  rows={2}
                  placeholder="Record justification notes for audit trail (e.g., biometric verification confirmed, distinct individual)..."
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  className="w-full bg-bg-secondary border border-border-subtle rounded-lg px-3 py-2 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-amber-forensic resize-none"
                />

                {updateFeedback && (
                  <p className="text-xs font-mono text-emerald-400 bg-emerald-500/10 p-2 rounded border border-emerald-500/20">
                    {updateFeedback}
                  </p>
                )}

                {/* 3 Supported Review Actions per specification */}
                <div className="flex flex-wrap items-center justify-end gap-2.5 pt-2">
                  <Button
                    size="sm"
                    variant="danger"
                    isLoading={isUpdating}
                    onClick={() => handleReviewAction('rejected')}
                    icon={<XCircle className="w-3.5 h-3.5" />}
                  >
                    Reject Match (Distinct Entities)
                  </Button>

                  <Button
                    size="sm"
                    variant="secondary"
                    isLoading={isUpdating}
                    onClick={() => handleReviewAction('further_review')}
                    icon={<Clock className="w-3.5 h-3.5 text-purple-400" />}
                  >
                    Require Further Review
                  </Button>

                  <Button
                    size="sm"
                    variant="primary"
                    isLoading={isUpdating}
                    onClick={() => handleReviewAction('approved')}
                    icon={<CheckCircle2 className="w-3.5 h-3.5" />}
                  >
                    Approve Match (Confirmed Equivalence)
                  </Button>
                </div>
              </div>
            </Card>
          ) : (
            <Card className="p-16 text-center text-xs text-text-muted border-dashed">
              Select a candidate match pair from the left queue to conduct comparison.
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
