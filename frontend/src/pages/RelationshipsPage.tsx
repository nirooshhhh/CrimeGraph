import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Share2,
  Plus,
  ArrowRight,
  ExternalLink,
  Shield,
  FileText,
  PhoneCall,
  ArrowLeftRight,
  Info,
} from 'lucide-react';
import {
  fetchRelationships,
  createRelationship,
  fetchRelationshipEvidence,
  createRelationshipEvidence,
  fetchEntities,
  fetchDocuments,
  fetchCallRecords,
  fetchTransactions,
} from '../api';
import { DataTable, Column } from '../components/common/DataTable';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { Drawer } from '../components/common/Drawer';
import { Input, Select, Textarea } from '../components/common/FormFields';
import { StatusBadge, EntityTypeBadge } from '../components/common/Badge';
import { Card } from '../components/common/Card';
import { useEntityMap } from '../context/EntityMapContext';
import { useToast } from '../context/ToastContext';
import { getErrorMessage } from '../api/client';
import type { Relationship, Evidence, CreateRelationshipPayload, CreateEvidencePayload } from '../types';

export const RelationshipsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { entities, getEntityName } = useEntityMap();
  const { success, error: toastError } = useToast();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [formValues, setFormValues] = useState<{
    entity_id_1: string;
    entity_id_2: string;
    relationship_type: string;
  }>({
    entity_id_1: '',
    entity_id_2: '',
    relationship_type: 'associated_with',
  });

  // Evidence Drawer state
  const [selectedRelForEvidence, setSelectedRelForEvidence] = useState<Relationship | null>(null);
  const [isAddEvidenceOpen, setIsAddEvidenceOpen] = useState(false);
  const [evidenceType, setEvidenceType] = useState<'document' | 'call' | 'transaction'>('document');
  const [evidenceSelectedRecordId, setEvidenceSelectedRecordId] = useState('');
  const [evidenceExplanation, setEvidenceExplanation] = useState('');

  const { data: relationships = [], isLoading } = useQuery({
    queryKey: ['relationships'],
    queryFn: fetchRelationships,
  });

  // Queries for evidence dropdown options
  const { data: documents = [] } = useQuery({
    queryKey: ['documents'],
    queryFn: fetchDocuments,
    enabled: !!selectedRelForEvidence,
  });

  const { data: callRecords = [] } = useQuery({
    queryKey: ['call-records'],
    queryFn: fetchCallRecords,
    enabled: !!selectedRelForEvidence,
  });

  const { data: transactions = [] } = useQuery({
    queryKey: ['transactions'],
    queryFn: fetchTransactions,
    enabled: !!selectedRelForEvidence,
  });

  // Evidence list query for drawer
  const { data: relEvidenceList = [], isLoading: evidenceLoading } = useQuery({
    queryKey: ['relationships', selectedRelForEvidence?.id, 'evidence'],
    queryFn: () => fetchRelationshipEvidence(selectedRelForEvidence!.id),
    enabled: !!selectedRelForEvidence,
  });

  const createMutation = useMutation({
    mutationFn: (payload: CreateRelationshipPayload) => {
      if (!payload.entity_id_1 || !payload.entity_id_2) {
        throw new Error('Both entities are required');
      }
      if (payload.entity_id_1 === payload.entity_id_2) {
        throw new Error('Entity 1 and Entity 2 must differ');
      }
      return createRelationship(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['relationships'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      success('Relationship created (status: under_review)');
      setIsCreateOpen(false);
      setFormValues({ entity_id_1: '', entity_id_2: '', relationship_type: 'associated_with' });
    },
    onError: (err) => {
      toastError(getErrorMessage(err), 'Failed to create relationship');
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

  const columns: Column<Relationship>[] = [
    {
      key: 'entity_id_1',
      header: 'Primary Entity',
      render: (row) => (
        <Link
          to={`/entities/${row.entity_id_1}`}
          onClick={(e) => e.stopPropagation()}
          className="font-medium text-text-primary hover:text-accent transition-colors flex items-center gap-1.5"
        >
          <span>{getEntityName(row.entity_id_1)}</span>
          <ExternalLink className="w-3 h-3 text-text-muted" />
        </Link>
      ),
    },
    {
      key: 'arrow',
      header: '',
      sortable: false,
      render: () => <ArrowRight className="w-3.5 h-3.5 text-text-muted" />,
    },
    {
      key: 'entity_id_2',
      header: 'Secondary Entity',
      render: (row) => (
        <Link
          to={`/entities/${row.entity_id_2}`}
          onClick={(e) => e.stopPropagation()}
          className="font-medium text-text-primary hover:text-accent transition-colors flex items-center gap-1.5"
        >
          <span>{getEntityName(row.entity_id_2)}</span>
          <ExternalLink className="w-3 h-3 text-text-muted" />
        </Link>
      ),
    },
    {
      key: 'relationship_type',
      header: 'Link Type',
      render: (row) => (
        <span className="font-mono text-xs px-2 py-0.5 rounded bg-surface-raised border border-border text-text-primary">
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
        <span className="font-mono text-xs text-text-muted tabular-nums">
          {row.confidence !== null && row.confidence !== undefined
            ? `${Math.round(row.confidence * 100)}%`
            : '—'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      sortable: false,
      align: 'right',
      render: (row) => (
        <button
          onClick={() => setSelectedRelForEvidence(row)}
          className="text-xs text-accent hover:underline font-medium"
        >
          Evidence Drawer →
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-text-primary">Entity Relationships</h2>
          <p className="text-sm text-text-secondary mt-1">
            Global relationship graph repository with evidentiary provenance and corroboration.
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} icon={<Plus className="w-4 h-4" />}>
          New Relationship
        </Button>
      </div>

      {/* Note in UI per prompt */}
      <div className="p-3.5 rounded-lg bg-surface-raised border border-border-subtle flex items-start gap-3 text-xs text-text-secondary">
        <Info className="w-4 h-4 text-accent shrink-0 mt-0.5" />
        <div>
          <strong className="text-text-primary">Backend Rule:</strong> New relationships start automatically with status
          "under_review". Confidence cannot be set manually on creation.
        </div>
      </div>

      <DataTable
        data={relationships}
        columns={columns}
        searchPlaceholder="Search relationships by entity names or type..."
        searchFilter={(item, q) => {
          const n1 = getEntityName(item.entity_id_1).toLowerCase();
          const n2 = getEntityName(item.entity_id_2).toLowerCase();
          const type = (item.relationship_type || '').toLowerCase();
          return n1.includes(q) || n2.includes(q) || type.includes(q);
        }}
        onRowClick={(row) => setSelectedRelForEvidence(row)}
        isLoading={isLoading}
        emptyTitle="No relationships recorded"
        emptyDescription="Link two entities together to build network graphs and investigative trails."
        emptyAction={
          <Button size="sm" onClick={() => setIsCreateOpen(true)} icon={<Plus className="w-3.5 h-3.5" />}>
            New Relationship
          </Button>
        }
      />

      {/* Create Relationship Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create Entity Relationship"
        description="Establish an investigative link between two known entities."
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createMutation.mutate(formValues);
          }}
          className="space-y-4"
        >
          <Select
            label="First Entity"
            required
            value={formValues.entity_id_1}
            onChange={(e) => setFormValues({ ...formValues, entity_id_1: e.target.value })}
          >
            <option value="">-- Choose first entity --</option>
            {entities.map((e) => (
              <option key={e.id} value={e.id}>
                {e.canonical_name} ({e.entity_type})
              </option>
            ))}
          </Select>

          <Select
            label="Second Entity (Must Differ)"
            required
            value={formValues.entity_id_2}
            onChange={(e) => setFormValues({ ...formValues, entity_id_2: e.target.value })}
          >
            <option value="">-- Choose second entity --</option>
            {entities
              .filter((e) => e.id !== formValues.entity_id_1)
              .map((e) => (
                <option key={e.id} value={e.id}>
                  {e.canonical_name} ({e.entity_type})
                </option>
              ))}
          </Select>

          <Input
            label="Relationship Type"
            required
            placeholder="e.g. associated_with, employer_of, calls_frequently, transfers_money_to"
            value={formValues.relationship_type}
            onChange={(e) => setFormValues({ ...formValues, relationship_type: e.target.value })}
            helperText="Free text per backend contract. Status initialized to under_review."
          />

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
            <Button type="button" variant="secondary" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={createMutation.isPending}>
              Create Link
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
        title="Relationship Evidence Drawer"
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
              <div className="text-xs font-semibold text-text-primary">Attached Supporting Records</div>
              <div className="text-[11px] text-text-muted">
                Evidentiary artifacts corroborating this relationship.
              </div>
            </div>
            <Button size="sm" onClick={() => setIsAddEvidenceOpen(true)} icon={<Plus className="w-3.5 h-3.5" />}>
              Add Evidence
            </Button>
          </div>

          {/* Form to attach evidence if open */}
          {isAddEvidenceOpen && (
            <Card className="border-accent/40 bg-surface-raised/50 p-4 space-y-3 animate-fade-in">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-text-primary">Attach Supporting Record</span>
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
                label="Explanation / Evidentiary Rationale (Optional)"
                rows={2}
                placeholder="How this record corroborates the relationship..."
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
