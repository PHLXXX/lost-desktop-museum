import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { verifyPackageIntegrity } from './packageIntegrity'

describe('community package integrity', () => {
  it('accepts the registered SHA-256 and rejects a mismatch', async () => {
    const bytes = new Uint8Array(await readFile(resolve('tests/fixtures/community/packages/valid-1.0.0.ldmcase')))
    const hash = 'fb0a4daaa6d2bd0614004c3bbee25b6085f9e4403532ca91c0acc9dcde54897a'
    await expect(verifyPackageIntegrity(bytes, hash, bytes.length)).resolves.toBe(hash)
    await expect(verifyPackageIntegrity(bytes, '0'.repeat(64), bytes.length)).rejects.toThrow(/SHA-256/)
  })
})
