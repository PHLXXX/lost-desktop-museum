import { caseDefinition } from '../../cases/case-001/case'
import { useGameStore } from '../../store/gameStore'

export function ResultScreen({
  onReturnMuseum,
  onReviewEvidence,
}: {
  onReturnMuseum: () => void
  onReviewEvidence: () => void
}) {
  const { deductionResult: result, discoveredClueIds, pinnedClueIds } = useGameStore()
  if (!result) return null
  return (
    <main className="result-screen">
      <header>
        <span className="brand-mark">A</span>
        <div>
          <strong>档案重建完成</strong>
          <small>CASE LD-001 / LOCAL RESULT</small>
        </div>
      </header>
      <section className="result-sheet">
        <div className="result-score">
          <span>重建可信度</span>
          <strong>{result.score}</strong>
          <small>/ 100</small>
          <b>{result.level}</b>
        </div>
        <article>
          <h1>最后一次登录已形成一种可解释的顺序。</h1>
          <div className="score-breakdown">
            <span>
              核心判断 <b>{result.answerScore}/65</b>
            </span>
            <span>
              证据覆盖 <b>{result.evidenceScore}/30</b>
            </span>
            <span>
              矛盾关系 <b>{result.relationScore}/5</b>
            </span>
          </div>
          <p>
            已发现 {discoveredClueIds.length}/12 条线索；标记的关键证据为{' '}
            {pinnedClueIds.join('、') || '无'}。
          </p>
          {result.note && <blockquote>{result.note}</blockquote>}
          <div className="ending">
            <p>正在核对系统日志……</p>
            <p>检测到新的本地会话。</p>
            <p>用户 LINRAN 登录成功。</p>
            <strong>{caseDefinition.ending}</strong>
          </div>
          <div className="result-actions">
            <button onClick={onReviewEvidence}>返回证据板</button>
            <button className="primary-button" onClick={onReturnMuseum}>
              保存并返回展馆
            </button>
          </div>
        </article>
      </section>
    </main>
  )
}
