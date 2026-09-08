import { beforeEach, describe, expect, it } from 'vitest'
import { caseDefinition } from '../cases/case-001/case'
import type { InvestigationRewardDefinition } from '../cases/types'
import { defaultRewardProfile } from './rewardProfile'
import { useRewardStore } from './rewardStore'

const themeReward: InvestigationRewardDefinition = {
  id: 'night-theme', kind: 'theme', title: '候机厅夜色', description: '主题奖励。', themeId: 'departure-night', requirements: [],
}

describe('reward store', () => {
  beforeEach(() => {
    localStorage.clear()
    useRewardStore.setState({ ...defaultRewardProfile })
    delete document.documentElement.dataset.archiveTheme
  })

  it('rejects a locked theme and equips it after the reward is unlocked', () => {
    expect(useRewardStore.getState().selectTheme('departure-night')).toBe(false)

    expect(useRewardStore.getState().unlock(caseDefinition, [themeReward])).toEqual(['case-001:night-theme'])
    expect(useRewardStore.getState().selectTheme('departure-night')).toBe(true)
    expect(useRewardStore.getState().selectedTheme).toBe('departure-night')
    expect(document.documentElement.dataset.archiveTheme).toBe('departure-night')
  })
})
