import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { App } from './App'

describe('App', () => {
  it('renders the museum title', () => {
    render(<App />)
    expect(screen.getByRole('heading', { name: '遗失电脑博物馆' })).toBeInTheDocument()
  })
})

