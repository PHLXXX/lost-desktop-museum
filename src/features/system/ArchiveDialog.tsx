import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'

export function ArchiveDialog({ title, children, actions, onClose }: { title: string; children: ReactNode; actions: ReactNode; onClose: () => void }) {
  const closeButton = useRef<HTMLButtonElement>(null)
  const previousFocus = useRef<HTMLElement | null>(null)
  const dialog = useRef<HTMLElement>(null)

  useEffect(() => {
    previousFocus.current = document.activeElement as HTMLElement | null
    closeButton.current?.focus()
    const handleKeyboard = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation()
        onClose()
        return
      }
      if (event.key !== 'Tab') return
      const focusable = [...(dialog.current?.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [href]') ?? [])]
      if (!focusable.length) return
      const first = focusable[0]!
      const last = focusable.at(-1)!
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
    }
    window.addEventListener('keydown', handleKeyboard, true)
    return () => {
      window.removeEventListener('keydown', handleKeyboard, true)
      previousFocus.current?.focus()
    }
  }, [onClose])

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <section ref={dialog} className="confirm-card archive-dialog" role="dialog" aria-modal="true" aria-label={title}>
        <header><h2>{title}</h2><button ref={closeButton} aria-label={`关闭${title}`} onClick={onClose}>×</button></header>
        <div className="archive-dialog-body">{children}</div>
        <footer>{actions}</footer>
      </section>
    </div>
  )
}
