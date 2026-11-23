import React, { useState, useEffect, useRef } from 'react'
import { useOutletContext } from 'react-router-dom'
import {
  FileText,
  Upload,
  Download,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  FolderOpen,
  FileCheck,
  Eye,
  FileCode,
  Layers,
  Sparkles,
} from 'lucide-react'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Modal } from '../components/ui/Modal'
import { EmptyState } from '../components/ui/EmptyState'
import { documentsService } from '../services/documentsService'
import { DEMO_DOCUMENTS, DEMO_DOCUMENT_MENTIONS, DEMO_CASES } from '../data/demoData'
import { DocumentItem, DocumentMention, Case } from '../types'
import {
  formatDate,
  formatBytes,
  formatRelativeTime,
  ENTITY_COLORS,
} from '../lib/utils'

export const DocumentsPage: React.FC = () => {
  const { cases, activeCaseId, isLiveApi } = useOutletContext<{
    cases: Case[]
    activeCaseId: string
    isLiveApi: boolean
  }>()

  const [documents, setDocuments] = useState<DocumentItem[]>(DEMO_DOCUMENTS)
  const [mentions, setMentions] = useState<DocumentMention[]>(DEMO_DOCUMENT_MENTIONS)
  const [selectedDoc, setSelectedDoc] = useState<DocumentItem | null>(DEMO_DOCUMENTS[0])
  const [docMentions, setDocMentions] = useState<DocumentMention[]>(
    DEMO_DOCUMENT_MENTIONS.filter((m) => m.document_id === DEMO_DOCUMENTS[0]?.id)
  )

  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [isLoading, setIsLoading] = useState(false)

  // Upload state
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [uploadCaseId, setUploadCaseId] = useState(activeCaseId === 'all' ? (cases[0]?.id || 'case-001') : activeCaseId)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const fetchDocs = async () => {
    setIsLoading(true)
    try {
      if (isLiveApi) {
        const data =
          activeCaseId === 'all'
            ? await documentsService.getDocuments()
            : await documentsService.getDocumentsByCase(activeCaseId)
        if (data && data.length > 0) {
          setDocuments(data)
          setSelectedDoc(data[0])
        }
      }
    } catch (err) {
      console.warn('Failed loading live documents', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchDocs()
  }, [activeCaseId, isLiveApi])

  // Select document and fetch mentions
  const handleSelectDoc = async (doc: DocumentItem) => {
    setSelectedDoc(doc)
    try {
      if (isLiveApi) {
        const m = await documentsService.getDocumentMentions(doc.id)
        setDocMentions(m)
      } else {
        const m = mentions.filter((item) => item.document_id === doc.id)
        setDocMentions(m)
      }
    } catch (e) {
      const m = mentions.filter((item) => item.document_id === doc.id)
      setDocMentions(m)
    }
  }

  // Handle Drag & Drop
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0])
    }
  }

  const validateAndSetFile = (file: File) => {
    setUploadError(null)
    const validExtensions = ['.pdf', '.txt']
    const ext = '.' + file.name.split('.').pop()?.toLowerCase()

    if (!validExtensions.includes(ext)) {
      setUploadError('Unsupported file format. Please upload PDF or TXT documents only.')
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      setUploadError('File size exceeds the 10 MB maximum operational limit.')
      return
    }

    setSelectedFile(file)
  }

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedFile || !uploadCaseId) return

    setIsUploading(true)
    setUploadProgress(20)
    setUploadError(null)

    try {
      // Simulate progress
      const interval = setInterval(() => {
        setUploadProgress((prev) => (prev < 90 ? prev + 25 : prev))
      }, 150)

      if (isLiveApi) {
        const newDoc = await documentsService.uploadDocument(uploadCaseId, selectedFile)
        clearInterval(interval)
        setUploadProgress(100)
        setDocuments((prev) => [newDoc, ...prev])
        setSelectedDoc(newDoc)
      } else {
        clearInterval(interval)
        setUploadProgress(100)
        const mockNewDoc: DocumentItem = {
          id: `doc-${Date.now()}`,
          case_id: uploadCaseId,
          title: selectedFile.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' '),
          filename: selectedFile.name,
          original_filename: selectedFile.name,
          file_size: selectedFile.size,
          mime_type: selectedFile.type || 'application/pdf',
          file_type: selectedFile.name.endsWith('.pdf') ? 'pdf' : 'txt',
          upload_date: new Date().toISOString(),
          created_at: new Date().toISOString(),
          processed_at: new Date().toISOString(),
          status: 'processed',
          mention_count: 3,
        }
        setDocuments((prev) => [mockNewDoc, ...prev])
        setSelectedDoc(mockNewDoc)

        // Mock extracted mentions
        const mockMentions: DocumentMention[] = [
          {
            id: `men-${Date.now()}-1`,
            document_id: mockNewDoc.id,
            text: 'Apex Global Logistics Corp',
            entity_type: 'organization',
            confidence: 0.94,
            is_verified: false,
          },
          {
            id: `men-${Date.now()}-2`,
            document_id: mockNewDoc.id,
            text: '+1 (555) 019-9944',
            entity_type: 'phone',
            confidence: 0.91,
            is_verified: false,
          },
          {
            id: `men-${Date.now()}-3`,
            document_id: mockNewDoc.id,
            text: 'Warehouse Bay 12, Pier 42',
            entity_type: 'location',
            confidence: 0.88,
            is_verified: false,
          },
        ]
        setMentions((prev) => [...mockMentions, ...prev])
        setDocMentions(mockMentions)
      }

      setTimeout(() => {
        setIsUploadModalOpen(false)
        setSelectedFile(null)
        setUploadProgress(0)
      }, 500)
    } catch (err: any) {
      setUploadError(err.message || 'Upload failed on API gateway')
    } finally {
      setIsUploading(false)
    }
  }

  const handleDownload = async (doc: DocumentItem) => {
    try {
      if (isLiveApi) {
        const blob = await documentsService.downloadDocument(doc.id)
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = doc.filename
        a.click()
        window.URL.revokeObjectURL(url)
      } else {
        // Create mock text blob for demo
        const demoContent = `CRIMEGRAPH FORENSIC DOCUMENT ARCHIVE\nFile: ${doc.filename}\nCase: ${doc.case_id}\nTimestamp: ${doc.created_at}\n\n[Demonstration Evidence Text Content Extracted for Analytical Review]`
        const blob = new Blob([demoContent], { type: 'text/plain' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = doc.filename
        a.click()
        window.URL.revokeObjectURL(url)
      }
    } catch (e) {
      console.error(e)
    }
  }

  const filteredDocs = documents.filter((d) => {
    const matchesSearch =
      d.filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (d.title && d.title.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesStatus = statusFilter === 'all' || d.status === statusFilter
    const matchesCase = activeCaseId === 'all' || d.case_id === activeCaseId
    return matchesSearch && matchesStatus && matchesCase
  })

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-border-subtle">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-text-primary">
            Evidence Ingestion & Document Repository
          </h2>
          <p className="text-xs text-text-muted mt-0.5">
            OCR pipeline, entity mention extraction, and chain-of-custody archive. Max size: 10 MB (PDF/TXT).
          </p>
        </div>
        <Button
          size="sm"
          variant="primary"
          onClick={() => setIsUploadModalOpen(true)}
          icon={<Upload className="w-4 h-4" />}
          className="font-mono text-xs font-semibold"
        >
          Ingest Evidence File
        </Button>
      </div>

      {/* Main Grid: Left List, Right Detail & Extracted Mentions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left List (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Search and filters */}
          <Card className="p-3 bg-bg-secondary/80 border-border-subtle">
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                <input
                  type="text"
                  placeholder="Filter documents by filename or title..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-bg-elevated border border-border-subtle rounded-lg pl-8 pr-3 py-1.5 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-amber-forensic"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-bg-elevated border border-border-subtle rounded-lg px-2.5 py-1.5 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-amber-forensic"
              >
                <option value="all">All Ingestion States</option>
                <option value="processed">Processed</option>
                <option value="processing">Processing</option>
                <option value="pending">Pending</option>
              </select>
            </div>
          </Card>

          {/* Document Table */}
          <Card className="p-0 bg-bg-secondary/90 border-border-subtle overflow-hidden">
            <div className="divide-y divide-border-subtle/50">
              {filteredDocs.length === 0 ? (
                <div className="p-8 text-center text-xs text-text-muted">
                  No evidence files match current query scope.
                </div>
              ) : (
                filteredDocs.map((doc) => {
                  const isSelected = selectedDoc?.id === doc.id
                  return (
                    <div
                      key={doc.id}
                      onClick={() => handleSelectDoc(doc)}
                      className={`p-4 flex items-center justify-between cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-amber-forensic/10 border-l-2 border-amber-forensic'
                          : 'hover:bg-bg-elevated/40'
                      }`}
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="p-2 rounded-lg bg-bg-elevated text-amber-forensic border border-border-subtle flex-shrink-0 mt-0.5">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-text-primary truncate">
                            {doc.title || doc.filename}
                          </p>
                          <p className="text-[10px] text-text-muted font-mono truncate mt-0.5">
                            {doc.filename} • {formatBytes(doc.file_size)} • {doc.case_id}
                          </p>
                          <div className="flex items-center gap-2 mt-1.5">
                            <span className="text-[10px] font-mono text-teal-400 bg-teal-500/10 px-1.5 py-0.5 rounded border border-teal-500/20">
                              {doc.mention_count || 0} Entities Extracted
                            </span>
                            <span className="text-[10px] text-text-muted font-mono">
                              {formatRelativeTime(doc.created_at)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="badge badge-green text-[10px] uppercase font-mono">
                          {doc.status}
                        </span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDownload(doc)
                          }}
                          icon={<Download className="w-3.5 h-3.5" />}
                          title="Download Evidence"
                        />
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </Card>
        </div>

        {/* Right Details Panel (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          {selectedDoc ? (
            <Card className="p-5 bg-bg-secondary/90 border-border-subtle space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
                <div className="flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-amber-forensic" />
                  <h3 className="text-sm font-bold text-text-primary">Evidence File Details</h3>
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => handleDownload(selectedDoc)}
                  icon={<Download className="w-3.5 h-3.5" />}
                  className="text-xs"
                >
                  Download Original
                </Button>
              </div>

              <div className="space-y-2 text-xs font-mono bg-bg-elevated/40 p-3 rounded-lg border border-border-subtle">
                <div className="flex justify-between">
                  <span className="text-text-muted">Document ID:</span>
                  <span className="text-text-primary font-bold">{selectedDoc.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Associated Dossier:</span>
                  <span className="text-amber-forensic font-semibold">{selectedDoc.case_id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">File Size:</span>
                  <span className="text-text-primary">{formatBytes(selectedDoc.file_size)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">MIME Format:</span>
                  <span className="text-text-primary">{selectedDoc.mime_type || 'application/pdf'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Ingestion Date:</span>
                  <span className="text-text-primary">{formatDate(selectedDoc.created_at)}</span>
                </div>
              </div>

              {/* Extracted Entity Mentions Section */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                    <h4 className="text-xs font-semibold text-text-primary uppercase font-mono tracking-wider">
                      Extracted Entity Mentions ({docMentions.length})
                    </h4>
                  </div>
                  <span className="text-[10px] text-text-muted font-mono">NLP Pipeline</span>
                </div>

                <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-300">
                  <span className="font-bold">Human Verification Required:</span> Mentions extracted
                  from raw documents represent automated inferences. They must be validated before
                  recording permanent graph edges.
                </div>

                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {docMentions.length === 0 ? (
                    <p className="text-xs text-text-muted italic p-2 text-center">
                      No entity mentions extracted for this file.
                    </p>
                  ) : (
                    docMentions.map((mention) => (
                      <div
                        key={mention.id}
                        className="p-2.5 rounded bg-bg-elevated/50 border border-border-subtle flex items-center justify-between text-xs"
                      >
                        <div className="space-y-0.5 min-w-0">
                          <p className="font-semibold text-text-primary truncate">"{mention.text}"</p>
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-[9px] font-mono px-1.5 py-0.2 rounded border uppercase ${
                                ENTITY_COLORS[mention.entity_type]?.bg
                              } ${ENTITY_COLORS[mention.entity_type]?.text} ${
                                ENTITY_COLORS[mention.entity_type]?.border
                              }`}
                            >
                              {mention.entity_type}
                            </span>
                            <span className="text-[10px] text-text-muted font-mono">
                              Confidence: {Math.round(mention.confidence * 100)}%
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 flex-shrink-0">
                          {mention.is_verified ? (
                            <span className="badge badge-green text-[9px] font-mono">
                              VERIFIED
                            </span>
                          ) : (
                            <span className="badge badge-amber text-[9px] font-mono">
                              UNVERIFIED
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </Card>
          ) : (
            <Card className="p-12 text-center text-xs text-text-muted border-dashed">
              Select an evidence document to inspect extracted entities and provenance.
            </Card>
          )}
        </div>
      </div>

      {/* Upload Modal (multipart/form-data) */}
      <Modal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        title="Ingest Evidence Document"
        subtitle="POST /api/documents/upload — Upload PDF or TXT evidence (multipart/form-data with case_id & file)."
        maxWidth="md"
      >
        <form onSubmit={handleUploadSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-text-secondary">
              Target Investigation Dossier
            </label>
            <select
              value={uploadCaseId}
              onChange={(e) => setUploadCaseId(e.target.value)}
              className="w-full bg-bg-elevated border border-border-subtle rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-amber-forensic"
              required
            >
              {cases.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.case_number} — {c.title}
                </option>
              ))}
            </select>
          </div>

          {/* Drag & Drop Zone */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-border-strong hover:border-amber-forensic/60 rounded-xl p-6 text-center cursor-pointer bg-bg-elevated/20 hover:bg-bg-elevated/40 transition-colors"
          >
            <input
              type="file"
              ref={fileInputRef}
              accept=".pdf,.txt"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  validateAndSetFile(e.target.files[0])
                }
              }}
              className="hidden"
            />
            <div className="w-10 h-10 rounded-lg bg-bg-elevated flex items-center justify-center text-amber-forensic mx-auto mb-2 border border-border-subtle">
              <Upload className="w-5 h-5" />
            </div>
            {selectedFile ? (
              <div>
                <p className="text-xs font-bold text-amber-light">{selectedFile.name}</p>
                <p className="text-[10px] text-text-muted font-mono mt-0.5">
                  {formatBytes(selectedFile.size)} • Click to switch file
                </p>
              </div>
            ) : (
              <div>
                <p className="text-xs font-semibold text-text-primary">
                  Drag and drop evidence file here, or click to browse
                </p>
                <p className="text-[10px] text-text-muted font-mono mt-1">
                  Supported formats: PDF, TXT (Maximum upload size: 10 MB)
                </p>
              </div>
            )}
          </div>

          {uploadProgress > 0 && (
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] font-mono text-text-muted">
                <span>Ingestion Progress</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full h-1.5 bg-bg-elevated rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-forensic transition-all duration-200"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {uploadError && (
            <p className="text-xs text-rose-400 bg-rose-500/10 p-2.5 rounded-lg border border-rose-500/20 font-mono">
              {uploadError}
            </p>
          )}

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-border-subtle">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsUploadModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={!selectedFile}
              isLoading={isUploading}
            >
              Upload & Extract Mentions
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
