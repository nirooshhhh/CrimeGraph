import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { Users, Plus, ExternalLink, Shield, Info, ArrowRight, CheckCircle2 } from 'lucide-react';
import { fetchEntities, createEntity, fetchCases, linkEntityToCase } from '../api';
import { DataTable, Column } from '../components/common/DataTable';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { Input, Select } from '../components/common/FormFields';
import { EntityTypeBadge, VerificationBadge } from '../components/common/Badge';
import { useToast } from '../context/ToastContext';
import { getErrorMessage } from '../api/client';
import type { Entity, EntityType, CreateEntityPayload } from '../types';

export const EntitiesPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { success, error: toastError, info } = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTypeFilter, setSelectedTypeFilter] = useState('');

  // Form state
  const [entityType, setEntityType] = useState<EntityType>('person');
  const [canonicalName, setCanonicalName] = useState('');
  const [attributeRows, setAttributeRows] = useState<Array<{ key: string; value: string }>>([
    { key: '', value: '' },
  ]);

  // Post-creation link to investigation offer modal
  const [createdEntity, setCreatedEntity] = useState<Entity | null>(null);
  const [selectedCaseToLink, setSelectedCaseToLink] = useState('');

  const { data: entities = [], isLoading } = useQuery({
    queryKey: ['entities'],
    queryFn: fetchEntities,
  });

  const { data: cases = [] } = useQuery({
    queryKey: ['cases'],
    queryFn: fetchCases,
  });

  const filteredEntities = useMemo(() => {
    if (!selectedTypeFilter) return entities;
    return entities.filter(
      (e) => (e.entity_type || '').toLowerCase() === selectedTypeFilter.toLowerCase()
    );
  }, [entities, selectedTypeFilter]);

  const createMutation = useMutation({
    mutationFn: (payload: CreateEntityPayload) => createEntity(payload),
    onSuccess: (newEntity) => {
      queryClient.invalidateQueries({ queryKey: ['entities'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      success(`Entity "${newEntity.canonical_name}" created successfully!`);
      setIsModalOpen(false);
      // Reset form
      setCanonicalName('');
      setAttributeRows([{ key: '', value: '' }]);
      // Offer linking to an investigation
      setCreatedEntity(newEntity);
    },
    onError: (err) => {
      toastError(getErrorMessage(err), 'Failed to create entity');
    },
  });

  const linkMutation = useMutation({
    mutationFn: ({ caseId, entityId }: { caseId: string; entityId: string }) =>
      linkEntityToCase(caseId, entityId),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['graph'] });
      if (res.alreadyLinked) {
        info('Entity was already linked to this case.');
      } else {
        success('Entity linked to investigation successfully!');
      }
      const cId = createdEntity?.id;
      setCreatedEntity(null);
      setSelectedCaseToLink('');
      if (cId) navigate(`/entities/${cId}`);
    },
    onError: (err) => {
      toastError(getErrorMessage(err), 'Failed to link entity to investigation');
    },
  });

  const handleAddAttributeRow = () => {
    setAttributeRows([...attributeRows, { key: '', value: '' }]);
  };

  const handleRemoveAttributeRow = (idx: number) => {
    setAttributeRows(attributeRows.filter((_, i) => i !== idx));
  };

  const handleAttributeChange = (idx: number, field: 'key' | 'value', val: string) => {
    const updated = [...attributeRows];
    updated[idx][field] = val;
    setAttributeRows(updated);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canonicalName.trim()) {
      toastError('Canonical entity name is required');
      return;
    }

    const attributesObj: Record<string, string> = {};
    for (const row of attributeRows) {
      if (row.key.trim() && row.value.trim()) {
        attributesObj[row.key.trim()] = row.value.trim();
      }
    }

    const payload: CreateEntityPayload = {
      entity_type: entityType,
      canonical_name: canonicalName.trim(),
    };
    if (Object.keys(attributesObj).length > 0) {
      payload.attributes = attributesObj;
    }

    createMutation.mutate(payload);
  };

  const columns: Column<Entity>[] = [
    {
      key: 'canonical_name',
      header: 'Canonical Name / Value',
      render: (row) => (
        <Link
          to={`/entities/${row.id}`}
          className="font-medium text-text-primary hover:text-accent transition-colors flex items-center gap-1.5"
        >
          <span>{row.canonical_name}</span>
          <ExternalLink className="w-3 h-3 text-text-muted opacity-0 hover:opacity-100" />
        </Link>
      ),
    },
    {
      key: 'entity_type',
      header: 'Entity Type',
      render: (row) => <EntityTypeBadge type={row.entity_type} />,
    },
    {
      key: 'normalized_name',
      header: 'Normalized Identifier',
      render: (row) => (
        <span className="font-mono text-xs text-text-muted">{row.normalized_name || '—'}</span>
      ),
    },
    {
      key: 'verification_status',
      header: 'Verification Status',
      render: (row) => <VerificationBadge status={row.verification_status} />,
    },
    {
      key: 'created_at',
      header: 'Created Date',
      render: (row) => (
        <span className="text-xs text-text-muted tabular-nums">
          {row.created_at ? new Date(row.created_at).toLocaleDateString() : '—'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      sortable: false,
      align: 'right',
      render: (row) => (
        <Link
          to={`/entities/${row.id}`}
          className="text-xs text-accent hover:underline font-medium"
        >
          View Profile
        </Link>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-text-primary">Entities Repository</h2>
          <p className="text-sm text-text-secondary mt-1">
            Global repository of known suspects, phone numbers, vehicle registrations, and organizations.
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} icon={<Plus className="w-4 h-4" />}>
          New Entity
        </Button>
      </div>

      <DataTable
        data={filteredEntities}
        columns={columns}
        searchPlaceholder="Search entities by name or identifier..."
        filterControls={
          <select
            value={selectedTypeFilter}
            onChange={(e) => setSelectedTypeFilter(e.target.value)}
            className="bg-surface-raised border border-border rounded-lg px-2.5 py-2 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
          >
            <option value="">All Entity Types</option>
            <option value="person">Persons</option>
            <option value="phone">Phones</option>
            <option value="vehicle">Vehicles</option>
            <option value="location">Locations</option>
            <option value="organization">Organizations</option>
            <option value="account">Accounts</option>
            <option value="other">Other</option>
          </select>
        }
        isLoading={isLoading}
        emptyTitle="No entities recorded"
        emptyDescription="Create an entity manually or upload evidence documents to extract entities automatically."
        emptyAction={
          <Button size="sm" onClick={() => setIsModalOpen(true)} icon={<Plus className="w-3.5 h-3.5" />}>
            Create Entity
          </Button>
        }
      />

      {/* New Entity Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Register New Entity"
        description="Add a person, phone number, vehicle, or organization to the intelligence database."
      >
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <Select
            label="Entity Type"
            required
            value={entityType}
            onChange={(e) => setEntityType(e.target.value as EntityType)}
          >
            <option value="person">Person (Suspect, Witness, Official)</option>
            <option value="phone">Phone Number (Cellular / Landline)</option>
            <option value="vehicle">Vehicle (License Plate / Registration)</option>
            <option value="location">Location / Address</option>
            <option value="organization">Organization / Company / Syndicate</option>
            <option value="account">Financial Account / Wallet</option>
            <option value="other">Other (Email, IP, Domain, Object)</option>
          </Select>

          <Input
            label="Canonical Name / Identifier"
            required
            placeholder={
              entityType === 'phone'
                ? 'e.g. 9876543210'
                : entityType === 'vehicle'
                ? 'e.g. KA05AB1234'
                : 'e.g. John Doe / Alpha Corp'
            }
            value={canonicalName}
            onChange={(e) => setCanonicalName(e.target.value)}
            helperText={
              entityType === 'phone'
                ? 'Tip: Enter plain 10 digits to match auto-detected entities.'
                : entityType === 'vehicle'
                ? 'Tip: Enter uppercase without spaces (e.g. KA05AB1234) for matching.'
                : 'The primary display name for this entity'
            }
          />

          {/* Key-Value Attributes */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-text-secondary">
                Entity Attributes (Optional Key / Value)
              </label>
              <button
                type="button"
                onClick={handleAddAttributeRow}
                className="text-xs text-accent hover:underline flex items-center gap-1 font-medium"
              >
                <Plus className="w-3 h-3" /> Add Attribute
              </button>
            </div>

            <div className="space-y-2">
              {attributeRows.map((row, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Key (e.g. role, bank, color)"
                    value={row.key}
                    onChange={(e) => handleAttributeChange(idx, 'key', e.target.value)}
                    className="flex-1 bg-surface-raised border border-border rounded-lg px-2.5 py-1.5 text-xs text-text-primary placeholder-text-muted focus:outline-none focus:ring-1 focus:ring-accent"
                  />
                  <input
                    type="text"
                    placeholder="Value (e.g. Suspect, SBI, Blue)"
                    value={row.value}
                    onChange={(e) => handleAttributeChange(idx, 'value', e.target.value)}
                    className="flex-1 bg-surface-raised border border-border rounded-lg px-2.5 py-1.5 text-xs text-text-primary placeholder-text-muted focus:outline-none focus:ring-1 focus:ring-accent"
                  />
                  {attributeRows.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveAttributeRow(idx)}
                      className="text-text-muted hover:text-status-error px-1.5 py-1 text-xs"
                      aria-label="Remove attribute"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={createMutation.isPending}>
              Create Entity
            </Button>
          </div>
        </form>
      </Modal>

      {/* Post-Creation Offer to Link to an Investigation */}
      <Modal
        isOpen={!!createdEntity}
        onClose={() => {
          const id = createdEntity?.id;
          setCreatedEntity(null);
          if (id) navigate(`/entities/${id}`);
        }}
        title="Entity Created Successfully"
        description={`"${createdEntity?.canonical_name}" has been registered in the database.`}
      >
        <div className="space-y-4">
          <div className="p-3 rounded-lg bg-surface-raised border border-border flex items-center justify-between">
            <div>
              <div className="font-semibold text-sm text-text-primary">{createdEntity?.canonical_name}</div>
              <div className="text-xs text-text-muted">Type: {createdEntity?.entity_type}</div>
            </div>
            <EntityTypeBadge type={createdEntity?.entity_type || 'other'} />
          </div>

          <p className="text-xs text-text-secondary leading-relaxed">
            Would you like to associate this newly created entity with an active investigation case right away?
          </p>

          <Select
            label="Select Investigation Case"
            value={selectedCaseToLink}
            onChange={(e) => setSelectedCaseToLink(e.target.value)}
          >
            <option value="">-- Choose an investigation --</option>
            {cases.map((c) => (
              <option key={c.id} value={c.id}>
                {c.case_number} - {c.title}
              </option>
            ))}
          </Select>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                const id = createdEntity?.id;
                setCreatedEntity(null);
                if (id) navigate(`/entities/${id}`);
              }}
            >
              Skip Linking
            </Button>
            <Button
              disabled={!selectedCaseToLink}
              isLoading={linkMutation.isPending}
              onClick={() => {
                if (selectedCaseToLink && createdEntity) {
                  linkMutation.mutate({ caseId: selectedCaseToLink, entityId: createdEntity.id });
                }
              }}
            >
              Link to Investigation
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
