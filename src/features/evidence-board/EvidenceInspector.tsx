import { useState } from 'react'
import type { ClueDefinition, EvidenceRelation } from '../../cases/types'
import { useGameStore } from '../../store/gameStore'

export function EvidenceInspector({ selected, discoveredClueIds }: { selected?: ClueDefinition; discoveredClueIds: string[] }) {
  const {
    pinnedClueIds,
    evidenceRelations,
    evidenceNotes,
    togglePinned,
    addRelation,
    removeRelation,
    setEvidenceNote,
  } = useGameStore()
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [type, setType] = useState<EvidenceRelation['type']>('相互矛盾')
  const latestRelation = evidenceRelations.at(-1)

  return (
    <aside className="clue-inspector" aria-label="线索详情">
      <header><strong>线索详情</strong><span>{selected?.id ?? '—'}</span></header>
      {selected ? (
        <>
          <h3>{selected.title}</h3><p>{selected.summary}</p>
          <dl>
            <dt>来源</dt><dd>{selected.source}</dd><dt>人物</dt><dd>{selected.people.join('、') || '—'}</dd>
            <dt>时间</dt><dd>{selected.times.join('、') || '—'}</dd><dt>地点</dt><dd>{selected.places.join('、') || '—'}</dd>
            <dt>解释</dt><dd>{selected.explanation}</dd>
          </dl>
          <label className="evidence-note-field">线索备注<textarea aria-label="线索备注" value={evidenceNotes[selected.id] ?? ''} onChange={(event) => setEvidenceNote(selected.id, event.target.value)} /></label>
          <button onClick={() => togglePinned(selected.id)}>{pinnedClueIds.includes(selected.id) ? '取消关键证据' : '标为关键证据'}</button>
        </>
      ) : <div className="empty-state">从左侧选择一条线索</div>}
      <section className="relation-builder">
        <h4>建立关系</h4>
        <select aria-label="关系起点" value={from} onChange={(event) => setFrom(event.target.value)}><option value="">选择证据 A</option>{discoveredClueIds.map((id) => <option key={id}>{id}</option>)}</select>
        <select aria-label="关系类型" value={type} onChange={(event) => setType(event.target.value as EvidenceRelation['type'])}>{['相互矛盾', '相互支持', '时间先后', '同一人物'].map((item) => <option key={item}>{item}</option>)}</select>
        <select aria-label="关系终点" value={to} onChange={(event) => setTo(event.target.value)}><option value="">选择证据 B</option>{discoveredClueIds.map((id) => <option key={id}>{id}</option>)}</select>
        <button disabled={!from || !to || from === to} onClick={() => { addRelation(from, to, type); setFrom(''); setTo('') }}>连接</button>
        <button disabled={!latestRelation} onClick={() => latestRelation && removeRelation(latestRelation.id)}>撤销最近关系</button>
        <ul>{evidenceRelations.map((relation) => <li key={relation.id}><span>{relation.from} / {relation.type} / {relation.to}</span><button aria-label={`删除关系 ${relation.from} ${relation.to}`} onClick={() => removeRelation(relation.id)}>×</button></li>)}</ul>
      </section>
    </aside>
  )
}
