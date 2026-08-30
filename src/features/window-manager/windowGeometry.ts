import type { AppId } from '../../cases/types'

export const defaultWindowSizes: Record<AppId, [number, number]> = {
  files: [980, 620], messages: [860, 580], mail: [1020, 650], photos: [940, 640], browser: [900, 560], calendar: [880, 600], recycle: [820, 520], logs: [980, 580], evidence: [1100, 680], settings: [680, 520],
}

export function clampWindow<T extends { x: number; y: number; width: number; height: number }>(window: T, viewportWidth = globalThis.innerWidth, viewportHeight = globalThis.innerHeight): T {
  const width = Math.min(window.width, Math.max(430, viewportWidth - 24))
  const height = Math.min(window.height, Math.max(310, viewportHeight - 60))
  const x = Math.max(0, Math.min(window.x, viewportWidth - width))
  const y = Math.max(40, Math.min(window.y, viewportHeight - 48 - height))
  return { ...window, x, y, width, height }
}
