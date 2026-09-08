import { describe, expect, it } from 'vitest'
import { caseDefinition } from '../cases/case-001/case'
import type { InvestigationRewardDefinition } from '../cases/types'
import { defaultRewardProfile, loadRewardProfile, recordRewards, saveRewardProfile } from './rewardProfile'

class MemoryStorage implements Storage {
  private data = new Map<string, string>()
  get length() { return this.data.size }
  clear() { this.data.clear() }
  getItem(key: string) { return this.data.get(key) ?? null }
  key(index: number) { return [...this.data.keys()][index] ?? null }
  removeItem(key: string) { this.data.delete(key) }
  setItem(key: string, value: string) { this.data.set(key, value) }
}

const artifact: InvestigationRewardDefinition = {
  id: 'case-complete', kind: 'artifact', title: '未启程登机牌', description: '结案纪念。', requirements: [],
}

describe('reward profile', () => {
  it('records a reward once and preserves its first unlock time', () => {
    const first = recordRewards(defaultRewardProfile, caseDefinition, [artifact], '2026-09-08T01:00:00.000Z')
    const repeated = recordRewards(first.profile, caseDefinition, [artifact], '2026-09-08T02:00:00.000Z')

    expect(first.newKeys).toEqual(['case-001:case-complete'])
    expect(repeated.newKeys).toEqual([])
    expect(repeated.profile.unlocks).toHaveLength(1)
    expect(repeated.profile.unlocks[0]?.unlockedAt).toBe('2026-09-08T01:00:00.000Z')
  })

  it('round-trips valid data and falls back for corrupt or unknown themes', () => {
    const storage = new MemoryStorage()
    const profile = recordRewards(defaultRewardProfile, caseDefinition, [artifact], '2026-09-08T01:00:00.000Z').profile
    saveRewardProfile(storage, { ...profile, selectedTheme: 'departure-night' })
    expect(loadRewardProfile(storage)).toMatchObject({ selectedTheme: 'departure-night', unlocks: [expect.objectContaining({ title: '未启程登机牌' })] })

    storage.setItem('archive-os:reward-profile', '{broken')
    expect(loadRewardProfile(storage)).toEqual(defaultRewardProfile)

    storage.setItem('archive-os:reward-profile', JSON.stringify({ version: 1, selectedTheme: 'remote-css', unlocks: [] }))
    expect(loadRewardProfile(storage).selectedTheme).toBe('archive-standard')
  })
})
