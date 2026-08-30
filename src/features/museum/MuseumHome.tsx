import { caseDefinition } from '../../cases/case-001/case'
import { useGameStore } from '../../store/gameStore'

export function MuseumHome({ onOpenCase }: { onOpenCase: () => void }) {
  const discovered = useGameStore((state) => state.discoveredClueIds.length)
  const lastSavedAt = useGameStore((state) => state.lastSavedAt)
  const hasProgress = discovered > 0
  return (
    <main className="museum-shell">
      <header className="museum-header">
        <div className="brand-lockup">
          <span className="brand-mark">A</span>
          <div>
            <strong>遗失电脑博物馆</strong>
            <small>LOST DESKTOP MUSEUM</small>
          </div>
        </div>
        <nav aria-label="博物馆导航">
          <button className="nav-current">馆藏</button>
          <button onClick={() => alert('所有调查数据只保存在当前浏览器。')}>关于本馆</button>
        </nav>
      </header>
      <section className="museum-intro">
        <div>
          <h1>
            遗失的电脑，
            <br />
            仍在等待最后一次登录。
          </h1>
          <p>进入封存的本地系统，从文件、讯息与系统痕迹中重建一段没有完成的离开。</p>
        </div>
        <dl>
          <div>
            <dt>展品</dt>
            <dd>01</dd>
          </div>
          <div>
            <dt>可记录线索</dt>
            <dd>12</dd>
          </div>
          <div>
            <dt>预计调查</dt>
            <dd>15—30 分钟</dd>
          </div>
        </dl>
      </section>
      <section className="exhibit-row" aria-labelledby="case-title">
        <div className="exhibit-index">
          <span>展品</span>
          <strong>LD-001</strong>
          <i aria-hidden="true" />
        </div>
        <div className="exhibit-copy">
          <span className="status-chip">{hasProgress ? '调查中' : '待修复'}</span>
          <h2 id="case-title">{caseDefinition.title}</h2>
          <p>
            自由纪录片剪辑师周屿的个人电脑。系统在一次异常登录后中断，出发计划与留下的记录彼此矛盾。
          </p>
          <div className="exhibit-meta">
            <span>所有者：{caseDefinition.owner}</span>
            <span>最后登录：2031.11.17 23:48</span>
            <span>已记录：{discovered} / 12</span>
          </div>
        </div>
        <div className="exhibit-action">
          <small>
            {hasProgress
              ? `保存于 ${new Date(lastSavedAt).toLocaleString('zh-CN', { hour12: false })}`
              : '尚未建立调查存档'}
          </small>
          <button className="primary-button" onClick={onOpenCase}>
            {hasProgress ? '继续调查' : '查看案件'}
          </button>
        </div>
      </section>
      <footer className="museum-footer">
        <span>本地展馆 · 无账户 · 无数据上传</span>
        <span>ARCHIVE/OS COLLECTION 2031</span>
      </footer>
    </main>
  )
}
