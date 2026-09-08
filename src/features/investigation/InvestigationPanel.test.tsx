import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createFreshSave } from '../../engine/persistence'
import { useGameStore } from '../../store/gameStore'
import { InvestigationPanel } from './InvestigationPanel'

describe('investigation panel', () => {
  beforeEach(() => {
    localStorage.clear()
    useGameStore.setState({ ...createFreshSave(), saveStatus: 'idle', notice: null, corruptSave: false })
  })

  it('shows textual objective progress and accessible tabs', () => {
    render(<InvestigationPanel open onClose={vi.fn()} />)

    expect(screen.getByRole('dialog', { name: '深度调查' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: '调查目标' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByText('建立案件基础')).toBeInTheDocument()
    expect(screen.getAllByText('进行中').length).toBeGreaterThan(0)
  })

  it('confirms real hint cost before revealing the next tier', async () => {
    const user = userEvent.setup()
    render(<InvestigationPanel open onClose={vi.fn()} />)
    await user.click(screen.getByRole('tab', { name: '分析提示' }))

    expect(screen.getByText('剩余 3 / 3')).toBeInTheDocument()
    await user.click(screen.getAllByRole('button', { name: '使用 1 点分析' })[0]!)
    const confirmation = screen.getByRole('dialog', { name: '使用分析提示？' })
    expect(confirmation).toHaveTextContent('使用后剩余 2 点')
    await user.click(screen.getByRole('button', { name: '显示提示' }))

    expect(useGameStore.getState().hintUsage).toEqual({ 'default-hint-01': 1 })
    expect(screen.getByText('剩余 2 / 3')).toBeInTheDocument()
    expect(screen.getByText('留意「邮件」中的可验证记录。')).toBeInTheDocument()
  })

  it('shows challenge conditions without claiming they are already earned', async () => {
    const user = userEvent.setup()
    render(<InvestigationPanel open onClose={vi.fn()} />)
    await user.click(screen.getByRole('tab', { name: '调查挑战' }))

    expect(screen.getByText('独立分析')).toBeInTheDocument()
    expect(screen.getByText('未结算')).toBeInTheDocument()
    expect(screen.queryByText('已达成')).not.toBeInTheDocument()
  })
})
