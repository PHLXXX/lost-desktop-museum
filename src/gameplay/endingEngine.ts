import type { CaseDefinition, DeductionResult } from '../cases/types'
import { meetsGameplayRequirements } from './challengeEngine'
import { resolveInvestigationGameplay } from './defaultGameplay'
import type { GameplaySaveState } from './gameplayContext'

export interface SelectedEnding { id: string | null; title: string; text: string }

export function selectEnding(definition: CaseDefinition, save: GameplaySaveState, result: DeductionResult): SelectedEnding {
  const selected = [...resolveInvestigationGameplay(definition).endingVariants]
    .filter((ending) => meetsGameplayRequirements(definition, save, result, ending.requirements))
    .sort((a, b) => b.priority - a.priority || a.id.localeCompare(b.id))[0]
  return selected
    ? { id: selected.id, title: selected.title, text: selected.text }
    : { id: null, title: '档案结论', text: definition.ending }
}

