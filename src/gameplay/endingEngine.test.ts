import { describe, expect, it } from 'vitest'
import { caseDefinition } from '../cases/case-001/case'
import type { DeductionResult } from '../cases/types'
import { createFreshSave } from '../engine/persistence'
import { selectEnding } from './endingEngine'

const result: DeductionResult = { score: 96, level: '完整还原', answerScore: 65, evidenceScore: 26, relationScore: 5, note: '' }

describe('ending engine', () => {
  it('selects the highest priority eligible ending and uses stable id ordering for ties', () => {
    const definition = structuredClone(caseDefinition)
    definition.gameplay = {
      initialAnalysisPoints: 3, objectives: [], hints: [], challenges: [],
      endingVariants: [
        { id: 'z-ending', title: '后记 Z', text: 'Z', priority: 10, requirements: [{ type: 'score-at-least', value: 90 }] },
        { id: 'a-ending', title: '后记 A', text: 'A', priority: 10, requirements: [{ type: 'score-at-least', value: 90 }] },
        { id: 'low-ending', title: '普通后记', text: '低优先级', priority: 1, requirements: [{ type: 'score-at-least', value: 50 }] },
      ],
    }

    expect(selectEnding(definition, { ...createFreshSave(), hintUsage: {} }, result)).toEqual({ id: 'a-ending', title: '后记 A', text: 'A' })
  })

  it('falls back to the canonical case ending', () => {
    expect(selectEnding(caseDefinition, { ...createFreshSave(), hintUsage: {} }, result)).toEqual({ id: null, title: '档案结论', text: caseDefinition.ending })
  })
})

