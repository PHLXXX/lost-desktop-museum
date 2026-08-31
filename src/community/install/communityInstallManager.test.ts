import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import detailJson from '../../../tests/fixtures/community/registry/v1/cases/case-community-sample-001.json'
import updateDetailJson from '../../../tests/fixtures/community/scenarios/case-community-sample-001-1.1.0.json'
import { createFreshSave } from '../../engine/persistence'
import { InMemoryCaseRepository } from '../../storage/caseRepository'
import { AssetRepository, type StoredAsset } from '../../storage/assetRepository'
import type { KeyValueRepository } from '../../storage/indexedDb'
import { parseCommunityCaseDetail } from '../schema/registrySchema'
import type { CommunityInstallationRecord } from '../types/installedCaseSource'
import { CommunityInstallationRepository } from './communityInstallationRepository'
import { CommunityInstallManager } from './communityInstallManager'

class MemoryAdapter<T> implements KeyValueRepository<T> { values = new Map<string, T>(); async get(key: string) { return this.values.get(key) ?? null } async set(key: string, value: T) { this.values.set(key, value) } async delete(key: string) { this.values.delete(key) } async list() { return [...this.values.values()] } }
class FailOnceCaseRepository extends InMemoryCaseRepository {
  failNextInstall = false
  override async install(definition: Parameters<InMemoryCaseRepository['install']>[0]) {
    if (this.failNextInstall) { this.failNextInstall = false; throw new Error('simulated storage failure') }
    return super.install(definition)
  }
}
describe('community install transaction', () => {
  it('verifies, installs, records source and uninstalls without touching other records', async () => {
    const cases = new InMemoryCaseRepository(); const assetAdapter = new MemoryAdapter<StoredAsset>(); const installationsAdapter = new MemoryAdapter<CommunityInstallationRecord>()
    const assets = new AssetRepository(assetAdapter); const installations = new CommunityInstallationRepository(installationsAdapter); const manager = new CommunityInstallManager({ cases, assets, installations })
    const detail = parseCommunityCaseDetail(detailJson); const version = detail.versions[0]!; const bytes = new Uint8Array(await readFile(resolve('tests/fixtures/community/packages/valid-1.0.0.ldmcase')))
    const prepared = await manager.prepare(detail, version, bytes); const record = await manager.install(prepared, 'https://example.test/registry/v1/index.json', '1.0.0')
    expect(record.installedVersion).toBe('1.0.0'); expect((await cases.get(detail.caseId))?.title).toBe(detail.title); expect((await installations.get(detail.caseId))?.publisherId).toBe('ldm-team')
    await assets.put({ assetKey: 'case-other:cover', ownerId: 'case-other', path: 'assets/cover.png', mime: 'image/png', size: 1, sha256: '0'.repeat(64), blob: new Blob([new Uint8Array([0])]) })
    await installations.save({ ...record, caseId: 'case-other', packageSha256: '1'.repeat(64) })
    await manager.uninstall(detail.caseId); expect(await cases.get(detail.caseId)).toBeNull(); expect(await installations.get(detail.caseId)).toBeNull()
    expect((await assets.listByOwner('case-other')).map((item) => item.assetKey)).toEqual(['case-other:cover'])
    expect((await installations.get('case-other'))?.packageSha256).toBe('1'.repeat(64))
  })
  it('refuses a hash mismatch before any write', async () => {
    const cases = new InMemoryCaseRepository(); const manager = new CommunityInstallManager({ cases, assets: new AssetRepository(new MemoryAdapter()), installations: new CommunityInstallationRepository(new MemoryAdapter()) })
    const detail = parseCommunityCaseDetail(detailJson); const bytes = new Uint8Array(await readFile(resolve('tests/fixtures/community/packages/valid-1.0.0.ldmcase')))
    await expect(manager.prepare(detail, { ...detail.versions[0]!, packageSha256: '0'.repeat(64) }, bytes)).rejects.toThrow(/SHA-256/)
    expect(await cases.list()).toEqual([])
  })
  it('refuses a package that requires a newer client engine', async () => {
    const manager = new CommunityInstallManager({ cases: new InMemoryCaseRepository(), assets: new AssetRepository(new MemoryAdapter()), installations: new CommunityInstallationRepository(new MemoryAdapter()) })
    const detail = parseCommunityCaseDetail(detailJson); const bytes = new Uint8Array(await readFile(resolve('tests/fixtures/community/packages/valid-1.0.0.ldmcase')))
    await expect(manager.prepare(detail, { ...detail.versions[0]!, engineCompatibility: { minimum: '0.6.0' } }, bytes)).rejects.toThrow(/客户端|引擎/)
  })
  it('keeps a progress snapshot with the previous package before an update', async () => {
    const cases = new InMemoryCaseRepository(); const assets = new AssetRepository(new MemoryAdapter<StoredAsset>()); const installations = new CommunityInstallationRepository(new MemoryAdapter<CommunityInstallationRecord>()); const manager = new CommunityInstallManager({ cases, assets, installations })
    const detail = parseCommunityCaseDetail(updateDetailJson); const first = detail.versions[0]!; const next = detail.versions[1]!
    await manager.install(await manager.prepare(detail, first, new Uint8Array(await readFile(resolve('tests/fixtures/community/packages/valid-1.0.0.ldmcase')))), 'https://example.test/registry/v1/index.json', '1.0.0')
    const progress = { ...createFreshSave(detail.caseId), discoveredClueIds: ['clue-handover'] }
    const record = await manager.install(await manager.prepare(detail, next, new Uint8Array(await readFile(resolve('tests/fixtures/community/packages/valid-1.1.0.ldmcase')))), 'https://example.test/registry/v1/index.json', '1.0.0', { progressSnapshot: progress })
    expect(record.rollbackVersions[0]?.version).toBe('1.0.0')
    expect(record.rollbackVersions[0]?.progressSnapshot?.discoveredClueIds).toEqual(['clue-handover'])
  })
  it('restores the prior case and installation record after an update write fails', async () => {
    const cases = new FailOnceCaseRepository(); const installations = new CommunityInstallationRepository(new MemoryAdapter<CommunityInstallationRecord>()); const manager = new CommunityInstallManager({ cases, assets: new AssetRepository(new MemoryAdapter<StoredAsset>()), installations })
    const detail = parseCommunityCaseDetail(updateDetailJson); const first = detail.versions[0]!; const next = detail.versions[1]!
    await manager.install(await manager.prepare(detail, first, new Uint8Array(await readFile(resolve('tests/fixtures/community/packages/valid-1.0.0.ldmcase')))), 'https://example.test/registry/v1/index.json', '1.0.0')
    cases.failNextInstall = true
    await expect(manager.install(await manager.prepare(detail, next, new Uint8Array(await readFile(resolve('tests/fixtures/community/packages/valid-1.1.0.ldmcase')))), 'https://example.test/registry/v1/index.json', '1.0.0')).rejects.toThrow(/恢复原状态/)
    expect((await cases.get(detail.caseId))?.manifest.version).toBe('1.0.0')
    expect((await installations.get(detail.caseId))?.installedVersion).toBe('1.0.0')
  })
  it('refuses an incompatible rollback without changing the installed version', async () => {
    const cases = new InMemoryCaseRepository(); const installations = new CommunityInstallationRepository(new MemoryAdapter<CommunityInstallationRecord>()); const manager = new CommunityInstallManager({ cases, assets: new AssetRepository(new MemoryAdapter<StoredAsset>()), installations })
    const detail = parseCommunityCaseDetail(updateDetailJson); const first = detail.versions[0]!; const next = detail.versions[1]!
    await manager.install(await manager.prepare(detail, first, new Uint8Array(await readFile(resolve('tests/fixtures/community/packages/valid-1.0.0.ldmcase')))), 'https://example.test/registry/v1/index.json', '1.0.0')
    await manager.install(await manager.prepare(detail, next, new Uint8Array(await readFile(resolve('tests/fixtures/community/packages/valid-1.1.0.ldmcase')))), 'https://example.test/registry/v1/index.json', '1.0.0')
    const incompatibleProgress = { ...createFreshSave(detail.caseId), openedItems: ['item-that-does-not-exist-in-1.0.0'] }
    await expect(manager.rollback(detail.caseId, '1.0.0', detail, incompatibleProgress)).rejects.toThrow(/导出进度|重置/)
    expect((await installations.get(detail.caseId))?.installedVersion).toBe('1.1.0')
    expect((await cases.get(detail.caseId))?.manifest.version).toBe('1.1.0')
  })
  it('restores the progress snapshot stored with a rollback package', async () => {
    const cases = new InMemoryCaseRepository(); const installations = new CommunityInstallationRepository(new MemoryAdapter<CommunityInstallationRecord>()); const manager = new CommunityInstallManager({ cases, assets: new AssetRepository(new MemoryAdapter<StoredAsset>()), installations })
    const detail = parseCommunityCaseDetail(updateDetailJson); const first = detail.versions[0]!; const next = detail.versions[1]!
    await manager.install(await manager.prepare(detail, first, new Uint8Array(await readFile(resolve('tests/fixtures/community/packages/valid-1.0.0.ldmcase')))), 'https://example.test/registry/v1/index.json', '1.0.0')
    const originalProgress = { ...createFreshSave(detail.caseId), discoveredClueIds: ['clue-handover'] }
    await manager.install(await manager.prepare(detail, next, new Uint8Array(await readFile(resolve('tests/fixtures/community/packages/valid-1.1.0.ldmcase')))), 'https://example.test/registry/v1/index.json', '1.0.0', { progressSnapshot: originalProgress })
    const result = await manager.rollback(detail.caseId, '1.0.0', detail, createFreshSave(detail.caseId))
    expect(result.record.installedVersion).toBe('1.0.0')
    expect(result.record.rollbackVersions.map((item) => item.version)).toEqual(['1.1.0'])
    expect(result.restoredProgress?.discoveredClueIds).toEqual(['clue-handover'])
  })
})
