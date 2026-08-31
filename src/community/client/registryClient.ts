import { COMMUNITY_AUTO_REFRESH_MS, COMMUNITY_CLIENT_VERSION } from '../config/communityConfig'
import { parseCommunityCaseDetail, parseCommunityPublisher, parseCommunityRegistryIndex } from '../schema/registrySchema'
import type { CommunityCaseDetail, CommunityPublisher, CommunityRegistryIndex } from '../types/communityTypes'
import { registryCacheRepository, type RegistryCacheRepository } from '../cache/registryCacheRepository'
import { createRegistryUrlResolver } from './registryUrlResolver'
import { fetchWithTimeout } from './fetchWithTimeout'
import { compareSemver } from '../updates/semver'

export interface RegistryLoadResult { index: CommunityRegistryIndex; source: 'network' | 'cache'; offline: boolean; fetchedAt: string; warning?: string }
export class CommunityRegistryClient {
  readonly resolver
  constructor(readonly indexUrl: string, private cache: RegistryCacheRepository = registryCacheRepository, private fetcher: typeof fetch = fetch) { this.resolver = createRegistryUrlResolver(indexUrl) }
  async cached() { const value = await this.cache.load(); return value?.registryUrl === this.indexUrl ? value : null }
  async load(options: { force?: boolean; now?: number } = {}): Promise<RegistryLoadResult> {
    const storedCache = await this.cached(); const cache = storedCache && compareSemver(COMMUNITY_CLIENT_VERSION, storedCache.index.engineCompatibility.minimumClientVersion) >= 0 ? storedCache : null; const fresh = cache && (options.now ?? Date.now()) - new Date(cache.fetchedAt).getTime() < COMMUNITY_AUTO_REFRESH_MS
    if (fresh && !options.force) return { index: cache.index, source: 'cache', offline: !navigator.onLine, fetchedAt: cache.fetchedAt }
    try {
      const response = await fetchWithTimeout(this.indexUrl, { cache: 'no-store' }, this.fetcher); if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const index = parseCommunityRegistryIndex(await response.json()); if (compareSemver(COMMUNITY_CLIENT_VERSION, index.engineCompatibility.minimumClientVersion) < 0) throw new Error(`社区目录需要客户端 ${index.engineCompatibility.minimumClientVersion} 或更高版本。`); const fetchedAt = new Date(options.now ?? Date.now()).toISOString(); await this.cache.save(this.indexUrl, index, fetchedAt)
      return { index, source: 'network', offline: false, fetchedAt }
    } catch (error) {
      if (cache) return { index: cache.index, source: 'cache', offline: true, fetchedAt: cache.fetchedAt, warning: '正在使用上次同步的社区目录。' }
      const reason = error instanceof Error ? error.message : '网络错误'
      if (storedCache && !cache) throw new Error(`社区目录需要更新的客户端版本：${reason}。已安装案件仍可正常使用。`, { cause: error })
      throw new Error(`社区目录暂时不可用：${reason}。已安装案件仍可正常使用。`, { cause: error })
    }
  }
  async detail(path: string, options: { force?: boolean; expectedVersion?: string; expectedCaseId?: string } = {}): Promise<CommunityCaseDetail> {
    const caseId = path.split('/').at(-1)?.replace(/\.json$/, '') ?? ''
    if (options.expectedCaseId && caseId !== options.expectedCaseId) throw new Error('社区案件详情路径与目录中的案件ID不一致。')
    const cached = await this.cached(); const cachedDetail = cached?.caseDetails[caseId]?.detail
    if (!options.force && cachedDetail && (!options.expectedVersion || cachedDetail.latestVersion === options.expectedVersion)) return cachedDetail
    try { const response = await fetchWithTimeout(this.resolver.resolve(path), {}, this.fetcher); if (!response.ok) throw new Error(`HTTP ${response.status}`); const detail = parseCommunityCaseDetail(await response.json()); if (detail.caseId !== caseId || options.expectedCaseId && detail.caseId !== options.expectedCaseId) throw new Error('社区案件详情内容与目录中的案件ID不一致。'); await this.cache.saveDetail(detail.caseId, detail); return detail }
    catch (error) { if (cachedDetail) return cachedDetail; throw new Error(`社区案件详情不可用：${error instanceof Error ? error.message : '网络错误'}。`, { cause: error }) }
  }
  async publisher(path: string, expectedPublisherId?: string): Promise<CommunityPublisher> {
    const publisherId = path.split('/').at(-1)?.replace(/\.json$/, '') ?? ''
    if (expectedPublisherId && publisherId !== expectedPublisherId) throw new Error('发布者资料路径与案件登记不一致。')
    const cached = (await this.cached())?.publishers?.[publisherId]?.publisher
    try {
      const response = await fetchWithTimeout(this.resolver.resolve(path), {}, this.fetcher); if (!response.ok) throw new Error('发布者资料暂时不可用。')
      const publisher = parseCommunityPublisher(await response.json()); if (publisher.publisherId !== publisherId || expectedPublisherId && publisher.publisherId !== expectedPublisherId) throw new Error('发布者资料内容与案件登记不一致。')
      await this.cache.savePublisher(publisher.publisherId, publisher); return publisher
    } catch (error) { if (cached) return cached; throw error }
  }
}
