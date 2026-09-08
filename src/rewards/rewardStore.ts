import { create } from 'zustand'
import type { ArchiveThemeId, CaseDefinition, InvestigationRewardDefinition } from '../cases/types'
import { applyArchiveTheme } from './archiveThemes'
import { defaultRewardProfile, loadRewardProfile, recordRewards, saveRewardProfile, type RewardProfile } from './rewardProfile'

type RewardState = RewardProfile & {
  unlock: (definition: CaseDefinition, rewards: InvestigationRewardDefinition[]) => string[]
  selectTheme: (themeId: ArchiveThemeId) => boolean
}

const storage = typeof window === 'undefined' ? undefined : window.localStorage
const loaded = storage ? loadRewardProfile(storage) : { ...defaultRewardProfile, unlocks: [] }

export const useRewardStore = create<RewardState>((set, get) => ({
  ...loaded,
  unlock: (definition, rewards) => {
    const settled = recordRewards(get(), definition, rewards, new Date().toISOString())
    set(settled.profile)
    if (storage) saveRewardProfile(storage, settled.profile)
    return settled.newKeys
  },
  selectTheme: (themeId) => {
    const available = themeId === 'archive-standard' || get().unlocks.some((record) => record.kind === 'theme' && record.themeId === themeId)
    if (!available) return false
    const profile = { version: 1 as const, unlocks: get().unlocks, selectedTheme: themeId }
    set(profile)
    if (storage) saveRewardProfile(storage, profile)
    applyArchiveTheme(themeId)
    return true
  },
}))
