import { useState } from 'react'
import { caseDefinition } from '../../cases/case-001/case'
import { useGameStore } from '../../store/gameStore'
import { AppStatusBar, AppToolbar, PaneHeader } from './AppChrome'

export function RecycleApp() {
  const { unlockedItemIds, restoredItemIds, discoveredClueIds, pinnedClueIds, investigate, restoreItem, togglePinned } = useGameStore()
  const [selected, setSelected] = useState<string | null>(null)
  const files = caseDefinition.files.filter((file) => file.folder === '回收站' && (!file.locked || unlockedItemIds.includes(file.id)) && !restoredItemIds.includes(file.id))
  const active = files.find((file) => file.id === selected)
  const clue = active ? caseDefinition.clues.find((item) => item.discovery.itemId === active.id) : undefined

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
          {files.map((file, index) => (
            <button key={file.id} data-selected={selected === file.id} onClick={() => { setSelected(file.id); if (file.id === 'farewell-v3') investigate({ type: 'COMPARE_ITEMS', itemId: file.id }) }}>
              <strong>{file.name}</strong><span>ZHOU_YU/{file.originalFolder ?? '文档'}</span><time>2031.11.17 23:{String(7 + index).padStart(2, '0')}</time><span>{file.name.match(/v\d/)?.[0] ?? '—'}</span><span>{file.locked ? '保护' : '可恢复'}</span>
            </button>
          ))}
          {files.length === 0 && <div className="empty-state"><b>回收站为空</b><p>已恢复的项目保留在原始目录，线索记录不会被删除。</p></div>}
        </section>
        <aside className="record-detail">
          <PaneHeader title="文件预览" meta={active?.name} />
          {active ? <><p>{active.content}</p><dl><dt>原始路径</dt><dd>用户/周屿/{active.originalFolder ?? '文档'}</dd><dt>删除时间</dt><dd>2031.11.17 23:07</dd><dt>文件版本</dt><dd>{active.name.match(/v\d/)?.[0] ?? '单一版本'}</dd><dt>保护状态</dt><dd>{active.locked ? '系统保护' : '普通'}</dd></dl><button className="secondary-button" onClick={restore}>恢复到原位置</button><button disabled={!clue || !discoveredClueIds.includes(clue.id)} onClick={() => clue && togglePinned(clue.id)}>{clue && pinnedClueIds.includes(clue.id) ? '移出证据板' : '加入证据板'}</button></> : <div className="empty-state">选择一个版本进行预览或恢复</div>}
        </aside>
      </div>
      <AppStatusBar><span>{files.length} 个项目</span><span>{restoredItemIds.length} 个已恢复</span><span>档案保护模式下无法永久删除记录。</span></AppStatusBar>
    </div>
  )
}
