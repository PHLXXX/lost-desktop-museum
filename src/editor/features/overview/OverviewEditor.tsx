import { useEditorStore } from '../../store/editorStore'
import { MetadataEditor } from '../metadata-editor/MetadataEditor'

export function OverviewEditor() {
  const project = useEditorStore((state) => state.currentProject)
  if (!project) return null
  const draft = project.draft
  return <section className="editor-document"><header><span>PROJECT OVERVIEW</span><h1>{project.name}</h1><p>制作状态、关键数量与发布前的下一步。</p></header><div className="overview-ledger"><div><span>人物与实体</span><strong>{draft.entities.length}</strong></div><div><span>时间线事件</span><strong>{draft.timeline.length}</strong></div><div><span>数字文件</span><strong>{draft.files.length}</strong></div><div><span>可发现线索</span><strong>{draft.clues.length}</strong></div><div><span>剧情触发器</span><strong>{draft.triggers.length}</strong></div><div><span>推理题目</span><strong>{draft.deduction.questions?.length ?? 0}</strong></div></div><div className="form-section"><h2>案件卡片</h2><MetadataEditor compact /><article className="case-card-preview"><span>{draft.manifest.caseId}</span><h2>{draft.manifest.title || '无标题案件'}</h2><p>{draft.manifest.summary || '填写简介后，这里会显示档案馆卡片摘要。'}</p><footer>{draft.manifest.difficulty} · 约 {draft.manifest.estimatedMinutes} 分钟</footer></article></div></section>
}
