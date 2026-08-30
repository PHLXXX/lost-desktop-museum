import { describe, expect, it } from 'vitest'
import { caseDefinition } from '../../cases/case-001/case'
import { filterEvidenceClues } from './evidenceFilters'

describe('filterEvidenceClues', () => {
  const clues = caseDefinition.clues
  it('filters independently by source, person, time and place', () => {
    expect(filterEvidenceClues(clues, { source: 'mail', person: '', time: '', place: '' }).map((clue) => clue.id)).toEqual(['C01', 'C09', 'C11'])
    expect(filterEvidenceClues(clues, { source: '', person: '林然', time: '', place: '' }).map((clue) => clue.id)).toEqual(['C06', 'C07', 'C08'])
    expect(filterEvidenceClues(clues, { source: '', person: '', time: '23:48', place: '住所' }).map((clue) => clue.id)).toEqual(['C08'])
  })
})
