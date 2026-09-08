import { useActiveCaseDefinition } from '../../cases/useActiveCase'
import { caseDisplayId } from '../../cases/casePresentation'
import { resolveInvestigationGameplay } from '../../gameplay/defaultGameplay'
import { getHintState } from '../../gameplay/hintEngine'
import { getObjectiveStates } from '../../gameplay/objectiveEngine'
import { useGameStore } from '../../store/gameStore'

function formatPlayTime(seconds: number) {
  const minutes = Math.floor(seconds / 60)
  return `${String(minutes).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`
}

export function ResultScreen({
  onReturnMuseum,
  onReviewEvidence,
}: {
  onReturnMuseum: () => void
  onReviewEvidence: () => void
}) {
  const caseDefinition = useActiveCaseDefinition()
  const {
    deductionResult: result,
    discoveredClueIds,
    pinnedClueIds,
    completedEventKeys,
    evidenceRelations,
    triggeredEventIds,
    hintUsage,
    playTime,
    saveNow,
  } = useGameStore()
  if (!result) return null
  const gameplay = resolveInvestigationGameplay(caseDefinition)
  const saveState = { completedEventKeys, discoveredClueIds, evidenceRelations, triggeredEventIds, hintUsage }
  const objectives = getObjectiveStates(caseDefinition, saveState).filter((objective) => objective.visible)
  const completedObjectives = objectives.filter((objective) => objective.complete)
  const hintLayers = getHintState(caseDefinition, saveState).hints.reduce((total, hint) => total + hint.revealedCount, 0)
  const earnedChallenges = gameplay.challenges.filter((challenge) => result.challengeIds?.includes(challenge.id))
  const endingVariant = gameplay.endingVariants.find((ending) => ending.id === result.endingVariantId)
  const ending = endingVariant
    ? { title: endingVariant.title, text: endingVariant.text }
    : { title: '档案结论', text: caseDefinition.ending }
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
          <section className="result-investigation-stats" aria-label="深度调查统计">
            <div><span>目标完成</span>{' '}<strong>{completedObjectives.length} / {objectives.length}</strong></div>
            <div><span>本次挑战</span>{' '}<strong>{earnedChallenges.length} / {gameplay.challenges.length}</strong></div>
            <div><span>使用提示</span>{' '}<strong>{hintLayers} 层</strong></div>
            <div><span>调查用时</span>{' '}<strong>{formatPlayTime(playTime)}</strong></div>
          </section>
          <section className="result-review-section" aria-labelledby="result-objectives-title">
            <h2 id="result-objectives-title">目标复盘</h2>
            <div className="result-record-list">
              {objectives.map((objective) => <article data-complete={objective.complete} key={objective.id}><span>{objective.complete ? '完成' : '未完成'}</span><div><strong>{objective.title}</strong><p>{objective.description}</p></div></article>)}
            </div>
          </section>
          <section className="result-review-section" aria-labelledby="result-challenges-title">
            <h2 id="result-challenges-title">调查挑战</h2>
            <div className="result-challenge-badges">
              {gameplay.challenges.map((challenge) => <span data-earned={result.challengeIds?.includes(challenge.id) ?? false} key={challenge.id}>{result.challengeIds?.includes(challenge.id) ? '已达成' : '未达成'} · {challenge.title}</span>)}
            </div>
          </section>
          {result.note && <blockquote>{result.note}</blockquote>}
          <div className="ending">
            <p>推理结果与证据引用已写入本地案件存档。</p>
            <span>{ending.title}</span>
            <strong>{ending.text}</strong>
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
