import { caseDefinitionSchema } from '../cases/schema'
import { supportedAppComponentKeys } from '../app/supportedAppKeys'

export interface ValidationIssue {
  id: string
  severity: 'error' | 'warning' | 'info'
  category: 'schema' | 'reference' | 'reachability' | 'resource' | 'timeline' | 'content' | 'deduction' | 'security' | 'runtime'
  code: string
  message: string
  path: string
  entityId?: string
  fixHint?: string
}

const remotePattern = /(?:https?:)?\/\//i
const unsafeMarkupPattern = /<\/?(?:script|iframe|object|embed|link|style)\b|javascript:/i
const executableKeys = new Set(['code', 'script', 'javascript', 'html', 'iframe', 'shell'])

function inspectSecurity(value: unknown, path: string, issues: ValidationIssue[]) {
  if (typeof value === 'string' && remotePattern.test(value)) {
    issues.push({ id: `security-remote-${issues.length}`, severity: 'error', category: 'security', code: 'REMOTE_RESOURCE', message: '正式案件不能引用远程资源。', path })
    return
  }
  if (typeof value === 'string' && unsafeMarkupPattern.test(value)) {
    issues.push({ id: `security-markup-${issues.length}`, severity: 'error', category: 'security', code: 'UNSAFE_MARKUP', message: '案件文本不能包含脚本、HTML嵌入或javascript协议。', path })
    return
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => inspectSecurity(item, `${path}[${index}]`, issues))
    return
  }
  if (!value || typeof value !== 'object') return
  for (const [key, child] of Object.entries(value)) {
    if (executableKeys.has(key.toLowerCase())) issues.push({ id: `security-code-${issues.length}`, severity: 'error', category: 'security', code: 'EXECUTABLE_CONTENT', message: '案件数据不能包含可执行内容。', path: `${path}.${key}` })
    inspectSecurity(child, `${path}.${key}`, issues)
  }
}

export function validateContentSecurity(input: unknown): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  inspectSecurity(input, '$', issues)
  return issues
}

