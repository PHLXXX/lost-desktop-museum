import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createAuthoringProject } from '../model/authoringProject'
import { createMinimalTemplateDraft } from '../model/caseDraft'
import { HistoryStore } from '../store/historyStore'
import { EditorAutosave } from './editorAutosave'
import { getEditorTabOwnerId, ProjectLockManager } from './projectLock'
import { InMemoryProjectRepository } from './projectRepository'
import { InMemorySnapshotRepository } from './projectSnapshotRepository'

describe('authoring project lifecycle', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('debounces autosave and keeps the in-memory draft when persistence fails', async () => {
    const project = createAuthoringProject('测试工程', createMinimalTemplateDraft())
    const repository = new InMemoryProjectRepository()
    const autosave = new EditorAutosave(repository, 800)
    autosave.queue({ ...project, name: '第一次输入' })
    autosave.queue({ ...project, name: '最终名称' })
    expect(autosave.status).toBe('dirty')
    await vi.advanceTimersByTimeAsync(799)
    expect(await repository.get(project.projectId)).toBeNull()
    await vi.advanceTimersByTimeAsync(1)
    expect((await repository.get(project.projectId))?.name).toBe('最终名称')
    repository.failWrites = true
    autosave.queue({ ...project, name: '失败后仍在内存' })
    await vi.advanceTimersByTimeAsync(800)
    expect(autosave.status).toBe('error')
    expect(autosave.pending?.name).toBe('失败后仍在内存')
  })

  it('supports bounded undo/redo with text coalescing', () => {
    const history = new HistoryStore<{ title: string }>(3)
    history.record({ title: 'A' }, { title: 'AB' }, 'title', 100)
    history.record({ title: 'AB' }, { title: 'ABC' }, 'title', 300)
    expect(history.undo({ title: 'ABC' })).toEqual({ title: 'A' })
    expect(history.redo({ title: 'A' })).toEqual({ title: 'ABC' })
    history.record({ title: 'ABC' }, { title: '1' }, 'replace', 1000)
    history.record({ title: '1' }, { title: '2' }, 'replace', 2000)
    history.record({ title: '2' }, { title: '3' }, 'replace', 3000)
    history.record({ title: '3' }, { title: '4' }, 'replace', 4000)
    expect(history.size).toBe(3)
  })

  it('creates, limits and restores project snapshots', async () => {
    const repository = new InMemorySnapshotRepository(2)
    const project = createAuthoringProject('原始', createMinimalTemplateDraft())
    await repository.create(project, '导出前')
    await repository.create({ ...project, name: '第二版' }, '批量重命名前')
    await repository.create({ ...project, name: '第三版' }, '删除引用前')
    const snapshots = await repository.list(project.projectId)
    expect(snapshots).toHaveLength(2)
    expect((await repository.restore(snapshots[0]!.snapshotId))?.name).toBe('第三版')
  })

  it('prevents concurrent edits and permits expired lock takeover', () => {
    const storage = new Map<string, string>()
    const first = new ProjectLockManager(storage, 'tab-a', 1_000)
    const second = new ProjectLockManager(storage, 'tab-b', 1_000)
    expect(first.acquire('project-one', 100)).toBe('acquired')
    expect(second.acquire('project-one', 500)).toBe('readonly')
    expect(second.acquire('project-one', 1_101)).toBe('acquired')
    first.release('project-one')
    expect(second.status('project-one', 1_102)).toBe('owned')
  })

  it('keeps the same tab owner across reloads without sharing it with another session', () => {
    const createSession = () => { const values = new Map<string, string>(); return { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => values.set(key, value) } as unknown as Storage }
    const firstSession = createSession()
    const otherSession = createSession()
    expect(getEditorTabOwnerId(firstSession)).toBe(getEditorTabOwnerId(firstSession))
    expect(getEditorTabOwnerId(otherSession)).not.toBe(getEditorTabOwnerId(firstSession))
  })
})
