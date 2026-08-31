import type { CaseCondition } from '../../cases/types'
import type { CaseDraft } from '../model/caseDraft'
import type { ValidationIssue } from '../../engine/validation'

export function conditionMetrics(condition: CaseCondition): { depth: number; nodes: number } {
  if (condition.type !== 'all' && condition.type !== 'any') return { depth: 1, nodes: 1 }
  const children = condition.conditions.map(conditionMetrics)
  return { depth: 1 + Math.max(0, ...children.map((child) => child.depth)), nodes: 1 + children.reduce((sum, child) => sum + child.nodes, 0) }
}

function clueDependencies(condition: CaseCondition): string[] {
  if (condition.type === 'clue') return [condition.clueId]
  if (condition.type === 'all' || condition.type === 'any') return condition.conditions.flatMap(clueDependencies)
  return []
}

export function analyzeDraftDependencies(draft: CaseDraft): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  const clueIds = new Set(draft.clues.map((clue) => clue.id))
  const itemIds = new Set([...draft.files.map((item) => item.id), ...draft.emails.map((item) => item.id), ...draft.chats.flatMap((thread) => thread.messages.map((item) => item.id)), ...draft.calendarEvents.map((item) => item.id), ...draft.systemLogs.map((item) => item.id), ...draft.browserHistory.map((item) => item.id), ...draft.photos.map((item) => item.id)])
  for (const clue of draft.clues) {
    const metrics = conditionMetrics(clue.condition)
    if (metrics.depth > 5 || metrics.nodes > 30) issues.push({ id: `condition-limit-${clue.id}`, severity: 'error', category: 'reachability', code: 'CONDITION_LIMIT', message: '条件树最多5层、30个节点。', path: `clues.${clue.id}.condition`, entityId: clue.id })
    if (clue.condition.type === 'event' && !itemIds.has(clue.condition.targetId)) issues.push({ id: `condition-target-${clue.id}`, severity: 'error', category: 'reference', code: 'MISSING_EVENT_TARGET', message: `事件目标 ${clue.condition.targetId} 不存在。`, path: `clues.${clue.id}.condition.targetId`, entityId: clue.id })
    clueDependencies(clue.condition).forEach((dependency) => { if (!clueIds.has(dependency)) issues.push({ id: `clue-dependency-${clue.id}-${dependency}`, severity: 'error', category: 'reference', code: 'MISSING_CLUE_DEPENDENCY', message: `前置线索 ${dependency} 不存在。`, path: `clues.${clue.id}.condition`, entityId: clue.id }) })
  }
  const graph = new Map(draft.clues.map((clue) => [clue.id, clueDependencies(clue.condition)]))
  const visiting = new Set<string>(); const visited = new Set<string>()
  const visit = (id: string): boolean => { if (visiting.has(id)) return true; if (visited.has(id)) return false; visiting.add(id); const cyclic = (graph.get(id) ?? []).some(visit); visiting.delete(id); visited.add(id); return cyclic }
  graph.forEach((_value, id) => { if (visit(id) && !issues.some((issue) => issue.code === 'CLUE_CYCLE')) issues.push({ id: 'clue-cycle', severity: 'error', category: 'reachability', code: 'CLUE_CYCLE', message: '线索依赖存在循环，玩家无法从起点发现这些线索。', path: 'clues' }) })
  return issues
}

