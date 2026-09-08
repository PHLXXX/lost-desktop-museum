import { describe, expect, it } from 'vitest'
import { caseDefinition } from '../cases/case-001/case'
import { validateGameplayDefinition } from './gameplayValidation'

describe('gameplay reward validation', () => {
  it('reports duplicate reward ids and missing objective references', () => {
    const definition = structuredClone(caseDefinition)
    definition.gameplay = {
      ...definition.gameplay!,
      rewards: [
        { id: 'duplicate-reward', kind: 'artifact', title: '记录一', description: '第一项。', requirements: [] },
        { id: 'duplicate-reward', kind: 'badge', title: '记录二', description: '第二项。', requirements: [{ type: 'objective', objectiveId: 'missing-objective' }] },
      ],
    }

    expect(validateGameplayDefinition(definition)).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'DUPLICATE_GAMEPLAY_ID', path: 'gameplay.rewards.1.id' }),
      expect.objectContaining({ code: 'MISSING_GAMEPLAY_OBJECTIVE', path: 'gameplay.rewards.1.requirements.0.objectiveId' }),
    ]))
  })
})
