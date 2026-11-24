import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  User,
  Users,
  ArrowLeft,
  Share2,
  PhoneCall,
  ArrowLeftRight,
  GitCompare,
  Plus,
  Trash2,
  ExternalLink,
  Shield,
  Clock,
  Calendar,
  AlertTriangle,
  Info,
  CheckCircle,
  XCircle,
  ArrowUpRight,
  ArrowDownLeft,
  FileText,
} from 'lucide-react';
import {
  fetchEntityById,
  fetchAliasesByEntity,
  createEntityAlias,
  deleteEntityAlias,
  fetchRelationshipsByEntity,
  createRelationship,
  fetchRelationshipEvidence,
  createRelationshipEvidence,
  fetchCallRecordsByEntity,
  fetchTransactionsByEntity,
  fetchAllMatchCandidates,
  fetchDocuments,
  fetchEntities,
} from '../api';
import { Card, CardHeader, CardTitle, CardDescription } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { Drawer } from '../components/common/Drawer';
import { Input, Select, Textarea } from '../components/common/FormFields';
import { EntityTypeBadge, VerificationBadge, StatusBadge } from '../components/common/Badge';
import { DataTable, Column } from '../components/common/DataTable';
import { CardSkeleton, TableSkeleton } from '../components/common/LoadingSkeleton';
import { ErrorMessage } from '../components/common/ErrorMessage';
import { useEntityMap } from '../context/EntityMapContext';
import { useToast } from '../context/ToastContext';
import { getErrorMessage } from '../api/client';
import type {
  Entity,
  EntityAlias,
  Relationship,
  Evidence,
  CallRecord,
  Transaction,
  EntityMatchCandidate,
  CreateRelationshipPayload,
  CreateEvidencePayload,
} from '../types';

