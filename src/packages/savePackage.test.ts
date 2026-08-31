import { describe, expect, it } from 'vitest'
import { createFreshSave } from '../engine/persistence'
import { exportSavePackage, importSavePackage } from './savePackage'

describe('.ldmsave player progress backups', () => {
  it('contains progress but no case or editor definition', () => {
    const save = { ...createFreshSave('case-002'), caseStarted: true, discoveredClueIds: ['clue-a'], playTime: 120 }
    const exported = exportSavePackage(save, '1.0.0', '2032-01-01T00:00:00.000Z')
    const imported = importSavePackage(exported.bytes, exported.filename)
    expect(imported.save.caseId).toBe('case-002')
    expect(imported.save.discoveredClueIds).toEqual(['clue-a'])
    const text = new TextDecoder().decode(exported.bytes)
    expect(text).not.toContain('CaseDefinition')
    expect(text).not.toContain('editorSchemaVersion')
  })

  it('rejects wrong extensions, malformed envelopes and mismatched case ids', () => {
    expect(() => importSavePackage(new TextEncoder().encode('{}'), 'progress.json')).toThrow(/ldmsave/)
    expect(() => importSavePackage(new TextEncoder().encode('{}'), 'progress.ldmsave')).toThrow(/格式/)
    const exported = exportSavePackage(createFreshSave('case-001'), '1.0.0')
    const raw = JSON.parse(new TextDecoder().decode(exported.bytes)) as { caseId: string }
    raw.caseId = 'case-002'
    expect(() => importSavePackage(new TextEncoder().encode(JSON.stringify(raw)), exported.filename)).toThrow(/案件ID/)
  })
})
