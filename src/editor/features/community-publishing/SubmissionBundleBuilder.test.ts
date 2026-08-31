import { strFromU8, unzipSync } from 'fflate'
import { describe, expect, it } from 'vitest'
import { compileCaseDraft } from '../../compiler/compileCaseDraft'
import { createMinimalTemplateDraft } from '../../model/caseDraft'
import { exportCasePackage } from '../../../packages/casePackage'
import { buildSubmissionBundle } from './SubmissionBundleBuilder'

async function packageFixture() {
  const draft = createMinimalTemplateDraft()
  draft.manifest.caseId = 'case-community-sample-001'
  draft.manifest.version = '1.0.0'
  draft.manifest.author = 'ldm-team'
  draft.assets = []
  delete draft.desktop.wallpaperAssetId
  const compiled = compileCaseDraft(draft, [])
  if (!compiled.ok) throw new Error(compiled.issues.map((issue) => issue.message).join('；'))
  return exportCasePackage(compiled.caseDefinition, new Map())
}

describe('community submission bundle', () => {
  it('contains only catalog submission files with stable checksums', async () => {
    const exported = await packageFixture()
    const result = await buildSubmissionBundle({
      packageBytes: exported.bytes,
      packageFilename: exported.filename,
      publisher: { schemaVersion: 1, publisherId: 'ldm-team', displayName: 'LDM Team', description: 'Sample publisher', languages: ['zh-CN'], links: [], joinedAt: '2026-08-31T00:00:00.000Z', status: 'active' },
      metadata: { title: '消失的备用钥匙', subtitle: 'The Missing Spare Key', summary: '教学案件。', language: 'zh-CN', additionalLanguages: ['en'], difficulty: 'easy', estimatedMinutes: { min: 10, max: 15 }, tags: ['教学案件'], contentRating: 'general', contentWarnings: [], license: { name: 'MIT', url: 'https://opensource.org/license/mit' }, changelog: '首次发布。', engineCompatibility: { minimum: '0.5.0' }, saveCompatibility: { mode: 'compatible', compatibleFromVersions: ['1.0.0'] }, requestCuration: true },
      screenshots: [{ filename: 'cover.png', mime: 'image/png', bytes: new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]) }],
      generatedAt: '2026-08-31T00:00:00.000Z',
    })
    const files = unzipSync(result.bytes)
    expect(Object.keys(files).sort()).toEqual([
      'submission/CHANGELOG.md', 'submission/SUBMISSION.md', 'submission/case-community-sample-001-1.0.0.ldmcase',
      'submission/checksums.json', 'submission/entry.json', 'submission/publisher.json', 'submission/screenshots/cover.png',
    ])
    const packagePath = 'submission/case-community-sample-001-1.0.0.ldmcase'
    const packagedCase = unzipSync(files[packagePath]!)
    const textSubmissionFiles = Object.entries(files)
      .filter(([path]) => !path.endsWith('.ldmcase') && !path.startsWith('submission/screenshots/'))
      .map(([, bytes]) => strFromU8(bytes))
    const textCaseFiles = ['manifest.json', 'case.json', 'checksums.json'].map((path) => strFromU8(packagedCase[path]!))
    const combined = [...textSubmissionFiles, ...textCaseFiles].join('\n')
    expect(combined).not.toMatch(/archive-workshop|discoveredClueIds|evidenceRelations|[A-Z]:\\|github[_-]?token/i)
    expect(result.suggestedDirectory).toBe('catalog/cases/case-community-sample-001/1.0.0')
  })

  it('rejects missing screenshots and a publisher that could impersonate a built-in source', async () => {
    const exported = await packageFixture()
    const base = {
      packageBytes: exported.bytes, packageFilename: exported.filename,
      publisher: { schemaVersion: 1 as const, publisherId: 'official', displayName: 'Official', description: '', languages: ['zh-CN'], links: [], joinedAt: '2026-08-31T00:00:00.000Z', status: 'active' as const },
      metadata: { title: '消失的备用钥匙', summary: '教学案件。', language: 'zh-CN', additionalLanguages: [], difficulty: 'easy' as const, estimatedMinutes: { min: 10, max: 15 }, tags: [], contentRating: 'general' as const, contentWarnings: [], license: { name: 'MIT' }, changelog: '首次发布。', engineCompatibility: { minimum: '0.5.0' }, saveCompatibility: { mode: 'compatible' as const, compatibleFromVersions: ['1.0.0'] }, requestCuration: false },
      screenshots: [], generatedAt: '2026-08-31T00:00:00.000Z',
    }
    await expect(buildSubmissionBundle(base)).rejects.toThrow(/发布者|截图/)
  })

  it('rejects duplicate screenshot output names', async () => {
    const exported = await packageFixture(); const screenshot = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10])
    await expect(buildSubmissionBundle({
      packageBytes: exported.bytes, packageFilename: exported.filename,
      publisher: { schemaVersion: 1, publisherId: 'ldm-team', displayName: 'LDM Team', description: 'Sample publisher', languages: ['zh-CN'], links: [], joinedAt: '2026-08-31T00:00:00.000Z', status: 'active' },
      metadata: { title: '消失的备用钥匙', summary: '教学案件。', language: 'zh-CN', additionalLanguages: [], difficulty: 'easy', estimatedMinutes: { min: 10, max: 15 }, tags: [], contentRating: 'general', contentWarnings: [], license: { name: 'MIT' }, changelog: '首次发布。', engineCompatibility: { minimum: '0.5.0' }, saveCompatibility: { mode: 'compatible', compatibleFromVersions: ['1.0.0'] }, requestCuration: false },
      screenshots: [{ filename: 'cover.png', mime: 'image/png', bytes: screenshot }, { filename: 'COVER.PNG', mime: 'image/png', bytes: screenshot }],
    })).rejects.toThrow(/重复/)
  })
})
