import type { CaseDefinition, DeductionResult, DeductionSubmission } from '../cases/types'

const samePair = (a: [string, string], b: [string, string]) => a.includes(b[0]) && a.includes(b[1])

export function scoreDeduction(caseDefinition: CaseDefinition, submission: DeductionSubmission): DeductionResult {
  const answerScore = caseDefinition.questions.reduce((sum, question, index) => sum + (submission.answers[index] === question.correctId ? question.points : 0), 0)
  const evidenceScore = Math.min(30, submission.evidenceIds.filter((id) => caseDefinition.coreEvidenceIds.includes(id)).length * 5)
  const correctRelations = caseDefinition.correctContradictions.filter((expected) => submission.contradictionPairs.some((actual) => samePair(expected, actual))).length
  const relationScore = correctRelations >= 2 ? 5 : 0
  const score = answerScore + evidenceScore + relationScore
  const level = score >= 90 ? '档案重建完成' : score >= 70 ? '主要事实已还原' : score >= 50 ? '推理存在未解释矛盾' : '档案仍然混乱'
  return { score, level, answerScore, evidenceScore, relationScore, note: submission.note }
}
