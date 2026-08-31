import type { CaseCondition } from '../cases/types'

export interface ConditionContext {
  eventKeys: ReadonlySet<string>
  clueIds: ReadonlySet<string>
  relationKeys: ReadonlySet<string>
  triggerIds: ReadonlySet<string>
}

export function eventKey(eventType: string, targetId: string): string {
  return `${eventType}:${targetId}`
}

export function evaluateCondition(condition: CaseCondition, context: ConditionContext): boolean {
  switch (condition.type) {
    case 'event': return context.eventKeys.has(eventKey(condition.eventType, condition.targetId))
    case 'all': return condition.conditions.length > 0 && condition.conditions.every((child) => evaluateCondition(child, context))
    case 'any': return condition.conditions.some((child) => evaluateCondition(child, context))
    case 'clue': return context.clueIds.has(condition.clueId)
    case 'clue-count': return context.clueIds.size >= condition.count
    case 'relation': {
      const direct = `${condition.from}:${condition.to}:${condition.relationType ?? '*'}`
      const reverse = `${condition.to}:${condition.from}:${condition.relationType ?? '*'}`
      return context.relationKeys.has(direct) || context.relationKeys.has(reverse)
    }
    case 'trigger': return context.triggerIds.has(condition.triggerId)
  }
}

