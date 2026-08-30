import { describe, expect, it, vi } from 'vitest'
import { getSoundProfile, playArchiveSound } from './audioEngine'

describe('archive audio engine', () => {
  it('uses distinct low-volume profiles for interface cues', () => {
    expect(getSoundProfile('click').frequency).not.toBe(getSoundProfile('clue').frequency)
    expect(getSoundProfile('error').duration).toBeLessThanOrEqual(0.16)
    expect(getSoundProfile('open').gain).toBeLessThanOrEqual(0.035)
  })

  it('does not request an audio context when sound is disabled', () => {
    const factory = vi.fn()
    expect(playArchiveSound('clue', false, factory)).toBe(false)
    expect(factory).not.toHaveBeenCalled()
  })
})
