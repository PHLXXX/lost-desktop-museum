import { describe, expect, it } from 'vitest'
import { createAuthoringProject } from '../editor/model/authoringProject'
import { createMinimalTemplateDraft } from '../editor/model/caseDraft'
import { exportProjectPackage, importProjectPackage } from './projectPackage'

describe('.ldmproject backups', () => {
  it('round trips draft and editor state without becoming an installed case', async () => {
    const project = createAuthoringProject('最小模板工程', createMinimalTemplateDraft(), '2032-01-01T00:00:00.000Z')
    project.uiState.activeSection = 'clues'
    const exported = await exportProjectPackage(project)
    expect(exported.filename).toBe('case-spare-key.ldmproject')
    const imported = await importProjectPackage(exported.bytes, exported.filename)
    expect(imported.project.draft.clues).toHaveLength(6)
    expect(imported.project.uiState.activeSection).toBe('clues')
    expect(imported.project).not.toHaveProperty('discoveredClueIds')
  })

  it('preserves the original data when migration fails', async () => {
    const project = createAuthoringProject('损坏测试', createMinimalTemplateDraft())
    const exported = await exportProjectPackage({ ...project, editorSchemaVersion: 1 })
    await expect(importProjectPackage(exported.bytes, 'wrong.case')).rejects.toThrow(/ldmproject/)
  })
})
