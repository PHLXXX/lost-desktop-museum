import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createFreshSave } from '../engine/persistence'
import { useGameStore } from './gameStore'

describe('game store persistence and notification policy', () => {
  beforeEach(() => {
    localStorage.clear()
    useGameStore.setState({ ...createFreshSave(), saveStatus: 'idle', notice: null, corruptSave: false })
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
})
