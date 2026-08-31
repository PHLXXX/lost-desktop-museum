import { IndexedDbRepository, InMemoryKeyValueRepository, type KeyValueRepository } from '../../storage/indexedDb'

export interface CommunityPreference { caseId: string; favorite: boolean; rating: 1 | 2 | 3 | 4 | 5 | null; note: string; updatedAt: string }
export function normalizeCommunityPreference(caseId: string, input: Pick<CommunityPreference, 'favorite' | 'rating' | 'note'>): CommunityPreference {
  if (input.rating !== null && ![1, 2, 3, 4, 5].includes(input.rating)) throw new Error('私人评分必须是1至5。')
  if (input.note.length > 5000) throw new Error('私人备注最多5000字符。')
  return { caseId, favorite: input.favorite, rating: input.rating, note: input.note.replaceAll('\u0000', ''), updatedAt: new Date().toISOString() }
}
export class CommunityPreferencesRepository {
  constructor(private adapter: KeyValueRepository<CommunityPreference> = typeof indexedDB === 'undefined' ? new InMemoryKeyValueRepository() : new IndexedDbRepository('lost-desktop-museum-v5-community-preferences', 'preferences', 'caseId')) {}
  get(caseId: string) { return this.adapter.get(caseId) }
  save(caseId: string, input: Pick<CommunityPreference, 'favorite' | 'rating' | 'note'>) { const value = normalizeCommunityPreference(caseId, input); return this.adapter.set(caseId, value) }
  list() { return this.adapter.list() }
}
export const communityPreferencesRepository = new CommunityPreferencesRepository()
