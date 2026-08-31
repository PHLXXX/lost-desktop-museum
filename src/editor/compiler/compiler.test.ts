import { describe, expect, it } from 'vitest'
import { caseDefinition as case002 } from '../../cases/case-002/case'
import { createBlankDraft, createMinimalTemplateDraft } from '../model/caseDraft'
import { compileCaseDraft } from './compileCaseDraft'
import { decompileCaseDefinition } from './decompileCaseDefinition'
import { deleteWithReferencePolicy, findReferences, renameStableId } from './referenceResolver'

describe('CaseDraft compiler boundary', () => {
  it('allows an incomplete blank draft but will not compile it', () => {
    const draft = createBlankDraft()
    expect(draft.manifest.title).toBeUndefined()
    const result = compileCaseDraft(draft, [])
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.issues.some((issue) => issue.path.includes('manifest.title'))).toBe(true)
  })

  it('compiles the minimal playable template without mutating it', () => {
    const draft = createMinimalTemplateDraft()
    const before = structuredClone(draft)
    const result = compileCaseDraft(draft, [])
    expect(result.ok ? [] : result.issues).toEqual([])
    expect(draft).toEqual(before)
    if (result.ok) {
      expect(result.caseDefinition.clues).toHaveLength(6)
      expect(result.caseDefinition.questions.reduce((sum, question) => sum + question.points, 0)).toBe(100)
    }
  })

  it('decompiles and recompiles without losing core case data', () => {
    const draft = decompileCaseDefinition(case002)
    const result = compileCaseDraft(draft, [])
    expect(result.ok ? [] : result.issues).toEqual([])
    if (result.ok) {
      expect(result.caseDefinition.files).toEqual(case002.files)
      expect(result.caseDefinition.chats).toEqual(case002.chats)
      expect(result.caseDefinition.triggers).toEqual(case002.triggers)
      expect(result.caseDefinition.questions).toEqual(case002.questions)
    }
  })

  it('keeps stable ids when titles change and atomically renames references', () => {
    const draft = createMinimalTemplateDraft()
    const entityId = draft.entities[0]!.id
    draft.entities[0]!.name = '新的主人称呼'
    expect(draft.entities[0]!.id).toBe(entityId)
    draft.clues[0]!.people = [entityId]
    const renamed = renameStableId(draft, entityId, 'person-new-owner')
    expect(renamed.ok).toBe(true)
    expect(renamed.draft.entities[0]!.id).toBe('person-new-owner')
    expect(renamed.draft.clues[0]!.people).toEqual(['person-new-owner'])
  })

  it('reports references and blocks unsafe deletion', () => {
    const draft = createMinimalTemplateDraft()
    const target = draft.files[0]!.id
    expect(findReferences(draft, target).length).toBeGreaterThan(0)
    const blocked = deleteWithReferencePolicy(draft, target, 'block')
    expect(blocked.ok).toBe(false)
    expect(blocked.references.length).toBeGreaterThan(0)
  })
})
