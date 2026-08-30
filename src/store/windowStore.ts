import { create } from 'zustand'
import type { AppId } from '../cases/types'

export interface AppWindow { id: AppId; x: number; y: number; width: number; height: number; z: number; minimized: boolean; maximized: boolean }

interface WindowState {
  windows: AppWindow[]
  openWindow: (id: AppId) => void
  focusWindow: (id: AppId) => void
  moveWindow: (id: AppId, x: number, y: number) => void
  minimizeWindow: (id: AppId) => void
  toggleMaximize: (id: AppId) => void
  closeWindow: (id: AppId) => void
  restoreWindow: (id: AppId) => void
}

const defaults: Record<AppId, [number, number]> = { files: [780, 520], messages: [680, 520], mail: [760, 520], photos: [780, 560], browser: [760, 500], calendar: [700, 500], recycle: [720, 500], logs: [820, 500], evidence: [960, 620], settings: [560, 480] }

export const useWindowStore = create<WindowState>((set) => ({
  windows: [],
  openWindow: (id) => set((state) => {
    const existing = state.windows.find((window) => window.id === id)
    const nextZ = Math.max(100, ...state.windows.map((window) => window.z)) + 1
    if (existing) return { windows: state.windows.map((window) => window.id === id ? { ...window, minimized: false, z: nextZ } : window) }
    const [width, height] = defaults[id]
    const offset = state.windows.length * 24
    return { windows: [...state.windows, { id, x: 140 + offset, y: 70 + offset, width, height, z: nextZ, minimized: false, maximized: false }] }
  }),
  focusWindow: (id) => set((state) => ({ windows: state.windows.map((window) => window.id === id ? { ...window, z: Math.max(100, ...state.windows.map((item) => item.z)) + 1 } : window) })),
  moveWindow: (id, x, y) => set((state) => ({ windows: state.windows.map((window) => window.id === id ? { ...window, x: Math.max(-window.width + 180, Math.min(x, globalThis.innerWidth - 180)), y: Math.max(0, Math.min(y, globalThis.innerHeight - 80)) } : window) })),
  minimizeWindow: (id) => set((state) => ({ windows: state.windows.map((window) => window.id === id ? { ...window, minimized: true } : window) })),
  toggleMaximize: (id) => set((state) => ({ windows: state.windows.map((window) => window.id === id ? { ...window, maximized: !window.maximized } : window) })),
  closeWindow: (id) => set((state) => ({ windows: state.windows.filter((window) => window.id !== id) })),
  restoreWindow: (id) => set((state) => ({ windows: state.windows.map((window) => window.id === id ? { ...window, minimized: false, z: Math.max(100, ...state.windows.map((item) => item.z)) + 1 } : window) })),
}))
