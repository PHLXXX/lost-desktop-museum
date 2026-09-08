import { afterEach, describe, expect, it } from 'vitest'
import { applyArchiveTheme, isArchiveThemeId } from './archiveThemes'

describe('archive themes', () => {
  afterEach(() => { delete document.documentElement.dataset.archiveTheme })

  it('applies only a known theme id to the document', () => {
    expect(isArchiveThemeId('departure-night')).toBe(true)
    expect(isArchiveThemeId('remote-css')).toBe(false)

    applyArchiveTheme('signal-blueprint')
    expect(document.documentElement.dataset.archiveTheme).toBe('signal-blueprint')
  })
})
