import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { caseDefinition as case002 } from '../../cases/case-002/case'
import { registerInstalledCase, unregisterInstalledCase } from '../../cases/registry'
import { createFreshSave } from '../../engine/persistence'
import { useGameStore } from '../../store/gameStore'
import { EvidenceBoardApp } from './EvidenceBoardApp'

describe('EvidenceBoardApp', () => {
  beforeEach(() => {
    localStorage.clear()
    useGameStore.setState({
      ...createFreshSave(),
      discoveredClueIds: ['C01'],
      saveStatus: 'idle',
      notice: null,
      corruptSave: false,
    })
  })

  afterEach(() => {
    unregisterInstalledCase('test-small-evidence')
    unregisterInstalledCase('test-no-relations')
  })

  it('stores a local note for the selected evidence', async () => {
    const user = userEvent.setup()
    render(<EvidenceBoardApp />)
    const note = screen.getByRole('textbox', { name: '线索备注' })
    await user.type(note, '核对 22:41 的取消时间')
    expect(useGameStore.getState().evidenceNotes.C01).toBe('核对 22:41 的取消时间')
  })

  it('uses active-case totals and case number throughout the evidence workspace', () => {
    useGameStore.setState({
      ...createFreshSave('case-002'),
      discoveredClueIds: case002.clues.map((clue) => clue.id),
      pinnedClueIds: ['C01'],
      saveStatus: 'idle',
      notice: null,
      corruptSave: false,
    })

    const evidence = render(<EvidenceBoardApp />)

    expect(evidence.container).toHaveTextContent('CASE 002')
    expect(evidence.container).toHaveTextContent('已发现 6 / 6')
    expect(evidence.container).toHaveTextContent('关键证据 1 / 6')
    expect(screen.getByRole('button', { name: '打开最终推理' })).toBeEnabled()
    expect(evidence.container).not.toHaveTextContent(/LD-001|\/ 12/)
  })

  it('allows a smaller valid case to reach deduction after all of its clues are found', () => {
    const definition = {
      ...structuredClone(case002),
      id: 'test-small-evidence',
      manifest: { ...structuredClone(case002.manifest), caseId: 'test-small-evidence', builtIn: false },
      clues: structuredClone(case002.clues.slice(0, 3)),
      coreEvidenceIds: case002.coreEvidenceIds.slice(0, 3),
      correctContradictions: [] as [string, string][],
    }
    registerInstalledCase(definition)
    useGameStore.setState({
      ...createFreshSave('test-small-evidence'),
      discoveredClueIds: definition.clues.map((clue) => clue.id),
      saveStatus: 'idle',
      notice: null,
      corruptSave: false,
    })

    render(<EvidenceBoardApp />)

    expect(screen.getByRole('button', { name: '打开最终推理' })).toBeEnabled()
    expect(screen.getByText('已发现 3 / 3')).toBeInTheDocument()
  })

  it('keeps deduction answers and the local note when the dialog is closed and reopened', async () => {
    const user = userEvent.setup()
    useGameStore.setState({
      ...createFreshSave('case-002'),
      discoveredClueIds: case002.clues.map((clue) => clue.id),
      pinnedClueIds: ['C01'],
      evidenceRelations: [{ id: 'relation-1', from: 'C05', to: 'C06', type: '相互矛盾' }],
      saveStatus: 'idle',
      notice: null,
      corruptSave: false,
    })
    render(<EvidenceBoardApp onDeduction={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: '打开最终推理' }))
    await user.click(screen.getByRole('radio', { name: '本地预录备份' }))
    await user.type(screen.getByRole('textbox', { name: /个人推理/ }), '声音来源与人员位置不一致。')
    await user.click(screen.getByRole('button', { name: '关闭最终推理' }))
    await user.click(screen.getByRole('button', { name: '打开最终推理' }))

    expect(screen.getByRole('radio', { name: '本地预录备份' })).toBeChecked()
    expect(screen.getByRole('textbox', { name: /个人推理/ })).toHaveValue('声音来源与人员位置不一致。')
  })

  it('restores an unfinished deduction after the evidence window is closed and reopened', async () => {
    const user = userEvent.setup()
    useGameStore.setState({
      ...createFreshSave('case-002'),
      discoveredClueIds: case002.clues.map((clue) => clue.id),
      pinnedClueIds: ['C01'],
      evidenceRelations: [{ id: 'relation-1', from: 'C05', to: 'C06', type: '相互矛盾' }],
      saveStatus: 'idle',
      notice: null,
      corruptSave: false,
    })
    const first = render(<EvidenceBoardApp />)
    await user.click(screen.getByRole('button', { name: '打开最终推理' }))
    await user.click(screen.getByRole('radio', { name: '本地预录备份' }))
    await user.type(screen.getByRole('textbox', { name: /个人推理/ }), '保留这段尚未提交的推理。')
    first.unmount()

    render(<EvidenceBoardApp />)
    await user.click(screen.getByRole('button', { name: '打开最终推理' }))

    expect(screen.getByRole('radio', { name: '本地预录备份' })).toBeChecked()
    expect(screen.getByRole('textbox', { name: /个人推理/ })).toHaveValue('保留这段尚未提交的推理。')
  })

  it('does not require a contradiction relation when the active case defines none', async () => {
    const user = userEvent.setup()
    const definition = {
      ...structuredClone(case002),
      id: 'test-no-relations',
      manifest: { ...structuredClone(case002.manifest), caseId: 'test-no-relations', builtIn: false },
      correctContradictions: [] as [string, string][],
    }
    registerInstalledCase(definition)
    useGameStore.setState({
      ...createFreshSave('test-no-relations'),
      discoveredClueIds: definition.clues.map((clue) => clue.id),
      pinnedClueIds: ['C01'],
      saveStatus: 'idle',
      notice: null,
      corruptSave: false,
    })
    render(<EvidenceBoardApp />)
    await user.click(screen.getByRole('button', { name: '打开最终推理' }))
    for (const question of definition.questions) {
      await user.click(screen.getByRole('radio', { name: question.options[0]!.label }))
    }

    expect(screen.getByText('本案无需矛盾关系')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '提交推理' })).toBeEnabled()
  })

  it('explains which evidence gate is still missing', async () => {
    const user = userEvent.setup()
    useGameStore.setState({
      ...createFreshSave('case-002'),
      discoveredClueIds: case002.clues.map((clue) => clue.id),
      saveStatus: 'idle',
      notice: null,
      corruptSave: false,
    })
    render(<EvidenceBoardApp />)
    await user.click(screen.getByRole('button', { name: '打开最终推理' }))

    expect(screen.getByText('还需至少 1 条关键证据')).toBeInTheDocument()
    expect(screen.getByText('还需至少 1 条矛盾关系')).toBeInTheDocument()
  })
})
