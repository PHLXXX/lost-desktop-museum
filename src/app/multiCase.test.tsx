import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { App } from './App'

describe('multi-case museum routing', () => {
  beforeEach(() => localStorage.clear())

  it('lists both built-in cases and opens case 002 through the shared lifecycle', async () => {
    const user = userEvent.setup()
    render(<App />)
    expect(screen.getByRole('heading', { name: '没有出发的旅行' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '零点后的回声' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '查看 零点后的回声 案件简介' }))
    expect(screen.getByRole('heading', { name: '零点后的回声' })).toBeInTheDocument()
    expect(screen.getByText('林默')).toBeInTheDocument()
  })
})
