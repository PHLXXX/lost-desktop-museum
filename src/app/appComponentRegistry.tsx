import type { ReactNode } from 'react'
import { CalendarApp } from '../features/apps/CalendarApp'
import { FilesApp } from '../features/apps/FilesApp'
import { HistoryApp } from '../features/apps/HistoryApp'
import { LogsApp } from '../features/apps/LogsApp'
import { MailApp } from '../features/apps/MailApp'
import { MessagesApp } from '../features/apps/MessagesApp'
import { PhotosApp } from '../features/apps/PhotosApp'
import { RecycleApp } from '../features/apps/RecycleApp'
import { SettingsApp } from '../features/apps/SettingsApp'
import { EvidenceBoardApp } from '../features/evidence-board/EvidenceBoardApp'
import { AudioWorkbenchApp, BroadcastConsoleApp, DataDeskApp, SitemapApp, TerminalApp, VersionDiffApp } from '../features/apps/ExtendedApps'
import { supportedAppComponentKeyList } from './supportedAppKeys'

export interface AppRuntimeContext { onDeduction?: () => void; onResult?: () => void }
export interface AppComponentModule { componentKey: string; label: string; render(context: AppRuntimeContext): ReactNode }

const modules: AppComponentModule[] = [
  { componentKey: 'files', label: '文件管理器', render: () => <FilesApp /> },
  { componentKey: 'messages', label: '讯息', render: () => <MessagesApp /> },
  { componentKey: 'mail', label: '邮件', render: () => <MailApp /> },
  { componentKey: 'photos', label: '照片', render: () => <PhotosApp /> },
  { componentKey: 'browser', label: '浏览记录', render: () => <HistoryApp /> },
  { componentKey: 'calendar', label: '日历', render: () => <CalendarApp /> },
  { componentKey: 'recycle', label: '回收站', render: () => <RecycleApp /> },
  { componentKey: 'logs', label: '系统日志', render: () => <LogsApp /> },
  { componentKey: 'audio', label: '音频工作台', render: () => <AudioWorkbenchApp /> },
  { componentKey: 'broadcast', label: '广播控制台', render: () => <BroadcastConsoleApp /> },
  { componentKey: 'data', label: '数据台', render: () => <DataDeskApp /> },
  { componentKey: 'terminal', label: '模拟终端', render: () => <TerminalApp /> },
  { componentKey: 'versions', label: '版本差异', render: () => <VersionDiffApp /> },
  { componentKey: 'sitemap', label: '站点地图', render: () => <SitemapApp /> },
  { componentKey: 'evidence', label: '证据板', render: ({ onDeduction, onResult }) => <EvidenceBoardApp onDeduction={onDeduction} onResult={onResult} /> },
  { componentKey: 'settings', label: '设置', render: () => <SettingsApp /> },
]

export const appComponentRegistry = new Map(modules.map((module) => [module.componentKey, module]))
if (supportedAppComponentKeyList.some((key) => !appComponentRegistry.has(key))) throw new Error('运行时应用注册表不完整。')
