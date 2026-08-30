import { useEffect, useRef } from 'react'

export function DesktopContextMenu({ position, onView, onSort, onRefresh, onCreateNote, onDisplaySettings, onCaseInfo, onClose }: { position: { x: number; y: number }; onView: () => void; onSort: () => void; onRefresh: () => void; onCreateNote: () => void; onDisplaySettings: () => void; onCaseInfo: () => void; onClose: () => void }) {
  const menu = useRef<HTMLDivElement>(null)
  useEffect(() => {
    menu.current?.querySelector<HTMLButtonElement>('[role="menuitem"]')?.focus()
    const keyboard = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.stopPropagation(); onClose(); return }
      if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return
      event.preventDefault()
      const items = [...(menu.current?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]') ?? [])]
      const current = items.indexOf(document.activeElement as HTMLButtonElement)
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? items.length - 1 : event.key === 'ArrowDown' ? (current + 1) % items.length : (current - 1 + items.length) % items.length
      items[next]?.focus()
    }
    window.addEventListener('keydown', keyboard, true)
    return () => window.removeEventListener('keydown', keyboard, true)
  }, [onClose])
  return (
    <div ref={menu} className="desktop-context-menu" role="menu" aria-label="桌面菜单" style={{ left: position.x, top: position.y }}>
      <button role="menuitem" onClick={onView}>查看</button>
      <button role="menuitem" onClick={onSort}>排序方式</button>
      <button role="menuitem" onClick={onRefresh}>刷新</button>
      <hr />
      <button role="menuitem" onClick={onCreateNote}>新建文本文件</button>
      <button role="menuitem" onClick={onDisplaySettings}>显示设置</button>
      <button role="menuitem" onClick={onCaseInfo}>案件信息</button>
    </div>
  )
}
