import { useState } from 'react'
import { caseDefinition } from '../../cases/case-001/case'
import type { VirtualFile } from '../../cases/types'
import { verifyItemPassword } from '../../engine/clueEngine'
import { useGameStore } from '../../store/gameStore'

function ItemViewer({ file }: { file: VirtualFile }) {
  const { investigate, unlockedItemIds, unlockMirror, openIdentityDraft } = useGameStore()
  const [password, setPassword] = useState('')
  const [error, setError] = useState(false)
  const locked = file.id !== 'mirror.lock' && file.locked && !unlockedItemIds.includes(file.id)
  if (locked) return <div className="empty-state"><b>档案受 mirror.lock 保护</b><p>先解锁主档案。</p></div>
  if (file.id === 'mirror.lock' && !unlockedItemIds.includes('identity-draft')) return <form className="password-panel" onSubmit={(event) => { event.preventDefault(); if (verifyItemPassword(caseDefinition, file.id, password)) { unlockMirror(); setError(false) } else setError(true) }}><span>SIMULATED ENCRYPTED FILE</span><h3>输入四位访问密码</h3><input aria-label="mirror.lock 密码" inputMode="numeric" maxLength={4} value={password} onChange={(event) => setPassword(event.target.value.replace(/\D/g, ''))} /><button className="primary-button">解锁</button>{error && <p className="error-text">密码不正确。提示散落在日历里。</p>}</form>
  return <article className="document-view"><div className="document-meta">{file.name} · 本地档案</div><pre>{file.content}</pre>{file.id === 'recording' && <RecordingPlayer onTranscript={() => investigate({ type: 'VIEW_TRANSCRIPT', itemId: 'recording' })} />}{file.id === 'identity-draft' && <button className="secondary-button" onClick={openIdentityDraft}>检查身份草稿痕迹</button>}</article>
}

function RecordingPlayer({ onTranscript }: { onTranscript: () => void }) {
  const [playing, setPlaying] = useState(false)
  const [transcript, setTranscript] = useState(false)
  const playTone = () => {
    setPlaying((value) => !value)
    const AudioContextCtor = window.AudioContext
    if (!AudioContextCtor) return
    const context = new AudioContextCtor(); const oscillator = context.createOscillator(); const gain = context.createGain()
    oscillator.frequency.value = 520; gain.gain.value = 0.035; oscillator.connect(gain).connect(context.destination); oscillator.start(); oscillator.stop(context.currentTime + 0.18)
  }
  return <div className="recording-player"><div className={`waveform ${playing ? 'playing' : ''}`}>{Array.from({ length: 32 }, (_, index) => <i key={index} style={{ height: `${18 + (index * 17) % 52}%` }} />)}</div><div className="player-controls"><button onClick={playTone}>{playing ? '暂停' : '播放'}</button><input aria-label="音量" type="range" min="0" max="100" defaultValue="40" /><button onClick={() => { setTranscript(true); onTranscript() }}>辅助转写</button></div>{transcript && <p className="transcript">23:16，背景中出现本公寓电梯特有的双声提示音。</p>}</div>
}

export function FilesApp() {
  const [folder, setFolder] = useState('旅行计划')
  const [selected, setSelected] = useState<VirtualFile | null>(null)
  const investigate = useGameStore((state) => state.investigate)
  const openIdentityDraft = useGameStore((state) => state.openIdentityDraft)
  const visible = caseDefinition.files.filter((file) => file.folder === folder)
  return <div className="split-app"><nav className="sidebar-list">{caseDefinition.folders.map((item) => <button key={item.id} className={folder === item.name ? 'active' : ''} onClick={() => { setFolder(item.name); setSelected(null) }}>{item.name}</button>)}</nav><section className="app-list"><div className="list-heading"><span>{folder}</span><small>{visible.length} 个项目</small></div>{visible.map((file) => <button key={file.id} onClick={() => { setSelected(file); if (file.clueAction) investigate({ type: file.clueAction, itemId: file.id }); if (file.id === 'identity-draft') openIdentityDraft() }}><span className="file-glyph">{file.locked ? '◆' : '▤'}</span><span><strong>{file.name}</strong><small>{file.locked ? '受保护档案' : '本地文件'}</small></span></button>)}</section><section className="detail-pane">{selected ? <ItemViewer file={selected} /> : <div className="empty-state">选择一个文件以检查内容</div>}</section></div>
}

export function MailApp() {
  const [selected, setSelected] = useState(caseDefinition.emails[0]!)
  const investigate = useGameStore((state) => state.investigate)
  return <div className="split-app two-column"><section className="app-list">{caseDefinition.emails.map((email) => <button key={email.id} className={selected.id === email.id ? 'selected' : ''} onClick={() => { setSelected(email); investigate({ type: 'OPEN_ITEM', itemId: email.id }) }}><span><strong>{email.subject}</strong><small>{email.from} · {email.time}</small></span><em>{email.folder}</em></button>)}</section><article className="detail-pane mail-body"><p className="document-meta">{selected.from} → ZHOU_YU · {selected.time}</p><h3>{selected.subject}</h3><p>{selected.body}</p></article></div>
}

export function MessagesApp() {
  const [thread, setThread] = useState(caseDefinition.chats[0]!)
  const investigate = useGameStore((state) => state.investigate)
  return <div className="split-app two-column"><nav className="sidebar-list">{caseDefinition.chats.map((item) => <button key={item.id} className={thread.id === item.id ? 'active' : ''} onClick={() => setThread(item)}>{item.title}{item.messages.some((message) => message.unread) && <i className="unread-dot" />}</button>)}</nav><section className="chat-pane"><header><span>{thread.title}</span><small>本地消息存档</small></header>{thread.messages.map((message) => <button className={`chat-message ${message.sender === '周屿' ? 'mine' : ''}`} key={message.id} onClick={() => investigate({ type: 'OPEN_ITEM', itemId: message.id })}><small>{message.sender} · {message.time}</small><span>{message.text}</span>{message.attachmentId && <i>▧ 图片附件：IMG_1117</i>}</button>)}</section></div>
}
