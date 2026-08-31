import type { CaseDraft } from '../model/caseDraft'

export interface DraftReference { path: string; ownerId: string; field: string }
export type ReferencePolicy = 'block' | 'remove'

function walk(value: unknown, targetId: string, path: string, ownerId: string, references: DraftReference[]) {
  if (Array.isArray(value)) return value.forEach((child, index) => walk(child, targetId, `${path}.${index}`, ownerId, references))
  if (!value || typeof value !== 'object') return
  const record = value as Record<string, unknown>
  const nextOwner = typeof record.id === 'string' ? record.id : ownerId
  for (const [key, child] of Object.entries(record)) {
    if (child === targetId && key !== 'id') references.push({ path: `${path}.${key}`, ownerId: nextOwner, field: key })
    else walk(child, targetId, `${path}.${key}`, nextOwner, references)
  }
}

export function findReferences(draft: CaseDraft, targetId: string): DraftReference[] {
  const references: DraftReference[] = []
  walk(draft, targetId, '$', 'project', references)
  return references
}

function replaceValue(value: unknown, oldId: string, newId: string): unknown {
  if (value === oldId) return newId
  if (Array.isArray(value)) return value.map((item) => replaceValue(item, oldId, newId))
  if (!value || typeof value !== 'object') return value
  return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, replaceValue(child, oldId, newId)]))
}

export function renameStableId(draft: CaseDraft, oldId: string, newId: string): { ok: boolean; draft: CaseDraft; references: DraftReference[]; reason?: string } {
  const references = findReferences(draft, oldId)
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(newId)) return { ok: false, draft, references, reason: 'ID只能包含小写字母、数字和连字符。' }
  const serialized = JSON.stringify(draft)
  if (serialized.includes(`"id":"${newId}"`)) return { ok: false, draft, references, reason: '目标ID已经存在。' }
  return { ok: true, draft: replaceValue(structuredClone(draft), oldId, newId) as CaseDraft, references }
}

export function deleteWithReferencePolicy(draft: CaseDraft, targetId: string, policy: ReferencePolicy): { ok: boolean; draft: CaseDraft; references: DraftReference[] } {
  const references = findReferences(draft, targetId)
  if (references.length && policy === 'block') return { ok: false, draft, references }
  const next = structuredClone(draft)
  const arrayKeys: (keyof CaseDraft)[] = ['entities', 'timeline', 'applications', 'folders', 'files', 'chats', 'emails', 'browserHistory', 'calendarEvents', 'photos', 'systemLogs', 'audioTracks', 'broadcastEvents', 'clues', 'triggers', 'assets']
  arrayKeys.forEach((key) => {
    const value = next[key]
    if (Array.isArray(value)) (next as unknown as Record<string, unknown>)[key] = value.filter((item) => typeof item !== 'object' || item === null || !('id' in item) || (item as { id?: string }).id !== targetId)
  })
  if (policy === 'remove') return { ok: true, draft: replaceValue(next, targetId, '') as CaseDraft, references }
  return { ok: true, draft: next, references }
}
