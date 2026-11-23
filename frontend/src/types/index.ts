// ============================================================================
// CRIMEGRAPH — Types & Domain Models
// Tagline: Every clue has a connection.
// ============================================================================

export type EntityType = 'person' | 'phone' | 'vehicle' | 'location' | 'organization'

export type CaseStatus = 'active' | 'under_review' | 'closed' | 'archived'
export type CasePriority = 'low' | 'medium' | 'high' | 'critical'
export type CaseCategory =
  | 'financial_crime'
  | 'organized_crime'
  | 'narcotics'
  | 'cybercrime'
  | 'corruption'
  | 'human_trafficking'
  | 'smuggling'
  | 'other'

export interface Case {
  id: string
  case_number: string
  title: string
  description?: string
  category: CaseCategory | string
  status: CaseStatus | string
  priority: CasePriority | string
  lead_investigator?: string
  created_at: string
  updated_at: string
  // Optional aggregated stats returned by API or calculated
  entity_count?: number
  relationship_count?: number
  document_count?: number
  alert_count?: number
}

export interface Entity {
  id: string
  case_id?: string
  case_ids?: string[]
  entity_type: EntityType
  name?: string
  label?: string
  identifier?: string
  normalized_value?: string
  confidence_score?: number
  risk_level?: 'low' | 'medium' | 'high' | 'critical'
  attributes?: Record<string, any>
  created_at: string
  updated_at?: string
  is_verified?: boolean
}

export interface EntityAlias {
  id: string
  entity_id: string
  alias: string
  alias_type?: string
  source?: string
  created_at?: string
}

export interface Relationship {
  id: string
  case_id: string
  source_id?: string
  target_id?: string
  source_entity_id?: string
  target_entity_id?: string
  relationship_type: string
  label?: string
  confidence?: number
  weight?: number
  evidence_count?: number
  notes?: string
  first_seen?: string
  last_seen?: string
  created_at?: string
  source_entity?: Entity
  target_entity?: Entity
}

export interface RelationshipEvidence {
  id: string
  relationship_id: string
  document_id?: string
  document_name?: string
  snippet?: string
  confidence?: number
  discovered_at?: string
  notes?: string
}

export interface DocumentItem {
  id: string
  case_id: string
  title?: string
  filename: string
  original_filename?: string
  file_size?: number
  mime_type?: string
  file_type?: string
  upload_date?: string
  created_at?: string
  processed_at?: string
  status: 'pending' | 'processing' | 'processed' | 'failed'
  mention_count?: number
  file_url?: string
}

export interface DocumentMention {
  id: string
  document_id: string
  entity_id?: string
  text: string
  entity_type: EntityType
  confidence: number
  offset_start?: number
  offset_end?: number
  is_verified?: boolean
}

export type MatchReviewStatus = 'pending' | 'approved' | 'rejected' | 'further_review'

export interface EntityMatchCandidate {
  id: string
  case_id?: string
  entity_a_id: string
  entity_b_id: string
  match_score?: number
  similarity_score?: number
  match_reasons?: string[]
  matching_attributes?: Record<string, any>
  differing_attributes?: Record<string, any>
  status: MatchReviewStatus
  reviewer_notes?: string
  reviewed_at?: string
  created_at: string
  entity_a?: Entity
  entity_b?: Entity
}

export interface GraphNode {
  id: string
  label: string
  type: EntityType
  entity_type?: EntityType
  attributes?: Record<string, any>
  case_id?: string
  is_verified?: boolean
}

export interface GraphEdge {
  id: string
  source: string
  target: string
  type?: string
  relationship_type?: string
  label?: string
  weight?: number
  confidence?: number
  evidence_count?: number
}

export interface GraphData {
  nodes: GraphNode[]
  edges: GraphEdge[]
}

export interface GraphAnalysis {
  node_count?: number
  edge_count?: number
  density?: number
  connected_components?: number
  avg_degree?: number
  top_nodes_by_degree?: Array<{ entity_id: string; label: string; degree: number }>
  top_nodes_by_betweenness?: Array<{ entity_id: string; label: string; score: number }>
  communities?: Array<{ community_id: number; member_count: number; members: string[] }>
  isolated_nodes_count?: number
}

export interface ShortestPathResult {
  found: boolean
  path_length?: number
  total_weight?: number
  nodes: GraphNode[]
  edges: GraphEdge[]
  sequence?: string[]
}

export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical'
export type AlertStatus = 'new' | 'investigating' | 'resolved' | 'dismissed'

export interface Alert {
  id: string
  case_id: string
  title: string
  description?: string
  explanation?: string
  severity: AlertSeverity
  status: AlertStatus
  alert_type?: string
  related_entity_ids?: string[]
  related_entities?: Entity[]
  supporting_records?: Record<string, any>[]
  created_at: string
  updated_at?: string
}

export interface CallRecord {
  id: string
  case_id: string
  caller_number: string
  receiver_number: string
  call_timestamp: string
  duration_seconds: number
  call_type?: 'inbound' | 'outbound' | 'missed'
  cell_tower_location?: string
  caller_entity_id?: string
  receiver_entity_id?: string
  caller_entity?: Entity
  receiver_entity?: Entity
  created_at?: string
}

export interface Transaction {
  id: string
  case_id: string
  sender_account: string
  receiver_account: string
  amount: number
  currency: string
  transaction_timestamp: string
  transaction_type?: string
  status?: string
  sender_entity_id?: string
  receiver_entity_id?: string
  sender_entity?: Entity
  receiver_entity?: Entity
  reference_number?: string
  flagged?: boolean
  created_at?: string
}

export interface AuditLog {
  id: string
  case_id?: string
  actor?: string
  action: string
  resource_type?: string
  resource_id?: string
  details?: Record<string, any>
  ip_address?: string
  timestamp: string
}

export interface Source {
  id: string
  case_id?: string
  name: string
  type: string
  description?: string
  reliability_score?: number
  created_at: string
}

export interface ApiHealthResponse {
  status: string
  timestamp?: string
  version?: string
  database?: string
  service?: string
}
