import { analyzeDraftDependencies } from '../../compiler/dependencyAnalyzer'
import { useEditorStore } from '../../store/editorStore'

export function ValidationCenter({ onIssue }: { onIssue: (path: string) => void }) {
  const { currentProject: project, issues, validate, lastValidatedAt } = useEditorStore()
  if (!project) return null
  const combined = [...issues, ...analyzeDraftDependencies(project.draft)].filter((issue, index, list) => list.findIndex((item) => item.id === issue.id) === index)
  const errors = combined.filter((issue) => issue.severity === 'error')
  const warnings = combined.filter((issue) => issue.severity === 'warning')
  return <section className="editor-document validation-center"><header><div><span>VALIDATION CENTER</span><h1>校验结果</h1><p>正式Schema、引用、可达性、资源、推理与安全使用同一份发布门禁。</p></div><button className="primary-button" aria-label="运行完整校验" onClick={() => void validate()}>运行完整校验</button></header><div className="validation-summary"><div className={errors.length ? 'error' : 'ok'}><span>错误</span><strong>{errors.length}</strong></div><div className="warning"><span>警告</span><strong>{warnings.length}</strong></div><div><span>最近校验</span><strong>{lastValidatedAt ? new Date(lastValidatedAt).toLocaleTimeString('zh-CN', { hour12: false }) : '尚未运行'}</strong></div><div><span>发布状态</span><strong>{errors.length ? '已阻止' : '可以导出'}</strong></div></div>{combined.length === 0 && lastValidatedAt ? <div className="validation-passed"><strong>校验通过</strong><p>当前草稿和本地资源可编译为严格CaseDefinition。</p></div> : <div className="issue-table"><div><span>级别</span><span>类别</span><span>问题</span><span>位置</span></div>{combined.map((issue) => <button key={issue.id} onClick={() => onIssue(issue.path)}><strong>{issue.severity === 'error' ? '错误' : '警告'}</strong><span>{issue.category}</span><span>{issue.message}</span><code>{issue.path}</code></button>)}</div>}</section>
}
