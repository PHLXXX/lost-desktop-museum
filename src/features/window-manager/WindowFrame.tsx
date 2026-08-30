import { useState } from 'react'
import type { CSSProperties, PointerEvent, ReactNode } from 'react'
import type { AppWindow } from '../../store/windowStore'
import { useWindowStore } from '../../store/windowStore'

type ResizeDirection = 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'nw'

export function WindowFrame({
  window,
  title,
  children,
}: {
  window: AppWindow
  title: string
  children: ReactNode
}) {
  const {
    activeWindowId,
    focusWindow,
    moveWindow,
    resizeWindow,
    minimizeWindow,
    toggleMaximize,
    closeWindow,
  } = useWindowStore()
  const [pointer, setPointer] = useState({
    mode: 'none' as 'none' | 'drag' | 'resize',
    direction: 'se' as ResizeDirection,
    clientX: 0,
    clientY: 0,
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    id: -1,
  })
  if (window.minimized) return null
  const style: CSSProperties = window.maximized
    ? { top: 40, right: 8, bottom: 52, left: 8, zIndex: window.z }
    : {
        left: window.x,
        top: window.y,
        width: window.width,
        height: window.height,
        zIndex: window.z,
      }
  const start = (
    event: PointerEvent<HTMLElement>,
    mode: 'drag' | 'resize',
    direction: ResizeDirection = 'se',
  ) => {
    if (window.maximized) return
    event.stopPropagation()
    focusWindow(window.id)
    setPointer({
      mode,
      direction,
      clientX: event.clientX,
      clientY: event.clientY,
      x: window.x,
      y: window.y,
      width: window.width,
      height: window.height,
      id: event.pointerId,
    })
    event.currentTarget.setPointerCapture?.(event.pointerId)
  }
  const move = (event: PointerEvent<HTMLElement>) => {
    const state = pointer
    if (state.id !== event.pointerId || state.mode === 'none') return
    const dx = event.clientX - state.clientX
    const dy = event.clientY - state.clientY
    if (state.mode === 'drag') return moveWindow(window.id, state.x + dx, state.y + dy)
    const left = state.direction.includes('w')
    const top = state.direction.includes('n')
    const horizontal = state.direction.includes('e') || left
    const vertical = state.direction.includes('s') || top
    resizeWindow(
      window.id,
      horizontal ? state.width + (left ? -dx : dx) : state.width,
      vertical ? state.height + (top ? -dy : dy) : state.height,
      left ? state.x + dx : state.x,
      top ? state.y + dy : state.y,
    )
  }
  const stop = () => {
    setPointer((state) => ({ ...state, mode: 'none', id: -1 }))
  }
  return (
    <section
      className={`app-window ${window.maximized ? 'maximized' : ''}`}
      data-active={activeWindowId === window.id}
      style={style}
      role="dialog"
      aria-label={title}
      onPointerDown={() => focusWindow(window.id)}
    >
      <div
        className="window-titlebar"
        onDoubleClick={() => toggleMaximize(window.id)}
        onPointerDown={(event) => {
          if (!(event.target as HTMLElement).closest('button')) start(event, 'drag')
        }}
        onPointerMove={move}
        onPointerUp={stop}
        onPointerCancel={stop}
      >
        <span className="window-signal" aria-hidden="true" />
        <h2>{title}</h2>
        <div className="window-controls">
          <button aria-label={`最小化 ${title}`} onClick={() => minimizeWindow(window.id)}>
            —
          </button>
          <button
            aria-label={`${window.maximized ? '还原' : '最大化'} ${title}`}
            onClick={() => toggleMaximize(window.id)}
          >
            {window.maximized ? '◱' : '□'}
          </button>
          <button aria-label={`关闭 ${title}`} onClick={() => closeWindow(window.id)}>
            ×
          </button>
        </div>
      </div>
      <div className="window-content">{children}</div>
      {!window.maximized &&
        (['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw'] as ResizeDirection[]).map((direction) => (
          <div
            key={direction}
            className={`resize-handle resize-${direction}`}
            aria-hidden="true"
            onPointerDown={(event) => start(event, 'resize', direction)}
            onPointerMove={move}
            onPointerUp={stop}
            onPointerCancel={stop}
          />
        ))}
    </section>
  )
}
