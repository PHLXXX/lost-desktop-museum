import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { buildCommunityFixtureArtifacts } from '../src/community/fixtures/communityFixtures'
import { parseCommunityCaseDetail, parseCommunityCatalogEntry, parseCommunityPublisher, parseCommunityRegistryIndex } from '../src/community/schema/registrySchema'

const root = resolve('tests/fixtures/community')
const generatedAt = '2026-08-31T00:00:00.000Z'
const caseId = 'case-community-sample-001'
const publisherId = 'ldm-team'
const encoder = new TextEncoder()

function sha256(bytes: Uint8Array) { return createHash('sha256').update(bytes).digest('hex') }
function jsonBytes(value: unknown) { return encoder.encode(`${JSON.stringify(value, null, 2)}\n`) }
async function putAt(base: string, relativePath: string, bytes: Uint8Array) {
  const target = resolve(base, relativePath)
  await mkdir(dirname(target), { recursive: true })
  let existing: Uint8Array | null = null
  try { existing = new Uint8Array(await readFile(target)) } catch { /* first generation */ }
  if (existing && Buffer.compare(existing, bytes) === 0) return
  await writeFile(target, bytes)
}
const put = (relativePath: string, bytes: Uint8Array) => putAt(root, relativePath, bytes)

const artifacts = await buildCommunityFixtureArtifacts()
for (const [path, bytes] of artifacts) await put(path, bytes)

const baseBytes = artifacts.get('packages/valid-1.0.0.ldmcase')!
const updateBytes = artifacts.get('packages/valid-1.1.0.ldmcase')!
const incompatibleBytes = artifacts.get('packages/incompatible-2.0.0.ldmcase')!
const coverBytes = new Uint8Array(await readFile(resolve('docs/images/stage4-live-preview.png')))
await put('screenshots/cover.png', coverBytes)

const publisher = parseCommunityPublisher({
  schemaVersion: 1, publisherId, displayName: 'Lost Desktop Museum Team', description: '维护档案交换站格式与教学示例案件。',
  githubUsername: 'PHLXXX', repositoryUrl: 'https://github.com/PHLXXX/lost-desktop-museum-community', languages: ['zh-CN', 'en'],
  links: [{ label: '主项目', url: 'https://github.com/PHLXXX/lost-desktop-museum' }], joinedAt: generatedAt, status: 'active',
})
await put(`registry/v1/publishers/${publisherId}.json`, jsonBytes(publisher))

const version = (value: string, packagePath: string, packageBytes: Uint8Array, mode: 'compatible' | 'requires-review' | 'incompatible', changelog: string) => ({
  version: value, packagePath, packageSha256: sha256(packageBytes), packageByteSize: packageBytes.length,
  engineCompatibility: { minimum: '0.5.0' }, saveCompatibility: { mode, compatibleFromVersions: mode === 'compatible' ? ['1.0.0'] : [], ...(mode === 'incompatible' ? { notes: '测试版本移除了clue-handover。' } : {}) },
  changelog, screenshots: ['screenshots/cover.png'], license: { name: 'MIT', url: 'https://opensource.org/license/mit' },
  automatedValidation: { passed: true as const, checkedAt: generatedAt }, publishedAt: generatedAt, updatedAt: generatedAt,
})
const versions = [
  version('1.0.0', 'packages/valid-1.0.0.ldmcase', baseBytes, 'compatible', '首次发布教学案件。'),
  version('1.1.0', 'packages/valid-1.1.0.ldmcase', updateBytes, 'compatible', '补充交接记录说明，保持1.0.0进度兼容。'),
  version('2.0.0', 'packages/incompatible-2.0.0.ldmcase', incompatibleBytes, 'incompatible', '重排线索结构并移除旧交接线索，仅用于不兼容更新测试。'),
]
const detailBase = {
  schemaVersion: 1 as const, caseId, publisherId, title: '消失的备用钥匙', subtitle: 'The Missing Spare Key', summary: '管理员办公室的备用钥匙在交接前消失。请检查本地文件、消息与访问记录。',
  language: 'zh-CN', additionalLanguages: ['en'], difficulty: 'easy' as const, estimatedMinutes: { min: 10, max: 15 }, tags: ['教学案件', '办公室', '时间线', '文件记录', '适合新手'],
  contentRating: 'general' as const, contentWarnings: [], status: 'active' as const, curated: true, featured: true, publisherPath: `registry/v1/publishers/${publisherId}.json`,
}
const detail = parseCommunityCaseDetail({ ...detailBase, latestVersion: '1.0.0', versions: [versions[0]] })
const updateDetail = parseCommunityCaseDetail({ ...detailBase, latestVersion: '1.1.0', versions: versions.slice(0, 2) })
const incompatibleDetail = parseCommunityCaseDetail({ ...detailBase, latestVersion: '2.0.0', versions })
await put(`registry/v1/cases/${caseId}.json`, jsonBytes(detail))
await put(`scenarios/${caseId}-1.1.0.json`, jsonBytes(updateDetail))
await put(`scenarios/${caseId}-2.0.0.json`, jsonBytes(incompatibleDetail))

