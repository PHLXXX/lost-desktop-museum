import { parseCommunityCaseDetail, parseCommunityPublisher, parseCommunityRegistryIndex } from '../schema/registrySchema'
import type { CommunityCaseDetail, CommunityPublisher, CommunityRegistryIndex } from '../types/communityTypes'
import { IndexedDbRepository, InMemoryKeyValueRepository, type KeyValueRepository } from '../../storage/indexedDb'

export interface CommunityRegistryCacheRecord {
  id: string; schemaVersion: 1; registryUrl: string; registryVersion: string; generatedAt: string; sourceCommit: string; fetchedAt: string
  index: CommunityRegistryIndex; caseDetails: Record<string, { fetchedAt: string; detail: CommunityCaseDetail }>; publishers?: Record<string, { fetchedAt: string; publisher: CommunityPublisher }>
}
export class RegistryCacheRepository {
  lastCorruptBackup: { savedAt: string; value: unknown } | null = null
  constructor(private adapter: KeyValueRepository<CommunityRegistryCacheRecord> = typeof indexedDB === 'undefined' ? new InMemoryKeyValueRepository() : new IndexedDbRepository('lost-desktop-museum-v5-community-cache', 'registry-cache', 'id')) {}
  async load(): Promise<CommunityRegistryCacheRecord | null> {
    const record = await this.adapter.get('active')
    if (!record) return null
    try {
      const index = parseCommunityRegistryIndex(record.index)
      const caseDetails = Object.fromEntries(Object.entries(record.caseDetails ?? {}).map(([id, value]) => [id, { fetchedAt: value.fetchedAt, detail: parseCommunityCaseDetail(value.detail) }]))
      const publishers = Object.fromEntries(Object.entries(record.publishers ?? {}).map(([id, value]) => [id, { fetchedAt: value.fetchedAt, publisher: parseCommunityPublisher(value.publisher) }]))
      return { ...record, index, caseDetails, publishers }
    } catch {
      const savedAt = new Date().toISOString()
      const backupId = `corrupt-${Date.now()}`
      this.lastCorruptBackup = { savedAt, value: record }
      try { await this.adapter.set(backupId, { ...record, id: backupId }) } catch { /* a failed backup must not make the application unusable */ }
      try { await this.adapter.delete('active') } catch { /* the caller still receives a safe empty cache */ }
      return null
    }
  }
  async save(registryUrl: string, index: CommunityRegistryIndex, fetchedAt = new Date().toISOString()) {
    const previous = await this.load()
    await this.adapter.set('active', { id: 'active', schemaVersion: 1, registryUrl, registryVersion: index.registryVersion, generatedAt: index.generatedAt, sourceCommit: index.sourceCommit, fetchedAt, index: parseCommunityRegistryIndex(index), caseDetails: previous?.registryUrl === registryUrl ? previous.caseDetails : {}, publishers: previous?.registryUrl === registryUrl ? previous.publishers : {} })
  }
  async saveDetail(caseId: string, detail: CommunityCaseDetail, fetchedAt = new Date().toISOString()) {
    const current = await this.load(); if (!current) throw new Error('社区目录尚未缓存。')
    current.caseDetails[caseId] = { fetchedAt, detail: parseCommunityCaseDetail(detail) }; await this.adapter.set('active', current)
  }
  async savePublisher(publisherId: string, publisher: CommunityPublisher, fetchedAt = new Date().toISOString()) {
    const current = await this.load(); if (!current) throw new Error('社区目录尚未缓存。')
    current.publishers ??= {}
    current.publishers[publisherId] = { fetchedAt, publisher: parseCommunityPublisher(publisher) }; await this.adapter.set('active', current)
  }
}
export const registryCacheRepository = new RegistryCacheRepository()
