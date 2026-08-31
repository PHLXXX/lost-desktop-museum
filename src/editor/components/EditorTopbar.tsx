import { useState } from 'react'
import { useEditorStore } from '../store/editorStore'

const saveLabels = { idle: '未修改', dirty: '待保存', saving: '正在保存…', saved: '已保存', error: '保存失败' } as const

export function EditorTopbar({ onReturnMuseum, onPreview, onPublish }: { onReturnMuseum: () => void; onPreview: () => void; onPublish: () => void }) {
  const { currentProject, saveStatus, closeProject, undo, redo, saveNow, validate, setSection } = useEditorStore()
  const [searching, setSearching] = useState(false)
  if (!currentProject) return null
  return <header className="editor-topbar">
    <div className="editor-mode"><span>档案工坊 / AUTHORING MODE</span><strong>{currentProject.name}</strong></div>
    <div className="editor-toolbar" role="toolbar" aria-label="工程工具栏">
      <button aria-label="返回工程列表" onClick={closeProject}>工程列表</button><button onClick={onReturnMuseum}>档案馆</button><i />
      <button onClick={undo} aria-label="撤销">↶</button><button onClick={redo} aria-label="重做">↷</button><button onClick={() => void saveNow()}>立即保存</button>
      <button onClick={() => setSearching(!searching)}>全局搜索</button><button aria-label="运行校验" onClick={() => { validate(); setSection('validation') }}>校验</button><button onClick={onPreview}>试玩</button><button className="editor-export" onClick={onPublish}>导出</button>
    </div>
    <div className={`editor-save-state ${saveStatus}`}><span aria-hidden="true" />{saveLabels[saveStatus]}</div>
    {searching && <div className="editor-search-popover"><label>搜索工程内容<input autoFocus placeholder="文件、人物、线索或ID" /></label><p>输入关键词后按 Enter 定位。搜索只读取当前工程。</p></div>}
  </header>
}

