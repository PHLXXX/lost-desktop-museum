export interface RegistryUrlResolver { indexUrl: string; rootUrl: string; resolve(path: string): string }

export function createRegistryUrlResolver(indexUrl: string): RegistryUrlResolver {
  let index: URL
  try { index = new URL(indexUrl) } catch { throw new Error('社区registry地址无效。') }
  const localHttp = index.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(index.hostname)
  if (index.protocol !== 'https:' && !localHttp) throw new Error('社区registry发布源必须使用HTTPS；HTTP只允许本机开发。')
  if (!index.pathname.endsWith('/registry/v1/index.json')) throw new Error('社区registry地址必须指向registry/v1/index.json。')
  const root = new URL('../../', index)
  const rootPath = root.pathname.endsWith('/') ? root.pathname : `${root.pathname}/`
  return {
    indexUrl: index.toString(), rootUrl: root.toString(),
    resolve(path: string) {
      let decoded: string
      try { decoded = decodeURIComponent(path) } catch { throw new Error('社区路径编码无效。') }
      if (!decoded || decoded.startsWith('/') || decoded.includes('\\') || /^[A-Za-z][A-Za-z0-9+.-]*:/.test(decoded) || decoded.split('/').some((part) => !part || part === '.' || part === '..')) throw new Error('社区路径不在允许的registry范围内。')
      const result = new URL(decoded, root)
      if (result.origin !== index.origin || result.protocol !== index.protocol || !result.pathname.startsWith(rootPath)) throw new Error('社区路径跨越了固定registry范围。')
      return result.toString()
    },
  }
}
