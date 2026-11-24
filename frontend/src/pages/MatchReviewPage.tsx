import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  GitCompare,
  CheckCircle2,
  XCircle,
  Plus,
  ArrowRight,
  ShieldAlert,
  Info,
  Calendar,
  User,
  Sliders,
  ExternalLink,
} from 'lucide-react';
import {
  fetchAllMatchCandidates,
  createMatchCandidate,
  reviewMatchCandidate,
  fetchAliasesByEntity,
} from '../api';
import { Card, CardHeader, CardTitle, CardDescription } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { Input, Select, Textarea } from '../components/common/FormFields';
import { StatusBadge, EntityTypeBadge, VerificationBadge } from '../components/common/Badge';
import { useEntityMap } from '../context/EntityMapContext';
import { useToast } from '../context/ToastContext';
import { getErrorMessage } from '../api/client';
import type {
  EntityMatchCandidate,
  CandidateStatus,
  CreateMatchCandidatePayload,
  ReviewCandidatePayload,
} from '../types';

export const MatchReviewPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { entities, getEntity, getEntityName } = useEntityMap();
  const { success, error: toastError } = useToast();

  const [activeTab, setActiveTab] = useState<CandidateStatus>('pending');
  const [selectedCandidate, setSelectedCandidate] = useState<EntityMatchCandidate | null>(null);

  // Review modal state
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [reviewAction, setReviewAction] = useState<'accepted' | 'rejected'>('accepted');
  const [reviewNotes, setReviewNotes] = useState('');
  const [reviewedBy, setReviewedBy] = useState('');

  // Create candidate modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<{
    entity_id_1: string;
    entity_id_2: string;
    similarity_score: number;
    explanationKey: string;
    explanationVal: string;
  }>({
    entity_id_1: '',
    entity_id_2: '',
    similarity_score: 0.85,
    explanationKey: 'reason',
    explanationVal: 'Shared phone prefix and matching location alias',
  });

  const { data: allCandidates = [], isLoading } = useQuery({
    queryKey: ['match-candidates'],
    queryFn: fetchAllMatchCandidates,
  });

  // Query aliases for the selected candidate's entities to do side-by-side alias comparison
  const { data: aliases1 = [] } = useQuery({
    queryKey: ['entity-aliases', selectedCandidate?.entity_id_1],
    queryFn: () => fetchAliasesByEntity(selectedCandidate!.entity_id_1),
    enabled: !!selectedCandidate?.entity_id_1,
  });

  const { data: aliases2 = [] } = useQuery({
    queryKey: ['entity-aliases', selectedCandidate?.entity_id_2],
    queryFn: () => fetchAliasesByEntity(selectedCandidate!.entity_id_2),
    enabled: !!selectedCandidate?.entity_id_2,
  });

  // Tab counts
  const pendingCount = useMemo(() => allCandidates.filter((c) => c.status === 'pending').length, [allCandidates]);
  const acceptedCount = useMemo(() => allCandidates.filter((c) => c.status === 'accepted').length, [allCandidates]);
  const rejectedCount = useMemo(() => allCandidates.filter((c) => c.status === 'rejected').length, [allCandidates]);

  // Queue filtered by status and sorted by score descending
  const currentQueue = useMemo(() => {
    return allCandidates
      .filter((c) => c.status === activeTab)
      .sort((a, b) => b.similarity_score - a.similarity_score);
  }, [allCandidates, activeTab]);

  // If active queue changes and no candidate is selected, select the first
  React.useEffect(() => {
    if (currentQueue.length > 0 && (!selectedCandidate || selectedCandidate.status !== activeTab)) {
      setSelectedCandidate(currentQueue[0]);
    } else if (currentQueue.length === 0) {
      setSelectedCandidate(null);
    }
  }, [currentQueue, activeTab]);

  // Helper for UUID check per Supabase postgres uuid column
  const isValidUuid = (val?: string) =>
    !!val && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val.trim());

  // Mutations
  const reviewMutation = useMutation({
    mutationFn: () => {
      if (!selectedCandidate) throw new Error('No candidate selected');
      const reviewerStr = reviewedBy.trim();
      const notesStr = reviewNotes.trim();
      const payload: ReviewCandidatePayload = {
        status: reviewAction,
        review_notes: notesStr
          ? reviewerStr && !isValidUuid(reviewerStr)
            ? `[Reviewer: ${reviewerStr}] ${notesStr}`
            : notesStr
          : reviewerStr && !isValidUuid(reviewerStr)
          ? `[Reviewer: ${reviewerStr}]`
          : undefined,
        reviewed_by: isValidUuid(reviewerStr) ? reviewerStr : undefined,
      };
      return reviewMatchCandidate(selectedCandidate.id, payload);
    },
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['match-candidates'] });
      success(`Candidate review recorded as "${updated.status}"`);
      setIsReviewOpen(false);
      setReviewNotes('');
      setReviewedBy('');
    },
    onError: (err) => {
      toastError(getErrorMessage(err), 'Failed to submit review');
    },
  });

  const createMutation = useMutation({
    mutationFn: () => {
      if (!createForm.entity_id_1 || !createForm.entity_id_2) {
        throw new Error('Please select both entities');
      }
      if (createForm.entity_id_1 === createForm.entity_id_2) {
        throw new Error('Entities must differ');
      }
      const score = Number(createForm.similarity_score);
      if (isNaN(score) || score < 0 || score > 1) {
        throw new Error('Similarity score must be between 0 and 1');
      }

      const payload: CreateMatchCandidatePayload = {
        entity_id_1: createForm.entity_id_1,
        entity_id_2: createForm.entity_id_2,
        similarity_score: score,
      };
      if (createForm.explanationKey.trim() && createForm.explanationVal.trim()) {
        payload.explanation = {
          [createForm.explanationKey.trim()]: createForm.explanationVal.trim(),
        };
      }
      return createMatchCandidate(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['match-candidates'] });
      success('Duplicate match candidate created successfully');
      setIsCreateOpen(false);
      setCreateForm({
        entity_id_1: '',
        entity_id_2: '',
        similarity_score: 0.85,
        explanationKey: 'reason',
        explanationVal: '',
      });
    },
    onError: (err) => {
      toastError(getErrorMessage(err), 'Failed to create candidate');
    },
  });

  // Entities for comparison
  const entity1 = selectedCandidate ? getEntity(selectedCandidate.entity_id_1) : undefined;
  const entity2 = selectedCandidate ? getEntity(selectedCandidate.entity_id_2) : undefined;

  // Client-side attribute comparison
  const attributeComparison = useMemo(() => {
    if (!entity1 || !entity2) return [];
    const attr1 = entity1.attributes || {};
    const attr2 = entity2.attributes || {};

    const allKeys = Array.from(new Set([...Object.keys(attr1), ...Object.keys(attr2)]));
    return allKeys.map((key) => {
      const val1 = attr1[key];
      const val2 = attr2[key];
      const bothPresent = val1 !== undefined && val2 !== undefined;
      const isMatch = bothPresent && String(val1).trim().toLowerCase() === String(val2).trim().toLowerCase();
      const isConflict = bothPresent && !isMatch;

      return {
        key,
        val1: val1 !== undefined ? String(val1) : '—',
        val2: val2 !== undefined ? String(val2) : '—',
        isMatch,
        isConflict,
      };
    });
  }, [entity1, entity2]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-text-primary">Entity Match Review</h2>
          <p className="text-sm text-text-secondary mt-1">
            Evaluate suspected duplicate entity pairs and record adjudication decisions.
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} icon={<Plus className="w-4 h-4" />}>
          Create Candidate
        </Button>
      </div>

      {/* Mandatory Disclosure Alert per prompt */}
      <div className="p-3.5 rounded-lg bg-surface-raised border border-border-subtle flex items-start gap-3 text-xs text-text-secondary">
        <Info className="w-4 h-4 text-accent shrink-0 mt-0.5" />
        <div>
          <strong className="text-text-primary">Adjudication Policy:</strong> Accepting records the decision only;
          entities are not merged automatically in the database. Nothing generates candidates automatically.
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-border pb-3">
        <button
          onClick={() => setActiveTab('pending')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
            activeTab === 'pending'
              ? 'bg-accent/15 text-accent font-semibold border border-accent/25'
              : 'text-text-secondary hover:text-text-primary hover:bg-surface-raised'
          }`}
        >
          <span>Pending Queue</span>
          <span className="px-1.5 py-0.2 rounded-full bg-status-warning/20 text-status-warning text-xs font-mono font-bold tabular-nums">
            {pendingCount}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('accepted')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
            activeTab === 'accepted'
              ? 'bg-accent/15 text-accent font-semibold border border-accent/25'
              : 'text-text-secondary hover:text-text-primary hover:bg-surface-raised'
          }`}
        >
          <span>Accepted Matches</span>
          <span className="px-1.5 py-0.2 rounded-full bg-status-success/20 text-status-success text-xs font-mono tabular-nums">
            {acceptedCount}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('rejected')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
            activeTab === 'rejected'
              ? 'bg-accent/15 text-accent font-semibold border border-accent/25'
              : 'text-text-secondary hover:text-text-primary hover:bg-surface-raised'
          }`}
        >
          <span>Rejected Pairs</span>
          <span className="px-1.5 py-0.2 rounded-full bg-status-error/20 text-status-error text-xs font-mono tabular-nums">
            {rejectedCount}
          </span>
        </button>
      </div>

      {/* Main Two-Column View: Left (Queue) & Right (Side-by-Side Comparison) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (5 cols): Candidate Queue */}
        <div className="lg:col-span-5 space-y-3">
          <div className="text-xs font-semibold uppercase text-text-muted px-1 flex items-center justify-between">
            <span>Candidates Queue (Sorted by Score)</span>
            <span className="tabular-nums font-mono text-[11px]">{currentQueue.length} items</span>
          </div>

          {isLoading ? (
            <div className="space-y-3 animate-pulse">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-24 bg-surface border border-border rounded-card p-4" />
              ))}
            </div>
          ) : currentQueue.length === 0 ? (
            <Card className="text-center py-12">
              <GitCompare className="w-8 h-8 text-text-muted mx-auto mb-2" />
              <div className="text-sm font-medium text-text-primary">No {activeTab} candidates</div>
              <div className="text-xs text-text-secondary mt-1">
                {activeTab === 'pending'
                  ? 'All duplicate pairs have been resolved.'
                  : `No candidate pairs have status "${activeTab}".`}
              </div>
            </Card>
          ) : (
            currentQueue.map((item) => {
              const isSelected = selectedCandidate?.id === item.id;
              const pct = Math.round(item.similarity_score * 100);
              const name1 = getEntityName(item.entity_id_1);
              const name2 = getEntityName(item.entity_id_2);

              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedCandidate(item)}
                  className={`p-4 rounded-card border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-surface-raised border-accent shadow-glow'
                      : 'bg-surface border-border hover:border-border-strong hover:bg-surface-raised/40'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span
                      className={`font-mono text-xs font-bold px-2 py-0.5 rounded border tabular-nums ${
                        pct >= 85
                          ? 'bg-status-success/20 text-status-success border-status-success/30'
                          : pct >= 65
                          ? 'bg-status-warning/20 text-status-warning border-status-warning/30'
                          : 'bg-surface-raised text-text-muted border-border'
                      }`}
                    >
                      {pct}% Match
                    </span>
                    <StatusBadge status={item.status} />
                  </div>

                  <div className="space-y-1">
                    <div className="text-sm font-semibold text-text-primary truncate">{name1}</div>
                    <div className="text-xs text-text-muted flex items-center gap-1.5">
                      <span>vs</span>
                      <span className="text-text-secondary font-medium truncate">{name2}</span>
                    </div>
                  </div>

                  {item.explanation && Object.keys(item.explanation).length > 0 && (
                    <div className="text-[11px] text-text-muted mt-2 truncate bg-bg-canvas/50 px-2 py-1 rounded">
                      {Object.entries(item.explanation)
                        .map(([k, v]) => `${k}: ${v}`)
                        .join(' • ')}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Right Column (7 cols): Side-by-Side Comparison */}
        <div className="lg:col-span-7">
          {!selectedCandidate ? (
            <Card className="h-full flex flex-col items-center justify-center text-center p-12">
              <GitCompare className="w-10 h-10 text-text-muted mb-3" />
              <div className="text-base font-semibold text-text-primary">No candidate selected</div>
              <p className="text-xs text-text-secondary max-w-sm mt-1">
                Select an entity pair from the queue on the left to inspect side-by-side attributes and submit an
                adjudication review.
              </p>
            </Card>
          ) : (
            <div className="space-y-6">
              {/* Review Action Toolbar (if pending) */}
              <Card className="border-border">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold font-mono text-accent tabular-nums">
                        {Math.round(selectedCandidate.similarity_score * 100)}%
                      </span>
                      <span className="text-sm font-semibold text-text-primary">Similarity Confidence</span>
                    </div>
                    <div className="text-xs text-text-muted mt-0.5">
                      Candidate ID: <code className="font-mono text-text-secondary">{selectedCandidate.id}</code>
                    </div>
                  </div>

                  {selectedCandidate.status === 'pending' ? (
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          setReviewAction('rejected');
                          setIsReviewOpen(true);
                        }}
                        icon={<XCircle className="w-4 h-4 text-status-error" />}
                      >
                        Reject Pair
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => {
                          setReviewAction('accepted');
                          setIsReviewOpen(true);
                        }}
                        icon={<CheckCircle2 className="w-4 h-4" />}
                      >
                        Accept Match
                      </Button>
                    </div>
                  ) : (
                    <div className="p-2.5 rounded-lg bg-surface-raised border border-border text-xs space-y-1">
                      <div className="flex items-center gap-2">
                        <StatusBadge status={selectedCandidate.status} />
                        <span className="text-text-muted">
                          by <strong className="text-text-primary">{selectedCandidate.reviewed_by || 'Analyst'}</strong>
                        </span>
                      </div>
                      {selectedCandidate.reviewed_at && (
                        <div className="text-[11px] text-text-muted tabular-nums">
                          On {new Date(selectedCandidate.reviewed_at).toLocaleString()}
                        </div>
                      )}
                      {selectedCandidate.review_notes && (
                        <div className="text-text-secondary text-[11px] italic">
                          "{selectedCandidate.review_notes}"
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Explanation Key/Value */}
                {selectedCandidate.explanation && Object.keys(selectedCandidate.explanation).length > 0 && (
                  <div className="mt-4 pt-4 border-t border-border">
                    <div className="text-xs font-semibold uppercase text-text-muted mb-2">Detection Explanation:</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {Object.entries(selectedCandidate.explanation).map(([k, v]) => (
                        <div key={k} className="p-2 rounded bg-surface-raised text-xs">
                          <span className="font-medium text-text-secondary">{k}: </span>
                          <span className="text-text-primary">{typeof v === 'object' ? JSON.stringify(v) : String(v)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Card>

              {/* Side-by-Side Comparison Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Entity 1 */}
                <Card className="border-border">
                  <div className="text-xs font-semibold uppercase text-text-muted mb-2 flex items-center justify-between">
                    <span>Entity 1</span>
                    {entity1 && <EntityTypeBadge type={entity1.entity_type} />}
                  </div>
                  <h4 className="text-lg font-bold text-text-primary tracking-tight">
                    {entity1?.canonical_name || getEntityName(selectedCandidate.entity_id_1)}
                  </h4>
                  <div className="text-[11px] font-mono text-text-muted truncate mt-0.5">
                    {selectedCandidate.entity_id_1}
                  </div>

                  {entity1 && (
                    <div className="mt-4 pt-3 border-t border-border-subtle space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-text-muted">Verification:</span>
                        <VerificationBadge status={entity1.verification_status} />
                      </div>
                      <div className="flex justify-between">
                        <span className="text-text-muted">Aliases:</span>
                        <span className="text-text-primary font-medium">{aliases1.map((a) => a.alias_name).join(', ') || 'None'}</span>
                      </div>
                    </div>
                  )}
                </Card>

                {/* Entity 2 */}
                <Card className="border-border">
                  <div className="text-xs font-semibold uppercase text-text-muted mb-2 flex items-center justify-between">
                    <span>Entity 2</span>
                    {entity2 && <EntityTypeBadge type={entity2.entity_type} />}
                  </div>
                  <h4 className="text-lg font-bold text-text-primary tracking-tight">
                    {entity2?.canonical_name || getEntityName(selectedCandidate.entity_id_2)}
                  </h4>
                  <div className="text-[11px] font-mono text-text-muted truncate mt-0.5">
                    {selectedCandidate.entity_id_2}
                  </div>

                  {entity2 && (
                    <div className="mt-4 pt-3 border-t border-border-subtle space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-text-muted">Verification:</span>
                        <VerificationBadge status={entity2.verification_status} />
                      </div>
                      <div className="flex justify-between">
                        <span className="text-text-muted">Aliases:</span>
                        <span className="text-text-primary font-medium">{aliases2.map((a) => a.alias_name).join(', ') || 'None'}</span>
                      </div>
                    </div>
                  )}
                </Card>
              </div>

              {/* Attributes Comparison Table: Matching in green, conflicting in amber */}
              <Card>
                <CardHeader>
                  <CardTitle>Attribute Comparison</CardTitle>
                  <CardDescription>
                    Matching attributes highlighted in green; conflicting values in amber.
                  </CardDescription>
                </CardHeader>

                {attributeComparison.length === 0 ? (
                  <div className="py-8 text-center text-xs text-text-muted">
                    No custom attributes present on either entity to compare.
                  </div>
                ) : (
                  <div className="divide-y divide-border-subtle">
                    <div className="grid grid-cols-3 text-xs font-semibold uppercase text-text-muted pb-2">
                      <span>Attribute Key</span>
                      <span>Entity 1 Value</span>
                      <span>Entity 2 Value</span>
                    </div>

                    {attributeComparison.map((row) => (
                      <div
                        key={row.key}
                        className={`grid grid-cols-3 py-3 text-xs items-center px-2 -mx-2 rounded transition-colors ${
                          row.isMatch
                            ? 'bg-[#064E3B]/20 text-[#34D399]'
                            : row.isConflict
                            ? 'bg-[#78350F]/20 text-[#FBBF24]'
                            : 'text-text-secondary'
                        }`}
                      >
                        <span className="font-mono font-medium text-text-primary">{row.key}</span>
                        <span className="font-mono break-all">{row.val1}</span>
                        <span className="font-mono break-all">{row.val2}</span>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>
          )}
        </div>
      </div>

      {/* Review Dialog */}
      <Modal
        isOpen={isReviewOpen}
        onClose={() => setIsReviewOpen(false)}
        title={`Adjudicate Candidate: ${reviewAction === 'accepted' ? 'Accept Match' : 'Reject Pair'}`}
        description="Record your analytical decision in the audit log."
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            reviewMutation.mutate();
          }}
          className="space-y-4"
        >
          <div className="p-3 rounded-lg bg-surface-raised border border-border text-xs">
            <span className="text-text-muted">Decision: </span>
            <strong className={reviewAction === 'accepted' ? 'text-status-success' : 'text-status-error'}>
              {reviewAction.toUpperCase()}
            </strong>
          </div>

          <Input
            label="Reviewer Identifier / Name"
            placeholder="e.g. Lead Analyst Vance"
            value={reviewedBy}
            onChange={(e) => setReviewedBy(e.target.value)}
          />

          <Textarea
            label="Review Notes / Rationale"
            rows={3}
            placeholder="Analytical reasoning for accepting or rejecting this duplicate hypothesis..."
            value={reviewNotes}
            onChange={(e) => setReviewNotes(e.target.value)}
          />

          <p className="text-[11px] text-text-muted">
            Remember: Accepting records the decision only; entities are not merged.
          </p>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
            <Button type="button" variant="secondary" onClick={() => setIsReviewOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant={reviewAction === 'rejected' ? 'danger' : 'primary'}
              isLoading={reviewMutation.isPending}
            >
              Submit Decision
            </Button>
          </div>
        </form>
      </Modal>

      {/* Create Candidate Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create Match Candidate"
        description="Manually flag two entities as suspected duplicates for analyst adjudication."
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createMutation.mutate();
          }}
          className="space-y-4"
        >
          <Select
            label="Entity 1"
            required
            value={createForm.entity_id_1}
            onChange={(e) => setCreateForm({ ...createForm, entity_id_1: e.target.value })}
          >
            <option value="">-- Choose first entity --</option>
            {entities.map((e) => (
              <option key={e.id} value={e.id}>
                {e.canonical_name} ({e.entity_type})
              </option>
            ))}
          </Select>

          <Select
            label="Entity 2"
            required
            value={createForm.entity_id_2}
            onChange={(e) => setCreateForm({ ...createForm, entity_id_2: e.target.value })}
          >
            <option value="">-- Choose second entity --</option>
            {entities
              .filter((e) => e.id !== createForm.entity_id_1)
              .map((e) => (
                <option key={e.id} value={e.id}>
                  {e.canonical_name} ({e.entity_type})
                </option>
              ))}
          </Select>

          <Input
            label="Similarity Score (0.00 – 1.00)"
            type="number"
            step="0.01"
            min="0"
            max="1"
            required
            value={createForm.similarity_score}
            onChange={(e) => setCreateForm({ ...createForm, similarity_score: parseFloat(e.target.value) || 0 })}
            helperText="Floating point confidence score"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Explanation Key"
              placeholder="e.g. reason, match_algorithm"
              value={createForm.explanationKey}
              onChange={(e) => setCreateForm({ ...createForm, explanationKey: e.target.value })}
            />
            <Input
              label="Explanation Value"
              placeholder="e.g. Identical phone prefix & alias"
              value={createForm.explanationVal}
              onChange={(e) => setCreateForm({ ...createForm, explanationVal: e.target.value })}
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
            <Button type="button" variant="secondary" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={createMutation.isPending}>
              Create Candidate
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
