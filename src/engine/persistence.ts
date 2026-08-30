import type { GameSave } from '../cases/types'

export const SAVE_KEY = 'archive-os:case-001'
export const CURRENT_SAVE_VERSION = 1

export function createFreshSave(): GameSave {
  return {
    saveVersion: CURRENT_SAVE_VERSION, caseId: 'case-001', openedItems: [], discoveredClueIds: [], pinnedClueIds: [], unlockedItemIds: [], triggeredEventIds: [], evidenceCardPositions: {}, evidenceRelations: [], currentWindows: [],
    settings: { sound: true, anomalies: true, scanlines: 0.55 }, deductionResult: null, playTime: 0, lastSavedAt: new Date().toISOString(),
  }
}

export function migrateGameSave(input: unknown): GameSave {
  const fresh = createFreshSave()
  if (!input || typeof input !== 'object') return fresh
  const value = input as Partial<GameSave>
  return { ...fresh, ...value, saveVersion: CURRENT_SAVE_VERSION, settings: { ...fresh.settings, ...(value.settings ?? {}) }, lastSavedAt: new Date().toISOString() }
}

export function saveGameSave(storage: Storage, save: GameSave): void {
  storage.setItem(SAVE_KEY, JSON.stringify({ ...save, lastSavedAt: new Date().toISOString() }))
}

export function loadGameSave(storage: Storage): { status: 'fresh' | 'loaded' | 'corrupt'; save: GameSave } {
  const raw = storage.getItem(SAVE_KEY)
  if (!raw) return { status: 'fresh', save: createFreshSave() }
  try { return { status: 'loaded', save: migrateGameSave(JSON.parse(raw)) } } catch { return { status: 'corrupt', save: createFreshSave() } }
}

export function clearGameSave(storage: Storage): void { storage.removeItem(SAVE_KEY) }
