import type { CaseDefinition, GameSave } from '../../cases/types'
import type { CommunitySaveCompatibility } from '../types/communityTypes'

export interface AffectedProgressItem { type: 'clue' | 'item' | 'application' | 'event'; id: string; reason: string }
export type UpdateCompatibilityResult =
  | { status: 'compatible'; warnings: string[] }
  | { status: 'review-required'; affectedProgress: AffectedProgressItem[]; warnings: string[] }
  | { status: 'incompatible'; reasons: string[]; affectedProgress: AffectedProgressItem[] }

function definitionIds(definition: CaseDefinition) {
  const items = new Set<string>()
  for (const collection of [definition.files, definition.emails, definition.browser, definition.calendar, definition.photos, definition.logs, definition.audioTracks, definition.broadcastEvents, definition.dataTables, definition.terminalEntries, definition.versionDiffs, definition.sitemap]) for (const item of collection) items.add(item.id)
  for (const thread of definition.chats) for (const message of thread.messages) items.add(message.id)
  return { clues: new Set(definition.clues.map((item) => item.id)), items, apps: new Set(definition.applications.map((item) => item.id)), events: new Set(definition.triggers.map((item) => item.id)) }
}
export function analyzeUpdateCompatibility(save: GameSave, next: CaseDefinition, declared: CommunitySaveCompatibility['mode'] | CommunitySaveCompatibility, currentVersion?: string): UpdateCompatibilityResult {
  if (save.caseId !== next.id) return { status: 'incompatible', reasons: ['更新包与当前案件ID不同。'], affectedProgress: [] }
  const ids = definitionIds(next); const affected: AffectedProgressItem[] = []; const seen = new Set<string>()
  const add = (type: AffectedProgressItem['type'], id: string, reason: string) => { const key = `${type}:${id}`; if (!seen.has(key)) { seen.add(key); affected.push({ type, id, reason }) } }
  for (const id of [...save.discoveredClueIds, ...save.pinnedClueIds, ...Object.keys(save.evidenceCardPositions), ...Object.keys(save.evidenceNotes)]) if (!ids.clues.has(id)) add('clue', id, '新版本移除了已记录或证据板引用的线索。')
  for (const id of [...save.openedItems, ...save.unlockedItemIds, ...save.restoredItemIds]) if (!ids.items.has(id)) add('item', id, '新版本移除了已有调查进度引用的内容。')
  for (const relation of save.evidenceRelations) for (const id of [relation.from, relation.to]) if (!ids.clues.has(id)) add('clue', id, '新版本移除了证据关系引用的线索。')
  for (const window of save.currentWindows) if (!ids.apps.has(window.id)) add('application', window.id, '新版本移除了已保存窗口对应的应用。')
  for (const id of save.triggeredEventIds) if (!ids.events.has(id)) add('event', id, '新版本移除了已经触发的事件。')
  const mode = typeof declared === 'string' ? declared : declared.mode
  const outsideDeclaredRange = typeof declared !== 'string' && Boolean(currentVersion) && declared.compatibleFromVersions.length > 0 && !declared.compatibleFromVersions.includes(currentVersion!)
  if (mode === 'incompatible') return { status: 'incompatible', reasons: ['作者明确声明此版本与现有进度不兼容。'], affectedProgress: affected }
  if (affected.length || mode === 'requires-review' || outsideDeclaredRange) {
    const warnings = affected.length ? ['部分已有进度引用在新版本中不存在。'] : outsideDeclaredRange ? [`当前版本 ${currentVersion} 不在作者声明的兼容版本列表中。`] : ['作者要求更新前人工确认进度兼容性。']
    return { status: 'review-required', affectedProgress: affected, warnings }
  }
  return { status: 'compatible', warnings: [] }
}
