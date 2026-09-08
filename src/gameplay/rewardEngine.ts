import type { CaseDefinition, DeductionResult, InvestigationRewardDefinition } from '../cases/types'
import { meetsGameplayRequirements } from './challengeEngine'
import { createDefaultInvestigationRewards } from './defaultGameplay'
import type { GameplaySaveState } from './gameplayContext'

export function resolveInvestigationRewards(definition: CaseDefinition): InvestigationRewardDefinition[] {
  return definition.gameplay?.rewards ?? createDefaultInvestigationRewards(definition)
}

export function evaluateRewards(
  definition: CaseDefinition,
  save: GameplaySaveState,
  result: DeductionResult | undefined,
): InvestigationRewardDefinition[] {
  if (!result) return []
  return resolveInvestigationRewards(definition)
    .filter((reward) => meetsGameplayRequirements(definition, save, result, reward.requirements))
}
