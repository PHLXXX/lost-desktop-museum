import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { compileCaseDraft } from '../compiler/compileCaseDraft'
import { PreviewRuntime } from '../../preview/PreviewRuntime'
import { PreviewSession } from '../../preview/PreviewSession'
import { AppConfigEditor } from '../features/app-config-editor/AppConfigEditor'
import { ClueEditor } from '../features/clue-editor/ClueEditor'
import { DeductionEditor } from '../features/deduction-editor/DeductionEditor'
import { DesktopEditor } from '../features/desktop-editor/DesktopEditor'
import { EntityEditor } from '../features/entity-editor/EntityEditor'
import { MetadataEditor } from '../features/metadata-editor/MetadataEditor'
import { OverviewEditor } from '../features/overview/OverviewEditor'
import { PackagePublisher } from '../features/package-publisher/PackagePublisher'
import { TimelineEditor } from '../features/timeline-editor/TimelineEditor'
import { TriggerEditor } from '../features/trigger-editor/TriggerEditor'
import { ValidationCenter } from '../features/validation-center/ValidationCenter'
import { useEditorStore } from '../store/editorStore'
import { EditorSidebar } from './EditorSidebar'
import { EditorTopbar } from './EditorTopbar'
import { InspectorPanel } from './InspectorPanel'
import { getAppEditorBySection } from '../registry/appEditorRegistry'
import { getEditorTabOwnerId, LocalStorageLockStorage, ProjectLockManager } from '../storage/projectLock'
import { SnapshotDialog } from './SnapshotDialog'

const AssetManager = lazy(() => import('../features/asset-manager/AssetManager').then((module) => ({ default: module.AssetManager })))

function EditorContent({ onIssue }: { onIssue: (path: string) => void }) {
  const section = useEditorStore((state) => state.currentProject?.uiState.activeSection)
  const registered = section ? getAppEditorBySection(section) : undefined
  if (registered) { const Component = registered.EditorComponent; return <Component /> }
  if (section === 'metadata') return <MetadataEditor />
  if (section === 'entities') return <EntityEditor />
  if (section === 'timeline') return <TimelineEditor />
  if (section === 'desktop') return <DesktopEditor />
  if (section === 'applications') return <AppConfigEditor />
  if (section === 'clues') return <ClueEditor />
  if (section === 'triggers') return <TriggerEditor />
  if (section === 'deduction') return <DeductionEditor />
  if (section === 'assets') return <AssetManager />
  if (section === 'validation') return <ValidationCenter onIssue={onIssue} />
  return <OverviewEditor />
}

function sectionForPath(path: string) {
  if (path.startsWith('manifest') || path.startsWith('subject') || path.startsWith('desktop')) return 'metadata' as const
  if (path.startsWith('entities')) return 'entities' as const
  if (path.startsWith('timeline')) return 'timeline' as const
  if (path.startsWith('files') || path.startsWith('folders')) return 'files' as const
  if (path.startsWith('chats')) return 'messages' as const
  if (path.startsWith('emails')) return 'mail' as const
  if (path.startsWith('clues')) return 'clues' as const
  if (path.startsWith('triggers')) return 'triggers' as const
  if (path.startsWith('deduction') || path.startsWith('questions')) return 'deduction' as const
  if (path.startsWith('assets')) return 'assets' as const
  return 'validation' as const
}

