import { registerPreviewCase, unregisterPreviewCase } from '../cases/registry'
import type { CaseDefinition, GameSave } from '../cases/types'
import { clearGameSave } from '../engine/persistence'
import { cancelPendingGameSave, useGameStore } from '../store/gameStore'
import { useWindowStore } from '../store/windowStore'

export class PreviewSession {
  readonly previewCaseId: string
  private gameSnapshot: GameSave & { saveStatus: 'idle' | 'saving' | 'saved' | 'error'; notice: string | null; corruptSave: boolean }
  private windowSnapshot: Pick<ReturnType<typeof useWindowStore.getState>, 'windows' | 'activeWindowId'>
  constructor(private projectId: string, definition: CaseDefinition) {
    this.previewCaseId = `preview-${projectId}`
    const game = useGameStore.getState()
    this.gameSnapshot = { saveVersion: game.saveVersion, caseId: game.caseId, caseStarted: game.caseStarted, openedItems: [...game.openedItems], completedEventKeys: [...game.completedEventKeys], discoveredClueIds: [...game.discoveredClueIds], pinnedClueIds: [...game.pinnedClueIds], unlockedItemIds: [...game.unlockedItemIds], restoredItemIds: [...game.restoredItemIds], triggeredEventIds: [...game.triggeredEventIds], evidenceCardPositions: structuredClone(game.evidenceCardPositions), evidenceRelations: structuredClone(game.evidenceRelations), evidenceNotes: { ...game.evidenceNotes }, currentWindows: structuredClone(game.currentWindows), settings: { ...game.settings }, deductionDraft: structuredClone(game.deductionDraft), deductionResult: game.deductionResult ? { ...game.deductionResult } : null, bestScore: game.bestScore, onboardingComplete: game.onboardingComplete, desktopNote: game.desktopNote, playTime: game.playTime, lastSavedAt: game.lastSavedAt, saveStatus: game.saveStatus, notice: game.notice, corruptSave: game.corruptSave }
    const windows = useWindowStore.getState()
    this.windowSnapshot = { windows: structuredClone(windows.windows), activeWindowId: windows.activeWindowId }
    const previewDefinition = structuredClone(definition)
    previewDefinition.id = this.previewCaseId
    previewDefinition.manifest.caseId = this.previewCaseId
    previewDefinition.manifest.builtIn = false
    registerPreviewCase(previewDefinition)
  }
  start() {
    useGameStore.getState().activateCase(this.previewCaseId)
    useGameStore.getState().markCaseStarted()
    useWindowStore.getState().resetWindows()
  }
  snapshot(): GameSave {
    const state = useGameStore.getState()
    return { saveVersion: state.saveVersion, caseId: state.caseId, caseStarted: state.caseStarted, openedItems: state.openedItems, completedEventKeys: state.completedEventKeys, discoveredClueIds: state.discoveredClueIds, pinnedClueIds: state.pinnedClueIds, unlockedItemIds: state.unlockedItemIds, restoredItemIds: state.restoredItemIds, triggeredEventIds: state.triggeredEventIds, evidenceCardPositions: state.evidenceCardPositions, evidenceRelations: state.evidenceRelations, evidenceNotes: state.evidenceNotes, currentWindows: state.currentWindows, settings: state.settings, deductionDraft: state.deductionDraft, deductionResult: state.deductionResult, bestScore: state.bestScore, onboardingComplete: state.onboardingComplete, desktopNote: state.desktopNote, playTime: state.playTime, lastSavedAt: state.lastSavedAt }
  }
  stop() {
    unregisterPreviewCase(this.previewCaseId)
    cancelPendingGameSave()
    if (typeof window !== 'undefined') clearGameSave(window.localStorage, this.previewCaseId)
    useGameStore.setState(this.gameSnapshot)
    useWindowStore.setState(this.windowSnapshot)
  }
}
