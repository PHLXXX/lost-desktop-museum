import type {
  ApplicationDefinition,
  AudioTrack,
  BrowserHistoryEntry,
  BroadcastEvent,
  CalendarEvent,
  CaseAssetReference,
  CaseEntity,
  CaseManifest,
  CaseSubject,
  ChatThread,
  ClueDefinition,
  DeductionQuestion,
  DataTable,
  DesktopDefinition,
  EmailMessage,
  GameTrigger,
  PhotoAsset,
  SystemLog,
  SitemapNode,
  TerminalEntry,
  TimelineEntry,
  VirtualFile,
  VirtualFolder,
  VersionDiff,
} from '../../cases/types'

export interface DraftDeductionDefinition {
  questions?: DeductionQuestion[]
  coreEvidenceIds?: string[]
  correctContradictions?: [string, string][]
  ending?: string
  resultLevels?: { id: string; label: string; minScore: number; maxScore: number; description: string }[]
}

export interface CaseDraft {
  manifest: Partial<CaseManifest>
  subject: Partial<CaseSubject>
  entities: CaseEntity[]
  timeline: TimelineEntry[]
  desktop: Partial<DesktopDefinition>
  applications: ApplicationDefinition[]
  folders: VirtualFolder[]
  files: VirtualFile[]
  chats: ChatThread[]
  emails: EmailMessage[]
  browserHistory: BrowserHistoryEntry[]
  calendarEvents: CalendarEvent[]
  photos: PhotoAsset[]
  systemLogs: SystemLog[]
  audioTracks: AudioTrack[]
  broadcastEvents: BroadcastEvent[]
  dataTables: DataTable[]
  terminalEntries: TerminalEntry[]
  versionDiffs: VersionDiff[]
  sitemap: SitemapNode[]
  clues: ClueDefinition[]
  triggers: GameTrigger[]
  deduction: DraftDeductionDefinition
  assets: CaseAssetReference[]
}

const enabledAppEntries = [
  ['files', '文件管理器'], ['messages', '讯息'], ['mail', '邮件'], ['photos', '照片'], ['browser', '浏览记录'], ['calendar', '日历'], ['recycle', '回收站'], ['logs', '系统日志'],
  ['audio', '音频工作台'], ['broadcast', '广播控制台'], ['data', '数据台'], ['terminal', '模拟终端'], ['versions', '版本差异'], ['sitemap', '站点地图'], ['evidence', '证据板'], ['settings', '设置'],
] as const
const enabledApps: ApplicationDefinition[] = enabledAppEntries.map(([id, title], index) => ({ id, componentKey: id, title, enabled: true, desktopX: 36 + (index % 2) * 196, desktopY: 72 + Math.floor(index / 2) * 76 }))

export function createBlankDraft(): CaseDraft {
  return {
    manifest: { language: 'zh-CN', version: '0.1.0', difficulty: '入门', estimatedMinutes: 15, tags: [], contentWarnings: [], builtIn: false },
    subject: {}, entities: [], timeline: [], desktop: { systemName: 'ARCHIVE/OS 3.1', themeColor: '#557b78' }, applications: enabledApps.map((app) => ({ ...app })),
    folders: [], files: [], chats: [], emails: [], browserHistory: [], calendarEvents: [], photos: [], systemLogs: [], audioTracks: [], broadcastEvents: [], dataTables: [], terminalEntries: [], versionDiffs: [], sitemap: [], clues: [], triggers: [],
    deduction: { questions: [], coreEvidenceIds: [], correctContradictions: [], resultLevels: [] }, assets: [],
  }
}

