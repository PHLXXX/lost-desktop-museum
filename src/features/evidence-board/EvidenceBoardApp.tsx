import { useEffect, useMemo, useState } from 'react'
import type { EvidenceRelation } from '../../cases/types'
import { caseDefinition } from '../../cases/case-001/case'
import { useGameStore } from '../../store/gameStore'
import { EvidenceCard } from './EvidenceCard'
import { filterEvidenceClues } from './evidenceFilters'
import { clampEvidenceZoom, createEvidenceLayout } from './evidenceHistory'

export function EvidenceBoardApp({
  onDeduction,
  onResult,
}: {
  onDeduction?: () => void
  onResult?: () => void
}) {
  const {
    discoveredClueIds,
    pinnedClueIds,
    evidenceRelations,
    togglePinned,
    addRelation,
    removeRelation,
    setCardPosition,
  } = useGameStore()
  const positions = useGameStore((state) => state.evidenceCardPositions)
  const [filters, setFilters] = useState({ source: '', person: '', time: '', place: '' })
  const [selectedId, setSelectedId] = useState(discoveredClueIds[0] ?? '')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [type, setType] = useState<EvidenceRelation['type']>('相互矛盾')
  const [deducing, setDeducing] = useState(false)
  const [zoom, setZoom] = useState(1)
  const [history, setHistory] = useState<Record<string, { x: number; y: number }>[]>([])
  const clues = useMemo(
    () =>
      filterEvidenceClues(
        caseDefinition.clues.filter((clue) => discoveredClueIds.includes(clue.id)),
        filters,
      ),
    [discoveredClueIds, filters],
  )
  const selected = caseDefinition.clues.find((clue) => clue.id === selectedId)
  const autoLayout = () => {
    setHistory((items) => [...items.slice(-9), { ...positions }])
    Object.entries(createEvidenceLayout(discoveredClueIds)).forEach(([id, position]) => setCardPosition(id, position.x, position.y))
  }
  const undo = () => {
    const previous = history.at(-1)
    if (!previous) return
    Object.entries(previous).forEach(([id, position]) =>
      setCardPosition(id, position.x, position.y),
    )
    setHistory((items) => items.slice(0, -1))
  }
  return (
    <div className="evidence-app-v2" data-testid="evidence-board">
      <header className="evidence-commandbar">
        <div>
          <strong>证据板</strong>
          <span>CASE LD-001 / RELATION WORKSPACE</span>
        </div>
        <button onClick={autoLayout}>自动布局</button>
        <button disabled={!history.length} onClick={undo}>
          撤销
        </button>
        <button onClick={() => setZoom(clampEvidenceZoom(zoom - 0.1))}>−</button>
        <span>{Math.round(zoom * 100)}%</span>
        <button onClick={() => setZoom(clampEvidenceZoom(zoom + 0.1))}>＋</button>
        <button
          onClick={() => {
            setZoom(1)
            setSelectedId('')
          }}
        >
          重置视图
        </button>
        <button
          className="primary-button"
          disabled={discoveredClueIds.length < 6}
          onClick={() => {
            setDeducing(true)
            onDeduction?.()
          }}
        >
          {discoveredClueIds.length < 6
            ? `还需 ${6 - discoveredClueIds.length} 条线索`
            : '打开最终推理'}
        </button>
      </header>
      <div className="evidence-three-pane">
        <aside className="clue-library">
          <header>
            <strong>线索库</strong>
            <span>
              {clues.length} / {discoveredClueIds.length}
            </span>
          </header>
          <div className="evidence-filters">
            <select
              aria-label="来源筛选"
              value={filters.source}
              onChange={(event) =>
                setFilters((value) => ({ ...value, source: event.target.value }))
              }
            >
              <option value="">全部来源</option>
              {[
                'mail',
                'messages',
                'photos',
                'browser',
                'calendar',
                'recycle',
                'logs',
                'files',
              ].map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
            <input
              aria-label="人物筛选"
              placeholder="人物"
              value={filters.person}
              onChange={(event) =>
                setFilters((value) => ({ ...value, person: event.target.value }))
              }
            />
            <input
              aria-label="时间筛选"
              placeholder="时间"
              value={filters.time}
              onChange={(event) => setFilters((value) => ({ ...value, time: event.target.value }))}
            />
            <input
              aria-label="地点筛选"
              placeholder="地点"
              value={filters.place}
              onChange={(event) => setFilters((value) => ({ ...value, place: event.target.value }))}
            />
          </div>
          <div className="clue-list">
            {clues.map((clue) => (
              <button
                key={clue.id}
                data-selected={selectedId === clue.id}
                onClick={() => setSelectedId(clue.id)}
              >
                <span>{clue.id}</span>
                <div>
                  <strong>{clue.title}</strong>
                  <small>
                    {clue.source} · {clue.people.join('、')}
                  </small>
                </div>
                {pinnedClueIds.includes(clue.id) && <b>关键</b>}
              </button>
            ))}
          </div>
        </aside>
        <section className="evidence-workspace">
          <div
            className="evidence-canvas"
            style={{ transform: `scale(${zoom})`, transformOrigin: 'top left' }}
          >
            <svg className="relation-lines" aria-hidden="true">
              {evidenceRelations.map((relation) => {
                const a = positions[relation.from] ?? { x: 40, y: 40 }
                const b = positions[relation.to] ?? { x: 300, y: 220 }
                return (
                  <g key={relation.id}>
                    <line x1={a.x + 105} y1={a.y + 70} x2={b.x + 105} y2={b.y + 70} />
                    <text x={(a.x + b.x) / 2 + 105} y={(a.y + b.y) / 2 + 70}>
                      {relation.type}
                    </text>
                  </g>
                )
              })}
            </svg>
            {clues.map((clue, index) => (
              <EvidenceCard
                key={clue.id}
                clue={clue}
                pinned={pinnedClueIds.includes(clue.id)}
                position={
                  positions[clue.id] ?? {
                    x: 26 + (index % 2) * 238,
                    y: 28 + Math.floor(index / 2) * 172,
                  }
                }
                onToggle={() => togglePinned(clue.id)}
                onMove={(x, y) => setCardPosition(clue.id, x, y)}
                onSelect={() => setSelectedId(clue.id)}
              />
            ))}
          </div>
        </section>
        <aside className="clue-inspector">
          <header>
            <strong>线索详情</strong>
            <span>{selected?.id ?? '—'}</span>
          </header>
          {selected ? (
            <>
              <h3>{selected.title}</h3>
              <p>{selected.summary}</p>
              <dl>
                <dt>来源</dt>
                <dd>{selected.source}</dd>
                <dt>人物</dt>
                <dd>{selected.people.join('、') || '—'}</dd>
                <dt>时间</dt>
                <dd>{selected.times.join('、') || '—'}</dd>
                <dt>地点</dt>
                <dd>{selected.places.join('、') || '—'}</dd>
                <dt>解释</dt>
                <dd>{selected.explanation}</dd>
              </dl>
              <button onClick={() => togglePinned(selected.id)}>
                {pinnedClueIds.includes(selected.id) ? '取消关键证据' : '标为关键证据'}
              </button>
            </>
          ) : (
            <div className="empty-state">从左侧选择一条线索</div>
          )}
          <section className="relation-builder">
            <h4>建立关系</h4>
            <select
              aria-label="关系起点"
              value={from}
              onChange={(event) => setFrom(event.target.value)}
            >
              <option value="">选择证据 A</option>
              {discoveredClueIds.map((id) => (
                <option key={id}>{id}</option>
              ))}
            </select>
            <select
              aria-label="关系类型"
              value={type}
              onChange={(event) => setType(event.target.value as EvidenceRelation['type'])}
            >
              {['相互矛盾', '相互支持', '时间先后', '同一人物'].map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
            <select
              aria-label="关系终点"
              value={to}
              onChange={(event) => setTo(event.target.value)}
            >
              <option value="">选择证据 B</option>
              {discoveredClueIds.map((id) => (
                <option key={id}>{id}</option>
              ))}
            </select>
            <button
              disabled={!from || !to || from === to}
              onClick={() => {
                addRelation(from, to, type)
                setFrom('')
                setTo('')
              }}
            >
              连接
            </button>
            <ul>
              {evidenceRelations.map((relation) => (
                <li key={relation.id}>
                  <span>
                    {relation.from} / {relation.type} / {relation.to}
                  </span>
                  <button
                    aria-label={`删除关系 ${relation.from} ${relation.to}`}
                    onClick={() => removeRelation(relation.id)}
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          </section>
        </aside>
      </div>
      <footer className="app-statusbar">
        <span>已发现 {discoveredClueIds.length} / 12</span>
        <span>关键证据 {pinnedClueIds.length} / 6</span>
        <span>关系 {evidenceRelations.length}</span>
      </footer>
      {deducing && <DeductionDialog onClose={() => setDeducing(false)} onResult={onResult} />}
    </div>
  )
}

function DeductionDialog({ onClose, onResult }: { onClose: () => void; onResult?: () => void }) {
  const { pinnedClueIds, evidenceRelations, submit } = useGameStore()
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [note, setNote] = useState('')
  useEffect(() => {
    const close = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', close)
    return () => window.removeEventListener('keydown', close)
  }, [onClose])
  const contradictionCount = evidenceRelations.filter(
    (relation) => relation.type === '相互矛盾',
  ).length
  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="最终推理">
      <form
        className="deduction-card"
        onSubmit={(event) => {
          event.preventDefault()
          submit(
            caseDefinition.questions.map((question) => answers[question.id] ?? ''),
            note,
          )
          onResult?.()
        }}
      >
        <button type="button" className="modal-close" aria-label="关闭最终推理" onClick={onClose}>
          ×
        </button>
        <h2>重建最后一次登录</h2>
        {caseDefinition.questions.map((question, index) => (
          <fieldset key={question.id}>
            <legend>
              <span>{String(index + 1).padStart(2, '0')}</span>
              {question.prompt}
            </legend>
            {question.options.map((option) => (
              <label key={option.id}>
                <input
                  required
                  type="radio"
                  name={question.id}
                  value={option.id}
                  checked={answers[question.id] === option.id}
                  onChange={() => setAnswers((state) => ({ ...state, [question.id]: option.id }))}
                />
                {option.label}
              </label>
            ))}
          </fieldset>
        ))}
        <section className="deduction-evidence">
          <h3>提交检查</h3>
          <p>
            关键证据：{pinnedClueIds.length}/6 · 矛盾关系：{contradictionCount}
          </p>
        </section>
        <label className="note-field">
          个人推理（只保存在本地）
          <textarea value={note} onChange={(event) => setNote(event.target.value)} />
        </label>
        <button
          className="primary-button"
          disabled={!pinnedClueIds.length || contradictionCount < 1}
        >
          提交推理
        </button>
      </form>
    </div>
  )
}
