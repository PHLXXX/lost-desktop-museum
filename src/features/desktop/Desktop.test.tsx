import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useGameStore } from '../../store/gameStore'
import { useWindowStore } from '../../store/windowStore'
import { createFreshSave } from '../../engine/persistence'
import { Desktop } from './Desktop'

const originalSaveNow = useGameStore.getState().saveNow

describe('stage two desktop interactions', () => {
  beforeEach(() => {
    localStorage.clear()
    useWindowStore.setState({ windows: [], activeWindowId: null })
    useGameStore.setState({ ...createFreshSave(), onboardingComplete: true, notice: null, saveStatus: 'idle', corruptSave: false, saveNow: originalSaveNow })
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
    expect(screen.getByRole('menuitem', { name: '查看' })).toHaveFocus()
  })

  it('closes an open application without restoring it from the saved snapshot', async () => {
    const user = userEvent.setup()
    render(<Desktop onReturnMuseum={vi.fn()} />)

    await user.dblClick(screen.getByRole('button', { name: '我的文件' }))
    expect(screen.getByRole('dialog', { name: '我的文件' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '关闭 我的文件' }))

    expect(screen.queryByRole('dialog', { name: '我的文件' })).not.toBeInTheDocument()
    expect(useWindowStore.getState().windows).toEqual([])
    expect(useGameStore.getState().currentWindows).toEqual([])
  })

  it('opens and closes the system menu with Escape and exposes every safe exit action', async () => {
    const user = userEvent.setup()
    render(<Desktop onReturnMuseum={vi.fn()} />)

    await user.keyboard('{Escape}')
    const menu = screen.getByRole('menu', { name: 'A/OS 系统菜单' })
    expect(menu).toBeInTheDocument()
    for (const label of ['继续调查', '保存进度', '保存并返回档案馆', '重新开始本案', '操作说明', '系统设置', '退出全屏', '取消']) {
      expect(screen.getByRole('menuitem', { name: new RegExp(label) })).toBeInTheDocument()
    }

    await user.keyboard('{Escape}')
    expect(screen.queryByRole('menu', { name: 'A/OS 系统菜单' })).not.toBeInTheDocument()
  })

  it('supports immediate save and deleting the player note from the keyboard', async () => {
    const user = userEvent.setup()
    const saveNow = vi.fn()
    useGameStore.setState({ desktopNote: '待验证：房东消息', saveNow })
    render(<Desktop onReturnMuseum={vi.fn()} />)

    await user.keyboard('{Control>}s{/Control}')
    expect(saveNow).toHaveBeenCalledTimes(1)
    await user.keyboard('{Delete}')
    expect(useGameStore.getState().desktopNote).toBe('')
    expect(screen.queryByRole('textbox', { name: '临时便笺内容' })).not.toBeInTheDocument()
  })

  it('clears live windows on confirmed restart while preserving global settings', async () => {
    const user = userEvent.setup()
    useGameStore.setState({ discoveredClueIds: ['C01'], settings: { ...createFreshSave().settings, sound: false } })
    useWindowStore.getState().openWindow('mail')
    render(<Desktop onReturnMuseum={vi.fn()} />)

    await user.keyboard('{Escape}')
    await user.click(screen.getByRole('menuitem', { name: /重新开始本案/ }))
    expect(screen.getByRole('dialog', { name: '重新开始调查？' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '清除进度并重新开始' }))

    expect(useWindowStore.getState().windows).toEqual([])
    expect(useGameStore.getState().discoveredClueIds).toEqual([])
    expect(useGameStore.getState().settings.sound).toBe(false)
  })

  it('flushes the current investigation snapshot when the page is hidden', () => {
    useGameStore.setState({ discoveredClueIds: ['C01'] })
    render(<Desktop onReturnMuseum={vi.fn()} />)
    window.dispatchEvent(new Event('pagehide'))
    expect(JSON.parse(localStorage.getItem('archive-os:case-001') ?? '{}').discoveredClueIds).toEqual(['C01'])
  })

  it('lets Escape dismiss the top onboarding dialog before opening the system menu', async () => {
    const user = userEvent.setup()
    useGameStore.setState({ onboardingComplete: false })
    render(<Desktop onReturnMuseum={vi.fn()} />)
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog', { name: '调查操作介绍' })).not.toBeInTheDocument()
    expect(screen.queryByRole('menu', { name: 'A/OS 系统菜单' })).not.toBeInTheDocument()
  })

  it('disables visual anomaly classes and scanlines in safe mode', () => {
    useGameStore.setState({
      triggeredEventIds: ['event-identity'],
      settings: { ...createFreshSave().settings, safeMode: true, anomalies: false, scanlines: 0.3 },
    })
    render(<Desktop onReturnMuseum={vi.fn()} />)
    const desktop = screen.getByTestId('desktop')
    expect(desktop).not.toHaveClass('anomalies')
    expect(desktop).toHaveStyle({ '--scanline': '0' })
    expect(screen.getAllByText('23:48').length).toBeGreaterThan(0)
  })

  it('labels clue feedback as a compact evidence notification', () => {
    useGameStore.setState({ discoveredClueIds: ['C01'], notice: '发现线索：被取消的航班' })
    render(<Desktop onReturnMuseum={vi.fn()} />)
    expect(screen.getByRole('status', { name: '线索通知' })).toHaveTextContent('新证据已记录')
    expect(screen.getByRole('status', { name: '线索通知' })).toHaveTextContent('被取消的航班')
  })

  it('uses the active case identity in the desktop status and system menu', async () => {
    const user = userEvent.setup()
    useGameStore.setState({ ...createFreshSave('case-002'), onboardingComplete: true, notice: null, saveStatus: 'idle', corruptSave: false })

    const desktop = render(<Desktop onReturnMuseum={vi.fn()} />)

    expect(desktop.container).toHaveTextContent('2032.04.09')
    expect(screen.getByText('00:17', { selector: '.taskbar-clock' })).toBeInTheDocument()
    expect(desktop.container).not.toHaveTextContent('2031.11.17')
    await user.click(screen.getByRole('button', { name: 'A/OS 系统菜单' }))
    expect(screen.getByRole('menu', { name: 'A/OS 系统菜单' })).toHaveTextContent('案件快照 002')
    expect(screen.getByRole('menu', { name: 'A/OS 系统菜单' })).not.toHaveTextContent('LD-001')
  })
})
