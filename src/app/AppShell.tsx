import { useState } from 'react'
import { BootScreen } from '../features/boot/BootScreen'
import { Desktop } from '../features/desktop/Desktop'
import { CaseDetail } from '../features/museum/CaseDetail'
import { MuseumHome } from '../features/museum/MuseumHome'
import { ResultScreen } from '../features/result/ResultScreen'
import { useGameStore } from '../store/gameStore'
import type { AppPhase } from './appPhase'

export function AppShell() {
  const [phase, setPhase] = useState<AppPhase>('museum')
  const updateSettings = useGameStore((state) => state.updateSettings)
  const markCaseStarted = useGameStore((state) => state.markCaseStarted)
  if (phase === 'museum') return <MuseumHome onOpenCase={() => setPhase('case-detail')} onContinue={() => setPhase('investigation')} />
  if (phase === 'case-detail') return <CaseDetail onBack={() => setPhase('museum')} onStart={() => setPhase('case-boot')} onContinue={() => setPhase('investigation')} />
  if (phase === 'case-boot') return <BootScreen onEnter={(safeMode) => { markCaseStarted(); updateSettings({ safeMode, anomalies: safeMode ? false : useGameStore.getState().settings.anomalies }); setPhase('investigation') }} />
  if (phase === 'result') return <ResultScreen onReturnMuseum={() => setPhase('museum')} onReviewEvidence={() => setPhase('investigation')} />
  return <Desktop onReturnMuseum={() => setPhase('museum')} onDeduction={() => setPhase('deduction')} onResult={() => setPhase('result')} />
}
