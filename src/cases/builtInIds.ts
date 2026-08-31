export const builtInCaseIds = ['case-001', 'case-002'] as const
export function isBuiltInCaseId(caseId: string) { return builtInCaseIds.some((builtInId) => builtInId === caseId) }
