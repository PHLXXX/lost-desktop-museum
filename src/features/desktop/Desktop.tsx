import { useEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import { appRegistry } from '../../app/appRegistry'
import { useGameStore } from '../../store/gameStore'
import { useWindowStore } from '../../store/windowStore'
import { WindowFrame } from '../window-manager/WindowFrame'
import { AppContent } from '../../app/AppContent'

export function Desktop() {
  const { windows, openWindow, restoreWindow } = useWindowStore()
  const { discoveredClueIds, triggeredEventIds, notice, dismissNotice, settings } = useGameStore()
  const [clock, setClock] = useState('23:48')
  useEffect(() => { const timer = setInterval(() => setClock((value) => value === '23:48' ? '23:49' : '23:48'), 60000); return () => clearInterval(timer) }, [])
  const displayClock = settings.anomalies && triggeredEventIds.includes('event-identity') ? '23:47' : clock
  return <main className={`desktop ${settings.anomalies ? 'anomalies' : ''}`} style={{ '--scanline': settings.scanlines } as CSSProperties} data-testid="desktop">
    <header className="desktop-status"><div><span className="live-dot" /> ARCHIVE/OS · 本地离线</div><div>2031.11.17&nbsp;&nbsp;{displayClock}</div></header>
    <div className="desktop-grid">{appRegistry.map((app) => <button className="desktop-icon" key={app.id} onClick={() => openWindow(app.id)} onDoubleClick={() => openWindow(app.id)} onKeyDown={(event) => event.key === 'Enter' && openWindow(app.id)} aria-label={app.title}><span>{app.glyph}</span><strong>{app.title}</strong></button>)}</div>
    {windows.map((window) => <WindowFrame key={window.id} window={window} title={appRegistry.find((app) => app.id === window.id)?.title ?? window.id}><AppContent appId={window.id} /></WindowFrame>)}
    {notice && <aside className="notification" role="status"><span>LINRAN / SYSTEM</span><p>{notice}</p><button aria-label="关闭通知" onClick={dismissNotice}>×</button></aside>}
    <footer className="taskbar"><div className="archive-button">A/OS</div><div className="running-apps">{windows.map((window) => { const title = appRegistry.find((app) => app.id === window.id)?.title ?? window.id; return <button key={window.id} aria-label={`恢复 ${title}`} className={window.minimized ? 'muted' : ''} onClick={() => restoreWindow(window.id)}>{title}</button> })}</div><button className="progress-button" onClick={() => openWindow('evidence')}><span>案件进度</span><strong>{discoveredClueIds.length} / 12</strong></button></footer>
    <div className="orientation-notice">建议横屏或使用桌面设备获得完整档案体验</div>
  </main>
}
