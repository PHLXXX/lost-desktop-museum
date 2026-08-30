import { create } from 'zustand'
import { caseDefinition } from '../cases/case-001/case'
import type { DeductionResult, EvidenceRelation, InvestigationAction, WindowSnapshot } from '../cases/types'
import { discoverClues } from '../engine/clueEngine'
import { clearGameSave, createFreshSave, loadGameSave, saveGameSave } from '../engine/persistence'
import { scoreDeduction } from '../engine/scoringEngine'
import { evaluateTriggers } from '../engine/triggerEngine'

type GameState = ReturnType<typeof createFreshSave> & {
  saveStatus: 'idle' | 'saving' | 'saved' | 'error'
  notice: string | null
  corruptSave: boolean
  investigate: (action: InvestigationAction) => void
  unlockMirror: () => void
  openIdentityDraft: () => void
  togglePinned: (id: string) => void
  setCardPosition: (id: string, x: number, y: number) => void
  addRelation: (from: string, to: string, type: EvidenceRelation['type']) => void
  removeRelation: (id: string) => void
  updateSettings: (settings: Partial<GameState['settings']>) => void
  submit: (answers: string[], note: string) => DeductionResult
  resetCase: () => void
  dismissNotice: () => void
  saveNow: () => void
  setOnboardingComplete: (complete: boolean) => void
  setDesktopNote: (note: string) => void
  updateWindowSnapshots: (windows: WindowSnapshot[]) => void
}

const storage = typeof window === 'undefined' ? undefined : window.localStorage
const loaded = storage ? loadGameSave(storage) : { status: 'fresh' as const, save: createFreshSave() }

let saveTimer: ReturnType<typeof setTimeout> | undefined
function saveImmediately(state: GameState, setStatus?: (status: GameState['saveStatus']) => void) {
  if (!storage) return
  try { saveGameSave(storage, state); setStatus?.('saved') } catch { setStatus?.('error') }
}
function persist(state: GameState, setStatus: (status: GameState['saveStatus']) => void) {
  setStatus('saving')
  clearTimeout(saveTimer)
  saveTimer = setTimeout(() => saveImmediately(state, setStatus), 350)
}

export const useGameStore = create<GameState>((set, get) => ({
  ...loaded.save,
  saveStatus: 'idle',
  notice: loaded.status === 'corrupt' ? '存档无法读取，已为你创建新的调查进度。' : null,
  corruptSave: loaded.status === 'corrupt',
  investigate: (action) => {
    const state = get()
    const newIds = discoverClues(caseDefinition, action, state.discoveredClueIds)
    const discoveredClueIds = [...state.discoveredClueIds, ...newIds]
    const effects = evaluateTriggers(caseDefinition, discoveredClueIds, state.triggeredEventIds, action.type === 'OPEN_ITEM' ? action.itemId : undefined)
    const triggeredEventIds = [...state.triggeredEventIds, ...effects.map((effect) => effect.id)]
    const unlockedItemIds = [...state.unlockedItemIds, ...effects.flatMap((effect) => effect.itemId ? [effect.itemId] : [])]
    const openedItems = state.openedItems.includes(action.itemId) ? state.openedItems : [...state.openedItems, action.itemId]
    set({ discoveredClueIds, triggeredEventIds, unlockedItemIds, openedItems, notice: effects.at(-1)?.message ?? (newIds.length ? `发现线索：${caseDefinition.clues.find((clue) => clue.id === newIds[0])?.title}` : state.notice) })
    persist(get(), (saveStatus) => set({ saveStatus }))
  },
  unlockMirror: () => {
    const ids = ['identity-draft', 'linran-config', 'rename-todo']
    set((state) => ({ unlockedItemIds: [...new Set([...state.unlockedItemIds, ...ids])], notice: 'mirror.lock 已解锁：发现 3 个身份档案。' }))
    persist(get(), (saveStatus) => set({ saveStatus }))
  },
  openIdentityDraft: () => {
    const effects = evaluateTriggers(caseDefinition, get().discoveredClueIds, get().triggeredEventIds, 'identity-draft')
    set((state) => ({ triggeredEventIds: [...state.triggeredEventIds, ...effects.map((effect) => effect.id)], notice: effects[0]?.message ?? state.notice }))
    persist(get(), (saveStatus) => set({ saveStatus }))
  },
  togglePinned: (id) => { set((state) => ({ pinnedClueIds: state.pinnedClueIds.includes(id) ? state.pinnedClueIds.filter((item) => item !== id) : [...state.pinnedClueIds, id].slice(0, 6) })); persist(get(), (saveStatus) => set({ saveStatus })) },
  setCardPosition: (id, x, y) => { set((state) => ({ evidenceCardPositions: { ...state.evidenceCardPositions, [id]: { x, y } } })); persist(get(), (saveStatus) => set({ saveStatus })) },
  addRelation: (from, to, type) => { if (from === to) return; set((state) => ({ evidenceRelations: [...state.evidenceRelations, { id: `${from}-${to}-${Date.now()}`, from, to, type }] })); persist(get(), (saveStatus) => set({ saveStatus })) },
  removeRelation: (id) => { set((state) => ({ evidenceRelations: state.evidenceRelations.filter((relation) => relation.id !== id) })); persist(get(), (saveStatus) => set({ saveStatus })) },
  updateSettings: (settings) => { set((state) => ({ settings: { ...state.settings, ...settings } })); persist(get(), (saveStatus) => set({ saveStatus })) },
  submit: (answers, note) => {
    const state = get()
    const contradictionPairs = state.evidenceRelations.filter((relation) => relation.type === '相互矛盾').map((relation) => [relation.from, relation.to] as [string, string])
    const result = scoreDeduction(caseDefinition, { answers, evidenceIds: state.pinnedClueIds, contradictionPairs, note })
    set({ deductionResult: result, notice: '检测到新的本地会话。用户 LINRAN 登录成功。' })
    persist(get(), (saveStatus) => set({ saveStatus }))
    return result
  },
  resetCase: () => {
    const settings = get().settings
    if (storage) clearGameSave(storage)
    set({ ...createFreshSave(), settings, notice: '案件已重置。', corruptSave: false })
    persist(get(), (saveStatus) => set({ saveStatus }))
  },
  dismissNotice: () => set({ notice: null }),
  saveNow: () => {
    clearTimeout(saveTimer)
    set({ saveStatus: 'saving' })
    saveImmediately(get(), (saveStatus) => set({ saveStatus, lastSavedAt: new Date().toISOString() }))
  },
  setOnboardingComplete: (onboardingComplete) => { set({ onboardingComplete }); persist(get(), (saveStatus) => set({ saveStatus })) },
  setDesktopNote: (desktopNote) => { set({ desktopNote }); persist(get(), (saveStatus) => set({ saveStatus })) },
  updateWindowSnapshots: (currentWindows) => { set({ currentWindows }); persist(get(), (saveStatus) => set({ saveStatus })) },
}))
