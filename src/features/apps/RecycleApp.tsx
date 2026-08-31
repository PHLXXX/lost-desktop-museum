import { useState } from 'react'
import { useActiveCaseDefinition } from '../../cases/useActiveCase'
import { useGameStore } from '../../store/gameStore'
import { filesInFolder } from '../../engine/fileSystemView'
import { AppStatusBar, AppToolbar, PaneHeader } from './AppChrome'

export function RecycleApp() {
  const caseDefinition = useActiveCaseDefinition()
  const { unlockedItemIds, restoredItemIds, discoveredClueIds, pinnedClueIds, investigate, restoreItem, togglePinned } = useGameStore()
  const [selected, setSelected] = useState<string | null>(null)
  const files = filesInFolder(caseDefinition, '回收站', { unlockedItemIds, restoredItemIds })
  const active = files.find((file) => file.id === selected)
  const clue = active ? caseDefinition.clues.find((item) => item.discovery.itemId === active.id) : undefined
  const deletedAt = (file: (typeof files)[number]) => file.deletedAt ?? caseDefinition.clues.find((item) => item.discovery.itemId === file.id)?.times[0] ?? '未记录'
  const owner = (file: (typeof files)[number]) => file.owner ?? caseDefinition.owner

  const restore = () => {
    if (!active) return
    restoreItem(active.id)
    setSelected(null)
  }

  return (
    <div className="application recycle-app">
      <AppToolbar>
        <button disabled={!active} onClick={restore}>恢复所选</button>
        <button disabled title="档案保护模式下无法永久删除记录。">清空回收站</button>
        <span className="path-field">本机 / 回收站</span>
        <span>{files.length} 个保留项目</span>
      </AppToolbar>
      <div className="recycle-layout">
        <section className="recycle-table">
          <div className="data-head"><span>名称</span><span>原始路径</span><span>删除时间</span><span>版本</span><span>状态</span></div>
          {files.map((file) => (
            <button key={file.id} data-selected={selected === file.id} onClick={() => { setSelected(file.id); if (file.clueAction) investigate({ type: file.clueAction, itemId: file.id }) }}>
              <strong>{file.name}</strong><span>{owner(file)}/{file.originalFolder ?? '文档'}</span><time>{deletedAt(file)}</time><span>{file.name.match(/v\d/)?.[0] ?? '—'}</span><span>{file.locked ? '保护' : '可恢复'}</span>
            </button>
          ))}
          {files.length === 0 && <div className="empty-state"><b>回收站为空</b><p>已恢复的项目保留在原始目录，线索记录不会被删除。</p></div>}
        </section>
        <aside className="record-detail">
          <PaneHeader title="文件预览" meta={active?.name} />
          {active ? <><p>{active.content}</p><dl><dt>原始路径</dt><dd>用户/{owner(active)}/{active.originalFolder ?? '文档'}</dd><dt>删除时间</dt><dd>{deletedAt(active)}</dd><dt>文件版本</dt><dd>{active.name.match(/v\d/)?.[0] ?? '单一版本'}</dd><dt>保护状态</dt><dd>{active.locked ? '系统保护' : '普通'}</dd></dl><button className="secondary-button" onClick={restore}>恢复到原位置</button><button disabled={!clue || !discoveredClueIds.includes(clue.id)} onClick={() => clue && togglePinned(clue.id)}>{clue && pinnedClueIds.includes(clue.id) ? '移出证据板' : '加入证据板'}</button></> : <div className="empty-state">选择一个版本进行预览或恢复</div>}
        </aside>
      </div>
      <AppStatusBar><span>{files.length} 个项目</span><span>{restoredItemIds.length} 个已恢复</span><span>档案保护模式下无法永久删除记录。</span></AppStatusBar>
    </div>
  )
}
