import { describe, expect, it } from 'vitest'
import { caseDefinition } from '../cases/case-001/case'
import type { DeductionResult } from '../cases/types'
import { createFreshSave } from '../engine/persistence'
import { evaluateChallenges } from './challengeEngine'

const result: DeductionResult = { score: 95, level: '完整还原', answerScore: 65, evidenceScore: 25, relationScore: 5, note: '' }

describe('challenge engine', () => {
  it('evaluates every supported requirement against final investigation state', () => {
    const definition = structuredClone(caseDefinition)
    definition.gameplay = {
      initialAnalysisPoints: 3,
      objectives: [{ id: 'objective-one', title: '基础目标', description: '记录第一条线索。', kind: 'primary', condition: { type: 'clue', clueId: 'C01' } }],
      hints: [], endingVariants: [],
      challenges: [
        { id: 'all', title: '全部线索', description: '完整。', requirements: [{ type: 'all-clues' }] },
        { id: 'solo', title: '无提示', description: '独立。', requirements: [{ type: 'no-hints' }] },
        { id: 'score', title: '高分', description: '准确。', requirements: [{ type: 'score-at-least', value: 90 }] },
        { id: 'relations', title: '关系', description: '矛盾。', requirements: [{ type: 'relation-count-at-least', value: 1 }] },
        { id: 'objective', title: '目标', description: '完成。', requirements: [{ type: 'objective', objectiveId: 'objective-one' }] },
      ],
    }
    const save = {
      ...createFreshSave(),
      discoveredClueIds: definition.clues.map((clue) => clue.id),
      evidenceRelations: [{ id: 'r1', from: definition.correctContradictions[0]![1], to: definition.correctContradictions[0]![0], type: '相互矛盾' as const }],
      hintUsage: {},
    }

    expect(evaluateChallenges(definition, save, result)).toEqual(['all', 'solo', 'score', 'relations', 'objective'])
  })

  it('does not award mastery before deduction or no-hint mastery after using help', () => {
    const definition = structuredClone(caseDefinition)
    definition.gameplay = {
      initialAnalysisPoints: 3,
      objectives: [],
      hints: [{
        id: 'used', clueId: 'C01', label: '未解记录',
        tiers: [
          { id: 'direction', label: '方向', text: '方向。', cost: 1 },
          { id: 'action', label: '操作', text: '操作。', cost: 1 },
          { id: 'location', label: '定位', text: '定位。', cost: 1 },
        ],
      }],
      endingVariants: [],
      challenges: [{ id: 'solo', title: '无提示', description: '独立。', requirements: [{ type: 'no-hints' }] }],
    }
    const save = { ...createFreshSave(), hintUsage: { used: 1 } }

    expect(evaluateChallenges(definition, save, undefined)).toEqual([])
    expect(evaluateChallenges(definition, save, result)).toEqual([])
  })
})
