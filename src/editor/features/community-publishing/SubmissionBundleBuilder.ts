import { zipSync } from 'fflate'
import { importCasePackage } from '../../../packages/casePackage'
import { validateAssetBytes } from '../../../packages/assetContentValidation'
import { parseCommunityCatalogEntry, parseCommunityPublisher } from '../../../community/schema/registrySchema'
import type { CommunityCatalogEntry, CommunityContentRating, CommunityDifficulty, CommunityPublisher, CommunitySaveCompatibility } from '../../../community/types/communityTypes'

export interface SubmissionScreenshot { filename: string; mime: 'image/png' | 'image/jpeg' | 'image/webp'; bytes: Uint8Array }
export interface SubmissionMetadata {
  title: string; subtitle?: string; summary: string; language: string; additionalLanguages: string[]; difficulty: CommunityDifficulty
  estimatedMinutes: { min: number; max: number }; tags: string[]; contentRating: CommunityContentRating; contentWarnings: string[]
  license: { name: string; url?: string; customTextFile?: string }; changelog: string; engineCompatibility: { minimum: string; maximumExclusive?: string }
  saveCompatibility: CommunitySaveCompatibility; requestCuration: boolean
}
export interface BuildSubmissionInput { packageBytes: Uint8Array; packageFilename: string; publisher: CommunityPublisher; metadata: SubmissionMetadata; screenshots: SubmissionScreenshot[]; generatedAt?: string }
export interface BuiltSubmissionBundle { filename: string; bytes: Uint8Array; suggestedDirectory: string; suggestedPullRequestTitle: string; suggestedPullRequestBody: string; entry: CommunityCatalogEntry }

// ZIP stores local date fields, so use the same wall-clock value everywhere.
const fixedDate = new Date(1980, 0, 1, 0, 0, 0)
const encoder = new TextEncoder()
function jsonBytes(value: unknown) { return encoder.encode(`${JSON.stringify(value, null, 2)}\n`) }
async function sha256(bytes: Uint8Array) {
  const digest = await crypto.subtle.digest('SHA-256', bytes.slice().buffer)
  return [...new Uint8Array(digest)].map((value) => value.toString(16).padStart(2, '0')).join('')
}
function safeScreenshotName(value: string) {
  const leaf = value.replace(/\\/g, '/').split('/').at(-1) ?? ''
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]*\.(?:png|jpe?g|webp)$/i.test(leaf)) throw new Error(`截图文件名不安全：${value}`)
  return leaf
}

export async function buildSubmissionBundle(input: BuildSubmissionInput): Promise<BuiltSubmissionBundle> {
  const publisher = parseCommunityPublisher(input.publisher)
  if (input.screenshots.length < 1 || input.screenshots.length > 5) throw new Error('社区投稿需要1至5张本地截图。')
  const imported = await importCasePackage(input.packageBytes, input.packageFilename)
  if (imported.caseDefinition.manifest.builtIn) throw new Error('内置案件不能作为社区投稿。')
  if (imported.caseDefinition.manifest.author !== publisher.publisherId) throw new Error('案件作者字段必须与发布者ID一致。')
  const screenshotEntries: [string, Uint8Array][] = []
  const screenshotNames = new Set<string>()
  for (const screenshot of input.screenshots) {
    if (screenshot.bytes.length > 2 * 1024 * 1024) throw new Error(`截图超过2MB：${screenshot.filename}`)
    const filename = safeScreenshotName(screenshot.filename)
    const normalizedName = filename.normalize('NFC').toLowerCase()
    if (screenshotNames.has(normalizedName)) throw new Error(`截图文件名重复：${filename}`)
    screenshotNames.add(normalizedName)
    const validation = validateAssetBytes(filename, screenshot.mime, screenshot.bytes)
    if (!validation.valid) throw new Error(`截图校验失败：${validation.message}`)
    screenshotEntries.push([`submission/screenshots/${filename}`, screenshot.bytes])
  }
  const generatedAt = input.generatedAt ?? new Date().toISOString()
  const packageName = `${imported.caseDefinition.id}-${imported.caseDefinition.manifest.version}.ldmcase`
  const entry = parseCommunityCatalogEntry({
    schemaVersion: 1, caseId: imported.caseDefinition.id, version: imported.caseDefinition.manifest.version, publisherId: publisher.publisherId,
    title: input.metadata.title, subtitle: input.metadata.subtitle, summary: input.metadata.summary, language: input.metadata.language, additionalLanguages: input.metadata.additionalLanguages,
    difficulty: input.metadata.difficulty, estimatedMinutes: input.metadata.estimatedMinutes, tags: input.metadata.tags, contentRating: input.metadata.contentRating, contentWarnings: input.metadata.contentWarnings,
    engineCompatibility: input.metadata.engineCompatibility, packageFile: packageName, changelogFile: 'CHANGELOG.md', screenshotFiles: screenshotEntries.map(([path]) => path.replace('submission/', '')),
    license: input.metadata.license, distributionConsent: true, saveCompatibility: input.metadata.saveCompatibility, status: 'active',
    moderation: { automatedValidationRequired: true, curated: false, featured: false, ...(input.metadata.requestCuration ? { notes: '作者申请人工精选；最终状态由维护者决定。' } : {}) },
    publishedAt: generatedAt, updatedAt: generatedAt,
  })
  const changelog = encoder.encode(`# ${entry.title} ${entry.version}\n\n${input.metadata.changelog.trim()}\n`)
  const suggestedDirectory = `catalog/cases/${entry.caseId}/${entry.version}`
  const suggestedPullRequestTitle = `case: submit ${entry.caseId} ${entry.version}`
  const suggestedPullRequestBody = `提交案件：${entry.title}\n\n- Case ID: ${entry.caseId}\n- Version: ${entry.version}\n- Publisher: ${entry.publisherId}\n- Content rating: ${entry.contentRating}\n- Suggested path: ${suggestedDirectory}`
  const submission = encoder.encode(`# 社区投稿说明\n\n${suggestedPullRequestBody}\n\n## 投稿步骤\n\n1. Fork社区仓库。\n2. 将submission目录内容放入 \`${suggestedDirectory}\`。\n3. 创建Pull Request并等待自动校验。\n4. 根据结构化校验结果修复后等待维护者审核。\n\n建议PR标题：\`${suggestedPullRequestTitle}\`\n`)
  const entries = new Map<string, Uint8Array>([
    ['submission/publisher.json', jsonBytes(publisher)], ['submission/entry.json', jsonBytes(entry)], [`submission/${packageName}`, input.packageBytes],
    ['submission/CHANGELOG.md', changelog], ['submission/SUBMISSION.md', submission], ...screenshotEntries,
  ])
  const checksums: Record<string, string> = {}
  for (const [path, bytes] of [...entries.entries()].sort(([left], [right]) => left.localeCompare(right))) checksums[path.replace('submission/', '')] = await sha256(bytes)
  entries.set('submission/checksums.json', jsonBytes(checksums))
  const ordered = Object.fromEntries([...entries.entries()].sort(([left], [right]) => left.localeCompare(right)))
  const bytes = zipSync(ordered, { level: 6, mtime: fixedDate })
  return { filename: `${entry.caseId}-${entry.version}-community-submission.zip`, bytes, suggestedDirectory, suggestedPullRequestTitle, suggestedPullRequestBody, entry }
}
