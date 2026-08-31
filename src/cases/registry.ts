import type { CaseDefinition } from './types'
import { caseDefinition as case001 } from './case-001/case'
import { caseDefinition as case002 } from './case-002/case'

const builtIns = new Map<string, CaseDefinition>([
  [case001.id, case001],
  [case002.id, case002],
])

export const builtInCaseIds = [...builtIns.keys()]

export function listBuiltInCases(): CaseDefinition[] {
  return [...builtIns.values()]
}

export function getCaseDefinition(caseId: string): CaseDefinition {
  const caseDefinition = builtIns.get(caseId)
  if (!caseDefinition) throw new Error(`Unknown case: ${caseId}`)
  return caseDefinition
}

