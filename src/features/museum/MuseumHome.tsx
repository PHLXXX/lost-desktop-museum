import { useState } from 'react'
import { caseDefinition } from '../../cases/case-001/case'
import { useGameStore } from '../../store/gameStore'
import { useWindowStore } from '../../store/windowStore'
import { ArchiveDialog } from '../system/ArchiveDialog'

type MuseumDialog = 'about' | 'credits' | 'settings' | 'restart' | null

function formatPlayTime(seconds: number) {
  const minutes = Math.floor(seconds / 60)
  const remainder = seconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`
}

export function MuseumHome({ onOpenCase, onContinue }: { onOpenCase: () => void; onContinue: () => void }) {
  const { caseStarted, discoveredClueIds, lastSavedAt, playTime, deductionResult, bestScore, settings, updateSettings, resetCase, corruptSave, notice, dismissNotice } = useGameStore()
  const [dialog, setDialog] = useState<MuseumDialog>(null)
  const discovered = discoveredClueIds.length
  const hasProgress = caseStarted || discovered > 0 || playTime > 0
  const completed = Boolean(deductionResult)
  const progress = Math.round((discovered / caseDefinition.clues.length) * 100)
  const score = bestScore ?? deductionResult?.score ?? null

  return (
    <main className="museum-shell">
      <header className="museum-header">
        <div className="brand-lockup"><span className="brand-mark">A</span><div><strong>遗失电脑博物馆</strong><small>LOST DESKTOP MUSEUM</small></div></div>
        <nav aria-label="博物馆导航"><button className="nav-current">馆藏</button><button onClick={() => setDialog('about')}>关于本馆</button></nav>
      </header>
      {corruptSave && notice && <section className="museum-recovery" role="status" aria-label="存档恢复提示"><div><strong>存档恢复模式</strong><p>{notice}</p></div><button aria-label="关闭存档恢复提示" onClick={dismissNotice}>×</button></section>}
      <section className="museum-intro">
        <div><h1>遗失的电脑，<br />仍在等待最后一次登录。</h1><p>从数字遗物中，重新拼出一个人的最后轨迹。</p></div>
        <dl><div><dt>展品</dt><dd>01</dd></div><div><dt>可记录线索</dt><dd>12</dd></div><div><dt>预计调查</dt><dd>15—30 分钟</dd></div></dl>
      </section>
      <section className="exhibit-row" aria-labelledby="case-title">
        <div className="exhibit-index"><span>档案</span><strong>001</strong><i aria-hidden="true" /></div>
        <div className="exhibit-copy">
          <span className="status-chip">{completed ? '已完成' : hasProgress ? '调查中' : '未开始'}</span>
          <h2 id="case-title">{caseDefinition.title}</h2>
          <p>自由纪录片剪辑师周屿的个人电脑。系统在一次异常登录后中断，出发计划与留下的记录彼此矛盾。</p>
          <dl className="case-summary-grid">
            <div><dt>案件状态</dt><dd>{completed ? '已完成' : hasProgress ? '调查中' : '未开始'}</dd></div>
            <div><dt>发现线索</dt><dd>{discovered} / {caseDefinition.clues.length}</dd></div>
            <div><dt>调查进度</dt><dd>{progress}%</dd></div>
            <div><dt>游玩时长</dt><dd>{formatPlayTime(playTime)}</dd></div>
            <div><dt>最后保存</dt><dd>{hasProgress ? new Date(lastSavedAt).toLocaleString('zh-CN', { hour12: false }) : '—'}</dd></div>
            <div><dt>最高分</dt><dd>{score ?? '—'}</dd></div>
          </dl>
        </div>
        <div className="exhibit-action">
          <button className="primary-button" onClick={hasProgress ? onContinue : onOpenCase}>{completed ? '重新进入档案' : hasProgress ? '继续调查' : '开始调查'}</button>
          <button className="secondary-button" onClick={onOpenCase}>查看案件简介</button>
          {hasProgress && <button className="text-button" onClick={() => setDialog('restart')}>重新调查</button>}
        </div>
      </section>
      <div className="museum-utility-actions"><button onClick={() => setDialog('settings')}>设置</button><button onClick={() => setDialog('credits')}>制作人员</button></div>
      <footer className="museum-footer"><span>本地展馆 · 无账户 · 无数据上传</span><span>ARCHIVE/OS COLLECTION 2031</span></footer>

      {dialog === 'about' && <ArchiveDialog title="关于本馆" onClose={() => setDialog(null)} actions={<button className="primary-button" onClick={() => setDialog(null)}>知道了</button>}><p>馆藏调查完全在当前浏览器中运行。我们不会上传存档、推理或玩家便笺。</p></ArchiveDialog>}
      {dialog === 'credits' && <ArchiveDialog title="制作人员" onClose={() => setDialog(null)} actions={<button className="primary-button" onClick={() => setDialog(null)}>返回馆藏</button>}><p>设计、程序、案件文本与原创档案资源：Lost Desktop Museum 项目组。</p><p>系统界面：ARCHIVE/OS 3.1。</p></ArchiveDialog>}
      {dialog === 'settings' && <ArchiveDialog title="馆藏设置" onClose={() => setDialog(null)} actions={<button className="primary-button" onClick={() => setDialog(null)}>保存并关闭</button>}><label className="dialog-setting"><span>系统音效</span><input type="checkbox" checked={settings.sound} onChange={(event) => updateSettings({ sound: event.target.checked })} /></label><label className="dialog-setting"><span>动态异常效果</span><input type="checkbox" checked={settings.anomalies} disabled={settings.safeMode} onChange={(event) => updateSettings({ anomalies: event.target.checked })} /></label></ArchiveDialog>}
      {dialog === 'restart' && <ArchiveDialog title="重新开始调查？" onClose={() => setDialog(null)} actions={<><button onClick={() => setDialog(null)}>取消</button><button className="danger-button" onClick={() => { resetCase(); useWindowStore.getState().resetWindows(); setDialog(null); onOpenCase() }}>清除进度并重新开始</button></>}><p>当前案件的线索、窗口位置、解锁内容和证据关系都会被清除。该操作无法撤销。</p></ArchiveDialog>}
    </main>
  )
}
