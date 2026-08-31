import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { compileCaseDraft } from '../editor/compiler/compileCaseDraft'
import { createMinimalTemplateDraft } from '../editor/model/caseDraft'
import { createFreshSave } from '../engine/persistence'
import { useGameStore } from '../store/gameStore'
import { PreviewSession } from './PreviewSession'

describe('isolated preview sessions', () => {
  beforeEach(() => { vi.useFakeTimers(); localStorage.clear(); useGameStore.setState({ ...createFreshSave('case-001'), discoveredClueIds: ['C01'], bestScore: 88 }) })
  afterEach(() => vi.useRealTimers())

  it('restores formal progress, score and save namespace after preview', async () => {
    const compiled = compileCaseDraft(createMinimalTemplateDraft())
    if (!compiled.ok) throw new Error('template should compile')
    const session = new PreviewSession('project-preview-test', compiled.caseDefinition)
    session.start()
    useGameStore.getState().investigate({ type: 'OPEN_ITEM', itemId: 'file-handover' })
    expect(useGameStore.getState().discoveredClueIds).toContain('clue-handover')
    session.stop()
    await vi.runAllTimersAsync()
    expect(useGameStore.getState().caseId).toBe('case-001')
    expect(useGameStore.getState().discoveredClueIds).toEqual(['C01'])
    expect(useGameStore.getState().bestScore).toBe(88)
    expect([...Array(localStorage.length)].map((_item, index) => localStorage.key(index)).filter(Boolean).some((key) => key!.includes('preview-'))).toBe(false)
  })
})
