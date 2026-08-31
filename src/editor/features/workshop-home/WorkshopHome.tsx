import { useState } from 'react'
import { compileCaseDraft } from '../../compiler/compileCaseDraft'
import { CreateProjectWizard } from '../project-create/CreateProjectWizard'
import { useEditorStore } from '../../store/editorStore'
import { editorAssetRepository } from '../../storage/editorAssetRepository'
import { downloadFile } from '../../utils/downloadFile'
import type { AuthoringProject } from '../../model/authoringProject'

export function WorkshopHome({ onReturnMuseum }: { onReturnMuseum: () => void }) {
  const { projects, openProject, duplicateProject, deleteProject, importProject, importCaseDefinition } = useEditorStore()
  const [creating, setCreating] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [projectConflict, setProjectConflict] = useState<{ project: AuthoringProject; assets: Map<string, Uint8Array>; filename: string } | null>(null)
  const importProjectFile = async (file: File | undefined) => {
    if (!file) return
    try {
      const { importProjectPackage } = await import('../../../packages/projectPackage')
      const imported = await importProjectPackage(new Uint8Array(await file.arrayBuffer()), file.name)
      if (projects.some((project) => project.projectId === imported.project.projectId)) setProjectConflict({ ...imported, filename: file.name })
      else { await importProject(imported.project, imported.assets); setNotice(`已导入工程备份：${file.name}`) }
    } catch (error) { setNotice(error instanceof Error ? error.message : '工程导入失败。') }
  }
  const importCaseFile = async (file: File | undefined) => {
    if (!file) return
    try {
      const { importCasePackage } = await import('../../../packages/casePackage')
      const imported = await importCasePackage(new Uint8Array(await file.arrayBuffer()), file.name)
      await importCaseDefinition(imported.caseDefinition, imported.assets)
      setNotice(imported.warnings[0] ?? `已将 ${file.name} 转换为可编辑工程。`)
    } catch (error) { setNotice(error instanceof Error ? error.message : '案件包导入失败。') }
  }
  const exportBackup = async (projectId: string) => {
    const project = projects.find((item) => item.projectId === projectId)
    if (!project) return
    const { exportProjectPackage } = await import('../../../packages/projectPackage')
    const stored = await editorAssetRepository.list(projectId)
    const assets = new Map<string, Uint8Array>()
    for (const asset of stored) assets.set(asset.path, new Uint8Array(await asset.blob.arrayBuffer()))
    const exported = await exportProjectPackage(project, assets)
    downloadFile(exported.filename, exported.bytes)
    setNotice(`已导出工程备份：${exported.filename}`)
  }
  return <main className="workshop-home">
    <header className="workshop-home-bar"><div className="workshop-brand"><span>AW</span><div><h1>档案工坊</h1><small>ARCHIVE WORKSHOP · LOCAL AUTHORING TERMINAL</small></div></div><button onClick={onReturnMuseum}>返回档案馆</button></header>
    <section className="workshop-home-intro"><div><span>本地案件制作工具</span><h2>把线索、时间与数字遗物<br />编排成可调查的档案。</h2><p>不需要编辑JSON。工程、资源和试玩进度只保存在本机。</p>{notice && <div className="workshop-import-notice" role="status">{notice}<button aria-label="关闭导入提示" onClick={() => setNotice(null)}>×</button></div>}</div><div className="workshop-home-actions"><button className="primary-button" onClick={() => setCreating(true)}>创建案件工程</button><label>导入.ldmproject<input type="file" accept=".ldmproject" onChange={(event) => { void importProjectFile(event.target.files?.[0]); event.target.value = '' }} /></label><label>导入.ldmcase作为工程<input type="file" accept=".ldmcase,.lmdcase" onChange={(event) => { void importCaseFile(event.target.files?.[0]); event.target.value = '' }} /></label><a href="https://github.com/PHLXXX/lost-desktop-museum/blob/main/docs/EDITOR_GUIDE.md" target="_blank" rel="noreferrer">查看编辑器指南</a></div></section>
    <section className="project-register" aria-labelledby="my-projects"><header><div><span>工程登记簿</span><h2 id="my-projects">我的工程</h2></div><strong>{projects.length.toString().padStart(2, '0')}</strong></header>
      {projects.length === 0 ? <div className="workshop-empty"><span>000</span><h3>还没有本地工程</h3><p>从最小可玩模板开始，最快可以看到完整制作闭环。</p><button onClick={() => setCreating(true)}>创建第一个工程</button></div> : <div className="project-table" role="table"><div className="project-row project-row-head" role="row"><span>工程 / 案件</span><span>状态</span><span>最近编辑</span><span>操作</span></div>{projects.map((project) => { const result = compileCaseDraft(project.draft); const errors = result.ok ? 0 : result.issues.filter((issue) => issue.severity === 'error').length; return <div className="project-row" role="row" key={project.projectId}><div><strong>{project.name}</strong><small>{project.caseId} · {project.draft.manifest.title || '无标题案件'}</small></div><span className={errors ? 'project-state error' : 'project-state ready'}>{errors ? `${errors} 个错误` : '结构通过'}</span><time>{new Date(project.updatedAt).toLocaleString('zh-CN', { hour12: false })}</time><div className="project-actions"><button onClick={() => void openProject(project.projectId)}>打开</button><button onClick={() => void duplicateProject(project.projectId)}>复制</button><button onClick={() => void exportBackup(project.projectId)}>导出备份</button><button onClick={() => setDeleteId(project.projectId)}>删除</button></div></div> })}</div>}
    </section>
    <footer className="workshop-home-footer"><span>编辑器 Schema v1</span><span>IndexedDB · 自动保存 · 无远程上传</span></footer>
    {creating && <CreateProjectWizard onClose={() => setCreating(false)} />}
    {projectConflict && <div className="workshop-modal-backdrop"><section className="workshop-modal compact" role="dialog" aria-modal="true" aria-labelledby="project-conflict-title"><header><div><span>PROJECT ID CONFLICT</span><h2 id="project-conflict-title">工程已存在</h2></div></header><div className="wizard-body"><p>本地已有相同 projectId：<code>{projectConflict.project.projectId}</code></p><p>安装为副本会生成新 projectId 与新 caseId；替换会先为当前工程创建恢复快照。</p></div><footer><button onClick={() => setProjectConflict(null)}>取消</button><button onClick={() => { const pending = projectConflict; setProjectConflict(null); void importProject(pending.project, pending.assets, 'copy').then(() => setNotice(`已安装为副本：${pending.filename}`)) }}>安装为副本</button><button className="danger-button" onClick={() => { const pending = projectConflict; setProjectConflict(null); void importProject(pending.project, pending.assets, 'replace').then(() => setNotice(`已替换本地工程：${pending.filename}`)) }}>替换本地工程</button></footer></section></div>}
    {deleteId && <div className="workshop-modal-backdrop"><section className="workshop-modal compact" role="dialog" aria-modal="true"><header><h2>删除工程？</h2></header><div className="wizard-body"><p>工程和未导出的本地内容将被移除。此操作不会删除已安装案件。</p></div><footer><button onClick={() => setDeleteId(null)}>取消</button><button className="danger-button" onClick={() => { void deleteProject(deleteId); setDeleteId(null) }}>确认删除</button></footer></section></div>}
  </main>
}
