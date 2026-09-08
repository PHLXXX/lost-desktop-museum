import type { CaseDefinition, InvestigationHintTier } from '../cases/types'
import { resolveInvestigationGameplay } from './defaultGameplay'
import type { GameplaySaveState } from './gameplayContext'

export interface HintViewState {
  id: string
  clueId: string
  label: string
  revealedCount: number
  revealedTiers: InvestigationHintTier[]
  nextTier: InvestigationHintTier | null
  clueComplete: boolean
}

export interface HintState {
  initialPoints: number
  usedPoints: number
  remainingPoints: number
  hints: HintViewState[]
}

export type HintRevealResult =
  | { ok: true; hintId: string; tier: InvestigationHintTier; hintUsage: Record<string, number>; remainingPoints: number }
  | { ok: false; code: 'not-found' | 'clue-complete' | 'fully-revealed' | 'insufficient-points'; reason: string; remainingPoints: number }

function normalizedCount(value: unknown, maximum: number): number {
  return Math.min(maximum, Math.max(0, Math.floor(typeof value === 'number' && Number.isFinite(value) ? value : 0)))
}

export function getHintState(definition: CaseDefinition, save: GameplaySaveState): HintState {
  const gameplay = resolveInvestigationGameplay(definition)
  let usedPoints = 0
  const hints = gameplay.hints.map((hint) => {
    const revealedCount = normalizedCount(save.hintUsage?.[hint.id], hint.tiers.length)
    const revealedTiers = hint.tiers.slice(0, revealedCount)
    usedPoints += revealedTiers.reduce((sum, tier) => sum + tier.cost, 0)
    return {
      id: hint.id,
      clueId: hint.clueId,
      label: hint.label,
      revealedCount,
      revealedTiers,
      nextTier: hint.tiers[revealedCount] ?? null,
      clueComplete: save.discoveredClueIds.includes(hint.clueId),
    }
  })
  return {
    initialPoints: gameplay.initialAnalysisPoints,
    usedPoints,
    remainingPoints: Math.max(0, gameplay.initialAnalysisPoints - usedPoints),
    hints,
  }
}

export function revealNextHint(definition: CaseDefinition, save: GameplaySaveState, hintId: string): HintRevealResult {
  const state = getHintState(definition, save)
  const hint = state.hints.find((candidate) => candidate.id === hintId)
  if (!hint) return { ok: false, code: 'not-found', reason: '该分析提示已不存在。', remainingPoints: state.remainingPoints }
  if (hint.clueComplete) return { ok: false, code: 'clue-complete', reason: '对应线索已经记录，无需再使用提示。', remainingPoints: state.remainingPoints }
  if (!hint.nextTier) return { ok: false, code: 'fully-revealed', reason: '这条记录的分析提示已全部显示。', remainingPoints: state.remainingPoints }
  if (hint.nextTier.cost > state.remainingPoints) return { ok: false, code: 'insufficient-points', reason: '分析点不足，无法显示下一层提示。', remainingPoints: state.remainingPoints }
  return {
    ok: true,
    hintId,
    tier: hint.nextTier,
    hintUsage: { ...(save.hintUsage ?? {}), [hintId]: hint.revealedCount + 1 },
    remainingPoints: state.remainingPoints - hint.nextTier.cost,
  }
}