export function createMinimalTemplateDraft(): CaseDraft {
  const draft = createBlankDraft()
  draft.manifest = {
    caseId: 'case-spare-key', version: '1.0.0', title: '消失的备用钥匙', subtitle: '一个可完整试玩的教学案件', author: '档案工坊创作者', language: 'zh-CN',
    summary: '管理员办公室的备用钥匙在交接前消失。请检查终端中的文件、消息与访问记录。', estimatedMinutes: 15, difficulty: '入门', tags: ['教学', '室内'], contentWarnings: [], builtIn: false, archivedAt: '2032-06-18T09:00:00+08:00',
  }
  draft.subject = { name: '周岚', age: 29, occupation: '展馆管理员', location: '东区档案馆', lastLoginAt: '2032-06-17T19:42:00+08:00' }
  draft.entities = [
    { id: 'person-zhou-lan', type: 'person', name: '周岚', summary: '电脑主人', description: '负责闭馆交接。', aliases: [], tags: ['主人'] },
    { id: 'person-luo-yu', type: 'person', name: '罗宇', summary: '夜班保安', description: '负责东区巡查。', aliases: [], tags: ['联系人'] },
    { id: 'person-meng-jia', type: 'person', name: '孟佳', summary: '修复师', description: '当天借用过工具柜。', aliases: [], tags: ['联系人'] },
    { id: 'location-office', type: 'location', name: '管理员办公室', summary: '钥匙原存放处', description: '闭馆后仅值班人员可进入。', aliases: [], tags: [] },
  ]
  draft.timeline = [
    { time: '2032-06-17 17:20', text: '孟佳归还工具柜钥匙' }, { time: '2032-06-17 18:10', text: '周岚记录备用钥匙交接' },
    { time: '2032-06-17 18:42', text: '罗宇进入办公室' }, { time: '2032-06-17 19:05', text: '清洁记录显示抽屉未锁' },
  ]
  draft.desktop = { systemName: 'ARCHIVE/OS 3.1', bootMessage: '正在挂载东区管理员终端', lastLoginMessage: '2032.06.17 19:42', themeColor: '#557b78', wallpaperAssetId: 'asset-spare-key-cover' }
  draft.assets = [{ id: 'asset-spare-key-cover', kind: 'image', mime: 'image/png', path: 'assets/spare-key-cover.png', size: 2334337, sha256: 'e33e1587058f4efd6847a5bb167245f85e0bc38ed1da3cad531488f2ea319d46', alt: '夜间档案办公室中打开的抽屉、空钥匙托盘与交接记录' }]
  draft.folders = [{ id: 'folder-handover', name: '交接记录' }, { id: 'folder-notes', name: '便笺' }]
  draft.files = [
    { id: 'file-handover', name: '钥匙交接.txt', folder: '交接记录', content: '18:10 备用钥匙仍在右侧抽屉。', clueAction: 'OPEN_ITEM' },
    { id: 'file-cleaning', name: '清洁备注.txt', folder: '便笺', content: '19:05 右侧抽屉未锁，钥匙盒是空的。', clueAction: 'OPEN_ITEM' },
  ]
  draft.chats = [{ id: 'thread-luo-yu', title: '罗宇', messages: [{ id: 'message-corridor', sender: '罗宇', time: '18:45', text: '我只进去拿了巡查表，钥匙盒当时已经空了。', clueId: 'clue-message' }] }]
  draft.emails = [{ id: 'email-access', folder: '收件箱', from: '门禁系统', subject: '办公室临时通行记录', time: '18:43', body: '罗宇的门禁卡于18:42打开管理员办公室。', clueId: 'clue-access' }]
  draft.browserHistory = [{ id: 'history-locker', time: '17:55', title: '东区储物柜临时密码', category: '内部帮助', clueId: 'clue-browser' }]
  draft.calendarEvents = [{ id: 'calendar-handover', date: '2032-06-18', title: '备用钥匙交接', note: '上午九点交给新值班员。', clueId: 'clue-calendar' }]
  draft.systemLogs = [{ id: 'log-cabinet', time: '2032-06-17 19:12', user: 'ZHOU.LAN', eventType: '文档打印', detail: '打印“备用钥匙补领单”一份', clueId: 'clue-print' }]
  const clue = (id: string, title: string, source: ClueDefinition['source'], eventType: ClueDefinition['discovery']['type'], itemId: string): ClueDefinition => ({ id, title, summary: title, explanation: `由${title}确认的时间线记录。`, source, discovery: { type: eventType, itemId }, condition: { type: 'event', eventType, targetId: itemId }, people: ['person-zhou-lan'], times: ['2032-06-17'], places: ['location-office'], isCore: true, isRedHerring: false })
  draft.clues = [
    clue('clue-handover', '十八点仍在抽屉', 'files', 'OPEN_ITEM', 'file-handover'), clue('clue-cleaning', '十九点钥匙盒已空', 'files', 'OPEN_ITEM', 'file-cleaning'),
    clue('clue-message', '罗宇的说法', 'messages', 'OPEN_ITEM', 'message-corridor'), clue('clue-access', '门禁记录', 'mail', 'OPEN_ITEM', 'email-access'),
    clue('clue-calendar', '次日交接安排', 'calendar', 'OPEN_ITEM', 'calendar-handover'), clue('clue-print', '补领单打印记录', 'logs', 'VIEW_LOG', 'log-cabinet'),
  ]
  draft.triggers = [{ id: 'trigger-four-clues', name: '四条线索提示', once: true, condition: { type: 'clue-count', count: 4 }, effects: [{ id: 'effect-hint', type: 'NOTIFICATION', message: '把门禁时间与钥匙盒变空的时间放在一起。' }], reducedMotionEffects: [], safeModeEffects: [] }]
  draft.deduction = {
    questions: [
      { id: 'question-window', prompt: '钥匙最可能在哪个时间段消失？', options: [{ id: 'before', label: '17:20前' }, { id: 'between', label: '18:10至19:05之间' }], correctId: 'between', points: 50 },
      { id: 'question-action', prompt: '哪项记录最需要进一步核对？', options: [{ id: 'access', label: '办公室门禁与补领单' }, { id: 'weather', label: '当天气象' }], correctId: 'access', points: 50 },
    ],
    coreEvidenceIds: draft.clues.map((item) => item.id), correctContradictions: [['clue-message', 'clue-access']], ending: '钥匙失踪发生在交接记录之后，门禁记录与提前打印的补领单形成了最需要核对的轨迹。',
    resultLevels: [
      { id: 'result-low', label: '记录员', minScore: 0, maxScore: 49, description: '部分时间线仍未闭合。' },
      { id: 'result-mid', label: '调查员', minScore: 50, maxScore: 84, description: '关键时间窗口已经确定。' },
      { id: 'result-high', label: '首席归档员', minScore: 85, maxScore: 100, description: '证据关系完整。' },
    ],
  }
  return draft
}
