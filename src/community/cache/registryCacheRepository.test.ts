import { describe, expect, it } from 'vitest'
import type { KeyValueRepository } from '../../storage/indexedDb'
import fixtureIndex from '../../../tests/fixtures/community/registry/v1/index.json'
import { parseCommunityRegistryIndex } from '../schema/registrySchema'
import { RegistryCacheRepository, type CommunityRegistryCacheRecord } from './registryCacheRepository'

const communityFixtureIndex = parseCommunityRegistryIndex(fixtureIndex)

class MemoryAdapter implements KeyValueRepository<CommunityRegistryCacheRecord> {
  values = new Map<string, CommunityRegistryCacheRecord>()
  async get(key: string) { return this.values.get(key) ?? null }
  async set(key: string, value: CommunityRegistryCacheRecord) { this.values.set(key, value) }
  async delete(key: string) { this.values.delete(key) }
  async list() { return [...this.values.values()] }
}
describe('registry cache', () => {
  it('saves and restores a valid index', async () => {
    const repo = new RegistryCacheRepository(new MemoryAdapter())
    await repo.save('https://example.test/registry/v1/index.json', communityFixtureIndex, '2026-08-31T01:00:00.000Z')
    expect((await repo.load())?.index.cases[0]?.title).toBe('消失的备用钥匙')
  })
  it('backs up corrupt data and returns an empty cache instead of throwing', async () => {
    const adapter = new MemoryAdapter(); await adapter.set('active', { id: 'active', schemaVersion: 1, registryUrl: 'x', registryVersion: '1.0.0', generatedAt: 'bad', sourceCommit: 'x', fetchedAt: 'bad', index: { broken: true } as never, caseDetails: {} })
    const repo = new RegistryCacheRepository(adapter)
    expect(await repo.load()).toBeNull()
    expect(repo.lastCorruptBackup).not.toBeNull()
    expect((await adapter.list()).some((record) => record.id.startsWith('corrupt-'))).toBe(true)
  })
})