export function validateCaseDefinition(input: unknown): ValidationIssue[] {
  const issues = validateContentSecurity(input)
  const parsed = caseDefinitionSchema.safeParse(input)
  if (!parsed.success) parsed.error.issues.forEach((issue, index) => issues.push({ id: `schema-${index}`, severity: 'error', category: 'schema', code: 'SCHEMA_INVALID', message: issue.message, path: issue.path.join('.') }))
  if (!parsed.success) return issues

  const definition = parsed.data
  if (definition.id !== definition.manifest.caseId) issues.push({ id: 'manifest-case-id', severity: 'error', category: 'reference', code: 'CASE_ID_MISMATCH', message: 'manifest.caseId 必须与案件 id 一致。', path: 'manifest.caseId' })
  const allIds = [
    ...definition.entities.map((item) => item.id), ...definition.files.map((item) => item.id), ...definition.chats.map((item) => item.id), ...definition.chats.flatMap((thread) => thread.messages.map((item) => item.id)),
    ...definition.emails.map((item) => item.id), ...definition.browser.map((item) => item.id), ...definition.calendar.map((item) => item.id), ...definition.photos.map((item) => item.id), ...definition.logs.map((item) => item.id), ...definition.clues.map((item) => item.id), ...definition.triggers.map((item) => item.id),
  ]
  const duplicates = allIds.filter((id, index) => allIds.indexOf(id) !== index)
  if (duplicates.length) issues.push({ id: 'duplicate-id', severity: 'error', category: 'reference', code: 'DUPLICATE_ID', message: `存在重复 ID：${[...new Set(duplicates)].join('、')}`, path: '$' })
  const clueIds = new Set(definition.clues.map((clue) => clue.id))
  const itemIds = new Set([
    ...definition.files.map((item) => item.id), ...definition.chats.flatMap((thread) => thread.messages.map((item) => item.id)), ...definition.emails.map((item) => item.id),
    ...definition.browser.map((item) => item.id), ...definition.calendar.map((item) => item.id), ...definition.photos.map((item) => item.id), ...definition.logs.map((item) => item.id),
    ...definition.audioTracks.map((item) => item.id), ...definition.broadcastEvents.map((item) => item.id), ...definition.dataTables.map((item) => item.id), ...definition.terminalEntries.map((item) => item.id), ...definition.versionDiffs.map((item) => item.id), ...definition.sitemap.map((item) => item.id),
  ])
  const inspectCondition = (condition: typeof definition.clues[number]['condition'], path: string, depth = 1): number => {
    if (depth > 5) issues.push({ id: `condition-depth-${issues.length}`, severity: 'error', category: 'reachability', code: 'CONDITION_DEPTH', message: '条件树不能超过5层。', path })
    if (condition.type === 'event' && !itemIds.has(condition.targetId)) issues.push({ id: `condition-target-${issues.length}`, severity: 'error', category: 'reference', code: 'MISSING_EVENT_TARGET', message: `事件目标 ${condition.targetId} 不存在。`, path: `${path}.targetId`, entityId: condition.targetId })
    if (condition.type === 'clue' && !clueIds.has(condition.clueId)) issues.push({ id: `condition-clue-${issues.length}`, severity: 'error', category: 'reference', code: 'MISSING_CLUE_DEPENDENCY', message: `前置线索 ${condition.clueId} 不存在。`, path: `${path}.clueId`, entityId: condition.clueId })
    if (condition.type === 'all' || condition.type === 'any') return 1 + condition.conditions.reduce((sum, child, index) => sum + inspectCondition(child, `${path}.conditions.${index}`, depth + 1), 0)
    return 1
  }
  definition.clues.forEach((clue, index) => {
    const nodeCount = inspectCondition(clue.condition, `clues.${index}.condition`)
    if (nodeCount > 30) issues.push({ id: `condition-nodes-${clue.id}`, severity: 'error', category: 'reachability', code: 'CONDITION_NODES', message: '单条线索的条件树不能超过30个节点。', path: `clues.${index}.condition`, entityId: clue.id })
    const app = definition.applications.find((candidate) => candidate.id === clue.source)
    if (!app?.enabled) issues.push({ id: `disabled-source-${clue.id}`, severity: 'warning', category: 'reachability', code: 'DISABLED_CLUE_SOURCE', message: `线索来源应用 ${clue.source} 未启用。`, path: `clues.${index}.source`, entityId: clue.id })
  })
  definition.coreEvidenceIds.forEach((id) => { if (!clueIds.has(id)) issues.push({ id: `missing-core-${id}`, severity: 'error', category: 'reference', code: 'MISSING_CLUE', message: `核心证据 ${id} 不存在。`, path: 'coreEvidenceIds', entityId: id }) })
  if (!definition.applications.some((app) => app.id === 'evidence' && app.enabled)) issues.push({ id: 'missing-evidence-app', severity: 'error', category: 'runtime', code: 'MISSING_EVIDENCE_APP', message: '案件必须启用证据板。', path: 'applications' })
  definition.applications.forEach((app, index) => { if (!supportedAppComponentKeys.has(app.componentKey)) issues.push({ id: `unsupported-app-${app.id}`, severity: 'error', category: 'runtime', code: 'UNSUPPORTED_APP_COMPONENT', message: `不支持的应用类型：${app.componentKey}。请升级引擎或改用已注册组件。`, path: `applications.${index}.componentKey`, entityId: app.id }) })
  if (!definition.manifest.builtIn && definition.questions.reduce((sum, question) => sum + question.points, 0) !== 100) issues.push({ id: 'deduction-points', severity: 'error', category: 'deduction', code: 'POINTS_NOT_100', message: '用户案件的推理题分值总计必须为100。', path: 'questions' })
  const levels = [...definition.resultLevels].sort((a, b) => a.minScore - b.minScore)
  if (levels[0]?.minScore !== 0 || levels.at(-1)?.maxScore !== 100 || levels.some((level, index) => level.minScore > level.maxScore || (index > 0 && levels[index - 1]!.maxScore + 1 !== level.minScore))) issues.push({ id: 'result-level-coverage', severity: 'error', category: 'deduction', code: 'RESULT_LEVEL_COVERAGE', message: '结果等级必须无重叠、无缺口地覆盖0至100分。', path: 'resultLevels' })
  definition.questions.forEach((question, index) => { if (!question.options.some((option) => option.id === question.correctId)) issues.push({ id: `question-answer-${question.id}`, severity: 'error', category: 'deduction', code: 'MISSING_CORRECT_OPTION', message: '推理题正确答案必须引用现有选项。', path: `questions.${index}.correctId`, entityId: question.id }) })
  if (!definition.manifest.builtIn) definition.assets.forEach((asset, index) => { if (asset.mime === 'image/svg+xml' || asset.path.toLowerCase().endsWith('.svg')) issues.push({ id: `asset-svg-${asset.id}`, severity: 'error', category: 'security', code: 'SVG_BLOCKED', message: '第三方案件包禁止SVG资源。', path: `assets.${index}`, entityId: asset.id }) })
  return issues
}
