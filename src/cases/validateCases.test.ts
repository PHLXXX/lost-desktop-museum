import { describe, expect, it } from 'vitest'
import { listBuiltInCases } from './registry'
import { validateCaseDefinition } from '../engine/validation'

describe('built-in case release gate', () => {
  for (const definition of listBuiltInCases()) it(`${definition.id} passes the shared strict validator`, () => {
    expect(validateCaseDefinition(definition).filter((issue) => issue.severity === 'error')).toEqual([])
  })
})
