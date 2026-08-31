import { describe, expect, it } from 'vitest'
import { caseDefinition as case002 } from '../cases/case-002/case'
import { scoreDeduction } from './scoringEngine'

describe('scoreDeduction', () => {
  it('reserves score weight for evidence and relations when author questions total 100 points', () => {
    const definition = {
      ...structuredClone(case002),
      questions: [
        { ...structuredClone(case002.questions[0]!), points: 50 },
        { ...structuredClone(case002.questions[1]!), points: 50 },
      ],
      correctContradictions: [['C01', 'C02']] as [string, string][],
    }

    const result = scoreDeduction(definition, {
      answers: definition.questions.map((question) => question.correctId),
      evidenceIds: ['C01'],
      contradictionPairs: [['C02', 'C01']],
      note: '',
    })

    expect(result).toMatchObject({
      answerScore: 65,
      evidenceScore: 5,
      relationScore: 5,
      score: 75,
    })
  })
})
