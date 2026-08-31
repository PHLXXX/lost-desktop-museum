import { AssetRepository, type StoredAsset } from '../../storage/assetRepository'

export interface EditorAssetMetadata { id: string; projectId: string; filename: string; mime: string; size: number; sha256: string; alt: string; transcript: string }

export class EditorAssetRepository {
  constructor(private repository = new AssetRepository()) {}
  async put(metadata: EditorAssetMetadata, blob: Blob) { await this.repository.put({ assetKey: `${metadata.projectId}:${metadata.id}`, ownerId: metadata.projectId, path: metadata.filename, mime: metadata.mime, size: metadata.size, sha256: metadata.sha256, blob }) }
  async get(projectId: string, assetId: string) { return this.repository.get(`${projectId}:${assetId}`) }
  async list(projectId: string): Promise<StoredAsset[]> { return this.repository.listByOwner(projectId) }
  async remove(projectId: string, assetId: string) { await this.repository.delete(`${projectId}:${assetId}`) }
  async clear(projectId: string) { await this.repository.deleteOwner(projectId) }
}

export async function hashBlob(blob: Blob) {
  const digest = await crypto.subtle.digest('SHA-256', await blob.arrayBuffer())
  return [...new Uint8Array(digest)].map((value) => value.toString(16).padStart(2, '0')).join('')
}

export const editorAssetRepository = new EditorAssetRepository()

