import { access, mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { prepareCommunitySubmissionCli } from './communityPrepareCli'

const temporary: string[] = []
afterEach(async () => { for (const path of temporary.splice(0)) await rm(path, { recursive: true, force: true }) })
describe('community prepare CLI core', () => {
  it('validates in dry-run mode without writing output', async () => {
    const root = await mkdtemp(join(tmpdir(), 'ldm-community-cli-')); temporary.push(root); const output = join(root, 'output')
    const result = await prepareCommunitySubmissionCli({ packagePath: resolve('tests/fixtures/community/packages/valid-1.0.0.ldmcase'), publisherPath: resolve('tests/fixtures/community/catalog/publisher.json'), screenshotsPath: resolve('tests/fixtures/community/screenshots'), outputPath: output, dryRun: true, generatedAt: '2026-08-31T00:00:00.000Z' })
    expect(result.entry.caseId).toBe('case-community-sample-001'); await expect(access(output)).rejects.toThrow()
  })
})
