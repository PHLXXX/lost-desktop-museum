import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { caseDefinition } from '../../cases/case-001/case'
import { defaultRewardProfile } from '../../rewards/rewardProfile'
import { useRewardStore } from '../../rewards/rewardStore'
import { RewardCollection } from './RewardCollection'

const rewardCase = structuredClone(caseDefinition)
rewardCase.gameplay = {
  ...rewardCase.gameplay!,
  rewards: [{
    id: 'night-theme', kind: 'theme', title: '候机厅夜色', description: '深夜航站楼主题。',
    themeId: 'departure-night', requirements: [{ type: 'score-at-least', value: 90 }],
  }],
}

describe('RewardCollection', () => {
  beforeEach(() => {
    localStorage.clear()
    useRewardStore.setState({ ...defaultRewardProfile, unlocks: [] })
    document.documentElement.dataset.archiveTheme = 'archive-standard'
  })

  it('shows locked rewards and prevents equipping their themes', () => {
    render(<RewardCollection cases={[rewardCase]} />)

    expect(screen.getByText('0 / 1')).toBeInTheDocument()
    expect(screen.getByText('尚未解锁')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '装备 候机厅夜色' })).toBeDisabled()
  })

  it('equips an unlocked theme and identifies it as current', async () => {
    useRewardStore.getState().unlock(rewardCase, rewardCase.gameplay!.rewards!)
    render(<RewardCollection cases={[rewardCase]} />)

    await userEvent.click(screen.getByRole('button', { name: '装备 候机厅夜色' }))

    expect(screen.getByRole('button', { name: '当前使用 候机厅夜色' })).toBeDisabled()
    expect(document.documentElement.dataset.archiveTheme).toBe('departure-night')
  })
})
