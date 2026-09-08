import { describe, expect, it } from 'vitest'
import { caseDefinition } from '../cases/case-001/case'
import { discoverClues, verifyItemPassword } from './clueEngine'
import { evaluateTriggers } from './triggerEngine'
import { scoreDeduction } from './scoringEngine'
import { validateCaseDefinition } from './validation'
import type { InvestigationGameplayDefinition } from '../cases/types'

function validGameplay(): InvestigationGameplayDefinition {
  return {
    initialAnalysisPoints: 3,
    objectives: [{ id: 'trace-records', title: '核对记录', description: '核对三项记录。', kind: 'primary', condition: { type: 'clue-count', count: 3 } }],
    hints: [{ id: 'flight-hint', clueId: 'C01', label: '行程状态', tiers: [
      { id: 'direction', label: '方向', text: '留意出行记录。', cost: 1 },
      { id: 'action', label: '操作', text: '打开相关邮件。', cost: 1 },
      { id: 'location', label: '定位', text: '检查订单状态。', cost: 1 },
    ] }],
    challenges: [{ id: 'objective-check', title: '完成核对', description: '完成指定目标。', requirements: [{ type: 'objective', objectiveId: 'trace-records' }] }],
    endingVariants: [],
  }
}

describe('case engine', () => {
  it('only discovers photo metadata after the explicit action', () => {
    expect(discoverClues(caseDefinition, { type: 'OPEN_ITEM', itemId: 'photo-sent' }, [])).not.toContain('C03')
    expect(discoverClues(caseDefinition, { type: 'VIEW_METADATA', itemId: 'photo-sent' }, [])).toContain('C03')
  })

  it('validates the mirror password', () => {
    expect(verifyItemPassword(caseDefinition, 'mirror.lock', '1119')).toBe(true)
    expect(verifyItemPassword(caseDefinition, 'mirror.lock', '1118')).toBe(false)
  })

  it('does not repeat a one-shot trigger', () => {
    const first = evaluateTriggers(caseDefinition, ['C01', 'C02', 'C03'], [])
    expect(first.map((effect) => effect.id)).toContain('event-three-clues')
    expect(evaluateTriggers(caseDefinition, ['C01', 'C02', 'C03'], ['event-three-clues'])).toEqual([])
  })

  it('scores the canonical deduction at 100', () => {
    const result = scoreDeduction(caseDefinition, {
      answers: ['fabricated-departure', 'home', 'new-identity'],
      evidenceIds: ['C01', 'C02', 'C03', 'C05', 'C08', 'C09'],
      contradictionPairs: [['C01', 'C02'], ['C03', 'C04']],
      note: '本地推理',
    })
    expect(result.score).toBe(100)
    expect(result.level).toBe('档案重建完成')
  })

  it('reports duplicate and missing gameplay references with actionable paths', () => {
    const definition = structuredClone(caseDefinition)
    definition.gameplay = validGameplay()
    definition.gameplay.objectives.push({ ...structuredClone(definition.gameplay.objectives[0]!), title: '重复目标' })
    definition.gameplay.hints[0]!.clueId = 'missing-clue'
    definition.gameplay.challenges[0]!.requirements = [{ type: 'objective', objectiveId: 'missing-objective' }]

    const issues = validateCaseDefinition(definition)

    expect(issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'DUPLICATE_GAMEPLAY_ID', path: 'gameplay.objectives.1.id' }),
      expect.objectContaining({ code: 'MISSING_GAMEPLAY_CLUE', path: 'gameplay.hints.0.clueId' }),
      expect.objectContaining({ code: 'MISSING_GAMEPLAY_OBJECTIVE', path: 'gameplay.challenges.0.requirements.0.objectiveId' }),
    ]))
  })

  it('rejects objectives and first hint tiers that can never be reached', () => {
    const definition = structuredClone(caseDefinition)
    definition.gameplay = validGameplay()
    definition.gameplay.initialAnalysisPoints = 1
    definition.gameplay.objectives[0]!.condition = { type: 'clue-count', count: 99 }
    definition.gameplay.hints[0]!.tiers[0].cost = 2

    const issues = validateCaseDefinition(definition)

    expect(issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'UNREACHABLE_GAMEPLAY_CONDITION', path: 'gameplay.objectives.0.condition' }),
      expect.objectContaining({ code: 'UNREACHABLE_HINT_COST', path: 'gameplay.hints.0.tiers.0.cost' }),
    ]))
  })
})
