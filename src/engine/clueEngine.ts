import type { CaseDefinition, InvestigationAction } from '../cases/types'

export function discoverClues(caseDefinition: CaseDefinition, action: InvestigationAction, discoveredIds: string[]): string[] {
  const discovered = new Set(discoveredIds)
  return caseDefinition.clues.filter((clue) => clue.discovery.type === action.type && clue.discovery.itemId === action.itemId && !discovered.has(clue.id)).map((clue) => clue.id)
}

export function verifyItemPassword(caseDefinition: CaseDefinition, itemId: string, password: string): boolean {
  return caseDefinition.files.find((file) => file.id === itemId)?.password === password
}

