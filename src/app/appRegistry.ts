import type { AppId, CaseDefinition } from '../cases/types'

export const appRegistry: { id: AppId; title: string; description: string }[] = [
  { id: 'files', title: '我的文件', description: '18 个项目' }, { id: 'messages', title: '讯息', description: '2 个会话' }, { id: 'mail', title: '邮件', description: '5 封邮件' },
  { id: 'photos', title: '照片', description: '2 张档案照片' }, { id: 'browser', title: '浏览记录', description: '10 条本地记录' }, { id: 'calendar', title: '日历', description: '2031 年 11 月' },
  { id: 'recycle', title: '回收站', description: '5 个可见项目' }, { id: 'logs', title: '系统日志', description: '6 条系统事件' }, { id: 'evidence', title: '证据板', description: '案件 LD-001' }, { id: 'settings', title: '设置', description: '本地系统偏好' },
  { id: 'audio', title: '音频工作台', description: '本地音轨与转写' }, { id: 'broadcast', title: '广播控制台', description: '节目源事件' }, { id: 'data', title: '数据台', description: '结构化采样记录' },
  { id: 'terminal', title: '模拟终端', description: '白名单命令' }, { id: 'versions', title: '版本差异', description: '内容修改记录' }, { id: 'sitemap', title: '站点地图', description: '地点关系记录' },
]

export function getRuntimeAppRegistry(definition: CaseDefinition) {
  const descriptions = new Map(appRegistry.map((app) => [app.id, app.description]))
  return definition.applications.filter((app) => app.enabled).map((app) => ({ id: app.id, title: app.title, description: descriptions.get(app.id) ?? '案件应用' }))
}
