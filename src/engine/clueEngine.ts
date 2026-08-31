import type { CaseDefinition, InvestigationAction } from '../cases/types'
import { evaluateCondition, eventKey } from './conditionEngine'

export function discoverClues(caseDefinition: CaseDefinition, action: InvestigationAction, discoveredIds: string[], completedEventKeys: string[] = []): string[] {
  const discovered = new Set(discoveredIds)
  const events = new Set([...completedEventKeys, eventKey(action.type, action.itemId)])
  return caseDefinition.clues.filter((clue) => !discovered.has(clue.id) && evaluateCondition(clue.condition, { eventKeys: events, clueIds: discovered, relationKeys: new Set(), triggerIds: new Set() })).map((clue) => clue.id)
}

export function verifyItemPassword(caseDefinition: CaseDefinition, itemId: string, password: string): boolean {
  return caseDefinition.files.find((file) => file.id === itemId)?.password === password
}
