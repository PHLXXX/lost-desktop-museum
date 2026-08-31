export interface InstalledCaseSource {
  sourceType: 'built-in' | 'local-import' | 'community'
  registryCaseId?: string; publisherId?: string; installedVersion?: string; packageSha256?: string; registryVersion?: string; installedAt?: string; updatedAt?: string
}
import type { GameSave } from '../../cases/types'

export interface InstalledPackageBackup { version: string; packageSha256: string; installedAt: string; packageBlob: Blob; progressSnapshot?: GameSave }
export interface CommunityInstallationRecord {
  caseId: string; installedVersion: string; packageSha256: string; publisherId: string; registrySource: string; registryVersion: string
  installedAt: string; updatedAt: string; lastUpdateCheckAt: string | null; packageBlob: Blob; rollbackVersions: InstalledPackageBackup[]
}
