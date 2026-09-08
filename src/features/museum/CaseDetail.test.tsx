import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createFreshSave } from '../../engine/persistence'
import { useGameStore } from '../../store/gameStore'
import { CaseDetail } from './CaseDetail'

describe('CaseDetail deep investigation preview', () => {
  beforeEach(() => {
    localStorage.clear()
    useGameStore.setState({ ...createFreshSave(), saveStatus: 'idle', notice: null, corruptSave: false })
  })

  it('previews analysis points and optional challenges before starting', () => {
    render(<CaseDetail onBack={vi.fn()} onStart={vi.fn()} onContinue={vi.fn()} />)

    expect(screen.getByText('分析额度')).toBeInTheDocument()
    expect(screen.getByText('3 点')).toBeInTheDocument()
    expect(screen.getByText('独立分析')).toBeInTheDocument()
    expect(screen.getByText('完整归档')).toBeInTheDocument()
  })
})
