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
  const buffer = await blob.arrayBuffer()
  if (blob.size > 1024 * 1024 && typeof Worker !== 'undefined') {
    try {
      return await new Promise<string>((resolve, reject) => {
        const worker = new Worker(new URL('./assetHash.worker.ts', import.meta.url), { type: 'module' })
        worker.onmessage = (event: MessageEvent<{ hash?: string; error?: string }>) => {
          worker.terminate()
          if (event.data.hash) resolve(event.data.hash)
          else reject(new Error(event.data.error ?? 'HASH_FAILED'))
        }
        worker.onerror = () => { worker.terminate(); reject(new Error('HASH_WORKER_FAILED')) }
        worker.postMessage(buffer, [buffer])
      })
    } catch {
      // 浏览器不支持模块Worker时安全退回主线程，导入不会因此丢失。
    }
  }
  const digest = await crypto.subtle.digest('SHA-256', buffer)
  return [...new Uint8Array(digest)].map((value) => value.toString(16).padStart(2, '0')).join('')
}

export const editorAssetRepository = new EditorAssetRepository()
