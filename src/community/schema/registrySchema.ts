import { z } from 'zod'
import type { CommunityCaseDetail, CommunityCatalogEntry, CommunityPublisher, CommunityRegistryIndex } from '../types/communityTypes'

const semver = z.string().regex(/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/)
const identifier = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).min(3).max(80)
const publisherIdentifier = identifier.max(40).refine((value) => !new Set(['admin', 'builtin', 'official', 'system']).has(value), '发布者ID为保留名称')
const isoDate = z.string().datetime({ offset: true })
const httpsUrl = z.string().url().refine((value) => new URL(value).protocol === 'https:', '外部链接只允许HTTPS')
const relativePath = z.string().min(1).refine((value) => {
  if (value.includes('\\') || value.startsWith('/') || /^[a-z][a-z0-9+.-]*:/i.test(value)) return false
  return value.split('/').every((part) => part.length > 0 && part !== '.' && part !== '..')
}, '路径必须是安全的registry相对路径')
const difficulty = z.enum(['easy', 'normal', 'hard'])
const contentRating = z.enum(['general', 'teen', 'mature'])
const status = z.enum(['active', 'deprecated', 'blocked'])
const minutes = z.object({ min: z.number().int().positive(), max: z.number().int().positive() }).strict().refine((value) => value.max >= value.min, '最长时长不能小于最短时长')
const languageList = z.array(z.string().min(2)).max(20)
const safeText = z.string().refine((value) => !/<\/?(?:script|iframe|object|embed|style|link)\b|javascript:/i.test(value), '文本包含不安全标记')

export const publisherSchema = z.object({
  schemaVersion: z.literal(1), publisherId: publisherIdentifier, displayName: safeText.min(1).max(100), description: safeText.max(2000),
  githubUsername: z.string().regex(/^[A-Za-z0-9](?:[A-Za-z0-9-]{0,37}[A-Za-z0-9])?$/).optional(), repositoryUrl: httpsUrl.optional(), avatarPath: relativePath.optional(),
  languages: languageList.min(1), links: z.array(z.object({ label: safeText.min(1).max(80), url: httpsUrl }).strict()).max(10), joinedAt: isoDate, status: z.enum(['active', 'suspended']),
}).strict()

const summarySchema = z.object({
  caseId: identifier, latestVersion: semver, publisherId: publisherIdentifier, title: safeText.min(1).max(160), subtitle: safeText.max(200).optional(), summary: safeText.min(1).max(2000),
  language: z.string().min(2), additionalLanguages: languageList, difficulty, estimatedMinutes: minutes, tags: z.array(safeText.min(1).max(40)).max(20), contentRating,
  contentWarnings: z.array(safeText.max(200)).max(20), coverPath: relativePath.optional(), status, curated: z.boolean(), featured: z.boolean(), publishedAt: isoDate, updatedAt: isoDate, detailPath: relativePath,
}).strict()

export const registryIndexSchema = z.object({
  schemaVersion: z.literal(1), registryVersion: semver, generatedAt: isoDate, sourceCommit: z.string().min(1).max(100),
  engineCompatibility: z.object({ minimumClientVersion: semver }).strict(),
  stats: z.object({ activeCases: z.number().int().nonnegative(), publishers: z.number().int().nonnegative(), languages: z.number().int().nonnegative(), totalPackageBytes: z.number().int().nonnegative() }).strict(),
  featuredCaseIds: z.array(identifier), cases: z.array(summarySchema),
}).strict().superRefine((value, context) => {
  const caseIds = new Set<string>()
  value.cases.forEach((item, index) => {
    if (caseIds.has(item.caseId)) context.addIssue({ code: 'custom', path: ['cases', index, 'caseId'], message: '案件ID重复' })
    caseIds.add(item.caseId)
    if (!item.detailPath.endsWith(`/cases/${item.caseId}.json`)) context.addIssue({ code: 'custom', path: ['cases', index, 'detailPath'], message: '详情路径必须与案件ID一致' })
  })
  value.featuredCaseIds.forEach((caseId, index) => { if (!caseIds.has(caseId)) context.addIssue({ code: 'custom', path: ['featuredCaseIds', index], message: '精选案件ID不存在' }) })
  if (value.stats.activeCases !== value.cases.filter((item) => item.status === 'active').length) context.addIssue({ code: 'custom', path: ['stats', 'activeCases'], message: '活跃案件统计与目录不一致' })
})

