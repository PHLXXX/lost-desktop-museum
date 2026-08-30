import userEvent from '@testing-library/user-event'
import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { App } from './App'

describe('stage two lifecycle', () => {
  beforeEach(() => localStorage.clear())

  it('moves from museum to case detail and case boot', async () => {
    const user = userEvent.setup()
    render(<App />)
    expect(screen.getByText('遗失电脑博物馆')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '查看案件' }))
    expect(screen.getByRole('heading', { name: '没有出发的旅行' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '开始调查' }))
    expect(screen.getByText('ARCHIVE/OS 3.1')).toBeInTheDocument()
  })
})