export const EntityDetailPage: React.FC = () => {
  const { id = '' } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { entities, getEntityName } = useEntityMap();
  const { success, error: toastError } = useToast();

  const [activeTab, setActiveTab] = useState<
    'profile' | 'aliases' | 'relationships' | 'calls' | 'transactions' | 'matches'
  >('profile');

  // Alias modal
  const [isAddAliasOpen, setIsAddAliasOpen] = useState(false);
  const [aliasForm, setAliasForm] = useState({ alias_name: '', source_type: 'manual', added_by: '' });
  const [aliasToDelete, setAliasToDelete] = useState<EntityAlias | null>(null);

  // Relationship modal
  const [isAddRelOpen, setIsAddRelOpen] = useState(false);
  const [relForm, setRelForm] = useState({ counterpart_id: '', relationship_type: '' });

  // Evidence drawer state
  const [selectedRelForEvidence, setSelectedRelForEvidence] = useState<Relationship | null>(null);
  const [isAddEvidenceOpen, setIsAddEvidenceOpen] = useState(false);
  const [evidenceType, setEvidenceType] = useState<'document' | 'call' | 'transaction'>('document');
  const [evidenceSelectedRecordId, setEvidenceSelectedRecordId] = useState('');
  const [evidenceExplanation, setEvidenceExplanation] = useState('');

  // Queries
  const {
    data: entity,
    isLoading: entityLoading,
    error: entityError,
    refetch: refetchEntity,
  } = useQuery({
    queryKey: ['entities', id],
    queryFn: () => fetchEntityById(id),
    enabled: !!id,
    retry: 1,
  });

  const { data: aliases = [], isLoading: aliasesLoading } = useQuery({
    queryKey: ['entity-aliases', id],
    queryFn: () => fetchAliasesByEntity(id),
    enabled: !!id,
  });

  const { data: relationships = [], isLoading: relsLoading } = useQuery({
    queryKey: ['relationships', 'entity', id],
    queryFn: () => fetchRelationshipsByEntity(id),
    enabled: !!id,
  });

  const { data: callRecords = [], isLoading: callsLoading } = useQuery({
    queryKey: ['call-records', 'entity', id],
    queryFn: () => fetchCallRecordsByEntity(id),
    enabled: !!id,
  });

  const { data: transactions = [], isLoading: txLoading } = useQuery({
    queryKey: ['transactions', 'entity', id],
    queryFn: () => fetchTransactionsByEntity(id),
    enabled: !!id,
  });

  const { data: allCandidates = [], isLoading: candidatesLoading } = useQuery({
    queryKey: ['match-candidates'],
    queryFn: fetchAllMatchCandidates,
    enabled: !!id,
  });

  const { data: documents = [] } = useQuery({
    queryKey: ['documents'],
    queryFn: fetchDocuments,
    enabled: !!selectedRelForEvidence,
  });

  // Query evidence for selected relationship in drawer
  const { data: relEvidenceList = [], isLoading: evidenceLoading } = useQuery({
    queryKey: ['relationships', selectedRelForEvidence?.id, 'evidence'],
    queryFn: () => fetchRelationshipEvidence(selectedRelForEvidence!.id),
    enabled: !!selectedRelForEvidence,
  });

  // Filter match candidates for this entity client-side
  const entityCandidates = React.useMemo(() => {
    return allCandidates.filter((c) => c.entity_id_1 === id || c.entity_id_2 === id);
  }, [allCandidates, id]);

  // Mutations
  const addAliasMutation = useMutation({
    mutationFn: () =>
      createEntityAlias({
        entity_id: id,
        alias_name: aliasForm.alias_name.trim(),
        source_type: aliasForm.source_type.trim() || 'manual',
        added_by: aliasForm.added_by.trim() || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entity-aliases', id] });
      success('Alias added successfully');
      setIsAddAliasOpen(false);
      setAliasForm({ alias_name: '', source_type: 'manual', added_by: '' });
    },
    onError: (err) => {
      toastError(getErrorMessage(err), 'Failed to add alias');
    },
  });

  const deleteAliasMutation = useMutation({
    mutationFn: (aliasId: string) => deleteEntityAlias(aliasId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entity-aliases', id] });
      success('Alias deleted successfully');
      setAliasToDelete(null);
    },
    onError: (err) => {
      toastError(getErrorMessage(err), 'Failed to delete alias');
    },
  });

  const addRelMutation = useMutation({
    mutationFn: () => {
      if (!relForm.counterpart_id) throw new Error('Please select counterpart entity');
      if (relForm.counterpart_id === id) throw new Error('Entities must differ');
      return createRelationship({
        entity_id_1: id,
        entity_id_2: relForm.counterpart_id,
        relationship_type: relForm.relationship_type.trim() || 'associated_with',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['relationships'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      success('Relationship recorded (status: under_review)');
      setIsAddRelOpen(false);
      setRelForm({ counterpart_id: '', relationship_type: '' });
    },
    onError: (err) => {
      toastError(getErrorMessage(err), 'Failed to add relationship');
    },
  });

  const addEvidenceMutation = useMutation({
    mutationFn: () => {
      if (!selectedRelForEvidence) throw new Error('No relationship selected');
      if (!evidenceSelectedRecordId) throw new Error('Please select an evidence record');

      const payload: CreateEvidencePayload = {};
      if (evidenceType === 'document') payload.document_id = evidenceSelectedRecordId;
      if (evidenceType === 'call') payload.call_record_id = evidenceSelectedRecordId;
      if (evidenceType === 'transaction') payload.transaction_id = evidenceSelectedRecordId;
      if (evidenceExplanation.trim()) payload.explanation = evidenceExplanation.trim();

      return createRelationshipEvidence(selectedRelForEvidence.id, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['relationships', selectedRelForEvidence?.id, 'evidence'],
      });
      success('Evidence attached to relationship successfully');
      setIsAddEvidenceOpen(false);
      setEvidenceSelectedRecordId('');
      setEvidenceExplanation('');
    },
    onError: (err) => {
      toastError(getErrorMessage(err), 'Failed to attach evidence');
    },
  });

  if (entityError) {
    return (
      <div className="space-y-6">
        <Link to="/entities" className="text-xs text-text-secondary hover:text-text-primary flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" /> Back to Entities
        </Link>
        <ErrorMessage
          title="Entity not found"
          message="The requested entity record does not exist or has been removed."
          onRetry={() => refetchEntity()}
        />
      </div>
    );
  }

  if (entityLoading) {
    return (
      <div className="space-y-6">
        <div className="h-28 bg-surface border border-border rounded-card animate-pulse" />
        <CardSkeleton count={3} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          to="/entities"
          className="inline-flex items-center gap-1.5 text-xs text-text-secondary hover:text-text-primary transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Entities
        </Link>
      </div>

      {/* Profile Header */}
      <Card className="border-border">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5 flex-wrap">
              <EntityTypeBadge type={entity?.entity_type || 'other'} />
              <VerificationBadge status={entity?.verification_status} />
              <span className="font-mono text-xs text-text-muted">ID: {entity?.id}</span>
            </div>

            <h2 className="text-2xl font-bold text-text-primary tracking-tight">
              {entity?.canonical_name}
            </h2>

            {entity?.normalized_name && (
              <div className="text-xs text-text-muted font-mono">
                Normalized identifier: <span className="text-text-secondary">{entity.normalized_name}</span>
              </div>
            )}

            <div className="flex items-center gap-6 pt-1 text-xs text-text-muted">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                Created: <span className="tabular-nums">{entity?.created_at ? new Date(entity.created_at).toLocaleDateString() : '—'}</span>
              </span>
            </div>
          </div>

          <div className="shrink-0 flex items-center gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setIsAddAliasOpen(true)}
              icon={<Plus className="w-3.5 h-3.5" />}
            >
              Add Alias
            </Button>
            <Button
              size="sm"
              onClick={() => setIsAddRelOpen(true)}
              icon={<Share2 className="w-3.5 h-3.5" />}
            >
              Link Relationship
            </Button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 mt-6 border-t border-border pt-4 overflow-x-auto">
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'profile'
                ? 'bg-accent/15 text-accent font-semibold border border-accent/25'
                : 'text-text-secondary hover:text-text-primary hover:bg-surface-raised'
            }`}
          >
            Attributes & Overview
          </button>
          <button
            onClick={() => setActiveTab('aliases')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === 'aliases'
                ? 'bg-accent/15 text-accent font-semibold border border-accent/25'
                : 'text-text-secondary hover:text-text-primary hover:bg-surface-raised'
            }`}
          >
            Aliases ({aliases.length})
          </button>
          <button
            onClick={() => setActiveTab('relationships')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === 'relationships'
                ? 'bg-accent/15 text-accent font-semibold border border-accent/25'
                : 'text-text-secondary hover:text-text-primary hover:bg-surface-raised'
            }`}
          >
            Relationships ({relationships.length})
          </button>
          <button
            onClick={() => setActiveTab('calls')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === 'calls'
                ? 'bg-accent/15 text-accent font-semibold border border-accent/25'
                : 'text-text-secondary hover:text-text-primary hover:bg-surface-raised'
            }`}
          >
            Calls ({callRecords.length})
          </button>
          <button
            onClick={() => setActiveTab('transactions')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === 'transactions'
                ? 'bg-accent/15 text-accent font-semibold border border-accent/25'
                : 'text-text-secondary hover:text-text-primary hover:bg-surface-raised'
            }`}
          >
            Transactions ({transactions.length})
          </button>
          <button
            onClick={() => setActiveTab('matches')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === 'matches'
                ? 'bg-accent/15 text-accent font-semibold border border-accent/25'
                : 'text-text-secondary hover:text-text-primary hover:bg-surface-raised'
            }`}
          >
            Duplicate Reviews ({entityCandidates.length})
          </button>
        </div>
      </Card>

      {/* Tab: Profile & Attributes */}
      {activeTab === 'profile' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Entity Attributes</CardTitle>
              <CardDescription>Custom metadata attributes registered for this record</CardDescription>
            </CardHeader>

            {!entity?.attributes || Object.keys(entity.attributes).length === 0 ? (
              <div className="py-8 text-center text-xs text-text-muted">
                No custom attributes registered for this entity.
              </div>
            ) : (
              <div className="divide-y divide-border-subtle">
                {Object.entries(entity.attributes).map(([k, v]) => (
                  <div key={k} className="py-2.5 flex items-center justify-between text-xs">
                    <span className="font-medium text-text-secondary font-mono">{k}</span>
                    <span className="font-semibold text-text-primary bg-surface-raised px-2 py-0.5 rounded border border-border">
                      {typeof v === 'object' ? JSON.stringify(v) : String(v)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Forensic Profile Summary</CardTitle>
              <CardDescription>Intelligence linkages and verification parameters</CardDescription>
            </CardHeader>
            <div className="space-y-3 text-xs text-text-secondary leading-relaxed">
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-surface-raised/40 border border-border-subtle">
                <span>Verification Status:</span>
                <VerificationBadge status={entity?.verification_status} />
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-surface-raised/40 border border-border-subtle">
                <span>Total Known Aliases:</span>
                <span className="font-semibold text-text-primary tabular-nums">{aliases.length}</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-surface-raised/40 border border-border-subtle">
                <span>Connected Relationships:</span>
                <span className="font-semibold text-text-primary tabular-nums">{relationships.length}</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-surface-raised/40 border border-border-subtle">
                <span>Call Logs Associated:</span>
                <span className="font-semibold text-text-primary tabular-nums">{callRecords.length}</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-surface-raised/40 border border-border-subtle">
                <span>Transactions Associated:</span>
                <span className="font-semibold text-text-primary tabular-nums">{transactions.length}</span>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Tab: Aliases */}
      {activeTab === 'aliases' && (
        <Card>
          <CardHeader
            action={
              <Button size="sm" onClick={() => setIsAddAliasOpen(true)} icon={<Plus className="w-3.5 h-3.5" />}>
                Add Alias
              </Button>
            }
          >
            <CardTitle>Known Aliases & Nicknames</CardTitle>
            <CardDescription>Alternative names, aliases, and codenames linked to this entity</CardDescription>
          </CardHeader>

          <DataTable
            data={aliases}
            columns={[
              {
                key: 'alias_name',
                header: 'Alias Name',
                render: (row) => <span className="font-semibold text-text-primary">{row.alias_name}</span>,
              },
              {
                key: 'normalized_alias',
                header: 'Normalized Form',
                render: (row) => (
                  <span className="font-mono text-xs text-text-muted">{row.normalized_alias || '—'}</span>
                ),
              },
              {
                key: 'source_type',
                header: 'Source Origin',
                render: (row) => (
                  <span className="text-xs px-2 py-0.5 rounded bg-surface-raised border border-border text-text-secondary">
                    {row.source_type || 'manual'}
                  </span>
                ),
              },
              {
                key: 'added_by',
                header: 'Added By',
                render: (row) => <span className="text-xs text-text-muted">{row.added_by || 'Analyst'}</span>,
              },
              {
                key: 'actions',
                header: '',
                sortable: false,
                align: 'right',
                render: (row) => (
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => setAliasToDelete(row)}
                    icon={<Trash2 className="w-3.5 h-3.5" />}
                  >
                    Delete
                  </Button>
                ),
              },
            ]}
            emptyTitle="No aliases recorded"
            emptyDescription="Record alternate monikers, handles, or street names for this entity."
          />
        </Card>
      )}

      {/* Tab: Relationships */}
      {activeTab === 'relationships' && (
        <Card>
          <CardHeader
            action={
              <Button size="sm" onClick={() => setIsAddRelOpen(true)} icon={<Plus className="w-3.5 h-3.5" />}>
                Add Relationship
              </Button>
            }
          >
            <CardTitle>Entity Relationships</CardTitle>
            <CardDescription>
              Direct links between this entity and other suspects/entities. Click any row to view attached evidence.
            </CardDescription>
          </CardHeader>

          <DataTable
            data={relationships}
            onRowClick={(row) => setSelectedRelForEvidence(row)}
            columns={[
              {
                key: 'counterpart',
                header: 'Counterpart Entity',
                render: (row) => {
                  const counterpartId = row.entity_id_1 === id ? row.entity_id_2 : row.entity_id_1;
                  return (
                    <Link
                      to={`/entities/${counterpartId}`}
                      onClick={(e) => e.stopPropagation()}
                      className="font-medium text-accent hover:underline flex items-center gap-1.5"
                    >
                      <User className="w-3.5 h-3.5 text-text-muted" />
                      <span>{getEntityName(counterpartId)}</span>
                      <ExternalLink className="w-3 h-3 text-text-muted" />
                    </Link>
                  );
                },
              },
              {
                key: 'relationship_type',
                header: 'Relationship Type',
                render: (row) => (
                  <span className="font-mono text-xs text-text-primary px-2 py-0.5 rounded bg-surface-raised border border-border">
                    {row.relationship_type}
                  </span>
                ),
              },
              {
                key: 'status',
                header: 'Status',
                render: (row) => <StatusBadge status={row.status} />,
              },
              {
                key: 'confidence',
                header: 'Confidence',
                render: (row) => (
                  <span className="font-mono text-xs tabular-nums text-text-muted">
                    {row.confidence !== null && row.confidence !== undefined
                      ? `${Math.round(row.confidence * 100)}%`
                      : '—'}
                  </span>
                ),
              },
              {
                key: 'evidence',
                header: '',
                sortable: false,
                align: 'right',
                render: () => (
                  <span className="text-xs text-accent hover:underline font-medium">View Evidence Drawer →</span>
                ),
              },
            ]}
            emptyTitle="No relationships linked yet"
            emptyDescription="Create relationships to establish connections and build the investigation graph."
          />
        </Card>
      )}

      {/* Tab: Calls (In/Out computed from caller/sender per prompt) */}
      {activeTab === 'calls' && (
        <Card>
          <CardHeader>
            <CardTitle>Call Records Telecommunication History</CardTitle>
            <CardDescription>
              Incoming and outgoing calls involving this entity with duration and timestamps
            </CardDescription>
          </CardHeader>

          <DataTable
            data={callRecords}
            columns={[
              {
                key: 'direction',
                header: 'Direction',
                render: (row) => {
                  const isOutgoing = row.caller_entity_id === id;
                  return isOutgoing ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-[#0369A1]/20 text-[#38BDF8] border border-[#0284C7]/30">
                      <ArrowUpRight className="w-3.5 h-3.5" /> Outgoing
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-[#064E3B]/20 text-[#34D399] border border-[#059669]/30">
                      <ArrowDownLeft className="w-3.5 h-3.5" /> Incoming
                    </span>
                  );
                },
              },
              {
                key: 'counterpart',
                header: 'Counterpart Entity',
                render: (row) => {
                  const counterpartId = row.caller_entity_id === id ? row.receiver_entity_id : row.caller_entity_id;
                  return (
                    <Link
                      to={`/entities/${counterpartId}`}
                      className="font-medium text-text-primary hover:text-accent transition-colors flex items-center gap-1.5"
                    >
                      <span>{getEntityName(counterpartId)}</span>
                      <ExternalLink className="w-3 h-3 text-text-muted" />
                    </Link>
                  );
                },
              },
              {
                key: 'call_time',
                header: 'Timestamp',
                render: (row) => (
                  <span className="text-xs text-text-muted tabular-nums">
                    {new Date(row.call_time).toLocaleString()}
                  </span>
                ),
              },
              {
                key: 'duration_seconds',
                header: 'Duration',
                render: (row) => {
                  const m = Math.floor(row.duration_seconds / 60);
                  const s = row.duration_seconds % 60;
                  return (
                    <span className="font-mono text-xs tabular-nums text-text-primary">
                      {m}:{s.toString().padStart(2, '0')} ({row.duration_seconds}s)
                    </span>
                  );
                },
              },
              {
                key: 'call_type',
                header: 'Type',
                render: (row) => (
                  <span className="text-xs font-medium uppercase px-2 py-0.5 rounded bg-surface-raised border border-border text-text-secondary">
                    {row.call_type || 'voice'}
                  </span>
                ),
              },
              {
                key: 'reference_code',
                header: 'Ref Code',
                render: (row) => (
                  <span className="font-mono text-xs text-text-muted">{row.reference_code || '—'}</span>
                ),
              },
            ]}
            emptyTitle="No call records for this entity"
            emptyDescription="Call records logged with this entity as caller or receiver will appear here."
          />
        </Card>
      )}

      {/* Tab: Transactions (In/Out computed from sender/receiver per prompt) */}
      {activeTab === 'transactions' && (
        <Card>
          <CardHeader>
            <CardTitle>Financial Movement History</CardTitle>
            <CardDescription>
              Incoming credits and outgoing debits involving this entity
            </CardDescription>
          </CardHeader>

          <DataTable
            data={transactions}
            columns={[
              {
                key: 'direction',
                header: 'Flow',
                render: (row) => {
                  const isSent = row.sender_entity_id === id;
                  return isSent ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-status-error/15 text-status-error border border-status-error/30">
                      <ArrowUpRight className="w-3.5 h-3.5" /> Sent / Debit
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-status-success/15 text-status-success border border-status-success/30">
                      <ArrowDownLeft className="w-3.5 h-3.5" /> Received / Credit
                    </span>
                  );
                },
              },
              {
                key: 'counterpart',
                header: 'Counterpart Entity',
                render: (row) => {
                  const counterpartId = row.sender_entity_id === id ? row.receiver_entity_id : row.sender_entity_id;
                  return (
                    <Link
                      to={`/entities/${counterpartId}`}
                      className="font-medium text-text-primary hover:text-accent transition-colors flex items-center gap-1.5"
                    >
                      <span>{getEntityName(counterpartId)}</span>
                      <ExternalLink className="w-3 h-3 text-text-muted" />
                    </Link>
                  );
                },
              },
              {
                key: 'amount',
                header: 'Amount',
                render: (row) => (
                  <span className="font-mono font-semibold tabular-nums text-text-primary">
                    {Number(row.amount).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}{' '}
                    <span className="text-xs text-accent font-normal">{row.currency}</span>
                  </span>
                ),
              },
              {
                key: 'transaction_time',
                header: 'Timestamp',
                render: (row) => (
                  <span className="text-xs text-text-muted tabular-nums">
                    {new Date(row.transaction_time).toLocaleString()}
                  </span>
                ),
              },
              {
                key: 'transaction_type',
                header: 'Type',
                render: (row) => (
                  <span className="text-xs font-medium uppercase px-2 py-0.5 rounded bg-surface-raised border border-border text-text-secondary">
                    {row.transaction_type || 'transfer'}
                  </span>
                ),
              },
              {
                key: 'transaction_reference',
                header: 'Ref / UTR',
                render: (row) => (
                  <span className="font-mono text-xs text-text-muted">{row.transaction_reference || '—'}</span>
                ),
              },
            ]}
            emptyTitle="No transactions for this entity"
            emptyDescription="Financial money movements where this entity is sender or receiver will appear here."
          />
        </Card>
      )}

      {/* Tab: Duplicate Match Candidates */}
      {activeTab === 'matches' && (
        <Card>
          <CardHeader
            action={
              <Link to="/match-review" className="text-xs text-accent hover:underline flex items-center gap-1">
                Open Match Review Queue <ExternalLink className="w-3 h-3" />
              </Link>
            }
          >
            <CardTitle>Suspected Duplicate Matches</CardTitle>
            <CardDescription>
              Potential duplicate entity candidates involving this record (filtered from full candidate list)
            </CardDescription>
          </CardHeader>

          <DataTable
            data={entityCandidates}
            columns={[
              {
                key: 'counterpart',
                header: 'Compared Against',
                render: (row) => {
                  const counterpartId = row.entity_id_1 === id ? row.entity_id_2 : row.entity_id_1;
                  return (
                    <Link
                      to={`/entities/${counterpartId}`}
                      className="font-medium text-accent hover:underline flex items-center gap-1.5"
                    >
                      <span>{getEntityName(counterpartId)}</span>
                      <ExternalLink className="w-3 h-3 text-text-muted" />
                    </Link>
                  );
                },
              },
              {
                key: 'similarity_score',
                header: 'Similarity Score',
                render: (row) => {
                  const pct = Math.round(row.similarity_score * 100);
                  return (
                    <span
                      className={`font-mono text-xs font-bold tabular-nums px-2 py-0.5 rounded border ${
                        pct >= 80
                          ? 'bg-status-success/15 text-status-success border-status-success/30'
                          : 'bg-status-warning/15 text-status-warning border-status-warning/30'
                      }`}
                    >
                      {pct}%
                    </span>
                  );
                },
              },
              {
                key: 'status',
                header: 'Review Status',
                render: (row) => <StatusBadge status={row.status} />,
              },
              {
                key: 'reviewed_by',
                header: 'Reviewed By',
                render: (row) => (
                  <span className="text-xs text-text-muted">{row.reviewed_by || 'Pending Review'}</span>
                ),
              },
              {
                key: 'actions',
                header: '',
                sortable: false,
                align: 'right',
                render: () => (
                  <Link to="/match-review" className="text-xs text-accent hover:underline font-medium">
                    Review in Queue →
                  </Link>
                ),
              },
            ]}
            emptyTitle="No duplicate match candidates"
            emptyDescription="No duplicate candidates have been registered for this entity."
          />
        </Card>
      )}

      {/* Add Alias Modal */}
      <Modal
        isOpen={isAddAliasOpen}
        onClose={() => setIsAddAliasOpen(false)}
        title="Add Entity Alias"
        description="Register a nickname, codename, or alias for this entity."
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!aliasForm.alias_name.trim()) {
              toastError('Alias name is required');
              return;
            }
            addAliasMutation.mutate();
          }}
          className="space-y-4"
        >
          <Input
            label="Alias / Moniker Name"
            required
            placeholder="e.g. The Viper / Boss / Johnny"
            value={aliasForm.alias_name}
            onChange={(e) => setAliasForm({ ...aliasForm, alias_name: e.target.value })}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Source Origin"
              placeholder="e.g. manual, informant, intercepted_call"
              value={aliasForm.source_type}
              onChange={(e) => setAliasForm({ ...aliasForm, source_type: e.target.value })}
            />
            <Input
              label="Added By"
              placeholder="e.g. Analyst Sharma"
              value={aliasForm.added_by}
              onChange={(e) => setAliasForm({ ...aliasForm, added_by: e.target.value })}
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
            <Button type="button" variant="secondary" onClick={() => setIsAddAliasOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={addAliasMutation.isPending}>
              Save Alias
            </Button>
          </div>
        </form>
      </Modal>

      {/* Confirm Delete Alias Modal */}
      <Modal
        isOpen={!!aliasToDelete}
        onClose={() => setAliasToDelete(null)}
        title="Confirm Delete Alias"
        description={`Are you sure you want to delete alias "${aliasToDelete?.alias_name}"?`}
      >
        <div className="space-y-4">
          <p className="text-xs text-text-secondary leading-relaxed">
            This action will permanently remove this alias from the database.
          </p>
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
            <Button variant="secondary" onClick={() => setAliasToDelete(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              isLoading={deleteAliasMutation.isPending}
              onClick={() => {
                if (aliasToDelete) deleteAliasMutation.mutate(aliasToDelete.id);
              }}
            >
              Confirm Delete
            </Button>
          </div>
        </div>
      </Modal>

      {/* Add Relationship Modal */}
      <Modal
        isOpen={isAddRelOpen}
        onClose={() => setIsAddRelOpen(false)}
        title="Add Entity Relationship"
        description="Establish an investigative link between this entity and another entity."
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!relForm.counterpart_id) {
              toastError('Please choose counterpart entity');
              return;
            }
            addRelMutation.mutate();
          }}
          className="space-y-4"
        >
          <div className="p-3 rounded-lg bg-surface-raised border border-border text-xs">
            <span className="text-text-muted">Entity 1 (Preselected): </span>
            <strong className="text-text-primary">{entity?.canonical_name}</strong>
          </div>

          <Select
            label="Counterpart Entity"
            required
            value={relForm.counterpart_id}
            onChange={(e) => setRelForm({ ...relForm, counterpart_id: e.target.value })}
          >
            <option value="">-- Select Counterpart --</option>
            {entities
              .filter((e) => e.id !== id)
              .map((e) => (
                <option key={e.id} value={e.id}>
                  {e.canonical_name} ({e.entity_type})
                </option>
              ))}
          </Select>

          <Input
            label="Relationship Type"
            required
            placeholder="e.g. associated_with, financier_of, owner_of, accomplice"
            value={relForm.relationship_type}
            onChange={(e) => setRelForm({ ...relForm, relationship_type: e.target.value })}
            helperText="Free text per backend contract. Status will be initialized to under_review."
          />

          <p className="text-[11px] text-text-muted">
            Note: Confidence cannot be set on creation per backend contract.
          </p>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
            <Button type="button" variant="secondary" onClick={() => setIsAddRelOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={addRelMutation.isPending}>
              Create Relationship
            </Button>
          </div>
        </form>
      </Modal>

      {/* Evidence Drawer */}
      <Drawer
        isOpen={!!selectedRelForEvidence}
        onClose={() => {
          setSelectedRelForEvidence(null);
          setIsAddEvidenceOpen(false);
        }}
        title="Relationship Evidence"
        description={
          selectedRelForEvidence
            ? `${getEntityName(selectedRelForEvidence.entity_id_1)} ↔ ${getEntityName(
                selectedRelForEvidence.entity_id_2
              )} (${selectedRelForEvidence.relationship_type})`
            : ''
        }
      >
        <div className="space-y-6">
          <div className="flex items-center justify-between pb-2 border-b border-border">
            <div>
              <div className="text-xs font-semibold text-text-primary">Attached Evidentiary Backing</div>
              <div className="text-[11px] text-text-muted">
                Documents, call records, or financial transactions supporting this link.
              </div>
            </div>
            <Button size="sm" onClick={() => setIsAddEvidenceOpen(true)} icon={<Plus className="w-3.5 h-3.5" />}>
              Add Evidence
            </Button>
          </div>

          {/* Form to add evidence if open */}
          {isAddEvidenceOpen && (
            <Card className="border-accent/40 bg-surface-raised/50 p-4 space-y-3 animate-fade-in">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-text-primary">Attach New Evidence</span>
                <button
                  onClick={() => setIsAddEvidenceOpen(false)}
                  className="text-text-muted hover:text-text-primary text-xs"
                >
                  Cancel
                </button>
              </div>

              {/* Exact one of document / call / transaction per prompt! */}
              <div className="flex items-center gap-2 p-1 rounded-lg bg-surface border border-border">
                <button
                  type="button"
                  onClick={() => {
                    setEvidenceType('document');
                    setEvidenceSelectedRecordId('');
                  }}
                  className={`flex-1 py-1 text-xs font-medium rounded transition-colors ${
                    evidenceType === 'document' ? 'bg-surface-raised text-accent font-semibold' : 'text-text-muted'
                  }`}
                >
                  Document
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEvidenceType('call');
                    setEvidenceSelectedRecordId('');
                  }}
                  className={`flex-1 py-1 text-xs font-medium rounded transition-colors ${
                    evidenceType === 'call' ? 'bg-surface-raised text-accent font-semibold' : 'text-text-muted'
                  }`}
                >
                  Call Record
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEvidenceType('transaction');
                    setEvidenceSelectedRecordId('');
                  }}
                  className={`flex-1 py-1 text-xs font-medium rounded transition-colors ${
                    evidenceType === 'transaction'
                      ? 'bg-surface-raised text-accent font-semibold'
                      : 'text-text-muted'
                  }`}
                >
                  Transaction
                </button>
              </div>

              {evidenceType === 'document' && (
                <Select
                  label="Select Document File"
                  required
                  value={evidenceSelectedRecordId}
                  onChange={(e) => setEvidenceSelectedRecordId(e.target.value)}
                >
                  <option value="">-- Choose document --</option>
                  {documents.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.file_name} ({d.file_type})
                    </option>
                  ))}
                </Select>
              )}

              {evidenceType === 'call' && (
                <Select
                  label="Select Call Record"
                  required
                  value={evidenceSelectedRecordId}
                  onChange={(e) => setEvidenceSelectedRecordId(e.target.value)}
                >
                  <option value="">-- Choose call record --</option>
                  {callRecords.map((c) => (
                    <option key={c.id} value={c.id}>
                      Call: {getEntityName(c.caller_entity_id)} → {getEntityName(c.receiver_entity_id)} (
                      {c.duration_seconds}s)
                    </option>
                  ))}
                </Select>
              )}

              {evidenceType === 'transaction' && (
                <Select
                  label="Select Transaction"
                  required
                  value={evidenceSelectedRecordId}
                  onChange={(e) => setEvidenceSelectedRecordId(e.target.value)}
                >
                  <option value="">-- Choose transaction --</option>
                  {transactions.map((t) => (
                    <option key={t.id} value={t.id}>
                      Tx: {getEntityName(t.sender_entity_id)} → {getEntityName(t.receiver_entity_id)} (
                      {t.amount} {t.currency})
                    </option>
                  ))}
                </Select>
              )}

              <Textarea
                label="Explanation / Investigative Rationale (Optional)"
                rows={2}
                placeholder="Why this record establishes this relationship..."
                value={evidenceExplanation}
                onChange={(e) => setEvidenceExplanation(e.target.value)}
              />

              <div className="flex justify-end pt-2">
                <Button
                  size="sm"
                  disabled={!evidenceSelectedRecordId}
                  isLoading={addEvidenceMutation.isPending}
                  onClick={() => addEvidenceMutation.mutate()}
                >
                  Save Evidence
                </Button>
              </div>
            </Card>
          )}

          {/* Evidence List */}
          <div className="space-y-3">
            {evidenceLoading ? (
              <div className="py-6 text-center text-xs text-text-muted animate-pulse">
                Loading evidence records...
              </div>
            ) : relEvidenceList.length === 0 ? (
              <div className="py-8 text-center text-xs text-text-muted bg-surface-raised/20 rounded-lg border border-border-subtle p-4">
                No evidence items attached to this relationship yet.
              </div>
            ) : (
              relEvidenceList.map((ev) => (
                <div key={ev.id} className="p-3 rounded-lg bg-surface-raised border border-border text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-text-primary flex items-center gap-1.5">
                      {ev.document_id && (
                        <>
                          <FileText className="w-3.5 h-3.5 text-accent" />
                          <span>Document Evidence</span>
                        </>
                      )}
                      {ev.call_record_id && (
                        <>
                          <PhoneCall className="w-3.5 h-3.5 text-status-success" />
                          <span>Call Record Evidence</span>
                        </>
                      )}
                      {ev.transaction_id && (
                        <>
                          <ArrowLeftRight className="w-3.5 h-3.5 text-status-warning" />
                          <span>Transaction Evidence</span>
                        </>
                      )}
                    </span>
                    <span className="text-[10px] text-text-muted font-mono">{ev.id.slice(0, 8)}...</span>
                  </div>

                  {ev.explanation && (
                    <p className="text-text-secondary leading-relaxed bg-surface/50 p-2 rounded">
                      "{ev.explanation}"
                    </p>
                  )}

                  <div className="text-[11px] font-mono text-text-muted truncate">
                    Record ID:{' '}
                    <span className="text-text-secondary">
                      {ev.document_id || ev.call_record_id || ev.transaction_id}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </Drawer>
    </div>
  );
};
