import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { AppShell } from '../../app/AppShell'
import { useEditorStore } from '../store/editorStore'

describe('Archive Workshop entry and authoring flow', () => {
  beforeEach(() => useEditorStore.setState({ projects: [], currentProject: null, issues: [], saveStatus: 'idle' }))

  it('enters the lazy workshop, creates a template and returns to the museum', async () => {
    render(<AppShell />)
    fireEvent.click(screen.getByRole('button', { name: '档案工坊' }))
    expect(await screen.findByRole('heading', { name: '档案工坊' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '创建案件工程' }))
    fireEvent.click(screen.getByLabelText('最小可玩模板'))
    fireEvent.click(screen.getByRole('button', { name: '下一步' }))
    fireEvent.change(screen.getByLabelText('工程名称'), { target: { value: '备用钥匙教学工程' } })
    fireEvent.click(screen.getByRole('button', { name: '下一步' }))
    fireEvent.click(screen.getByRole('button', { name: '下一步' }))
    fireEvent.click(screen.getByRole('button', { name: '创建并打开' }))
    expect(await screen.findByText('档案工坊 / AUTHORING MODE')).toBeInTheDocument()
    expect(screen.getByDisplayValue('消失的备用钥匙')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '返回工程列表' }))
    expect(await screen.findByText('备用钥匙教学工程')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '返回档案馆' }))
    expect(await screen.findByRole('heading', { name: /遗失的电脑/ })).toBeInTheDocument()
  })

  it('validates a blank project and navigates an issue to the title field', async () => {
    render(<AppShell />)
    fireEvent.click(screen.getByRole('button', { name: '档案工坊' }))
    fireEvent.click(await screen.findByRole('button', { name: '创建案件工程' }))
    fireEvent.click(screen.getByLabelText('空白工程'))
    fireEvent.click(screen.getByRole('button', { name: '下一步' }))
    fireEvent.change(screen.getByLabelText('案件名称'), { target: { value: '' } })
    fireEvent.click(screen.getByRole('button', { name: '下一步' }))
    fireEvent.click(screen.getByRole('button', { name: '下一步' }))
    fireEvent.click(screen.getByRole('button', { name: '创建并打开' }))
    fireEvent.click(await screen.findByRole('button', { name: '运行校验' }))
    await waitFor(() => expect(screen.getByText('案件标题不能为空。')).toBeInTheDocument())
    fireEvent.click(screen.getByText('案件标题不能为空。'))
    await waitFor(() => expect(screen.getByLabelText('案件标题')).toHaveFocus())
  })
})
