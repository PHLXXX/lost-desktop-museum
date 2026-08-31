import type { AuthoringProject } from '../model/authoringProject'
import { IndexedDbRepository, type KeyValueRepository } from '../../storage/indexedDb'

export interface ProjectSnapshot { snapshotId: string; projectId: string; createdAt: string; reason: string; project: AuthoringProject; order: number }
export interface SnapshotRepository {
  create(project: AuthoringProject, reason: string, now?: string): Promise<ProjectSnapshot>
  list(projectId: string): Promise<ProjectSnapshot[]>
  restore(snapshotId: string): Promise<AuthoringProject | null>
  delete(snapshotId: string): Promise<void>
  deleteProject?(projectId: string): Promise<void>
}

export class InMemorySnapshotRepository {
  private snapshots = new Map<string, ProjectSnapshot>()
  private sequence = 0
  constructor(private limit = 20) {}
  async create(project: AuthoringProject, reason: string, now = new Date().toISOString()) {
    const snapshotId = `snapshot-${project.projectId}-${Date.now()}-${Math.random().toString(16).slice(2)}`
    const snapshot = { snapshotId, projectId: project.projectId, createdAt: now, reason, project: structuredClone(project), order: ++this.sequence }
    this.snapshots.set(snapshotId, snapshot)
    const list = await this.list(project.projectId)
    for (const extra of list.slice(this.limit)) this.snapshots.delete(extra.snapshotId)
    return snapshot
  }
  async list(projectId: string) { return [...this.snapshots.values()].filter((snapshot) => snapshot.projectId === projectId).sort((a, b) => b.order - a.order) }
  async restore(snapshotId: string) { const value = this.snapshots.get(snapshotId); return value ? structuredClone(value.project) : null }
  async delete(snapshotId: string) { this.snapshots.delete(snapshotId) }
  async deleteProject(projectId: string) { for (const item of await this.list(projectId)) this.snapshots.delete(item.snapshotId) }
}

export class BrowserSnapshotRepository implements SnapshotRepository {
  private sequence = Date.now()
  constructor(
    private adapter: KeyValueRepository<ProjectSnapshot> = new IndexedDbRepository('archive-workshop-v1-snapshots', 'snapshots', 'snapshotId'),
    private limit = 20,
  ) {}
  async create(project: AuthoringProject, reason: string, now = new Date().toISOString()) {
    const snapshot: ProjectSnapshot = { snapshotId: `snapshot-${project.projectId}-${crypto.randomUUID()}`, projectId: project.projectId, createdAt: now, reason, project: structuredClone(project), order: ++this.sequence }
    await this.adapter.set(snapshot.snapshotId, snapshot)
    const list = await this.list(project.projectId)
    for (const extra of list.slice(this.limit)) await this.adapter.delete(extra.snapshotId)
    return snapshot
  }
  async list(projectId: string) { return (await this.adapter.list()).filter((snapshot) => snapshot.projectId === projectId).sort((a, b) => b.order - a.order) }
  async restore(snapshotId: string) { return structuredClone((await this.adapter.get(snapshotId))?.project ?? null) }
  async delete(snapshotId: string) { await this.adapter.delete(snapshotId) }
  async deleteProject(projectId: string) { for (const item of await this.list(projectId)) await this.adapter.delete(item.snapshotId) }
}

export const projectSnapshotRepository: SnapshotRepository = typeof indexedDB === 'undefined' ? new InMemorySnapshotRepository() : new BrowserSnapshotRepository()