export function EditorShell({ onReturnMuseum }: { onReturnMuseum: () => void }) {
  const store = useEditorStore()
  const project = store.currentProject
  const projectId = project?.projectId
  const [publishing, setPublishing] = useState(false)
  const [snapshotsOpen, setSnapshotsOpen] = useState(false)
  const [previewing, setPreviewing] = useState(false)
  const [lockMode, setLockMode] = useState<'checking' | 'owned' | 'prompt' | 'readonly' | 'takeover-confirm'>('checking')
  const session = useRef<PreviewSession | null>(null)
  const lock = useRef<ProjectLockManager | null>(null)
  const navigateIssue = (path: string) => {
    store.setSection(sectionForPath(path))
    requestAnimationFrame(() => { const id = path === 'manifest.title' ? 'field-manifest-title' : ''; if (id) document.getElementById(id)?.focus() })
  }
  const startPreview = useCallback(() => {
    if (!project) return
    const result = compileCaseDraft(project.draft, [])
    if (!result.ok) { store.validate(); store.setSection('validation'); return }
    session.current = new PreviewSession(project.projectId, result.caseDefinition)
    session.current.start(); setPreviewing(true)
  }, [project, store])
  const stopPreview = () => { session.current?.stop(); session.current = null; setPreviewing(false) }
  useEffect(() => () => session.current?.stop(), [])
  useEffect(() => {
    if (!projectId) return
    const manager = new ProjectLockManager(new LocalStorageLockStorage(), getEditorTabOwnerId())
    lock.current = manager
    let active = true
    const result = manager.acquire(projectId)
    queueMicrotask(() => { if (active) setLockMode(result === 'acquired' ? 'owned' : 'prompt') })
    const heartbeat = window.setInterval(() => manager.heartbeat(projectId), 5_000)
    return () => { active = false; window.clearInterval(heartbeat); manager.release(projectId); lock.current = null }
  }, [projectId])
  useEffect(() => {
    const handle = (event: KeyboardEvent) => {
      const command = event.ctrlKey || event.metaKey
      if (!command) return
      if (lockMode === 'readonly' && ['s', 'z', 'y'].includes(event.key.toLowerCase())) { event.preventDefault(); return }
      if (event.key.toLowerCase() === 's') { event.preventDefault(); void store.saveNow() }
      if (event.key.toLowerCase() === 'z') { event.preventDefault(); if (event.shiftKey) store.redo(); else store.undo() }
      if (event.key.toLowerCase() === 'y') { event.preventDefault(); store.redo() }
      if (event.key === 'Enter' && event.shiftKey) { event.preventDefault(); startPreview() }
    }
    window.addEventListener('keydown', handle); return () => window.removeEventListener('keydown', handle)
  }, [lockMode, startPreview, store])
  if (!project) return null
  if (previewing) return <PreviewRuntime onReturn={stopPreview} />
  const errors = store.issues.filter((issue) => issue.severity === 'error').length
  const warnings = store.issues.filter((issue) => issue.severity === 'warning').length
  const readOnly = lockMode === 'readonly'
  return <main className="editor-shell"><EditorTopbar readOnly={readOnly} onReturnMuseum={onReturnMuseum} onPreview={startPreview} onPublish={() => setPublishing(true)} onSnapshots={() => setSnapshotsOpen(true)} />{readOnly && <div className="editor-readonly-banner" role="status">只读模式 · 该工程由另一个标签持有编辑锁</div>}<div className="editor-workspace"><EditorSidebar /><fieldset disabled={readOnly} className="editor-canvas" aria-label="案件编辑区域"><Suspense fallback={<div className="editor-module-loading">正在装载编辑模块…</div>}><EditorContent onIssue={navigateIssue} /></Suspense></fieldset><InspectorPanel onIssue={navigateIssue} /></div><footer className="editor-statusbar"><span className={errors ? 'error' : ''}>错误 {errors}</span><span>警告 {warnings}</span><span>最近保存 {new Date(project.updatedAt).toLocaleTimeString('zh-CN', { hour12: false })}</span><span>资源 {project.draft.assets.length}</span><span>修订 {project.revision}</span><span>编辑器 v0.4.0</span></footer>{publishing && <PackagePublisher onClose={() => setPublishing(false)} />}{snapshotsOpen && <SnapshotDialog onClose={() => setSnapshotsOpen(false)} />}{(lockMode === 'prompt' || lockMode === 'takeover-confirm') && <div className="workshop-modal-backdrop"><section className="workshop-modal compact lock-dialog" role="dialog" aria-modal="true" aria-labelledby="lock-title"><header><h2 id="lock-title">{lockMode === 'prompt' ? '该工程正在另一个标签中编辑' : '接管编辑？'}</h2></header><div className="wizard-body"><p>{lockMode === 'prompt' ? '为避免自动保存互相覆盖，本标签默认不会修改工程。' : '接管后，另一个标签继续编辑可能覆盖较新的内容。请先确认另一标签已经停止操作。'}</p></div><footer>{lockMode === 'prompt' ? <><button onClick={store.closeProject}>返回工程列表</button><button onClick={() => setLockMode('readonly')}>只读打开</button><button className="danger-button" onClick={() => setLockMode('takeover-confirm')}>接管编辑</button></> : <><button onClick={() => setLockMode('prompt')}>取消</button><button className="danger-button" onClick={() => { if (project && lock.current?.acquire(project.projectId, Date.now(), true) === 'acquired') setLockMode('owned') }}>确认接管</button></>}</footer></section></div>}</main>
}