const summary = {
  caseId, latestVersion: '1.0.0', publisherId, title: detail.title, subtitle: detail.subtitle, summary: detail.summary, language: detail.language, additionalLanguages: detail.additionalLanguages,
  difficulty: detail.difficulty, estimatedMinutes: detail.estimatedMinutes, tags: detail.tags, contentRating: detail.contentRating, contentWarnings: detail.contentWarnings,
  coverPath: 'screenshots/cover.png', status: 'active' as const, curated: true, featured: true, publishedAt: generatedAt, updatedAt: generatedAt, detailPath: `registry/v1/cases/${caseId}.json`,
}
const index = parseCommunityRegistryIndex({
  schemaVersion: 1, registryVersion: '1.0.0', generatedAt, sourceCommit: 'fixture', engineCompatibility: { minimumClientVersion: '0.5.0' },
  stats: { activeCases: 1, publishers: 1, languages: 2, totalPackageBytes: baseBytes.length }, featuredCaseIds: [caseId], cases: [summary],
})
await put('registry/v1/index.json', jsonBytes(index))
await put('scenarios/index-1.1.0.json', jsonBytes({ ...index, registryVersion: '1.1.0', cases: [{ ...summary, latestVersion: '1.1.0', updatedAt: generatedAt }] }))
await put('scenarios/index-2.0.0.json', jsonBytes({ ...index, registryVersion: '2.0.0', cases: [{ ...summary, latestVersion: '2.0.0', updatedAt: generatedAt }] }))
await put('scenarios/index-blocked.json', jsonBytes({ ...index, cases: [{ ...summary, status: 'blocked' }] }))
await put('scenarios/index-deprecated.json', jsonBytes({ ...index, cases: [{ ...summary, status: 'deprecated' }] }))
await put('scenarios/index-hash-mismatch-detail.json', jsonBytes({ ...detail, versions: [{ ...detail.versions[0], packageSha256: '0'.repeat(64), packagePath: 'packages/hash-mismatch.ldmcase' }] }))

const entry = parseCommunityCatalogEntry({
  schemaVersion: 1, caseId, version: '1.0.0', publisherId, title: detail.title, subtitle: detail.subtitle, summary: detail.summary, language: detail.language, additionalLanguages: detail.additionalLanguages,
  difficulty: 'easy', estimatedMinutes: detail.estimatedMinutes, tags: detail.tags, contentRating: 'general', contentWarnings: [], engineCompatibility: { minimum: '0.5.0' },
  packageFile: `${caseId}-1.0.0.ldmcase`, changelogFile: 'CHANGELOG.md', screenshotFiles: ['screenshots/cover.png'], license: { name: 'MIT', url: 'https://opensource.org/license/mit' },
  distributionConsent: true, saveCompatibility: { mode: 'compatible', compatibleFromVersions: ['1.0.0'] }, status: 'active', moderation: { automatedValidationRequired: true, curated: true, featured: true },
  publishedAt: generatedAt, updatedAt: generatedAt,
})
await put('catalog/entry.json', jsonBytes(entry))
await put('catalog/publisher.json', jsonBytes(publisher))

const checksums: Record<string, string> = {}
for (const [path, bytes] of [...artifacts.entries()].sort(([left], [right]) => left.localeCompare(right))) checksums[path] = sha256(bytes)
checksums['screenshots/cover.png'] = sha256(coverBytes)
await put('registry/v1/checksums.json', jsonBytes(checksums))

console.log(`PASS community fixtures · ${artifacts.size} packages · ${caseId}@1.0.0/1.1.0/2.0.0`)
