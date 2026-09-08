import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { caseDefinition as case002 } from '../../cases/case-002/case'
import { caseDefinition as case003 } from '../../cases/case-003/case'
import { registerInstalledCase, unregisterInstalledCase } from '../../cases/registry'
import { createFreshSave } from '../../engine/persistence'
import { resolveInvestigationGameplay } from '../../gameplay/defaultGameplay'
import { useGameStore } from '../../store/gameStore'
import { ResultScreen } from './ResultScreen'

describe('ResultScreen', () => {
  beforeEach(() => {
    localStorage.clear()
    useGameStore.setState({
      ...createFreshSave('case-002'),
      discoveredClueIds: case002.clues.map((clue) => clue.id),
      pinnedClueIds: ['C01'],
      evidenceRelations: case002.correctContradictions.map(([from, to], index) => ({ id: `relation-${index}`, from, to, type: '相互矛盾' as const })),
      hintUsage: { 'unsigned-script-hint': 1 },
      playTime: 372,
      deductionResult: { score: 75, level: '节目源已定位', answerScore: 65, evidenceScore: 5, relationScore: 5, note: '人员轨迹与节目源分离。', challengeIds: ['complete-broadcast-log'] },
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
    expect(result.container).toHaveTextContent('目标完成 5 / 5')
    expect(result.container).toHaveTextContent(`本次挑战 1 / ${resolveInvestigationGameplay(case002).challenges.length}`)
    expect(result.container).toHaveTextContent('使用提示 1 层')
    expect(result.container).toHaveTextContent('调查用时 06:12')
  })

  it('renders the ending variant persisted with the deduction result', () => {
    const caseId = 'case-result-variant-test'
    const definition = {
      ...structuredClone(case002),
      id: caseId,
      title: '结局分支测试',
      manifest: { ...structuredClone(case002.manifest), caseId, title: '结局分支测试', builtIn: false },
      gameplay: {
        ...resolveInvestigationGameplay(case002),
        endingVariants: [{ id: 'ending-precise', title: '精确结论', text: '你保留了广播与人员轨迹之间的关键边界。', priority: 10, requirements: [{ type: 'score-at-least' as const, value: 70 }] }],
      },
    }
    registerInstalledCase(definition)
    useGameStore.setState({
      ...createFreshSave(caseId),
      deductionResult: { score: 75, level: '节目源已定位', answerScore: 65, evidenceScore: 5, relationScore: 5, note: '', endingVariantId: 'ending-precise', challengeIds: [] },
      saveStatus: 'idle',
      notice: null,
      corruptSave: false,
    })

    try {
      render(<ResultScreen onReturnMuseum={vi.fn()} onReviewEvidence={vi.fn()} />)
      expect(screen.getByText('精确结论')).toBeInTheDocument()
      expect(screen.getByText('你保留了广播与人员轨迹之间的关键边界。')).toBeInTheDocument()
    } finally {
      unregisterInstalledCase(caseId)
    }
  })

  it('distinguishes a newly unlocked reward from an existing collectible', () => {
    useGameStore.setState({
      deductionResult: {
        ...useGameStore.getState().deductionResult!,
        rewardIds: ['final-program-sheet', 'complete-broadcast-record'],
        newRewardKeys: ['case-002:final-program-sheet'],
      },
    })

    render(<ResultScreen onReturnMuseum={vi.fn()} onReviewEvidence={vi.fn()} />)

    expect(screen.getByRole('heading', { name: '本次通关奖励' })).toBeInTheDocument()
    expect(screen.getByText('首次解锁')).toBeInTheDocument()
    expect(screen.getByText('已收藏')).toBeInTheDocument()
  })

  it('renders case 003 identity, complete archive and earned artifact', () => {
    useGameStore.setState({
      ...createFreshSave('case-003'),
      discoveredClueIds: case003.clues.map((clue) => clue.id),
      pinnedClueIds: case003.coreEvidenceIds,
      evidenceRelations: case003.correctContradictions.map(([from, to], index) => ({ id: `case-003-result-relation-${index}`, from, to, type: '相互矛盾' as const })),
      deductionResult: {
        score: 100,
        level: '馆藏链已还原',
        answerScore: 65,
        evidenceScore: 30,
        relationScore: 5,
        note: '数字操作链与实物搬运责任分开陈述。',
        rewardIds: ['double-layer-accession-tag'],
        newRewardKeys: ['case-003:double-layer-accession-tag'],
      },
      saveStatus: 'idle',
      notice: null,
      corruptSave: false,
    })

    const result = render(<ResultScreen onReturnMuseum={vi.fn()} onReviewEvidence={vi.fn()} />)

    expect(result.container).toHaveTextContent('CASE 003 / LOCAL RESULT')
    expect(result.container).toHaveTextContent('已发现 10/10 条线索')
    expect(result.container).toHaveTextContent('馆藏链已还原')
    expect(screen.getByText('双层藏品标签')).toBeInTheDocument()
  })
})
