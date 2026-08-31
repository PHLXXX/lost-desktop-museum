import { strFromU8, strToU8, unzipSync, zipSync } from 'fflate'
import { describe, expect, it } from 'vitest'
import { compileCaseDraft } from '../editor/compiler/compileCaseDraft'
import { createMinimalTemplateDraft } from '../editor/model/caseDraft'
import { exportCasePackage, importCasePackage } from './casePackage'
import { validatePackageEntries } from './packageSecurity'
import { InMemoryCaseRepository } from '../storage/caseRepository'

function minimalCase() {
  const result = compileCaseDraft(createMinimalTemplateDraft())
  if (!result.ok) throw new Error('template should compile')
  return result.caseDefinition
}

async function packageFixture() {
  const definition = minimalCase()
  const cover = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, 0])
  const digest = await crypto.subtle.digest('SHA-256', cover.slice().buffer)
  const ref = definition.assets[0]!
  ref.size = cover.length
  ref.sha256 = [...new Uint8Array(digest)].map((value) => value.toString(16).padStart(2, '0')).join('')
  return { definition, assets: new Map([['asset-spare-key-cover', cover]]) }
}

describe('safe .ldmcase packages', () => {
  it('rejects traversal, duplicate, oversized, remote and SVG entries', () => {
    expect(validatePackageEntries([{ path: '../case.json', compressedSize: 1, size: 1 }]).some((issue) => issue.code === 'PATH_TRAVERSAL')).toBe(true)
    expect(validatePackageEntries([{ path: 'case.json', compressedSize: 1, size: 1 }, { path: 'case.json', compressedSize: 1, size: 1 }]).some((issue) => issue.code === 'DUPLICATE_PATH')).toBe(true)
    expect(validatePackageEntries([{ path: 'assets/huge.png', compressedSize: 1, size: 30_000_000 }]).some((issue) => issue.code === 'ENTRY_TOO_LARGE')).toBe(true)
    expect(validatePackageEntries([{ path: 'assets/remote.url', compressedSize: 1, size: 10 }]).some((issue) => issue.code === 'FILE_TYPE_BLOCKED')).toBe(true)
    expect(validatePackageEntries([{ path: 'assets/vector.svg', compressedSize: 1, size: 10 }]).some((issue) => issue.code === 'SVG_BLOCKED')).toBe(true)
  })

  it('exports a deterministic .ldmcase name and round trips the strict case', async () => {
    const { definition, assets } = await packageFixture()
    const first = await exportCasePackage(definition, assets)
    const second = await exportCasePackage(definition, assets)
    expect(first.filename).toBe('case-spare-key-1.0.0.ldmcase')
    expect(first.bytes).toEqual(second.bytes)
    const imported = await importCasePackage(first.bytes, first.filename)
    expect(imported.caseDefinition.title).toBe('消失的备用钥匙')
    expect(imported.caseDefinition.clues).toHaveLength(6)
    expect(imported.warnings).toEqual([])
  })

  it('warns for legacy .lmdcase but always exports .ldmcase', async () => {
    const { definition, assets } = await packageFixture()
    const exported = await exportCasePackage(definition, assets)
    const imported = await importCasePackage(exported.bytes, 'legacy.lmdcase')
    expect(imported.warnings.some((warning) => warning.includes('.ldmcase'))).toBe(true)
    expect(exported.filename.endsWith('.ldmcase')).toBe(true)
  })

  it('rejects invalid signatures and checksum tampering', async () => {
    await expect(importCasePackage(strToU8('not-a-zip'), 'broken.ldmcase')).rejects.toThrow()
    const { definition, assets } = await packageFixture()
    const exported = await exportCasePackage(definition, assets)
    const entries = unzipSync(exported.bytes)
    const parsed = JSON.parse(strFromU8(entries['case.json']!)) as Record<string, unknown>
    parsed.title = '被篡改'
    entries['case.json'] = strToU8(JSON.stringify(parsed))
    const tampered = zipSync(entries, { mtime: new Date('1980-01-01T00:00:00Z') })
    await expect(importCasePackage(tampered, 'tampered.ldmcase')).rejects.toThrow(/校验和/)
  })

  it('rejects executable and remote case content before export', async () => {
    const remote = minimalCase()
    remote.assets = [{ id: 'bad', kind: 'image', mime: 'image/png', path: 'https://example.com/a.png', size: 1, sha256: '0'.repeat(64), alt: 'bad' }]
    await expect(exportCasePackage(remote, new Map())).rejects.toThrow(/远程|校验/)
    const scripted = { ...minimalCase(), script: 'globalThis.pwned=true' }
    await expect(exportCasePackage(scripted, new Map())).rejects.toThrow(/可执行|校验/)
  })

  it('rejects asset bytes that do not match the declared hash', async () => {
    const { definition } = await packageFixture()
    await expect(exportCasePackage(definition, new Map([['asset-spare-key-cover', strToU8('not-the-cover')]]))).rejects.toThrow(/大小|哈希/)
  })

  it('rejects an asset whose bytes do not match its declared media type', async () => {
    const { definition } = await packageFixture()
    const disguised = strToU8('MZ executable data')
    const digest = await crypto.subtle.digest('SHA-256', disguised.slice().buffer)
    definition.assets[0]!.size = disguised.length
    definition.assets[0]!.sha256 = [...new Uint8Array(digest)].map((value) => value.toString(16).padStart(2, '0')).join('')
    await expect(exportCasePackage(definition, new Map([['asset-spare-key-cover', disguised]]))).rejects.toThrow(/文件签名/)
  })

  it('installs and removes user cases without allowing built-in replacement', async () => {
    const repository = new InMemoryCaseRepository()
    const definition = minimalCase()
    await repository.install(definition)
    expect((await repository.list())[0]?.id).toBe('case-spare-key')
    await expect(repository.install({ ...definition, id: 'case-001', manifest: { ...definition.manifest, caseId: 'case-001' } })).rejects.toThrow(/内置/)
    await repository.remove(definition.id)
    expect(await repository.list()).toEqual([])
  })
})
