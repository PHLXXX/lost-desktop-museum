import { describe, expect, it } from 'vitest'
import { caseDefinition } from '../cases/case-001/case'
import { caseDefinitionSchema } from '../cases/schema'
import { resolveInvestigationGameplay } from './defaultGameplay'

describe('deep investigation gameplay defaults', () => {
  it('creates deterministic objectives, hints, and challenges for a legacy case', () => {
    const legacy = structuredClone(caseDefinition)
    delete legacy.gameplay
    const gameplay = resolveInvestigationGameplay(legacy)

    expect(gameplay.initialAnalysisPoints).toBe(3)
    expect(gameplay.objectives[0]).toMatchObject({ id: 'default-establish-case', kind: 'primary' })
    expect(gameplay.objectives.some((objective) => objective.id === 'default-complete-archive')).toBe(true)
    expect(gameplay.hints).toHaveLength(legacy.clues.length)
    expect(gameplay.hints[0]?.tiers).toHaveLength(3)
    expect(gameplay.challenges.map((challenge) => challenge.id)).toEqual([
      'default-independent-analysis',
      'default-complete-archive',
      'default-relation-specialist',
      'default-precise-conclusion',
    ])
    expect(gameplay.endingVariants).toEqual([])
    expect(gameplay.rewards?.map((reward) => reward.id)).toEqual(['default-case-archive', 'default-complete-record'])
  })

  it('accepts a strict authored gameplay block', () => {
    const candidate = structuredClone(caseDefinition) as typeof caseDefinition & { gameplay: unknown }
    candidate.gameplay = {
      initialAnalysisPoints: 3,
      objectives: [{
        id: 'verify-timeline',
        title: '核对时间线',
        description: '确认关键记录的先后顺序。',
        kind: 'primary',
        condition: { type: 'clue-count', count: 3 },
      }],
      hints: [{
        id: 'flight-record-hint',
        clueId: 'C01',
        label: '未解记录 01',
        tiers: [
          { id: 'direction', label: '调查方向', text: '注意出行记录。', cost: 1 },
          { id: 'action', label: '操作建议', text: '检查邮件正文。', cost: 1 },
          { id: 'location', label: '精确定位', text: '打开航班取消邮件。', cost: 1 },
        ],
      }],
      challenges: [{ id: 'complete', title: '完整归档', description: '找到全部线索。', requirements: [{ type: 'all-clues' }] }],
      endingVariants: [{ id: 'master', title: '完整还原', text: '所有记录形成了闭合轨迹。', priority: 10, requirements: [{ type: 'score-at-least', value: 90 }] }],
      rewards: [{ id: 'archive-token', kind: 'artifact', title: '结案藏品', description: '完成案件的纪念记录。', requirements: [] }],
    }

    expect(caseDefinitionSchema.safeParse(candidate).success).toBe(true)
  })

  it('rejects a reward theme outside the built-in allowlist', () => {
    const candidate = structuredClone(caseDefinition) as typeof caseDefinition & { gameplay: Record<string, unknown> }
    candidate.gameplay = {
      ...candidate.gameplay,
      rewards: [{ id: 'unsafe-theme', kind: 'theme', title: '远程主题', description: '不应被接受。', themeId: 'remote-css', requirements: [] }],
    }

    const parsed = caseDefinitionSchema.safeParse(candidate)
    expect(parsed.success).toBe(false)
    if (!parsed.success) expect(parsed.error.issues[0]?.path).toEqual(['gameplay', 'rewards', 0, 'themeId'])
  })

  it('rejects a zero-cost hint tier with its field path', () => {
    const candidate = structuredClone(caseDefinition) as typeof caseDefinition & { gameplay: unknown }
    candidate.gameplay = {
      initialAnalysisPoints: 3,
      objectives: [],
      hints: [{
        id: 'invalid-hint', clueId: 'C01', label: '无效提示',
        tiers: [
          { id: 'direction', label: '调查方向', text: '提示。', cost: 0 },
          { id: 'action', label: '操作建议', text: '提示。', cost: 1 },
          { id: 'location', label: '精确定位', text: '提示。', cost: 1 },
        ],
      }],
      challenges: [],
      endingVariants: [],
    }

    const result = caseDefinitionSchema.safeParse(candidate)
    expect(result.success).toBe(false)
    if (!result.success) expect(result.error.issues[0]?.path).toEqual(['gameplay', 'hints', 0, 'tiers', 0, 'cost'])
  })
})
