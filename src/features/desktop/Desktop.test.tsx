import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useGameStore } from '../../store/gameStore'
import { useWindowStore } from '../../store/windowStore'
import { Desktop } from './Desktop'

describe('stage two desktop interactions', () => {
  beforeEach(() => {
    localStorage.clear()
    useWindowStore.setState({ windows: [], activeWindowId: null })
    useGameStore.setState({ onboardingComplete: true, desktopNote: '', notice: null })
  })

  it('selects on click, opens with Enter and exposes system/context menus', async () => {
    const user = userEvent.setup(); const onReturn = vi.fn()
    render(<Desktop onReturnMuseum={onReturn} />)
    const files = screen.getByRole('button', { name: '我的文件' })
    await user.click(files)
    expect(screen.queryByRole('dialog', { name: '我的文件' })).not.toBeInTheDocument()
    await user.keyboard('{Enter}')
    expect(screen.getByRole('dialog', { name: '我的文件' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'A/OS 系统菜单' }))
    expect(screen.getByRole('menu', { name: 'A/OS 系统菜单' })).toBeInTheDocument()
    await user.keyboard('{Escape}')
    fireEvent.contextMenu(screen.getByTestId('desktop'), { clientX: 420, clientY: 300 })
    expect(screen.getByRole('menu', { name: '桌面菜单' })).toBeInTheDocument()
  })
})
