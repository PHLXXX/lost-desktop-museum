import type { CaseDefinition } from './types'
import { caseDefinition as case001 } from './case-001/case'
import { caseDefinition as case002 } from './case-002/case'
import { builtInCaseIds } from './builtInIds'

const builtIns = new Map<string, CaseDefinition>([
  [case001.id, case001],
  [case002.id, case002],
])
const installed = new Map<string, CaseDefinition>()
const previews = new Map<string, CaseDefinition>()

export { builtInCaseIds }

export function listBuiltInCases(): CaseDefinition[] {
  return [...builtIns.values()]
}

export function listAvailableCases(): CaseDefinition[] { return [...builtIns.values(), ...installed.values()] }
export function registerInstalledCase(definition: CaseDefinition) {
  if (builtIns.has(definition.id)) throw new Error('不能覆盖内置案件。')
  installed.set(definition.id, definition)
}
export function unregisterInstalledCase(caseId: string) { installed.delete(caseId) }
export function clearInstalledCaseRegistry() { installed.clear() }
export function registerPreviewCase(definition: CaseDefinition) { previews.set(definition.id, definition) }
export function unregisterPreviewCase(caseId: string) { previews.delete(caseId) }

export function getCaseDefinition(caseId: string): CaseDefinition {
  const caseDefinition = builtIns.get(caseId) ?? installed.get(caseId) ?? previews.get(caseId)
  if (!caseDefinition) throw new Error(`Unknown case: ${caseId}`)
  return caseDefinition
}
