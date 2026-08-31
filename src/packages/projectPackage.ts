import { strFromU8, unzipSync, zipSync } from 'fflate'
import type { AuthoringProject } from '../editor/model/authoringProject'
import { migrateAuthoringProject } from '../editor/model/projectMigrations'
import { validateContentSecurity } from '../engine/validation'
import { inferAssetMime, validateAssetBytes } from './assetContentValidation'
import { inspectZipCentralDirectory, validatePackageEntries } from './packageSecurity'

// ZIP stores local date fields, so use the same wall-clock value everywhere.
const fixedDate = new Date(1980, 0, 1, 0, 0, 0)
const encoder = new TextEncoder()
async function sha256(bytes: Uint8Array) { const digest = await crypto.subtle.digest('SHA-256', bytes.slice().buffer); return [...new Uint8Array(digest)].map((value) => value.toString(16).padStart(2, '0')).join('') }
function bytes(value: unknown) { return encoder.encode(`${JSON.stringify(value, null, 2)}\n`) }

export async function exportProjectPackage(project: AuthoringProject, assets = new Map<string, Uint8Array>()) {
  const securityIssues = validateContentSecurity(project.draft)
  if (securityIssues.length) throw new Error(`工程包含不安全内容：${securityIssues.map((issue) => issue.message).join('；')}`)
  const entries = new Map<string, Uint8Array>()
  entries.set('manifest.json', bytes({ projectFormatVersion: 1, projectId: project.projectId, name: project.name, caseId: project.caseId, createdAt: project.createdAt, updatedAt: project.updatedAt, editorVersion: '0.4.0', assetCount: assets.size }))
  entries.set('project.json', bytes(project))
  entries.set('draft.json', bytes(project.draft))
  for (const ref of project.draft.assets) {
    const path = ref.path.startsWith('assets/') ? ref.path : `assets/${ref.path}`
    const value = assets.get(ref.id) ?? assets.get(path) ?? assets.get(path.replace(/^assets\//, ''))
    if (!value) throw new Error(`工程备份缺少已引用资源：${ref.id}`)
    if (value.length !== ref.size || await sha256(value) !== ref.sha256.toLowerCase()) throw new Error(`工程资源完整性不匹配：${ref.id}`)
    const content = validateAssetBytes(path, ref.mime, value)
    if (!content.valid) throw new Error(content.message)
    entries.set(path, value)
  }
  for (const [sourcePath, value] of assets) {
    const path = sourcePath.startsWith('assets/') ? sourcePath : `assets/${sourcePath}`
    if (entries.has(path)) continue
    const mime = inferAssetMime(path)
    if (!mime) throw new Error(`${path} 的扩展名不在安全白名单中。`)
    const content = validateAssetBytes(path, mime, value)
    if (!content.valid) throw new Error(content.message)
    entries.set(path, value)
  }
  const checksums: Record<string, string> = {}
  for (const path of [...entries.keys()].sort()) checksums[path] = await sha256(entries.get(path)!)
  entries.set('checksums.json', bytes(checksums))
  const ordered = Object.fromEntries([...entries.entries()].sort(([a], [b]) => a.localeCompare(b)))
  const result = { filename: `${project.caseId || 'untitled'}.ldmproject`, bytes: zipSync(ordered, { level: 6, mtime: fixedDate }) }
  await importProjectPackage(result.bytes, result.filename)
  return result
}

export async function importProjectPackage(packageBytes: Uint8Array, filename: string) {
  if (!filename.toLowerCase().endsWith('.ldmproject')) throw new Error('请选择.ldmproject工程备份。')
  const security = validatePackageEntries(inspectZipCentralDirectory(packageBytes))
  if (security.length) throw new Error(`工程包安全校验失败：${security.map((issue) => issue.message).join('；')}`)
  const entries = unzipSync(packageBytes)
  const projectBytes = entries['project.json']; const checksumBytes = entries['checksums.json']
  if (!projectBytes || !checksumBytes) throw new Error('工程包缺少project.json或checksums.json。')
  const checksums = JSON.parse(strFromU8(checksumBytes)) as Record<string, string>
  for (const [path, checksum] of Object.entries(checksums)) { const entry = entries[path]; if (!entry || await sha256(entry) !== checksum) throw new Error(`工程包校验和不匹配：${path}`) }
  const raw = JSON.parse(strFromU8(projectBytes)) as unknown
  const migrated = migrateAuthoringProject(raw)
  if (!migrated.ok) throw new Error(`工程数据无法迁移：${migrated.error}`)
  const securityIssues = validateContentSecurity(migrated.project.draft)
  if (securityIssues.length) throw new Error(`工程包含不安全内容：${securityIssues.map((issue) => issue.message).join('；')}`)
  const assets = new Map(Object.entries(entries).filter(([path]) => path.startsWith('assets/')))
  for (const [path, value] of assets) {
    const mime = inferAssetMime(path)
    if (!mime) throw new Error(`${path} 的扩展名不在安全白名单中。`)
    const content = validateAssetBytes(path, mime, value)
    if (!content.valid) throw new Error(content.message)
  }
  for (const ref of migrated.project.draft.assets) {
    const path = ref.path.startsWith('assets/') ? ref.path : `assets/${ref.path}`
    const value = assets.get(path)
    if (!value) throw new Error(`工程备份缺少已引用资源：${ref.id}`)
    if (value.length !== ref.size || await sha256(value) !== ref.sha256.toLowerCase()) throw new Error(`工程资源完整性不匹配：${ref.id}`)
    const content = validateAssetBytes(path, ref.mime, value)
    if (!content.valid) throw new Error(content.message)
  }
  return { project: migrated.project, assets }
}
