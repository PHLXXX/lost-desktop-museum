import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createFreshSave } from '../../engine/persistence'
import { useGameStore } from '../../store/gameStore'
import { BootScreen } from './BootScreen'

describe('BootScreen', () => {
  beforeEach(() => {
    useGameStore.setState({ ...createFreshSave('case-002'), saveStatus: 'idle', notice: null, corruptSave: false })
  })

  it('renders the active case boot message, last login and subject', () => {
    render(<BootScreen onEnter={vi.fn()} />)

    expect(screen.getByText('正在恢复广播档案终端')).toBeInTheDocument()
    expect(screen.getByText('上次登录：2032.04.09 00:17')).toBeInTheDocument()
    expect(screen.getByText('用户：林默')).toBeInTheDocument()
    expect(screen.queryByText(/ZHOU_YU|2031年11月17日/)).not.toBeInTheDocument()
  })

  it('does not describe a first launch as an unfinished session', () => {
    render(<BootScreen onEnter={vi.fn()} />)

    expect(screen.getByText('档案会话准备就绪')).toBeInTheDocument()
    expect(screen.queryByText('发现未完成会话')).not.toBeInTheDocument()
  })
})
