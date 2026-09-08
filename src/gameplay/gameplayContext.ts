import type { DeductionResult, EvidenceRelation, GameSave } from '../cases/types'
import type { ConditionContext } from '../engine/conditionEngine'

export interface GameplaySaveState extends Pick<GameSave, 'completedEventKeys' | 'discoveredClueIds' | 'evidenceRelations' | 'triggeredEventIds'> {
  hintUsage?: Record<string, number>
}

export interface GameplayContext extends ConditionContext {
  result?: DeductionResult
  hintUsage: Record<string, number>
}

function relationKeys(relations: EvidenceRelation[]): Set<string> {
  const keys = new Set<string>()
  relations.forEach((relation) => {
    keys.add(`${relation.from}:${relation.to}:${relation.type}`)
    keys.add(`${relation.from}:${relation.to}:*`)
  })
  return keys
}

export function createGameplayContext(save: GameplaySaveState, result?: DeductionResult): GameplayContext {
  return {
    eventKeys: new Set(save.completedEventKeys),
    clueIds: new Set(save.discoveredClueIds),
    relationKeys: relationKeys(save.evidenceRelations),
    triggerIds: new Set(save.triggeredEventIds),
    hintUsage: save.hintUsage ?? {},
    result,
  }
}

