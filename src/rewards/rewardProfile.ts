import type { ArchiveThemeId, CaseDefinition, InvestigationRewardDefinition } from '../cases/types'
import { isArchiveThemeId } from './archiveThemes'

export const REWARD_PROFILE_KEY = 'archive-os:reward-profile'

export interface RewardUnlockRecord {
  key: string
  caseId: string
  caseTitle: string
  rewardId: string
  kind: InvestigationRewardDefinition['kind']
  title: string
  description: string
  themeId?: ArchiveThemeId
  unlockedAt: string
}

export interface RewardProfile {
  version: 1
  unlocks: RewardUnlockRecord[]
  selectedTheme: ArchiveThemeId
}

export const defaultRewardProfile: RewardProfile = { version: 1, unlocks: [], selectedTheme: 'archive-standard' }

function normalizeRecord(value: unknown): RewardUnlockRecord | undefined {
  if (!value || typeof value !== 'object') return undefined
  const record = value as Partial<RewardUnlockRecord>
  if (
    typeof record.key !== 'string' || typeof record.caseId !== 'string' || typeof record.caseTitle !== 'string' ||
    typeof record.rewardId !== 'string' || (record.kind !== 'artifact' && record.kind !== 'badge' && record.kind !== 'theme') ||
    typeof record.title !== 'string' || typeof record.description !== 'string' || typeof record.unlockedAt !== 'string'
  ) return undefined
  if (record.kind === 'theme' && !isArchiveThemeId(record.themeId)) return undefined
  return {
    key: record.key,
    caseId: record.caseId,
    caseTitle: record.caseTitle,
    rewardId: record.rewardId,
    kind: record.kind,
    title: record.title,
    description: record.description,
    themeId: record.kind === 'theme' ? record.themeId : undefined,
    unlockedAt: record.unlockedAt,
  }
}

export function loadRewardProfile(storage: Storage): RewardProfile {
  try {
    const raw = storage.getItem(REWARD_PROFILE_KEY)
    if (!raw) return { ...defaultRewardProfile, unlocks: [] }
    const value = JSON.parse(raw) as Partial<RewardProfile>
    const unlocks = Array.isArray(value.unlocks) ? value.unlocks.flatMap((item) => {
      const normalized = normalizeRecord(item)
      return normalized ? [normalized] : []
    }) : []
    const unique = [...new Map(unlocks.map((record) => [record.key, record])).values()]
    return {
      version: 1,
      unlocks: unique,
      selectedTheme: isArchiveThemeId(value.selectedTheme) ? value.selectedTheme : 'archive-standard',
    }
  } catch {
    return { ...defaultRewardProfile, unlocks: [] }
  }
}

export function saveRewardProfile(storage: Storage, profile: RewardProfile): void {
  try {
    storage.setItem(REWARD_PROFILE_KEY, JSON.stringify(profile))
  } catch {
    // Rewards remain available in memory when browser storage is unavailable.
  }
}

export function recordRewards(
  profile: RewardProfile,
  definition: CaseDefinition,
  rewards: InvestigationRewardDefinition[],
  unlockedAt: string,
): { profile: RewardProfile; newKeys: string[] } {
  const known = new Set(profile.unlocks.map((record) => record.key))
  const newRecords = rewards.flatMap((reward) => {
    const key = `${definition.id}:${reward.id}`
    if (known.has(key)) return []
    known.add(key)
    return [{
      key,
      caseId: definition.id,
      caseTitle: definition.title,
      rewardId: reward.id,
      kind: reward.kind,
      title: reward.title,
      description: reward.description,
      themeId: reward.kind === 'theme' ? reward.themeId : undefined,
      unlockedAt,
    } satisfies RewardUnlockRecord]
  })
  return {
    profile: { ...profile, unlocks: [...profile.unlocks, ...newRecords] },
    newKeys: newRecords.map((record) => record.key),
  }
}
