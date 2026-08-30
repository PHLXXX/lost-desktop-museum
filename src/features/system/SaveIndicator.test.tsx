import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { useGameStore } from '../../store/gameStore'
import { SaveIndicator } from './SaveIndicator'

describe('save indicator', () => {
  it.each([['saving', '正在保存…'], ['saved', '已保存'], ['error', '保存失败']] as const)('renders %s state', (saveStatus, label) => {
    useGameStore.setState({ saveStatus })
    render(<SaveIndicator />)
    expect(screen.getByRole('status')).toHaveTextContent(label)
  })
})
