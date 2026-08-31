import { IndexedDbRepository, type KeyValueRepository } from './indexedDb'

export interface StoredAsset { assetKey: string; ownerId: string; path: string; mime: string; size: number; sha256: string; blob: Blob }
class InMemoryAssetAdapter implements KeyValueRepository<StoredAsset> {
  private assets = new Map<string, StoredAsset>()
  async get(key: string) { return this.assets.get(key) ?? null }
  async set(key: string, value: StoredAsset) { this.assets.set(key, value) }
  async delete(key: string) { this.assets.delete(key) }
  async list() { return [...this.assets.values()] }
}

export class AssetRepository {
  constructor(private adapter: KeyValueRepository<StoredAsset> = typeof indexedDB === 'undefined' ? new InMemoryAssetAdapter() : new IndexedDbRepository('lost-desktop-museum-v4-assets', 'assets', 'assetKey')) {}
  put(asset: StoredAsset) { return this.adapter.set(asset.assetKey, asset) }
  get(assetKey: string) { return this.adapter.get(assetKey) }
  delete(assetKey: string) { return this.adapter.delete(assetKey) }
  async listByOwner(ownerId: string) { return (await this.adapter.list()).filter((asset) => asset.ownerId === ownerId) }
  async deleteOwner(ownerId: string) { for (const asset of await this.listByOwner(ownerId)) await this.delete(asset.assetKey) }
}

export const assetRepository = new AssetRepository()
