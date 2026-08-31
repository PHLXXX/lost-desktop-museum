import { describe, expect, it, vi } from 'vitest'
import fixtureIndex from '../../../tests/fixtures/community/registry/v1/index.json'
import fixtureDetail from '../../../tests/fixtures/community/registry/v1/cases/case-community-sample-001.json'
import fixturePublisher from '../../../tests/fixtures/community/registry/v1/publishers/ldm-team.json'
import { InMemoryKeyValueRepository } from '../../storage/indexedDb'
import { RegistryCacheRepository, type CommunityRegistryCacheRecord } from '../cache/registryCacheRepository'
import { CommunityRegistryClient } from './registryClient'

const indexUrl = 'https://registry.example/community/registry/v1/index.json'
const response = (value: unknown) => new Response(JSON.stringify(value), { status: 200, headers: { 'content-type': 'application/json' } })

describe('community registry client', () => {
  it('uses a six-hour cache but still honors manual refresh', async () => {
    const fetcher = vi.fn(async () => response(fixtureIndex)) as unknown as typeof fetch
    const cache = new RegistryCacheRepository(new InMemoryKeyValueRepository<CommunityRegistryCacheRecord>())
    const client = new CommunityRegistryClient(indexUrl, cache, fetcher)
    expect((await client.load({ now: Date.parse('2026-08-31T00:00:00.000Z') })).source).toBe('network')
    expect((await client.load({ now: Date.parse('2026-08-31T05:59:00.000Z') })).source).toBe('cache')
    await client.load({ force: true, now: Date.parse('2026-08-31T06:00:00.000Z') })
    expect(fetcher).toHaveBeenCalledTimes(2)
  })

  it('falls back to the last compatible cache after a network failure', async () => {
    const cache = new RegistryCacheRepository(new InMemoryKeyValueRepository<CommunityRegistryCacheRecord>())
    const online = new CommunityRegistryClient(indexUrl, cache, vi.fn(async () => response(fixtureIndex)) as unknown as typeof fetch)
    await online.load({ now: Date.parse('2026-08-31T00:00:00.000Z') })
    const offline = new CommunityRegistryClient(indexUrl, cache, vi.fn(async () => { throw new Error('offline') }) as unknown as typeof fetch)
    const result = await offline.load({ force: true, now: Date.parse('2026-08-31T07:00:00.000Z') })
    expect(result.source).toBe('cache')
    expect(result.offline).toBe(true)
  })

  it('does not expose a raw browser fetch error when no cache exists', async () => {
    const cache = new RegistryCacheRepository(new InMemoryKeyValueRepository<CommunityRegistryCacheRecord>())
    const client = new CommunityRegistryClient(indexUrl, cache, vi.fn(async () => { throw new TypeError('Failed to fetch') }) as unknown as typeof fetch)

    await expect(client.load({ force: true })).rejects.toThrow('社区目录暂时不可用：网络连接失败，请检查连接后重试。已安装案件仍可正常使用。')
  })

  it('rejects an index that requires a newer client', async () => {
    const future = { ...fixtureIndex, engineCompatibility: { minimumClientVersion: '9.0.0' } }
    const client = new CommunityRegistryClient(indexUrl, new RegistryCacheRepository(new InMemoryKeyValueRepository<CommunityRegistryCacheRecord>()), vi.fn(async () => response(future)) as unknown as typeof fetch)
    await expect(client.load({ force: true })).rejects.toThrow(/客户端|版本/)
  })
  it('rejects a detail whose ID disagrees with the catalog path', async () => {
    const cache = new RegistryCacheRepository(new InMemoryKeyValueRepository<CommunityRegistryCacheRecord>()); const fetcher = vi.fn(async () => response(fixtureIndex))
    const client = new CommunityRegistryClient(indexUrl, cache, fetcher as unknown as typeof fetch); await client.load()
    fetcher.mockResolvedValueOnce(response({ ...fixtureDetail, caseId: 'case-wrong-id' }))
    await expect(client.detail(fixtureIndex.cases[0]!.detailPath, { expectedCaseId: fixtureIndex.cases[0]!.caseId })).rejects.toThrow(/案件ID/)
  })
  it('uses the cached publisher profile when the network is unavailable', async () => {
    const cache = new RegistryCacheRepository(new InMemoryKeyValueRepository<CommunityRegistryCacheRecord>()); const fetcher = vi.fn(async () => response(fixtureIndex))
    const client = new CommunityRegistryClient(indexUrl, cache, fetcher as unknown as typeof fetch); await client.load(); fetcher.mockResolvedValueOnce(response(fixturePublisher))
    await expect(client.publisher('registry/v1/publishers/ldm-team.json', 'ldm-team')).resolves.toMatchObject({ publisherId: 'ldm-team' })
    fetcher.mockRejectedValueOnce(new Error('offline'))
    await expect(client.publisher('registry/v1/publishers/ldm-team.json', 'ldm-team')).resolves.toMatchObject({ displayName: 'Lost Desktop Museum Team' })
  })
})
