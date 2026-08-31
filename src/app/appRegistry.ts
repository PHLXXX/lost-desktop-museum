import type { AppId, CaseDefinition } from '../cases/types'
import { filesInFolder, type FileSystemProgress } from '../engine/fileSystemView'

export const appRegistry: { id: AppId; title: string }[] = [
  { id: 'files', title: '我的文件' }, { id: 'messages', title: '讯息' }, { id: 'mail', title: '邮件' },
  { id: 'photos', title: '照片' }, { id: 'browser', title: '浏览记录' }, { id: 'calendar', title: '日历' },
  { id: 'recycle', title: '回收站' }, { id: 'logs', title: '系统日志' }, { id: 'evidence', title: '证据板' }, { id: 'settings', title: '设置' },
  { id: 'audio', title: '音频工作台' }, { id: 'broadcast', title: '广播控制台' }, { id: 'data', title: '数据台' },
  { id: 'terminal', title: '模拟终端' }, { id: 'versions', title: '版本差异' }, { id: 'sitemap', title: '站点地图' },
]

function describeCalendar(definition: CaseDefinition) {
  const date = definition.calendar[0]?.date ?? definition.subject.lastLoginAt
  const match = /^(\d{4})-(\d{2})/.exec(date)
  return match ? `${match[1]} 年 ${Number(match[2])} 月` : '没有恢复日程'
}

function describeApp(id: AppId, definition: CaseDefinition, progress: FileSystemProgress) {
  const descriptions: Record<AppId, string> = {
    files: `${definition.files.length} 个文件项目`,
    messages: `${definition.chats.length} 个会话`,
    mail: `${definition.emails.length} 封邮件`,
    photos: `${definition.photos.length} 张档案照片`,
    browser: `${definition.browser.length} 条本地记录`,
    calendar: describeCalendar(definition),
    recycle: `${filesInFolder(definition, '回收站', progress).length} 个保留项目`,
    logs: `${definition.logs.length} 条系统事件`,
    audio: `${definition.audioTracks.length} 条本地音轨`,
    broadcast: `${definition.broadcastEvents.length} 条节目源事件`,
    data: `${definition.dataTables.length} 组采样记录`,
    terminal: `${definition.terminalEntries.filter((entry) => entry.enabled).length} 条可用命令`,
    versions: `${definition.versionDiffs.length} 条修改记录`,
    sitemap: `${definition.sitemap.length} 个地点节点`,
    evidence: `${definition.clues.length} 条可记录线索`,
    settings: '本地系统偏好',
  }
  return descriptions[id]
}

export function getRuntimeAppRegistry(definition: CaseDefinition, progress: FileSystemProgress = { unlockedItemIds: [], restoredItemIds: [] }) {
  return definition.applications
    .filter((app) => app.enabled)
    .map((app) => ({ id: app.id, title: app.title, description: describeApp(app.id, definition, progress) }))
}
