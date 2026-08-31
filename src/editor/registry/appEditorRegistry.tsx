/* eslint-disable react-refresh/only-export-components */
import { lazy, type ComponentType, type LazyExoticComponent } from 'react'
import type { ValidationIssue } from '../../engine/validation'
import type { EditorSection } from '../model/authoringProject'
import { FileSystemEditor } from '../features/file-system-editor/FileSystemEditor'
import { MessengerEditor } from '../features/messenger-editor/MessengerEditor'
import { MailEditor } from '../features/mail-editor/MailEditor'

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

export interface AppEditorModule {
  componentKey: string
  section: EditorSection
  label: string
  icon: string
  createDefaultPayload(): unknown
  validatePayload(payload: unknown): ValidationIssue[]
  EditorComponent: ComponentType | LazyExoticComponent<ComponentType>
}

const noIssues = () => []
const modules: AppEditorModule[] = [
  { componentKey: 'files', section: 'files', label: '文件系统', icon: 'FI', createDefaultPayload: () => ({ folders: [], files: [] }), validatePayload: noIssues, EditorComponent: FileSystemEditor },
  { componentKey: 'messages', section: 'messages', label: '讯息', icon: 'MS', createDefaultPayload: () => [], validatePayload: noIssues, EditorComponent: MessengerEditor },
  { componentKey: 'mail', section: 'mail', label: '邮件', icon: 'ML', createDefaultPayload: () => [], validatePayload: noIssues, EditorComponent: MailEditor },
  { componentKey: 'photos', section: 'photos', label: '照片', icon: 'PH', createDefaultPayload: () => [], validatePayload: noIssues, EditorComponent: PhotoEditor },
  { componentKey: 'browser', section: 'browser', label: '浏览记录', icon: 'BR', createDefaultPayload: () => [], validatePayload: noIssues, EditorComponent: BrowserEditor },
  { componentKey: 'calendar', section: 'calendar', label: '日历', icon: 'CA', createDefaultPayload: () => [], validatePayload: noIssues, EditorComponent: CalendarEditor },
  { componentKey: 'logs', section: 'logs', label: '系统日志', icon: 'LG', createDefaultPayload: () => [], validatePayload: noIssues, EditorComponent: LogEditor },
  { componentKey: 'audio', section: 'audio', label: '音频工作台', icon: 'AU', createDefaultPayload: () => [], validatePayload: noIssues, EditorComponent: AudioEditor },
  { componentKey: 'broadcast', section: 'broadcast', label: '广播控制台', icon: 'BC', createDefaultPayload: () => [], validatePayload: noIssues, EditorComponent: BroadcastEditor },
  { componentKey: 'data', section: 'data', label: '数据台', icon: 'DT', createDefaultPayload: () => [], validatePayload: noIssues, EditorComponent: DataEditor },
  { componentKey: 'terminal', section: 'terminal', label: '模拟终端', icon: 'TR', createDefaultPayload: () => [], validatePayload: noIssues, EditorComponent: TerminalEditor },
  { componentKey: 'versions', section: 'versions', label: '版本差异', icon: 'VD', createDefaultPayload: () => [], validatePayload: noIssues, EditorComponent: VersionEditor },
  { componentKey: 'sitemap', section: 'sitemap', label: '站点地图', icon: 'SM', createDefaultPayload: () => [], validatePayload: noIssues, EditorComponent: SitemapEditor },
]

export const appEditorRegistry = new Map(modules.map((module) => [module.componentKey, module]))
export function getAppEditorBySection(section: EditorSection) { return modules.find((module) => module.section === section) }
