import { useMemo, useState } from 'react'
import { caseDefinition } from '../../cases/case-001/case'
import type { BrowserHistoryEntry } from '../../cases/types'
import { useGameStore } from '../../store/gameStore'
import { AppStatusBar, AppToolbar, PaneHeader } from './AppChrome'

const domain = (category: string) => ({ 旅行: 'travel.local', 隐私: 'privacy.local', 生活: 'life.local', 工作: 'studio.local', 其他: 'archive.local' }[category] ?? 'archive.local')

export function HistoryApp() {
  const [query, setQuery] = useState('')
  const [date, setDate] = useState('全部日期')
  const [descending, setDescending] = useState(true)
  const [selected, setSelected] = useState<BrowserHistoryEntry | null>(caseDefinition.browser[0] ?? null)
  const { investigate, discoveredClueIds, pinnedClueIds, togglePinned } = useGameStore()
  const entries = useMemo(() => caseDefinition.browser.filter((entry) => {
    const haystack = `${entry.title} ${domain(entry.category)} ${entry.category} 本机浏览器`.toLowerCase()
    return (date === '全部日期' || date === '2031-11-17') && haystack.includes(query.toLowerCase())
  }).sort((a, b) => descending ? b.time.localeCompare(a.time) : a.time.localeCompare(b.time)), [query, date, descending])

  const openEntry = (entry: BrowserHistoryEntry) => { setSelected(entry); investigate({ type: 'OPEN_ITEM', itemId: entry.id }) }
  const clueId = selected?.clueId
  return (
    <div className="application history-app">
      <AppToolbar>
        <input type="search" aria-label="搜索浏览记录" placeholder="搜索标题、域名或类别" value={query} onChange={(event) => setQuery(event.target.value)} />
        <select aria-label="日期筛选" value={date} onChange={(event) => setDate(event.target.value)}><option>全部日期</option><option>2031-11-17</option></select>
        <button onClick={() => setDescending(!descending)}>访问时间 {descending ? '↓' : '↑'}</button>
        <button disabled title="档案快照为只读，不能导出到外部位置。">导出所选</button>
      </AppToolbar>
      <div className="history-layout">
        <section className="history-table"><div className="data-head"><span>时间</span><span>标题</span><span>域名</span><span>次数</span><span>设备</span></div>{entries.map((entry, index) => <button key={entry.id} data-selected={selected?.id === entry.id} onClick={() => openEntry(entry)}><time>{entry.time}</time><strong>{entry.title}</strong><span>{domain(entry.category)}</span><span>{1 + index % 3}</span><span>本机浏览器</span></button>)}{entries.length === 0 && <div className="empty-state">没有匹配的浏览记录</div>}</section>
        <aside className="record-detail"><PaneHeader title="记录详情" />{selected ? <><dl><dt>标题</dt><dd>{selected.title}</dd><dt>访问时间</dt><dd>2031.11.17 {selected.time}</dd><dt>域名</dt><dd>{domain(selected.category)}</dd><dt>访问次数</dt><dd>{1 + caseDefinition.browser.indexOf(selected) % 3}</dd><dt>设备</dt><dd>ZHOU-YU-DESKTOP</dd><dt>恢复方式</dt><dd>本地 History 数据库</dd></dl><button disabled={!clueId || !discoveredClueIds.includes(clueId)} onClick={() => clueId && togglePinned(clueId)}>{clueId && pinnedClueIds.includes(clueId) ? '移出证据板' : '加入证据板'}</button></> : <div className="empty-state">选择记录以查看详情</div>}</aside>
      </div>
      <AppStatusBar><span>{entries.length} 条历史记录</span><span>快照时间 2031.11.17 23:50</span></AppStatusBar>
    </div>
  )
}
