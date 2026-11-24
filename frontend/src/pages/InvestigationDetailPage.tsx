import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Briefcase,
  Users,
  Share2,
  FileText,
  Layers,
  BellRing,
  Network,
  Plus,
  ArrowLeft,
  Calendar,
  User,
  ExternalLink,
  ShieldAlert,
  Upload,
  Download,
  AlertTriangle,
} from 'lucide-react';
import {
  fetchCaseById,
  fetchGraphByCase,
  fetchDocumentsByCase,
  fetchSourcesByCase,
  fetchAlertsByCase,
  linkEntityToCase,
  uploadDocument,
  createSource,
  createAlert,
  updateAlertStatus,
  fetchEntities,
  getDocumentDownloadUrl,
} from '../api';
import { Card, CardHeader, CardTitle, CardDescription } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { Input, Select, Textarea } from '../components/common/FormFields';
import { EntityTypeBadge, StatusBadge, SeverityBadge, VerificationBadge } from '../components/common/Badge';
import { DataTable, Column } from '../components/common/DataTable';
import { CardSkeleton, TableSkeleton } from '../components/common/LoadingSkeleton';
import { ErrorMessage } from '../components/common/ErrorMessage';
import { useToast } from '../context/ToastContext';
import { getErrorMessage } from '../api/client';
import type {
  Case,
  GraphNode,
  Document,
  Source,
  Alert,
  AlertSeverity,
  AlertStatus,
  CreateSourcePayload,
  CreateAlertPayload,
} from '../types';

