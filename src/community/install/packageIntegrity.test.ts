import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { verifyPackageIntegrity } from './packageIntegrity'

describe('community package integrity', () => {
  it('accepts the registered SHA-256 and rejects a mismatch', async () => {
    const bytes = new Uint8Array(await readFile(resolve('tests/fixtures/community/packages/valid-1.0.0.ldmcase')))
    const checksums = JSON.parse(await readFile(resolve('tests/fixtures/community/registry/v1/checksums.json'), 'utf8')) as Record<string, string>
    const hash = checksums['packages/valid-1.0.0.ldmcase']!
    await expect(verifyPackageIntegrity(bytes, hash, bytes.length)).resolves.toBe(hash)
    await expect(verifyPackageIntegrity(bytes, '0'.repeat(64), bytes.length)).rejects.toThrow(/SHA-256/)
  })
})
