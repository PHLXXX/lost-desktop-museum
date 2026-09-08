import { describe, expect, it } from 'vitest'
import { listBuiltInCases } from './registry'
import { validateCaseDefinition } from '../engine/validation'

describe('built-in case release gate', () => {
  for (const definition of listBuiltInCases()) it(`${definition.id} passes the shared strict validator`, () => {
    expect(validateCaseDefinition(definition).filter((issue) => issue.severity === 'error')).toEqual([])
    expect(definition.gameplay?.hints.length).toBeGreaterThanOrEqual(3)
    expect(definition.gameplay?.objectives.some((objective) => objective.kind === 'primary')).toBe(true)
    expect(definition.gameplay?.endingVariants.length).toBeGreaterThan(0)
  })
})
