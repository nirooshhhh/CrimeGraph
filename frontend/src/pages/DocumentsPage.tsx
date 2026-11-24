import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import {
  FileText,
  Upload,
  Download,
  ExternalLink,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import {
  fetchDocuments,
  uploadDocument,
  fetchCases,
  fetchSources,
  getDocumentDownloadUrl,
} from '../api';
import { DataTable, Column } from '../components/common/DataTable';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { Input, Select, Textarea } from '../components/common/FormFields';
import { StatusBadge, EntityTypeBadge } from '../components/common/Badge';
import { Card } from '../components/common/Card';
import { useToast } from '../context/ToastContext';
import { getErrorMessage } from '../api/client';
import type { Document, DocumentUploadResponse } from '../types';

export const DocumentsPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { success, error: toastError, info } = useToast();

  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [selectedCaseId, setSelectedCaseId] = useState('');
  const [selectedSourceId, setSelectedSourceId] = useState('');
  const [uploadMode, setUploadMode] = useState<'file' | 'text'>('file');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [pasteText, setPasteText] = useState('');
  const [pasteFileName, setPasteFileName] = useState('');

  // Results panel state after upload
  const [lastUploadResult, setLastUploadResult] = useState<DocumentUploadResponse | null>(null);

  const { data: documents = [], isLoading } = useQuery({
    queryKey: ['documents'],
    queryFn: fetchDocuments,
  });

  const { data: cases = [] } = useQuery({
    queryKey: ['cases'],
    queryFn: fetchCases,
  });

  const { data: sources = [] } = useQuery({
    queryKey: ['sources'],
    queryFn: fetchSources,
  });

  const caseMap = React.useMemo(() => {
    const map = new Map<string, string>();
    cases.forEach((c) => map.set(c.id, `${c.case_number} - ${c.title}`));
    return map;
  }, [cases]);

  const uploadMutation = useMutation({
    mutationFn: (fd: FormData) => uploadDocument(fd),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      queryClient.invalidateQueries({ queryKey: ['entities'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      success(`File "${res.data.file_name}" uploaded and processed successfully!`);
      setLastUploadResult(res);
      setUploadFile(null);
      setPasteText('');
      setPasteFileName('');
    },
    onError: (err) => {
      toastError(getErrorMessage(err), 'Document upload failed');
    },
  });

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCaseId) {
      toastError('Please select an investigation for this document');
      return;
    }

    const fd = new FormData();
    fd.append('case_id', selectedCaseId);
    if (selectedSourceId) fd.append('source_id', selectedSourceId);

    if (uploadMode === 'file') {
      if (!uploadFile) {
        toastError('Please select a .pdf or .txt file');
        return;
      }
      if (uploadFile.size > 10 * 1024 * 1024) {
        toastError('File size exceeds 10 MB limit');
        return;
      }
      const ext = uploadFile.name.toLowerCase();
      if (!ext.endsWith('.pdf') && !ext.endsWith('.txt')) {
        toastError('Only .pdf and .txt files are supported');
        return;
      }
      fd.append('file', uploadFile);
    } else {
      if (!pasteText.trim()) {
        toastError('Please enter text to extract');
        return;
      }
      const fname = pasteFileName.trim()
        ? (pasteFileName.toLowerCase().endsWith('.txt') ? pasteFileName : `${pasteFileName}.txt`)
        : 'pasted-document.txt';
      const file = new File([pasteText], fname, { type: 'text/plain' });
      fd.append('file', file);
    }

    uploadMutation.mutate(fd);
  };

  const columns: Column<Document>[] = [
    {
      key: 'file_name',
      header: 'File Name',
      render: (row) => (
        <Link
          to={`/documents/${row.id}`}
          className="font-medium text-accent hover:underline flex items-center gap-2"
        >
          <FileText className="w-4 h-4 text-text-muted" />
          <span>{row.file_name}</span>
        </Link>
      ),
    },
    {
      key: 'case_id',
      header: 'Investigation Case',
      render: (row) => (
        <Link
          to={`/cases/${row.case_id}`}
          className="text-xs text-text-secondary hover:text-text-primary flex items-center gap-1 font-medium"
        >
          <span>{caseMap.get(row.case_id) || `${row.case_id.slice(0, 8)}...`}</span>
          <ExternalLink className="w-3 h-3 text-text-muted" />
        </Link>
      ),
    },
    {
      key: 'file_type',
      header: 'File Type',
      render: (row) => (
        <span className="text-xs font-mono text-text-muted">{row.file_type || 'text/plain'}</span>
      ),
    },
    {
      key: 'processing_status',
      header: 'Processing Status',
      render: (row) => <StatusBadge status={row.processing_status} />,
    },
    {
      key: 'uploaded_at',
      header: 'Uploaded Date',
      render: (row) => (
        <span className="text-xs text-text-muted tabular-nums">
          {row.uploaded_at ? new Date(row.uploaded_at).toLocaleString() : '—'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      sortable: false,
      align: 'right',
      render: (row) => (
        <div className="flex items-center justify-end gap-3">
          <Link
            to={`/documents/${row.id}`}
            className="text-xs text-accent hover:underline font-medium"
          >
            Mentions & Text
          </Link>
          <a
            href={getDocumentDownloadUrl(row.id)}
            download
            className="p-1 rounded text-text-muted hover:text-accent transition-colors"
            title="Download document file"
            onClick={(e) => e.stopPropagation()}
          >
            <Download className="w-4 h-4" />
          </a>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-text-primary">Document Intelligence</h2>
          <p className="text-sm text-text-secondary mt-1">
            Forensic NLP parsing, automatic entity extraction, and case document storage.
          </p>
        </div>
        <Button onClick={() => setIsUploadOpen(true)} icon={<Upload className="w-4 h-4" />}>
          Upload Document
        </Button>
      </div>

      {/* Extraction Results Banner if recently uploaded */}
      {lastUploadResult && (
        <Card className="border-accent/40 bg-surface-raised/40 p-5 space-y-4 animate-fade-in">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-status-success/15 border border-status-success/30 flex items-center justify-center text-status-success">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-text-primary">
                  Document Uploaded: {lastUploadResult.data.file_name}
                </h4>
                <p className="text-xs text-text-secondary">
                  Extracted {lastUploadResult.extraction?.textLength || 0} characters •{' '}
                  {lastUploadResult.extraction?.entitiesDetected || 0} entities auto-detected & linked to case.
                </p>
              </div>
            </div>

            <Button
              size="sm"
              variant="secondary"
              onClick={() => navigate(`/documents/${lastUploadResult.data.id}`)}
              icon={<ExternalLink className="w-3.5 h-3.5" />}
            >
              View Document Details
            </Button>
          </div>

          {/* Warning if entityExtractionError is non-null */}
          {lastUploadResult.extraction?.entityExtractionError && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-status-warning/10 border border-status-warning/30 text-xs text-status-warning">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>
                Document was saved, but entity detection produced a warning:{' '}
                {lastUploadResult.extraction.entityExtractionError}
              </span>
            </div>
          )}

          {/* Detected Entities List */}
          {lastUploadResult.extraction?.entities && lastUploadResult.extraction.entities.length > 0 && (
            <div>
              <div className="text-xs font-semibold uppercase text-text-muted mb-2">
                Detected Entities (Click to inspect profile):
              </div>
              <div className="flex flex-wrap gap-2">
                {lastUploadResult.extraction.entities.map((item, idx) => (
                  <Link
                    key={idx}
                    to={`/entities/${item.entity_id}`}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface border border-border hover:border-accent text-xs font-medium text-text-primary transition-colors"
                  >
                    <EntityTypeBadge type={item.entity_type} />
                    <span>{item.mention}</span>
                    <ArrowRight className="w-3 h-3 text-text-muted" />
                  </Link>
                ))}
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Table (NO extracted text rendered in lists per prompt) */}
      <DataTable
        data={documents}
        columns={columns}
        searchPlaceholder="Search documents by file name..."
        isLoading={isLoading}
        emptyTitle="No documents uploaded yet"
        emptyDescription="Upload PDF files or text transcripts to extract phones, vehicles, emails, and suspects."
        emptyAction={
          <Button size="sm" onClick={() => setIsUploadOpen(true)} icon={<Upload className="w-3.5 h-3.5" />}>
            Upload Document
          </Button>
        }
      />

      {/* Upload Document Modal */}
      <Modal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        title="Upload & Parse Evidence Document"
        description="Select an investigation, upload a file or paste text. Max file size: 10 MB (.pdf, .txt)."
      >
        <form onSubmit={handleUploadSubmit} className="space-y-4">
          <Select
            label="Target Investigation Case"
            required
            value={selectedCaseId}
            onChange={(e) => setSelectedCaseId(e.target.value)}
          >
            <option value="">-- Select Investigation Case --</option>
            {cases.map((c) => (
              <option key={c.id} value={c.id}>
                {c.case_number} - {c.title}
              </option>
            ))}
          </Select>

          <Select
            label="Originating Source (Optional)"
            value={selectedSourceId}
            onChange={(e) => setSelectedSourceId(e.target.value)}
          >
            <option value="">-- No Source Specified --</option>
            {sources.map((s) => (
              <option key={s.id} value={s.id}>
                {s.source_name} ({s.source_type})
              </option>
            ))}
          </Select>

          {/* Mode Tabs */}
          <div className="flex items-center gap-2 p-1 rounded-lg bg-surface-raised border border-border">
            <button
              type="button"
              onClick={() => setUploadMode('file')}
              className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${
                uploadMode === 'file' ? 'bg-surface text-text-primary shadow-sm' : 'text-text-muted hover:text-text-secondary'
              }`}
            >
              Upload .PDF / .TXT File
            </button>
            <button
              type="button"
              onClick={() => setUploadMode('text')}
              className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${
                uploadMode === 'text' ? 'bg-surface text-text-primary shadow-sm' : 'text-text-muted hover:text-text-secondary'
              }`}
            >
              Paste Text Directly
            </button>
          </div>

          {uploadMode === 'file' ? (
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">
                Document File (.pdf, .txt ≤ 10 MB) <span className="text-status-error">*</span>
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
                placeholder="e.g. wiretap-transcript-01.txt"
                value={pasteFileName}
                onChange={(e) => setPasteFileName(e.target.value)}
                helperText="Will be packaged as a .txt File client-side"
              />
              <Textarea
                label="Raw Text to Extract"
                required
                rows={6}
                placeholder="Paste suspect communications, phone numbers (10 digits), vehicle plates (e.g. KA 05 AB 1234), or email addresses..."
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
              />
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsUploadOpen(false)}
              disabled={uploadMutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={uploadMutation.isPending} icon={<Upload className="w-3.5 h-3.5" />}>
              Upload & Extract
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