export const InvestigationDetailPage: React.FC = () => {
  const { id = '' } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { success, error: toastError, info } = useToast();

  const [activeTab, setActiveTab] = useState<'overview' | 'entities' | 'documents' | 'sources' | 'alerts'>('overview');

  // Modals state
  const [isLinkEntityOpen, setIsLinkEntityOpen] = useState(false);
  const [selectedEntityIdToLink, setSelectedEntityIdToLink] = useState('');

  const [isUploadDocOpen, setIsUploadDocOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [pasteText, setPasteText] = useState('');
  const [pasteFileName, setPasteFileName] = useState('');
  const [docUploadMode, setDocUploadMode] = useState<'file' | 'text'>('file');

  const [isCreateSourceOpen, setIsCreateSourceOpen] = useState(false);
  const [sourceForm, setSourceForm] = useState<CreateSourcePayload>({
    source_type: '',
    source_name: '',
    description: '',
    reference_code: '',
  });

  const [isCreateAlertOpen, setIsCreateAlertOpen] = useState(false);
  const [alertForm, setAlertForm] = useState<CreateAlertPayload>({
    alert_type: '',
    title: '',
    description: '',
    severity: 'medium',
  });

  // Queries
  const {
    data: caseData,
    isLoading: caseLoading,
    error: caseError,
    refetch: refetchCase,
  } = useQuery({
    queryKey: ['cases', id],
    queryFn: () => fetchCaseById(id),
    enabled: !!id,
    retry: 1,
  });

  const { data: graphData, isLoading: graphLoading } = useQuery({
    queryKey: ['graph', 'case', id],
    queryFn: () => fetchGraphByCase(id),
    enabled: !!id,
  });

  const { data: documents = [], isLoading: docsLoading } = useQuery({
    queryKey: ['documents', 'case', id],
    queryFn: () => fetchDocumentsByCase(id),
    enabled: !!id,
  });

  const { data: sources = [], isLoading: sourcesLoading } = useQuery({
    queryKey: ['sources', 'case', id],
    queryFn: () => fetchSourcesByCase(id),
    enabled: !!id,
  });

  const { data: alerts = [], isLoading: alertsLoading } = useQuery({
    queryKey: ['alerts', 'case', id],
    queryFn: () => fetchAlertsByCase(id),
    enabled: !!id,
  });

  // Fetch all entities for linker
  const { data: allEntities = [] } = useQuery({
    queryKey: ['entities'],
    queryFn: fetchEntities,
  });

  // Mutations
  const linkEntityMutation = useMutation({
    mutationFn: (entityId: string) => linkEntityToCase(id, entityId),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['graph', 'case', id] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      if (res.alreadyLinked) {
        info('This entity is already linked to this investigation.');
      } else {
        success('Entity linked to investigation successfully');
      }
      setIsLinkEntityOpen(false);
      setSelectedEntityIdToLink('');
    },
    onError: (err) => {
      toastError(getErrorMessage(err), 'Failed to link entity');
    },
  });

  const uploadDocMutation = useMutation({
    mutationFn: (fd: FormData) => uploadDocument(fd),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['documents', 'case', id] });
      queryClient.invalidateQueries({ queryKey: ['graph', 'case', id] });
      queryClient.invalidateQueries({ queryKey: ['entities'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      success(`Document "${res.data.file_name}" uploaded and processed successfully`);
      if (res.extraction?.entityExtractionError) {
        toastError(res.extraction.entityExtractionError, 'Extraction warning');
      }
      setIsUploadDocOpen(false);
      setUploadFile(null);
      setPasteText('');
      setPasteFileName('');
    },
    onError: (err) => {
      toastError(getErrorMessage(err), 'Upload failed');
    },
  });

  const createSourceMutation = useMutation({
    mutationFn: (payload: CreateSourcePayload) =>
      createSource({ ...payload, case_id: id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sources', 'case', id] });
      success('Source attached to investigation');
      setIsCreateSourceOpen(false);
      setSourceForm({ source_type: '', source_name: '', description: '', reference_code: '' });
    },
    onError: (err) => {
      toastError(getErrorMessage(err), 'Failed to create source');
    },
  });

  const createAlertMutation = useMutation({
    mutationFn: (payload: CreateAlertPayload) =>
      createAlert({ ...payload, case_id: id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts', 'case', id] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      success('Alert flagged for this investigation');
      setIsCreateAlertOpen(false);
      setAlertForm({ alert_type: '', title: '', description: '', severity: 'medium' });
    },
    onError: (err) => {
      toastError(getErrorMessage(err), 'Failed to create alert');
    },
  });

  const updateAlertMutation = useMutation({
    mutationFn: ({ alertId, status }: { alertId: string; status: AlertStatus }) =>
      updateAlertStatus(alertId, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts', 'case', id] });
      success('Alert status updated');
    },
    onError: (err) => {
      toastError(getErrorMessage(err), 'Status update failed');
    },
  });

  // Upload handler
  const handleDocUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const fd = new FormData();
    fd.append('case_id', id);

    if (docUploadMode === 'file') {
      if (!uploadFile) {
        toastError('Please select a file to upload');
        return;
      }
      if (uploadFile.size > 10 * 1024 * 1024) {
        toastError('File size exceeds 10 MB limit');
        return;
      }
      fd.append('file', uploadFile);
    } else {
      if (!pasteText.trim()) {
        toastError('Please enter text to process');
        return;
      }
      const fileName = pasteFileName.trim()
        ? (pasteFileName.endsWith('.txt') ? pasteFileName : `${pasteFileName}.txt`)
        : 'pasted-notes.txt';
      const file = new File([pasteText], fileName, { type: 'text/plain' });
      fd.append('file', file);
    }

    uploadDocMutation.mutate(fd);
  };

  // 404 / Missing error state
  if (caseError) {
    return (
      <div className="space-y-6">
        <Link to="/cases" className="text-xs text-text-secondary hover:text-text-primary flex items-center gap-1.5">
          <ArrowLeft className="w-4 h-4" /> Back to Investigations
        </Link>
        <div className="bg-surface border border-status-error/30 rounded-card p-12 text-center max-w-lg mx-auto">
          <AlertTriangle className="w-12 h-12 text-status-error mx-auto mb-4" />
          <h2 className="text-xl font-bold text-text-primary mb-2">Investigation Not Found</h2>
          <p className="text-sm text-text-secondary mb-6 leading-relaxed">
            The requested investigation case ID <code className="font-mono text-accent">{id}</code> does not exist or
            has been removed.
          </p>
          <Button onClick={() => navigate('/cases')} icon={<Briefcase className="w-4 h-4" />}>
            Return to Investigations List
          </Button>
        </div>
      </div>
    );
  }

  if (caseLoading) {
    return (
      <div className="space-y-6">
        <div className="h-28 bg-surface border border-border rounded-card animate-pulse" />
        <CardSkeleton count={4} />
      </div>
    );
  }

  const nodes = graphData?.data?.nodes || [];
  const edges = graphData?.data?.edges || [];

  return (
    <div className="space-y-6">
      {/* Back link */}
      <div>
        <Link
          to="/cases"
          className="inline-flex items-center gap-1.5 text-xs text-text-secondary hover:text-text-primary transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Investigations
        </Link>
      </div>

      {/* Case Header Card */}
      <Card className="border-border">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="font-mono text-sm font-bold text-accent px-2 py-0.5 rounded bg-accent/10 border border-accent/20">
                {caseData?.case_number}
              </span>
              <StatusBadge status={caseData?.status} />
              <span className="text-xs uppercase px-2 py-0.5 rounded bg-surface-raised border border-border text-text-secondary font-medium">
                {caseData?.priority || 'standard'} Priority
              </span>
            </div>

            <h2 className="text-2xl font-bold text-text-primary tracking-tight">{caseData?.title}</h2>

            {caseData?.description && (
              <p className="text-sm text-text-secondary max-w-3xl leading-relaxed">{caseData.description}</p>
            )}

            <div className="flex items-center gap-6 pt-2 text-xs text-text-muted flex-wrap">
              <span className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-text-muted" />
                Lead: <strong className="text-text-secondary font-medium">{caseData?.created_by || 'Unassigned'}</strong>
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-text-muted" />
                Opened: <span className="text-text-secondary tabular-nums">
                  {caseData?.created_at ? new Date(caseData.created_at).toLocaleDateString() : '—'}
                </span>
              </span>
            </div>
          </div>

          <div className="shrink-0 flex items-center gap-3">
            <Button
              onClick={() => navigate(`/cases/${id}/graph`)}
              icon={<Network className="w-4 h-4" />}
            >
              Link Analysis Graph
            </Button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 mt-6 border-t border-border pt-4 overflow-x-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'overview'
                ? 'bg-accent/15 text-accent font-semibold border border-accent/25'
                : 'text-text-secondary hover:text-text-primary hover:bg-surface-raised'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('entities')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === 'entities'
                ? 'bg-accent/15 text-accent font-semibold border border-accent/25'
                : 'text-text-secondary hover:text-text-primary hover:bg-surface-raised'
            }`}
          >
            Entities
            <span className="px-1.5 py-0.2 rounded bg-surface-raised text-xs font-mono tabular-nums text-text-secondary">
              {nodes.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('documents')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === 'documents'
                ? 'bg-accent/15 text-accent font-semibold border border-accent/25'
                : 'text-text-secondary hover:text-text-primary hover:bg-surface-raised'
            }`}
          >
            Documents
            <span className="px-1.5 py-0.2 rounded bg-surface-raised text-xs font-mono tabular-nums text-text-secondary">
              {documents.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('sources')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === 'sources'
                ? 'bg-accent/15 text-accent font-semibold border border-accent/25'
                : 'text-text-secondary hover:text-text-primary hover:bg-surface-raised'
            }`}
          >
            Sources
            <span className="px-1.5 py-0.2 rounded bg-surface-raised text-xs font-mono tabular-nums text-text-secondary">
              {sources.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('alerts')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === 'alerts'
                ? 'bg-accent/15 text-accent font-semibold border border-accent/25'
                : 'text-text-secondary hover:text-text-primary hover:bg-surface-raised'
            }`}
          >
            Alerts
            <span className="px-1.5 py-0.2 rounded bg-surface-raised text-xs font-mono tabular-nums text-text-secondary">
              {alerts.length}
            </span>
          </button>
        </div>
      </Card>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <Card className="flex flex-col justify-between">
              <div className="text-xs font-semibold uppercase text-text-muted">Linked Entities</div>
              <div className="text-2xl font-bold text-text-primary tabular-nums mt-1">{nodes.length}</div>
              <div className="text-[11px] text-text-muted mt-1">From network graph</div>
            </Card>

            <Card className="flex flex-col justify-between">
              <div className="text-xs font-semibold uppercase text-text-muted">Internal Links</div>
              <div className="text-2xl font-bold text-text-primary tabular-nums mt-1">{edges.length}</div>
              <div className="text-[11px] text-text-muted mt-1">Inter-entity edges</div>
            </Card>

            <Card className="flex flex-col justify-between">
              <div className="text-xs font-semibold uppercase text-text-muted">Evidence Files</div>
              <div className="text-2xl font-bold text-text-primary tabular-nums mt-1">{documents.length}</div>
              <div className="text-[11px] text-text-muted mt-1">Processed documents</div>
            </Card>

            <Card className="flex flex-col justify-between">
              <div className="text-xs font-semibold uppercase text-text-muted">Intelligence Sources</div>
              <div className="text-2xl font-bold text-text-primary tabular-nums mt-1">{sources.length}</div>
              <div className="text-[11px] text-text-muted mt-1">Connected data origins</div>
            </Card>

            <Card className="flex flex-col justify-between">
              <div className="text-xs font-semibold uppercase text-text-muted">Active Alerts</div>
              <div className="text-2xl font-bold text-text-primary tabular-nums mt-1">{alerts.length}</div>
              <div className="text-[11px] text-text-muted mt-1">Flagged triggers</div>
            </Card>
          </div>

          {/* Quick Actions Panel */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="hover:border-accent/40 transition-colors flex flex-col justify-between">
              <div>
                <div className="w-9 h-9 rounded-lg bg-[#818CF8]/15 border border-[#818CF8]/30 flex items-center justify-center text-[#818CF8] mb-3">
                  <Users className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-semibold text-text-primary">Link Suspects & Persons</h4>
                <p className="text-xs text-text-secondary mt-1 leading-relaxed">
                  Associate existing entities in the repository directly to this case file.
                </p>
              </div>
              <div className="pt-4">
                <Button size="sm" variant="secondary" onClick={() => setIsLinkEntityOpen(true)} icon={<Plus className="w-3.5 h-3.5" />}>
                  Link Entity
                </Button>
              </div>
            </Card>

            <Card className="hover:border-accent/40 transition-colors flex flex-col justify-between">
              <div>
                <div className="w-9 h-9 rounded-lg bg-[#FBBF24]/15 border border-[#FBBF24]/30 flex items-center justify-center text-[#FBBF24] mb-3">
                  <FileText className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-semibold text-text-primary">Upload Evidence File</h4>
                <p className="text-xs text-text-secondary mt-1 leading-relaxed">
                  Extract entities and mentions from intelligence reports, statements, or transcripts (.pdf/.txt).
                </p>
              </div>
              <div className="pt-4">
                <Button size="sm" variant="secondary" onClick={() => setIsUploadDocOpen(true)} icon={<Upload className="w-3.5 h-3.5" />}>
                  Upload File
                </Button>
              </div>
            </Card>

            <Card className="hover:border-accent/40 transition-colors flex flex-col justify-between">
              <div>
                <div className="w-9 h-9 rounded-lg bg-accent/15 border border-accent/30 flex items-center justify-center text-accent mb-3">
                  <Network className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-semibold text-text-primary">Interactive Graph Analysis</h4>
                <p className="text-xs text-text-secondary mt-1 leading-relaxed">
                  Visualize connections, compute shortest paths, and detect isolated or key hub entities.
                </p>
              </div>
              <div className="pt-4">
                <Button size="sm" onClick={() => navigate(`/cases/${id}/graph`)} icon={<ExternalLink className="w-3.5 h-3.5" />}>
                  Explore Network
                </Button>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Entities Tab */}
      {activeTab === 'entities' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-text-primary">Entities Linked to Investigation</h3>
              <p className="text-xs text-text-secondary mt-0.5">
                Persons, phone numbers, vehicles, and organizations connected to this case.
              </p>
            </div>
            <Button size="sm" onClick={() => setIsLinkEntityOpen(true)} icon={<Plus className="w-3.5 h-3.5" />}>
              Link Existing Entity
            </Button>
          </div>

          <DataTable
            data={nodes}
            columns={[
              {
                key: 'label',
                header: 'Entity Name / Value',
                render: (node) => (
                  <Link
                    to={`/entities/${node.id}`}
                    className="font-medium text-text-primary hover:text-accent transition-colors flex items-center gap-2"
                  >
                    <span>{node.label}</span>
                    <ExternalLink className="w-3 h-3 text-text-muted" />
                  </Link>
                ),
              },
              {
                key: 'type',
                header: 'Type',
                render: (node) => <EntityTypeBadge type={node.type} />,
              },
              {
                key: 'verification_status',
                header: 'Verification Status',
                render: (node) => <VerificationBadge status={node.verification_status} />,
              },
              {
                key: 'id',
                header: 'Entity ID',
                render: (node) => <span className="font-mono text-xs text-text-muted">{node.id}</span>,
              },
            ]}
            searchPlaceholder="Filter linked entities by name or type..."
            emptyTitle="No entities linked yet"
            emptyDescription="Link existing suspects or upload a document to auto-extract entity mentions."
            emptyAction={
              <Button size="sm" onClick={() => setIsLinkEntityOpen(true)} icon={<Plus className="w-3.5 h-3.5" />}>
                Link Entity
              </Button>
            }
          />
        </div>
      )}

      {/* Documents Tab */}
      {activeTab === 'documents' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-text-primary">Case Evidence Documents</h3>
              <p className="text-xs text-text-secondary mt-0.5">
                Uploaded case files, transcripts, and intelligence reports.
              </p>
            </div>
            <Button size="sm" onClick={() => setIsUploadDocOpen(true)} icon={<Upload className="w-3.5 h-3.5" />}>
              Upload Document
            </Button>
          </div>

          <DataTable
            data={documents}
            columns={[
              {
                key: 'file_name',
                header: 'File Name',
                render: (doc) => (
                  <Link
                    to={`/documents/${doc.id}`}
                    className="font-medium text-accent hover:underline flex items-center gap-1.5"
                  >
                    <FileText className="w-4 h-4 text-text-muted" />
                    {doc.file_name}
                  </Link>
                ),
              },
              {
                key: 'file_type',
                header: 'Type',
                render: (doc) => (
                  <span className="text-xs font-mono text-text-muted">{doc.file_type || 'text/plain'}</span>
                ),
              },
              {
                key: 'processing_status',
                header: 'Processing Status',
                render: (doc) => <StatusBadge status={doc.processing_status} />,
              },
              {
                key: 'uploaded_at',
                header: 'Uploaded Date',
                render: (doc) => (
                  <span className="text-xs text-text-muted tabular-nums">
                    {doc.uploaded_at ? new Date(doc.uploaded_at).toLocaleString() : '—'}
                  </span>
                ),
              },
              {
                key: 'actions',
                header: '',
                sortable: false,
                align: 'right',
                render: (doc) => (
                  <div className="flex items-center justify-end gap-2">
                    <Link
                      to={`/documents/${doc.id}`}
                      className="text-xs text-text-secondary hover:text-text-primary font-medium"
                    >
                      View Mentions
                    </Link>
                    <a
                      href={getDocumentDownloadUrl(doc.id)}
                      download
                      className="p-1 rounded text-text-muted hover:text-accent transition-colors"
                      title="Download file"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </a>
                  </div>
                ),
              },
            ]}
            searchPlaceholder="Search case documents..."
            emptyTitle="No documents uploaded for this case"
            emptyDescription="Upload PDF files or paste plain text transcripts to detect entities."
            emptyAction={
              <Button size="sm" onClick={() => setIsUploadDocOpen(true)} icon={<Upload className="w-3.5 h-3.5" />}>
                Upload Document
              </Button>
            }
          />
        </div>
      )}

      {/* Sources Tab */}
      {activeTab === 'sources' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-text-primary">Intelligence Sources</h3>
              <p className="text-xs text-text-secondary mt-0.5">
                Originators, intelligence feeds, and evidence custody records.
              </p>
            </div>
            <Button size="sm" onClick={() => setIsCreateSourceOpen(true)} icon={<Plus className="w-3.5 h-3.5" />}>
              Add Source
            </Button>
          </div>

          <DataTable
            data={sources}
            columns={[
              {
                key: 'source_name',
                header: 'Source Name',
                render: (s) => (
                  <div>
                    <div className="font-medium text-text-primary">{s.source_name}</div>
                    {s.description && <div className="text-xs text-text-muted truncate">{s.description}</div>}
                  </div>
                ),
              },
              {
                key: 'source_type',
                header: 'Type',
                render: (s) => (
                  <span className="text-xs font-medium px-2 py-0.5 rounded bg-surface-raised border border-border text-text-secondary">
                    {s.source_type}
                  </span>
                ),
              },
              {
                key: 'reference_code',
                header: 'Ref Code',
                render: (s) => (
                  <span className="font-mono text-xs text-text-muted">{s.reference_code || '—'}</span>
                ),
              },
              {
                key: 'created_at',
                header: 'Registered Date',
                render: (s) => (
                  <span className="text-xs text-text-muted tabular-nums">
                    {s.created_at ? new Date(s.created_at).toLocaleDateString() : '—'}
                  </span>
                ),
              },
            ]}
            emptyTitle="No sources registered for this case"
            emptyDescription="Attach reference sources such as CDR exports, informant briefs, or surveillance logs."
            emptyAction={
              <Button size="sm" onClick={() => setIsCreateSourceOpen(true)} icon={<Plus className="w-3.5 h-3.5" />}>
                Add Source
              </Button>
            }
          />
        </div>
      )}

      {/* Alerts Tab */}
      {activeTab === 'alerts' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-text-primary">Case Alerts & Triggers</h3>
              <p className="text-xs text-text-secondary mt-0.5">
                Critical leads, high-priority notifications, and case alerts.
              </p>
            </div>
            <Button size="sm" onClick={() => setIsCreateAlertOpen(true)} icon={<Plus className="w-3.5 h-3.5" />}>
              Flag New Alert
            </Button>
          </div>

          <DataTable
            data={alerts}
            columns={[
              {
                key: 'title',
                header: 'Alert Title & Summary',
                render: (a) => (
                  <div>
                    <div className="font-medium text-text-primary">{a.title}</div>
                    <div className="text-xs text-text-muted truncate mt-0.5">{a.description}</div>
                  </div>
                ),
              },
              {
                key: 'severity',
                header: 'Severity',
                render: (a) => <SeverityBadge severity={a.severity} />,
              },
              {
                key: 'status',
                header: 'Status',
                render: (a) => <StatusBadge status={a.status} />,
              },
              {
                key: 'created_at',
                header: 'Flagged Date',
                render: (a) => (
                  <span className="text-xs text-text-muted tabular-nums">
                    {a.created_at ? new Date(a.created_at).toLocaleString() : '—'}
                  </span>
                ),
              },
              {
                key: 'quick_action',
                header: 'Update Status',
                sortable: false,
                align: 'right',
                render: (a) => (
                  <div className="flex items-center justify-end gap-1.5">
                    {a.status === 'new' && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => updateAlertMutation.mutate({ alertId: a.id, status: 'reviewing' })}
                      >
                        Review
                      </Button>
                    )}
                    {a.status !== 'resolved' && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => updateAlertMutation.mutate({ alertId: a.id, status: 'resolved' })}
                      >
                        Resolve
                      </Button>
                    )}
                    {a.status !== 'dismissed' && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => updateAlertMutation.mutate({ alertId: a.id, status: 'dismissed' })}
                      >
                        Dismiss
                      </Button>
                    )}
                  </div>
                ),
              },
            ]}
            emptyTitle="No alerts flagged for this case"
            emptyDescription="User-created alerts will appear here. Note: nothing creates alerts automatically."
            emptyAction={
              <Button size="sm" onClick={() => setIsCreateAlertOpen(true)} icon={<Plus className="w-3.5 h-3.5" />}>
                Flag Alert
              </Button>
            }
          />
        </div>
      )}

      {/* Link Existing Entity Dialog */}
      <Modal
        isOpen={isLinkEntityOpen}
        onClose={() => setIsLinkEntityOpen(false)}
        title="Link Existing Entity to Investigation"
        description="Select an existing entity record from the repository to associate with this case."
      >
        <div className="space-y-4">
          <Select
            label="Select Entity to Link"
            required
            value={selectedEntityIdToLink}
            onChange={(e) => setSelectedEntityIdToLink(e.target.value)}
          >
            <option value="">-- Choose an entity --</option>
            {allEntities.map((ent) => (
              <option key={ent.id} value={ent.id}>
                {ent.canonical_name} ({ent.entity_type}) — {ent.id.slice(0, 8)}...
              </option>
            ))}
          </Select>

          <p className="text-xs text-text-muted">
            If the entity is already linked, the system will report "already linked" without creating duplicates.
          </p>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
            <Button variant="secondary" onClick={() => setIsLinkEntityOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={!selectedEntityIdToLink}
              isLoading={linkEntityMutation.isPending}
              onClick={() => linkEntityMutation.mutate(selectedEntityIdToLink)}
            >
              Link to Case
            </Button>
          </div>
        </div>
      </Modal>

      {/* Upload Document Dialog */}
      <Modal
        isOpen={isUploadDocOpen}
        onClose={() => setIsUploadDocOpen(false)}
        title="Upload Investigation Document"
        description="Process a .pdf or .txt document (max 10 MB). Text and entities will be extracted."
      >
        <form onSubmit={handleDocUploadSubmit} className="space-y-4">
          {/* Mode Switcher Tabs */}
          <div className="flex items-center gap-2 p-1 rounded-lg bg-surface-raised border border-border">
            <button
              type="button"
              onClick={() => setDocUploadMode('file')}
              className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${
                docUploadMode === 'file' ? 'bg-surface text-text-primary shadow-sm' : 'text-text-muted hover:text-text-secondary'
              }`}
            >
              Upload .PDF / .TXT
            </button>
            <button
              type="button"
              onClick={() => setDocUploadMode('text')}
              className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${
                docUploadMode === 'text' ? 'bg-surface text-text-primary shadow-sm' : 'text-text-muted hover:text-text-secondary'
              }`}
            >
              Paste Text Directly
            </button>
          </div>

          {docUploadMode === 'file' ? (
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">
                File (.pdf or .txt, max 10 MB) <span className="text-status-error">*</span>
              </label>
              <input
                type="file"
                accept=".pdf,.txt"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  if (file && file.size > 10 * 1024 * 1024) {
                    toastError('Selected file exceeds 10 MB limit');
                    setUploadFile(null);
                    return;
                  }
                  setUploadFile(file);
                }}
                className="w-full text-sm text-text-secondary file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-surface-raised file:text-accent hover:file:bg-bg-hover cursor-pointer border border-border rounded-lg p-2 bg-surface-raised/40"
              />
              <p className="text-[11px] text-text-muted mt-1.5">
                Scanned PDFs without digital text will produce an empty extraction notice.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <Input
                label="Virtual File Name"
                placeholder="e.g. suspect-interview.txt"
                value={pasteFileName}
                onChange={(e) => setPasteFileName(e.target.value)}
                helperText="Will be sent as a .txt file"
              />
              <Textarea
                label="Evidence Text to Extract"
                required
                rows={6}
                placeholder="Paste statements, phone numbers, plate numbers, emails, transcripts..."
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
              />
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
            <Button type="button" variant="secondary" onClick={() => setIsUploadDocOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={uploadDocMutation.isPending} icon={<Upload className="w-3.5 h-3.5" />}>
              Process & Extract Entities
            </Button>
          </div>
        </form>
      </Modal>

      {/* Add Source Dialog */}
      <Modal
        isOpen={isCreateSourceOpen}
        onClose={() => setIsCreateSourceOpen(false)}
        title="Add Information Source"
        description="Register a data source origin for this investigation."
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!sourceForm.source_type.trim() || !sourceForm.source_name.trim()) {
              toastError('Source type and source name are required');
              return;
            }
            createSourceMutation.mutate(sourceForm);
          }}
          className="space-y-4"
        >
          <Input
            label="Source Type"
            required
            placeholder="e.g. Telecom CDR, Bank Statement, Surveillance Log, Informant"
            value={sourceForm.source_type}
            onChange={(e) => setSourceForm({ ...sourceForm, source_type: e.target.value })}
            helperText="Free text per backend contract"
          />

          <Input
            label="Source Name"
            required
            placeholder="e.g. Airtel CDR Tower Dump - North Sector"
            value={sourceForm.source_name}
            onChange={(e) => setSourceForm({ ...sourceForm, source_name: e.target.value })}
          />

          <Input
            label="Reference Code"
            placeholder="e.g. REF-CDR-2026-X01"
            value={sourceForm.reference_code || ''}
            onChange={(e) => setSourceForm({ ...sourceForm, reference_code: e.target.value })}
          />

          <Textarea
            label="Description"
            rows={2}
            placeholder="Custody details, collection date, notes..."
            value={sourceForm.description || ''}
            onChange={(e) => setSourceForm({ ...sourceForm, description: e.target.value })}
          />

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
            <Button type="button" variant="secondary" onClick={() => setIsCreateSourceOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={createSourceMutation.isPending}>
              Add Source
            </Button>
          </div>
        </form>
      </Modal>

      {/* Add Alert Dialog */}
      <Modal
        isOpen={isCreateAlertOpen}
        onClose={() => setIsCreateAlertOpen(false)}
        title="Flag Investigation Alert"
        description="Create a manual priority alert for this case."
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!alertForm.alert_type.trim() || !alertForm.title.trim() || !alertForm.description.trim()) {
              toastError('Alert type, title, and description are required');
              return;
            }
            createAlertMutation.mutate(alertForm);
          }}
          className="space-y-4"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Alert Type"
              required
              placeholder="e.g. Flight Risk, Money Transfer, Vehicle Sighting"
              value={alertForm.alert_type}
              onChange={(e) => setAlertForm({ ...alertForm, alert_type: e.target.value })}
              helperText="Free text per backend contract"
            />
            <Select
              label="Severity Level"
              value={alertForm.severity}
              onChange={(e) => setAlertForm({ ...alertForm, severity: e.target.value as AlertSeverity })}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </Select>
          </div>

          <Input
            label="Alert Title"
            required
            placeholder="e.g. Unregistered SIM card active in target zone"
            value={alertForm.title}
            onChange={(e) => setAlertForm({ ...alertForm, title: e.target.value })}
          />

          <Textarea
            label="Description / Intelligence Details"
            required
            rows={3}
            placeholder="Detailed trigger rationale and recommended actions..."
            value={alertForm.description}
            onChange={(e) => setAlertForm({ ...alertForm, description: e.target.value })}
          />

          <p className="text-[11px] text-text-muted">
            Note: Nothing creates alerts automatically in the backend.
          </p>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
            <Button type="button" variant="secondary" onClick={() => setIsCreateAlertOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={createAlertMutation.isPending}>
              Flag Alert
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
