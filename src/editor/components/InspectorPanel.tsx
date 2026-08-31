import { useEditorStore } from '../store/editorStore'

export function InspectorPanel({ onIssue }: { onIssue: (path: string) => void }) {
  const project = useEditorStore((state) => state.currentProject)
  const issues = useEditorStore((state) => state.issues)
  if (!project) return null
  const selected = project.uiState.selectedEntityId
  const references = selected ? JSON.stringify(project.draft).split(selected).length - 1 : 0
  return <aside className="editor-inspector"><header><span>INSPECTOR</span><h2>检查器</h2></header><section><h3>当前选择</h3><dl><div><dt>模块</dt><dd>{project.uiState.activeSection}</dd></div><div><dt>ID</dt><dd>{selected ?? '—'}</dd></div><div><dt>引用</dt><dd>{selected ? Math.max(0, references - 1) : 0}</dd></div></dl></section><section className="inspector-issues"><h3>相关问题 <span>{issues.length}</span></h3>{issues.length === 0 ? <p>运行校验后，这里会显示可定位的问题。</p> : issues.slice(0, 8).map((issue) => <button key={issue.id} onClick={() => onIssue(issue.path)}><strong>{issue.severity === 'error' ? '错误' : '警告'}</strong><span>问题：{issue.message}</span><small>{issue.path}</small></button>)}</section><section><h3>快捷提示</h3><p>标题变化不会修改稳定ID。改ID前请先查看引用。</p></section></aside>
}
