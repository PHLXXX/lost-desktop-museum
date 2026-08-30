import { act, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useGameStore } from '../../store/gameStore'
import { SaveIndicator } from './SaveIndicator'

describe('save indicator', () => {
  afterEach(() => vi.useRealTimers())
  it.each([['saving', '正在保存…'], ['saved', '已保存'], ['error', '保存失败']] as const)('renders %s state', (saveStatus, label) => {
    useGameStore.setState({ saveStatus })
    render(<SaveIndicator />)
    expect(screen.getByRole('status')).toHaveTextContent(label)
  })

  it('collapses the saved label to a compact status icon', () => {
    vi.useFakeTimers()
    useGameStore.setState({ saveStatus: 'saved' })
    render(<SaveIndicator />)
    act(() => vi.advanceTimersByTime(1800))
    expect(screen.getByRole('status', { name: '已保存' })).toHaveAttribute('data-compact', 'true')
  })
})
