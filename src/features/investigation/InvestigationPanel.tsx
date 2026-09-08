import { useState } from 'react'
import { useActiveCaseDefinition } from '../../cases/useActiveCase'
import { resolveInvestigationGameplay } from '../../gameplay/defaultGameplay'
import { getHintState, type HintViewState } from '../../gameplay/hintEngine'
import { getObjectiveStates } from '../../gameplay/objectiveEngine'
import { useGameStore } from '../../store/gameStore'
import { ArchiveDialog } from '../system/ArchiveDialog'
import { ChallengeList } from './ChallengeList'
import { HintList } from './HintList'
import { ObjectiveList } from './ObjectiveList'

type InvestigationTab = 'objectives' | 'hints' | 'challenges'

export function InvestigationPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const definition = useActiveCaseDefinition()
  const {
    completedEventKeys,
    discoveredClueIds,
    evidenceRelations,
    triggeredEventIds,
    hintUsage,
    deductionResult,
    bestChallengeIds,
    revealHint,
  } = useGameStore()
  const [tab, setTab] = useState<InvestigationTab>('objectives')
  const [pendingHint, setPendingHint] = useState<HintViewState | null>(null)
  const [hintError, setHintError] = useState('')

  if (!open) return null

  const saveState = { completedEventKeys, discoveredClueIds, evidenceRelations, triggeredEventIds, hintUsage }
  const gameplay = resolveInvestigationGameplay(definition)
  const objectives = getObjectiveStates(definition, saveState)
  const hintState = getHintState(definition, saveState)
  const closePanel = () => {
    setPendingHint(null)
    setHintError('')
    onClose()
  }
  const confirmHint = () => {
    if (!pendingHint) return
    const result = revealHint(pendingHint.id)
    if (!result.ok) {
      setHintError(result.reason)
      return
    }
    setPendingHint(null)
    setHintError('')
  }

  return (
    <>
      <aside className="investigation-panel" role="dialog" aria-modal="false" aria-label="深度调查">
        <header className="investigation-panel-header">
          <div><span>案件辅助台</span><strong>深度调查</strong></div>
          <button aria-label="关闭深度调查" onClick={closePanel} type="button">×</button>
        </header>
        <div className="investigation-tabs" role="tablist" aria-label="深度调查分类">
          <button aria-selected={tab === 'objectives'} onClick={() => setTab('objectives')} role="tab" type="button">调查目标</button>
          <button aria-selected={tab === 'hints'} onClick={() => setTab('hints')} role="tab" type="button">分析提示</button>
          <button aria-selected={tab === 'challenges'} onClick={() => setTab('challenges')} role="tab" type="button">调查挑战</button>
        </div>
        <section className="investigation-panel-body">
          {tab === 'objectives' && <ObjectiveList objectives={objectives} />}
          {tab === 'hints' && (
            <>
              <div className="analysis-balance"><span>分析额度</span><strong>剩余 {hintState.remainingPoints} / {hintState.initialPoints}</strong></div>
              <p className="investigation-muted">提示会逐步从调查方向缩小到精确位置；每次使用都会消耗有限额度。</p>
              {hintError && <p className="investigation-error" role="alert">{hintError}</p>}
              <HintList state={hintState} onRequest={(hint) => { setHintError(''); setPendingHint(hint) }} />
            </>
          )}
          {tab === 'challenges' && (
            <ChallengeList
              challenges={gameplay.challenges}
              earnedIds={deductionResult?.challengeIds ?? []}
              historicalIds={bestChallengeIds}
              settled={Boolean(deductionResult)}
            />
          )}
        </section>
      </aside>
      {pendingHint?.nextTier && (
        <ArchiveDialog
          title="使用分析提示？"
          onClose={() => setPendingHint(null)}
          actions={<><button onClick={() => setPendingHint(null)} type="button">取消</button><button className="primary-button" onClick={confirmHint} type="button">显示提示</button></>}
        >
          <p>即将显示“{pendingHint.nextTier.label}”，消耗 {pendingHint.nextTier.cost} 点分析。</p>
          <p>使用后剩余 {hintState.remainingPoints - pendingHint.nextTier.cost} 点。本次消耗会写入案件存档。</p>
        </ArchiveDialog>
      )}
    </>
  )
}
