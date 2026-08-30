import { beforeEach, describe, expect, it } from 'vitest'
import { useGameStore } from './gameStore'
import { useWindowStore } from './windowStore'

describe('window store', () => {
  beforeEach(() => { useWindowStore.setState({ windows: [], activeWindowId: null }); useGameStore.setState({ currentWindows: [] }) })

  it('opens, focuses, moves and resizes a persisted window', () => {
    const store = useWindowStore.getState(); store.openWindow('files')
    expect(useWindowStore.getState().windows[0]).toMatchObject({ id: 'files', width: 980, height: 620 })
    useWindowStore.getState().moveWindow('files', 9999, 9999)
    useWindowStore.getState().resizeWindow('files', 700, 480)
    expect(useWindowStore.getState().activeWindowId).toBe('files')
    expect(useGameStore.getState().currentWindows[0]).toMatchObject({ id: 'files', width: 700, height: 480 })
  })
})
