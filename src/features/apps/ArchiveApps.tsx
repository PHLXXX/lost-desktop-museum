import { useEffect, useMemo, useState } from 'react'
import { caseDefinition } from '../../cases/case-001/case'
import { useGameStore } from '../../store/gameStore'

export function PhotosApp() {
  const [index, setIndex] = useState(0); const [metadata, setMetadata] = useState(false); const [properties, setProperties] = useState(false); const [zoom, setZoom] = useState(1)
  const photo = caseDefinition.photos[index]!; const investigate = useGameStore((state) => state.investigate); const togglePinned = useGameStore((state) => state.togglePinned); const discovered = useGameStore((state) => state.discoveredClueIds); const pinned = useGameStore((state) => state.pinnedClueIds)
  return <div className="photo-app"><div className="photo-stage"><img src={photo.image} alt="虚构海津机场候机区" style={{ transform: `scale(${zoom})` }} /></div><aside><p className="document-meta">{photo.title}</p><div className="toolbar"><button onClick={() => { setIndex((index - 1 + 2) % 2); setMetadata(false); setProperties(false) }}>上一张</button><button onClick={() => { setIndex((index + 1) % 2); setMetadata(false); setProperties(false) }}>下一张</button><button onClick={() => setZoom(Math.max(.7, zoom - .15))}>−</button><button onClick={() => setZoom(Math.min(1.8, zoom + .15))}>＋</button></div><div className="toolbar"><button onClick={() => setProperties(!properties)}>查看属性</button><button className="primary-button" onClick={() => { setMetadata(true); investigate({ type: 'VIEW_METADATA', itemId: photo.id }) }}>查看元数据</button><button disabled={photo.id !== 'photo-sent' || !discovered.includes('C03')} onClick={() => togglePinned('C03')}>{pinned.includes('C03') ? '已加入证据板' : '加入证据板'}</button></div>{properties && <dl className="metadata"><dt>文件格式</dt><dd>本地 SVG 图像</dd><dt>档案编号</dt><dd>{photo.id}</dd></dl>}{metadata && <dl className="metadata"><dt>原始拍摄</dt><dd>{photo.metadata.capturedAt}</dd><dt>导出文件</dt><dd>{photo.metadata.exportedAt}</dd><dt>设备</dt><dd>{photo.metadata.camera}</dd></dl>}</aside></div>
}

export function BrowserApp() {
  const [query, setQuery] = useState(''); const [descending, setDescending] = useState(true); const investigate = useGameStore((state) => state.investigate)
  const entries = useMemo(() => caseDefinition.browser.filter((entry) => entry.title.includes(query)).sort((a, b) => descending ? b.time.localeCompare(a.time) : a.time.localeCompare(b.time)), [query, descending])
  return <div className="single-app"><div className="app-toolbar"><input aria-label="搜索浏览记录" placeholder="搜索浏览记录" value={query} onChange={(event) => setQuery(event.target.value)} /><button onClick={() => setDescending(!descending)}>时间 {descending ? '↓' : '↑'}</button></div><div className="history-list">{entries.map((entry) => <button key={entry.id} onClick={() => investigate({ type: 'OPEN_ITEM', itemId: entry.id })}><time>{entry.time}</time><span><strong>{entry.title}</strong><small>{entry.category} · 本地历史</small></span><i>›</i></button>)}</div></div>
}

export function CalendarApp() {
  const investigate = useGameStore((state) => state.investigate)
  return <div className="calendar-app"><header><p>NOVEMBER</p><strong>2031 / 11</strong><span>18—30</span></header><div className="calendar-grid">{caseDefinition.calendar.map((event) => <button key={event.id} onClick={() => investigate({ type: 'OPEN_ITEM', itemId: event.id })}><time>{event.date.slice(-2)}</time><span><strong>{event.title}</strong><small>{event.note}</small></span></button>)}</div></div>
}

