import { render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { caseDefinition as case001 } from '../../cases/case-001/case'
import { caseDefinition as baseDefinition } from '../../cases/case-002/case'
import { registerInstalledCase, unregisterInstalledCase } from '../../cases/registry'
import { communityInstallationRepository } from '../../community/install/communityInstallationRepository'
import type { CommunityInstallationRecord } from '../../community/types/installedCaseSource'
import { caseRepository } from '../../storage/caseRepository'
import { createFreshSave } from '../../engine/persistence'
import { resolveInvestigationGameplay } from '../../gameplay/defaultGameplay'
import { useGameStore } from '../../store/gameStore'
import { MuseumHome } from './MuseumHome'
import { defaultRewardProfile } from '../../rewards/rewardProfile'
import { useRewardStore } from '../../rewards/rewardStore'
import userEvent from '@testing-library/user-event'

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
  beforeEach(() => {
    localStorage.clear()
    useGameStore.setState({ ...createFreshSave(), saveStatus: 'idle', notice: null, corruptSave: false })
    useRewardStore.setState({ ...defaultRewardProfile, unlocks: [] })
  })

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

  it('shows the best earned investigation mastery for each case', () => {
    const challenges = resolveInvestigationGameplay(case001).challenges
    useGameStore.setState({ bestChallengeIds: challenges.slice(0, 2).map((challenge) => challenge.id) })

    render(<MuseumHome onOpenCase={() => undefined} onContinue={() => undefined} />)

    const row = screen.getByRole('region', { name: case001.title })
    expect(within(row).getByText(`专精 2 / ${challenges.length}`)).toBeInTheDocument()
    expect(within(row).getByText('奖励 0 / 2')).toBeInTheDocument()
  })

  it('opens the completion reward collection from museum navigation', async () => {
    render(<MuseumHome onOpenCase={() => undefined} onContinue={() => undefined} />)

    await userEvent.click(screen.getByRole('button', { name: '馆藏奖励' }))

    expect(screen.getByRole('dialog', { name: '馆藏奖励' })).toBeInTheDocument()
    expect(screen.getByText('通关藏品、专精徽章与可装备主题只保存在本设备。')).toBeInTheDocument()
  })
})
