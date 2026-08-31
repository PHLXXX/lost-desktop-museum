import { describe, expect, it } from 'vitest'
import { createAuthoringProject } from '../editor/model/authoringProject'
import { createMinimalTemplateDraft } from '../editor/model/caseDraft'
import { exportProjectPackage, importProjectPackage } from './projectPackage'

async function projectFixture() {
  const project = createAuthoringProject('最小模板工程', createMinimalTemplateDraft(), '2032-01-01T00:00:00.000Z')
  const cover = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, 0])
  const digest = await crypto.subtle.digest('SHA-256', cover.slice().buffer)
  project.draft.assets[0]!.size = cover.length
  project.draft.assets[0]!.sha256 = [...new Uint8Array(digest)].map((value) => value.toString(16).padStart(2, '0')).join('')
  return { project, assets: new Map([['spare-key-cover.png', cover]]) }
}

describe('.ldmproject backups', () => {
  it('round trips draft and editor state without becoming an installed case', async () => {
    const { project, assets } = await projectFixture()
    project.uiState.activeSection = 'clues'
    const exported = await exportProjectPackage(project, assets)
    expect(exported.filename).toBe('case-spare-key.ldmproject')
    const imported = await importProjectPackage(exported.bytes, exported.filename)
    expect(imported.project.draft.clues).toHaveLength(6)
    expect(imported.project.uiState.activeSection).toBe('clues')
    expect(imported.project).not.toHaveProperty('discoveredClueIds')
  })

  it('preserves the original data when migration fails', async () => {
    const { project, assets } = await projectFixture()
    const exported = await exportProjectPackage({ ...project, editorSchemaVersion: 1 }, assets)
    await expect(importProjectPackage(exported.bytes, 'wrong.case')).rejects.toThrow(/ldmproject/)
  })

  it('rejects missing or disguised referenced resources', async () => {
    const { project } = await projectFixture()
    await expect(exportProjectPackage(project)).rejects.toThrow(/缺少已引用资源/)
    const disguised = new TextEncoder().encode('MZ executable data')
    const digest = await crypto.subtle.digest('SHA-256', disguised.slice().buffer)
    project.draft.assets[0]!.size = disguised.length
    project.draft.assets[0]!.sha256 = [...new Uint8Array(digest)].map((value) => value.toString(16).padStart(2, '0')).join('')
    await expect(exportProjectPackage(project, new Map([['spare-key-cover.png', disguised]]))).rejects.toThrow(/文件签名/)
  })
})
