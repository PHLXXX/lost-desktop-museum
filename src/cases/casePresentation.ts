import type { CaseDefinition } from './types'

export function caseAccountName(definition: CaseDefinition) {
  return definition.owner.replace(/\s+/g, '_').toUpperCase()
}

export function caseSnapshotDate(definition: CaseDefinition) {
  const isoDate = /^(\d{4})-(\d{2})-(\d{2})/.exec(definition.subject.lastLoginAt)
  if (isoDate) return `${isoDate[1]}-${isoDate[2]}-${isoDate[3]}`

  const displayDate = /^(\d{4})[./-](\d{2})[./-](\d{2})/.exec(definition.desktop.lastLoginMessage)
  return displayDate ? `${displayDate[1]}-${displayDate[2]}-${displayDate[3]}` : null
}

export function chineseDate(date: string | null) {
  if (!date) return '日期未记录'
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(date)
  return match ? `${match[1]} 年 ${Number(match[2])} 月 ${Number(match[3])} 日` : date
}

export function archiveYear(definition: CaseDefinition) {
  const date = caseSnapshotDate(definition)
  return date?.slice(0, 4) ?? '未标注年份'
}

export function caseDisplayId(definition: CaseDefinition) {
  return definition.manifest.caseId.replace(/^case-/i, '').toUpperCase()
}

export function desktopArchiveDate(definition: CaseDefinition) {
  return definition.desktop.lastLoginMessage.trim().split(/\s+/)[0] ?? definition.desktop.lastLoginMessage
}
