import archiveImage from '../../assets/illustrations/airport.svg'
import type { CaseDefinition, ClueDefinition, InvestigationHintDefinition } from '../types'

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

const hint = (id: string, clueId: string, label: string, direction: string, action: string, location: string): InvestigationHintDefinition => ({ id, clueId, label, tiers: [
  { id: 'direction', label: '调查方向', text: direction, cost: 1 },
  { id: 'action', label: '操作建议', text: action, cost: 1 },
  { id: 'location', label: '精确定位', text: location, cost: 1 },
] })

const applications = ([
  ['files', '我的文件'], ['messages', '讯息'], ['mail', '邮件'], ['photos', '照片'], ['browser', '浏览记录'],
  ['calendar', '日历'], ['recycle', '回收站'], ['logs', '系统日志'], ['evidence', '证据板'], ['settings', '设置'],
  ['audio', '音频工作台'], ['broadcast', '广播控制台'], ['data', '数据台'], ['terminal', '模拟终端'], ['versions', '版本差异'], ['sitemap', '站点地图'],
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
  audioTracks: [{ id: 'audio-midnight', title: '零点备份片段', assetId: '', transcript: '如果零点后还有我的声音，那不是直播。' }],
  broadcastEvents: [{ id: 'broadcast-local', time: '00:00', title: '节目源切换', detail: '主输出切换至本地备份线路。' }],
  dataTables: [{ id: 'data-delay', title: '节目源延迟采样', columns: ['时间', '延迟'], rows: [['23:59:58', '2.0s'], ['00:00:03', '2.1s']] }],
  terminalEntries: [{ id: 'terminal-source', command: 'source --status', output: 'INPUT=LOCAL_BACKUP\nSTUDIO_A=OFFLINE', enabled: true }],
  versionDiffs: [{ id: 'version-schedule', title: '节目单修改', before: '播出方式：直播', after: '播出方式：本地预录' }],
  sitemap: [{ id: 'site-studio', label: 'A演播室', detail: '主控室，无门禁进入记录' }, { id: 'site-archive', label: '本地档案室', parentId: 'site-studio', detail: '备份节目源存储位置' }],
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
  resultLevels: [
    { id: 'echo-low', label: '信号未明', minScore: 0, maxScore: 49, description: '声音来源仍未确认。' },
    { id: 'echo-mid', label: '节目源已定位', minScore: 50, maxScore: 84, description: '本地输入已经确认。' },
    { id: 'echo-high', label: '零点回声已还原', minScore: 85, maxScore: 100, description: '节目源与人员轨迹完整闭合。' },
  ],
  coreEvidenceIds: ['C01', 'C02', 'C03', 'C04', 'C05', 'C06'],
  correctContradictions: [['C01', 'C02'], ['C05', 'C06']],
  ending: '声音可以继续留在节目里，但它不能证明说话的人仍在那里。',
  gameplay: {
    initialAnalysisPoints: 3,
    objectives: [
      { id: 'separate-voice-and-presence', title: '区分声音与在场', description: '分别验证节目声音的来源和主持人的实际在场记录。', kind: 'primary', condition: { type: 'all', conditions: [{ type: 'clue', clueId: 'C02' }, { type: 'clue', clueId: 'C03' }, { type: 'clue', clueId: 'C06' }] } },
      { id: 'rebuild-broadcast-switch', title: '还原节目源切换', description: '把节目单、排期与延迟记录拼成可核验的播出链路。', kind: 'optional', revealWhen: { type: 'clue-count', count: 2 }, condition: { type: 'all', conditions: [{ type: 'clue', clueId: 'C01' }, { type: 'clue', clueId: 'C03' }, { type: 'clue', clueId: 'C04' }] } },
      { id: 'verify-studio-absence', title: '核验演播室缺席', description: '确认计划记录和门禁记录是否互相支持。', kind: 'optional', revealWhen: { type: 'clue', clueId: 'C05' }, condition: { type: 'all', conditions: [{ type: 'clue', clueId: 'C05' }, { type: 'clue', clueId: 'C06' }] } },
      { id: 'link-broadcast-contradictions', title: '建立广播矛盾关系', description: '在证据板建立两组关键矛盾关系。', kind: 'optional', condition: { type: 'all', conditions: [{ type: 'relation', from: 'C01', to: 'C02', relationType: '相互矛盾' }, { type: 'relation', from: 'C05', to: 'C06', relationType: '相互矛盾' }] } },
      { id: 'complete-broadcast-archive', title: '完整广播归档', description: '记录本案全部六条线索。', kind: 'optional', condition: { type: 'clue-count', count: 6 } },
    ],
    hints: [
      hint('unsigned-script-hint', 'C01', '节目单状态', '正式节目单能说明直播流程是否完成。', '打开节目文件，留意需要人工确认的栏目。', '检查“零点节目单.md”的主持人签字栏。'),
      hint('last-message-hint', 'C02', '最后留言', '主持人曾提前解释零点后的声音。', '打开与制作人的讯息并按时间阅读。', '查看林默 23:52 发给乔安的消息。'),
      hint('source-switch-hint', 'C03', '节目源设置', '排期系统记录了声音进入主输出的方式。', '在邮件中打开节目播出方式变更通知。', '查看“零点节目改为预录”。'),
      hint('delay-search-hint', 'C04', '延迟线索', '技术搜索可能说明主人关注过怎样区分信号。', '查看零点前与广播延迟相关的浏览记录。', '打开“数字广播延迟如何测量”。'),
      hint('calendar-studio-hint', 'C05', '演播室计划', '日历备注比事件标题包含更多现场安排。', '打开零点特别节目的事件详情。', '查看 4 月 9 日“零点特别节目”的备注。'),
      hint('door-log-hint', 'C06', '实际进入记录', '计划需要由独立的物理访问记录验证。', '在系统日志中打开门禁事件详情。', '检查 00:01 的 A 演播室门禁记录。'),
    ],
    challenges: [
      { id: 'independent-producer', title: '独立制作人', description: '不使用分析提示完成推理。', requirements: [{ type: 'no-hints' }] },
      { id: 'complete-broadcast-log', title: '完整节目日志', description: '发现全部六条线索。', requirements: [{ type: 'all-clues' }] },
      { id: 'signal-crosscheck', title: '信号交叉核验', description: '建立两组案件关键矛盾关系。', requirements: [{ type: 'relation-count-at-least', value: 2 }] },
      { id: 'precise-broadcast-report', title: '精确播出报告', description: '推理可信度达到九十分。', requirements: [{ type: 'score-at-least', value: 90 }] },
      { id: 'presence-auditor', title: '在场审计员', description: '完成演播室缺席核验目标。', requirements: [{ type: 'objective', objectiveId: 'verify-studio-absence' }] },
    ],
    endingVariants: [
      { id: 'independent-signal-note', title: '首席信号注记', text: '你没有让熟悉的声音替代在场证明。节目源、排期与门禁记录被分别归档，零点后的回声因此只能证明一段预先安排的播出。', priority: 30, requirements: [{ type: 'all-clues' }, { type: 'no-hints' }, { type: 'score-at-least', value: 90 }, { type: 'relation-count-at-least', value: 2 }] },
      { id: 'complete-signal-note', title: '完整信号注记', text: '完整档案把广播信号和人员轨迹分成了两条时间线：前者按计划抵达零点，后者没有进入 A 演播室。', priority: 20, requirements: [{ type: 'all-clues' }, { type: 'score-at-least', value: 85 }, { type: 'relation-count-at-least', value: 2 }] },
    ],
  },
}
