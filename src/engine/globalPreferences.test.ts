import { describe, expect, it } from 'vitest'
import { loadGlobalPreferences, saveGlobalOnboardingPreference } from './globalPreferences'

class MemoryStorage implements Storage {
  private data = new Map<string, string>()
  get length() { return this.data.size }
  clear() { this.data.clear() }
  getItem(key: string) { return this.data.get(key) ?? null }
  key(index: number) { return [...this.data.keys()][index] ?? null }
  removeItem(key: string) { this.data.delete(key) }
  setItem(key: string, value: string) { this.data.set(key, value) }
}

describe('global preferences', () => {
  it('round-trips onboarding completion and ignores corrupt JSON', () => {
    const storage = new MemoryStorage()
    saveGlobalOnboardingPreference(storage, true)
    expect(loadGlobalPreferences(storage).onboardingComplete).toBe(true)
    storage.setItem('archive-os:global-preferences', '{broken')
    expect(loadGlobalPreferences(storage).onboardingComplete).toBe(false)
  })

  it('does not let unavailable storage block onboarding completion', () => {
    const storage = { setItem: () => { throw new DOMException('quota', 'QuotaExceededError') } } as unknown as Storage

    expect(() => saveGlobalOnboardingPreference(storage, true)).not.toThrow()
  })
})
