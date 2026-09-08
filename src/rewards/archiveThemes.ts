import type { ArchiveThemeId } from '../cases/types'

export interface ArchiveThemeDefinition {
  id: ArchiveThemeId
  title: string
  description: string
}

export const archiveThemes: readonly ArchiveThemeDefinition[] = [
  { id: 'archive-standard', title: '标准档案', description: 'ARCHIVE/OS 默认的琥珀与深灰配色。' },
  { id: 'departure-night', title: '候机厅夜色', description: '取自深夜航站楼信息屏的靛蓝与暖琥珀。' },
  { id: 'signal-blueprint', title: '信号室蓝图', description: '取自广播控制室图纸的冷蓝与青色。' },
]

const archiveThemeIds = new Set<ArchiveThemeId>(archiveThemes.map((theme) => theme.id))

export function isArchiveThemeId(value: unknown): value is ArchiveThemeId {
  return typeof value === 'string' && archiveThemeIds.has(value as ArchiveThemeId)
}

export function applyArchiveTheme(themeId: ArchiveThemeId, root: HTMLElement | undefined = typeof document === 'undefined' ? undefined : document.documentElement): void {
  if (root) root.dataset.archiveTheme = themeId
}
