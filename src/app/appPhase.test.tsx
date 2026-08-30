import userEvent from '@testing-library/user-event'
import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createFreshSave } from '../engine/persistence'
import { useGameStore } from '../store/gameStore'
import { App } from './App'

describe('stage two lifecycle', () => {
  beforeEach(() => {
    localStorage.clear()
    useGameStore.setState({ ...createFreshSave(), saveStatus: 'idle', notice: null, corruptSave: false })
  })

  it('moves from museum to case detail and case boot', async () => {
    const user = userEvent.setup()
    render(<App />)
    expect(screen.getByText('遗失电脑博物馆')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '查看案件简介' }))
    expect(screen.getByRole('heading', { name: '没有出发的旅行' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '开始调查' }))
    expect(screen.getByText('ARCHIVE/OS 3.1')).toBeInTheDocument()
  })

  it('continues an existing investigation without replaying boot', async () => {
    const user = userEvent.setup()
    useGameStore.setState({ discoveredClueIds: ['C01'], playTime: 125 })
    render(<App />)

    await user.click(screen.getByRole('button', { name: '继续调查' }))

    expect(screen.getByTestId('desktop')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: '遗失电脑博物馆' })).not.toBeInTheDocument()
  })

  it('shows progress metrics and museum actions without browser alert', async () => {
    const user = userEvent.setup()
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => undefined)
    useGameStore.setState({
      discoveredClueIds: ['C01', 'C02', 'C03'],
      playTime: 125,
      deductionResult: { score: 88, level: '接近真相', answerScore: 50, evidenceScore: 28, relationScore: 10, note: '' },
    })
    render(<App />)

    expect(screen.getByText('25%')).toBeInTheDocument()
    expect(screen.getByText('02:05')).toBeInTheDocument()
    expect(screen.getAllByText('已完成')).toHaveLength(2)
    expect(screen.getByText('88')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '设置' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '制作人员' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '关于本馆' }))
    expect(screen.getByRole('dialog', { name: '关于本馆' })).toBeInTheDocument()
    expect(alertSpy).not.toHaveBeenCalled()
    alertSpy.mockRestore()
  })

  it('uses an in-app confirmation before restarting from case detail', async () => {
    const user = userEvent.setup()
    const confirmSpy = vi.spyOn(window, 'confirm').mockImplementation(() => true)
    useGameStore.setState({ discoveredClueIds: ['C01'] })
    render(<App />)

    await user.click(screen.getByRole('button', { name: '查看案件简介' }))
    await user.click(screen.getByRole('button', { name: '重新调查' }))

    expect(screen.getByRole('dialog', { name: '重新开始调查？' })).toBeInTheDocument()
    expect(screen.getByText(/线索、窗口位置、解锁内容和证据关系都会被清除/)).toBeInTheDocument()
    expect(confirmSpy).not.toHaveBeenCalled()
    confirmSpy.mockRestore()
  })

  it('shows recoverable corrupt-save guidance on the museum home', () => {
    useGameStore.setState({ corruptSave: true, notice: '检测到无法读取的存档，原始数据已备份；你可以开始新的调查。' })
    render(<App />)
    expect(screen.getByRole('status', { name: '存档恢复提示' })).toHaveTextContent('原始数据已备份')
    expect(screen.getByRole('button', { name: '开始调查' })).toBeInTheDocument()
  })
})