const saveCompatibilitySchema = z.object({ mode: z.enum(['compatible', 'requires-review', 'incompatible']), compatibleFromVersions: z.array(semver), notes: safeText.max(1000).optional() }).strict()
const licenseSchema = z.object({ name: safeText.min(1).max(100), url: httpsUrl.optional(), customTextPath: relativePath.optional() }).strict()
const caseVersionSchema = z.object({
  version: semver, packagePath: relativePath, packageSha256: z.string().regex(/^[a-f0-9]{64}$/), packageByteSize: z.number().int().positive().max(30 * 1024 * 1024),
  engineCompatibility: z.object({ minimum: semver, maximumExclusive: semver.optional() }).strict(), saveCompatibility: saveCompatibilitySchema,
  changelog: safeText.min(1).max(20_000), screenshots: z.array(relativePath).min(1).max(5), license: licenseSchema,
  automatedValidation: z.object({ passed: z.literal(true), checkedAt: isoDate }).strict(), publishedAt: isoDate, updatedAt: isoDate,
}).strict()

export const communityCaseDetailSchema = z.object({
  schemaVersion: z.literal(1), caseId: identifier, publisherId: publisherIdentifier, title: safeText.min(1).max(160), subtitle: safeText.max(200).optional(), summary: safeText.min(1).max(5000),
  language: z.string().min(2), additionalLanguages: languageList, difficulty, estimatedMinutes: minutes, tags: z.array(safeText.min(1).max(40)).max(20), contentRating,
  contentWarnings: z.array(safeText.max(200)).max(20), status, blockReason: safeText.max(1000).optional(), curated: z.boolean(), featured: z.boolean(),
  publisherPath: relativePath, latestVersion: semver, versions: z.array(caseVersionSchema).min(1),
}).strict().superRefine((value, context) => {
  const versions = new Set<string>()
  value.versions.forEach((item, index) => {
    if (versions.has(item.version)) context.addIssue({ code: 'custom', path: ['versions', index, 'version'], message: '案件版本重复' })
    versions.add(item.version)
  })
  if (!versions.has(value.latestVersion)) context.addIssue({ code: 'custom', path: ['latestVersion'], message: '最新版本必须存在于版本历史中' })
  if (!value.publisherPath.endsWith(`/publishers/${value.publisherId}.json`)) context.addIssue({ code: 'custom', path: ['publisherPath'], message: '发布者路径必须与发布者ID一致' })
  if (value.status === 'blocked' && !value.blockReason?.trim()) context.addIssue({ code: 'custom', path: ['blockReason'], message: '被阻止案件必须提供原因' })
})

export const catalogEntrySchema = z.object({
  schemaVersion: z.literal(1), caseId: identifier, version: semver, publisherId: publisherIdentifier, title: safeText.min(1).max(160), subtitle: safeText.max(200).optional(), summary: safeText.min(1).max(5000),
  language: z.string().min(2), additionalLanguages: languageList, difficulty, estimatedMinutes: minutes, tags: z.array(safeText.min(1).max(40)).max(20), contentRating, contentWarnings: z.array(safeText.max(200)).max(20),
  engineCompatibility: z.object({ minimum: semver, maximumExclusive: semver.optional() }).strict(), packageFile: relativePath, changelogFile: relativePath, screenshotFiles: z.array(relativePath).min(1).max(5),
  license: z.object({ name: safeText.min(1).max(100), url: httpsUrl.optional(), customTextFile: relativePath.optional() }).strict(), distributionConsent: z.literal(true), saveCompatibility: saveCompatibilitySchema,
  status, moderation: z.object({ automatedValidationRequired: z.literal(true), curated: z.boolean(), featured: z.boolean(), notes: safeText.max(1000).optional() }).strict(), publishedAt: isoDate, updatedAt: isoDate,
}).strict()

function parseWithMessage<T>(schema: z.ZodType<T>, value: unknown, label: string): T {
  const result = schema.safeParse(value)
  if (!result.success) throw new Error(`${label}无效：${result.error.issues.map((issue) => `${issue.path.join('.') || '$'} ${issue.message}`).join('；')}`)
  return result.data
}

export function parseCommunityRegistryIndex(value: unknown): CommunityRegistryIndex {
  if (value && typeof value === 'object' && 'schemaVersion' in value && (value as { schemaVersion?: unknown }).schemaVersion !== 1) throw new Error('社区目录版本过新，当前客户端只支持Schema v1。')
  return parseWithMessage(registryIndexSchema, value, '社区目录数据')
}
export function parseCommunityPublisher(value: unknown): CommunityPublisher { return parseWithMessage(publisherSchema, value, '发布者资料') }
export function parseCommunityCaseDetail(value: unknown): CommunityCaseDetail { return parseWithMessage(communityCaseDetailSchema, value, '社区案件详情') }
export function parseCommunityCatalogEntry(value: unknown): CommunityCatalogEntry { return parseWithMessage(catalogEntrySchema, value, '社区投稿条目') }
