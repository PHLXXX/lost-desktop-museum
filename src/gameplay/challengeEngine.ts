import type { CaseDefinition, DeductionResult, GameplayRequirement } from '../cases/types'
import { resolveInvestigationGameplay } from './defaultGameplay'
import type { GameplaySaveState } from './gameplayContext'
import { getObjectiveStates } from './objectiveEngine'

function samePair(from: string, to: string, expected: [string, string]): boolean {
  return (from === expected[0] && to === expected[1]) || (from === expected[1] && to === expected[0])
}

function correctRelationCount(definition: CaseDefinition, save: GameplaySaveState): number {
  return definition.correctContradictions.filter((expected) => save.evidenceRelations.some((relation) => relation.type === '相互矛盾' && samePair(relation.from, relation.to, expected))).length
}

export function meetsGameplayRequirements(
  definition: CaseDefinition,
  save: GameplaySaveState,
  result: DeductionResult | undefined,
  requirements: GameplayRequirement[],
): boolean {
  const gameplay = resolveInvestigationGameplay(definition)
  const hintIds = new Set(gameplay.hints.map((hint) => hint.id))
  const hintsUsed = Object.entries(save.hintUsage ?? {}).some(([id, count]) => hintIds.has(id) && count > 0)
  const objectiveStates = getObjectiveStates(definition, save)
  return requirements.every((requirement) => {
    switch (requirement.type) {
      case 'all-clues': return new Set(save.discoveredClueIds).size >= definition.clues.length
      case 'no-hints': return Boolean(result) && !hintsUsed
      case 'score-at-least': return Boolean(result && result.score >= requirement.value)
      case 'relation-count-at-least': return correctRelationCount(definition, save) >= requirement.value
      case 'objective': return objectiveStates.some((objective) => objective.id === requirement.objectiveId && objective.complete)
    }
  })
}

export function evaluateChallenges(definition: CaseDefinition, save: GameplaySaveState, result?: DeductionResult): string[] {
  if (!result) return []
  return resolveInvestigationGameplay(definition).challenges
    .filter((challenge) => meetsGameplayRequirements(definition, save, result, challenge.requirements))
    .map((challenge) => challenge.id)
}

