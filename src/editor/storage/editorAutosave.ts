import type { AuthoringProject } from '../model/authoringProject'
import type { ProjectRepository } from './projectRepository'

export type EditorSaveStatus = 'idle' | 'dirty' | 'saving' | 'saved' | 'error'

export class EditorAutosave {
  status: EditorSaveStatus = 'idle'
  pending: AuthoringProject | null = null
  error: string | null = null
  private timer: ReturnType<typeof setTimeout> | null = null
  constructor(private repository: ProjectRepository, private delayMs = 800, private onStatus?: (status: EditorSaveStatus, error: string | null) => void) {}

  queue(project: AuthoringProject) {
    this.pending = structuredClone(project)
    this.setStatus('dirty')
    if (this.timer) clearTimeout(this.timer)
    this.timer = setTimeout(() => { void this.flush() }, this.delayMs)
  }

  async flush() {
    if (!this.pending) return
    const project = this.pending
    this.setStatus('saving')
    try {
      await this.repository.put(project)
      if (this.pending?.revision === project.revision) this.pending = null
      this.setStatus('saved')
    } catch (error) {
      this.error = error instanceof Error ? error.message : '工程保存失败。'
      this.setStatus('error')
    }
  }

  dispose() { if (this.timer) clearTimeout(this.timer); this.timer = null }
  private setStatus(status: EditorSaveStatus) { this.status = status; if (status !== 'error') this.error = null; this.onStatus?.(status, this.error) }
}

