import { strFromU8, unzipSync, zipSync } from 'fflate'
import { caseDefinitionSchema } from '../cases/schema'
import type { CaseDefinition } from '../cases/types'
import { validateCaseDefinition } from '../engine/validation'
import { validateAssetBytes } from './assetContentValidation'
import { inspectZipCentralDirectory, validatePackageEntries } from './packageSecurity'

interface CasePackageManifest { packageFormatVersion: 1; kind: 'ldmcase'; caseId: string; version: string; title: string; createdAt: string; assetCount: number }
export interface ExportedPackage { filename: string; bytes: Uint8Array }
export interface ImportedCasePackage { caseDefinition: CaseDefinition; manifest: CasePackageManifest; assets: Map<string, Uint8Array>; warnings: string[] }

const fixedDate = new Date('1980-01-01T00:00:00Z')
const encoder = new TextEncoder()

function jsonBytes(value: unknown) { return encoder.encode(`${JSON.stringify(value, null, 2)}\n`) }
async function sha256(bytes: Uint8Array) {
  const digest = await crypto.subtle.digest('SHA-256', bytes.slice().buffer)
  return [...new Uint8Array(digest)].map((value) => value.toString(16).padStart(2, '0')).join('')
}
function safeFilename(value: string) { return value.toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '') || 'case' }
function safeVersion(value: string) { return value.replace(/[^0-9A-Za-z.+-]+/g, '-').replace(/^-+|-+$/g, '') || '1.0.0' }
function throwIssues(prefix: string, messages: string[]): never { throw new Error(`${prefix}：${messages.join('；')}`) }

export async function exportCasePackage(definition: CaseDefinition, assetData: Map<string, Uint8Array>): Promise<ExportedPackage> {
  const validation = validateCaseDefinition(definition).filter((issue) => issue.severity === 'error')
  if (validation.length) throwIssues('案件校验失败', validation.map((issue) => issue.message))
  if (definition.manifest.builtIn) throw new Error('内置案件不能直接作为第三方案件覆盖导出，请先复制并修改caseId。')
  const entries = new Map<string, Uint8Array>()
  const manifest: CasePackageManifest = { packageFormatVersion: 1, kind: 'ldmcase', caseId: definition.id, version: definition.manifest.version, title: definition.title, createdAt: definition.manifest.archivedAt, assetCount: definition.assets.length }
  entries.set('manifest.json', jsonBytes(manifest))
  entries.set('case.json', jsonBytes(definition))
  for (const asset of definition.assets) {
    if (asset.mime === 'image/svg+xml' || asset.path.toLowerCase().endsWith('.svg')) throw new Error('第三方案件禁止SVG资源。')
    const bytes = assetData.get(asset.id) ?? assetData.get(asset.path)
    if (!bytes) throw new Error(`缺少已引用资源：${asset.id}`)
    if (bytes.length !== asset.size) throw new Error(`资源大小与声明不一致：${asset.id}`)
    if (await sha256(bytes) !== asset.sha256.toLowerCase()) throw new Error(`资源哈希与声明不一致：${asset.id}`)
    const path = asset.path.startsWith('assets/') ? asset.path : `assets/${asset.path}`
    const content = validateAssetBytes(path, asset.mime, bytes)
    if (!content.valid) throw new Error(content.message)
    entries.set(path, bytes)
  }
  const checksums: Record<string, string> = {}
  for (const path of [...entries.keys()].sort()) checksums[path] = await sha256(entries.get(path)!)
  entries.set('checksums.json', jsonBytes(checksums))
  const ordered = Object.fromEntries([...entries.entries()].sort(([left], [right]) => left.localeCompare(right)))
  const metadata = Object.entries(ordered).map(([path, bytes]) => ({ path, compressedSize: bytes.length, size: bytes.length }))
  const security = validatePackageEntries(metadata)
  if (security.length) throwIssues('案件包安全校验失败', security.map((issue) => issue.message))
  const bytes = zipSync(ordered, { level: 6, mtime: fixedDate })
  const result = { filename: `${safeFilename(definition.id)}-${safeVersion(definition.manifest.version)}.ldmcase`, bytes }
  await importCasePackage(result.bytes, result.filename)
  return result
}

export async function importCasePackage(bytes: Uint8Array, filename: string): Promise<ImportedCasePackage> {
  if (!filename.toLowerCase().endsWith('.ldmcase') && !filename.toLowerCase().endsWith('.lmdcase')) throw new Error('请选择.ldmcase案件包。')
  const metadata = inspectZipCentralDirectory(bytes)
  const security = validatePackageEntries(metadata)
  if (security.length) throwIssues('案件包安全校验失败', security.map((issue) => `${issue.path}: ${issue.message}`))
  let unpacked: Record<string, Uint8Array>
  try { unpacked = unzipSync(bytes) } catch { throw new Error('案件包损坏或不是有效ZIP文件。') }
  const manifestBytes = unpacked['manifest.json']
  const caseBytes = unpacked['case.json']
  const checksumBytes = unpacked['checksums.json']
  if (!manifestBytes || !caseBytes || !checksumBytes) throw new Error('案件包缺少manifest、case或checksums文件。')
  let manifest: CasePackageManifest
  let definition: unknown
  let checksums: Record<string, string>
  try {
    manifest = JSON.parse(strFromU8(manifestBytes)) as CasePackageManifest
    definition = JSON.parse(strFromU8(caseBytes)) as unknown
    checksums = JSON.parse(strFromU8(checksumBytes)) as Record<string, string>
  } catch { throw new Error('案件包JSON数据损坏。') }
  if (manifest.kind !== 'ldmcase' || manifest.packageFormatVersion !== 1) throw new Error('不支持的案件包版本。')
  for (const [path, expected] of Object.entries(checksums)) {
    const entry = unpacked[path]
    if (!entry || await sha256(entry) !== expected) throw new Error(`案件包校验和不匹配：${path}`)
  }
  const validation = validateCaseDefinition(definition).filter((issue) => issue.severity === 'error')
  if (validation.length) throwIssues('案件数据校验失败', validation.map((issue) => issue.message))
  const caseDefinition: CaseDefinition = caseDefinitionSchema.parse(definition)
  if (caseDefinition.id !== manifest.caseId) throw new Error('案件包manifest与案件ID不一致。')
  const assets = new Map(Object.entries(unpacked).filter(([path]) => path.startsWith('assets/')))
  const referencedPaths = new Set(caseDefinition.assets.map((asset) => asset.path.startsWith('assets/') ? asset.path : `assets/${asset.path}`))
  if (assets.size !== referencedPaths.size || [...assets.keys()].some((path) => !referencedPaths.has(path))) throw new Error('正式案件包包含未引用资源。')
  for (const asset of caseDefinition.assets) {
    const path = asset.path.startsWith('assets/') ? asset.path : `assets/${asset.path}`
    const bytes = assets.get(path)
    if (!bytes) throw new Error(`案件包缺少已引用资源：${asset.id}`)
    if (bytes.length !== asset.size || await sha256(bytes) !== asset.sha256.toLowerCase()) throw new Error(`案件资源完整性不匹配：${asset.id}`)
    const content = validateAssetBytes(path, asset.mime, bytes)
    if (!content.valid) throw new Error(content.message)
  }
  const warnings = filename.toLowerCase().endsWith('.lmdcase') ? ['旧扩展名.lmdcase已兼容导入；再次导出将统一使用.ldmcase。'] : []
  return { caseDefinition, manifest, assets, warnings }
}
