import { useState } from 'react'
import type { InvestigationGameplayDefinition, InvestigationHintDefinition } from '../../../cases/types'
import type { CaseDraft } from '../../model/caseDraft'

type UpdateDraft = (mutator: (draft: CaseDraft) => void, historyKey?: string) => void

function nextHintId(hints: InvestigationHintDefinition[]) {
  let index = hints.length + 1
  while (hints.some((hint) => hint.id === `hint-${index}`)) index += 1
  return `hint-${index}`
}

function newHint(id: string, clueId: string): InvestigationHintDefinition {
  return {
    id,
    clueId,
    label: '未解记录',
    tiers: [
      { id: 'direction', label: '调查方向', text: '提示玩家应留意的信息领域。', cost: 1 },
      { id: 'action', label: '操作建议', text: '提示玩家可以尝试的调查动作。', cost: 1 },
      { id: 'location', label: '精确定位', text: '指出最后需要检查的位置。', cost: 1 },
    ],
  }
}

export function HintEditor({ draft, gameplay, updateDraft }: { draft: CaseDraft; gameplay: InvestigationGameplayDefinition; updateDraft: UpdateDraft }) {
  const [selectedId, setSelectedId] = useState(gameplay.hints[0]?.id ?? null)
  const selected = gameplay.hints.find((hint) => hint.id === selectedId)
  const updateHint = (mutator: (hint: InvestigationHintDefinition) => void, key: string) => updateDraft((next) => {
    const hint = next.gameplay?.hints.find((item) => item.id === selectedId)
    if (hint) mutator(hint)
  }, key)
  const addHint = () => {
    const id = nextHintId(gameplay.hints)
    updateDraft((next) => next.gameplay?.hints.push(newHint(id, next.clues[0]?.id ?? '')), 'gameplay-hint-add')
    setSelectedId(id)
  }

  return <div className="gameplay-author-grid"><aside><button className="gameplay-add-button" disabled={!draft.clues.length} onClick={addHint}>新建提示</button>{!draft.clues.length && <p>请先创建线索。</p>}{gameplay.hints.map((hint) => <button className={selectedId === hint.id ? 'selected' : ''} key={hint.id} onClick={() => setSelectedId(hint.id)}><strong>{hint.label}</strong><small>{hint.clueId || '未选择线索'}</small></button>)}</aside>{selected ? <div className="gameplay-detail"><div className="editor-form"><label>稳定ID<input value={selected.id} readOnly /></label><label>提示线索<select aria-label="提示线索" value={selected.clueId} onChange={(event) => updateHint((hint) => { hint.clueId = event.target.value }, `gameplay.hint.${selected.id}.clue`)}>{draft.clues.map((clue) => <option key={clue.id} value={clue.id}>{clue.title}</option>)}</select></label><label className="wide-field">列表名称<input value={selected.label} onChange={(event) => updateHint((hint) => { hint.label = event.target.value }, `gameplay.hint.${selected.id}.label`)} /></label></div><div className="hint-tier-editor">{selected.tiers.map((tier, index) => <article key={tier.id}><header><span>第 {index + 1} 层</span><strong>{tier.id}</strong></header><label>层级名称<input value={tier.label} onChange={(event) => updateHint((hint) => { hint.tiers[index]!.label = event.target.value }, `gameplay.hint.${selected.id}.tier.${index}.label`)} /></label><label>提示正文<textarea value={tier.text} onChange={(event) => updateHint((hint) => { hint.tiers[index]!.text = event.target.value }, `gameplay.hint.${selected.id}.tier.${index}.text`)} /></label><label>消耗点数<input aria-label={`提示层级 ${index + 1} 消耗`} type="number" min="1" max="9" value={tier.cost} onChange={(event) => updateHint((hint) => { hint.tiers[index]!.cost = Number(event.target.value) }, `gameplay.hint.${selected.id}.tier.${index}.cost`)} /></label></article>)}</div><button className="text-danger" onClick={() => { const nextSelection = gameplay.hints.find((item) => item.id !== selected.id)?.id ?? null; updateDraft((next) => { if (next.gameplay) next.gameplay.hints = next.gameplay.hints.filter((item) => item.id !== selected.id) }, 'gameplay-hint-delete'); setSelectedId(nextSelection) }}>删除提示</button></div> : <div className="gameplay-empty">选择“新建提示”，为某条线索编写三层渐进帮助。</div>}</div>
}
