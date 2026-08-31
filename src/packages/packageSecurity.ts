export interface PackageEntryMetadata { path: string; compressedSize: number; size: number; encrypted?: boolean; symlink?: boolean }
export interface PackageSecurityIssue { code: 'INVALID_ZIP' | 'PATH_TRAVERSAL' | 'DUPLICATE_PATH' | 'ENTRY_TOO_LARGE' | 'PACKAGE_TOO_LARGE' | 'COMPRESSION_RATIO' | 'FILE_TYPE_BLOCKED' | 'SVG_BLOCKED' | 'ENCRYPTED_ENTRY' | 'SYMLINK_BLOCKED'; path: string; message: string }

const allowedNames = new Set(['manifest.json', 'case.json', 'draft.json', 'project.json', 'checksums.json'])
const allowedAssetExtensions = new Set(['png', 'jpg', 'jpeg', 'webp', 'gif', 'wav', 'mp3', 'ogg', 'txt', 'md'])
export const PACKAGE_LIMITS = { maxEntries: 512, maxEntryBytes: 20 * 1024 * 1024, maxPackageBytes: 60 * 1024 * 1024, maxCompressionRatio: 100 }

function safePath(path: string) {
  return path.length > 0 && !path.includes('\\') && !path.startsWith('/') && !/^[a-z]:/i.test(path) && path.split('/').every((part) => part && part !== '.' && part !== '..')
}

export function validatePackageEntries(entries: PackageEntryMetadata[]): PackageSecurityIssue[] {
  const issues: PackageSecurityIssue[] = []
  const seen = new Set<string>()
  let total = 0
  if (entries.length > PACKAGE_LIMITS.maxEntries) issues.push({ code: 'PACKAGE_TOO_LARGE', path: '$', message: '压缩包文件数量超过安全限制。' })
  for (const entry of entries) {
    const path = entry.path.normalize('NFC')
    if (!safePath(path)) issues.push({ code: 'PATH_TRAVERSAL', path, message: '压缩包包含不安全路径。' })
    if (seen.has(path)) issues.push({ code: 'DUPLICATE_PATH', path, message: '压缩包包含重复路径。' })
    seen.add(path)
    total += entry.size
    if (entry.size > PACKAGE_LIMITS.maxEntryBytes) issues.push({ code: 'ENTRY_TOO_LARGE', path, message: '单个文件超过20MB安全限制。' })
    if (entry.compressedSize > 0 && entry.size / entry.compressedSize > PACKAGE_LIMITS.maxCompressionRatio) issues.push({ code: 'COMPRESSION_RATIO', path, message: '文件压缩比异常，可能是ZIP炸弹。' })
    if (entry.encrypted) issues.push({ code: 'ENCRYPTED_ENTRY', path, message: '不支持加密压缩条目。' })
    if (entry.symlink) issues.push({ code: 'SYMLINK_BLOCKED', path, message: '压缩包不能包含符号链接。' })
    if (!allowedNames.has(path)) {
      if (!path.startsWith('assets/')) issues.push({ code: 'FILE_TYPE_BLOCKED', path, message: '压缩包包含未允许的文件。' })
      const extension = path.split('.').pop()?.toLowerCase() ?? ''
      if (extension === 'svg') issues.push({ code: 'SVG_BLOCKED', path, message: '第三方案件禁止SVG资源。' })
      else if (!allowedAssetExtensions.has(extension)) issues.push({ code: 'FILE_TYPE_BLOCKED', path, message: '资源文件类型不在白名单中。' })
    }
  }
  if (total > PACKAGE_LIMITS.maxPackageBytes) issues.push({ code: 'PACKAGE_TOO_LARGE', path: '$', message: '解压后总大小超过60MB安全限制。' })
  return issues
}

function u16(bytes: Uint8Array, offset: number) { return bytes[offset]! | (bytes[offset + 1]! << 8) }
function u32(bytes: Uint8Array, offset: number) { return (bytes[offset]! | (bytes[offset + 1]! << 8) | (bytes[offset + 2]! << 16) | (bytes[offset + 3]! << 24)) >>> 0 }

export function inspectZipCentralDirectory(bytes: Uint8Array): PackageEntryMetadata[] {
  let eocd = -1
  for (let index = bytes.length - 22; index >= Math.max(0, bytes.length - 65_557); index--) {
    if (u32(bytes, index) === 0x06054b50) { eocd = index; break }
  }
  if (eocd < 0) throw new Error('案件包不是有效ZIP文件。')
  const count = u16(bytes, eocd + 10)
  let offset = u32(bytes, eocd + 16)
  const decoder = new TextDecoder()
  const entries: PackageEntryMetadata[] = []
  for (let index = 0; index < count; index++) {
    if (u32(bytes, offset) !== 0x02014b50) throw new Error('ZIP中央目录损坏。')
    const flags = u16(bytes, offset + 8)
    const compressedSize = u32(bytes, offset + 20)
    const size = u32(bytes, offset + 24)
    const nameLength = u16(bytes, offset + 28)
    const extraLength = u16(bytes, offset + 30)
    const commentLength = u16(bytes, offset + 32)
    const externalAttributes = u32(bytes, offset + 38)
    const path = decoder.decode(bytes.slice(offset + 46, offset + 46 + nameLength))
    const unixMode = externalAttributes >>> 16
    entries.push({ path, compressedSize, size, encrypted: Boolean(flags & 1), symlink: (unixMode & 0o170000) === 0o120000 })
    offset += 46 + nameLength + extraLength + commentLength
  }
  return entries
}

