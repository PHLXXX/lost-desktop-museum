import type { CaseDefinition, TriggerEffect } from '../cases/types'

export function evaluateTriggers(caseDefinition: CaseDefinition, clueIds: string[], triggeredIds: string[], openedItemId?: string): TriggerEffect[] {
  return caseDefinition.triggers.filter((trigger) => {
    if (triggeredIds.includes(trigger.id)) return false
    if (trigger.kind === 'clue-count') return clueIds.length >= (trigger.threshold ?? Infinity)
    return trigger.kind === 'item-opened' && trigger.itemId === openedItemId
  }).map((trigger) => trigger.effect)
}

