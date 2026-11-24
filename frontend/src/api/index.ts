import { apiClient, API_BASE_URL } from './client';
import type {
  ApiResponse,
  ApiListResponse,
  HealthStatus,
  DashboardStats,
  Case,
  CreateCasePayload,
  Source,
  CreateSourcePayload,
  CallRecord,
  CreateCallRecordPayload,
  Transaction,
  CreateTransactionPayload,
  Document,
  DocumentMention,
  DocumentUploadResponse,
  Entity,
  CreateEntityPayload,
  EntityAlias,
  CreateEntityAliasPayload,
  EntityMatchCandidate,
  CandidateStatus,
  CreateMatchCandidatePayload,
  ReviewCandidatePayload,
  Relationship,
  CreateRelationshipPayload,
  Evidence,
  CreateEvidencePayload,
  GraphCaseResponse,
  GraphAnalyzeData,
  ShortestPathData,
  Alert,
  CreateAlertPayload,
  UpdateAlertStatusPayload,
  AuditLog,
} from '../types';

// Health & Stats
export const fetchHealth = async (): Promise<HealthStatus> => {
  const { data } = await apiClient.get<HealthStatus>('/health');
  return data;
};

export const fetchDashboardStats = async (): Promise<DashboardStats> => {
  const { data } = await apiClient.get<ApiResponse<DashboardStats>>('/dashboard/stats');
  return data.data;
};

// Cases
export const fetchCases = async (): Promise<Case[]> => {
  const { data } = await apiClient.get<ApiListResponse<Case>>('/cases');
  return data.data;
};

export const fetchCaseById = async (id: string): Promise<Case> => {
  const { data } = await apiClient.get<ApiResponse<Case>>(`/cases/${id}`);
  return data.data;
};

export const createCase = async (payload: CreateCasePayload): Promise<Case> => {
  const { data } = await apiClient.post<ApiResponse<Case>>('/cases', payload);
  return data.data;
};

export const linkEntityToCase = async (
  caseId: string,
  entityId: string
): Promise<{ message?: string; alreadyLinked?: boolean }> => {
  const { data } = await apiClient.post<ApiResponse<any>>(`/cases/${caseId}/entities`, {
    entity_id: entityId,
  });
  // Backend returns 201 with data: null if already linked
  return {
    message: data.message,
    alreadyLinked: data.data === null,
  };
};

// Entities
export const fetchEntities = async (): Promise<Entity[]> => {
  const { data } = await apiClient.get<ApiListResponse<Entity>>('/entities');
  return data.data;
};

export const fetchEntityById = async (id: string): Promise<Entity> => {
  const { data } = await apiClient.get<ApiResponse<Entity>>(`/entities/${id}`);
  return data.data;
};

export const createEntity = async (payload: CreateEntityPayload): Promise<Entity> => {
  const { data } = await apiClient.post<ApiResponse<Entity>>('/entities', payload);
  return data.data;
};

// Entity Aliases
export const fetchAliasesByEntity = async (entityId: string): Promise<EntityAlias[]> => {
  const { data } = await apiClient.get<ApiListResponse<EntityAlias>>(
    `/entity-aliases/entity/${entityId}`
  );
  return data.data;
};

export const createEntityAlias = async (
  payload: CreateEntityAliasPayload
): Promise<EntityAlias> => {
  const { data } = await apiClient.post<ApiResponse<EntityAlias>>(
    '/entity-aliases',
    payload
  );
  return data.data;
};

export const deleteEntityAlias = async (id: string): Promise<void> => {
  await apiClient.delete(`/entity-aliases/${id}`);
};

// Relationships & Evidence
export const fetchRelationships = async (): Promise<Relationship[]> => {
  const { data } = await apiClient.get<ApiListResponse<Relationship>>('/relationships');
  return data.data;
};

export const fetchRelationshipsByEntity = async (
  entityId: string
): Promise<Relationship[]> => {
  const { data } = await apiClient.get<ApiListResponse<Relationship>>(
    `/relationships/entity/${entityId}`
  );
  return data.data;
};

