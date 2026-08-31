import type { CaseDefinition } from '../../cases/types'
import { isBuiltInCaseId } from '../../cases/builtInIds'
import { validateCaseDefinition, type ValidationIssue } from '../../engine/validation'
import type { CaseDraft } from '../model/caseDraft'
import { normalizeCaseDraft } from './normalizeCaseDraft'

export interface EditorAssetMetadata { id: string; mime: string; size: number; sha256: string }
export type CompileCaseResult = { ok: true; caseDefinition: CaseDefinition; warnings: ValidationIssue[] } | { ok: false; issues: ValidationIssue[] }

function required(value: string | undefined, path: string, label: string, issues: ValidationIssue[]): string {
  const normalized = value?.trim() ?? ''
  if (!normalized) issues.push({ id: `required-${path}`, severity: 'error', category: 'schema', code: 'REQUIRED', message: `${label}不能为空。`, path })
  return normalized
}

export function compileCaseDraft(source: CaseDraft, assets?: EditorAssetMetadata[]): CompileCaseResult {
  const draft = normalizeCaseDraft(source)
  const issues: ValidationIssue[] = []
  const caseId = required(draft.manifest.caseId, 'manifest.caseId', 'caseId', issues)
  const title = required(draft.manifest.title, 'manifest.title', '案件标题', issues)
  const author = required(draft.manifest.author, 'manifest.author', '作者', issues)
  const subtitle = required(draft.manifest.subtitle, 'manifest.subtitle', '副标题', issues)
  const summary = required(draft.manifest.summary, 'manifest.summary', '案件简介', issues)
  const archivedAt = required(draft.manifest.archivedAt, 'manifest.archivedAt', '归档时间', issues)
  const subjectName = required(draft.subject.name, 'subject.name', '电脑主人', issues)
  const occupation = required(draft.subject.occupation, 'subject.occupation', '职业', issues)
  const location = required(draft.subject.location, 'subject.location', '地点', issues)
  const lastLoginAt = required(draft.subject.lastLoginAt, 'subject.lastLoginAt', '最后登录时间', issues)
  const systemName = required(draft.desktop.systemName, 'desktop.systemName', '系统名称', issues)
  const bootMessage = required(draft.desktop.bootMessage, 'desktop.bootMessage', '启动文案', issues)
  const lastLoginMessage = required(draft.desktop.lastLoginMessage, 'desktop.lastLoginMessage', '登录文案', issues)
  const themeColor = required(draft.desktop.themeColor, 'desktop.themeColor', '主题色', issues)
  const ending = required(draft.deduction.ending, 'deduction.ending', '结局文案', issues)
  if (!draft.clues.length) issues.push({ id: 'required-clues', severity: 'error', category: 'reachability', code: 'NO_CLUES', message: '至少需要一条线索。', path: 'clues' })
  if (!draft.deduction.questions?.length) issues.push({ id: 'required-questions', severity: 'error', category: 'deduction', code: 'NO_QUESTIONS', message: '至少需要一道推理题。', path: 'deduction.questions' })
  const points = draft.deduction.questions?.reduce((sum, question) => sum + question.points, 0) ?? 0
  if (points !== 100 && draft.manifest.builtIn !== true) issues.push({ id: 'deduction-points', severity: 'error', category: 'deduction', code: 'POINTS_NOT_100', message: `推理题总分必须为100，当前为${points}。`, path: 'deduction.questions' })
  if (caseId && isBuiltInCaseId(caseId) && draft.manifest.builtIn !== true) issues.push({ id: 'built-in-case-id', severity: 'error', category: 'security', code: 'BUILT_IN_CASE_ID', message: '用户案件不能覆盖内置案件ID。', path: 'manifest.caseId' })
  const availableAssets = assets ? new Map(assets.map((asset) => [asset.id, asset])) : null
  draft.assets.forEach((asset, index) => {
    const stored = availableAssets?.get(asset.id)
    if (availableAssets && !stored) issues.push({ id: `asset-${asset.id}`, severity: 'error', category: 'resource', code: 'ASSET_MISSING', message: `资源 ${asset.id} 不存在。`, path: `assets.${index}` })
    else if (stored && (stored.mime !== asset.mime || stored.size !== asset.size || stored.sha256.toLowerCase() !== asset.sha256.toLowerCase())) issues.push({ id: `asset-integrity-${asset.id}`, severity: 'error', category: 'resource', code: 'ASSET_INTEGRITY', message: `资源 ${asset.id} 的类型、大小或哈希与草稿不一致。`, path: `assets.${index}`, entityId: asset.id })
  })
  if (issues.length) return { ok: false, issues }

  const definition: CaseDefinition = {
    formatVersion: 1,
    id: caseId,
    title,
    owner: subjectName,
    manifest: {
      caseId, version: draft.manifest.version ?? '1.0.0', title, subtitle, author,
      language: draft.manifest.language ?? 'zh-CN', summary, estimatedMinutes: draft.manifest.estimatedMinutes ?? 15, difficulty: draft.manifest.difficulty ?? '入门',
      tags: draft.manifest.tags ?? [], contentWarnings: draft.manifest.contentWarnings ?? [], builtIn: draft.manifest.builtIn ?? false, archivedAt,
    },
    subject: { name: subjectName, age: draft.subject.age, occupation, location, lastLoginAt },
    entities: structuredClone(draft.entities),
    desktop: { systemName, bootMessage, lastLoginMessage, themeColor, wallpaperAssetId: draft.desktop.wallpaperAssetId },
    applications: structuredClone(draft.applications), assets: structuredClone(draft.assets), timeline: structuredClone(draft.timeline), folders: structuredClone(draft.folders), files: structuredClone(draft.files),
    chats: structuredClone(draft.chats), emails: structuredClone(draft.emails), browser: structuredClone(draft.browserHistory), calendar: structuredClone(draft.calendarEvents), photos: structuredClone(draft.photos), logs: structuredClone(draft.systemLogs),
    audioTracks: structuredClone(draft.audioTracks), broadcastEvents: structuredClone(draft.broadcastEvents), dataTables: structuredClone(draft.dataTables), terminalEntries: structuredClone(draft.terminalEntries), versionDiffs: structuredClone(draft.versionDiffs), sitemap: structuredClone(draft.sitemap),
    clues: structuredClone(draft.clues), triggers: structuredClone(draft.triggers), questions: structuredClone(draft.deduction.questions ?? []), resultLevels: structuredClone(draft.deduction.resultLevels ?? []), coreEvidenceIds: structuredClone(draft.deduction.coreEvidenceIds ?? []), correctContradictions: structuredClone(draft.deduction.correctContradictions ?? []), ending,
  }
  const formalIssues = validateCaseDefinition(definition)
  const errors = formalIssues.filter((issue) => issue.severity === 'error')
  return errors.length ? { ok: false, issues: formalIssues } : { ok: true, caseDefinition: definition, warnings: formalIssues }
}
