import { useEditorStore } from '../../store/editorStore'

export function TimelineEditor() {
  const project = useEditorStore((state) => state.currentProject)
  const updateDraft = useEditorStore((state) => state.updateDraft)
  if (!project) return null
  const sorted = [...project.draft.timeline].sort((a, b) => a.time.localeCompare(b.time))
  return <section className="editor-document"><header><div><span>MASTER TIMELINE</span><h1>时间线</h1><p>用同一时区记录所有关键事件；顺序异常会在校验中心提示。</p></div><button className="primary-button" onClick={() => updateDraft((draft) => { draft.timeline.push({ time: '2032-01-01 12:00', text: '新时间线事件' }) }, 'timeline-add')}>添加事件</button></header><div className="timeline-editor-list">{sorted.map((entry, index) => { const sourceIndex = project.draft.timeline.indexOf(entry); return <article key={`${entry.time}-${index}`}><span>{String(index + 1).padStart(2, '0')}</span><label>时间<input value={entry.time} onChange={(event) => updateDraft((draft) => { draft.timeline[sourceIndex]!.time = event.target.value }, `timeline.${sourceIndex}.time`)} /></label><label>事件<input value={entry.text} onChange={(event) => updateDraft((draft) => { draft.timeline[sourceIndex]!.text = event.target.value }, `timeline.${sourceIndex}.text`)} /></label><button aria-label={`删除时间线事件 ${entry.text}`} onClick={() => updateDraft((draft) => { draft.timeline.splice(sourceIndex, 1) }, 'timeline-delete')}>×</button></article> })}</div></section>
}

