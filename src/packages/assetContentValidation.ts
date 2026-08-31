const MIME_BY_EXTENSION: Record<string, string[]> = {
  png: ['image/png'],
  jpg: ['image/jpeg'],
  jpeg: ['image/jpeg'],
  webp: ['image/webp'],
  wav: ['audio/wav', 'audio/x-wav'],
  ogg: ['audio/ogg', 'application/ogg'],
  txt: ['text/plain'],
  md: ['text/markdown', 'text/plain'],
}

function extensionOf(name: string) {
  return name.split('.').pop()?.toLowerCase() ?? ''
}

function ascii(bytes: Uint8Array, start: number, length: number) {
  return String.fromCharCode(...bytes.slice(start, start + length))
}

function matchesSignature(extension: string, bytes: Uint8Array) {
  switch (extension) {
    case 'png': return bytes.length >= 8 && [137, 80, 78, 71, 13, 10, 26, 10].every((value, index) => bytes[index] === value)
    case 'jpg':
    case 'jpeg': return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff
    case 'webp': return bytes.length >= 12 && ascii(bytes, 0, 4) === 'RIFF' && ascii(bytes, 8, 4) === 'WEBP'
    case 'wav': return bytes.length >= 12 && ascii(bytes, 0, 4) === 'RIFF' && ascii(bytes, 8, 4) === 'WAVE'
    case 'ogg': return bytes.length >= 4 && ascii(bytes, 0, 4) === 'OggS'
    case 'txt':
    case 'md': {
      if (bytes.some((byte) => byte === 0)) return false
      try { new TextDecoder('utf-8', { fatal: true }).decode(bytes); return true } catch { return false }
    }
    default: return false
  }
}

export function inferAssetMime(name: string) {
  return MIME_BY_EXTENSION[extensionOf(name)]?.[0] ?? null
}

export function validateAssetBytes(name: string, mime: string, bytes: Uint8Array) {
  const extension = extensionOf(name)
  const allowedMimes = MIME_BY_EXTENSION[extension]
  if (!allowedMimes) return { valid: false, message: `${name} 的扩展名不在安全白名单中。` }
  if (!allowedMimes.includes(mime.toLowerCase())) return { valid: false, message: `${name} 的MIME类型与扩展名不匹配。` }
  if (!matchesSignature(extension, bytes)) return { valid: false, message: `${name} 的文件签名与声明类型不匹配。` }
  return { valid: true, message: '' }
}

