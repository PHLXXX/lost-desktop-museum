import { useRef } from 'react'
import type { PointerEvent } from 'react'
import type { ClueDefinition } from '../../cases/types'

export function EvidenceCard({ clue, pinned, position, onToggle, onMove }: { clue: ClueDefinition; pinned: boolean; position: { x: number; y: number }; onToggle: () => void; onMove: (x: number, y: number) => void }) {
  const drag = useRef({ pointerId: -1, x: 0, y: 0, originX: 0, originY: 0 })
  const start = (event: PointerEvent<HTMLButtonElement>) => {
    drag.current = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, originX: position.x, originY: position.y }
    event.currentTarget.setPointerCapture?.(event.pointerId)
  }
  const move = (event: PointerEvent<HTMLButtonElement>) => {
    if (drag.current.pointerId !== event.pointerId) return
    onMove(Math.max(0, Math.min(720, drag.current.originX + event.clientX - drag.current.x)), Math.max(0, Math.min(380, drag.current.originY + event.clientY - drag.current.y)))
  }
  return <article className={`evidence-card ${pinned ? 'pinned' : ''}`} style={{ left: position.x, top: position.y }}>
    <button className="card-drag-handle" aria-label={`拖动线索 ${clue.id}`} onPointerDown={start} onPointerMove={move} onPointerUp={() => { drag.current.pointerId = -1 }} onPointerCancel={() => { drag.current.pointerId = -1 }}><span>{clue.id}</span><em>{clue.source}</em><i>⠿</i></button>
    <h4>{clue.title}</h4><p>{clue.summary}</p><small>{clue.people.join(' · ')} / {clue.places.join(' · ')}</small>
    <div className="card-actions"><button aria-label={`标记 ${clue.id} 为关键证据`} onClick={onToggle}>{pinned ? '★ 关键' : '☆ 标为关键'}</button></div>
  </article>
}

