import { useEffect, useMemo, useRef, useState } from 'react'
import { useActiveCaseDefinition } from '../../cases/useActiveCase'
import type { VirtualFile } from '../../cases/types'
import { verifyItemPassword } from '../../engine/clueEngine'
import { playArchiveSound } from '../../engine/audioEngine'
import { useGameStore } from '../../store/gameStore'
import { AppStatusBar, AppToolbar, PaneHeader } from './AppChrome'

function fileType(file: VirtualFile) { return file.locked ? '受保护档案' : (file.name.split('.').at(-1)?.toUpperCase() ?? '文件') }
function fileSize(file: VirtualFile) { return `${Math.max(2, Math.ceil(file.content.length / 12))} KB` }
function modifiedAt(file: VirtualFile) { return file.id === 'farewell-v3' ? '2031.11.17 23:07' : `2031.11.${String(12 + (file.name.length % 6)).padStart(2, '0')} 22:${String(file.content.length % 60).padStart(2, '0')}` }
function systemUser(owner: string) { return owner.replace(/\s+/g, '_').toUpperCase() }

function FilePreview({ file }: { file: VirtualFile }) {
  const caseDefinition = useActiveCaseDefinition()
  const { investigate, unlockedItemIds, unlockMirror, openIdentityDraft } = useGameStore()
  const [password, setPassword] = useState('')
  const [error, setError] = useState(false)
  const [transcript, setTranscript] = useState(false)
  if (file.id !== 'mirror.lock' && file.locked && !unlockedItemIds.includes(file.id)) return <div className="empty-state"><b>档案受 mirror.lock 保护</b><p>先在“不要打开”中解锁主档案。</p></div>
  if (file.id === 'mirror.lock' && !unlockedItemIds.includes('identity-draft')) return <form className="password-panel" onSubmit={(event) => { event.preventDefault(); if (verifyItemPassword(caseDefinition, file.id, password)) { unlockMirror(); setError(false) } else { playArchiveSound('error', useGameStore.getState().settings.sound); setError(true) } }}><span>ENCRYPTED ARCHIVE</span><h3>输入四位访问密码</h3><label>访问密码<input aria-label="mirror.lock 密码" inputMode="numeric" maxLength={4} value={password} onChange={(event) => setPassword(event.target.value.replace(/\D/g, ''))} /></label><button className="primary-button">解锁</button>{error && <p className="error-text" role="alert">密码不正确。提示散落在日历里。</p>}</form>
  return <article className="document-view"><p className="document-meta">{file.name} · 本地档案</p><pre>{file.content}</pre>{file.id === 'recording' && <div className="recording-player"><div className="waveform">{Array.from({ length: 26 }, (_, index) => <i key={index} style={{ height: `${22 + (index * 19) % 50}%` }} />)}</div><button onClick={() => { setTranscript(true); investigate({ type: 'VIEW_TRANSCRIPT', itemId: 'recording' }) }}>辅助转写</button>{transcript && <p className="transcript">23:16，背景中出现本公寓电梯特有的双声提示音。</p>}</div>}{file.id === 'identity-draft' && <button className="secondary-button" onClick={openIdentityDraft}>检查身份草稿痕迹</button>}</article>
}

