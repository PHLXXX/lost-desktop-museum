import type { AppId } from '../cases/types'

export const appRegistry: { id: AppId; title: string; description: string }[] = [
  { id: 'files', title: '我的文件', description: '18 个项目' }, { id: 'messages', title: '讯息', description: '2 个会话' }, { id: 'mail', title: '邮件', description: '5 封邮件' },
  { id: 'photos', title: '照片', description: '2 张档案照片' }, { id: 'browser', title: '浏览记录', description: '10 条本地记录' }, { id: 'calendar', title: '日历', description: '2031 年 11 月' },
  { id: 'recycle', title: '回收站', description: '5 个可见项目' }, { id: 'logs', title: '系统日志', description: '6 条系统事件' }, { id: 'evidence', title: '证据板', description: '案件 LD-001' }, { id: 'settings', title: '设置', description: '本地系统偏好' },
]
