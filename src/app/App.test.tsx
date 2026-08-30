import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { App } from './App'

describe('App', () => {
  it('renders the museum title', () => {
    render(<App />)
    expect(screen.getByRole('heading', { name: /遗失的电脑/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '查看案件简介' })).toBeInTheDocument()
  })
})
