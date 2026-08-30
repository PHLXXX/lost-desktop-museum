import { create } from 'zustand'
import type { AppId, WindowSnapshot } from '../cases/types'
import { clampWindow, defaultWindowSizes } from '../features/window-manager/windowGeometry'
import { useGameStore } from './gameStore'

export interface AppWindow extends WindowSnapshot {
  z: number
}

interface WindowState {
  windows: AppWindow[]
  activeWindowId: AppId | null
  openWindow: (id: AppId) => void
  focusWindow: (id: AppId) => void
  moveWindow: (id: AppId, x: number, y: number) => void
  resizeWindow: (id: AppId, width: number, height: number, x?: number, y?: number) => void
  minimizeWindow: (id: AppId) => void
  toggleMaximize: (id: AppId) => void
  closeWindow: (id: AppId) => void
  restoreWindow: (id: AppId) => void
  hydrateWindows: () => void
  resetWindows: () => void
}

function snapshots(windows: AppWindow[]): WindowSnapshot[] {
  return windows.map((window) => ({ id: window.id, x: window.x, y: window.y, width: window.width, height: window.height, minimized: window.minimized, maximized: window.maximized }))
}
function persistWindows(windows: AppWindow[]) {
  useGameStore.getState().updateWindowSnapshots(snapshots(windows))
}

const loaded = useGameStore
  .getState()
  .currentWindows.map((window, index) => ({ ...clampWindow(window), z: 101 + index }))

export const useWindowStore = create<WindowState>((set) => ({
  windows: loaded,
  activeWindowId: loaded.at(-1)?.id ?? null,
  openWindow: (id) =>
    set((state) => {
      const nextZ = Math.max(100, ...state.windows.map((window) => window.z)) + 1
      const existing = state.windows.find((window) => window.id === id)
      let windows: AppWindow[]
      if (existing)
        windows = state.windows.map((window) =>
          window.id === id ? { ...window, minimized: false, z: nextZ } : window,
        )
      else {
        const [defaultWidth, defaultHeight] = defaultWindowSizes[id]
        const offset = (state.windows.length % 6) * 22
        const compact = globalThis.innerWidth < 1024
        windows = [
          ...state.windows,
          clampWindow({
            id,
            x: 96 + offset,
            y: 62 + offset,
            width: defaultWidth,
            height: defaultHeight,
            minimized: false,
            maximized: compact,
            z: nextZ,
          }),
        ]
      }
      persistWindows(windows)
      return { windows, activeWindowId: id }
    }),
  focusWindow: (id) =>
    set((state) => {
      if (state.activeWindowId === id) return state
      const z = Math.max(100, ...state.windows.map((window) => window.z)) + 1
      return {
        windows: state.windows.map((window) => (window.id === id ? { ...window, z } : window)),
        activeWindowId: id,
      }
    }),
  moveWindow: (id, x, y) =>
    set((state) => {
      const windows = state.windows.map((window) =>
        window.id === id ? clampWindow({ ...window, x, y }) : window,
      )
      persistWindows(windows)
      return { windows }
    }),
  resizeWindow: (id, width, height, x, y) =>
    set((state) => {
      const windows = state.windows.map((window) =>
        window.id === id
          ? clampWindow({
              ...window,
              width: Math.max(430, width),
              height: Math.max(310, height),
              x: x ?? window.x,
              y: y ?? window.y,
            })
          : window,
      )
      persistWindows(windows)
      return { windows }
    }),
  minimizeWindow: (id) =>
    set((state) => {
      const windows = state.windows.map((window) =>
        window.id === id ? { ...window, minimized: true } : window,
      )
      persistWindows(windows)
      return { windows, activeWindowId: state.activeWindowId === id ? null : state.activeWindowId }
    }),
  toggleMaximize: (id) =>
    set((state) => {
      const windows = state.windows.map((window) =>
        window.id === id ? { ...window, maximized: !window.maximized } : window,
      )
      persistWindows(windows)
      return { windows, activeWindowId: id }
    }),
  closeWindow: (id) =>
    set((state) => {
      const windows = state.windows.filter((window) => window.id !== id)
      persistWindows(windows)
      return { windows, activeWindowId: windows.at(-1)?.id ?? null }
    }),
  restoreWindow: (id) =>
    set((state) => {
      const z = Math.max(100, ...state.windows.map((window) => window.z)) + 1
      const windows = state.windows.map((window) =>
        window.id === id ? { ...window, minimized: false, z } : window,
      )
      persistWindows(windows)
      return { windows, activeWindowId: id }
    }),
  hydrateWindows: () =>
    set({
      windows: useGameStore
        .getState()
        .currentWindows.map((window, index) => ({ ...clampWindow(window), z: 101 + index })),
    }),
  resetWindows: () => {
    persistWindows([])
    set({ windows: [], activeWindowId: null })
  },
}))
