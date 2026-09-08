import type { HintState, HintViewState } from '../../gameplay/hintEngine'

export function HintList({ state, onRequest }: { state: HintState; onRequest: (hint: HintViewState) => void }) {
  return (
    <div className="investigation-list" role="list" aria-label="分析提示列表">
      {state.hints.map((hint) => (
        <article className="investigation-entry hint-entry" key={hint.id} role="listitem">
          <header>
            <span>{hint.label}</span>
            <b>{hint.clueComplete ? '已记录' : `${hint.revealedCount} / 3`}</b>
          </header>
          {hint.revealedTiers.map((tier) => (
            <div className="revealed-hint" key={tier.id}>
              <strong>{tier.label}</strong>
              <p>{tier.text}</p>
            </div>
          ))}
          {!hint.clueComplete && hint.nextTier && (
            <button
              disabled={hint.nextTier.cost > state.remainingPoints}
              onClick={() => onRequest(hint)}
              type="button"
            >
              使用 {hint.nextTier.cost} 点分析
            </button>
          )}
          {!hint.clueComplete && !hint.nextTier && <p className="investigation-muted">该记录的提示已全部显示。</p>}
        </article>
      ))}
    </div>
  )
}
