import { useEditorStore } from '../../store/editorStore'

export function AppConfigEditor() {
  const project = useEditorStore((state) => state.currentProject)
  const updateDraft = useEditorStore((state) => state.updateDraft)
  if (!project) return null
  return <section className="editor-document"><header><span>APPLICATION REGISTRY</span><h1>应用配置</h1><p>运行时按componentKey选择固定、安全的应用模块；这里不能注入自定义代码。</p></header><div className="application-registry"><div className="registry-head"><span>启用</span><span>应用标题</span><span>组件键</span><span>桌面坐标</span></div>{project.draft.applications.map((app) => <div key={app.id}><label><input type="checkbox" checked={app.enabled} disabled={app.id === 'evidence' || app.id === 'settings'} onChange={(event) => updateDraft((draft) => { const item = draft.applications.find((candidate) => candidate.id === app.id); if (item) item.enabled = event.target.checked }, `app.${app.id}.enabled`)} /><span className="sr-only">启用 {app.title}</span></label><input aria-label={`${app.title} 标题`} value={app.title} onChange={(event) => updateDraft((draft) => { const item = draft.applications.find((candidate) => candidate.id === app.id); if (item) item.title = event.target.value }, `app.${app.id}.title`)} /><code>{app.componentKey}</code><span>{app.desktopX}, {app.desktopY}</span></div>)}</div></section>
}
