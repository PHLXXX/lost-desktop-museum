import { describe, expect, it } from 'vitest'
import { caseDefinition } from '../cases/case-001/case'
import { createFreshSave } from '../engine/persistence'
import { getObjectiveStates } from './objectiveEngine'

describe('objective engine', () => {
  it('evaluates nested completion and reveal conditions from saved investigation state', () => {
    const definition = structuredClone(caseDefinition)
    definition.gameplay = {
      initialAnalysisPoints: 3,
      objectives: [
        {
          id: 'timeline-base', title: '核对基础时间线', description: '完成基础记录核对。', kind: 'primary',
          condition: { type: 'all', conditions: [{ type: 'event', eventType: 'OPEN_ITEM', targetId: 'flight-cancel' }, { type: 'clue', clueId: 'C01' }] },
        },
        {
          id: 'hidden-relation', title: '建立隐藏关系', description: '验证两条记录的冲突。', kind: 'optional',
          revealWhen: { type: 'clue', clueId: 'C01' },
          condition: { type: 'relation', from: 'C01', to: 'C02', relationType: '相互矛盾' },
        },
      ],
      hints: [], challenges: [], endingVariants: [],
    }
    const save = {
      ...createFreshSave(),
      completedEventKeys: ['OPEN_ITEM:flight-cancel'],
      discoveredClueIds: ['C01'],
      evidenceRelations: [{ id: 'r1', from: 'C02', to: 'C01', type: '相互矛盾' as const }],
    }

    expect(getObjectiveStates(definition, save)).toEqual([
      expect.objectContaining({ id: 'timeline-base', visible: true, complete: true }),
      expect.objectContaining({ id: 'hidden-relation', visible: true, complete: true }),
    ])
  })

  it('keeps an optional objective hidden until its reveal condition is met', () => {
    const definition = structuredClone(caseDefinition)
    definition.gameplay = {
      initialAnalysisPoints: 3,
      objectives: [
        { id: 'visible-objective', title: '基础核对', description: '先记录一条线索。', kind: 'primary', condition: { type: 'clue', clueId: 'C01' } },
        {
          id: 'hidden-objective', title: '后续核对', description: '继续调查。', kind: 'optional',
          revealWhen: { type: 'clue', clueId: 'C01' }, condition: { type: 'clue', clueId: 'C02' },
        },
      ],
      hints: [], challenges: [], endingVariants: [],
    }

    expect(getObjectiveStates(definition, createFreshSave())[1]).toMatchObject({ visible: false, complete: false })
  })

  it('falls back to one visible primary objective when authored objectives are empty', () => {
    const definition = structuredClone(caseDefinition)
    definition.gameplay = { initialAnalysisPoints: 3, objectives: [], hints: [], challenges: [], endingVariants: [] }

    const states = getObjectiveStates(definition, createFreshSave())
    expect(states).toHaveLength(1)
    expect(states[0]).toMatchObject({ kind: 'primary', visible: true })
  })
})
