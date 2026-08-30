import { useState } from 'react'
import { caseDefinition } from '../../cases/case-001/case'
import type { CalendarEvent } from '../../cases/types'
import { useGameStore } from '../../store/gameStore'
import { AppStatusBar, AppToolbar, PaneHeader } from './AppChrome'

const monthLabel = (month: number) => `2031 年 ${month} 月`

export function CalendarApp() {
  const [mode, setMode] = useState<'month' | 'list'>('month')
  const [month, setMonth] = useState(11)
  const [selected, setSelected] = useState<CalendarEvent | null>(caseDefinition.calendar[0] ?? null)
  const investigate = useGameStore((state) => state.investigate)
  const events = month === 11 ? caseDefinition.calendar : []
  const select = (event: CalendarEvent) => { setSelected(event); investigate({ type: 'OPEN_ITEM', itemId: event.id }) }

  return (
    <div className="application calendar-application">
      <AppToolbar>
        <button onClick={() => setMonth(11)}>今天</button>
        <button aria-label="上个月" onClick={() => { setMonth((value) => Math.max(1, value - 1)); setSelected(null) }}>←</button>
        <strong>{monthLabel(month)}</strong>
        <button aria-label="下个月" onClick={() => { setMonth((value) => Math.min(12, value + 1)); setSelected(null) }}>→</button>
        <span className="path-field" />
        <button data-active={mode === 'month'} onClick={() => setMode('month')}>月视图</button>
        <button data-active={mode === 'list'} onClick={() => setMode('list')}>列表</button>
      </AppToolbar>
      <div className="calendar-layout">
        <section className="calendar-main">
          {mode === 'month' ? <><div className="weekday-row">{['一', '二', '三', '四', '五', '六', '日'].map((day) => <span key={day}>周{day}</span>)}</div><div className="month-grid">{Array.from({ length: 35 }, (_, index) => { const day = index - 4; const dayEvents = events.filter((event) => Number(event.date.slice(-2)) === day); return <div key={index} data-outside={day < 1 || day > 30}><time>{day > 0 && day <= 30 ? day : ''}</time>{dayEvents.map((event) => <button key={event.id} onClick={() => select(event)}>{event.title}</button>)}</div> })}</div></> : <div className="event-list">{events.map((event) => <button key={event.id} onClick={() => select(event)}><time>{event.date}</time><span><strong>{event.title}</strong><small>个人日历 · 点击查看详情</small></span></button>)}{events.length === 0 && <div className="empty-state">本月没有恢复到的日程</div>}</div>}
        </section>
        <aside className="record-detail"><PaneHeader title="事件详情" />{selected ? <><h3>{selected.title}</h3><dl><dt>日期</dt><dd>{selected.date}</dd><dt>备注</dt><dd>{selected.note}</dd><dt>日历</dt><dd>ZHOU_YU / 个人</dd><dt>状态</dt><dd>未完成</dd></dl></> : <div className="empty-state">选择事件以查看备注</div>}</aside>
      </div>
      <AppStatusBar><span>{monthLabel(month)} · {events.length} 个事件</span><span>本地日历快照</span></AppStatusBar>
    </div>
  )
}