export function RecycleApp() {
  const unlocked = useGameStore((state) => state.unlockedItemIds); const investigate = useGameStore((state) => state.investigate); const [selected, setSelected] = useState<string | null>(null); const [restored, setRestored] = useState<string[]>([])
  const files = caseDefinition.files.filter((file) => file.folder === '回收站' && (!file.locked || unlocked.includes(file.id)) && !restored.includes(file.id))
  const active = files.find((file) => file.id === selected)
  return <div className="split-app two-column"><section className="app-list">{files.map((file) => <button key={file.id} onClick={() => { setSelected(file.id); if (file.id === 'farewell-v3') investigate({ type: 'COMPARE_ITEMS', itemId: file.id }) }}><span><strong>{file.name}</strong><small>可预览 · 可恢复</small></span></button>)}{restored.length > 0 && <p className="restored-note">已恢复 {restored.length} 个文件</p>}</section><article className="detail-pane document-view">{active ? <><div className="document-meta">回收站预览</div><h3>{active.name}</h3><p>{active.content}</p><button className="secondary-button" onClick={() => { setRestored((items) => [...items, active.id]); setSelected(null) }}>恢复到原位置</button></> : <div className="empty-state">比较三个版本，看看“离开”的对象如何变化。</div>}</article></div>
}

export function LogsApp() {
  const [user, setUser] = useState('全部'); const [type, setType] = useState('全部'); const [time, setTime] = useState('全部'); const investigate = useGameStore((state) => state.investigate)
  const logs = caseDefinition.logs.filter((log) => (user === '全部' || log.user === user) && (type === '全部' || log.eventType === type) && (time === '全部' || log.time.startsWith(time)))
  return <div className="single-app logs-app"><div className="app-toolbar"><select aria-label="时间筛选" value={time} onChange={(event) => setTime(event.target.value)}>{['全部', '2031-11-17', '2031-10-08'].map((item) => <option key={item}>{item}</option>)}</select><select aria-label="用户筛选" value={user} onChange={(event) => setUser(event.target.value)}>{['全部', 'ZHOU_YU', 'LINRAN', 'SYSTEM'].map((item) => <option key={item}>{item}</option>)}</select><select aria-label="事件类型筛选" value={type} onChange={(event) => setType(event.target.value)}>{['全部', '登录', '账户', '文件', '异常'].map((item) => <option key={item}>{item}</option>)}</select></div><div className="log-table"><div className="log-head"><span>时间</span><span>用户</span><span>类型</span><span>事件</span></div>{logs.map((log) => <button key={log.id} onClick={() => investigate({ type: 'VIEW_LOG', itemId: log.id })}><time>{log.time}</time><b>{log.user}</b><em>{log.eventType}</em><span>{log.detail}</span></button>)}</div></div>
}

export function SettingsApp() {
  const { settings, updateSettings, resetCase } = useGameStore(); const [confirm, setConfirm] = useState(false)
  useEffect(() => { if (!confirm) return; const close = (event: KeyboardEvent) => { if (event.key === 'Escape') setConfirm(false) }; window.addEventListener('keydown', close); return () => window.removeEventListener('keydown', close) }, [confirm])
  return <div className="settings-app"><header><p>ARCHIVE/OS</p><h3>系统与调查设置</h3></header><label><span><b>系统音效</b><small>程序化提示音，不加载外部音频</small></span><input type="checkbox" checked={settings.sound} onChange={(event) => updateSettings({ sound: event.target.checked })} /></label><label><span><b>动态异常效果</b><small>关闭时保留必要剧情文字</small></span><input type="checkbox" checked={settings.anomalies} onChange={(event) => updateSettings({ anomalies: event.target.checked })} /></label><label><span><b>扫描线强度</b><small>{Math.round(settings.scanlines * 100)}%</small></span><input type="range" min="0" max="1" step=".05" value={settings.scanlines} onChange={(event) => updateSettings({ scanlines: Number(event.target.value) })} /></label><details><summary>操作说明</summary><p>双击桌面图标打开应用；拖动标题栏移动窗口；调查具体条目才会发现线索；发现六条线索后可提交推理。</p></details><button className="danger-button" onClick={() => setConfirm(true)}>重置案件</button>{confirm && <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="确认重置案件"><div className="confirm-card"><h3>确认重置案件？</h3><p>所有线索、关系和推理会被清除，显示偏好将保留。</p><div><button autoFocus onClick={() => setConfirm(false)}>取消</button><button className="danger-button" onClick={() => { resetCase(); setConfirm(false) }}>再次确认重置</button></div></div></div>}</div>
}
