import { describe, expect, it } from 'vitest'
import { caseDefinition as case001 } from './case-001/case'
import { evaluateCondition } from '../engine/conditionEngine'
import { validateCaseDefinition } from '../engine/validation'
import { builtInCaseIds, getCaseDefinition } from './registry'
import { createFreshSave, loadGameSave, saveGameSave } from '../engine/persistence'
import type { CaseDefinition } from './types'

class MemoryStorage implements Storage {
  private data = new Map<string, string>()
  get length() { return this.data.size }
  clear() { this.data.clear() }
  getItem(key: string) { return this.data.get(key) ?? null }
  key(index: number) { return [...this.data.keys()][index] ?? null }
  removeItem(key: string) { this.data.delete(key) }
  setItem(key: string, value: string) { this.data.set(key, value) }
}

describe('strict multi-case runtime foundation', () => {
  it('registers two independent built-in cases', () => {
    expect(builtInCaseIds).toEqual(['case-001', 'case-002'])
    expect(getCaseDefinition('case-001').title).toBe('没有出发的旅行')
    expect(getCaseDefinition('case-002').id).toBe('case-002')
  })

  it('evaluates nested declarative conditions', () => {
    const context = {
      eventKeys: new Set(['OPEN_ITEM:file-note', 'VIEW_LOG:log-door']),
      clueIds: new Set(['clue-file']),
      relationKeys: new Set<string>(),
      triggerIds: new Set<string>(),
    }
    expect(evaluateCondition({
      type: 'all',
      conditions: [
        { type: 'event', eventType: 'OPEN_ITEM', targetId: 'file-note' },
        { type: 'any', conditions: [
          { type: 'clue', clueId: 'clue-file' },
          { type: 'event', eventType: 'OPEN_ITEM', targetId: 'missing' },
        ] },
      ],
    }, context)).toBe(true)
  })

  it('rejects remote or executable formal case content', () => {
    const remote = structuredClone(case001) as unknown as Record<string, unknown>
    remote.assets = [{ id: 'cover', kind: 'image', mime: 'image/png', path: 'https://example.com/cover.png', size: 10, sha256: 'a'.repeat(64), alt: 'cover' }]
    expect(validateCaseDefinition(remote).some((issue) => issue.category === 'security')).toBe(true)
    const executable = structuredClone(case001) as unknown as Record<string, unknown>
    executable.triggers = [{ id: 'unsafe', name: 'unsafe', once: true, condition: { type: 'clue-count', count: 1 }, effects: [{ type: 'javascript', code: 'alert(1)' }] }]
    expect(validateCaseDefinition(executable).some((issue) => issue.category === 'security' || issue.category === 'schema')).toBe(true)
  })

  it.each([
    ['message', (definition: CaseDefinition) => { definition.chats[0]!.messages[0]!.clueId = 'missing-clue' }],
    ['mail', (definition: CaseDefinition) => { definition.emails[0]!.clueId = 'missing-clue' }],
    ['browser', (definition: CaseDefinition) => { definition.browser[0]!.clueId = 'missing-clue' }],
    ['calendar', (definition: CaseDefinition) => { definition.calendar[0]!.clueId = 'missing-clue' }],
    ['photo', (definition: CaseDefinition) => { definition.photos[0]!.clueId = 'missing-clue' }],
    ['log', (definition: CaseDefinition) => { definition.logs[0]!.clueId = 'missing-clue' }],
  ] as const)('rejects dangling clue references in %s records', (_recordType, mutate) => {
    const definition = structuredClone(case001)
    mutate(definition)

    expect(validateCaseDefinition(definition)).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'MISSING_CLUE_REFERENCE', entityId: 'missing-clue' }),
    ]))
  })

  it('keeps case saves independent and preserves the legacy key', () => {
    const storage = new MemoryStorage()
    storage.setItem('archive-os:case-001', JSON.stringify({ saveVersion: 2, discoveredClueIds: ['C01'] }))
    const first = loadGameSave(storage, 'case-001').save
    expect(first.discoveredClueIds).toEqual(['C01'])
    expect(storage.getItem('archive-os:case-001')).not.toBeNull()

    const second = { ...createFreshSave('case-002'), discoveredClueIds: ['echo-clue-01'] }
    saveGameSave(storage, second)
    expect(loadGameSave(storage, 'case-002').save.discoveredClueIds).toEqual(['echo-clue-01'])
    expect(loadGameSave(storage, 'case-001').save.discoveredClueIds).toEqual(['C01'])
  })
})
