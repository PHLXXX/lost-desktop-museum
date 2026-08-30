import { useRef } from 'react'
import type { PointerEvent, ReactNode } from 'react'
import type { AppWindow } from '../../store/windowStore'
import { useWindowStore } from '../../store/windowStore'

export function WindowFrame({ window, title, children }: { window: AppWindow; title: string; children: ReactNode }) {
  const { focusWindow, moveWindow, minimizeWindow, toggleMaximize, closeWindow } = useWindowStore()
  const drag = useRef({ x: 0, y: 0, startX: 0, startY: 0, pointerId: -1 })
  if (window.minimized) return null
  const style = window.maximized ? { inset: 12, zIndex: window.z } : { left: window.x, top: window.y, width: `min(${window.width}px, calc(100vw - 24px))`, height: `min(${window.height}px, calc(100vh - 86px))`, zIndex: window.z }
  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    focusWindow(window.id)
    if (window.maximized || (event.target as HTMLElement).closest('button')) return
    drag.current = { x: event.clientX, y: event.clientY, startX: window.x, startY: window.y, pointerId: event.pointerId }
    event.currentTarget.setPointerCapture?.(event.pointerId)
  }
  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (drag.current.pointerId !== event.pointerId) return
    moveWindow(window.id, drag.current.startX + event.clientX - drag.current.x, drag.current.startY + event.clientY - drag.current.y)
  }
  return <section className={`app-window ${window.maximized ? 'maximized' : ''}`} style={style} onPointerDown={() => focusWindow(window.id)}>
    <div className="window-titlebar" onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={() => { drag.current.pointerId = -1 }} onPointerCancel={() => { drag.current.pointerId = -1 }}>
      <span className="window-signal" /> <h2>{title}</h2><div className="window-controls">
        <button aria-label={`最小化 ${title}`} onClick={() => minimizeWindow(window.id)}>—</button>
        <button aria-label={`${window.maximized ? '还原' : '最大化'} ${title}`} onClick={() => toggleMaximize(window.id)}>{window.maximized ? '◱' : '□'}</button>
        <button aria-label={`关闭 ${title}`} onClick={() => closeWindow(window.id)}>×</button>
      </div>
    </div>
    <div className="window-content">{children}</div>
  </section>
}
