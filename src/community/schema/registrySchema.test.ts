import { describe, expect, it } from 'vitest'
import { parseCommunityCaseDetail, parseCommunityPublisher, parseCommunityRegistryIndex } from './registrySchema'

const publisher = {
  schemaVersion: 1,
  publisherId: 'ldm-team',
  displayName: 'Lost Desktop Museum Team',
  description: 'Maintainers of the archive exchange sample catalog.',
  githubUsername: 'PHLXXX',
  repositoryUrl: 'https://github.com/PHLXXX/lost-desktop-museum-community',
  languages: ['zh-CN', 'en'],
  links: [{ label: 'GitHub', url: 'https://github.com/PHLXXX' }],
  joinedAt: '2026-08-31T00:00:00.000Z',
  status: 'active',
} as const

const summary = {
  caseId: 'case-community-sample-001', latestVersion: '1.0.0', publisherId: 'ldm-team', title: '消失的备用钥匙', subtitle: 'The Missing Spare Key',
  summary: '调查办公室备用钥匙失踪前后的本地记录。', language: 'zh-CN', additionalLanguages: ['en'], difficulty: 'easy', estimatedMinutes: { min: 10, max: 15 },
  tags: ['教学案件', '办公室'], contentRating: 'general', contentWarnings: [], coverPath: 'screenshots/case-community-sample-001/1.0.0/cover.webp',
  status: 'active', curated: true, featured: true, publishedAt: '2026-08-31T00:00:00.000Z', updatedAt: '2026-08-31T00:00:00.000Z', detailPath: 'registry/v1/cases/case-community-sample-001.json',
} as const

describe('community registry schemas', () => {
  it('parses a valid strict registry index', () => {
    const index = parseCommunityRegistryIndex({
      schemaVersion: 1, registryVersion: '1.0.0', generatedAt: '2026-08-31T00:00:00.000Z', sourceCommit: 'fixture',
      engineCompatibility: { minimumClientVersion: '0.5.0' }, stats: { activeCases: 1, publishers: 1, languages: 2, totalPackageBytes: 4096 },
      featuredCaseIds: [summary.caseId], cases: [summary],
    })
    expect(index.cases[0]?.title).toBe('消失的备用钥匙')
  })

  it('rejects corrupt data, unknown fields and a registry schema version newer than the client', () => {
    expect(() => parseCommunityRegistryIndex({ schemaVersion: 2 })).toThrow(/社区目录版本/)
    expect(() => parseCommunityRegistryIndex({ ...summary, schemaVersion: 1 })).toThrow(/社区目录数据/)
    expect(() => parseCommunityPublisher({ ...publisher, injected: '<script>' })).toThrow(/发布者资料/)
  })

  it('accepts a complete case detail and rejects unsafe external paths', () => {
    const detail = parseCommunityCaseDetail({
      schemaVersion: 1, caseId: summary.caseId, publisherId: 'ldm-team', title: summary.title, subtitle: summary.subtitle, summary: summary.summary,
      language: 'zh-CN', additionalLanguages: ['en'], difficulty: 'easy', estimatedMinutes: { min: 10, max: 15 }, tags: ['教学案件'], contentRating: 'general', contentWarnings: [],
      status: 'active', curated: true, featured: true, publisherPath: 'registry/v1/publishers/ldm-team.json', latestVersion: '1.0.0',
      versions: [{ version: '1.0.0', packagePath: 'packages/case-community-sample-001/1.0.0/case-community-sample-001-1.0.0.ldmcase', packageSha256: 'a'.repeat(64), packageByteSize: 4096,
        engineCompatibility: { minimum: '0.5.0' }, saveCompatibility: { mode: 'compatible', compatibleFromVersions: ['1.0.0'] }, changelog: '首次发布。', screenshots: ['screenshots/case-community-sample-001/1.0.0/cover.webp'],
        license: { name: 'MIT', url: 'https://opensource.org/license/mit' }, automatedValidation: { passed: true, checkedAt: '2026-08-31T00:00:00.000Z' }, publishedAt: '2026-08-31T00:00:00.000Z', updatedAt: '2026-08-31T00:00:00.000Z' }],
    })
    expect(detail.versions).toHaveLength(1)
    expect(() => parseCommunityCaseDetail({ ...detail, publisherPath: 'https://example.com/publisher.json' })).toThrow(/案件详情/)
  })
})
