import { describe, expect, it } from 'vitest'
import { resolveBase } from '../../vite.config'

describe('resolveBase', () => {
  it('uses the root locally', () => {
    expect(resolveBase()).toBe('/')
  })

  it('derives a repository subpath in Actions', () => {
    expect(resolveBase('PHLXXX/lost-desktop-museum')).toBe('/lost-desktop-museum/')
  })
})
