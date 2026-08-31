import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { compileCaseDraft } from '../compiler/compileCaseDraft'
import { PreviewRuntime } from '../../preview/PreviewRuntime'
import { PreviewSession } from '../../preview/PreviewSession'
import { AppConfigEditor } from '../features/app-config-editor/AppConfigEditor'
import { ClueEditor } from '../features/clue-editor/ClueEditor'
import { DeductionEditor } from '../features/deduction-editor/DeductionEditor'
import { DesktopEditor } from '../features/desktop-editor/DesktopEditor'
import { EntityEditor } from '../features/entity-editor/EntityEditor'
import { FileSystemEditor } from '../features/file-system-editor/FileSystemEditor'
import { MailEditor } from '../features/mail-editor/MailEditor'
import { MessengerEditor } from '../features/messenger-editor/MessengerEditor'
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

const PhotoEditor = lazy(() => import('../features/record-editors/RecordEditors').then((module) => ({ default: module.PhotoEditor })))
const BrowserEditor = lazy(() => import('../features/record-editors/RecordEditors').then((module) => ({ default: module.BrowserEditor })))
const CalendarEditor = lazy(() => import('../features/record-editors/RecordEditors').then((module) => ({ default: module.CalendarEditor })))
const LogEditor = lazy(() => import('../features/record-editors/RecordEditors').then((module) => ({ default: module.LogEditor })))
const AudioEditor = lazy(() => import('../features/record-editors/RecordEditors').then((module) => ({ default: module.AudioEditor })))
const BroadcastEditor = lazy(() => import('../features/record-editors/RecordEditors').then((module) => ({ default: module.BroadcastEditor })))
const DataEditor = lazy(() => import('../features/record-editors/RecordEditors').then((module) => ({ default: module.DataEditor })))
const TerminalEditor = lazy(() => import('../features/record-editors/RecordEditors').then((module) => ({ default: module.TerminalEditor })))
const VersionEditor = lazy(() => import('../features/record-editors/RecordEditors').then((module) => ({ default: module.VersionEditor })))
const SitemapEditor = lazy(() => import('../features/record-editors/RecordEditors').then((module) => ({ default: module.SitemapEditor })))
const AssetManager = lazy(() => import('../features/asset-manager/AssetManager').then((module) => ({ default: module.AssetManager })))

function EditorContent({ onIssue }: { onIssue: (path: string) => void }) {
  const section = useEditorStore((state) => state.currentProject?.uiState.activeSection)
  if (section === 'metadata') return <MetadataEditor />
  if (section === 'entities') return <EntityEditor />
  if (section === 'timeline') return <TimelineEditor />
  if (section === 'desktop') return <DesktopEditor />
  if (section === 'applications') return <AppConfigEditor />
  if (section === 'files') return <FileSystemEditor />
  if (section === 'messages') return <MessengerEditor />
  if (section === 'mail') return <MailEditor />
  if (section === 'photos') return <PhotoEditor />
  if (section === 'browser') return <BrowserEditor />
  if (section === 'calendar') return <CalendarEditor />
  if (section === 'logs') return <LogEditor />
  if (section === 'audio') return <AudioEditor />
  if (section === 'broadcast') return <BroadcastEditor />
  if (section === 'data') return <DataEditor />
  if (section === 'terminal') return <TerminalEditor />
  if (section === 'versions') return <VersionEditor />
  if (section === 'sitemap') return <SitemapEditor />
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
  const [publishing, setPublishing] = useState(false)
  const [previewing, setPreviewing] = useState(false)
  const session = useRef<PreviewSession | null>(null)
  const navigateIssue = (path: string) => {
    store.setSection(sectionForPath(path))
    requestAnimationFrame(() => { const id = path === 'manifest.title' ? 'field-manifest-title' : ''; if (id) document.getElementById(id)?.focus() })
  }
  const startPreview = () => {
    if (!project) return
    const result = compileCaseDraft(project.draft, [])
    if (!result.ok) { store.validate(); store.setSection('validation'); return }
    session.current = new PreviewSession(project.projectId, result.caseDefinition)
    session.current.start(); setPreviewing(true)
  }
  const stopPreview = () => { session.current?.stop(); session.current = null; setPreviewing(false) }
  useEffect(() => () => session.current?.stop(), [])
  useEffect(() => {
    const handle = (event: KeyboardEvent) => {
      const command = event.ctrlKey || event.metaKey
      if (!command) return
      if (event.key.toLowerCase() === 's') { event.preventDefault(); void store.saveNow() }
      if (event.key.toLowerCase() === 'z') { event.preventDefault(); if (event.shiftKey) store.redo(); else store.undo() }
      if (event.key.toLowerCase() === 'y') { event.preventDefault(); store.redo() }
      if (event.key === 'Enter' && event.shiftKey) { event.preventDefault(); startPreview() }
    }
    window.addEventListener('keydown', handle); return () => window.removeEventListener('keydown', handle)
  })
  if (!project) return null
  if (previewing) return <PreviewRuntime onReturn={stopPreview} />
  const errors = store.issues.filter((issue) => issue.severity === 'error').length
  const warnings = store.issues.filter((issue) => issue.severity === 'warning').length
  return <main className="editor-shell"><EditorTopbar onReturnMuseum={onReturnMuseum} onPreview={startPreview} onPublish={() => setPublishing(true)} /><div className="editor-workspace"><EditorSidebar /><section className="editor-canvas" tabIndex={-1}><Suspense fallback={<div className="editor-module-loading">正在装载编辑模块…</div>}><EditorContent onIssue={navigateIssue} /></Suspense></section><InspectorPanel onIssue={navigateIssue} /></div><footer className="editor-statusbar"><span className={errors ? 'error' : ''}>错误 {errors}</span><span>警告 {warnings}</span><span>最近保存 {new Date(project.updatedAt).toLocaleTimeString('zh-CN', { hour12: false })}</span><span>资源 {project.draft.assets.length}</span><span>修订 {project.revision}</span><span>编辑器 v0.4.0</span></footer>{publishing && <PackagePublisher onClose={() => setPublishing(false)} />}</main>
}
