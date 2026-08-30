export function EvidenceToolbar({
  discoveredCount,
  historyCount,
  zoom,
  onAutoLayout,
  onUndoLayout,
  onZoom,
  onResetView,
  onDeduction,
}: {
  discoveredCount: number
  historyCount: number
  zoom: number
  onAutoLayout: () => void
  onUndoLayout: () => void
  onZoom: (next: number) => void
  onResetView: () => void
  onDeduction: () => void
}) {
  return (
    <header className="evidence-commandbar">
      <div><strong>证据板</strong><span>CASE LD-001 / RELATION WORKSPACE</span></div>
      <button onClick={onAutoLayout}>自动布局</button>
      <button disabled={!historyCount} onClick={onUndoLayout}>撤销布局</button>
      <button aria-label="缩小证据画布" onClick={() => onZoom(zoom - 0.1)}>−</button>
      <span>{Math.round(zoom * 100)}%</span>
      <button aria-label="放大证据画布" onClick={() => onZoom(zoom + 0.1)}>＋</button>
      <button onClick={onResetView}>重置视图</button>
      <button className="primary-button" disabled={discoveredCount < 6} onClick={onDeduction}>
        {discoveredCount < 6 ? `还需 ${6 - discoveredCount} 条线索` : '打开最终推理'}
      </button>
    </header>
  )
}
