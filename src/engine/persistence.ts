import type { GameSave } from '../cases/types'

export const SAVE_KEY = 'archive-os:case-001'
export const CORRUPT_PREFIX = 'archive-os:case:corrupt:'
export const CURRENT_SAVE_VERSION = 2

export function getSaveKey(caseId: string): string {
  if (caseId.startsWith('preview-')) return `archive-workshop:preview:${caseId}`
  return caseId === 'case-001' ? SAVE_KEY : `archive-os:case:${caseId}`
}

export function createFreshSave(caseId = 'case-001'): GameSave {
  return {
    saveVersion: CURRENT_SAVE_VERSION,
    caseId,
    caseStarted: false,
    openedItems: [],
    completedEventKeys: [],
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

export function migrateGameSave(input: unknown, caseId = 'case-001'): GameSave {
  const fresh = createFreshSave(caseId)
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
    caseId,
    caseStarted,
    restoredItemIds: value.restoredItemIds ?? fresh.restoredItemIds,
    completedEventKeys: value.completedEventKeys ?? fresh.completedEventKeys,
    evidenceNotes: value.evidenceNotes ?? fresh.evidenceNotes,
    bestScore: value.bestScore ?? value.deductionResult?.score ?? fresh.bestScore,
    currentWindows,
    saveVersion: CURRENT_SAVE_VERSION,
    settings: { ...fresh.settings, ...(value.settings ?? {}) },
    lastSavedAt: value.lastSavedAt ?? fresh.lastSavedAt,
  }
}

export function saveGameSave(storage: Storage, save: GameSave): void {
  const serialized = JSON.stringify({ ...save, lastSavedAt: new Date().toISOString() })
  storage.setItem(getSaveKey(save.caseId), serialized)
}

export function loadGameSave(storage: Storage, caseId = 'case-001'): { status: 'fresh' | 'loaded' | 'corrupt'; save: GameSave } {
  const key = getSaveKey(caseId)
  const raw = storage.getItem(key) ?? (caseId === 'case-001' ? storage.getItem(SAVE_KEY) : null)
  if (!raw) return { status: 'fresh', save: createFreshSave(caseId) }
  try {
    const save = migrateGameSave(JSON.parse(raw), caseId)
    if (!storage.getItem(key)) saveGameSave(storage, save)
    return { status: 'loaded', save }
  } catch {
    try { storage.setItem(`${CORRUPT_PREFIX}${Date.now()}`, raw) } catch { /* recovery still returns a usable fresh save */ }
    return { status: 'corrupt', save: createFreshSave(caseId) }
  }
}

export function clearGameSave(storage: Storage, caseId = 'case-001'): void { storage.removeItem(getSaveKey(caseId)) }
