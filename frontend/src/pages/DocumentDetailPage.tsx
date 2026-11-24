import React, { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  FileText,
  Download,
  ArrowLeft,
  Search,
  ExternalLink,
  ShieldAlert,
  Calendar,
  Layers,
  Hash,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react';
import {
  fetchDocumentById,
  fetchDocumentMentions,
  fetchCaseById,
  getDocumentDownloadUrl,
} from '../api';
import { Card, CardHeader, CardTitle, CardDescription } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { StatusBadge, EntityTypeBadge } from '../components/common/Badge';
import { DataTable, Column } from '../components/common/DataTable';
import { CardSkeleton, TableSkeleton } from '../components/common/LoadingSkeleton';
import { ErrorMessage } from '../components/common/ErrorMessage';
import type { Document, DocumentMention } from '../types';

export const DocumentDetailPage: React.FC = () => {
  const { id = '' } = useParams<{ id: string }>();
  const [inTextSearch, setInTextSearch] = useState('');

  const {
    data: document,
    isLoading: docLoading,
    error: docError,
    refetch,
  } = useQuery({
    queryKey: ['documents', id],
    queryFn: () => fetchDocumentById(id),
    enabled: !!id,
  });

  const { data: mentions = [], isLoading: mentionsLoading } = useQuery({
    queryKey: ['documents', id, 'mentions'],
    queryFn: () => fetchDocumentMentions(id),
    enabled: !!id,
  });

  const { data: caseData } = useQuery({
    queryKey: ['cases', document?.case_id],
    queryFn: () => fetchCaseById(document!.case_id),
    enabled: !!document?.case_id,
  });

  // Highlight in-text search and mention spans
  // Rule: mention highlighting using start_offset/end_offset only if the substring at that offset matches mention_text!
  const renderedExtractedText = useMemo(() => {
    const text = document?.extracted_text;
    if (!text) return null;

    if (!inTextSearch.trim()) {
      return <span>{text}</span>;
    }

    // Highlight search query
    const regex = new RegExp(`(${inTextSearch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    return (
      <span>
        {parts.map((part, i) =>
          regex.test(part) ? (
            <mark key={i} className="bg-accent/30 text-accent font-semibold px-0.5 rounded">
              {part}
            </mark>
          ) : (
            <span key={i}>{part}</span>
          )
        )}
      </span>
    );
  }, [document?.extracted_text, inTextSearch]);

  if (docError) {
    return (
      <div className="space-y-6">
        <Link to="/documents" className="text-xs text-text-secondary hover:text-text-primary flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" /> Back to Documents
        </Link>
        <ErrorMessage
          title="Document not found"
          message="Could not load the requested document record from the server."
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  if (docLoading) {
    return (
      <div className="space-y-6">
        <div className="h-32 bg-surface border border-border rounded-card animate-pulse" />
        <CardSkeleton count={2} />
      </div>
    );
  }

  const mentionsColumns: Column<DocumentMention>[] = [
    {
      key: 'mention_text',
      header: 'Mention Text',
      render: (row) => (
        <span className="font-mono text-sm font-semibold text-text-primary">
          {row.mention_text}
        </span>
      ),
    },
    {
      key: 'entity_type',
      header: 'Entity Type',
      render: (row) => <EntityTypeBadge type={row.entity_type} />,
    },
    {
      key: 'confidence',
      header: 'Confidence',
      render: (row) => {
        const confPct = Math.round((row.confidence || 0) * 100);
        // Detection facts per prompt:
        // phones/vehicles/emails are high confidence (0.90–0.99; emails have entity_type:"other");
        // person mentions are candidates with confidence 0.60 and many false positives → label "candidate — needs review"
        const isPersonCandidate = row.entity_type === 'person' && row.confidence <= 0.65;
        return (
          <div className="flex items-center gap-2">
            <span className="font-mono tabular-nums text-xs text-text-primary">{confPct}%</span>
            {isPersonCandidate ? (
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-status-warning/15 text-status-warning border border-status-warning/30">
                candidate — needs review
              </span>
            ) : confPct >= 90 ? (
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-status-success/15 text-status-success border border-status-success/30">
                high confidence
              </span>
            ) : null}
          </div>
        );
      },
    },
    {
      key: 'extraction_method',
      header: 'Extraction Method',
      render: (row) => (
        <span className="text-xs font-mono text-text-muted">{row.extraction_method || 'rule_based'}</span>
      ),
    },
    {
      key: 'offsets',
      header: 'Text Offsets',
      render: (row) => (
        <span className="font-mono text-xs text-text-muted">
          [{row.start_offset} : {row.end_offset}]
        </span>
      ),
    },
    {
      key: 'resolved_entity_id',
      header: 'Resolved Entity Link',
      render: (row) =>
        row.resolved_entity_id ? (
          <Link
            to={`/entities/${row.resolved_entity_id}`}
            className="text-xs text-accent hover:underline flex items-center gap-1 font-medium"
          >
            <span>View Entity Profile</span>
            <ExternalLink className="w-3 h-3" />
          </Link>
        ) : (
          <span className="text-xs text-text-muted">Unresolved</span>
        ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <Link
          to="/documents"
          className="inline-flex items-center gap-1.5 text-xs text-text-secondary hover:text-text-primary transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Documents
        </Link>
      </div>

      {/* Document Metadata Header */}
      <Card className="border-border">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-surface-raised border border-border text-text-muted">
                {document?.file_type}
              </span>
              <StatusBadge status={document?.processing_status} />
            </div>

            <h2 className="text-2xl font-bold text-text-primary tracking-tight flex items-center gap-2">
              <FileText className="w-6 h-6 text-accent" />
              {document?.file_name}
            </h2>

            <div className="flex items-center gap-6 pt-2 text-xs text-text-muted flex-wrap">
              {caseData && (
                <span className="flex items-center gap-1.5">
                  Investigation:
                  <Link
                    to={`/cases/${caseData.id}`}
                    className="text-accent hover:underline font-medium flex items-center gap-1"
                  >
                    {caseData.case_number} - {caseData.title}
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-text-muted" />
                Uploaded:{' '}
                <span className="text-text-secondary tabular-nums">
                  {document?.uploaded_at ? new Date(document.uploaded_at).toLocaleString() : '—'}
                </span>
              </span>
              {document?.file_hash && (
                <span className="font-mono text-[11px] text-text-muted flex items-center gap-1 truncate max-w-xs">
                  <Hash className="w-3 h-3" />
                  SHA256: {document.file_hash.slice(0, 16)}...
                </span>
              )}
            </div>
          </div>

          <div className="shrink-0">
            <a
              href={getDocumentDownloadUrl(id)}
              download
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm bg-surface-raised hover:bg-bg-hover text-text-primary border border-border transition-colors"
            >
              <Download className="w-4 h-4 text-accent" />
              Download Original File
            </a>
          </div>
        </div>
      </Card>

      {/* Extracted Mentions Table */}
      <Card>
        <CardHeader
          action={
            <div className="text-xs text-text-muted tabular-nums">
              Total mentions extracted: <span className="font-semibold text-text-primary">{mentions.length}</span>
            </div>
          }
        >
          <CardTitle>Extracted Entity Mentions</CardTitle>
          <CardDescription>
            Entities detected in this document via forensic regex and NLP pipelines.
          </CardDescription>
        </CardHeader>

        <DataTable
          data={mentions}
          columns={mentionsColumns}
          searchPlaceholder="Search mentions by text or type..."
          isLoading={mentionsLoading}
          emptyTitle="No entity mentions extracted"
          emptyDescription="No recognizable phone numbers, emails, vehicle plates, or names were detected in this document."
        />
      </Card>

      {/* Extracted Text Viewer with In-Text Search */}
      <Card>
        <CardHeader
          action={
            <div className="relative w-64">
              <Search className="w-3.5 h-3.5 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={inTextSearch}
                onChange={(e) => setInTextSearch(e.target.value)}
                placeholder="Search inside text..."
                className="w-full bg-surface-raised border border-border rounded-lg pl-8 pr-3 py-1.5 text-xs text-text-primary placeholder-text-muted focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>
          }
        >
          <CardTitle>Extracted Document Text</CardTitle>
          <CardDescription>
            Clean digital text parsed from the uploaded evidence file.
          </CardDescription>
        </CardHeader>

        {!document?.extracted_text ? (
          <div className="p-8 text-center bg-surface-raised/30 border border-border-subtle rounded-lg">
            <AlertTriangle className="w-8 h-8 text-text-muted mx-auto mb-2" />
            <div className="text-sm font-medium text-text-secondary">No text could be extracted</div>
            <div className="text-xs text-text-muted mt-1 max-w-sm mx-auto">
              Scanned PDFs without digital OCR layers or empty files produce no extractable text.
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-lg bg-bg-canvas border border-border-subtle font-mono text-xs leading-relaxed text-text-primary max-h-[500px] overflow-y-auto whitespace-pre-wrap select-text">
            {renderedExtractedText}
          </div>
        )}
      </Card>
    </div>
  );
};
