import { useState } from 'react'
import { useGameStore } from '../../store/gameStore'
import { useWindowStore } from '../../store/windowStore'
import { ArchiveDialog } from '../system/ArchiveDialog'
import { AppStatusBar, AppToolbar, PaneHeader } from './AppChrome'

type SettingsSection = 'display' | 'data' | 'about'

export function SettingsApp() {
  const { settings, updateSettings, resetCase, saveStatus } = useGameStore()
  const [section, setSection] = useState<SettingsSection>('display')
  const [confirm, setConfirm] = useState(false)
  const setSafeMode = (enabled: boolean) => updateSettings({ safeMode: enabled, anomalies: enabled ? false : settings.anomalies, scanlines: enabled ? 0 : settings.scanlines })

  return (
    <div className="application settings-application">
      <AppToolbar><strong>系统设置</strong><span className="path-field">ARCHIVE/OS / LOCAL PROFILE</span><span>保存状态：{saveStatus}</span></AppToolbar>
      <div className="settings-layout">
        <nav aria-label="设置类别">
          <PaneHeader title="设置类别" />
          <button data-active={section === 'display'} onClick={() => setSection('display')}>显示与声音</button>
          <button data-active={section === 'data'} onClick={() => setSection('data')}>调查数据</button>
          <button data-active={section === 'about'} onClick={() => setSection('about')}>关于系统</button>
        </nav>
        <section aria-live="polite">
          {section === 'display' && <><PaneHeader title="显示与声音" meta="变化会自动保存" />
            <label><span><b>系统音效</b><small>程序化提示音，不加载外部音频</small></span><input type="checkbox" checked={settings.sound} onChange={(event) => updateSettings({ sound: event.target.checked })} /></label>
            <label><span><b>安全模式</b><small>关闭时钟倒退、色彩错位、抖动与扫描线</small></span><input type="checkbox" checked={settings.safeMode} onChange={(event) => setSafeMode(event.target.checked)} /></label>
            <label><span><b>动态异常效果</b><small>关闭后仍保留剧情文字与状态</small></span><input type="checkbox" checked={settings.anomalies} disabled={settings.safeMode} onChange={(event) => updateSettings({ anomalies: event.target.checked })} /></label>
            <label><span><b>扫描线强度</b><small>{Math.round(settings.scanlines * 100)}%</small></span><input type="range" min="0" max="0.3" step=".02" value={settings.scanlines} disabled={settings.safeMode} onChange={(event) => updateSettings({ scanlines: Number(event.target.value) })} /></label>
          </>}
          {section === 'data' && <><PaneHeader title="调查数据" meta="全局设置将保留" /><h3>重新开始本案</h3><p>重置会清除线索、证据关系、解锁内容和窗口布局，但保留显示与声音偏好。</p><button className="danger-button" onClick={() => setConfirm(true)}>重置案件</button></>}
          {section === 'about' && <><PaneHeader title="关于系统" meta="档案保护终端" /><h2>ARCHIVE/OS 3.1</h2><dl><dt>发行版本</dt><dd>Lost Desktop Museum v0.2.0</dd><dt>设备编号</dt><dd>ARQ-MUSEUM-031</dd><dt>工作模式</dt><dd>本地离线档案恢复</dd><dt>数据策略</dt><dd>仅保存在当前浏览器</dd></dl></>}
        </section>
      </div>
      {confirm && <ArchiveDialog title="重新开始调查？" onClose={() => setConfirm(false)} actions={<><button onClick={() => setConfirm(false)}>取消</button><button className="danger-button" onClick={() => { resetCase(); useWindowStore.getState().resetWindows(); setConfirm(false) }}>清除进度并重新开始</button></>}><p>当前案件的线索、窗口位置、解锁内容和证据关系都会被清除。该操作无法撤销。</p></ArchiveDialog>}
      <AppStatusBar><span>ARCHIVE/OS 3.1</span><span>设置保存在当前浏览器</span></AppStatusBar>
    </div>
  )
}
