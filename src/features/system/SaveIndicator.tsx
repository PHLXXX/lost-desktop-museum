import { useEffect, useState } from 'react'
import { useGameStore } from '../../store/gameStore'

const labels = { idle: '等待变更', saving: '正在保存…', saved: '已保存', error: '保存失败' }

export function SaveIndicator() {
  const status = useGameStore((state) => state.saveStatus)
  const lastSavedAt = useGameStore((state) => state.lastSavedAt)
  const [compactedSaveAt, setCompactedSaveAt] = useState<string | null>(null)

  useEffect(() => {
    if (status !== 'saved') return
    const timer = window.setTimeout(() => setCompactedSaveAt(lastSavedAt), 1600)
    return () => window.clearTimeout(timer)
  }, [status, lastSavedAt])

  const compact = status === 'saved' && compactedSaveAt === lastSavedAt

  return (
    <span
      aria-label={labels[status]}
      className={`save-indicator save-${status}`}
      data-compact={status === 'saved' && compact ? 'true' : 'false'}
      role="status"
      title={`最近保存：${new Date(lastSavedAt).toLocaleString('zh-CN', { hour12: false })}`}
    >
      <i aria-hidden="true" />
      <span className="save-label">{labels[status]}</span>
    </span>
  )
}
