import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { caseDefinition as case002 } from '../../cases/case-002/case'
import { createFreshSave } from '../../engine/persistence'
import { useGameStore } from '../../store/gameStore'
import { ResultScreen } from './ResultScreen'

describe('ResultScreen', () => {
  beforeEach(() => {
    localStorage.clear()
    useGameStore.setState({
      ...createFreshSave('case-002'),
      discoveredClueIds: case002.clues.map((clue) => clue.id),
      pinnedClueIds: ['C01'],
      deductionResult: { score: 75, level: '节目源已定位', answerScore: 65, evidenceScore: 5, relationScore: 5, note: '人员轨迹与节目源分离。' },
      saveStatus: 'idle',
      notice: null,
      corruptSave: false,
    })
  })

  it('renders the active case identity, totals, score and ending without first-case residue', () => {
    const result = render(<ResultScreen onReturnMuseum={vi.fn()} onReviewEvidence={vi.fn()} />)

    expect(result.container).toHaveTextContent('CASE 002 / LOCAL RESULT')
    expect(result.container).toHaveTextContent('已发现 6/6 条线索')
    expect(result.container).toHaveTextContent('核心判断 65/65')
    expect(result.container).toHaveTextContent(case002.ending)
    expect(result.container).not.toHaveTextContent(/LD-001|LINRAN|\/12/)
    expect(screen.getByText('人员轨迹与节目源分离。')).toBeInTheDocument()
  })
})
