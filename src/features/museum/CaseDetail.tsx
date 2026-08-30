import { caseDefinition } from '../../cases/case-001/case'
import { useGameStore } from '../../store/gameStore'

export function CaseDetail({ onBack, onStart }: { onBack: () => void; onStart: () => void }) {
  const { discoveredClueIds, lastSavedAt, resetCase } = useGameStore()
  const hasProgress = discoveredClueIds.length > 0
  return <main className="case-detail-shell"><header className="detail-header"><button onClick={onBack}>← 返回馆藏</button><span>展品档案 LD-001</span></header><div className="case-file">
    <aside className="case-cover"><span className="brand-mark large">A</span><p>ARCHIVE COPY</p><strong>001</strong><small>封存于 2031.11.18</small></aside>
    <article><span className="status-chip">{hasProgress ? '调查中' : '未开始'}</span><h1>{caseDefinition.title}</h1><p className="case-lead">一份被取消的航班、一张来自八月的机场照片，以及深夜在住所网络中出现的新身份。</p><dl className="case-facts"><div><dt>档案所有者</dt><dd>{caseDefinition.owner}</dd></div><div><dt>系统</dt><dd>ARCHIVE/OS 3.1</dd></div><div><dt>最后登录</dt><dd>2031.11.17 23:48</dd></div><div><dt>调查目标</dt><dd>记录 12 条线索并重建事件</dd></div><div><dt>当前进度</dt><dd>{discoveredClueIds.length} / 12</dd></div><div><dt>最近保存</dt><dd>{hasProgress ? new Date(lastSavedAt).toLocaleString('zh-CN', { hour12: false }) : '—'}</dd></div></dl>
      <div className="case-actions"><button className="primary-button" onClick={onStart}>{hasProgress ? '继续调查' : '开始调查'}</button>{hasProgress && <button className="secondary-button" onClick={() => { if (confirm('重新开始会清除当前案件进度。确定继续？')) resetCase() }}>重新开始</button>}</div>
      <p className="local-note">存档只写入当前浏览器。本作不需要账户，也不会发送调查内容。</p>
    </article>
  </div></main>
}
