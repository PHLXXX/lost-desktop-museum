import { describe, expect, it } from 'vitest'
import { compareSemver, isEngineVersionCompatible } from './semver'

describe('community semantic versions', () => {
  it('orders release and prerelease versions without lexical mistakes', () => {
    expect(compareSemver('1.10.0', '1.9.9')).toBe(1)
    expect(compareSemver('2.0.0', '2.0.0')).toBe(0)
    expect(compareSemver('2.0.0-beta.2', '2.0.0-beta.10')).toBe(-1)
    expect(compareSemver('2.0.0', '2.0.0-beta.10')).toBe(1)
  })

  it('checks both minimum and exclusive maximum engine bounds', () => {
    expect(isEngineVersionCompatible('0.5.0', { minimum: '0.5.0' })).toBe(true)
    expect(isEngineVersionCompatible('0.5.0', { minimum: '0.6.0' })).toBe(false)
    expect(isEngineVersionCompatible('1.0.0', { minimum: '0.5.0', maximumExclusive: '1.0.0' })).toBe(false)
  })
})
