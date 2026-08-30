import { useGameStore } from '../../store/gameStore'

const labels = { idle: '等待变更', saving: '正在保存…', saved: '已保存', error: '保存失败' }

export function SaveIndicator() {
  const status = useGameStore((state) => state.saveStatus)
  const lastSavedAt = useGameStore((state) => state.lastSavedAt)
  return <span className={`save-indicator save-${status}`} role="status" title={`最近保存：${new Date(lastSavedAt).toLocaleString('zh-CN', { hour12: false })}`}><i aria-hidden="true" />{labels[status]}</span>
}
