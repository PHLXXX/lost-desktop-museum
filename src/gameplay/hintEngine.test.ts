import { describe, expect, it } from 'vitest'
import { caseDefinition } from '../cases/case-001/case'
import { createFreshSave } from '../engine/persistence'
import { getHintState, revealNextHint } from './hintEngine'

const definition = (() => {
  const value = structuredClone(caseDefinition)
  value.gameplay = {
    initialAnalysisPoints: 3,
    objectives: [], challenges: [], endingVariants: [],
    hints: [{
      id: 'flight-hint', clueId: 'C01', label: '未解记录 01',
      tiers: [
        { id: 'direction', label: '调查方向', text: '留意出行信息。', cost: 1 },
        { id: 'action', label: '操作建议', text: '阅读完整邮件。', cost: 1 },
        { id: 'location', label: '精确定位', text: '打开航班取消邮件。', cost: 1 },
      ],
    }],
  }
  return value
})()

describe('hint engine', () => {
  it('reveals exactly the next tier and accounts for points without mutating input', () => {
    const save = { ...createFreshSave(), hintUsage: {} }
    const first = revealNextHint(definition, save, 'flight-hint')

    expect(first).toMatchObject({ ok: true, tier: { id: 'direction' }, remainingPoints: 2 })
    expect(save.hintUsage).toEqual({})
    if (!first.ok) throw new Error('expected the first hint to succeed')
    const second = revealNextHint(definition, { ...save, hintUsage: first.hintUsage }, 'flight-hint')
    expect(second).toMatchObject({ ok: true, tier: { id: 'action' }, remainingPoints: 1 })
  })

  it('reports all revealed tiers and ignores unknown saved hint ids', () => {
    const state = getHintState(definition, { ...createFreshSave(), hintUsage: { 'flight-hint': 2, removed: 99 } })

    expect(state.usedPoints).toBe(2)
    expect(state.remainingPoints).toBe(1)
    expect(state.hints[0]).toMatchObject({ revealedCount: 2 })
    expect(state.hints[0]?.revealedTiers.map((tier) => tier.id)).toEqual(['direction', 'action'])
  })

  it('rejects hints for completed clues and fully revealed hints', () => {
    expect(revealNextHint(definition, { ...createFreshSave(), discoveredClueIds: ['C01'], hintUsage: {} }, 'flight-hint')).toMatchObject({ ok: false, code: 'clue-complete' })
    expect(revealNextHint(definition, { ...createFreshSave(), hintUsage: { 'flight-hint': 3 } }, 'flight-hint')).toMatchObject({ ok: false, code: 'fully-revealed' })
  })

  it('does not spend when the next tier costs more than the remaining points', () => {
    const expensive = structuredClone(definition)
    expensive.gameplay!.initialAnalysisPoints = 1
    expensive.gameplay!.hints[0]!.tiers[0]!.cost = 2

    expect(revealNextHint(expensive, { ...createFreshSave(), hintUsage: {} }, 'flight-hint')).toMatchObject({ ok: false, code: 'insufficient-points', remainingPoints: 1 })
  })
})

