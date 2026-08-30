import { useEffect, useRef, useState } from 'react'
import { caseDefinition } from '../../cases/case-001/case'
import { useGameStore } from '../../store/gameStore'

export function DeductionDialog({ onClose, onResult }: { onClose: () => void; onResult?: () => void }) {
  const { pinnedClueIds, evidenceRelations, submit } = useGameStore()
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [note, setNote] = useState('')
  const closeRef = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    closeRef.current?.focus()
    const close = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose() }
    window.addEventListener('keydown', close)
    return () => window.removeEventListener('keydown', close)
  }, [onClose])
  const contradictionCount = evidenceRelations.filter((relation) => relation.type === '相互矛盾').length
  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="最终推理">
      <form className="deduction-card" onSubmit={(event) => { event.preventDefault(); submit(caseDefinition.questions.map((question) => answers[question.id] ?? ''), note); onResult?.() }}>
        <button ref={closeRef} type="button" className="modal-close" aria-label="关闭最终推理" onClick={onClose}>×</button>
        <h2>重建最后一次登录</h2>
        {caseDefinition.questions.map((question, index) => (
          <fieldset key={question.id}>
            <legend><span>{String(index + 1).padStart(2, '0')}</span>{question.prompt}</legend>
            {question.options.map((option) => <label key={option.id}><input required type="radio" name={question.id} value={option.id} checked={answers[question.id] === option.id} onChange={() => setAnswers((state) => ({ ...state, [question.id]: option.id }))} />{option.label}</label>)}
          </fieldset>
        ))}
        <section className="deduction-evidence"><h3>提交检查</h3><p>关键证据：{pinnedClueIds.length}/6 · 矛盾关系：{contradictionCount}</p></section>
        <label className="note-field">个人推理（只保存在本地）<textarea value={note} onChange={(event) => setNote(event.target.value)} /></label>
        <button className="primary-button" disabled={!pinnedClueIds.length || contradictionCount < 1}>提交推理</button>
      </form>
    </div>
  )
}
