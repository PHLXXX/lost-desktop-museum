import { create } from 'zustand'
import { getCaseDefinition } from '../cases/registry'
import type { DeductionResult, EvidenceRelation, InvestigationAction, WindowSnapshot } from '../cases/types'
import { discoverClues } from '../engine/clueEngine'
import { playArchiveSound } from '../engine/audioEngine'
import { clearGameSave, createFreshSave, loadGameSave, saveGameSave } from '../engine/persistence'
import { scoreDeduction } from '../engine/scoringEngine'
import { evaluateTriggers } from '../engine/triggerEngine'
import { eventKey } from '../engine/conditionEngine'
import { loadGlobalPreferences, saveGlobalOnboardingPreference } from '../engine/globalPreferences'
import { evaluateChallenges } from '../gameplay/challengeEngine'
import { selectEnding } from '../gameplay/endingEngine'
import { revealNextHint, type HintRevealResult } from '../gameplay/hintEngine'
import { getObjectiveStates } from '../gameplay/objectiveEngine'
import { evaluateRewards } from '../gameplay/rewardEngine'
import { useRewardStore } from '../rewards/rewardStore'

type GameState = ReturnType<typeof createFreshSave> & {
  saveStatus: 'idle' | 'saving' | 'saved' | 'error'
  notice: string | null
  corruptSave: boolean
  investigate: (action: InvestigationAction) => void
  revealHint: (hintId: string) => HintRevealResult
  unlockMirror: () => void
  openIdentityDraft: () => void
  togglePinned: (id: string) => void
  setCardPosition: (id: string, x: number, y: number) => void
  addRelation: (from: string, to: string, type: EvidenceRelation['type']) => void
  removeRelation: (id: string) => void
  updateSettings: (settings: Partial<GameState['settings']>) => void
  submit: (answers: string[], note: string) => DeductionResult
  resetCase: () => void
  markCaseStarted: () => void
  tickPlayTime: () => void
  restoreItem: (id: string) => void
  setEvidenceNote: (id: string, note: string) => void
  updateDeductionDraft: (draft: Partial<GameState['deductionDraft']>) => void
  dismissNotice: () => void
  saveNow: () => void
  setOnboardingComplete: (complete: boolean) => void
  setDesktopNote: (note: string) => void
  updateWindowSnapshots: (windows: WindowSnapshot[]) => void
  activateCase: (caseId: string) => void
}

const storage = typeof window === 'undefined' ? undefined : window.localStorage
const loaded = storage ? loadGameSave(storage) : { status: 'fresh' as const, save: createFreshSave() }
const onboardingComplete = loaded.save.onboardingComplete || Boolean(storage && loadGlobalPreferences(storage).onboardingComplete)
if (storage && loaded.save.onboardingComplete) saveGlobalOnboardingPreference(storage, true)

let saveTimer: ReturnType<typeof setTimeout> | undefined
export function cancelPendingGameSave() { clearTimeout(saveTimer); saveTimer = undefined }
function saveImmediately(state: GameState, setStatus?: (status: GameState['saveStatus']) => void) {
  if (!storage) return
  try { saveGameSave(storage, state); setStatus?.('saved') } catch { setStatus?.('error') }
}
function persist(state: GameState, setStatus: (status: GameState['saveStatus']) => void) {
  setStatus('saving')
  clearTimeout(saveTimer)
  saveTimer = setTimeout(() => saveImmediately(state, setStatus), 350)
}

function completedObjectiveIds(caseId: string, state: GameState): Set<string> {
  return new Set(getObjectiveStates(getCaseDefinition(caseId), state).filter((objective) => objective.visible && objective.complete).map((objective) => objective.id))
}

function objectiveCompletionNotice(caseId: string, before: Set<string>, state: GameState): string | undefined {
  const completed = getObjectiveStates(getCaseDefinition(caseId), state).filter((objective) => objective.visible && objective.complete && !before.has(objective.id))
  return completed.length ? `目标完成：${completed.map((objective) => objective.title).join('、')}` : undefined
}

