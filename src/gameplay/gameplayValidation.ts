import type { CaseCondition, CaseDefinition, GameplayRequirement } from '../cases/types'
import type { ValidationIssue } from '../engine/validation'

function error(code: string, message: string, path: string, entityId?: string): ValidationIssue {
  return { id: `${code.toLowerCase()}-${path}`, severity: 'error', category: code.includes('MISSING') || code.includes('DUPLICATE') ? 'reference' : 'reachability', code, message, path, entityId }
}

function duplicateIds(items: { id: string }[], path: string): ValidationIssue[] {
  const seen = new Set<string>()
  return items.flatMap((item, index) => {
    if (seen.has(item.id)) return [error('DUPLICATE_GAMEPLAY_ID', `玩法ID ${item.id} 在当前列表中重复。`, `${path}.${index}.id`, item.id)]
    seen.add(item.id)
    return []
  })
}

function inspectCondition(
  condition: CaseCondition,
  path: string,
  inventory: { clueIds: Set<string>; itemIds: Set<string>; triggerIds: Set<string>; clueCount: number },
): ValidationIssue[] {
  if (condition.type === 'all' || condition.type === 'any') return condition.conditions.flatMap((child, index) => inspectCondition(child, `${path}.conditions.${index}`, inventory))
  if (condition.type === 'event' && !inventory.itemIds.has(condition.targetId)) return [error('MISSING_GAMEPLAY_TARGET', `玩法条件引用的内容 ${condition.targetId} 不存在。`, `${path}.targetId`, condition.targetId)]
  if (condition.type === 'clue' && !inventory.clueIds.has(condition.clueId)) return [error('MISSING_GAMEPLAY_CLUE', `玩法条件引用的线索 ${condition.clueId} 不存在。`, `${path}.clueId`, condition.clueId)]
  if (condition.type === 'relation') {
    const missing = [condition.from, condition.to].filter((id) => !inventory.clueIds.has(id))
    return missing.map((id) => error('MISSING_GAMEPLAY_CLUE', `玩法关系引用的线索 ${id} 不存在。`, `${path}.${condition.from === id ? 'from' : 'to'}`, id))
  }
  if (condition.type === 'trigger' && !inventory.triggerIds.has(condition.triggerId)) return [error('MISSING_GAMEPLAY_TRIGGER', `玩法条件引用的触发器 ${condition.triggerId} 不存在。`, `${path}.triggerId`, condition.triggerId)]
  if (condition.type === 'clue-count' && condition.count > inventory.clueCount) return [error('UNREACHABLE_GAMEPLAY_CONDITION', `条件需要 ${condition.count} 条线索，但案件只有 ${inventory.clueCount} 条。`, path)]
  return []
}

function inspectRequirements(requirements: GameplayRequirement[], path: string, objectiveIds: Set<string>, relationCount: number): ValidationIssue[] {
  return requirements.flatMap((requirement, index) => {
    const requirementPath = `${path}.${index}`
    if (requirement.type === 'objective' && !objectiveIds.has(requirement.objectiveId)) return [error('MISSING_GAMEPLAY_OBJECTIVE', `玩法条件引用的目标 ${requirement.objectiveId} 不存在。`, `${requirementPath}.objectiveId`, requirement.objectiveId)]
    if (requirement.type === 'relation-count-at-least' && requirement.value > relationCount) return [error('UNREACHABLE_GAMEPLAY_REQUIREMENT', `案件仅配置 ${relationCount} 组关键关系，无法达到 ${requirement.value} 组。`, requirementPath)]
    return []
  })
}

export function validateGameplayDefinition(definition: CaseDefinition): ValidationIssue[] {
  const gameplay = definition.gameplay
  if (!gameplay) return []
  const clueIds = new Set(definition.clues.map((clue) => clue.id))
  const itemIds = new Set([
    ...definition.files.map((item) => item.id), ...definition.chats.flatMap((thread) => thread.messages.map((item) => item.id)), ...definition.emails.map((item) => item.id),
    ...definition.browser.map((item) => item.id), ...definition.calendar.map((item) => item.id), ...definition.photos.map((item) => item.id), ...definition.logs.map((item) => item.id),
    ...definition.audioTracks.map((item) => item.id), ...definition.broadcastEvents.map((item) => item.id), ...definition.dataTables.map((item) => item.id), ...definition.terminalEntries.map((item) => item.id),
    ...definition.versionDiffs.map((item) => item.id), ...definition.sitemap.map((item) => item.id),
  ])
  const triggerIds = new Set(definition.triggers.map((trigger) => trigger.id))
  const inventory = { clueIds, itemIds, triggerIds, clueCount: clueIds.size }
  const objectiveIds = new Set(gameplay.objectives.map((objective) => objective.id))
  const issues = [
    ...duplicateIds(gameplay.objectives, 'gameplay.objectives'),
    ...duplicateIds(gameplay.hints, 'gameplay.hints'),
    ...duplicateIds(gameplay.challenges, 'gameplay.challenges'),
    ...duplicateIds(gameplay.endingVariants, 'gameplay.endingVariants'),
    ...duplicateIds(gameplay.rewards ?? [], 'gameplay.rewards'),
  ]
  gameplay.objectives.forEach((objective, index) => {
    issues.push(...inspectCondition(objective.condition, `gameplay.objectives.${index}.condition`, inventory))
    if (objective.revealWhen) issues.push(...inspectCondition(objective.revealWhen, `gameplay.objectives.${index}.revealWhen`, inventory))
  })
  const hintedClues = new Set<string>()
  gameplay.hints.forEach((hint, index) => {
    if (!clueIds.has(hint.clueId)) issues.push(error('MISSING_GAMEPLAY_CLUE', `提示引用的线索 ${hint.clueId} 不存在。`, `gameplay.hints.${index}.clueId`, hint.clueId))
    else if (hintedClues.has(hint.clueId)) issues.push(error('DUPLICATE_GAMEPLAY_CLUE_HINT', `线索 ${hint.clueId} 配置了多组提示。`, `gameplay.hints.${index}.clueId`, hint.clueId))
    hintedClues.add(hint.clueId)
    issues.push(...duplicateIds(hint.tiers, `gameplay.hints.${index}.tiers`))
    if (hint.tiers[0].cost > gameplay.initialAnalysisPoints) issues.push(error('UNREACHABLE_HINT_COST', '第一层提示成本超过初始分析额度，玩家无法使用。', `gameplay.hints.${index}.tiers.0.cost`, hint.id))
  })
  gameplay.challenges.forEach((challenge, index) => issues.push(...inspectRequirements(challenge.requirements, `gameplay.challenges.${index}.requirements`, objectiveIds, definition.correctContradictions.length)))
  gameplay.endingVariants.forEach((ending, index) => issues.push(...inspectRequirements(ending.requirements, `gameplay.endingVariants.${index}.requirements`, objectiveIds, definition.correctContradictions.length)))
  gameplay.rewards?.forEach((reward, index) => issues.push(...inspectRequirements(reward.requirements, `gameplay.rewards.${index}.requirements`, objectiveIds, definition.correctContradictions.length)))
  return issues
}
