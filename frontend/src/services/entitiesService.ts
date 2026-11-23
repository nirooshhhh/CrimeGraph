import { apiClient, extractData } from './apiClient'
import { Entity, Relationship, EntityAlias } from '../types'

export const entitiesService = {
  async getEntities(): Promise<Entity[]> {
    const res = await apiClient.get('/api/entities')
    return extractData<Entity[]>(res, [])
  },

  async getEntityById(id: string): Promise<Entity> {
    const res = await apiClient.get(`/api/entities/${encodeURIComponent(id)}`)
    return extractData<Entity>(res, {} as Entity)
  },

  async createEntity(payload: {
    case_id?: string
    entity_type: string
    label: string
    name?: string
    identifier?: string
    confidence_score?: number
    risk_level?: string
    attributes?: Record<string, any>
  }): Promise<Entity> {
    const res = await apiClient.post('/api/entities', payload)
    return extractData<Entity>(res, res.data)
  },

  async getEntityRelationships(entityId: string): Promise<Relationship[]> {
    const res = await apiClient.get(`/api/relationships/entity/${encodeURIComponent(entityId)}`)
    return extractData<Relationship[]>(res, [])
  },

  async getEntityAliases(): Promise<EntityAlias[]> {
    const res = await apiClient.get('/api/entity-aliases')
    return extractData<EntityAlias[]>(res, [])
  },

  async createEntityAlias(payload: {
    entity_id: string
    alias: string
    alias_type?: string
    source?: string
  }): Promise<EntityAlias> {
    const res = await apiClient.post('/api/entity-aliases', payload)
    return extractData<EntityAlias>(res, res.data)
  },

  async deleteEntityAlias(id: string): Promise<void> {
    await apiClient.delete(`/api/entity-aliases/${encodeURIComponent(id)}`)
  },
}
