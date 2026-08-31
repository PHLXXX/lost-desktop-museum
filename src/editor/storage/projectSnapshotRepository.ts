import type { AuthoringProject } from '../model/authoringProject'

export interface ProjectSnapshot { snapshotId: string; projectId: string; createdAt: string; reason: string; project: AuthoringProject; order: number }

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
}

export const projectSnapshotRepository = new InMemorySnapshotRepository()
