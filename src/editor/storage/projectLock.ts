interface LockRecord { ownerId: string; expiresAt: number }
interface LockStorage { get(key: string): string | undefined; set(key: string, value: string): unknown; delete(key: string): unknown }
export type ProjectLockAcquireResult = 'acquired' | 'readonly'
export type ProjectLockStatus = 'owned' | 'locked' | 'available'

export class ProjectLockManager {
  constructor(private storage: LockStorage, private ownerId: string, private timeoutMs = 15_000) {}
  private key(projectId: string) { return `archive-workshop-lock:${projectId}` }
  private read(projectId: string): LockRecord | null { try { const value = this.storage.get(this.key(projectId)); return value ? JSON.parse(value) as LockRecord : null } catch { return null } }
  acquire(projectId: string, now = Date.now(), force = false): ProjectLockAcquireResult {
    const existing = this.read(projectId)
    if (!force && existing && existing.ownerId !== this.ownerId && existing.expiresAt > now) return 'readonly'
    this.storage.set(this.key(projectId), JSON.stringify({ ownerId: this.ownerId, expiresAt: now + this.timeoutMs }))
    return 'acquired'
  }
  heartbeat(projectId: string, now = Date.now()) { if (this.status(projectId, now) === 'owned') this.storage.set(this.key(projectId), JSON.stringify({ ownerId: this.ownerId, expiresAt: now + this.timeoutMs })) }
  status(projectId: string, now = Date.now()): ProjectLockStatus { const lock = this.read(projectId); if (!lock || lock.expiresAt <= now) return 'available'; return lock.ownerId === this.ownerId ? 'owned' : 'locked' }
  release(projectId: string) { if (this.status(projectId) === 'owned') this.storage.delete(this.key(projectId)) }
}

export class LocalStorageLockStorage implements LockStorage {
  get(key: string) { return window.localStorage.getItem(key) ?? undefined }
  set(key: string, value: string) { window.localStorage.setItem(key, value) }
  delete(key: string) { window.localStorage.removeItem(key) }
}

export function getEditorTabOwnerId(storage: Storage = window.sessionStorage) {
  const key = 'archive-workshop-tab-owner'
  const existing = storage.getItem(key)
  if (existing) return existing
  const ownerId = crypto.randomUUID()
  storage.setItem(key, ownerId)
  return ownerId
}
