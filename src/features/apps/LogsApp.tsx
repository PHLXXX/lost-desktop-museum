import { useMemo, useState } from 'react'
import { useActiveCaseDefinition } from '../../cases/useActiveCase'
import type { SystemLog } from '../../cases/types'
import { useGameStore } from '../../store/gameStore'
import { AppStatusBar, AppToolbar, PaneHeader } from './AppChrome'

function levelFor(log: SystemLog) {
  if (log.eventType === '异常') return '错误'
  if (log.eventType === '账户') return '警告'
  return '信息'
}

function sourceFor(log: SystemLog) {
  if (log.eventType === '登录' || log.eventType === '账户') return 'SESSION'
  if (log.eventType === '文件') return 'FILE-SERVICE'
  return 'SYSTEM'
}

export function LogsApp() {
  const caseDefinition = useActiveCaseDefinition()
  const [query, setQuery] = useState('')
  const [user, setUser] = useState('全部')
  const [type, setType] = useState('全部')
  const [time, setTime] = useState('全部')
  const [level, setLevel] = useState('全部')
  const [selected, setSelected] = useState(caseDefinition.logs[0]!)
  const investigate = useGameStore((state) => state.investigate)

  const logs = useMemo(() => {
    const term = query.trim().toLocaleLowerCase('zh-CN')
    return caseDefinition.logs.filter((log) => {
      const matchesQuery = !term || [log.id, log.time, log.user, log.eventType, log.detail, sourceFor(log)]
        .some((value) => value.toLocaleLowerCase('zh-CN').includes(term))
      return matchesQuery
        && (user === '全部' || log.user === user)
        && (type === '全部' || log.eventType === type)
        && (time === '全部' || log.time.startsWith(time))
        && (level === '全部' || levelFor(log) === level)
    })
  }, [caseDefinition.logs, level, query, time, type, user])

  const openLog = (log: SystemLog) => {
    setSelected(log)
    investigate({ type: 'VIEW_LOG', itemId: log.id })
  }

  return (
    <div className="application logs-application">
      <AppToolbar>
        <input
          type="search"
          aria-label="搜索日志"
          placeholder="搜索事件、用户或来源"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <select aria-label="时间筛选" value={time} onChange={(event) => setTime(event.target.value)}>
          {['全部', '2031-11-17', '2031-10-08'].map((item) => <option key={item}>{item}</option>)}
        </select>
        <select aria-label="用户筛选" value={user} onChange={(event) => setUser(event.target.value)}>
          {['全部', 'ZHOU_YU', 'LINRAN', 'SYSTEM'].map((item) => <option key={item}>{item}</option>)}
        </select>
        <select aria-label="事件类型筛选" value={type} onChange={(event) => setType(event.target.value)}>
          {['全部', '登录', '账户', '文件', '异常'].map((item) => <option key={item}>{item}</option>)}
        </select>
        <select aria-label="级别筛选" value={level} onChange={(event) => setLevel(event.target.value)}>
          {['全部', '信息', '警告', '错误'].map((item) => <option key={item}>{item}</option>)}
        </select>
        <button disabled title="档案保护模式下不允许导出日志">导出 CSV</button>
      </AppToolbar>
      <div className="logs-layout">
        <section className="log-data-table" aria-label="系统日志列表">
          <div className="data-head"><span>时间</span><span>级别 / 用户</span><span>来源 / 编号</span><span>摘要</span></div>
          {logs.map((log) => (
            <button key={log.id} data-selected={selected.id === log.id} onClick={() => openLog(log)}>
              <time>{log.time}</time>
              <span><b>{levelFor(log)}</b> · {log.user}</span>
              <span>{sourceFor(log)} · {log.id}</span>
              <strong>{log.detail}</strong>
            </button>
          ))}
          {logs.length === 0 && <p className="empty-records">没有符合当前筛选条件的事件。</p>}
        </section>
        <aside className="record-detail">
          <PaneHeader title="事件详情" />
          <dl>
            <dt>事件 ID</dt><dd>{selected.id}</dd>
            <dt>时间戳</dt><dd>{selected.time}</dd>
            <dt>级别</dt><dd>{levelFor(selected)}</dd>
            <dt>用户</dt><dd>{selected.user}</dd>
            <dt>事件类型</dt><dd>{selected.eventType}</dd>
            <dt>详情</dt><dd>{selected.detail}</dd>
            <dt>来源</dt><dd>ARCHIVE/OS 本地事件日志</dd>
          </dl>
        </aside>
      </div>
      <AppStatusBar><span>显示 {logs.length} / {caseDefinition.logs.length} 条</span><span>完整性：已验证</span></AppStatusBar>
    </div>
  )
}
