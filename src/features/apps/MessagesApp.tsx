import { useMemo, useState } from 'react'
import { caseDefinition } from '../../cases/case-001/case'
import { useGameStore } from '../../store/gameStore'
import { useWindowStore } from '../../store/windowStore'
import { AppStatusBar, AppToolbar, PaneHeader } from './AppChrome'

export function MessagesApp() {
  const [thread, setThread] = useState(caseDefinition.chats[0]!)
  const [query, setQuery] = useState('')
  const { investigate, discoveredClueIds, pinnedClueIds, togglePinned } = useGameStore()
  const visibleThreads = useMemo(() => caseDefinition.chats.filter((item) => `${item.title} ${item.messages.map((message) => message.text).join(' ')}`.includes(query)), [query])
  const activeThread = visibleThreads.find((item) => item.id === thread.id) ?? visibleThreads[0] ?? thread
  const threadClues = activeThread.messages.flatMap((message) => message.clueId ? [message.clueId] : []).filter((id) => discoveredClueIds.includes(id))

  return (
    <div className="application messages-app">
      <AppToolbar><strong>讯息存档</strong><input type="search" aria-label="搜索会话" placeholder="搜索联系人或消息" value={query} onChange={(event) => setQuery(event.target.value)} /><span>只读快照 · 2031.11.17</span></AppToolbar>
      <div className="messages-layout">
        <nav className="contact-list" aria-label="联系人"><PaneHeader title="会话" meta={`${visibleThreads.length}`} />{visibleThreads.map((item) => <button key={item.id} data-active={activeThread.id === item.id} onClick={() => setThread(item)}><i className="avatar">{item.title.slice(0, 1)}</i><span><strong>{item.title}</strong><small>{item.messages.at(-1)?.text}</small></span><time>{item.messages.at(-1)?.time}</time>{item.messages.some((message) => message.unread) && <b aria-label="1 条未读">1</b>}</button>)}{visibleThreads.length === 0 && <div className="empty-state">没有匹配会话</div>}</nav>
        <section className="message-timeline"><PaneHeader title={activeThread.title} meta="本地消息存档 · 离线" /><div className="timeline-date">2031 年 11 月 17 日</div>{activeThread.messages.map((message) => <article className={`message-entry ${message.sender === '周屿' ? 'mine' : ''}`} key={message.id}><button className="message-body" onClick={() => investigate({ type: 'OPEN_ITEM', itemId: message.id })}><span className="message-author">{message.sender} · {message.time}</span><p>{message.text}</p><small>{message.sender === '周屿' ? '已读' : message.unread ? '未读' : '已接收'}</small></button>{message.attachmentId && <button className="message-attachment" aria-label="打开图片附件 IMG_1117" onClick={() => useWindowStore.getState().openWindow('photos')}><span className="attachment-placeholder">IMG_1117</span><small>图片附件 · 326 KB · 在照片中打开</small></button>}</article>)}</section>
        <aside className="conversation-info"><PaneHeader title="会话详情" /><dl><dt>参与者</dt><dd>周屿、{activeThread.title}</dd><dt>在线状态</dt><dd>离线存档</dd><dt>消息数量</dt><dd>{activeThread.messages.length}</dd><dt>首条记录</dt><dd>{activeThread.messages[0]?.time}</dd><dt>数据来源</dt><dd>本地消息数据库快照</dd></dl><button disabled={!threadClues.length} onClick={() => threadClues[0] && togglePinned(threadClues[0])}>{threadClues[0] && pinnedClueIds.includes(threadClues[0]) ? '移出证据板' : '将已发现消息加入证据板'}</button></aside>
      </div>
      <AppStatusBar><span>{activeThread.messages.length} 条消息</span><span>未读状态已封存</span></AppStatusBar>
    </div>
  )
}
