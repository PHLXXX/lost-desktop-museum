import { IndexedDbRepository, type KeyValueRepository } from '../../storage/indexedDb'
import type { AuthoringProject } from '../model/authoringProject'

export interface ProjectRepository {
  get(projectId: string): Promise<AuthoringProject | null>
  put(project: AuthoringProject): Promise<void>
  delete(projectId: string): Promise<void>
  list(): Promise<AuthoringProject[]>
}

export class InMemoryProjectRepository implements ProjectRepository {
  private projects = new Map<string, AuthoringProject>()
  failWrites = false
  async get(projectId: string) { return this.projects.has(projectId) ? structuredClone(this.projects.get(projectId)!) : null }
  async put(project: AuthoringProject) { if (this.failWrites) throw new Error('模拟存储空间不足'); this.projects.set(project.projectId, structuredClone(project)) }
  async delete(projectId: string) { this.projects.delete(projectId) }
  async list() { return [...this.projects.values()].map((project) => structuredClone(project)).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)) }
}

export class BrowserProjectRepository implements ProjectRepository {
  private adapter: KeyValueRepository<AuthoringProject>
  constructor(adapter: KeyValueRepository<AuthoringProject> = new IndexedDbRepository('archive-workshop-v1', 'projects', 'projectId')) { this.adapter = adapter }
  get(projectId: string) { return this.adapter.get(projectId) }
  put(project: AuthoringProject) { return this.adapter.set(project.projectId, project) }
  delete(projectId: string) { return this.adapter.delete(projectId) }
  async list() { return (await this.adapter.list()).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)) }
}

export const projectRepository: ProjectRepository = typeof indexedDB === 'undefined' ? new InMemoryProjectRepository() : new BrowserProjectRepository()

