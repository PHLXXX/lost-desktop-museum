import { useState } from 'react'
import { caseDefinition } from '../../cases/case-001/case'
import { useGameStore } from '../../store/gameStore'
import { AppStatusBar, AppToolbar, PaneHeader } from './AppChrome'

export function MessagesApp() {
  const [thread, setThread] = useState(caseDefinition.chats[0]!)
  const investigate = useGameStore((state) => state.investigate)
  return (
    <div className="application messages-app">
      <AppToolbar>
        <strong>讯息存档</strong>
        <input aria-label="搜索会话" placeholder="搜索会话" />
        <span>只读快照 · 2031.11.17</span>
      </AppToolbar>
      <div className="messages-layout">
        <nav className="contact-list" aria-label="联系人">
          <PaneHeader title="会话" meta={`${caseDefinition.chats.length}`} />
          {caseDefinition.chats.map((item) => (
            <button
              key={item.id}
              data-active={thread.id === item.id}
              onClick={() => setThread(item)}
            >
              <i className="avatar">{item.title.slice(0, 1)}</i>
              <span>
                <strong>{item.title}</strong>
                <small>{item.messages.at(-1)?.text}</small>
              </span>
              <time>{item.messages.at(-1)?.time}</time>
              {item.messages.some((message) => message.unread) && <b>1</b>}
            </button>
          ))}
        </nav>
        <section className="message-timeline">
          <PaneHeader title={thread.title} meta="本地消息存档" />
          <div className="timeline-date">2031 年 11 月 17 日</div>
          {thread.messages.map((message) => (
            <button
              className={`message-entry ${message.sender === '周屿' ? 'mine' : ''}`}
              key={message.id}
              onClick={() => investigate({ type: 'OPEN_ITEM', itemId: message.id })}
            >
              <span className="message-author">
                {message.sender} · {message.time}
              </span>
              <p>{message.text}</p>
              {message.attachmentId && (
                <figure>
                  <div className="attachment-placeholder">IMG_1117</div>
                  <figcaption>图片附件 · 326 KB</figcaption>
                </figure>
              )}
            </button>
          ))}
        </section>
        <aside className="conversation-info">
          <PaneHeader title="会话详情" />
          <dl>
            <dt>参与者</dt>
            <dd>周屿、{thread.title}</dd>
            <dt>消息数量</dt>
            <dd>{thread.messages.length}</dd>
            <dt>首条记录</dt>
            <dd>{thread.messages[0]?.time}</dd>
            <dt>数据来源</dt>
            <dd>本地消息数据库快照</dd>
          </dl>
        </aside>
      </div>
      <AppStatusBar>
        <span>{thread.messages.length} 条消息</span>
        <span>未读状态已封存</span>
      </AppStatusBar>
    </div>
  )
}
