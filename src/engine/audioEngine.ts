export type SoundCue = 'click' | 'open' | 'clue' | 'error'

export interface SoundProfile {
  frequency: number
  endFrequency: number
  duration: number
  gain: number
  wave: OscillatorType
}

const profiles: Record<SoundCue, SoundProfile> = {
  click: { frequency: 420, endFrequency: 360, duration: 0.045, gain: 0.018, wave: 'sine' },
  open: { frequency: 310, endFrequency: 430, duration: 0.09, gain: 0.025, wave: 'triangle' },
  clue: { frequency: 520, endFrequency: 760, duration: 0.14, gain: 0.032, wave: 'sine' },
  error: { frequency: 190, endFrequency: 140, duration: 0.12, gain: 0.028, wave: 'square' },
}

export function getSoundProfile(cue: SoundCue): SoundProfile { return profiles[cue] }

function defaultFactory() {
  const Constructor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  return Constructor ? new Constructor() : null
}

export function playArchiveSound(cue: SoundCue, enabled: boolean, factory: () => AudioContext | null = defaultFactory): boolean {
  if (!enabled || typeof window === 'undefined') return false
  try {
    const context = factory()
    if (!context) return false
    const profile = getSoundProfile(cue)
    const oscillator = context.createOscillator()
    const gain = context.createGain()
    const now = context.currentTime
    oscillator.type = profile.wave
    oscillator.frequency.setValueAtTime(profile.frequency, now)
    oscillator.frequency.exponentialRampToValueAtTime(profile.endFrequency, now + profile.duration)
    gain.gain.setValueAtTime(profile.gain, now)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + profile.duration)
    oscillator.connect(gain)
    gain.connect(context.destination)
    oscillator.start(now)
    oscillator.stop(now + profile.duration)
    oscillator.addEventListener('ended', () => { void context.close() }, { once: true })
    return true
  } catch {
    return false
  }
}
