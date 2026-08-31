import { describe, expect, it } from 'vitest'
import { createRegistryUrlResolver } from './registryUrlResolver'

describe('registry URL resolver', () => {
  const resolver = createRegistryUrlResolver('https://example.test/community/registry/v1/index.json')
  it('resolves registered relative paths inside the fixed registry root', () => {
    expect(resolver.resolve('registry/v1/cases/case-one.json')).toBe('https://example.test/community/registry/v1/cases/case-one.json')
    expect(resolver.resolve('packages/case-one/1.0.0/case-one.ldmcase')).toBe('https://example.test/community/packages/case-one/1.0.0/case-one.ldmcase')
  })
  it.each(['../secret', '/outside', 'https://evil.test/file', 'javascript:alert(1)', 'data:text/plain,no'])('rejects unsafe path %s', (path) => {
    expect(() => resolver.resolve(path)).toThrow(/社区路径|registry|协议|范围/)
  })
  it('allows HTTP only for local fixture development', () => {
    expect(() => createRegistryUrlResolver('http://localhost:5173/community-fixture/registry/v1/index.json')).not.toThrow()
    expect(() => createRegistryUrlResolver('http://registry.example/registry/v1/index.json')).toThrow(/HTTPS|本机/)
  })
})
