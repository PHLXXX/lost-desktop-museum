import { IndexedDbRepository, InMemoryKeyValueRepository, type KeyValueRepository } from '../../storage/indexedDb'
import type { CommunityInstallationRecord } from '../types/installedCaseSource'

export class CommunityInstallationRepository {
  constructor(private adapter: KeyValueRepository<CommunityInstallationRecord> = typeof indexedDB === 'undefined' ? new InMemoryKeyValueRepository() : new IndexedDbRepository('lost-desktop-museum-v5-community-installations', 'installations', 'caseId')) {}
  get(caseId: string) { return this.adapter.get(caseId) }
  list() { return this.adapter.list() }
  async save(record: CommunityInstallationRecord) { await this.adapter.set(record.caseId, { ...record, rollbackVersions: record.rollbackVersions.slice(-2) }) }
  delete(caseId: string) { return this.adapter.delete(caseId) }
}
export const communityInstallationRepository = new CommunityInstallationRepository()
