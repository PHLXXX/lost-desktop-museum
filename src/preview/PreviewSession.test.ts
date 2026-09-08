import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { compileCaseDraft } from '../editor/compiler/compileCaseDraft'
import { createMinimalTemplateDraft } from '../editor/model/caseDraft'
import { createFreshSave } from '../engine/persistence'
import { useGameStore } from '../store/gameStore'
import { defaultRewardProfile, REWARD_PROFILE_KEY } from '../rewards/rewardProfile'
import { useRewardStore } from '../rewards/rewardStore'
import { PreviewSession } from './PreviewSession'

describe('isolated preview sessions', () => {
  beforeEach(() => { vi.useFakeTimers(); localStorage.clear(); useRewardStore.setState({ ...defaultRewardProfile, unlocks: [] }); useGameStore.setState({ ...createFreshSave('case-001'), discoveredClueIds: ['C01'], bestScore: 88, hintUsage: { 'default-hint-02': 1 }, bestChallengeIds: ['default-complete-archive'] }) })
  afterEach(() => vi.useRealTimers())

  it('restores formal progress, score and save namespace after preview', async () => {
    const compiled = compileCaseDraft(createMinimalTemplateDraft())
    if (!compiled.ok) throw new Error('template should compile')
    const session = new PreviewSession('project-preview-test', compiled.caseDefinition)
    session.start()
    useGameStore.getState().investigate({ type: 'OPEN_ITEM', itemId: 'file-handover' })
    expect(useGameStore.getState().discoveredClueIds).toContain('clue-handover')
    session.stop()
    await vi.runAllTimersAsync()
    expect(useGameStore.getState().caseId).toBe('case-001')
    expect(useGameStore.getState().discoveredClueIds).toEqual(['C01'])
    expect(useGameStore.getState().bestScore).toBe(88)
    expect(useGameStore.getState().hintUsage).toEqual({ 'default-hint-02': 1 })
    expect(useGameStore.getState().bestChallengeIds).toEqual(['default-complete-archive'])
    expect([...Array(localStorage.length)].map((_item, index) => localStorage.key(index)).filter(Boolean).some((key) => key!.includes('preview-'))).toBe(false)
  })

  it('does not leak preview hint usage into the formal case', () => {
    const compiled = compileCaseDraft(createMinimalTemplateDraft())
    if (!compiled.ok) throw new Error('template should compile')
    const session = new PreviewSession('project-preview-hints', compiled.caseDefinition)
    session.start()
    useGameStore.setState({ hintUsage: { 'default-hint-01': 2 }, bestChallengeIds: ['preview-only'] })

    session.stop()

    expect(useGameStore.getState().hintUsage).toEqual({ 'default-hint-02': 1 })
    expect(useGameStore.getState().bestChallengeIds).toEqual(['default-complete-archive'])
  })

  it('does not leak rewards earned during a workshop preview', () => {
    const compiled = compileCaseDraft(createMinimalTemplateDraft())
    if (!compiled.ok) throw new Error('template should compile')
    const session = new PreviewSession('project-preview-rewards', compiled.caseDefinition)
    session.start()
    useGameStore.setState({
      discoveredClueIds: compiled.caseDefinition.clues.map((clue) => clue.id),
      pinnedClueIds: compiled.caseDefinition.coreEvidenceIds,
      evidenceRelations: compiled.caseDefinition.correctContradictions.map(([from, to], index) => ({ id: `preview-relation-${index}`, from, to, type: '相互矛盾' as const })),
    })

    useGameStore.getState().submit(compiled.caseDefinition.questions.map((question) => question.correctId), '试玩结案。')
    expect(useRewardStore.getState().unlocks.some((reward) => reward.caseId.startsWith('preview-'))).toBe(true)

    session.stop()

    expect(useRewardStore.getState().unlocks).toEqual([])
    expect(localStorage.getItem(REWARD_PROFILE_KEY)).toBeNull()
  })
})
