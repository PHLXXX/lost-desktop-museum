import { useEffect, useState } from 'react'
import { useEditorStore } from '../store/editorStore'
import { GlobalSearch } from './GlobalSearch'

const saveLabels = { idle: '未修改', dirty: '待保存', saving: '正在保存…', saved: '已保存', error: '保存失败' } as const

export function EditorTopbar({ onReturnMuseum, onPreview, onPublish, onSnapshots, readOnly = false }: { onReturnMuseum: () => void; onPreview: () => void; onPublish: () => void; onSnapshots: () => void; readOnly?: boolean }) {
  const { currentProject, saveStatus, closeProject, undo, redo, saveNow, validate, setSection } = useEditorStore()
  const [searching, setSearching] = useState(false)
  useEffect(() => {
    const handle = (event: KeyboardEvent) => { if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); setSearching(true) } }
    window.addEventListener('keydown', handle); return () => window.removeEventListener('keydown', handle)
  }, [])
  if (!currentProject) return null
  return <header className="editor-topbar">
    <div className="editor-mode"><span>档案工坊 / AUTHORING MODE</span><strong>{currentProject.name}</strong></div>
    <div className="editor-toolbar" role="toolbar" aria-label="工程工具栏">
      <button aria-label="返回工程列表" onClick={closeProject}>工程列表</button><button onClick={onReturnMuseum}>档案馆</button><i />
      <button disabled={readOnly} onClick={undo} aria-label="撤销">↶</button><button disabled={readOnly} onClick={redo} aria-label="重做">↷</button><button disabled={readOnly} onClick={() => void saveNow()}>立即保存</button><button onClick={onSnapshots}>快照</button>
      <button onClick={() => setSearching(!searching)}>全局搜索</button><button aria-label="运行校验" onClick={() => { validate(); setSection('validation') }}>校验</button><button onClick={onPreview}>试玩</button><button className="editor-export" onClick={onPublish}>导出</button>
    </div>
    <div className={`editor-save-state ${saveStatus}`}><span aria-hidden="true" />{saveLabels[saveStatus]}</div>
    {searching && <GlobalSearch onClose={() => setSearching(false)} />}
  </header>
}
