import { describe, expect, it } from 'vitest'
import { caseDefinition } from './case'
import { caseDefinitionSchema } from '../schema'
import { selectEnding } from '../../gameplay/endingEngine'
import { evaluateRewards } from '../../gameplay/rewardEngine'

describe('case 001', () => {
  it('contains twelve reachable clues', () => {
    expect(caseDefinition.clues.map(({ id }) => id)).toEqual(
      Array.from({ length: 12 }, (_, index) => `C${String(index + 1).padStart(2, '0')}`),
    )
    expect(caseDefinition.clues.every((clue) => clue.source && clue.discovery.type)).toBe(true)
  })

  it('keeps the canonical timeline sorted', () => {
    const times = caseDefinition.timeline.map((entry) => entry.time)
    expect(times).toEqual([...times].sort())
  })

  it('passes runtime validation', () => {
    expect(() => caseDefinitionSchema.parse(caseDefinition)).not.toThrow()
  })

  it('provides authored non-spoiler hints and a reachable mastery ending', () => {
    expect(caseDefinition.gameplay?.hints.length).toBeGreaterThanOrEqual(3)
    expect(caseDefinition.gameplay?.hints.every((hint) => caseDefinition.clues.some((clue) => clue.id === hint.clueId))).toBe(true)
    const ending = selectEnding(caseDefinition, {
      completedEventKeys: [],
      discoveredClueIds: caseDefinition.clues.map((clue) => clue.id),
      evidenceRelations: caseDefinition.correctContradictions.map(([from, to], index) => ({ id: `relation-${index}`, from, to, type: '相互矛盾' as const })),
      triggeredEventIds: caseDefinition.triggers.map((trigger) => trigger.id),
      hintUsage: {},
    }, { score: 100, level: '档案重建完成', answerScore: 65, evidenceScore: 30, relationScore: 5, note: '' })
    expect(ending.id).not.toBeNull()
    expect(ending.text).not.toBe(caseDefinition.ending)
  })

  it('awards its archive artifact and mastery theme after a complete independent investigation', () => {
    const save = {
      completedEventKeys: [],
      discoveredClueIds: caseDefinition.clues.map((clue) => clue.id),
      evidenceRelations: caseDefinition.correctContradictions.map(([from, to], index) => ({ id: `relation-${index}`, from, to, type: '相互矛盾' as const })),
      triggeredEventIds: caseDefinition.triggers.map((trigger) => trigger.id),
      hintUsage: {},
    }
    const rewards = evaluateRewards(caseDefinition, save, { score: 100, level: '档案重建完成', answerScore: 65, evidenceScore: 30, relationScore: 5, note: '' })

    expect(rewards.map((reward) => reward.id)).toEqual(expect.arrayContaining([
      'unused-boarding-pass',
      'independent-investigator',
      'departure-night-theme',
    ]))
  })
})
