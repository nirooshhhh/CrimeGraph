import { apiClient, extractData } from './apiClient'
import { EntityMatchCandidate, MatchReviewStatus } from '../types'

export const matchCandidatesService = {
  async getMatchCandidates(): Promise<EntityMatchCandidate[]> {
    const res = await apiClient.get('/api/entity-match-candidates')
    return extractData<EntityMatchCandidate[]>(res, [])
  },

  async createMatchCandidate(payload: {
    case_id?: string
    entity_a_id: string
    entity_b_id: string
    match_score?: number
    match_reasons?: string[]
  }): Promise<EntityMatchCandidate> {
    const res = await apiClient.post('/api/entity-match-candidates', payload)
    return extractData<EntityMatchCandidate>(res, res.data)
  },

  async reviewMatchCandidate(
    id: string,
    status: MatchReviewStatus,
    reviewer_notes?: string
  ): Promise<EntityMatchCandidate> {
    const res = await apiClient.patch(
      `/api/entity-match-candidates/${encodeURIComponent(id)}/review`,
      {
        status,
        reviewer_notes,
      }
    )
    return extractData<EntityMatchCandidate>(res, res.data)
  },
}
