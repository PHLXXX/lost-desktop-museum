import type { CaseDefinition, DeductionResult, DeductionSubmission } from '../cases/types'

const samePair = (a: [string, string], b: [string, string]) => a.includes(b[0]) && a.includes(b[1])

export function scoreDeduction(caseDefinition: CaseDefinition, submission: DeductionSubmission): DeductionResult {
  const availableAnswerPoints = caseDefinition.questions.reduce((sum, question) => sum + question.points, 0)
  const earnedAnswerPoints = caseDefinition.questions.reduce((sum, question, index) => sum + (submission.answers[index] === question.correctId ? question.points : 0), 0)
  const answerScore = availableAnswerPoints > 0 ? Math.round((earnedAnswerPoints / availableAnswerPoints) * 65) : 65
  const evidenceTarget = Math.min(6, new Set(caseDefinition.coreEvidenceIds).size)
  const matchedEvidence = new Set(submission.evidenceIds.filter((id) => caseDefinition.coreEvidenceIds.includes(id))).size
  const evidenceScore = evidenceTarget > 0 ? Math.round((Math.min(evidenceTarget, matchedEvidence) / evidenceTarget) * 30) : 30
  const correctRelations = caseDefinition.correctContradictions.filter((expected) => submission.contradictionPairs.some((actual) => samePair(expected, actual))).length
  const relationScore = caseDefinition.correctContradictions.length > 0
    ? Math.round((correctRelations / caseDefinition.correctContradictions.length) * 5)
    : 5
  const score = Math.min(100, answerScore + evidenceScore + relationScore)
  const configuredLevel = caseDefinition.resultLevels.find((item) => score >= item.minScore && score <= item.maxScore)
  const level = configuredLevel?.label ?? (score >= 90 ? '档案重建完成' : score >= 70 ? '主要事实已还原' : score >= 50 ? '推理存在未解释矛盾' : '档案仍然混乱')
  return { score, level, answerScore, evidenceScore, relationScore, note: submission.note }
}