export const useGameStore = create<GameState>((set, get) => ({
  ...loaded.save,
  onboardingComplete,
  saveStatus: 'idle',
  notice: loaded.status === 'corrupt' ? '检测到无法读取的存档，原始数据已备份；你可以开始新的调查。' : null,
  corruptSave: loaded.status === 'corrupt',
  investigate: (action) => {
    const state = get()
    const caseDefinition = getCaseDefinition(state.caseId)
    const completedBefore = completedObjectiveIds(state.caseId, state)
    const completedEventKeys = [...new Set([...state.completedEventKeys, eventKey(action.type, action.itemId)])]
    const newIds = discoverClues(caseDefinition, action, state.discoveredClueIds, completedEventKeys)
    const discoveredClueIds = [...state.discoveredClueIds, ...newIds]
    const effects = evaluateTriggers(caseDefinition, discoveredClueIds, state.triggeredEventIds, action.type === 'OPEN_ITEM' ? action.itemId : undefined)
    const triggeredEventIds = [...state.triggeredEventIds, ...effects.map((effect) => effect.id)]
    const unlockedItemIds = [...state.unlockedItemIds, ...effects.flatMap((effect) => 'itemId' in effect ? [effect.itemId] : [])]
    const openedItems = state.openedItems.includes(action.itemId) ? state.openedItems : [...state.openedItems, action.itemId]
    if (newIds.length) playArchiveSound('clue', state.settings.sound)
    const clueTitle = newIds.length ? caseDefinition.clues.find((clue) => clue.id === newIds[0])?.title : null
    const eventMessage = effects.at(-1)?.message
    set({ discoveredClueIds, triggeredEventIds, unlockedItemIds, openedItems, completedEventKeys })
    const objectiveMessage = objectiveCompletionNotice(state.caseId, completedBefore, get())
    const notice = clueTitle
      ? `发现线索：${clueTitle}${eventMessage ? `｜${eventMessage}` : ''}${objectiveMessage ? `｜${objectiveMessage}` : ''}`
      : [eventMessage, objectiveMessage].filter(Boolean).join('｜') || state.notice
    set({ notice })
    persist(get(), (saveStatus) => set({ saveStatus }))
  },
  revealHint: (hintId) => {
    const state = get()
    const result = revealNextHint(getCaseDefinition(state.caseId), state, hintId)
    if (!result.ok) return result
    set({ hintUsage: result.hintUsage, notice: `分析提示：${result.tier.label}｜${result.tier.text}` })
    playArchiveSound('click', state.settings.sound)
    persist(get(), (saveStatus) => set({ saveStatus }))
    return result
  },
  unlockMirror: () => {
    const ids = ['identity-draft', 'linran-config', 'rename-todo']
    set((state) => ({ unlockedItemIds: [...new Set([...state.unlockedItemIds, ...ids])], notice: 'mirror.lock 已解锁：发现 3 个身份档案。' }))
    persist(get(), (saveStatus) => set({ saveStatus }))
  },
  openIdentityDraft: () => {
    const caseDefinition = getCaseDefinition(get().caseId)
    const effects = evaluateTriggers(caseDefinition, get().discoveredClueIds, get().triggeredEventIds, 'identity-draft')
    set((state) => ({ triggeredEventIds: [...state.triggeredEventIds, ...effects.map((effect) => effect.id)], notice: effects[0]?.message ?? state.notice }))
    persist(get(), (saveStatus) => set({ saveStatus }))
  },
  togglePinned: (id) => { set((state) => ({ pinnedClueIds: state.pinnedClueIds.includes(id) ? state.pinnedClueIds.filter((item) => item !== id) : [...state.pinnedClueIds, id].slice(0, 6) })); persist(get(), (saveStatus) => set({ saveStatus })) },
  setCardPosition: (id, x, y) => { set((state) => ({ evidenceCardPositions: { ...state.evidenceCardPositions, [id]: { x, y } } })); persist(get(), (saveStatus) => set({ saveStatus })) },
  addRelation: (from, to, type) => {
    if (from === to) return
    const state = get()
    const completedBefore = completedObjectiveIds(state.caseId, state)
    set({ evidenceRelations: [...state.evidenceRelations, { id: `${from}-${to}-${Date.now()}`, from, to, type }] })
    const objectiveMessage = objectiveCompletionNotice(state.caseId, completedBefore, get())
    if (objectiveMessage) set({ notice: objectiveMessage })
    persist(get(), (saveStatus) => set({ saveStatus }))
  },
  removeRelation: (id) => { set((state) => ({ evidenceRelations: state.evidenceRelations.filter((relation) => relation.id !== id) })); persist(get(), (saveStatus) => set({ saveStatus })) },
  updateSettings: (settings) => { set((state) => ({ settings: { ...state.settings, ...settings } })); persist(get(), (saveStatus) => set({ saveStatus })) },
  submit: (answers, note) => {
    const state = get()
    const caseDefinition = getCaseDefinition(state.caseId)
    const contradictionPairs = state.evidenceRelations.filter((relation) => relation.type === '相互矛盾').map((relation) => [relation.from, relation.to] as [string, string])
    const scored = scoreDeduction(caseDefinition, { answers, evidenceIds: state.pinnedClueIds, contradictionPairs, note })
    const challengeIds = evaluateChallenges(caseDefinition, state, scored)
    const ending = selectEnding(caseDefinition, state, scored)
    const rewards = evaluateRewards(caseDefinition, state, scored)
    const newRewardKeys = useRewardStore.getState().unlock(caseDefinition, rewards)
    const result = { ...scored, challengeIds, endingVariantId: ending.id ?? undefined, rewardIds: rewards.map((reward) => reward.id), newRewardKeys }
    set({
      deductionResult: result,
      bestScore: Math.max(state.bestScore ?? 0, result.score),
      bestChallengeIds: [...new Set([...state.bestChallengeIds, ...challengeIds])],
      notice: null,
    })
    persist(get(), (saveStatus) => set({ saveStatus }))
    return result
  },
  resetCase: () => {
    const caseId = get().caseId
    const settings = get().settings
    const bestScore = get().bestScore
    const bestChallengeIds = get().bestChallengeIds
    const onboardingComplete = get().onboardingComplete || Boolean(storage && loadGlobalPreferences(storage).onboardingComplete)
    if (storage) clearGameSave(storage, caseId)
    set({ ...createFreshSave(caseId), settings, bestScore, bestChallengeIds, onboardingComplete, notice: '案件已重置。', corruptSave: false })
    persist(get(), (saveStatus) => set({ saveStatus }))
  },
  markCaseStarted: () => {
    set({ caseStarted: true })
    persist(get(), (saveStatus) => set({ saveStatus }))
  },
  tickPlayTime: () => set((state) => ({ playTime: state.playTime + 1 })),
  restoreItem: (id) => {
    set((state) => ({ restoredItemIds: [...new Set([...state.restoredItemIds, id])] }))
    persist(get(), (saveStatus) => set({ saveStatus }))
  },
  setEvidenceNote: (id, note) => {
    set((state) => ({ evidenceNotes: { ...state.evidenceNotes, [id]: note } }))
    persist(get(), (saveStatus) => set({ saveStatus }))
  },
  updateDeductionDraft: (draft) => {
    set((state) => ({ deductionDraft: { ...state.deductionDraft, ...draft } }))
    persist(get(), (saveStatus) => set({ saveStatus }))
  },
  dismissNotice: () => set({ notice: null }),
  saveNow: () => {
    clearTimeout(saveTimer)
    set({ saveStatus: 'saving' })
    saveImmediately(get(), (saveStatus) => set({ saveStatus, lastSavedAt: new Date().toISOString() }))
  },
  setOnboardingComplete: (onboardingComplete) => {
    if (storage) saveGlobalOnboardingPreference(storage, onboardingComplete)
    set({ onboardingComplete })
    persist(get(), (saveStatus) => set({ saveStatus }))
  },
  setDesktopNote: (desktopNote) => { set({ desktopNote }); persist(get(), (saveStatus) => set({ saveStatus })) },
  updateWindowSnapshots: (currentWindows) => { set({ currentWindows }); persist(get(), (saveStatus) => set({ saveStatus })) },
  activateCase: (caseId) => {
    clearTimeout(saveTimer)
    const next = storage ? loadGameSave(storage, caseId) : { status: 'fresh' as const, save: createFreshSave(caseId) }
    const globalOnboardingComplete = Boolean(storage && loadGlobalPreferences(storage).onboardingComplete)
    if (storage && next.save.onboardingComplete) saveGlobalOnboardingPreference(storage, true)
    set({ ...next.save, onboardingComplete: next.save.onboardingComplete || globalOnboardingComplete, saveStatus: 'idle', notice: next.status === 'corrupt' ? '检测到无法读取的存档，原始数据已备份；你可以开始新的调查。' : null, corruptSave: next.status === 'corrupt' })
  },
}))
