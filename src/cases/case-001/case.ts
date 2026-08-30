import airportImage from '../../assets/illustrations/airport.svg'
import type { CaseDefinition, ClueDefinition } from '../types'

const clue = (id: string, title: string, summary: string, explanation: string, source: ClueDefinition['source'], type: ClueDefinition['discovery']['type'], itemId: string, people: string[], times: string[], places: string[], isCore = true, isRedHerring = false): ClueDefinition => ({ id, title, summary, explanation, source, discovery: { type, itemId }, people, times, places, isCore, isRedHerring })

export const caseDefinition: CaseDefinition = {
  id: 'case-001', title: '没有出发的旅行', owner: '周屿',
  timeline: ([
    ['2031-08-03 18:46', '在海津机场拍摄照片'], ['2031-10-08 02:14', '创建隐藏账户 LINRAN'],
    ['2031-11-17 21:54', '搜索更改照片时间'], ['2031-11-17 22:06', '搜索未登机通知'], ['2031-11-17 22:41', 'HX217 订单取消'],
    ['2031-11-17 23:07', '告别信 v3 移入回收站'], ['2031-11-17 23:12', '声称已经到机场'], ['2031-11-17 23:19', '发送旧机场照片'],
    ['2031-11-17 23:31', '房东发送未读消息'], ['2031-11-17 23:38', '创建未发送邮件'], ['2031-11-17 23:43', '打开身份草稿'],
    ['2031-11-17 23:48', 'LINRAN 从 HOME-NET-5G 登录'], ['2031-11-17 23:50', '系统异常中断'],
  ] satisfies [string, string][]).map(([time, text]) => ({ time, text })),
  folders: ['旅行计划', '照片', '工作', '日记', '录音', '不要打开'].map((name, index) => ({ id: `folder-${index}`, name })),
  files: [
    { id: 'itinerary', name: '北岸市_四日行程.md', folder: '旅行计划', content: '11月18日—21日：北岸市。海边、旧港、无名旅店。' },
    { id: 'flight-file', name: 'HX217_行程确认单.txt', folder: '旅行计划', content: 'HX217｜海津 07:20 → 北岸 09:05。状态文件曾被删除后恢复。' },
    { id: 'hotel', name: '北岸酒店订单.txt', folder: '旅行计划', content: '北岸潮汐酒店，11月18—21日。订单状态：有效，未取消。', clueAction: 'OPEN_ITEM' },
    { id: 'mom-draft-file', name: '给妈妈_未发送.txt', folder: '日记', content: '这不是一次旅行。〔部分数据损坏〕我只是不能再继续作为周屿生活。等你再听到我的消息时，我可能已经换了一个名字。', clueAction: 'OPEN_ITEM' },
    { id: 'recording', name: '录音_2316.rec', folder: '录音', content: '23:16｜室内环境录音。点击辅助转写以检查背景声音。' },
    { id: 'mirror.lock', name: 'mirror.lock', folder: '不要打开', content: '受保护的本地档案', locked: true, password: '1119' },
    { id: 'identity-draft', name: '林然_身份草稿.txt', folder: '不要打开', content: '姓名：林然。出生日期：11月19日。旧名字一栏被反复擦除。', locked: true },
    { id: 'linran-config', name: 'account_LINRAN.cfg', folder: '不要打开', content: 'account=LINRAN\nhidden=true\ncreated=2031-10-08 02:14', locked: true },
    { id: 'rename-todo', name: '改名后的待办清单.md', folder: '不要打开', content: '停用旧号码；只带一块硬盘；不要解释；从别处重新开始。', locked: true },
    { id: 'farewell-v1', name: '告别信_v1.txt', folder: '回收站', content: '我决定去北岸。只是一次短暂旅行。' },
    { id: 'farewell-v2', name: '告别信_v2.txt', folder: '回收站', content: '我决定离开海津。请不要找我。' },
    { id: 'farewell-v3', name: '告别信_v3.txt', folder: '回收站', content: '我决定离开周屿。请原谅这句不完整的话。', clueAction: 'COMPARE_ITEMS' },
    { id: 'shopping', name: '废弃购物清单.txt', folder: '回收站', content: '电池、胶带、咖啡、猫粮（划掉）' },
    { id: 'broken-thumb', name: 'thumb_044.tmp', folder: '回收站', content: '缩略图数据损坏，无法恢复。' },
    { id: 'who-file', name: '你正在寻找谁.txt', folder: '回收站', content: '你寻找的是离开的人，还是他留下的名字？', locked: true },
  ],
  chats: [
    { id: 'tang', title: '唐遥', messages: [
      { id: 't1', sender: '唐遥', time: '23:10', text: '到机场了吗？' }, { id: 't2', sender: '周屿', time: '23:12', text: '已经到了，等登机。', clueId: 'C02' },
      { id: 't3', sender: '周屿', time: '23:19', text: '候机区。', attachmentId: 'photo-sent' }, { id: 't4', sender: '唐遥', time: '23:23', text: '广告牌怎么还是夏季活动？你没事吧？' },
    ] },
    { id: 'landlord', title: '房东陈女士', messages: [{ id: 'l1', sender: '陈女士', time: '23:31', text: '你还没走吗？你房间的灯还亮着。', unread: true, clueId: 'C10' }] },
  ],
  emails: [
    { id: 'flight-cancel', folder: '收件箱', from: '海津航空自动服务', subject: 'HX217 订单取消成功', time: '22:41', body: '您的 HX217 行程已取消，退款将在原渠道处理。', clueId: 'C01' },
    { id: 'hotel-mail', folder: '收件箱', from: '潮汐酒店', subject: '北岸酒店预订成功', time: '11-12 10:08', body: '11月18日至21日订单有效，尚未取消。', clueId: 'C11' },
    { id: 'mom-draft', folder: '草稿', from: '周屿', subject: '给妈妈', time: '23:38', body: '这不是一次旅行。〔缺失〕我只是不能再继续作为周屿生活。等你再听到我的消息时，我可能已经换了一个名字。', clueId: 'C09' },
    { id: 'client', folder: '收件箱', from: '远镜工作室', subject: '纪录片第三版还差片尾', time: '18:02', body: '周老师，明天中午前能否补交？' },
    { id: 'marketing', folder: '收件箱', from: '海津航空', subject: '冬季早鸟航线', time: '11-16 09:00', body: '北岸冬季航线折扣信息。' },
  ],
  browser: ([
    ['history-photo', '21:54', '如何保留照片画面但更改拍摄时间', '隐私', 'C04'], ['history-no-show', '22:06', '没有登机以后航空公司会通知紧急联系人吗', '旅行', ''],
    ['history-cash', '20:33', '北岸市可以使用现金入住的短租', '旅行', ''], ['history-name', '19:48', '更改姓名需要哪些证明', '生活', ''], ['history-forget', '03:11', '忘记一个人通常需要多久', '其他', ''],
    ['h-edit', '16:20', '剪辑软件快捷键', '工作', ''], ['h-food', '22:25', '深夜外卖', '生活', ''], ['h-weather', '08:00', '海津天气', '生活', ''], ['h-music', '14:04', '氛围音乐', '工作', ''], ['h-disk', '17:44', '硬盘修复', '工作', ''],
  ] satisfies [string, string, string, string, string][]).map(([id, time, title, category, clueId]) => ({ id, time, title, category, clueId: clueId || undefined })),
  calendar: [
    { id: 'cal-flight', date: '2031-11-18', title: 'HX217 航班 07:20', note: '提前两小时出发' },
    { id: 'cal-trip', date: '2031-11-18', title: '北岸市旅行', note: '至11月21日' },
    { id: 'cal-birthday', date: '2031-11-19', title: '林然生日', note: '以后不要再忘记这一天。', clueId: 'C06' },
    { id: 'cal-work', date: '2031-11-20', title: '项目交付', note: '第三版纪录片' }, { id: 'cal-rent', date: '2031-11-30', title: '房租到期', note: '陈女士' },
  ],
  photos: [
    { id: 'photo-original', title: 'IMG_0803_机场.svg', image: airportImage, metadata: { capturedAt: '2031-08-03 18:46', exportedAt: '2031-08-03 18:46', camera: 'ARQ-CAM 4' } },
    { id: 'photo-sent', title: 'IMG_1117_发给唐遥.svg', image: airportImage, metadata: { capturedAt: '2031-08-03 18:46', exportedAt: '2031-11-17 23:18', camera: 'ARQ-CAM 4' }, clueId: 'C03' },
  ],
  logs: ([
    ['log-login', '2031-11-17 20:02', 'ZHOU_YU', '登录', '账户正常登录', ''], ['log-create', '2031-10-08 02:14', 'SYSTEM', '账户', '创建隐藏用户 LINRAN', 'C07'],
    ['log-mirror', '2031-11-17 23:43', 'ZHOU_YU', '文件', 'mirror.lock 被访问', ''], ['log-flight', '2031-11-17 22:45', 'ZHOU_YU', '文件', 'HX217 文件被删除又恢复', ''],
    ['log-linran', '2031-11-17 23:48', 'LINRAN', '登录', '从 HOME-NET-5G 本地网络登录', 'C08'], ['log-crash', '2031-11-17 23:50', 'SYSTEM', '异常', '系统异常中断', ''],
  ] satisfies [string, string, string, string, string, string][]).map(([id, time, user, eventType, detail, clueId]) => ({ id, time, user, eventType, detail, clueId: clueId || undefined })),
  clues: [
    clue('C01', '被取消的航班', '航班在出发前一晚取消。', '22:41 的邮件确认 HX217 已取消。', 'mail', 'OPEN_ITEM', 'flight-cancel', ['周屿'], ['2031-11-17 22:41'], ['海津']),
    clue('C02', '机场谎言', '取消后仍声称已经到机场。', '周屿在航班取消后对唐遥称已到机场。', 'messages', 'OPEN_ITEM', 't2', ['周屿', '唐遥'], ['2031-11-17 23:12'], ['海津机场']),
    clue('C03', '八月的照片', '发送照片原始拍摄时间为8月3日。', '导出时间虽是11月17日，原始元数据没有改变。', 'photos', 'VIEW_METADATA', 'photo-sent', ['周屿', '唐遥'], ['2031-08-03 18:46'], ['海津机场']),
    clue('C04', '修改时间的搜索', '搜索过如何更改照片拍摄时间。', '这次搜索发生在发送旧照片之前。', 'browser', 'OPEN_ITEM', 'history-photo', ['周屿'], ['2031-11-17 21:54'], ['海津']),
    clue('C05', '离开周屿', '告别信从离开海津变成离开周屿。', '措辞变化指向身份而非旅行。', 'recycle', 'COMPARE_ITEMS', 'farewell-v3', ['周屿'], ['2031-11-17 23:07'], ['海津']),
    clue('C06', '林然生日', '日历标记林然生日为11月19日。', '备注像是周屿写给自己的密码提示。', 'calendar', 'OPEN_ITEM', 'cal-birthday', ['林然'], ['2031-11-19'], ['海津']),
    clue('C07', '隐藏账户', '本机创建过隐藏用户 LINRAN。', '账户早在10月8日创建。', 'logs', 'VIEW_LOG', 'log-create', ['林然'], ['2031-10-08 02:14'], ['本机']),
    clue('C08', '住所中的新登录', 'LINRAN 从周屿家中网络登录。', '23:48 登录来源是 HOME-NET-5G。', 'logs', 'VIEW_LOG', 'log-linran', ['林然', '周屿'], ['2031-11-17 23:48'], ['周屿住所']),
    clue('C09', '不是旅行', '未发送邮件否定了普通旅行。', '草稿提到不再作为周屿生活。', 'mail', 'OPEN_ITEM', 'mom-draft', ['周屿', '母亲'], ['2031-11-17 23:38'], ['海津']),
    clue('C10', '仍亮着的灯', '房东看到房间仍亮着灯。', '消息在最后登录前17分钟发出。', 'messages', 'OPEN_ITEM', 'l1', ['周屿', '陈女士'], ['2031-11-17 23:31'], ['周屿住所']),
    clue('C11', '未取消的酒店', '北岸酒店订单仍有效。', '它可能是其他离开方式的证据，也可能只是刻意保留。', 'mail', 'OPEN_ITEM', 'hotel-mail', ['周屿'], ['2031-11-18'], ['北岸市'], false, true),
    clue('C12', '公寓的双声提示', '录音里有公寓电梯的特有双声。', '23:16 的录音说明电脑附近仍能听到住所电梯。', 'files', 'VIEW_TRANSCRIPT', 'recording', ['周屿'], ['2031-11-17 23:16'], ['周屿住所']),
  ],
  triggers: [
    { id: 'event-three-clues', kind: 'clue-count', threshold: 3, effect: { id: 'event-three-clues', type: 'NOTIFICATION', message: '别急着替我下结论。' } },
    { id: 'event-identity', kind: 'item-opened', itemId: 'identity-draft', effect: { id: 'event-identity', type: 'CLOCK_OFFSET', minutes: -1, message: '系统时钟发生一次异常偏移。' } },
    { id: 'event-eight-clues', kind: 'clue-count', threshold: 8, effect: { id: 'event-eight-clues', type: 'UNLOCK_ITEM', itemId: 'who-file', message: '回收站检测到一个新文件。' } },
  ],
  questions: [
    { id: 'what', prompt: '周屿最可能做了什么？', options: [{ id: 'normal-trip', label: '正常前往北岸市' }, { id: 'forced', label: '被人强迫带走' }, { id: 'fabricated-departure', label: '主动制造已经离开的假象' }, { id: 'unknown', label: '证据不足' }], correctId: 'fabricated-departure', points: 25 },
    { id: 'where', prompt: '23:48时周屿或LINRAN最可能在哪里？', options: [{ id: 'airport', label: '海津机场' }, { id: 'north', label: '北岸市' }, { id: 'home', label: '周屿的住所' }, { id: 'unknown', label: '无法判断' }], correctId: 'home', points: 20 },
    { id: 'who', prompt: '林然最可能是谁？', options: [{ id: 'new-identity', label: '周屿准备使用的新身份' }, { id: 'friend', label: '周屿的朋友' }, { id: 'relative', label: '房东的亲属' }, { id: 'airline', label: '航空公司工作人员' }], correctId: 'new-identity', points: 20 },
  ],
  coreEvidenceIds: ['C01', 'C02', 'C03', 'C05', 'C08', 'C09'], correctContradictions: [['C01', 'C02'], ['C03', 'C04']],
  ending: '你找到的不是答案，只是一种能让这些文件说得通的顺序。',
}
