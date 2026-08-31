import { useMemo, useState } from 'react'
import { useActiveCaseDefinition } from '../../cases/useActiveCase'
import type { EmailMessage } from '../../cases/types'
import { useGameStore } from '../../store/gameStore'
import { AppStatusBar, AppToolbar, PaneHeader } from './AppChrome'

type MailFolder = EmailMessage['folder'] | '已发送' | '垃圾邮件' | '已删除'
const folders: MailFolder[] = ['收件箱', '已发送', '草稿', '垃圾邮件', '已删除']

export function MailApp() {
  const caseDefinition = useActiveCaseDefinition()
  const [folder, setFolder] = useState<MailFolder>('收件箱')
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<EmailMessage | null>(caseDefinition.emails[0] ?? null)
  const { investigate, discoveredClueIds, pinnedClueIds, togglePinned } = useGameStore()
  const messages = useMemo(() => caseDefinition.emails.filter((email) => email.folder === folder && `${email.from} ${email.subject} ${email.body}`.toLowerCase().includes(query.toLowerCase())), [caseDefinition.emails, folder, query])

  const changeFolder = (nextFolder: MailFolder) => {
    setFolder(nextFolder)
    setQuery('')
    setSelected(caseDefinition.emails.find((email) => email.folder === nextFolder) ?? null)
  }
  const openMessage = (email: EmailMessage) => {
    setSelected(email)
    investigate({ type: 'OPEN_ITEM', itemId: email.id })
  }
  const canPin = Boolean(selected?.clueId && discoveredClueIds.includes(selected.clueId))

  return (
    <div className="application mail-app">
      <AppToolbar>
        <button onClick={() => { setQuery(''); setSelected(messages[0] ?? null) }}>刷新</button>
        <button disabled={!canPin} onClick={() => { if (selected?.clueId) togglePinned(selected.clueId) }}>{selected?.clueId && pinnedClueIds.includes(selected.clueId) ? '移出证据板' : '加入证据板'}</button>
        <span className="path-field">ZHOU_YU@LOCAL / {folder}</span>
        <input type="search" aria-label="搜索邮件" placeholder="搜索发件人、主题或正文" value={query} onChange={(event) => setQuery(event.target.value)} />
      </AppToolbar>
      <div className="mail-layout">
        <nav className="mail-folders" aria-label="邮件文件夹"><PaneHeader title="邮箱" />{folders.map((item) => <button key={item} data-active={folder === item} onClick={() => changeFolder(item)}>{item} <b>{caseDefinition.emails.filter((email) => email.folder === item).length}</b></button>)}</nav>
        <section className="mail-list">
          <PaneHeader title={folder} meta={`${messages.length} 封`} />
          {messages.map((email) => <button key={email.id} data-selected={selected?.id === email.id} onClick={() => openMessage(email)}><span><strong>{email.subject}</strong><small>{email.from}</small><small>{email.body.slice(0, 32)}…</small></span><time>{email.time}</time>{email.attachmentName && <i aria-label="有附件">附件</i>}</button>)}
          {messages.length === 0 && <div className="empty-state"><b>{query ? '没有匹配邮件' : `${folder}为空`}</b><p>{query ? '修改搜索条件后重试。' : '离线快照中没有该文件夹的记录。'}</p></div>}
        </section>
        <article className="mail-reader">
          {selected ? <><header><span className="status-chip">{selected.folder}</span><h3>{selected.subject}</h3><dl><dt>发件人</dt><dd>{selected.from}</dd><dt>收件人</dt><dd>ZHOU_YU@LOCAL</dd><dt>完整时间</dt><dd>2031.11.17 {selected.time}</dd></dl></header><p>{selected.body}</p>{selected.attachmentName && <section className="mail-attachment"><strong>附件</strong><span>{selected.attachmentName}</span><small>本地只读副本</small></section>}{selected.folder === '草稿' && <aside className="draft-warning">这封邮件从未发送。保存的内容可能不完整。</aside>}</> : <div className="empty-state">选择邮件以阅读正文</div>}
        </article>
      </div>
      <AppStatusBar><span>{folder} · {messages.length} 封</span><span>同步状态：离线快照</span></AppStatusBar>
    </div>
  )
}
