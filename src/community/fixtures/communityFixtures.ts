import { compileCaseDraft } from '../../editor/compiler/compileCaseDraft'
import { createMinimalTemplateDraft } from '../../editor/model/caseDraft'
import { exportCasePackage } from '../../packages/casePackage'

async function buildVersion(version: '1.0.0' | '1.1.0' | '2.0.0') {
  const draft = createMinimalTemplateDraft()
  draft.manifest.caseId = 'case-community-sample-001'
  draft.manifest.version = version
  draft.manifest.author = 'ldm-team'
  draft.manifest.title = '消失的备用钥匙'
  draft.manifest.subtitle = 'The Missing Spare Key'
  draft.manifest.tags = ['教学案件', '办公室', '时间线', '文件记录', '适合新手']
  draft.manifest.estimatedMinutes = 15
  draft.manifest.archivedAt = '2026-08-31T00:00:00.000Z'
  draft.assets = []
  delete draft.desktop.wallpaperAssetId
  if (version === '1.1.0') {
    draft.manifest.summary = '修订后的教学案件，补充了交接记录说明并保持1.0.0进度兼容。'
    draft.files[0]!.content += '\n版本1.1补充：记录由值班主管复核。'
  }
  if (version === '2.0.0') {
    draft.manifest.summary = '结构重排测试版本，移除了旧交接线索。'
    draft.clues = draft.clues.filter((clue) => clue.id !== 'clue-handover')
    draft.deduction.coreEvidenceIds = draft.clues.map((clue) => clue.id)
  }
  const compiled = compileCaseDraft(draft, [])
  if (!compiled.ok) throw new Error(compiled.issues.map((issue) => issue.message).join('；'))
  return (await exportCasePackage(compiled.caseDefinition, new Map())).bytes
}

export async function buildCommunityFixtureArtifacts(): Promise<Map<string, Uint8Array>> {
  const base = await buildVersion('1.0.0')
  const compatible = await buildVersion('1.1.0')
  const incompatible = await buildVersion('2.0.0')
  return new Map([
    ['packages/valid-1.0.0.ldmcase', base],
    ['packages/valid-1.1.0.ldmcase', compatible],
    ['packages/incompatible-2.0.0.ldmcase', incompatible],
    ['packages/hash-mismatch.ldmcase', base.slice()],
    ['packages/blocked.ldmcase', base.slice()],
  ])
}
