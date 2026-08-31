import { caseDefinitionSchema } from '../cases/schema'

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

const remotePattern = /^(?:https?:)?\/\//i
const executableKeys = new Set(['code', 'script', 'javascript', 'html', 'iframe', 'shell', 'command'])

function inspectSecurity(value: unknown, path: string, issues: ValidationIssue[]) {
  if (typeof value === 'string' && remotePattern.test(value)) {
    issues.push({ id: `security-remote-${issues.length}`, severity: 'error', category: 'security', code: 'REMOTE_RESOURCE', message: '正式案件不能引用远程资源。', path })
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

export function validateCaseDefinition(input: unknown): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  const parsed = caseDefinitionSchema.safeParse(input)
  if (!parsed.success) parsed.error.issues.forEach((issue, index) => issues.push({ id: `schema-${index}`, severity: 'error', category: 'schema', code: 'SCHEMA_INVALID', message: issue.message, path: issue.path.join('.') }))
  inspectSecurity(input, '$', issues)
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
  definition.coreEvidenceIds.forEach((id) => { if (!clueIds.has(id)) issues.push({ id: `missing-core-${id}`, severity: 'error', category: 'reference', code: 'MISSING_CLUE', message: `核心证据 ${id} 不存在。`, path: 'coreEvidenceIds', entityId: id }) })
  if (!definition.applications.some((app) => app.id === 'evidence' && app.enabled)) issues.push({ id: 'missing-evidence-app', severity: 'error', category: 'runtime', code: 'MISSING_EVIDENCE_APP', message: '案件必须启用证据板。', path: 'applications' })
  return issues
}

