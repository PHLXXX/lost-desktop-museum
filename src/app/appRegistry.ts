import type { AppId } from '../cases/types'

export const appRegistry: { id: AppId; title: string; glyph: string }[] = [
  { id: 'files', title: '我的文件', glyph: '▱' }, { id: 'messages', title: '讯息', glyph: '◌' }, { id: 'mail', title: '邮件', glyph: '◇' },
  { id: 'photos', title: '照片', glyph: '▧' }, { id: 'browser', title: '浏览记录', glyph: '⌁' }, { id: 'calendar', title: '日历', glyph: '▦' },
  { id: 'recycle', title: '回收站', glyph: '⌫' }, { id: 'logs', title: '系统日志', glyph: '≣' }, { id: 'evidence', title: '证据板', glyph: '⌘' }, { id: 'settings', title: '设置', glyph: '⊙' },
]
