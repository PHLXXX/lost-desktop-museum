import { useActiveCaseDefinition } from '../../cases/useActiveCase'
import { caseDisplayId } from '../../cases/casePresentation'
import { useGameStore } from '../../store/gameStore'

export function ResultScreen({
  onReturnMuseum,
  onReviewEvidence,
}: {
  onReturnMuseum: () => void
  onReviewEvidence: () => void
}) {
  const caseDefinition = useActiveCaseDefinition()
  const { deductionResult: result, discoveredClueIds, pinnedClueIds, saveNow } = useGameStore()
  if (!result) return null
  return (
    <main className="result-screen">
      <header>
        <span className="brand-mark">A</span>
        <div>
          <strong>档案重建完成</strong>
          <small>CASE {caseDisplayId(caseDefinition)} / LOCAL RESULT</small>
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
          <h1>《{caseDefinition.title}》已形成一种可解释的调查顺序。</h1>
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
            已发现 {discoveredClueIds.length}/{caseDefinition.clues.length} 条线索；标记的关键证据为{' '}
            {pinnedClueIds.join('、') || '无'}。
          </p>
          {result.note && <blockquote>{result.note}</blockquote>}
          <div className="ending">
            <p>推理结果与证据引用已写入本地案件存档。</p>
            <strong>{caseDefinition.ending}</strong>
          </div>
          <div className="result-actions">
            <button onClick={onReviewEvidence}>返回证据板</button>
            <button className="primary-button" onClick={() => { saveNow(); onReturnMuseum() }}>
              保存并返回档案馆
            </button>
          </div>
        </article>
      </section>
    </main>
  )
}
