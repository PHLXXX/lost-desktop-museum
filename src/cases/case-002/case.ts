import archiveImage from '../../assets/illustrations/airport.svg'
import type { CaseDefinition, ClueDefinition } from '../types'

const clue = (
  id: string,
  title: string,
  summary: string,
  source: ClueDefinition['source'],
  type: ClueDefinition['discovery']['type'],
  itemId: string,
): ClueDefinition => ({
  id,
  title,
  summary,
  explanation: summary,
  source,
  discovery: { type, itemId },
  condition: { type: 'event', eventType: type, targetId: itemId },
  people: ['林默'],
  times: ['2032-04-09'],
  places: ['北岸广播档案室'],
  isCore: true,
  isRedHerring: false,
})

const applications = ([
  ['files', '我的文件'], ['messages', '讯息'], ['mail', '邮件'], ['photos', '照片'], ['browser', '浏览记录'],
  ['calendar', '日历'], ['recycle', '回收站'], ['logs', '系统日志'], ['evidence', '证据板'], ['settings', '设置'],
] as const).map(([id, title], index) => ({ id, componentKey: id, title, enabled: true, desktopX: 32 + (index % 2) * 210, desktopY: 84 + Math.floor(index / 2) * 74 }))

export const caseDefinition: CaseDefinition = {
  formatVersion: 1,
  id: 'case-002',
  title: '零点后的回声',
  owner: '林默',
  manifest: {
    caseId: 'case-002', version: '1.0.0', title: '零点后的回声', subtitle: '被覆盖的最后一段广播', author: 'Lost Desktop Museum', language: 'zh-CN',
    summary: '广播主持人失联后，档案机中留下了一段不应存在的零点节目。', estimatedMinutes: 20, difficulty: '普通', tags: ['广播', '音频', '时间线'], contentWarnings: ['失踪主题'], builtIn: true, archivedAt: '2032-04-10T09:00:00+08:00',
  },
  subject: { name: '林默', age: 34, occupation: '夜间广播主持人', location: '北岸', lastLoginAt: '2032-04-09T00:17:00+08:00' },
  entities: [
    { id: 'person-lin-mo', type: 'person', name: '林默', summary: '电脑主人', description: '北岸电台夜间主持人。', aliases: ['LM'], tags: ['主人'] },
    { id: 'person-qiao-an', type: 'person', name: '乔安', summary: '节目制作人', description: '负责节目排期与音源归档。', aliases: [], tags: ['同事'] },
    { id: 'location-studio-a', type: 'location', name: 'A演播室', summary: '节目主控室', description: '零点节目原定播出地点。', aliases: [], tags: [] },
  ],
  desktop: { systemName: 'ARCHIVE/OS 3.1', bootMessage: '正在恢复广播档案终端', lastLoginMessage: '2032.04.09 00:17', themeColor: '#5aa6a6', wallpaperAssetId: 'case-002-cover' },
  applications,
  assets: [{ id: 'case-002-cover', kind: 'image', mime: 'image/svg+xml', path: archiveImage, size: 0, sha256: '0'.repeat(64), alt: '北岸广播档案终端示意图' }],
  timeline: [
    { time: '2032-04-08 22:40', text: '节目排期改为预录' },
    { time: '2032-04-08 23:52', text: '林默向乔安发送最后一条消息' },
    { time: '2032-04-09 00:03', text: '本地备份文件被打开' },
    { time: '2032-04-09 00:17', text: '控制台账户最后登录' },
  ],
  folders: [{ id: 'folder-program', name: '节目单' }, { id: 'folder-audio', name: '录音' }, { id: 'folder-notes', name: '便笺' }],
  files: [
    { id: 'file-midnight-script', name: '零点节目单.md', folder: '节目单', content: '零点节目改为预录，主持人签字栏为空。', clueAction: 'OPEN_ITEM' },
    { id: 'file-local-backup', name: '本地备份说明.txt', folder: '便笺', content: '00:03 的片段来自本地输入，并非直播线路。', clueAction: 'OPEN_ITEM' },
    { id: 'file-tone-marker', name: '提示音标记.txt', folder: '录音', content: '结尾提示音比标准台钟慢两秒。', clueAction: 'VIEW_TRANSCRIPT' },
  ],
  chats: [{ id: 'thread-producer', title: '乔安', messages: [
    { id: 'message-last', sender: '林默', time: '23:52', text: '如果零点后还有我的声音，那不是直播。', clueId: 'C02' },
    { id: 'message-reply', sender: '乔安', time: '23:55', text: '你把备份放在哪里？', unread: true },
  ] }],
  emails: [
    { id: 'mail-schedule', folder: '收件箱', from: '节目排期系统', subject: '零点节目改为预录', time: '22:40', body: '节目源已切换至本地备份。', clueId: 'C03' },
    { id: 'mail-draft', folder: '草稿', from: '林默', subject: '关于最后一期', time: '23:48', body: '我没有进入A演播室。请核对门禁。' },
  ],
  browser: [{ id: 'history-delay', time: '21:18', title: '数字广播延迟如何测量', category: '技术', clueId: 'C04' }],
  calendar: [{ id: 'calendar-zero', date: '2032-04-09', title: '零点特别节目', note: '改为预录，不进入A演播室', clueId: 'C05' }],
  photos: [{ id: 'photo-console', title: '控制台恢复图.svg', image: archiveImage, metadata: { capturedAt: '2032-04-08 20:00', exportedAt: '2032-04-09 00:20', camera: 'ARCHIVE CAPTURE' } }],
  logs: [{ id: 'log-door', time: '2032-04-09 00:01', user: 'ACCESS', eventType: '门禁', detail: 'A演播室无人刷卡进入', clueId: 'C06' }],
  clues: [
    clue('C01', '空白签字栏', '节目单没有主持人签字。', 'files', 'OPEN_ITEM', 'file-midnight-script'),
    clue('C02', '不是直播', '林默提前说明零点后的声音不是直播。', 'messages', 'OPEN_ITEM', 'message-last'),
    clue('C03', '本地节目源', '排期系统已切换到本地备份。', 'mail', 'OPEN_ITEM', 'mail-schedule'),
    clue('C04', '延迟测量', '林默搜索过数字广播延迟。', 'browser', 'OPEN_ITEM', 'history-delay'),
    clue('C05', '取消进入演播室', '日历备注明确不进入A演播室。', 'calendar', 'OPEN_ITEM', 'calendar-zero'),
    clue('C06', '没有门禁记录', '零点前后无人刷卡进入演播室。', 'logs', 'VIEW_LOG', 'log-door'),
  ],
  triggers: [{
    id: 'trigger-three-clues', name: '三条线索提示', once: true, condition: { type: 'clue-count', count: 3 },
    effects: [{ id: 'effect-three-clues', type: 'NOTIFICATION', message: '节目源和人在不在演播室，是两个问题。' }], reducedMotionEffects: [], safeModeEffects: [],
  }],
  questions: [
    { id: 'question-source', prompt: '零点节目最可能来自哪里？', options: [{ id: 'live', label: 'A演播室直播' }, { id: 'local', label: '本地预录备份' }], correctId: 'local', points: 25 },
    { id: 'question-presence', prompt: '林默零点时是否在A演播室？', options: [{ id: 'yes', label: '在' }, { id: 'no', label: '现有记录不支持' }], correctId: 'no', points: 20 },
    { id: 'question-purpose', prompt: '异常声音最可能用于什么？', options: [{ id: 'cover', label: '制造仍在主持的假象' }, { id: 'test', label: '普通设备测试' }], correctId: 'cover', points: 20 },
  ],
  coreEvidenceIds: ['C01', 'C02', 'C03', 'C04', 'C05', 'C06'],
  correctContradictions: [['C01', 'C02'], ['C05', 'C06']],
  ending: '声音可以继续留在节目里，但它不能证明说话的人仍在那里。',
}
