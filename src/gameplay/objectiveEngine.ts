import type { CaseDefinition, InvestigationObjectiveDefinition } from '../cases/types'
import { evaluateCondition } from '../engine/conditionEngine'
import { createDefaultInvestigationGameplay, resolveInvestigationGameplay } from './defaultGameplay'
import { createGameplayContext, type GameplaySaveState } from './gameplayContext'

export interface ObjectiveState extends InvestigationObjectiveDefinition {
  visible: boolean
  complete: boolean
}

function evaluateObjectives(definition: CaseDefinition, save: GameplaySaveState, objectives: InvestigationObjectiveDefinition[]): ObjectiveState[] {
  const context = createGameplayContext(save)
  return objectives.map((objective) => ({
    ...objective,
    visible: objective.revealWhen ? evaluateCondition(objective.revealWhen, context) : true,
    complete: evaluateCondition(objective.condition, context),
  }))
}

export function getObjectiveStates(definition: CaseDefinition, save: GameplaySaveState): ObjectiveState[] {
  const states = evaluateObjectives(definition, save, resolveInvestigationGameplay(definition).objectives)
  if (states.some((state) => state.visible)) return states
  const fallback = createDefaultInvestigationGameplay(definition).objectives.find((objective) => objective.kind === 'primary')
  return fallback ? evaluateObjectives(definition, save, [fallback]) : []
}

