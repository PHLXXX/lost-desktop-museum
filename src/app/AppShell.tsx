import { lazy, Suspense, useState } from 'react'
import { BootScreen } from '../features/boot/BootScreen'
import { Desktop } from '../features/desktop/Desktop'
import { CaseDetail } from '../features/museum/CaseDetail'
import { MuseumHome } from '../features/museum/MuseumHome'
import { ResultScreen } from '../features/result/ResultScreen'
import { useGameStore } from '../store/gameStore'
import { useWindowStore } from '../store/windowStore'
import type { AppPhase } from './appPhase'

const WorkshopEntry = lazy(() => import('../editor/entry/WorkshopEntry'))

export function AppShell() {
  const [phase, setPhase] = useState<AppPhase>('museum')
  const updateSettings = useGameStore((state) => state.updateSettings)
  const markCaseStarted = useGameStore((state) => state.markCaseStarted)
  const activateCase = useGameStore((state) => state.activateCase)
  const selectCase = (caseId: string, nextPhase: AppPhase) => {
    if (useGameStore.getState().caseId !== caseId) activateCase(caseId)
    useWindowStore.getState().hydrateWindows()
    setPhase(nextPhase)
  }
  if (phase === 'museum') return <MuseumHome onOpenCase={(caseId) => selectCase(caseId, 'case-detail')} onContinue={(caseId) => selectCase(caseId, 'investigation')} onOpenWorkshop={() => setPhase('workshop')} />
  if (phase === 'workshop') return <Suspense fallback={<main className="workshop-loading" aria-busy="true">正在挂载档案工坊…</main>}><WorkshopEntry onReturnMuseum={() => setPhase('museum')} /></Suspense>
  if (phase === 'case-detail') return <CaseDetail onBack={() => setPhase('museum')} onStart={() => setPhase('case-boot')} onContinue={() => setPhase('investigation')} />
  if (phase === 'case-boot') return <BootScreen onEnter={(safeMode) => { markCaseStarted(); updateSettings({ safeMode, anomalies: safeMode ? false : useGameStore.getState().settings.anomalies }); setPhase('investigation') }} />
  if (phase === 'result') return <ResultScreen onReturnMuseum={() => setPhase('museum')} onReviewEvidence={() => setPhase('investigation')} />
  return <Desktop onReturnMuseum={() => setPhase('museum')} onDeduction={() => setPhase('deduction')} onResult={() => setPhase('result')} />
}
