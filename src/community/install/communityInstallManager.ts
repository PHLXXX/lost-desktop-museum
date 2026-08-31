import { isBuiltInCaseId } from '../../cases/builtInIds'
import { importCasePackage, type ImportedCasePackage } from '../../packages/casePackage'
import { assetRepository, type AssetRepository } from '../../storage/assetRepository'
import { caseRepository, type CaseRepository } from '../../storage/caseRepository'
import type { CommunityCaseDetail, CommunityCaseVersion } from '../types/communityTypes'
import type { CommunityInstallationRecord } from '../types/installedCaseSource'
import { verifyPackageIntegrity } from './packageIntegrity'
import { communityInstallationRepository, type CommunityInstallationRepository } from './communityInstallationRepository'
import type { GameSave } from '../../cases/types'
import { COMMUNITY_CLIENT_VERSION } from '../config/communityConfig'
import { isEngineVersionCompatible } from '../updates/semver'
import { analyzeUpdateCompatibility } from '../updates/updateCompatibility'

export interface PreparedCommunityInstall { detail: CommunityCaseDetail; version: CommunityCaseVersion; bytes: Uint8Array; imported: ImportedCasePackage }
export interface InstallManagerDependencies { cases: CaseRepository; assets: AssetRepository; installations: CommunityInstallationRepository }
const defaults: InstallManagerDependencies = { cases: caseRepository, assets: assetRepository, installations: communityInstallationRepository }

export class CommunityInstallManager {
  constructor(private dependencies: InstallManagerDependencies = defaults) {}
  async prepare(detail: CommunityCaseDetail, version: CommunityCaseVersion, bytes: Uint8Array): Promise<PreparedCommunityInstall> {
    if (detail.status === 'blocked') throw new Error(detail.blockReason ?? '该社区案件已被阻止，不能安装。')
    if (isBuiltInCaseId(detail.caseId)) throw new Error('该案件ID与内置档案冲突，无法安装。')
    if (!isEngineVersionCompatible(COMMUNITY_CLIENT_VERSION, version.engineCompatibility)) throw new Error(`当前客户端引擎 ${COMMUNITY_CLIENT_VERSION} 与案件要求不兼容。`)
    if (bytes.length > 30 * 1024 * 1024) throw new Error('社区案件包超过30MB安装限制。')
    await verifyPackageIntegrity(bytes, version.packageSha256, version.packageByteSize)
    const imported = await importCasePackage(bytes, `${detail.caseId}-${version.version}.ldmcase`)
    if (imported.caseDefinition.id !== detail.caseId) throw new Error('案件包caseId与社区登记不一致。')
    if (imported.caseDefinition.manifest.version !== version.version) throw new Error('案件包version与社区登记不一致。')
    if (imported.caseDefinition.manifest.author !== detail.publisherId) throw new Error('案件包发布者与社区登记不一致。')
    if (imported.caseDefinition.assets.length + 3 > 250) throw new Error('社区案件包文件数量超过250个。')
    if (imported.caseDefinition.assets.some((asset) => asset.size > 8 * 1024 * 1024)) throw new Error('社区案件包包含超过8MB的单个资源。')
    return { detail, version, bytes, imported }
  }
  async install(candidate: PreparedCommunityInstall, registrySource: string, registryVersion: string, options: { progressSnapshot?: GameSave } = {}) {
    const { cases, assets, installations } = this.dependencies; const caseId = candidate.detail.caseId
    const previousCase = await cases.get(caseId); const previousRecord = await installations.get(caseId); const previousAssets = await assets.listByOwner(caseId)
    if (previousCase && !previousRecord) throw new Error('同ID的本地导入案件已存在；请先移除本地版本或安装为本地副本。')
    const now = new Date().toISOString()
    try {
      await cases.install(candidate.imported.caseDefinition); await assets.deleteOwner(caseId)
      for (const ref of candidate.imported.caseDefinition.assets) {
        const bytes = candidate.imported.assets.get(ref.path) ?? candidate.imported.assets.get(ref.path.startsWith('assets/') ? ref.path : `assets/${ref.path}`)
        if (!bytes) throw new Error(`安装资源缺失：${ref.id}`)
        await assets.put({ assetKey: `${caseId}:${ref.id}`, ownerId: caseId, path: ref.path, mime: ref.mime, size: bytes.length, sha256: ref.sha256, blob: new Blob([bytes.slice().buffer], { type: ref.mime }) })
      }
      const rollbackVersions = previousRecord ? [...previousRecord.rollbackVersions, { version: previousRecord.installedVersion, packageSha256: previousRecord.packageSha256, installedAt: previousRecord.updatedAt, packageBlob: previousRecord.packageBlob, ...(options.progressSnapshot ? { progressSnapshot: structuredClone(options.progressSnapshot) } : {}) }].slice(-2) : []
      const record: CommunityInstallationRecord = { caseId, installedVersion: candidate.version.version, packageSha256: candidate.version.packageSha256, publisherId: candidate.detail.publisherId, registrySource, registryVersion, installedAt: previousRecord?.installedAt ?? now, updatedAt: now, lastUpdateCheckAt: now, packageBlob: new Blob([candidate.bytes.slice().buffer], { type: 'application/x-ldmcase' }), rollbackVersions }
      await installations.save(record); return record
    } catch (error) {
      await cases.remove(caseId); await assets.deleteOwner(caseId); await installations.delete(caseId)
      if (previousCase) await cases.install(previousCase)
      for (const asset of previousAssets) await assets.put(asset)
      if (previousRecord) await installations.save(previousRecord)
      throw new Error(`社区案件安装失败，已恢复原状态：${error instanceof Error ? error.message : '本地存储错误'}`, { cause: error })
    }
  }
  async uninstall(caseId: string) { await this.dependencies.cases.remove(caseId); await this.dependencies.assets.deleteOwner(caseId); await this.dependencies.installations.delete(caseId) }
  async rollback(caseId: string, version: string, detail: CommunityCaseDetail, progressSnapshot?: GameSave) {
    const record = await this.dependencies.installations.get(caseId); const backup = record?.rollbackVersions.find((item) => item.version === version)
    if (!record || !backup) throw new Error('找不到可用的本地回滚包。')
    const registered = detail.versions.find((item) => item.version === version); if (!registered || detail.status === 'blocked') throw new Error('该版本当前不能回滚安装。')
    const prepared = await this.prepare(detail, registered, new Uint8Array(await backup.packageBlob.arrayBuffer()))
    if (progressSnapshot) {
      const compatibility = analyzeUpdateCompatibility(progressSnapshot, prepared.imported.caseDefinition, registered.saveCompatibility.mode)
      if (compatibility.status !== 'compatible') throw new Error('目标版本与当前进度不兼容；请先导出进度或重置本案后再回滚。')
    }
    const installed = await this.install(prepared, record.registrySource, record.registryVersion, { progressSnapshot })
    const nextRecord = { ...installed, rollbackVersions: installed.rollbackVersions.filter((item) => item.version !== version).slice(-2) }
    await this.dependencies.installations.save(nextRecord)
    return { record: nextRecord, restoredProgress: backup.progressSnapshot ? structuredClone(backup.progressSnapshot) : undefined }
  }
}
export const communityInstallManager = new CommunityInstallManager()
