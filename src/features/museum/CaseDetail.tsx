import { useState } from 'react'
import { useActiveCaseDefinition } from '../../cases/useActiveCase'
import { useGameStore } from '../../store/gameStore'
import { useWindowStore } from '../../store/windowStore'
import { ArchiveDialog } from '../system/ArchiveDialog'

export function CaseDetail({ onBack, onStart, onContinue }: { onBack: () => void; onStart: () => void; onContinue: () => void }) {
  const caseDefinition = useActiveCaseDefinition()
  const { caseStarted, discoveredClueIds, lastSavedAt, playTime, settings, updateSettings, resetCase } = useGameStore()
  const [restartOpen, setRestartOpen] = useState(false)
  const hasProgress = caseStarted || discoveredClueIds.length > 0 || playTime > 0

  return (
    <main className="case-detail-shell">
      <header className="detail-header"><button onClick={onBack}>← 返回档案馆</button><span>档案 {caseDefinition.id.replace('case-', '')} · {caseDefinition.id}</span></header>
      <div className="case-file">
        <aside className="case-cover"><span className="brand-mark large">A</span><p>ARCHIVE COPY</p><strong>{caseDefinition.id.replace('case-', '')}</strong><small>封存于 {new Date(caseDefinition.manifest.archivedAt).toLocaleDateString('zh-CN')}</small></aside>
        <article>
          <span className="status-chip">{hasProgress ? '调查中' : '未开始'}</span>
          <h1>{caseDefinition.title}</h1>
          <p className="case-lead">{caseDefinition.manifest.summary}</p>
          <dl className="case-facts">
            <div><dt>电脑主人</dt><dd>{caseDefinition.owner}</dd></div>
            <div><dt>最后登录</dt><dd>{new Date(caseDefinition.subject.lastLoginAt).toLocaleString('zh-CN', { hour12: false })}</dd></div>
            <div><dt>案件目标</dt><dd>记录至少 {Math.min(6, caseDefinition.clues.length)} 条线索后提交推理，完整档案含 {caseDefinition.clues.length} 条线索</dd></div>
            <div><dt>建议游玩时间</dt><dd>{caseDefinition.manifest.estimatedMinutes} 分钟</dd></div>
            <div><dt>当前进度</dt><dd>{discoveredClueIds.length} / {caseDefinition.clues.length}</dd></div>
            <div><dt>最近保存</dt><dd>{hasProgress ? new Date(lastSavedAt).toLocaleString('zh-CN', { hour12: false }) : '—'}</dd></div>
          </dl>
          <section className="case-instructions" aria-labelledby="case-instructions-title">
            <h2 id="case-instructions-title">操作说明</h2>
            <ol><li>双击桌面图标打开应用。</li><li>调查可疑内容并查看属性。</li><li>将重要内容加入证据板。</li><li>发现至少 6 条线索后可以提交推理。</li><li>按 Esc 随时打开系统菜单。</li></ol>
          </section>
          <div className="case-mode-options">
            <label><span>安全模式</span><input type="checkbox" checked={settings.safeMode} onChange={(event) => updateSettings({ safeMode: event.target.checked, anomalies: event.target.checked ? false : settings.anomalies, scanlines: event.target.checked ? 0 : settings.scanlines })} /></label>
            <label><span>动态异常效果</span><input type="checkbox" checked={settings.anomalies} disabled={settings.safeMode} onChange={(event) => updateSettings({ anomalies: event.target.checked })} /></label>
          </div>
          <div className="case-actions">
            <button className="primary-button" onClick={hasProgress ? onContinue : onStart}>{hasProgress ? '继续调查' : '开始调查'}</button>
            {hasProgress && <button className="secondary-button" onClick={() => setRestartOpen(true)}>重新调查</button>}
            <button className="text-button" onClick={onBack}>返回档案馆</button>
          </div>
          <p className="local-note">存档只写入当前浏览器。本作不需要账户，也不会发送调查内容。</p>
        </article>
      </div>
      {restartOpen && <ArchiveDialog title="重新开始调查？" onClose={() => setRestartOpen(false)} actions={<><button onClick={() => setRestartOpen(false)}>取消</button><button className="danger-button" onClick={() => { resetCase(); useWindowStore.getState().resetWindows(); setRestartOpen(false) }}>清除进度并重新开始</button></>}><p>当前案件的线索、窗口位置、解锁内容和证据关系都会被清除。该操作无法撤销。</p></ArchiveDialog>}
    </main>
  )
}
