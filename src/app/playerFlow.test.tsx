import userEvent from '@testing-library/user-event'
import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { App } from './App'

describe('player shell', () => {
  beforeEach(() => localStorage.clear())

  it('boots, opens mail, discovers a clue and restores a minimized window', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: '查看案件' }))
    await user.click(screen.getByRole('button', { name: '开始调查' }))
    await user.click(screen.getByRole('button', { name: '跳过启动' }))
    await user.click(screen.getByRole('button', { name: '恢复上次会话' }))
    await user.click(screen.getByRole('button', { name: '跳过介绍' }))
    await user.dblClick(screen.getByRole('button', { name: '邮件' }))
    await user.click(screen.getByRole('button', { name: /HX217 订单取消成功/ }))
    expect(screen.getByText('1 / 12')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '最小化 邮件' }))
    expect(screen.queryByRole('heading', { name: 'HX217 订单取消成功' })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '恢复 邮件' }))
    expect(screen.getByRole('heading', { name: 'HX217 订单取消成功' })).toBeInTheDocument()
  })
})
