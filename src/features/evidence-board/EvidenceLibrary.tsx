import type { ClueDefinition } from '../../cases/types'

export interface EvidenceFilters {
  source: string
  person: string
  time: string
  place: string
}

export function EvidenceLibrary({
  clues,
  discoveredCount,
  pinnedClueIds,
  selectedId,
  filters,
  onFiltersChange,
  onSelect,
}: {
  clues: ClueDefinition[]
  discoveredCount: number
  pinnedClueIds: string[]
  selectedId: string
  filters: EvidenceFilters
  onFiltersChange: (next: EvidenceFilters) => void
  onSelect: (id: string) => void
}) {
  const update = (key: keyof EvidenceFilters, value: string) => onFiltersChange({ ...filters, [key]: value })
  return (
    <aside className="clue-library" aria-label="线索库">
      <header><strong>线索库</strong><span>{clues.length} / {discoveredCount}</span></header>
      <div className="evidence-filters">
        <select aria-label="来源筛选" value={filters.source} onChange={(event) => update('source', event.target.value)}>
          <option value="">全部来源</option>
          {['mail', 'messages', 'photos', 'browser', 'calendar', 'recycle', 'logs', 'files'].map((item) => <option key={item}>{item}</option>)}
        </select>
        <input aria-label="人物筛选" placeholder="人物" value={filters.person} onChange={(event) => update('person', event.target.value)} />
        <input aria-label="时间筛选" placeholder="时间" value={filters.time} onChange={(event) => update('time', event.target.value)} />
        <input aria-label="地点筛选" placeholder="地点" value={filters.place} onChange={(event) => update('place', event.target.value)} />
      </div>
      <div className="clue-list">
        {clues.map((clue) => (
          <button key={clue.id} data-selected={selectedId === clue.id} onClick={() => onSelect(clue.id)}>
            <span>{clue.id}</span>
            <div><strong>{clue.title}</strong><small>{clue.source} · {clue.people.join('、')}</small></div>
            {pinnedClueIds.includes(clue.id) && <b>关键</b>}
          </button>
        ))}
        {clues.length === 0 && <div className="empty-state">当前筛选没有匹配线索。</div>}
      </div>
    </aside>
  )
}
