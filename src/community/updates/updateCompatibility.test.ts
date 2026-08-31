import { describe, expect, it } from 'vitest'
import { createFreshSave } from '../../engine/persistence'
import { compileCaseDraft } from '../../editor/compiler/compileCaseDraft'
import { createMinimalTemplateDraft } from '../../editor/model/caseDraft'
import { analyzeUpdateCompatibility } from './updateCompatibility'

function definition(removeClue = false) {
  const draft = createMinimalTemplateDraft(); draft.manifest.caseId = 'case-community-sample-001'; draft.manifest.author = 'ldm-team'; draft.assets = []; delete draft.desktop.wallpaperAssetId
  if (removeClue) { draft.clues = draft.clues.filter((clue) => clue.id !== 'clue-handover'); draft.deduction.coreEvidenceIds = draft.clues.map((clue) => clue.id) }
  const result = compileCaseDraft(draft, []); if (!result.ok) throw new Error('fixture failed')
  return result.caseDefinition
}
describe('community update compatibility', () => {
  it('keeps progress when all referenced IDs remain', () => {
    const save = { ...createFreshSave('case-community-sample-001'), discoveredClueIds: ['clue-handover'] }
    expect(analyzeUpdateCompatibility(save, definition(), 'compatible').status).toBe('compatible')
  })
  it('reports removed progress and never silently treats it as compatible', () => {
    const save = { ...createFreshSave('case-community-sample-001'), discoveredClueIds: ['clue-handover'], pinnedClueIds: ['clue-handover'] }
    const result = analyzeUpdateCompatibility(save, definition(true), 'compatible')
    expect(result.status).toBe('review-required')
    expect('affectedProgress' in result && result.affectedProgress.some((item) => item.id === 'clue-handover')).toBe(true)
  })
  it('honors an explicit incompatible declaration', () => {
    expect(analyzeUpdateCompatibility(createFreshSave('case-community-sample-001'), definition(), 'incompatible').status).toBe('incompatible')
  })
  it('requires review when the installed version is outside the author compatibility list', () => {
    const result = analyzeUpdateCompatibility(createFreshSave('case-community-sample-001'), definition(), { mode: 'compatible', compatibleFromVersions: ['1.1.0'] }, '1.0.0')
    expect(result.status).toBe('review-required')
  })
})
