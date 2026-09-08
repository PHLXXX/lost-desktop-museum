import { useState } from 'react'
import type { CaseCondition, InvestigationGameplayDefinition, InvestigationObjectiveDefinition } from '../../../cases/types'
import type { CaseDraft } from '../../model/caseDraft'
import { ConditionBuilder } from '../condition-builder/ConditionBuilder'

type UpdateDraft = (mutator: (draft: CaseDraft) => void, historyKey?: string) => void

function nextObjectiveId(objectives: InvestigationObjectiveDefinition[]) {
  let index = objectives.length + 1
  while (objectives.some((objective) => objective.id === `objective-${index}`)) index += 1
  return `objective-${index}`
}

function conditionTargets(draft: CaseDraft) {
  return [
    ...draft.files.map((item) => ({ id: item.id, label: item.name })),
    ...draft.chats.flatMap((thread) => thread.messages.map((item) => ({ id: item.id, label: `${thread.title} · ${item.time}` }))),
    ...draft.emails.map((item) => ({ id: item.id, label: item.subject })),
    ...draft.browserHistory.map((item) => ({ id: item.id, label: item.title })),
    ...draft.calendarEvents.map((item) => ({ id: item.id, label: item.title })),
    ...draft.photos.map((item) => ({ id: item.id, label: item.title })),
    ...draft.systemLogs.map((item) => ({ id: item.id, label: item.eventType })),
    ...draft.audioTracks.map((item) => ({ id: item.id, label: item.title })),
    ...draft.broadcastEvents.map((item) => ({ id: item.id, label: item.title })),
    ...draft.dataTables.map((item) => ({ id: item.id, label: item.title })),
    ...draft.versionDiffs.map((item) => ({ id: item.id, label: item.title })),
    ...draft.sitemap.map((item) => ({ id: item.id, label: item.label })),
  ]
}

export function ObjectiveEditor({ draft, gameplay, updateDraft }: { draft: CaseDraft; gameplay: InvestigationGameplayDefinition; updateDraft: UpdateDraft }) {
  const [selectedId, setSelectedId] = useState(gameplay.objectives[0]?.id ?? null)
  const selected = gameplay.objectives.find((objective) => objective.id === selectedId)
  const targets = conditionTargets(draft)
  const clueIds = draft.clues.map((clue) => clue.id)
  const triggerIds = draft.triggers.map((trigger) => trigger.id)
  const updateObjective = (mutator: (objective: InvestigationObjectiveDefinition) => void, key: string) => updateDraft((next) => {
    const objective = next.gameplay?.objectives.find((item) => item.id === selectedId)
    if (objective) mutator(objective)
  }, key)
  const addObjective = () => {
    const id = nextObjectiveId(gameplay.objectives)
    updateDraft((next) => next.gameplay?.objectives.push({ id, title: '新调查目标', description: '说明玩家需要验证的调查方向。', kind: 'optional', condition: { type: 'clue-count', count: 1 } }), 'gameplay-objective-add')
    setSelectedId(id)
  }

  return <div className="gameplay-author-grid"><aside><button className="gameplay-add-button" onClick={addObjective}>新建目标</button>{gameplay.objectives.map((objective) => <button className={selectedId === objective.id ? 'selected' : ''} key={objective.id} onClick={() => setSelectedId(objective.id)}><strong>{objective.title}</strong><small>{objective.kind === 'primary' ? '主要目标' : '可选目标'} · {objective.id}</small></button>)}</aside>{selected ? <div className="gameplay-detail"><div className="editor-form"><label>稳定ID<input value={selected.id} readOnly /></label><label>目标类型<select value={selected.kind} onChange={(event) => updateObjective((objective) => { objective.kind = event.target.value as InvestigationObjectiveDefinition['kind'] }, `gameplay.objective.${selected.id}.kind`)}><option value="primary">主要目标</option><option value="optional">可选目标</option></select></label><label className="wide-field">目标标题<input value={selected.title} onChange={(event) => updateObjective((objective) => { objective.title = event.target.value }, `gameplay.objective.${selected.id}.title`)} /></label><label className="wide-field">目标说明<textarea value={selected.description} onChange={(event) => updateObjective((objective) => { objective.description = event.target.value }, `gameplay.objective.${selected.id}.description`)} /></label></div><ConditionBuilder condition={selected.condition} targets={targets} clueIds={clueIds} triggerIds={triggerIds} onChange={(condition) => updateObjective((objective) => { objective.condition = condition }, `gameplay.objective.${selected.id}.condition`)} /><label className="check-field gameplay-reveal-toggle"><input type="checkbox" checked={Boolean(selected.revealWhen)} onChange={(event) => updateObjective((objective) => { objective.revealWhen = event.target.checked ? { type: 'clue-count', count: 1 } : undefined }, `gameplay.objective.${selected.id}.reveal`)} />满足条件后才公开目标</label>{selected.revealWhen && <ConditionBuilder condition={selected.revealWhen} targets={targets} clueIds={clueIds} triggerIds={triggerIds} onChange={(condition: CaseCondition) => updateObjective((objective) => { objective.revealWhen = condition }, `gameplay.objective.${selected.id}.reveal-condition`)} />}<button className="text-danger" onClick={() => { const nextSelection = gameplay.objectives.find((item) => item.id !== selected.id)?.id ?? null; updateDraft((next) => { if (next.gameplay) next.gameplay.objectives = next.gameplay.objectives.filter((item) => item.id !== selected.id) }, 'gameplay-objective-delete'); setSelectedId(nextSelection) }}>删除目标</button></div> : <div className="gameplay-empty">尚未创建调查目标。</div>}</div>
}
