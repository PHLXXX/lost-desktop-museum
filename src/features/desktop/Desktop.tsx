import { useEffect, useState } from 'react'
import type { CSSProperties, MouseEvent } from 'react'
import { ArchiveIcon } from '../../components/icons/ArchiveIcon'
import { caseDefinition } from '../../cases/case-001/case'
import type { AppId } from '../../cases/types'
import { AppContent } from '../../app/AppContent'
import { appRegistry } from '../../app/appRegistry'
import { playArchiveSound } from '../../engine/audioEngine'
import { useGameStore } from '../../store/gameStore'
import { useWindowStore } from '../../store/windowStore'
import { Onboarding } from '../system/Onboarding'
import { ArchiveDialog } from '../system/ArchiveDialog'
import { SaveIndicator } from '../system/SaveIndicator'
import { SystemMenu } from '../system/SystemMenu'
import { WindowFrame } from '../window-manager/WindowFrame'
import { DesktopContextMenu } from './DesktopContextMenu'
import { isEditableTarget, isSaveShortcut } from './desktopShortcuts'

export function Desktop({
  onReturnMuseum,
  onDeduction,
  onResult,
}: {
  onReturnMuseum: () => void
  onDeduction?: () => void
  onResult?: () => void
}) {
  const { windows, activeWindowId, openWindow, restoreWindow, minimizeWindow } = useWindowStore()
  const {
    discoveredClueIds,
    triggeredEventIds,
    notice,
    dismissNotice,
    settings,
    desktopNote,
    setDesktopNote,
    tickPlayTime,
  } = useGameStore()
  const [selected, setSelected] = useState<AppId | null>(null)
  const [systemMenu, setSystemMenu] = useState(false)
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null)
  const [showNote, setShowNote] = useState(Boolean(desktopNote))
  const [caseInfo, setCaseInfo] = useState(false)
  const [compactIcons, setCompactIcons] = useState(false)
  const [sortByName, setSortByName] = useState(false)
  const [clock, setClock] = useState('23:48')
  useEffect(() => {
    const timer = setInterval(
      () => setClock((value) => (value === '23:48' ? '23:49' : '23:48')),
      60000,
    )
    return () => clearInterval(timer)
  }, [])
  useEffect(() => {
    const timer = setInterval(tickPlayTime, 1000)
    return () => clearInterval(timer)
  }, [tickPlayTime])
  useEffect(() => {
    const flushSave = () => useGameStore.getState().saveNow()
    window.addEventListener('pagehide', flushSave)
    return () => window.removeEventListener('pagehide', flushSave)
  }, [])
  useEffect(() => {
    if (!notice) return
    const timer = setTimeout(dismissNotice, 4000)
    return () => clearTimeout(timer)
  }, [notice, dismissNotice])
  useEffect(() => {
    const handleKeyboard = (event: KeyboardEvent) => {
      if (isSaveShortcut(event)) {
        event.preventDefault()
        useGameStore.getState().saveNow()
        return
      }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'f') {
        const search = document.querySelector<HTMLElement>('.app-window[data-active="true"] [aria-label*="搜索"]')
        if (search) { event.preventDefault(); search.focus() }
        return
      }
      if (event.altKey && event.key === 'ArrowLeft') {
        const back = document.querySelector<HTMLButtonElement>('.app-window[data-active="true"] button[aria-label="后退"]')
        if (back) { event.preventDefault(); back.click() }
        return
      }
      if (event.key === 'Delete' && showNote && !isEditableTarget(event.target)) {
        setDesktopNote('')
        setShowNote(false)
        return
      }
      if (event.key !== 'Escape' || document.querySelector('[aria-modal="true"]')) return
      if (contextMenu) { setContextMenu(null); return }
      setSelected(null)
      setSystemMenu((value) => !value)
    }
    window.addEventListener('keydown', handleKeyboard)
    return () => window.removeEventListener('keydown', handleKeyboard)
  }, [contextMenu, setDesktopNote, showNote])
  const displayClock =
    settings.anomalies && triggeredEventIds.includes('event-identity') ? '23:47' : clock
  const lastClue = caseDefinition.clues.find((clue) => clue.id === discoveredClueIds.at(-1))
  const openSelected = (id: AppId) => {
    playArchiveSound('open', settings.sound)
    openWindow(id)
    setSelected(id)
    setContextMenu(null)
  }
  const openContext = (event: MouseEvent<HTMLElement>) => {
    if ((event.target as HTMLElement).closest('button, textarea, .app-window')) return
    event.preventDefault()
    setContextMenu({ x: Math.max(8, Math.min(event.clientX, innerWidth - 190)), y: Math.max(40, Math.min(event.clientY, innerHeight - 250)) })
  }
  const desktopApps = sortByName ? [...appRegistry].sort((a, b) => a.title.localeCompare(b.title, 'zh-CN')) : appRegistry
  return (
    <main
      className={`desktop ${settings.anomalies ? 'anomalies' : ''} ${compactIcons ? 'compact-icons' : ''}`}
      style={{ '--scanline': settings.safeMode ? 0 : settings.scanlines } as CSSProperties}
      data-testid="desktop"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          setSelected(null)
          setContextMenu(null)
        }
      }}
      onContextMenu={openContext}
    >
      <header className="desktop-status">
        <div>
          <span className="live-dot" /> ARCHIVE/OS 3.1 <b>案件 LD-001</b>
        </div>
        <div>
          <SaveIndicator />
          <span>2031.11.17&nbsp;&nbsp;{displayClock}</span>
        </div>
      </header>
      <section className="desktop-case-strip">
        <div>
          <span>正在调查</span>
          <strong>没有出发的旅行</strong>
        </div>
        <p>检查具体记录，系统会把可验证的矛盾写入证据板。</p>
        <b>{discoveredClueIds.length.toString().padStart(2, '0')} / 12</b>
      </section>
      <div className="desktop-grid" aria-label="桌面应用">
        {desktopApps.map((app) => (
          <button
            className="desktop-icon"
            data-selected={selected === app.id}
            key={app.id}
            onClick={(event) => {
              event.stopPropagation()
              setSelected(app.id)
              setContextMenu(null)
            }}
            onDoubleClick={() => openSelected(app.id)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') openSelected(app.id)
            }}
            aria-label={app.title}
          >
            <span>
              <ArchiveIcon id={app.id} />
            </span>
            <div>
              <strong>{app.title}</strong>
              <small>{app.description}</small>
            </div>
          </button>
        ))}
      </div>
      {showNote && (
        <aside className="desktop-note">
          <header>
            <span>临时便笺 · 本地保存</span>
            <button aria-label="关闭临时便笺" onClick={() => setShowNote(false)}>
              ×
            </button>
          </header>
          <textarea
            aria-label="临时便笺内容"
            placeholder="记录暂时不确定的想法……"
            value={desktopNote}
            onChange={(event) => setDesktopNote(event.target.value)}
          />
        </aside>
      )}
      {contextMenu && <DesktopContextMenu position={contextMenu} onClose={() => setContextMenu(null)} onView={() => { setCompactIcons((value) => !value); setContextMenu(null) }} onSort={() => { setSortByName((value) => !value); setContextMenu(null) }} onRefresh={() => { setSelected(null); setContextMenu(null) }} onCreateNote={() => { setShowNote(true); setContextMenu(null) }} onDisplaySettings={() => openSelected('settings')} onCaseInfo={() => { setCaseInfo(true); setContextMenu(null) }} />}
      {windows.map((window) => (
        <WindowFrame
          key={window.id}
          window={window}
          title={appRegistry.find((app) => app.id === window.id)?.title ?? window.id}
        >
          <AppContent appId={window.id} onDeduction={onDeduction} onResult={onResult} />
        </WindowFrame>
      ))}
      {notice && (
        <aside className="clue-toast" role="status" aria-label="线索通知">
          <span>
            {lastClue
              ? `${lastClue.id} · ${appRegistry.find((app) => app.id === lastClue.source)?.title}`
              : 'SYSTEM'}
          </span>
          <strong>{notice.startsWith('发现线索：') ? '新证据已记录' : '系统通知'}</strong>
          <p>{notice.replace(/^发现线索：/, '')}</p>
          <div>
            {lastClue && <button onClick={() => openSelected(lastClue.source)}>查看线索</button>}
            <button aria-label="关闭通知" onClick={dismissNotice}>
              关闭
            </button>
          </div>
        </aside>
      )}
      <footer className="taskbar">
        <button
          className="archive-button"
          aria-label="A/OS 系统菜单"
          aria-expanded={systemMenu}
          onClick={() => { playArchiveSound('click', settings.sound); setSystemMenu((value) => !value) }}
        >
          <span>A</span>A/OS
        </button>
        <div className="running-apps">
          {windows.map((window) => {
            const title = appRegistry.find((app) => app.id === window.id)?.title ?? window.id
            return (
              <button
                key={window.id}
                data-active={activeWindowId === window.id && !window.minimized}
                aria-label={`${window.minimized ? '恢复' : activeWindowId === window.id ? '从任务栏最小化' : '切换到'} ${title}`}
                onClick={() =>
                  activeWindowId === window.id && !window.minimized
                    ? minimizeWindow(window.id)
                    : restoreWindow(window.id)
                }
              >
                <ArchiveIcon id={window.id} size={16} />
                {title}
              </button>
            )
          })}
        </div>
        <button className="progress-button" onClick={() => openSelected('evidence')}>
          <span>已记录</span>
          <strong>{discoveredClueIds.length} / 12</strong>
        </button>
        <span className="taskbar-sound" aria-label={`音效${settings.sound ? '开启' : '关闭'}`}>{settings.sound ? '音效 开' : '音效 关'}</span>
        <time className="taskbar-clock">{displayClock}</time>
      </footer>
      <SystemMenu
        open={systemMenu}
        onClose={() => setSystemMenu(false)}
        onReturnMuseum={onReturnMuseum}
        onOpenSettings={() => openSelected('settings')}
      />
      <Onboarding />
      {caseInfo && <ArchiveDialog title="案件信息" onClose={() => setCaseInfo(false)} actions={<button className="primary-button" onClick={() => setCaseInfo(false)}>返回桌面</button>}><p>档案 001：没有出发的旅行</p><p>已记录 {discoveredClueIds.length} / 12。所有调查进度仅保存在当前浏览器。</p></ArchiveDialog>}
      <div className="orientation-notice">当前宽度会限制多窗口操作；应用已优先使用最大化布局。</div>
    </main>
  )
}
