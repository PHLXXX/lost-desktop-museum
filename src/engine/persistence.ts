import type { GameSave } from '../cases/types'

export const SAVE_KEY = 'archive-os:case-001'
export const CORRUPT_PREFIX = `${SAVE_KEY}:corrupt:`
export const CURRENT_SAVE_VERSION = 2

export function createFreshSave(): GameSave {
  return {
    saveVersion: CURRENT_SAVE_VERSION,
    caseId: 'case-001',
    caseStarted: false,
    openedItems: [],
    discoveredClueIds: [],
    pinnedClueIds: [],
    unlockedItemIds: [],
    restoredItemIds: [],
    triggeredEventIds: [],
    evidenceCardPositions: {},
    evidenceRelations: [],
    evidenceNotes: {},
    currentWindows: [],
    settings: { sound: true, anomalies: true, scanlines: 0.08, safeMode: false },
    deductionResult: null,
    bestScore: null,
    onboardingComplete: false,
    desktopNote: '',
    playTime: 0,
    lastSavedAt: new Date().toISOString(),
  }
}

export function migrateGameSave(input: unknown): GameSave {
  const fresh = createFreshSave()
  if (!input || typeof input !== 'object') return fresh
  const value = input as Partial<GameSave>
  const legacyWindows = Array.isArray(value.currentWindows) ? value.currentWindows : []
  const currentWindows = legacyWindows.flatMap((item, index) => {
    if (typeof item === 'string') return [{ id: item as GameSave['currentWindows'][number]['id'], x: 112 + index * 22, y: 68 + index * 22, width: 760, height: 520, minimized: false, maximized: false }]
    if (item && typeof item === 'object' && 'id' in item) return [item as GameSave['currentWindows'][number]]
    return []
  })
  const caseStarted = value.caseStarted ?? Boolean(
    value.discoveredClueIds?.length ||
    value.openedItems?.length ||
    value.currentWindows?.length ||
    value.deductionResult,
  )
  return {
    ...fresh,
    ...value,
    caseStarted,
    restoredItemIds: value.restoredItemIds ?? fresh.restoredItemIds,
    evidenceNotes: value.evidenceNotes ?? fresh.evidenceNotes,
    bestScore: value.bestScore ?? value.deductionResult?.score ?? fresh.bestScore,
    currentWindows,
    saveVersion: CURRENT_SAVE_VERSION,
    settings: { ...fresh.settings, ...(value.settings ?? {}) },
    lastSavedAt: value.lastSavedAt ?? fresh.lastSavedAt,
  }
}

export function saveGameSave(storage: Storage, save: GameSave): void {
  storage.setItem(SAVE_KEY, JSON.stringify({ ...save, lastSavedAt: new Date().toISOString() }))
}

export function loadGameSave(storage: Storage): { status: 'fresh' | 'loaded' | 'corrupt'; save: GameSave } {
  const raw = storage.getItem(SAVE_KEY)
  if (!raw) return { status: 'fresh', save: createFreshSave() }
  try { return { status: 'loaded', save: migrateGameSave(JSON.parse(raw)) } } catch {
    try { storage.setItem(`${CORRUPT_PREFIX}${Date.now()}`, raw) } catch { /* recovery still returns a usable fresh save */ }
    return { status: 'corrupt', save: createFreshSave() }
  }
}

export function clearGameSave(storage: Storage): void { storage.removeItem(SAVE_KEY) }
