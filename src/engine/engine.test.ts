import { describe, expect, it } from 'vitest'
import { caseDefinition } from '../cases/case-001/case'
import { discoverClues, verifyItemPassword } from './clueEngine'
import { evaluateTriggers } from './triggerEngine'
import { scoreDeduction } from './scoringEngine'

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
})
