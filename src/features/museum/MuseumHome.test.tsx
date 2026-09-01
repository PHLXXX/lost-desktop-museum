import { render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { caseDefinition as baseDefinition } from '../../cases/case-002/case'
import { registerInstalledCase, unregisterInstalledCase } from '../../cases/registry'
import { communityInstallationRepository } from '../../community/install/communityInstallationRepository'
import type { CommunityInstallationRecord } from '../../community/types/installedCaseSource'
import { caseRepository } from '../../storage/caseRepository'
import { MuseumHome } from './MuseumHome'

const caseId = 'case-community-source-test'
const definition = {
  ...structuredClone(baseDefinition),
  id: caseId,
  title: '来源加载测试案件',
  manifest: { ...structuredClone(baseDefinition.manifest), caseId, title: '来源加载测试案件', author: 'test-author', builtIn: false },
  desktop: { ...structuredClone(baseDefinition.desktop), wallpaperAssetId: undefined },
  assets: [],
  questions: structuredClone(baseDefinition.questions).map((question, index) => ({ ...question, points: [40, 30, 30][index]! })),
}
const installation: CommunityInstallationRecord = {
  caseId,
  installedVersion: '1.0.0',
  packageSha256: 'a'.repeat(64),
  publisherId: 'ldm-team',
  registrySource: 'https://example.test/registry/v1/index.json',
  registryVersion: '1.0.0',
  installedAt: '2026-09-01T00:00:00.000Z',
  updatedAt: '2026-09-01T00:00:00.000Z',
  lastUpdateCheckAt: null,
  packageBlob: new Blob(['package']),
  rollbackVersions: [],
}

describe('MuseumHome case sources', () => {
  afterEach(async () => {
    vi.restoreAllMocks()
    unregisterInstalledCase(caseId)
    await caseRepository.remove(caseId)
    await communityInstallationRepository.delete(caseId)
  })

  it('does not mislabel a community case as a local import while source records load', async () => {
    await caseRepository.install(definition)
    registerInstalledCase(definition)
    let releaseInstallations!: (records: CommunityInstallationRecord[]) => void
    vi.spyOn(communityInstallationRepository, 'list').mockReturnValue(new Promise((resolve) => { releaseInstallations = resolve }))

    render(<MuseumHome onOpenCase={() => undefined} onContinue={() => undefined} onOpenCommunity={() => undefined} />)
    const row = screen.getByRole('region', { name: '来源加载测试案件' })
    expect(within(row).queryByText('本地导入')).not.toBeInTheDocument()
    expect(within(row).getByText('正在确认来源')).toBeInTheDocument()

    releaseInstallations([installation])
    await waitFor(() => expect(within(row).getByText('社区档案')).toBeInTheDocument())
  })
})
