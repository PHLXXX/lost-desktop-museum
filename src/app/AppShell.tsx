import { lazy, Suspense, useEffect, useState } from 'react'
import { BootScreen } from '../features/boot/BootScreen'
import { Desktop } from '../features/desktop/Desktop'
import { CaseDetail } from '../features/museum/CaseDetail'
import { MuseumHome } from '../features/museum/MuseumHome'
import { ResultScreen } from '../features/result/ResultScreen'
import { registerInstalledCase } from '../cases/registry'
import { caseRepository } from '../storage/caseRepository'
import { useGameStore } from '../store/gameStore'
import { useWindowStore } from '../store/windowStore'
import type { AppPhase } from './appPhase'
import { LazyRouteBoundary } from './LazyRouteBoundary'

const WorkshopEntry = lazy(() => import('../editor/entry/WorkshopEntry'))
const CommunityEntry = lazy(() => import('../community/features/CommunityEntry'))

function routeFromHash(): { phase: AppPhase; communityCaseId: string | null; localCaseId: string | null } {
  if (typeof window === 'undefined') return { phase: 'museum', communityCaseId: null, localCaseId: null }
  const community = window.location.hash.match(/^#\/community\/cases\/([a-z0-9-]+)$/)
  if (community) return { phase: 'community', communityCaseId: community[1]!, localCaseId: null }
  if (window.location.hash === '#/community') return { phase: 'community', communityCaseId: null, localCaseId: null }
  if (window.location.hash === '#/workshop') return { phase: 'workshop', communityCaseId: null, localCaseId: null }
  const local = window.location.hash.match(/^#\/cases\/([a-z0-9-]+)$/)
  return local ? { phase: 'museum', communityCaseId: null, localCaseId: local[1]! } : { phase: 'museum', communityCaseId: null, localCaseId: null }
}

export function AppShell() {
  const initial = routeFromHash()
  const [phase, setPhase] = useState<AppPhase>(initial.phase)
  const [communityCaseId, setCommunityCaseId] = useState<string | null>(initial.communityCaseId)
  const updateSettings = useGameStore((state) => state.updateSettings)
  const markCaseStarted = useGameStore((state) => state.markCaseStarted)
  const activateCase = useGameStore((state) => state.activateCase)
  const selectCase = (caseId: string, nextPhase: AppPhase) => {
    if (useGameStore.getState().caseId !== caseId) activateCase(caseId)
    useWindowStore.getState().hydrateWindows()
    setPhase(nextPhase)
  }
  const navigate = (next: AppPhase, hash: string) => { window.location.hash = hash; setPhase(next) }
  useEffect(() => {
    let active = true
    const applyRoute = () => {
      const route = routeFromHash()
      if (route.phase === 'community') { setCommunityCaseId(route.communityCaseId); setPhase('community'); return }
      if (route.phase === 'workshop') { setPhase('workshop'); return }
      if (!route.localCaseId) { if (window.location.hash === '#/museum') setPhase('museum'); return }
      void caseRepository.get(route.localCaseId).then((definition) => {
        if (definition) registerInstalledCase(definition)
        if (!active) return
        try { if (useGameStore.getState().caseId !== route.localCaseId) activateCase(route.localCaseId!); useWindowStore.getState().hydrateWindows(); setPhase('case-detail') } catch { setPhase('museum') }
      })
    }
    void Promise.resolve().then(applyRoute)
    window.addEventListener('hashchange', applyRoute)
    return () => { active = false; window.removeEventListener('hashchange', applyRoute) }
  // Hash navigation is an external browser subscription; store actions are stable.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  if (phase === 'museum') return <MuseumHome onOpenCase={(caseId) => { window.location.hash = `#/cases/${caseId}`; selectCase(caseId, 'case-detail') }} onContinue={(caseId) => { window.history.replaceState(null, '', `#/cases/${caseId}`); selectCase(caseId, 'investigation') }} onOpenCommunity={(caseId) => { setCommunityCaseId(caseId ?? null); navigate('community', caseId ? `#/community/cases/${caseId}` : '#/community') }} onOpenWorkshop={() => navigate('workshop', '#/workshop')} />
  if (phase === 'community') return <LazyRouteBoundary featureName="社区功能" onReturnMuseum={() => navigate('museum', '#/museum')}><Suspense fallback={<main className="workshop-loading" aria-busy="true">正在挂载社区档案…</main>}><CommunityEntry initialCaseId={communityCaseId} onReturnMuseum={() => navigate('museum', '#/museum')} onStartCase={(caseId) => { window.location.hash = `#/cases/${caseId}`; selectCase(caseId, 'case-detail') }} /></Suspense></LazyRouteBoundary>
  if (phase === 'workshop') return <LazyRouteBoundary featureName="档案工坊" onReturnMuseum={() => navigate('museum', '#/museum')}><Suspense fallback={<main className="workshop-loading" aria-busy="true">正在挂载档案工坊…</main>}><WorkshopEntry onReturnMuseum={() => navigate('museum', '#/museum')} /></Suspense></LazyRouteBoundary>
  if (phase === 'case-detail') return <CaseDetail onBack={() => navigate('museum', '#/museum')} onStart={() => setPhase('case-boot')} onContinue={() => setPhase('investigation')} />
  if (phase === 'case-boot') return <BootScreen onEnter={(safeMode) => { markCaseStarted(); updateSettings({ safeMode, anomalies: safeMode ? false : useGameStore.getState().settings.anomalies }); setPhase('investigation') }} />
  if (phase === 'result') return <ResultScreen onReturnMuseum={() => navigate('museum', '#/museum')} onReviewEvidence={() => setPhase('investigation')} />
  return <Desktop onReturnMuseum={() => navigate('museum', '#/museum')} onDeduction={() => setPhase('deduction')} onResult={() => setPhase('result')} />
}
