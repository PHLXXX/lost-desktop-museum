import { describe, expect, it } from 'vitest'
import { clampWindow, defaultWindowSizes } from './windowGeometry'

describe('window geometry', () => {
  it('uses the stage two default sizes', () => {
    expect(defaultWindowSizes.files).toEqual([980, 620])
    expect(defaultWindowSizes.mail).toEqual([1020, 650])
    expect(defaultWindowSizes.evidence).toEqual([1100, 680])
    expect(defaultWindowSizes.settings).toEqual([680, 520])
  })

  it('keeps a restored window inside the available desktop', () => {
    expect(clampWindow({ x: 1300, y: 800, width: 980, height: 620 }, 1280, 720)).toMatchObject({ x: 300, y: 52, width: 980, height: 620 })
  })
})
