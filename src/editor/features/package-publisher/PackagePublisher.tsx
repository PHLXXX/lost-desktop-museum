import { lazy, Suspense, useEffect, useState } from 'react'
import { exportCasePackage } from '../../../packages/casePackage'
import { compileCaseDraft, type CompileCaseResult } from '../../compiler/compileCaseDraft'
import { editorAssetRepository, listEditorAssetMetadata } from '../../storage/editorAssetRepository'
import { useEditorStore } from '../../store/editorStore'
import { downloadFile } from '../../utils/downloadFile'
import type { ExportedPackage } from '../../../packages/casePackage'

const CommunityPublishPanel = lazy(() => import('../community-publishing/CommunityPublishPanel').then((module) => ({ default: module.CommunityPublishPanel })))

export function PackagePublisher({ onClose }: { onClose: () => void }) {
  const project = useEditorStore((state) => state.currentProject)
  const createSnapshot = useEditorStore((state) => state.createSnapshot)
  const [status, setStatus] = useState<'ready' | 'exporting' | 'done' | 'error'>('ready')
  const [message, setMessage] = useState<string | null>(null)
  const [result, setResult] = useState<CompileCaseResult | null>(null)
  const [exported, setExported] = useState<ExportedPackage | null>(null)
  const [communityOpen, setCommunityOpen] = useState(false)
  useEffect(() => {
    let active = true
    if (project) void listEditorAssetMetadata(project.projectId)
      .then((assets) => { if (active) setResult(compileCaseDraft(project.draft, assets)) })
      .catch((error) => { if (active) setResult({ ok: false, issues: [{ id: 'asset-storage-unavailable', severity: 'error', category: 'resource', code: 'ASSET_STORAGE_UNAVAILABLE', message: error instanceof Error ? `无法读取本地资源：${error.message}` : '无法读取本地资源。', path: 'assets' }] }) })
    return () => { active = false }
  }, [project])
  if (!project || !result) return null
  const errors = result.ok ? [] : result.issues.filter((issue) => issue.severity === 'error')
  const publish = async () => {
    if (!result.ok) return
    setStatus('exporting'); setMessage(null)
    try {
      await createSnapshot('导出正式案件前')
      const stored = await editorAssetRepository.list(project.projectId)
      const assets = new Map<string, Uint8Array>()
      for (const asset of stored) {
        const bytes = new Uint8Array(await asset.blob.arrayBuffer())
        const ref = project.draft.assets.find((item) => item.sha256 === asset.sha256 || item.path.replace(/^assets\//, '') === asset.path)
        assets.set(asset.path, bytes)
        if (ref) { assets.set(ref.id, bytes); assets.set(ref.path, bytes) }
      }
      const exported = await exportCasePackage(result.caseDefinition, assets)
      downloadFile(exported.filename, exported.bytes)
      setExported(exported)
      setStatus('done'); setMessage(`已生成并往返校验：${exported.filename}`)
    } catch (error) { setStatus('error'); setMessage(error instanceof Error ? error.message : '导出失败。') }
  }
  return <div className="workshop-modal-backdrop"><section className="publish-dialog" role="dialog" aria-modal="true" aria-labelledby="publish-title"><header><div><span>RELEASE GATE</span><h2 id="publish-title">导出案件</h2></div><button aria-label="关闭发布流程" onClick={onClose}>×</button></header><ol className="publish-steps"><li className="done"><span>01</span><div><strong>基本信息</strong><small>{project.draft.manifest.title} · {project.caseId}</small></div></li><li className="done"><span>02</span><div><strong>内容统计</strong><small>{project.draft.applications.filter((app) => app.enabled).length} 应用 · {project.draft.clues.length} 线索 · {project.draft.deduction.questions?.length ?? 0} 推理题</small></div></li><li className={errors.length ? 'blocked' : 'done'}><span>03</span><div><strong>完整校验</strong><small>{errors.length ? `${errors.length} 个错误阻止导出` : 'Schema、引用、安全与推理通过'}</small></div></li><li className="warning"><span>04</span><div><strong>试玩检查</strong><small>完整试玩不是强制条件，建议发布前到达一次结算。</small></div></li><li className={errors.length ? 'blocked' : 'active'}><span>05</span><div><strong>生成.ldmcase</strong><small>只收集引用资源，并在内存中重新导入校验。</small></div></li></ol>{errors.length > 0 && <div className="publish-errors"><strong>请先修复</strong>{errors.slice(0, 5).map((issue) => <p key={issue.id}>{issue.message}</p>)}</div>}{message && <div className={`publish-message ${status}`} role="status">{message}</div>}<footer><button onClick={onClose}>返回编辑</button>{exported && result.ok && <button onClick={() => setCommunityOpen(true)}>准备社区投稿</button>}<button className="primary-button" disabled={errors.length > 0 || status === 'exporting'} onClick={() => void publish()}>{status === 'exporting' ? '正在生成…' : '导出.ldmcase'}</button></footer></section>{communityOpen && exported && result.ok && <Suspense fallback={<section className="workshop-loading" aria-busy="true">正在准备社区投稿工具…</section>}><CommunityPublishPanel exported={exported} definition={result.caseDefinition} onClose={() => setCommunityOpen(false)} /></Suspense>}</div>
}
