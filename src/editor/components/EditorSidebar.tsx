import type { EditorSection } from '../model/authoringProject'
import { useEditorStore } from '../store/editorStore'

const groups: { label: string; items: { id: EditorSection; label: string }[] }[] = [
  { label: '工程', items: [{ id: 'overview', label: '概览' }, { id: 'metadata', label: '基本信息' }, { id: 'entities', label: '人物与实体' }, { id: 'timeline', label: '时间线' }, { id: 'desktop', label: '桌面布局' }, { id: 'applications', label: '应用配置' }] },
  { label: '内容', items: [{ id: 'files', label: '文件系统' }, { id: 'messages', label: '讯息' }, { id: 'mail', label: '邮件' }, { id: 'photos', label: '照片' }, { id: 'browser', label: '浏览记录' }, { id: 'calendar', label: '日历' }, { id: 'logs', label: '系统日志' }, { id: 'audio', label: '音频工作台' }, { id: 'broadcast', label: '广播控制台' }, { id: 'data', label: '数据台' }, { id: 'terminal', label: '模拟终端' }, { id: 'versions', label: '版本差异' }, { id: 'sitemap', label: '站点地图' }] },
  { label: '逻辑', items: [{ id: 'clues', label: '线索与条件' }, { id: 'triggers', label: '剧情触发器' }, { id: 'deduction', label: '最终推理' }] },
  { label: '发布', items: [{ id: 'assets', label: '资源管理器' }, { id: 'validation', label: '校验结果' }] },
]

export function EditorSidebar() {
  const project = useEditorStore((state) => state.currentProject)
  const setSection = useEditorStore((state) => state.setSection)
  if (!project) return null
  const enabled = new Set(project.draft.applications.filter((app) => app.enabled).map((app) => app.id))
  const appSection: Partial<Record<EditorSection, string>> = { files: 'files', messages: 'messages', mail: 'mail', photos: 'photos', browser: 'browser', calendar: 'calendar', logs: 'logs', audio: 'audio', broadcast: 'broadcast', data: 'data', terminal: 'terminal', versions: 'versions', sitemap: 'sitemap' }
  return <nav className="editor-sidebar" aria-label="编辑器模块">{groups.map((group) => <section key={group.label}><h2>{group.label}</h2>{group.items.filter((item) => !appSection[item.id] || enabled.has(appSection[item.id] as never)).map((item) => <button key={item.id} className={project.uiState.activeSection === item.id ? 'active' : ''} onClick={() => setSection(item.id)}><span aria-hidden="true" />{item.label}</button>)}</section>)}</nav>
}
