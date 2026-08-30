import { describe, expect, it } from 'vitest'
import { caseDefinition } from './case'
import { caseDefinitionSchema } from '../schema'

describe('case 001', () => {
  it('contains twelve reachable clues', () => {
    expect(caseDefinition.clues.map(({ id }) => id)).toEqual(
      Array.from({ length: 12 }, (_, index) => `C${String(index + 1).padStart(2, '0')}`),
    )
    expect(caseDefinition.clues.every((clue) => clue.source && clue.discovery.type)).toBe(true)
  })

  it('keeps the canonical timeline sorted', () => {
    const times = caseDefinition.timeline.map((entry) => entry.time)
    expect(times).toEqual([...times].sort())
  })

  it('passes runtime validation', () => {
    expect(() => caseDefinitionSchema.parse(caseDefinition)).not.toThrow()
  })
})

