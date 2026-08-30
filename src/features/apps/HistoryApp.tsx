import { useMemo, useState } from 'react'
import { caseDefinition } from '../../cases/case-001/case'
import { useGameStore } from '../../store/gameStore'
import { AppStatusBar, AppToolbar, PaneHeader } from './AppChrome'

const domain = (category: string) => ({ 旅行: 'travel.local', 隐私: 'privacy.local', 生活: 'life.local', 工作: 'studio.local', 其他: 'archive.local' }[category] ?? 'archive.local')

export function HistoryApp() {
  const [query, setQuery] = useState(''); const [descending, setDescending] = useState(true); const [selected, setSelected] = useState(caseDefinition.browser[0]!); const investigate = useGameStore((state) => state.investigate)
  const entries = useMemo(() => caseDefinition.browser.filter((entry) => entry.title.includes(query)).sort((a, b) => descending ? b.time.localeCompare(a.time) : a.time.localeCompare(b.time)), [query, descending])
  return <div className="application history-app"><AppToolbar><input aria-label="搜索浏览记录" placeholder="搜索标题、域名或类别" value={query} onChange={(event) => setQuery(event.target.value)} /><button onClick={() => setDescending(!descending)}>访问时间 {descending ? '↓' : '↑'}</button><button>导出所选</button></AppToolbar><div className="history-layout"><section className="history-table"><div className="data-head"><span>时间</span><span>标题</span><span>域名</span><span>次数</span><span>设备</span></div>{entries.map((entry, index) => <button key={entry.id} data-selected={selected.id === entry.id} onClick={() => { setSelected(entry); investigate({ type: 'OPEN_ITEM', itemId: entry.id }) }}><time>{entry.time}</time><strong>{entry.title}</strong><span>{domain(entry.category)}</span><span>{1 + index % 3}</span><span>本机浏览器</span></button>)}</section><aside className="record-detail"><PaneHeader title="记录详情" /><dl><dt>标题</dt><dd>{selected.title}</dd><dt>访问时间</dt><dd>2031.11.17 {selected.time}</dd><dt>域名</dt><dd>{domain(selected.category)}</dd><dt>类别</dt><dd>{selected.category}</dd><dt>来源设备</dt><dd>ZHOU-YU-DESKTOP</dd><dt>恢复方式</dt><dd>本地 History 数据库</dd></dl></aside></div><AppStatusBar><span>{entries.length} 条历史记录</span><span>快照时间 2031.11.17 23:50</span></AppStatusBar></div>
}
