import { render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createFreshSave } from '../engine/persistence'
import { useGameStore } from '../store/gameStore'
import { appComponentRegistry } from './appComponentRegistry'
import { AppContent } from './AppContent'

const originalFilesModule = appComponentRegistry.get('files')!

function BrokenApplication() {
  throw new Error('fixture application failure')
  return null
}

describe('AppContent recovery boundary', () => {
  beforeEach(() => {
    localStorage.clear()
    useGameStore.setState({ ...createFreshSave(), saveStatus: 'idle', notice: null, corruptSave: false })
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
  })

  afterEach(() => {
    appComponentRegistry.set('files', originalFilesModule)
    vi.restoreAllMocks()
  })

  it('contains an application render failure inside its window', () => {
    appComponentRegistry.set('files', { componentKey: 'files', label: '故障测试应用', render: () => <BrokenApplication /> })

    render(<AppContent appId="files" />)

    expect(screen.getByRole('heading', { name: '应用暂时无法显示' })).toBeInTheDocument()
    expect(screen.getByText(/案件数据和其他窗口没有受到影响/)).toBeInTheDocument()
    expect(screen.queryByText(/fixture application failure/)).not.toBeInTheDocument()
  })
})
