import { useState } from 'react'
import type { AppId } from '../../../cases/types'
import { useEditorStore } from '../../store/editorStore'

const choices = [
  { id: 'blank', label: '空白工程', note: '从没有内容的草稿开始，允许暂时存在校验错误。' },
  { id: 'template', label: '最小可玩模板', note: '包含6条线索、2道推理题和完整教学内容。' },
  { id: 'case-001', label: '复制档案001', note: '生成新的可编辑副本，不修改内置案件。' },
  { id: 'case-002', label: '复制档案002', note: '保留结构并强制使用新的caseId。' },
] as const
const appChoices: { id: AppId; label: string }[] = [{ id: 'files', label: '文件管理器' }, { id: 'messages', label: '讯息' }, { id: 'mail', label: '邮件' }, { id: 'photos', label: '照片' }, { id: 'browser', label: '浏览记录' }, { id: 'calendar', label: '日历' }, { id: 'recycle', label: '回收站' }, { id: 'logs', label: '系统日志' }, { id: 'audio', label: '音频工作台' }, { id: 'broadcast', label: '广播控制台' }, { id: 'data', label: '数据台' }, { id: 'terminal', label: '模拟终端' }, { id: 'versions', label: '版本差异' }, { id: 'sitemap', label: '站点地图' }, { id: 'evidence', label: '证据板' }, { id: 'settings', label: '设置' }]

export function CreateProjectWizard({ onClose }: { onClose: () => void }) {
  const createProject = useEditorStore((state) => state.createProject)
  const [step, setStep] = useState(1)
  const [kind, setKind] = useState<(typeof choices)[number]['id']>('template')
  const [details, setDetails] = useState({ name: '未命名案件工程', caseId: 'case-workshop-demo', title: '消失的备用钥匙', author: '档案创作者' })
  const [apps, setApps] = useState<Set<AppId>>(new Set(appChoices.map((app) => app.id)))
  const create = async () => {
    await createProject(kind, details)
    useEditorStore.getState().updateDraft((draft) => { draft.applications.forEach((application) => { application.enabled = apps.has(application.id) || application.id === 'evidence' || application.id === 'settings' }) }, 'initial-apps')
  }
  return <div className="workshop-modal-backdrop"><section className="workshop-modal" role="dialog" aria-modal="true" aria-labelledby="create-project-title">
    <header><div><span>新工程 · {step}/4</span><h2 id="create-project-title">创建案件工程</h2></div><button aria-label="关闭创建向导" onClick={onClose}>×</button></header>
    <ol className="wizard-progress" aria-label="创建步骤"><li className={step >= 1 ? 'active' : ''}>方式</li><li className={step >= 2 ? 'active' : ''}>信息</li><li className={step >= 3 ? 'active' : ''}>应用</li><li className={step >= 4 ? 'active' : ''}>确认</li></ol>
    <div className="wizard-body">
      {step === 1 && <fieldset className="creation-choices"><legend>选择创建方式</legend>{choices.map((choice) => <label key={choice.id} className={kind === choice.id ? 'selected' : ''}><input type="radio" name="kind" aria-label={choice.label} checked={kind === choice.id} onChange={() => setKind(choice.id)} /><strong>{choice.label}</strong><span>{choice.note}</span></label>)}<button disabled>导入.ldmcase</button><button disabled>导入.ldmproject</button></fieldset>}
      {step === 2 && <div className="editor-form"><label>工程名称<input value={details.name} onChange={(event) => setDetails({ ...details, name: event.target.value })} /></label><label>caseId<input value={details.caseId} pattern="[a-z0-9-]+" onChange={(event) => setDetails({ ...details, caseId: event.target.value })} /></label><label>案件名称<input value={details.title} onChange={(event) => setDetails({ ...details, title: event.target.value })} /></label><label>作者<input value={details.author} onChange={(event) => setDetails({ ...details, author: event.target.value })} /></label><label>语言<select defaultValue="zh-CN"><option>zh-CN</option></select></label><label>版本<input defaultValue="1.0.0" /></label></div>}
      {step === 3 && <fieldset className="app-choice-grid"><legend>初始应用</legend>{appChoices.map((app) => <label key={app.id}><input type="checkbox" checked={apps.has(app.id)} disabled={app.id === 'evidence' || app.id === 'settings'} onChange={(event) => { const next = new Set(apps); if (event.target.checked) next.add(app.id); else next.delete(app.id); setApps(next) }} />{app.label}</label>)}</fieldset>}
      {step === 4 && <div className="creation-summary"><span>准备创建</span><h3>{details.name}</h3><dl><div><dt>案件标题</dt><dd>{details.title || '尚未填写'}</dd></div><div><dt>caseId</dt><dd>{details.caseId}</dd></div><div><dt>创建方式</dt><dd>{choices.find((choice) => choice.id === kind)?.label}</dd></div><div><dt>启用应用</dt><dd>{apps.size} 个</dd></div></dl><p>工程会保存在当前浏览器。正式导出前仍需通过完整校验。</p></div>}
    </div>
    <footer><button onClick={step === 1 ? onClose : () => setStep(step - 1)}>{step === 1 ? '取消' : '上一步'}</button>{step < 4 ? <button className="primary-button" onClick={() => setStep(step + 1)}>下一步</button> : <button className="primary-button" onClick={() => void create()}>创建并打开</button>}</footer>
  </section></div>
}