export const createRelationship = async (
  payload: CreateRelationshipPayload
): Promise<Relationship> => {
  const { data } = await apiClient.post<ApiResponse<Relationship>>(
    '/relationships',
    payload
  );
  return data.data;
};

export const fetchRelationshipEvidence = async (
  relationshipId: string
): Promise<Evidence[]> => {
  const { data } = await apiClient.get<ApiListResponse<Evidence>>(
    `/relationships/${relationshipId}/evidence`
  );
  return data.data;
};

export const createRelationshipEvidence = async (
  relationshipId: string,
  payload: CreateEvidencePayload
): Promise<Evidence> => {
  const { data } = await apiClient.post<ApiResponse<Evidence>>(
    `/relationships/${relationshipId}/evidence`,
    payload
  );
  return data.data;
};

// Graph
export const fetchGraphByCase = async (caseId: string): Promise<GraphCaseResponse> => {
  const { data } = await apiClient.get<GraphCaseResponse>(`/graph/case/${caseId}`);
  return data;
};

export const analyzeGraphByCase = async (caseId: string): Promise<GraphAnalyzeData> => {
  const { data } = await apiClient.get<{ success: boolean; data: GraphAnalyzeData }>(
    `/graph/case/${caseId}/analyze`
  );
  return data.data;
};

export const findShortestPath = async (
  caseId: string,
  startId: string,
  endId: string
): Promise<ShortestPathData> => {
  const { data } = await apiClient.post<{ success: boolean; data: ShortestPathData }>(
    `/graph/case/${caseId}/shortest-path`,
    { start_id: startId, end_id: endId }
  );
  return data.data;
};

// Documents
export const fetchDocuments = async (): Promise<Document[]> => {
  const { data } = await apiClient.get<ApiListResponse<Document>>('/documents');
  return data.data;
};

export const fetchDocumentsByCase = async (caseId: string): Promise<Document[]> => {
  const { data } = await apiClient.get<ApiListResponse<Document>>(
    `/documents/case/${caseId}`
  );
  return data.data;
};

export const fetchDocumentById = async (id: string): Promise<Document> => {
  const { data } = await apiClient.get<ApiResponse<Document>>(`/documents/${id}`);
  return data.data;
};

export const fetchDocumentMentions = async (
  id: string
): Promise<DocumentMention[]> => {
  const { data } = await apiClient.get<ApiListResponse<DocumentMention>>(
    `/documents/${id}/mentions`
  );
  return data.data;
};

export const uploadDocument = async (formData: FormData): Promise<DocumentUploadResponse> => {
  // Do NOT set Content-Type header manually for multipart so browser can set boundary
  const { data } = await apiClient.post<DocumentUploadResponse>(
    '/documents/upload',
    formData,
    {
      headers: {
        'Content-Type': undefined,
      },
    }
  );
  return data;
};

export const getDocumentDownloadUrl = (id: string): string => {
  return `${API_BASE_URL}/documents/${id}/download`;
};

// Sources
export const fetchSources = async (): Promise<Source[]> => {
  const { data } = await apiClient.get<ApiListResponse<Source>>('/sources');
  return data.data;
};

export const fetchSourcesByCase = async (caseId: string): Promise<Source[]> => {
  const { data } = await apiClient.get<ApiListResponse<Source>>(
    `/sources/case/${caseId}`
  );
  return data.data;
};

export const createSource = async (payload: CreateSourcePayload): Promise<Source> => {
  const { data } = await apiClient.post<ApiResponse<Source>>('/sources', payload);
  return data.data;
};

// Call Records
export const fetchCallRecords = async (): Promise<CallRecord[]> => {
  const { data } = await apiClient.get<ApiListResponse<CallRecord>>('/call-records');
  return data.data;
};

