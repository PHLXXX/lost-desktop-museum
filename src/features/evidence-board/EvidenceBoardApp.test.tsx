import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { createFreshSave } from '../../engine/persistence'
import { useGameStore } from '../../store/gameStore'
import { EvidenceBoardApp } from './EvidenceBoardApp'

describe('EvidenceBoardApp', () => {
  beforeEach(() => {
    localStorage.clear()
    useGameStore.setState({
      ...createFreshSave(),
      discoveredClueIds: ['C01'],
      saveStatus: 'idle',
      notice: null,
      corruptSave: false,
    })
  })

  it('stores a local note for the selected evidence', async () => {
    const user = userEvent.setup()
    render(<EvidenceBoardApp />)
    const note = screen.getByRole('textbox', { name: '线索备注' })
    await user.type(note, '核对 22:41 的取消时间')
    expect(useGameStore.getState().evidenceNotes.C01).toBe('核对 22:41 的取消时间')
  })
})