export function FilesApp() {
  const caseDefinition = useActiveCaseDefinition()
  const { investigate, openIdentityDraft, restoredItemIds, discoveredClueIds, pinnedClueIds, togglePinned } = useGameStore()
  const initialFolder = caseDefinition.folders[0]?.name ?? caseDefinition.files[0]?.folder ?? '全部档案'
  const sidebarFolders = useMemo(() => ['全部档案', ...new Set([...caseDefinition.folders.map((item) => item.name), ...caseDefinition.files.map((item) => item.folder), '回收站'])], [caseDefinition.files, caseDefinition.folders])
  const username = systemUser(caseDefinition.owner)
  const [folder, setFolder] = useState(initialFolder)
  const [history, setHistory] = useState([initialFolder])
  const [historyIndex, setHistoryIndex] = useState(0)
  const [query, setQuery] = useState('')
  const [descending, setDescending] = useState(false)
  const [sort, setSort] = useState<'name' | 'modified'>('name')
  const [view, setView] = useState<'list' | 'icons'>('list')
  const [selected, setSelected] = useState<VirtualFile | null>(null)
  const [properties, setProperties] = useState(false)
  const [rowMenu, setRowMenu] = useState<{ x: number; y: number } | null>(null)
  const rowMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!rowMenu) return
    rowMenuRef.current?.querySelector<HTMLButtonElement>('button:not(:disabled)')?.focus()
    const close = (event: KeyboardEvent | PointerEvent) => {
      if (event instanceof KeyboardEvent && event.key !== 'Escape') return
      if (event instanceof PointerEvent && rowMenuRef.current?.contains(event.target as Node)) return
      setRowMenu(null)
    }
    window.addEventListener('keydown', close)
    window.addEventListener('pointerdown', close, true)
    return () => { window.removeEventListener('keydown', close); window.removeEventListener('pointerdown', close, true) }
  }, [rowMenu])

  const filesWithRestores = useMemo(() => caseDefinition.files.filter((file) => {
    if (file.folder === '回收站') {
      if (restoredItemIds.includes(file.id)) return folder === (file.originalFolder ?? '文档') || folder === '全部档案'
      return folder === '回收站' || folder === '全部档案'
    }
    return folder === '全部档案' || file.folder === folder
  }), [caseDefinition.files, folder, restoredItemIds])
  const visible = useMemo(() => filesWithRestores.filter((file) => file.name.toLowerCase().includes(query.toLowerCase())).sort((a, b) => {
    const comparison = sort === 'name' ? a.name.localeCompare(b.name) : modifiedAt(a).localeCompare(modifiedAt(b))
    return descending ? -comparison : comparison
  }), [filesWithRestores, query, sort, descending])

  const navigate = (nextFolder: string) => {
    const nextHistory = [...history.slice(0, historyIndex + 1), nextFolder]
    setHistory(nextHistory); setHistoryIndex(nextHistory.length - 1); setFolder(nextFolder); setSelected(null); setProperties(false)
  }
  const selectFile = (file: VirtualFile) => {
    setSelected(file); setProperties(false)
    if (file.clueAction) investigate({ type: file.clueAction, itemId: file.id })
    if (file.id === 'identity-draft') openIdentityDraft()
  }
  const clue = selected ? caseDefinition.clues.find((item) => item.discovery.itemId === selected.id) : undefined

  return (
    <div className={`application file-manager view-${view}`}>
      <AppToolbar>
        <button aria-label="后退" disabled={historyIndex === 0} onClick={() => { const index = historyIndex - 1; setHistoryIndex(index); setFolder(history[index]!); setSelected(null) }}>←</button>
        <button aria-label="前进" disabled={historyIndex >= history.length - 1} onClick={() => { const index = historyIndex + 1; setHistoryIndex(index); setFolder(history[index]!); setSelected(null) }}>→</button>
        <button aria-label="上一级" disabled={folder === '全部档案'} onClick={() => navigate('全部档案')}>↑</button>
        <span className="path-field">本机 / 用户 / {username} / {folder}</span>
        <input type="search" aria-label="搜索文件" placeholder="搜索当前文件夹" value={query} onChange={(event) => setQuery(event.target.value)} />
        <button onClick={() => { setSort(sort === 'name' ? 'modified' : 'name'); setDescending(false) }}>{sort === 'name' ? '按名称' : '按修改时间'}</button>
        <button onClick={() => setDescending(!descending)} aria-label="切换排序方向">{descending ? '↓' : '↑'}</button>
        <button onClick={() => setView(view === 'list' ? 'icons' : 'list')}>{view === 'list' ? '图标视图' : '列表视图'}</button>
        <button disabled={!selected} onClick={() => setProperties(!properties)}>属性</button>
      </AppToolbar>
      <div className="file-layout">
        <nav className="tree-pane" aria-label="文件夹"><PaneHeader title="快速访问" />{sidebarFolders.map((name) => <button key={name} data-active={folder === name} onClick={() => navigate(name)}><span aria-hidden="true">▸</span>{name}<small>{caseDefinition.files.filter((file) => file.folder === name || (restoredItemIds.includes(file.id) && file.originalFolder === name)).length}</small></button>)}</nav>
        <section className="file-table">
          <div className="data-head"><span>名称</span><span>类型</span><span>修改时间</span><span>大小</span></div>
          {visible.map((file) => <button key={file.id} data-selected={selected?.id === file.id} onClick={() => setSelected(file)} onDoubleClick={() => selectFile(file)} onContextMenu={(event) => { event.preventDefault(); setSelected(file); setRowMenu({ x: Math.max(8, Math.min(event.clientX, innerWidth - 150)), y: Math.max(40, Math.min(event.clientY, innerHeight - 130)) }) }}><span><i className="file-symbol" aria-hidden="true">{file.locked ? '◇' : '□'}</i>{file.name}</span><span>{fileType(file)}</span><span>{modifiedAt(file)}</span><span>{fileSize(file)}</span></button>)}
          {visible.length === 0 && <div className="empty-state"><b>没有匹配项目</b><p>调整文件夹或搜索条件。</p></div>}
          {rowMenu && <div ref={rowMenuRef} className="row-context" role="menu" style={{ left: rowMenu.x, top: rowMenu.y }}><button role="menuitem" onClick={() => { if (selected) selectFile(selected); setRowMenu(null) }}>打开</button><button role="menuitem" onClick={() => { setProperties(true); setRowMenu(null) }}>查看属性</button><button role="menuitem" disabled={!clue || !discoveredClueIds.includes(clue.id)} onClick={() => { if (clue) togglePinned(clue.id); setRowMenu(null) }}>{clue && pinnedClueIds.includes(clue.id) ? '从证据板移除' : '加入证据板'}</button></div>}
        </section>
        <section className="file-preview" aria-label="文件详情">
          <PaneHeader title={properties ? '属性' : '预览'} meta={selected?.name} />
          {selected ? properties ? <dl className="property-list"><dt>文件名</dt><dd>{selected.name}</dd><dt>文件类型</dt><dd>{fileType(selected)}</dd><dt>路径</dt><dd>{username}/{restoredItemIds.includes(selected.id) ? selected.originalFolder : selected.folder}</dd><dt>大小</dt><dd>{selected.size ? `${selected.size} bytes` : fileSize(selected)}</dd><dt>创建时间</dt><dd>{selected.createdAt ?? '未记录'}</dd><dt>修改时间</dt><dd>{selected.modifiedAt ?? modifiedAt(selected)}</dd><dt>是否隐藏</dt><dd>{selected.hidden || selected.locked ? '是' : '否'}</dd><dt>所属用户</dt><dd>{selected.owner ?? username}</dd></dl> : <FilePreview file={selected} /> : <div className="empty-state">选择一个项目以查看内容</div>}
        </section>
      </div>
      <AppStatusBar><span>{visible.length} 个项目</span><span>{selected ? `已选择 1 个 · ${selected.name}` : '未选择项目'}</span><span>{folder}</span></AppStatusBar>
    </div>
  )
}
