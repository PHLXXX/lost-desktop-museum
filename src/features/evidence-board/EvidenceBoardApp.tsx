import { useCallback, useMemo, useState } from 'react'
import { useActiveCaseDefinition } from '../../cases/useActiveCase'
import { caseDisplayId } from '../../cases/casePresentation'
import { useGameStore } from '../../store/gameStore'
import { DeductionDialog } from './DeductionDialog'
import { EvidenceCanvas } from './EvidenceCanvas'
import { EvidenceInspector } from './EvidenceInspector'
import { EvidenceLibrary, type EvidenceFilters } from './EvidenceLibrary'
import { EvidenceToolbar } from './EvidenceToolbar'
import { filterEvidenceClues } from './evidenceFilters'
import { clampEvidenceZoom, createEvidenceLayout } from './evidenceHistory'

export function EvidenceBoardApp({ onDeduction, onResult }: { onDeduction?: () => void; onResult?: () => void }) {
  const caseDefinition = useActiveCaseDefinition()
  const {
    discoveredClueIds,
    pinnedClueIds,
    evidenceRelations,
    evidenceCardPositions: positions,
    deductionDraft,
    togglePinned,
    setCardPosition,
    updateDeductionDraft,
  } = useGameStore()
  const [filters, setFilters] = useState<EvidenceFilters>({ source: '', person: '', time: '', place: '' })
  const [selectedId, setSelectedId] = useState(discoveredClueIds[0] ?? '')
  const [deducing, setDeducing] = useState(false)
  const [zoom, setZoom] = useState(1)
  const [history, setHistory] = useState<Record<string, { x: number; y: number }>[]>([])
  const closeDeduction = useCallback(() => setDeducing(false), [])
  const clues = useMemo(() => filterEvidenceClues(caseDefinition.clues.filter((clue) => discoveredClueIds.includes(clue.id)), filters), [caseDefinition.clues, discoveredClueIds, filters])
  const selected = caseDefinition.clues.find((clue) => clue.id === selectedId)
  const requiredClueCount = Math.min(6, caseDefinition.clues.length)
  const keyEvidenceTarget = Math.min(6, caseDefinition.coreEvidenceIds.length)

  const autoLayout = () => {
    setHistory((items) => [...items.slice(-9), { ...positions }])
    Object.entries(createEvidenceLayout(discoveredClueIds)).forEach(([id, position]) => setCardPosition(id, position.x, position.y))
  }
  const undoLayout = () => {
    const previous = history.at(-1)
    if (!previous) return
    Object.entries(previous).forEach(([id, position]) => setCardPosition(id, position.x, position.y))
    setHistory((items) => items.slice(0, -1))
  }

  return (
    <div className="evidence-app-v2" data-testid="evidence-board">
      <EvidenceToolbar
        discoveredCount={discoveredClueIds.length}
        caseLabel={caseDisplayId(caseDefinition)}
        requiredClueCount={requiredClueCount}
        historyCount={history.length}
        zoom={zoom}
        onAutoLayout={autoLayout}
        onUndoLayout={undoLayout}
        onZoom={(next) => setZoom(clampEvidenceZoom(next))}
        onResetView={() => { setZoom(1); setSelectedId('') }}
        onDeduction={() => { setDeducing(true); onDeduction?.() }}
      />
      <div className="evidence-three-pane">
        <EvidenceLibrary
          clues={clues}
          discoveredCount={discoveredClueIds.length}
          pinnedClueIds={pinnedClueIds}
          selectedId={selectedId}
          filters={filters}
          onFiltersChange={setFilters}
          onSelect={setSelectedId}
        />
        <EvidenceCanvas
          clues={clues}
          pinnedClueIds={pinnedClueIds}
          positions={positions}
          relations={evidenceRelations}
          zoom={zoom}
          onToggle={togglePinned}
          onMove={setCardPosition}
          onSelect={setSelectedId}
        />
        <EvidenceInspector selected={selected} discoveredClueIds={discoveredClueIds} />
      </div>
      <footer className="app-statusbar">
        <span>已发现 {discoveredClueIds.length} / {caseDefinition.clues.length}</span><span>关键证据 {pinnedClueIds.length} / {keyEvidenceTarget}</span><span>关系 {evidenceRelations.length}</span>
      </footer>
      {deducing && <DeductionDialog answers={deductionDraft.answers} note={deductionDraft.note} onAnswersChange={(answers) => updateDeductionDraft({ answers })} onNoteChange={(note) => updateDeductionDraft({ note })} onClose={closeDeduction} onResult={onResult} />}
    </div>
  )
}
