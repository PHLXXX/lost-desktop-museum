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
  if (phase === 'museum') return <MuseumHome onOpenCase={() => setPhase('case-detail')} />
  if (phase === 'case-detail') return <CaseDetail onBack={() => setPhase('museum')} onStart={() => setPhase('case-boot')} />
  if (phase === 'case-boot') return <BootScreen onEnter={(safeMode) => { if (safeMode) updateSettings({ anomalies: false }); setPhase('investigation') }} />
  if (phase === 'result') return <ResultScreen onReturnMuseum={() => setPhase('museum')} onReviewEvidence={() => setPhase('investigation')} />
  return <Desktop onReturnMuseum={() => setPhase('museum')} onDeduction={() => setPhase('deduction')} onResult={() => setPhase('result')} />
}
