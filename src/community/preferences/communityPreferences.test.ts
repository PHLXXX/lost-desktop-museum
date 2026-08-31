import { describe, expect, it } from 'vitest'
import { normalizeCommunityPreference } from './communityPreferences'

describe('local community preferences', () => {
  it('keeps favorites ratings and notes local and plain text', () => {
    const value = normalizeCommunityPreference('case-one', { favorite: true, rating: 5, note: '<b>private</b>' })
    expect(value).toMatchObject({ caseId: 'case-one', favorite: true, rating: 5, note: '<b>private</b>' })
    expect(value).not.toHaveProperty('publicRating')
  })
  it('rejects invalid rating and oversized notes', () => {
    expect(() => normalizeCommunityPreference('case-one', { favorite: false, rating: 6 as never, note: '' })).toThrow()
    expect(() => normalizeCommunityPreference('case-one', { favorite: false, rating: null, note: 'x'.repeat(5001) })).toThrow()
  })
})
