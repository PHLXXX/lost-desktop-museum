import { describe, expect, it } from 'vitest'
import { importCasePackage } from '../../packages/casePackage'
import { buildCommunityFixtureArtifacts } from './communityFixtures'

describe('deterministic community fixtures', () => {
  it('builds stable playable, compatible-update and incompatible packages', async () => {
    const first = await buildCommunityFixtureArtifacts()
    const second = await buildCommunityFixtureArtifacts()
    expect([...first.keys()]).toEqual([...second.keys()])
    for (const path of first.keys()) expect(first.get(path)).toEqual(second.get(path))

    const base = await importCasePackage(first.get('packages/valid-1.0.0.ldmcase')!, 'valid-1.0.0.ldmcase')
    const compatible = await importCasePackage(first.get('packages/valid-1.1.0.ldmcase')!, 'valid-1.1.0.ldmcase')
    const incompatible = await importCasePackage(first.get('packages/incompatible-2.0.0.ldmcase')!, 'incompatible-2.0.0.ldmcase')
    expect(base.caseDefinition.id).toBe('case-community-sample-001')
    expect(base.caseDefinition.clues).toHaveLength(6)
    expect(base.caseDefinition.questions.reduce((sum, question) => sum + question.points, 0)).toBe(100)
    expect(compatible.caseDefinition.clues.map((clue) => clue.id)).toContain('clue-handover')
    expect(incompatible.caseDefinition.clues.map((clue) => clue.id)).not.toContain('clue-handover')
  })
})
