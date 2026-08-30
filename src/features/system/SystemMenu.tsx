import { useState } from 'react'
import { useGameStore } from '../../store/gameStore'
import { useWindowStore } from '../../store/windowStore'
import { playArchiveSound } from '../../engine/audioEngine'
import { ArchiveDialog } from './ArchiveDialog'
import { SaveIndicator } from './SaveIndicator'

export function SystemMenu({ open, onClose, onReturnMuseum, onOpenSettings }: { open: boolean; onClose: () => void; onReturnMuseum: () => void; onOpenSettings: () => void }) {
  const { saveNow, resetCase, settings } = useGameStore()
  const [confirmRestart, setConfirmRestart] = useState(false)
  const [help, setHelp] = useState(false)
  if (!open) return null

  const saveAndReturn = () => {
    saveNow()
    onClose()
    onReturnMuseum()
  }
  const restart = () => {
    resetCase()
    useWindowStore.getState().resetWindows()
    setConfirmRestart(false)
    onClose()
  }
  const exitFullscreen = async () => {
    if (document.fullscreenElement && document.exitFullscreen) await document.exitFullscreen()
    onClose()
  }

  return (
    <>
      <aside className="system-menu" role="menu" aria-label="A/OS 系统菜单" onClickCapture={() => playArchiveSound('click', settings.sound)}>
        <header><strong>ARCHIVE/OS</strong><span>案件快照 LD-001</span></header>
        <button role="menuitem" onClick={onClose}><span>继续调查</span><small>返回当前应用与窗口</small></button>
        <button role="menuitem" onClick={() => { saveNow(); onClose() }}><span>保存进度</span><SaveIndicator /></button>
        <button role="menuitem" onClick={saveAndReturn}><span>保存并返回档案馆</span><small>案件进度不会重置</small></button>
        <button role="menuitem" onClick={() => setConfirmRestart(true)}><span>重新开始本案</span><small>需要再次确认</small></button>
        <hr />
        <button role="menuitem" onClick={() => setHelp(true)}><span>操作说明</span><small>鼠标、键盘与证据板</small></button>
        <button role="menuitem" onClick={() => { onOpenSettings(); onClose() }}><span>系统设置</span><small>声音、异常、扫描线</small></button>
        <button role="menuitem" onClick={exitFullscreen} disabled={!document.fullscreenElement}><span>退出全屏</span><small>F11 仍由浏览器控制</small></button>
        <button role="menuitem" onClick={onClose}><span>取消</span><small>Esc 关闭菜单</small></button>
        <footer>数据仅保存在本机</footer>
      </aside>
      {confirmRestart && <ArchiveDialog title="重新开始调查？" onClose={() => setConfirmRestart(false)} actions={<><button onClick={() => setConfirmRestart(false)}>取消</button><button className="danger-button" onClick={restart}>清除进度并重新开始</button></>}><p>当前案件的线索、窗口位置、解锁内容和证据关系都会被清除。该操作无法撤销。</p></ArchiveDialog>}
      {help && <ArchiveDialog title="操作说明" onClose={() => setHelp(false)} actions={<button className="primary-button" onClick={() => setHelp(false)}>返回调查</button>}><dl className="shortcut-list"><div><dt>双击 / Enter</dt><dd>打开选中的桌面应用</dd></div><div><dt>Esc</dt><dd>按弹窗、菜单、桌面的优先级关闭或打开系统菜单</dd></div><div><dt>Ctrl/Cmd + S</dt><dd>立即保存当前案件</dd></div><div><dt>Ctrl/Cmd + F</dt><dd>聚焦当前应用搜索框</dd></div><div><dt>Alt + ←</dt><dd>文件管理器返回上一位置</dd></div><div><dt>Delete</dt><dd>删除玩家创建的临时便笺</dd></div><div><dt>F11</dt><dd>由浏览器控制全屏</dd></div></dl></ArchiveDialog>}
    </>
  )
}
