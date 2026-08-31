import type { CaseDefinition, TriggerEffect } from '../cases/types'
import { evaluateCondition, eventKey } from './conditionEngine'

export function evaluateTriggers(caseDefinition: CaseDefinition, clueIds: string[], triggeredIds: string[], openedItemId?: string): TriggerEffect[] {
  return caseDefinition.triggers.flatMap((trigger) => {
    if (triggeredIds.includes(trigger.id)) return []
    if ('kind' in trigger) {
      const matched = trigger.kind === 'clue-count'
        ? clueIds.length >= (trigger.threshold ?? Infinity)
        : trigger.kind === 'item-opened' && trigger.itemId === openedItemId
      return matched ? [trigger.effect] : []
    }
    const matched = evaluateCondition(trigger.condition, {
      eventKeys: new Set(openedItemId ? [eventKey('OPEN_ITEM', openedItemId)] : []),
      clueIds: new Set(clueIds), relationKeys: new Set(), triggerIds: new Set(triggeredIds),
    })
    return matched ? trigger.effects : []
  })
}
