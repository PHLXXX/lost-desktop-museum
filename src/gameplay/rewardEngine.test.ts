import { describe, expect, it } from 'vitest'
import { caseDefinition } from '../cases/case-001/case'
import type { DeductionResult } from '../cases/types'
import { createFreshSave } from '../engine/persistence'
import { evaluateRewards, resolveInvestigationRewards } from './rewardEngine'

const result: DeductionResult = {
  score: 95,
  level: '完整重建',
  answerScore: 65,
  evidenceScore: 25,
  relationScore: 5,
  note: '',
}

describe('completion reward engine', () => {
  it('does not award anything before deduction is complete', () => {
    expect(evaluateRewards(caseDefinition, createFreshSave(caseDefinition.id), undefined)).toEqual([])
  })

  it('awards completion and mastery rewards whose requirements are met', () => {
    const definition = structuredClone(caseDefinition)
    definition.gameplay = {
      ...definition.gameplay!,
      rewards: [
        { id: 'case-complete', kind: 'artifact', title: '结案藏品', description: '完成一次推理。', requirements: [] },
        { id: 'master-theme', kind: 'theme', title: '专精主题', description: '独立完成高可信推理。', themeId: 'departure-night', requirements: [{ type: 'score-at-least', value: 90 }, { type: 'no-hints' }] },
      ],
    }
    const save = { ...createFreshSave(definition.id), discoveredClueIds: definition.clues.map((clue) => clue.id), hintUsage: {} }

    expect(evaluateRewards(definition, save, result).map((reward) => reward.id)).toEqual(['case-complete', 'master-theme'])
    expect(evaluateRewards(definition, { ...save, hintUsage: { [definition.gameplay!.hints[0]!.id]: 1 } }, result).map((reward) => reward.id)).toEqual(['case-complete'])
  })

  it('provides deterministic rewards for a legacy case', () => {
    const legacy = structuredClone(caseDefinition)
    delete legacy.gameplay

    expect(resolveInvestigationRewards(legacy).map((reward) => reward.id)).toEqual([
      'default-case-archive',
      'default-complete-record',
    ])
  })
})
