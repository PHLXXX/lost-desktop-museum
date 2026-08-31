import type { CaseDefinition, VirtualFile } from '../cases/types'

export interface FileSystemProgress {
  unlockedItemIds: string[]
  restoredItemIds: string[]
}

const emptyProgress: FileSystemProgress = { unlockedItemIds: [], restoredItemIds: [] }

export function isVisibleRecycleFile(file: VirtualFile, progress: FileSystemProgress = emptyProgress): boolean {
  return file.folder === '回收站'
    && (!file.locked || progress.unlockedItemIds.includes(file.id))
    && !progress.restoredItemIds.includes(file.id)
}

export function filesInFolder(definition: CaseDefinition, folder: string, progress: FileSystemProgress = emptyProgress): VirtualFile[] {
  if (folder === '全部档案') return definition.files
  if (folder === '回收站') return definition.files.filter((file) => isVisibleRecycleFile(file, progress))
  return definition.files.filter((file) => file.folder === folder || (
    file.folder === '回收站'
    && progress.restoredItemIds.includes(file.id)
    && (file.originalFolder ?? '文档') === folder
  ))
}
