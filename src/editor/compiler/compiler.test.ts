import { describe, expect, it } from 'vitest'
import { caseDefinition as case002 } from '../../cases/case-002/case'
import type { InvestigationGameplayDefinition } from '../../cases/types'
import { createBlankDraft, createMinimalTemplateDraft } from '../model/caseDraft'
import { compileCaseDraft } from './compileCaseDraft'
import { decompileCaseDefinition } from './decompileCaseDefinition'
import { deleteWithReferencePolicy, findReferences, renameStableId } from './referenceResolver'

describe('CaseDraft compiler boundary', () => {
  it('allows an incomplete blank draft but will not compile it', () => {
    const draft = createBlankDraft()
    expect(draft.manifest.title).toBeUndefined()
    const result = compileCaseDraft(draft)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.issues.some((issue) => issue.path.includes('manifest.title'))).toBe(true)
  })

  it('compiles the minimal playable template without mutating it', () => {
    const draft = createMinimalTemplateDraft()
    const before = structuredClone(draft)
    const result = compileCaseDraft(draft)
    expect(result.ok ? [] : result.issues).toEqual([])
    expect(draft).toEqual(before)
    if (result.ok) {
      expect(result.caseDefinition.clues).toHaveLength(6)
      expect(result.caseDefinition.questions.reduce((sum, question) => sum + question.points, 0)).toBe(100)
    }
  })

  it('reports missing and mismatched resource metadata when a storage inventory is supplied', () => {
    const draft = createMinimalTemplateDraft()
    const missing = compileCaseDraft(draft, [])
    expect(missing.ok ? [] : missing.issues.map((issue) => issue.code)).toContain('ASSET_MISSING')
    const ref = draft.assets[0]!
    const mismatched = compileCaseDraft(draft, [{ id: ref.id, mime: ref.mime, size: ref.size + 1, sha256: ref.sha256 }])
    expect(mismatched.ok ? [] : mismatched.issues.map((issue) => issue.code)).toContain('ASSET_INTEGRITY')
  })

  it('decompiles and recompiles without losing core case data', () => {
    const draft = decompileCaseDefinition(case002)
    const result = compileCaseDraft(draft)
    expect(result.ok ? [] : result.issues).toEqual([])
    if (result.ok) {
      expect(result.caseDefinition.files).toEqual(case002.files)
      expect(result.caseDefinition.chats).toEqual(case002.chats)
      expect(result.caseDefinition.triggers).toEqual(case002.triggers)
      expect(result.caseDefinition.questions).toEqual(case002.questions)
    }
  })

  it('preserves an authored gameplay block through compilation and decompilation', () => {
    const draft = createMinimalTemplateDraft()
    const gameplay = {
      initialAnalysisPoints: 4,
      objectives: [{ id: 'trace-access', title: '核对门禁', description: '确认门禁与交接时间。', kind: 'primary', condition: { type: 'clue-count', count: 3 } }],
      hints: [{ id: 'access-hint', clueId: 'clue-access', label: '门禁记录', tiers: [
        { id: 'direction', label: '方向', text: '留意出入记录。', cost: 1 },
        { id: 'action', label: '操作', text: '打开门禁邮件。', cost: 1 },
        { id: 'location', label: '定位', text: '检查办公室临时通行记录。', cost: 2 },
      ] }],
      challenges: [{ id: 'precise-score', title: '精确归档', description: '可信度达到九十分。', requirements: [{ type: 'score-at-least', value: 90 }] }],
      endingVariants: [{ id: 'complete-note', title: '完整记录', text: '每个时间节点都已闭合。', priority: 20, requirements: [{ type: 'all-clues' }] }],
    } satisfies InvestigationGameplayDefinition
    draft.gameplay = gameplay

    const compiled = compileCaseDraft(draft)

    expect(compiled.ok).toBe(true)
    if (!compiled.ok) return
    expect(compiled.caseDefinition.gameplay).toEqual(gameplay)
    expect(decompileCaseDefinition(compiled.caseDefinition).gameplay).toEqual(gameplay)
    expect(draft.gameplay).toEqual(gameplay)
  })

  it('keeps legacy drafts free of an authored gameplay block', () => {
    const draft = createMinimalTemplateDraft()
    expect(draft.gameplay).toBeUndefined()
    const compiled = compileCaseDraft(draft)
    expect(compiled.ok).toBe(true)
    if (compiled.ok) expect(compiled.caseDefinition.gameplay).toBeUndefined()
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
