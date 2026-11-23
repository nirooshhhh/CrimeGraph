import { apiClient, extractData } from './apiClient'
import {
  GraphData,
  GraphAnalysis,
  ShortestPathResult,
  Relationship,
  RelationshipEvidence,
} from '../types'

export const graphService = {
  async getGraphByCase(caseId: string): Promise<GraphData> {
    const res = await apiClient.get(`/api/graph/case/${encodeURIComponent(caseId)}`)
    const raw = res.data
    // Map whatever shape the backend returns to GraphData
    if (raw && (raw.nodes || raw.edges)) {
      return {
        nodes: Array.isArray(raw.nodes) ? raw.nodes : [],
        edges: Array.isArray(raw.edges) ? raw.edges : [],
      }
    }
    return { nodes: [], edges: [] }
  },

  async getGraphAnalysis(caseId: string): Promise<GraphAnalysis> {
    const res = await apiClient.get(`/api/graph/case/${encodeURIComponent(caseId)}/analyze`)
    return extractData<GraphAnalysis>(res, {})
  },

  /**
   * Request format: {"start_id":"ENTITY_ID_1","end_id":"ENTITY_ID_2"}
   */
  async getShortestPath(
    caseId: string,
    startId: string,
    endId: string
  ): Promise<ShortestPathResult> {
    const res = await apiClient.post(
      `/api/graph/case/${encodeURIComponent(caseId)}/shortest-path`,
      {
        start_id: startId,
        end_id: endId,
      }
    )
    const raw = res.data
    // Adaptable mapping
    if (raw) {
      if (raw.nodes || raw.edges || raw.path) {
        return {
          found: raw.found !== false && (raw.nodes?.length > 0 || raw.path?.length > 0),
          path_length: raw.path_length || raw.distance || raw.nodes?.length || 0,
          total_weight: raw.total_weight || raw.weight,
          nodes: raw.nodes || [],
          edges: raw.edges || [],
          sequence: raw.sequence || raw.path || [],
        }
      }
    }
    return { found: false, nodes: [], edges: [] }
  },

  async getRelationships(): Promise<Relationship[]> {
    const res = await apiClient.get('/api/relationships')
    return extractData<Relationship[]>(res, [])
  },

  async createRelationship(payload: {
    case_id: string
    source_entity_id: string
    target_entity_id: string
    relationship_type: string
    confidence?: number
    weight?: number
    notes?: string
  }): Promise<Relationship> {
    const res = await apiClient.post('/api/relationships', payload)
    return extractData<Relationship>(res, res.data)
  },

  async getRelationshipEvidence(relationshipId: string): Promise<RelationshipEvidence[]> {
    const res = await apiClient.get(
      `/api/relationships/${encodeURIComponent(relationshipId)}/evidence`
    )
    return extractData<RelationshipEvidence[]>(res, [])
  },

  async addRelationshipEvidence(
    relationshipId: string,
    payload: {
      document_id?: string
      document_name?: string
      snippet?: string
      confidence?: number
      notes?: string
    }
  ): Promise<RelationshipEvidence> {
    const res = await apiClient.post(
      `/api/relationships/${encodeURIComponent(relationshipId)}/evidence`,
      payload
    )
    return extractData<RelationshipEvidence>(res, res.data)
  },
}
