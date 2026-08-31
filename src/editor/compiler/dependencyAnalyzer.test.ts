import { describe, expect, it } from 'vitest'
import type { CaseCondition } from '../../cases/types'
import { createMinimalTemplateDraft } from '../model/caseDraft'
import { analyzeDraftDependencies, conditionMetrics } from './dependencyAnalyzer'

describe('condition and dependency analysis', () => {
  it('serializes event, all and any conditions without executable content', () => {
    const condition: CaseCondition = { type: 'all', conditions: [{ type: 'event', eventType: 'OPEN_ITEM', targetId: 'file-a' }, { type: 'any', conditions: [{ type: 'clue-count', count: 2 }, { type: 'clue', clueId: 'clue-a' }] }] }
    expect(JSON.parse(JSON.stringify(condition))).toEqual(condition)
    expect(conditionMetrics(condition)).toEqual({ depth: 3, nodes: 5 })
  })

  it('rejects excessive nesting, missing targets and cyclic clue dependencies', () => {
    const draft = createMinimalTemplateDraft()
    let deep: CaseCondition = { type: 'event', eventType: 'OPEN_ITEM', targetId: 'missing-file' }
    for (let index = 0; index < 6; index++) deep = { type: 'all', conditions: [deep] }
    draft.clues[0]!.condition = deep
    draft.clues[1]!.condition = { type: 'clue', clueId: draft.clues[2]!.id }
    draft.clues[2]!.condition = { type: 'clue', clueId: draft.clues[1]!.id }
    const issues = analyzeDraftDependencies(draft)
    expect(issues.some((issue) => issue.code === 'CONDITION_LIMIT')).toBe(true)
    expect(issues.some((issue) => issue.code === 'CLUE_CYCLE')).toBe(true)
  })
})
