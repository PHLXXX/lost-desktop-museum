import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { EditorSidebar } from '../../components/EditorSidebar'
import { createAuthoringProject } from '../../model/authoringProject'
import { createMinimalTemplateDraft } from '../../model/caseDraft'
import { useEditorStore } from '../../store/editorStore'
import { GameplayEditor } from './GameplayEditor'

describe('GameplayEditor', () => {
  beforeEach(() => {
    const project = createAuthoringProject('玩法设计测试', createMinimalTemplateDraft())
    project.draft.gameplay = undefined
    useEditorStore.setState({
      currentProject: project,
      issues: [],
      saveStatus: 'idle',
      readOnly: false,
    })
  })

  it('is reachable from the logic navigation', async () => {
    const user = userEvent.setup()
    render(<EditorSidebar />)

    await user.click(screen.getByRole('button', { name: '玩法设计' }))

    expect(useEditorStore.getState().currentProject?.uiState.activeSection).toBe('gameplay')
  })

  it('enables custom gameplay and creates an objective with a real condition', async () => {
    const user = userEvent.setup()
    render(<GameplayEditor />)

    await user.click(screen.getByRole('checkbox', { name: '启用自定义玩法' }))
    const before = useEditorStore.getState().currentProject!.draft.gameplay!.objectives.length
    await user.click(screen.getByRole('button', { name: '新建目标' }))

    const gameplay = useEditorStore.getState().currentProject!.draft.gameplay!
    expect(gameplay.objectives).toHaveLength(before + 1)
    expect(gameplay.objectives.at(-1)?.condition).toEqual({ type: 'clue-count', count: 1 })
    expect(screen.getByLabelText('条件类型 第1层')).toBeInTheDocument()
  })

  it('edits hint clue selection, challenge thresholds, and ending priority', async () => {
    const user = userEvent.setup()
    render(<GameplayEditor />)
    await user.click(screen.getByRole('checkbox', { name: '启用自定义玩法' }))

    await user.click(screen.getByRole('tab', { name: '分析提示' }))
    await user.click(screen.getByRole('button', { name: '新建提示' }))
    await user.selectOptions(screen.getByLabelText('提示线索'), 'clue-cleaning')
    expect(useEditorStore.getState().currentProject!.draft.gameplay!.hints.at(-1)?.clueId).toBe('clue-cleaning')

    await user.click(screen.getByRole('tab', { name: '挑战与结局' }))
    await user.click(screen.getByRole('button', { name: '新建挑战' }))
    await user.selectOptions(screen.getByLabelText('挑战要求 1'), 'score-at-least')
    await user.clear(screen.getByLabelText('挑战阈值 1'))
    await user.type(screen.getByLabelText('挑战阈值 1'), '88')
    expect(useEditorStore.getState().currentProject!.draft.gameplay!.challenges.at(-1)?.requirements[0]).toEqual({ type: 'score-at-least', value: 88 })

    await user.click(screen.getByRole('button', { name: '新建结局分支' }))
    await user.clear(screen.getByLabelText('结局优先级'))
    await user.type(screen.getByLabelText('结局优先级'), '25')
    expect(useEditorStore.getState().currentProject!.draft.gameplay!.endingVariants.at(-1)?.priority).toBe(25)
  })
})
