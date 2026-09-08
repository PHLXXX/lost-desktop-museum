export const builtInCaseIds = ['case-001', 'case-002', 'case-003'] as const
export function isBuiltInCaseId(caseId: string) { return builtInCaseIds.some((builtInId) => builtInId === caseId) }
