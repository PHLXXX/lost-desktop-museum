import type {
  AppId,
  CaseDefinition,
  ClueDefinition,
  InvestigationGameplayDefinition,
  InvestigationHintDefinition,
} from '../cases/types'

const appLabels: Record<AppId, string> = {
  files: '文件管理器', messages: '讯息', mail: '邮件', photos: '照片', browser: '浏览记录', calendar: '日历', recycle: '回收站', logs: '系统日志',
  audio: '音频工作台', broadcast: '广播控制台', data: '数据台', terminal: '模拟终端', versions: '版本差异', sitemap: '站点地图', evidence: '证据板', settings: '设置',
}

const actionLabels: Record<ClueDefinition['discovery']['type'], string> = {
  OPEN_ITEM: '打开记录并阅读完整内容',
  VIEW_METADATA: '查看记录的属性或元数据',
  COMPARE_ITEMS: '对照两项记录的差异',
  VIEW_TRANSCRIPT: '查看转写内容',
  UNLOCK_ITEM: '寻找信息并解锁受保护内容',
  VIEW_LOG: '打开日志行的详细信息',
}

function resolveTargetLabel(definition: CaseDefinition, targetId: string): string {
  const file = definition.files.find((item) => item.id === targetId)
  if (file) return file.name
  for (const thread of definition.chats) {
    const message = thread.messages.find((item) => item.id === targetId)
    if (message) return `与${thread.title}的 ${message.time} 消息`
  }
  return definition.emails.find((item) => item.id === targetId)?.subject
    ?? definition.browser.find((item) => item.id === targetId)?.title
    ?? definition.calendar.find((item) => item.id === targetId)?.title
    ?? definition.photos.find((item) => item.id === targetId)?.title
    ?? definition.logs.find((item) => item.id === targetId)?.eventType
    ?? definition.audioTracks.find((item) => item.id === targetId)?.title
    ?? definition.broadcastEvents.find((item) => item.id === targetId)?.title
    ?? definition.dataTables.find((item) => item.id === targetId)?.title
    ?? definition.versionDiffs.find((item) => item.id === targetId)?.title
    ?? definition.sitemap.find((item) => item.id === targetId)?.label
    ?? '对应记录'
}

function createDefaultHint(definition: CaseDefinition, clue: ClueDefinition, index: number): InvestigationHintDefinition {
  const target = resolveTargetLabel(definition, clue.discovery.itemId)
  return {
    id: `default-hint-${String(index + 1).padStart(2, '0')}`,
    clueId: clue.id,
    label: `未解记录 ${String(index + 1).padStart(2, '0')}`,
    tiers: [
      { id: 'direction', label: '调查方向', text: `留意「${appLabels[clue.source]}」中的可验证记录。`, cost: 1 },
      { id: 'action', label: '操作建议', text: actionLabels[clue.discovery.type], cost: 1 },
      { id: 'location', label: '精确定位', text: `检查「${target}」。`, cost: 1 },
    ],
  }
}

export function resolveInvestigationGameplay(definition: CaseDefinition): InvestigationGameplayDefinition {
  if (definition.gameplay) return definition.gameplay
  const clueThreshold = Math.min(6, definition.clues.length)
  const relationConditions = definition.correctContradictions.map(([from, to]) => ({ type: 'relation' as const, from, to, relationType: '相互矛盾' as const }))
  return {
    initialAnalysisPoints: 3,
    objectives: [
      { id: 'default-establish-case', title: '建立案件基础', description: `记录至少 ${clueThreshold} 条可验证线索。`, kind: 'primary', condition: { type: 'clue-count', count: clueThreshold } },
      { id: 'default-complete-archive', title: '完整归档', description: '找出档案中全部可记录线索。', kind: 'optional', condition: { type: 'clue-count', count: definition.clues.length } },
      ...(relationConditions.length ? [{
        id: 'default-verify-relations', title: '验证关键矛盾', description: '在证据板上建立全部关键矛盾关系。', kind: 'optional' as const,
        condition: relationConditions.length === 1 ? relationConditions[0]! : { type: 'all' as const, conditions: relationConditions },
      }] : []),
    ],
    hints: definition.clues.map((clue, index) => createDefaultHint(definition, clue, index)),
    challenges: [
      { id: 'default-independent-analysis', title: '独立分析', description: '不使用分析提示完成推理。', requirements: [{ type: 'no-hints' }] },
      { id: 'default-complete-archive', title: '完整归档', description: '发现案件中的全部线索。', requirements: [{ type: 'all-clues' }] },
      ...(relationConditions.length ? [{ id: 'default-relation-specialist', title: '关系专家', description: '建立全部关键矛盾关系。', requirements: [{ type: 'relation-count-at-least' as const, value: relationConditions.length }] }] : []),
      { id: 'default-precise-conclusion', title: '精准结案', description: '推理可信度达到 90 分。', requirements: [{ type: 'score-at-least', value: 90 }] },
    ],
    endingVariants: [],
  }
}

