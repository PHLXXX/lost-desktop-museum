import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createFreshSave } from '../engine/persistence'
import { caseDefinition } from '../cases/case-001/case'
import { useGameStore } from './gameStore'
import { defaultRewardProfile } from '../rewards/rewardProfile'
import { useRewardStore } from '../rewards/rewardStore'

describe('game store persistence and notification policy', () => {
  beforeEach(() => {
    localStorage.clear()
    useGameStore.setState({ ...createFreshSave(), saveStatus: 'idle', notice: null, corruptSave: false })
    useRewardStore.setState({ ...defaultRewardProfile, unlocks: [] })
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('debounces automatic persistence after investigation actions', () => {
    vi.useFakeTimers()
    const write = vi.spyOn(Storage.prototype, 'setItem')
    useGameStore.getState().investigate({ type: 'OPEN_ITEM', itemId: 'flight-cancel' })
    expect(write).not.toHaveBeenCalled()
    vi.advanceTimersByTime(349)
    expect(write).not.toHaveBeenCalled()
    vi.advanceTimersByTime(1)
    expect(write).toHaveBeenCalledTimes(1)
  })

  it('does not notify the same clue twice', () => {
    useGameStore.getState().investigate({ type: 'OPEN_ITEM', itemId: 'flight-cancel' })
    expect(useGameStore.getState().notice).toContain('被取消的航班')
    useGameStore.getState().dismissNotice()
    useGameStore.getState().investigate({ type: 'OPEN_ITEM', itemId: 'flight-cancel' })
    expect(useGameStore.getState().discoveredClueIds).toEqual(['C01'])
    expect(useGameStore.getState().notice).toBeNull()
  })

  it('does not inject another case identity after submitting a deduction', () => {
    useGameStore.setState({
      ...createFreshSave('case-002'),
      pinnedClueIds: ['C01'],
      saveStatus: 'idle',
      notice: null,
      corruptSave: false,
    })

    useGameStore.getState().submit(['local', 'no', 'cover'], '本地节目源与人员轨迹分离。')

    expect(useGameStore.getState().notice).toBeNull()
  })

  it('keeps completed onboarding across cases', () => {
    useGameStore.getState().setOnboardingComplete(true)
    useGameStore.getState().activateCase('case-002')

    expect(useGameStore.getState().onboardingComplete).toBe(true)
  })

  it('reveals a hint and debounces its persistence', () => {
    vi.useFakeTimers()
    const write = vi.spyOn(Storage.prototype, 'setItem')

    const result = useGameStore.getState().revealHint('flight-status-hint')

    expect(result).toMatchObject({ ok: true, remainingPoints: 2 })
    expect(useGameStore.getState().hintUsage).toEqual({ 'flight-status-hint': 1 })
    expect(write).not.toHaveBeenCalled()
    vi.advanceTimersByTime(350)
    expect(write).toHaveBeenCalledTimes(1)
  })

  it('does not mutate or save when a hint reveal fails', () => {
    vi.useFakeTimers()
    const write = vi.spyOn(Storage.prototype, 'setItem')
    useGameStore.setState({ hintUsage: { 'flight-status-hint': 3 } })

    const result = useGameStore.getState().revealHint('flight-status-hint')

    expect(result).toMatchObject({ ok: false, code: 'fully-revealed' })
    expect(useGameStore.getState().hintUsage).toEqual({ 'flight-status-hint': 3 })
    vi.advanceTimersByTime(1000)
    expect(write).not.toHaveBeenCalled()
  })

  it('records current and historical mastery when submitting a complete deduction', () => {
    useGameStore.setState({
      discoveredClueIds: caseDefinition.clues.map((clue) => clue.id),
      pinnedClueIds: caseDefinition.coreEvidenceIds.slice(0, 6),
      evidenceRelations: caseDefinition.correctContradictions.map(([from, to], index) => ({ id: `relation-${index}`, from, to, type: '相互矛盾' as const })),
      hintUsage: {},
    })

    const result = useGameStore.getState().submit(caseDefinition.questions.map((question) => question.correctId), '完整证据链。')

    expect(result.challengeIds).toEqual(expect.arrayContaining(caseDefinition.gameplay!.challenges.map((challenge) => challenge.id)))
    expect(useGameStore.getState().bestChallengeIds).toEqual(expect.arrayContaining(result.challengeIds ?? []))
  })

  it('settles completion rewards once and keeps them when restarting the case', () => {
    useGameStore.setState({
      discoveredClueIds: caseDefinition.clues.map((clue) => clue.id),
      pinnedClueIds: caseDefinition.coreEvidenceIds.slice(0, 6),
      evidenceRelations: caseDefinition.correctContradictions.map(([from, to], index) => ({ id: `reward-relation-${index}`, from, to, type: '相互矛盾' as const })),
      hintUsage: {},
    })

    const first = useGameStore.getState().submit(caseDefinition.questions.map((question) => question.correctId), '完成归档。')
    const second = useGameStore.getState().submit(caseDefinition.questions.map((question) => question.correctId), '再次归档。')

    expect(first.rewardIds).toEqual(expect.arrayContaining(['default-case-archive', 'default-complete-record']))
    expect(first.newRewardKeys).toEqual(expect.arrayContaining(['case-001:default-case-archive', 'case-001:default-complete-record']))
    expect(second.newRewardKeys).toEqual([])
    expect(useRewardStore.getState().unlocks).toHaveLength(2)

    useGameStore.getState().resetCase()
    expect(useRewardStore.getState().unlocks.map((reward) => reward.key)).toEqual(expect.arrayContaining(first.newRewardKeys ?? []))
  })

  it('clears current hints but retains earned mastery when restarting', () => {
    useGameStore.setState({ hintUsage: { 'default-hint-01': 1 }, bestChallengeIds: ['default-complete-archive'] })

    useGameStore.getState().resetCase()

    expect(useGameStore.getState().hintUsage).toEqual({})
    expect(useGameStore.getState().bestChallengeIds).toEqual(['default-complete-archive'])
  })

  it('adds newly completed objective feedback to the clue notice', () => {
    useGameStore.setState({ discoveredClueIds: ['C02', 'C03', 'C04', 'C05', 'C06'] })

    useGameStore.getState().investigate({ type: 'OPEN_ITEM', itemId: 'flight-cancel' })

    expect(useGameStore.getState().notice).toContain('目标完成：核对离开叙述')
  })
})
