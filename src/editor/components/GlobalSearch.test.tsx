import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createAuthoringProject } from '../model/authoringProject'
import { createMinimalTemplateDraft } from '../model/caseDraft'
import { useEditorStore } from '../store/editorStore'
import { GlobalSearch } from './GlobalSearch'

describe('GlobalSearch', () => {
  beforeEach(() => useEditorStore.setState({ currentProject: createAuthoringProject('搜索测试', createMinimalTemplateDraft()), issues: [], saveStatus: 'idle' }))

  it('finds file content and navigates to the file editor with a stable target', () => {
    const close = vi.fn()
    render(<GlobalSearch onClose={close} />)
    fireEvent.change(screen.getByPlaceholderText('ID、文件、人物、线索或正文'), { target: { value: '备用钥匙仍在' } })
    fireEvent.click(screen.getByRole('option', { name: /钥匙交接\.txt/ }))
    expect(useEditorStore.getState().currentProject?.uiState.activeSection).toBe('files')
    expect(useEditorStore.getState().currentProject?.uiState.selectedIssueId).toBe('file-handover')
    expect(close).toHaveBeenCalledOnce()
  })
})
