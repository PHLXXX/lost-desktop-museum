import { describe, expect, it } from 'vitest'
import fixtureIndex from '../../../tests/fixtures/community/registry/v1/index.json'
import { parseCommunityRegistryIndex } from '../schema/registrySchema'
import { filterCommunityCases, searchCommunityCases } from './communitySearch'

const communityFixtureIndex = parseCommunityRegistryIndex(fixtureIndex)

describe('community search and filters', () => {
  it('prioritizes exact title matches over summary-only matches', () => {
    const base = communityFixtureIndex.cases[0]!
    const result = searchCommunityCases([base, { ...base, caseId: 'case-office-copy', title: '办公室记录', summary: `旁支案件提到${base.title}` }], base.title)
    expect(result[0]?.caseId).toBe(base.caseId)
  })
  it('filters tags, difficulty and content rating without global scores', () => {
    const result = filterCommunityCases(communityFixtureIndex.cases, { tags: ['教学案件'], difficulties: ['easy'], ratings: ['general'], showMature: false })
    expect(result).toHaveLength(1)
    expect(result[0]).not.toHaveProperty('rating')
    expect(filterCommunityCases(communityFixtureIndex.cases, { tags: [], difficulties: ['hard'], ratings: ['general'], showMature: false })).toHaveLength(0)
  })
})
