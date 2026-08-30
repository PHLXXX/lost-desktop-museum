import type { ClueDefinition, EvidenceRelation } from '../../cases/types'
import { EvidenceCard } from './EvidenceCard'

type Position = { x: number; y: number }

export function EvidenceCanvas({
  clues,
  pinnedClueIds,
  positions,
  relations,
  zoom,
  onToggle,
  onMove,
  onSelect,
}: {
  clues: ClueDefinition[]
  pinnedClueIds: string[]
  positions: Record<string, Position>
  relations: EvidenceRelation[]
  zoom: number
  onToggle: (id: string) => void
  onMove: (id: string, x: number, y: number) => void
  onSelect: (id: string) => void
}) {
  const visibleIds = new Set(clues.map((clue) => clue.id))
  return (
    <section className="evidence-workspace" aria-label="调查画布">
      <div className="evidence-canvas" style={{ transform: `scale(${zoom})`, transformOrigin: 'top left' }}>
        <svg className="relation-lines" aria-hidden="true">
          {relations.filter((relation) => visibleIds.has(relation.from) && visibleIds.has(relation.to)).map((relation) => {
            const a = positions[relation.from] ?? { x: 40, y: 40 }
            const b = positions[relation.to] ?? { x: 300, y: 220 }
            return (
              <g key={relation.id}>
                <line x1={a.x + 105} y1={a.y + 70} x2={b.x + 105} y2={b.y + 70} />
                <text x={(a.x + b.x) / 2 + 105} y={(a.y + b.y) / 2 + 70}>{relation.type}</text>
              </g>
            )
          })}
        </svg>
        {clues.map((clue, index) => (
          <EvidenceCard
            key={clue.id}
            clue={clue}
            pinned={pinnedClueIds.includes(clue.id)}
            position={positions[clue.id] ?? { x: 26 + (index % 2) * 238, y: 28 + Math.floor(index / 2) * 172 }}
            onToggle={() => onToggle(clue.id)}
            onMove={(x, y) => onMove(clue.id, x, y)}
            onSelect={() => onSelect(clue.id)}
          />
        ))}
      </div>
    </section>
  )
}
