import { useGameStore } from '../store/gameStore'

export function PreviewDebugPanel() {
  const state = useGameStore()
  return <aside className="preview-debug"><header><span>AUTHOR DEBUG</span><strong>试玩事件</strong></header><dl><div><dt>已发现线索</dt><dd>{state.discoveredClueIds.length}</dd></div><div><dt>已打开内容</dt><dd>{state.openedItems.length}</dd></div><div><dt>已执行触发器</dt><dd>{state.triggeredEventIds.length}</dd></div></dl><details><summary>事件键</summary><pre>{state.completedEventKeys.join('\n') || '尚无事件'}</pre></details></aside>
}

