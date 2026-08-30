import { describe, expect, it } from 'vitest'
import { clampEvidenceZoom, createEvidenceLayout } from './evidenceHistory'

describe('evidence workspace helpers', () => {
  it('creates a deterministic two-column layout', () => {
    expect(createEvidenceLayout(['C01', 'C02', 'C03'])).toEqual({ C01: { x: 26, y: 28 }, C02: { x: 264, y: 28 }, C03: { x: 26, y: 200 } })
  })

  it('clamps canvas zoom', () => {
    expect(clampEvidenceZoom(.2)).toBe(.7)
    expect(clampEvidenceZoom(2)).toBe(1.4)
  })
})
