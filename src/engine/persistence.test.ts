import { describe, expect, it } from 'vitest'
import { CORRUPT_PREFIX, createFreshSave, loadGameSave, migrateGameSave, saveGameSave } from './persistence'

class MemoryStorage implements Storage {
  private data = new Map<string, string>()
  get length() { return this.data.size }
  clear() { this.data.clear() }
  getItem(key: string) { return this.data.get(key) ?? null }
  key(index: number) { return [...this.data.keys()][index] ?? null }
  removeItem(key: string) { this.data.delete(key) }
  setItem(key: string, value: string) { this.data.set(key, value) }
}

describe('persistence', () => {
  it('round-trips a versioned save', () => {
    const storage = new MemoryStorage()
    const save = { ...createFreshSave(), discoveredClueIds: ['C01'] }
    saveGameSave(storage, save)
    expect(loadGameSave(storage).save.discoveredClueIds).toEqual(['C01'])
  })

  it('migrates version zero and recovers corrupt data', () => {
    const migrated = migrateGameSave({ saveVersion: 1, discoveredClueIds: ['C02'], currentWindows: ['mail'] })
    expect(migrated.saveVersion).toBe(2)
    expect(migrated.discoveredClueIds).toEqual(['C02'])
    expect(migrated.currentWindows[0]).toMatchObject({ id: 'mail' })
    expect(migrated.restoredItemIds).toEqual([])
    expect(migrated.evidenceNotes).toEqual({})
    expect(migrated.bestScore).toBeNull()
    expect(migrated.caseStarted).toBe(true)
    const storage = new MemoryStorage()
    storage.setItem('archive-os:case-001', '{broken')
    expect(loadGameSave(storage).status).toBe('corrupt')
    expect([...Array(storage.length)].map((_, index) => storage.key(index)).some((key) => key?.startsWith(CORRUPT_PREFIX))).toBe(true)
  })
})