export const fetchCallRecordsByEntity = async (
  entityId: string
): Promise<CallRecord[]> => {
  const { data } = await apiClient.get<ApiListResponse<CallRecord>>(
    `/call-records/entity/${entityId}`
  );
  return data.data;
};

export const createCallRecord = async (
  payload: CreateCallRecordPayload
): Promise<CallRecord> => {
  const { data } = await apiClient.post<ApiResponse<CallRecord>>(
    '/call-records',
    payload
  );
  return data.data;
};

// Transactions
export const fetchTransactions = async (): Promise<Transaction[]> => {
  const { data } = await apiClient.get<ApiListResponse<Transaction>>('/transactions');
  return data.data;
};

export const fetchTransactionsByEntity = async (
  entityId: string
): Promise<Transaction[]> => {
  const { data } = await apiClient.get<ApiListResponse<Transaction>>(
    `/transactions/entity/${entityId}`
  );
  return data.data;
};

export const createTransaction = async (
  payload: CreateTransactionPayload
): Promise<Transaction> => {
  const { data } = await apiClient.post<ApiResponse<Transaction>>(
    '/transactions',
    payload
  );
  return data.data;
};

// Entity Match Candidates
export const fetchAllMatchCandidates = async (): Promise<EntityMatchCandidate[]> => {
  const { data } = await apiClient.get<ApiListResponse<EntityMatchCandidate>>(
    '/entity-match-candidates'
  );
  return data.data;
};

export const fetchMatchCandidatesByStatus = async (
  status: CandidateStatus
): Promise<EntityMatchCandidate[]> => {
  const { data } = await apiClient.get<ApiListResponse<EntityMatchCandidate>>(
    `/entity-match-candidates/status/${status}`
  );
  return data.data;
};

export const createMatchCandidate = async (
  payload: CreateMatchCandidatePayload
): Promise<EntityMatchCandidate> => {
  const { data } = await apiClient.post<ApiResponse<EntityMatchCandidate>>(
    '/entity-match-candidates',
    payload
  );
  return data.data;
};

export const reviewMatchCandidate = async (
  id: string,
  payload: ReviewCandidatePayload
): Promise<EntityMatchCandidate> => {
  const { data } = await apiClient.patch<ApiResponse<EntityMatchCandidate>>(
    `/entity-match-candidates/${id}/review`,
    payload
  );
  return data.data;
};

// Alerts
export const fetchAlerts = async (): Promise<Alert[]> => {
  const { data } = await apiClient.get<ApiListResponse<Alert>>('/alerts');
  return data.data;
};

export const fetchAlertsByCase = async (caseId: string): Promise<Alert[]> => {
  const { data } = await apiClient.get<ApiListResponse<Alert>>(
    `/alerts/case/${caseId}`
  );
  return data.data;
};

export const createAlert = async (payload: CreateAlertPayload): Promise<Alert> => {
  const { data } = await apiClient.post<ApiResponse<Alert>>('/alerts', payload);
  return data.data;
};

export const updateAlertStatus = async (
  id: string,
  payload: UpdateAlertStatusPayload
): Promise<Alert> => {
  const { data } = await apiClient.patch<ApiResponse<Alert>>(
    `/alerts/${id}/status`,
    payload
  );
  return data.data;
};

// Audit Logs
export const fetchAuditLogs = async (): Promise<AuditLog[]> => {
  const { data } = await apiClient.get<ApiListResponse<AuditLog>>('/audit-logs');
  return data.data;
};

export const fetchAuditLogsByUser = async (userId: string): Promise<AuditLog[]> => {
  const { data } = await apiClient.get<ApiListResponse<AuditLog>>(
    `/audit-logs/user/${encodeURIComponent(userId)}`
  );
  return data.data;
};

export const fetchAuditLogsByTable = async (
  tableName: string
): Promise<AuditLog[]> => {
  const { data } = await apiClient.get<ApiListResponse<AuditLog>>(
    `/audit-logs/table/${encodeURIComponent(tableName)}`
  );
  return data.data;
};
