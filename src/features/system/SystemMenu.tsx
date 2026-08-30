import { useEffect, useState } from 'react'
import { SaveIndicator } from './SaveIndicator'
import { useGameStore } from '../../store/gameStore'

export function SystemMenu({ open, onClose, onReturnMuseum, onOpenSettings }: { open: boolean; onClose: () => void; onReturnMuseum: () => void; onOpenSettings: () => void }) {
  const { saveNow, resetCase, setOnboardingComplete } = useGameStore()
  const [confirmRestart, setConfirmRestart] = useState(false)
  const [help, setHelp] = useState(false)
  useEffect(() => { if (!open) return; const close = (event: KeyboardEvent) => { if (event.key === 'Escape') { if (confirmRestart) setConfirmRestart(false); else if (help) setHelp(false); else onClose() } }; window.addEventListener('keydown', close); return () => window.removeEventListener('keydown', close) }, [open, confirmRestart, help, onClose])
  if (!open) return null
  return <><aside className="system-menu" role="menu" aria-label="A/OS 系统菜单"><header><strong>ARCHIVE/OS</strong><span>案件快照 LD-001</span></header><button role="menuitem" onClick={() => { saveNow(); onClose() }}><span>立即保存</span><SaveIndicator /></button><button role="menuitem" onClick={() => { saveNow(); onReturnMuseum() }}><span>保存并返回展馆</span><small>案件进度不会重置</small></button><button role="menuitem" onClick={() => setConfirmRestart(true)}><span>重新开始案件</span><small>需要再次确认</small></button><hr /><button role="menuitem" onClick={() => setHelp(true)}><span>帮助与快捷键</span><small>F11 可进入浏览器全屏</small></button><button role="menuitem" onClick={() => { onOpenSettings(); onClose() }}><span>系统设置</span><small>声音、异常、扫描线</small></button><footer>Esc 关闭菜单 · 数据仅保存在本机</footer></aside>
    {confirmRestart && <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="确认重新开始案件"><section className="confirm-card"><h2>重新开始案件？</h2><p>所有线索、关系、窗口布局和个人推理都会清除；显示偏好将保留。</p><div><button autoFocus onClick={() => setConfirmRestart(false)}>取消</button><button className="danger-button" onClick={() => { resetCase(); setOnboardingComplete(false); setConfirmRestart(false); onClose() }}>确认重新开始</button></div></section></div>}
    {help && <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="帮助与快捷键"><section className="help-card"><header><h2>帮助与快捷键</h2><button aria-label="关闭帮助" onClick={() => setHelp(false)}>×</button></header><dl><div><dt>单击</dt><dd>选择桌面图标或表格行</dd></div><div><dt>双击 / Enter</dt><dd>打开选中的应用</dd></div><div><dt>Esc</dt><dd>关闭当前菜单或对话框</dd></div><div><dt>F11</dt><dd>切换浏览器全屏（由浏览器控制）</dd></div><div><dt>A/OS</dt><dd>保存、返回、重新开始与设置</dd></div></dl><button className="primary-button" onClick={() => setHelp(false)}>返回调查</button></section></div>}
  </>
}
