import { useEffect, useRef } from 'react'
import { useActiveCaseDefinition } from '../../cases/useActiveCase'
import { useGameStore } from '../../store/gameStore'

export function DeductionDialog({ answers, note, onAnswersChange, onNoteChange, onClose, onResult }: {
  answers: Record<string, string>
  note: string
  onAnswersChange: (answers: Record<string, string>) => void
  onNoteChange: (note: string) => void
  onClose: () => void
  onResult?: () => void
}) {
  const caseDefinition = useActiveCaseDefinition()
  const { pinnedClueIds, evidenceRelations, submit } = useGameStore()
  const closeRef = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    closeRef.current?.focus()
    const close = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose() }
    window.addEventListener('keydown', close)
    return () => window.removeEventListener('keydown', close)
  }, [onClose])
  const contradictionCount = evidenceRelations.filter((relation) => relation.type === '相互矛盾').length
  const relationRequired = caseDefinition.correctContradictions.length > 0
  const evidenceReady = pinnedClueIds.length > 0
  const relationReady = !relationRequired || contradictionCount > 0
  const answersReady = caseDefinition.questions.every((question) => Boolean(answers[question.id]))
  const keyEvidenceTarget = Math.min(6, caseDefinition.coreEvidenceIds.length)
  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="最终推理">
      <form className="deduction-card" onSubmit={(event) => { event.preventDefault(); submit(caseDefinition.questions.map((question) => answers[question.id] ?? ''), note); onResult?.() }}>
        <button ref={closeRef} type="button" className="modal-close" aria-label="关闭最终推理" onClick={onClose}>×</button>
        <h2>重建最后一次登录</h2>
        {caseDefinition.questions.map((question, index) => (
          <fieldset key={question.id}>
            <legend><span>{String(index + 1).padStart(2, '0')}</span>{question.prompt}</legend>
            {question.options.map((option) => <label key={option.id}><input required type="radio" name={question.id} value={option.id} checked={answers[question.id] === option.id} onChange={() => onAnswersChange({ ...answers, [question.id]: option.id })} />{option.label}</label>)}
          </fieldset>
        ))}
        <section className="deduction-evidence">
          <h3>提交检查</h3>
          <p>关键证据：{pinnedClueIds.length}/{keyEvidenceTarget} · 矛盾关系：{contradictionCount}</p>
          {!evidenceReady && <p className="error-text">还需至少 1 条关键证据</p>}
          {relationRequired ? !relationReady && <p className="error-text">还需至少 1 条矛盾关系</p> : <p>本案无需矛盾关系</p>}
          {!answersReady && <p>请完成全部判断题。</p>}
        </section>
        <label className="note-field">个人推理（只保存在本地）<textarea value={note} onChange={(event) => onNoteChange(event.target.value)} /></label>
        <button className="primary-button" disabled={!evidenceReady || !relationReady || !answersReady}>提交推理</button>
      </form>
    </div>
  )
}
