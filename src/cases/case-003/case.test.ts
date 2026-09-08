import { describe, expect, it } from 'vitest'
import { validateCaseDefinition } from '../../engine/validation'
import { createFreshSave } from '../../engine/persistence'
import { evaluateRewards } from '../../gameplay/rewardEngine'
import { caseDefinition } from './case'

describe('case 003 编号之外', () => {
  it('ships as a complete and strictly valid built-in case', () => {
    expect(caseDefinition.id).toBe('case-003')
    expect(caseDefinition.title).toBe('编号之外')
    expect(caseDefinition.manifest.subtitle).toBe('被改写的第七百三十一号藏品')
    expect(caseDefinition.manifest.difficulty).toBe('普通')
    expect(caseDefinition.manifest.estimatedMinutes).toBe(25)
    expect(caseDefinition.assets[0]?.mime).toBe('image/svg+xml')
    expect(caseDefinition.assets[0]?.path).toMatch(/^(?:data:image\/svg\+xml|.*accession-vault\.svg$)/)
    expect(validateCaseDefinition(caseDefinition).filter((issue) => issue.severity === 'error')).toEqual([])
  })

  it('defines ten unique clues across ten investigation sources', () => {
    expect(caseDefinition.clues).toHaveLength(10)
    expect(new Set(caseDefinition.clues.map((clue) => clue.id)).size).toBe(10)
    expect(new Set(caseDefinition.clues.map((clue) => clue.source))).toEqual(new Set([
      'files', 'versions', 'data', 'logs', 'messages', 'mail', 'calendar', 'photos', 'sitemap', 'terminal',
    ]))
    expect(caseDefinition.clues.map((clue) => [clue.id, clue.discovery.type, clue.discovery.itemId])).toEqual([
      ['C01', 'OPEN_ITEM', 'file-seal-list'],
      ['C02', 'VIEW_VERSION_DIFF', 'version-a731'],
      ['C03', 'OPEN_ITEM', 'data-label-jobs'],
      ['C04', 'VIEW_LOG', 'log-qiaowen-auth'],
      ['C05', 'OPEN_ITEM', 'message-old-pass'],
      ['C06', 'OPEN_ITEM', 'mail-transfer-draft'],
      ['C07', 'OPEN_ITEM', 'calendar-no-transfer'],
      ['C08', 'VIEW_METADATA', 'photo-label-overlay'],
      ['C09', 'VIEW_MAP_LOCATION', 'site-east-lift'],
      ['C10', 'RUN_COMMAND', 'terminal-print-queue'],
    ])
  })

  it('keeps every clue action attached to an existing interactive record', () => {
    const itemIds = new Set([
      ...caseDefinition.files.map((item) => item.id),
      ...caseDefinition.chats.flatMap((thread) => thread.messages.map((item) => item.id)),
      ...caseDefinition.emails.map((item) => item.id),
      ...caseDefinition.browser.map((item) => item.id),
      ...caseDefinition.calendar.map((item) => item.id),
      ...caseDefinition.photos.map((item) => item.id),
      ...caseDefinition.logs.map((item) => item.id),
      ...caseDefinition.audioTracks.map((item) => item.id),
      ...caseDefinition.broadcastEvents.map((item) => item.id),
      ...caseDefinition.dataTables.map((item) => item.id),
      ...caseDefinition.terminalEntries.map((item) => item.id),
      ...caseDefinition.versionDiffs.map((item) => item.id),
      ...caseDefinition.sitemap.map((item) => item.id),
    ])

    expect(caseDefinition.clues.every((clue) => itemIds.has(clue.discovery.itemId))).toBe(true)
  })

  it('provides complete deductions, relations and deep-investigation content', () => {
    expect(caseDefinition.questions.map((question) => question.correctId)).toEqual(['original-as-replica', 'leave-as-replica', 'digital-chain-only'])
    expect(caseDefinition.resultLevels).toEqual([
      expect.objectContaining({ id: 'catalog-low', minScore: 0, maxScore: 49 }),
      expect.objectContaining({ id: 'catalog-mid', minScore: 50, maxScore: 84 }),
      expect.objectContaining({ id: 'catalog-high', minScore: 85, maxScore: 100 }),
    ])
    expect(caseDefinition.correctContradictions).toEqual([['C01', 'C02'], ['C06', 'C07']])
    expect(caseDefinition.gameplay?.objectives).toHaveLength(5)
    expect(caseDefinition.gameplay?.hints).toHaveLength(10)
    expect(caseDefinition.gameplay?.hints.every((hint) => hint.tiers.length === 3)).toBe(true)
    expect(caseDefinition.gameplay?.challenges).toHaveLength(5)
    expect(caseDefinition.gameplay?.endingVariants).toHaveLength(2)
  })

  it('awards one completion artifact and two earned badges', () => {
    const save = {
      ...createFreshSave('case-003'),
      discoveredClueIds: caseDefinition.clues.map((clue) => clue.id),
      evidenceRelations: caseDefinition.correctContradictions.map(([from, to], index) => ({ id: `relation-${index}`, from, to, type: '相互矛盾' as const })),
    }
    const result = { score: 100, level: '馆藏链已还原', answerScore: 65, evidenceScore: 30, relationScore: 5, note: '' }

    expect(evaluateRewards(caseDefinition, save, result).map((reward) => reward.id)).toEqual([
      'double-layer-accession-tag',
      'catalog-auditor',
      'silent-reconciliation',
    ])
  })
})
