// API Response envelope types
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  error?: string;
}

export interface ApiListResponse<T> {
  success: boolean;
  count: number;
  data: T[];
  message?: string;
  error?: string;
}

// Health check
export interface HealthStatus {
  success: boolean;
  message: string;
  status: string;
}

// Dashboard statistics
export interface DashboardStats {
  totalCases: number;
  totalEntities: number;
  totalRelationships: number;
  totalDocuments: number;
  totalAlerts: number;
}

// 02 Case Management
export interface Case {
  id: string;
  case_number: string;
  title: string;
  description?: string | null;
  status?: string | null;
  priority?: string | null;
  created_by?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface CreateCasePayload {
  case_number: string;
  title: string;
  description?: string;
  status?: string;
  priority?: string;
  created_by?: string;
}

// Sources
export interface Source {
  id: string;
  case_id?: string | null;
  source_type: string;
  source_name: string;
  description?: string | null;
  reference_code?: string | null;
  created_at?: string;
}

export interface CreateSourcePayload {
  source_type: string;
  source_name: string;
  case_id?: string;
  description?: string;
  reference_code?: string;
}

// Call Records
export interface CallRecord {
  id: string;
  caller_entity_id: string;
  receiver_entity_id: string;
  call_time: string;
  duration_seconds: number;
  call_type?: string | null;
  reference_code?: string | null;
  source_id?: string | null;
  created_at?: string;
}

export interface CreateCallRecordPayload {
  caller_entity_id: string;
  receiver_entity_id: string;
  call_time: string;
  duration_seconds: number;
  call_type?: string;
  reference_code?: string;
  source_id?: string;
}

// Transactions
export interface Transaction {
  id: string;
  sender_entity_id: string;
  receiver_entity_id: string;
  amount: number;
  transaction_time: string;
  currency: string;
  transaction_type?: string | null;
  transaction_reference?: string | null;
  source_id?: string | null;
  created_at?: string;
}

export interface CreateTransactionPayload {
  sender_entity_id: string;
  receiver_entity_id: string;
  amount: number;
  transaction_time: string;
  currency?: string;
  transaction_type?: string;
  transaction_reference?: string;
  source_id?: string;
}

// 03 Document Intelligence
export interface Document {
  id: string;
  case_id: string;
  source_id?: string | null;
  file_name: string;
  file_type: string;
  storage_path: string;
  file_hash?: string;
  extracted_text?: string | null;
  processing_status: string;
  uploaded_at: string;
}

export interface DocumentMention {
  id: string;
  document_id: string;
  resolved_entity_id?: string | null;
  entity_type: EntityType;
  mention_text: string;
  normalized_text: string;
  start_offset: number;
  end_offset: number;
  confidence: number;
  extraction_method: string;
  created_at?: string;
}

export interface DocumentUploadResponse {
  success: boolean;
  message: string;
  data: Document;
  extraction?: {
    textLength: number;
    nlpServiceUsed: boolean;
    entitiesDetected: number;
    entities: Array<{
      entity_id: string;
      entity_type: EntityType;
      mention: string;
      mention_id?: string;
    }>;
    entityExtractionError?: string | null;
  };
}

// 04 Entity Matching
export type EntityType =
  | 'person'
  | 'phone'
  | 'vehicle'
  | 'location'
  | 'organization'
  | 'account'
  | 'other';

export interface Entity {
  id: string;
  entity_type: EntityType;
  canonical_name: string;
  normalized_name?: string;
  attributes?: Record<string, any> | null;
  verification_status?: string;
  created_at?: string;
}

export interface CreateEntityPayload {
  entity_type: EntityType;
  canonical_name: string;
  attributes?: Record<string, any>;
}

export interface EntityAlias {
  id: string;
  entity_id: string;
  alias_name: string;
  normalized_alias?: string;
  source_type?: string;
  added_by?: string | null;
  created_at?: string;
}

export interface CreateEntityAliasPayload {
  entity_id: string;
  alias_name: string;
  source_type?: string;
  added_by?: string;
}

export type CandidateStatus = 'pending' | 'accepted' | 'rejected';

export interface EntityMatchCandidate {
  id: string;
  entity_id_1: string;
  entity_id_2: string;
  similarity_score: number;
  explanation?: Record<string, any> | null;
  status: CandidateStatus;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  review_notes?: string | null;
  created_at?: string;
}

export interface CreateMatchCandidatePayload {
  entity_id_1: string;
  entity_id_2: string;
  similarity_score: number;
  explanation?: Record<string, any>;
}

export interface ReviewCandidatePayload {
  status: 'accepted' | 'rejected';
  review_notes?: string;
  reviewed_by?: string;
}

// 05 Network Explorer
export interface Relationship {
  id: string;
  entity_id_1: string;
  entity_id_2: string;
  relationship_type: string;
  status: string;
  confidence?: number | null;
  created_at?: string;
}

export interface CreateRelationshipPayload {
  entity_id_1: string;
  entity_id_2: string;
  relationship_type: string;
}

export interface Evidence {
  id: string;
  relationship_id: string;
  document_id?: string | null;
  call_record_id?: string | null;
  transaction_id?: string | null;
  explanation?: string | null;
  created_at?: string;
}

export interface CreateEvidencePayload {
  document_id?: string;
  call_record_id?: string;
  transaction_id?: string;
  explanation?: string;
}

export interface GraphNode {
  id: string;
  label: string;
  type: EntityType;
  attributes?: Record<string, any>;
  verification_status?: string;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  label: string;
  status: string;
  confidence?: number | null;
}

export interface GraphCaseResponse {
  success: boolean;
  caseId: string;
  nodeCount: number;
  edgeCount: number;
  data: {
    nodes: GraphNode[];
    edges: GraphEdge[];
  };
}

export interface GraphAnalyzeData {
  success: boolean;
  node_count: number;
  edge_count: number;
  connections: Record<string, number>;
  connected_groups: string[][];
  connected_group_count: number;
}

export interface ShortestPathData {
  success: boolean;
  path: string[];
  distance: number | null;
  message?: string;
}

// 06 Alerts & Analytics
export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical';
export type AlertStatus = 'new' | 'reviewing' | 'dismissed' | 'resolved';

export interface Alert {
  id: string;
  case_id?: string | null;
  alert_type: string;
  title: string;
  description: string;
  reason?: Record<string, any> | null;
  severity: AlertSeverity;
  status: AlertStatus;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  created_at?: string;
}

export interface CreateAlertPayload {
  alert_type: string;
  title: string;
  description: string;
  severity?: AlertSeverity;
  case_id?: string;
  reason?: Record<string, any>;
}

export interface UpdateAlertStatusPayload {
  status: AlertStatus;
  reviewed_by?: string;
}

// 07 Audit & Administration
export interface AuditLog {
  id: string;
  user_id?: string | null;
  action: string;
  table_name: string;
  record_id?: string | null;
  details?: Record<string, any> | null;
  ip_address?: string | null;
  created_at?: string;
}
