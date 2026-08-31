import { create } from 'zustand'
import { builtInCaseIds, getCaseDefinition } from '../../cases/registry'
import type { ValidationIssue } from '../../engine/validation'
import { compileCaseDraft } from '../compiler/compileCaseDraft'
import { decompileCaseDefinition } from '../compiler/decompileCaseDefinition'
import type { CaseDefinition } from '../../cases/types'
import { createAuthoringProject, type AuthoringProject, type EditorSection } from '../model/authoringProject'
import { createBlankDraft, createMinimalTemplateDraft, type CaseDraft } from '../model/caseDraft'
import { EditorAutosave, type EditorSaveStatus } from '../storage/editorAutosave'
import { projectRepository } from '../storage/projectRepository'
import { projectSnapshotRepository } from '../storage/projectSnapshotRepository'
import { HistoryStore } from './historyStore'

interface EditorState {
  projects: AuthoringProject[]
  currentProject: AuthoringProject | null
  saveStatus: EditorSaveStatus
  saveError: string | null
  issues: ValidationIssue[]
  lastValidatedAt: string | null
  loadProjects: () => Promise<void>
  createProject: (kind: 'blank' | 'template' | 'case-001' | 'case-002', details: { name: string; caseId: string; title: string; author: string }) => Promise<void>
  openProject: (projectId: string) => Promise<void>
  closeProject: () => void
  deleteProject: (projectId: string) => Promise<void>
  duplicateProject: (projectId: string) => Promise<void>
  importProject: (project: AuthoringProject) => Promise<void>
  importCaseDefinition: (definition: CaseDefinition) => Promise<void>
  updateProject: (mutator: (project: AuthoringProject) => void, historyKey?: string) => void
  updateDraft: (mutator: (draft: CaseDraft) => void, historyKey?: string) => void
  setSection: (section: EditorSection) => void
  validate: () => ValidationIssue[]
  undo: () => void
  redo: () => void
  saveNow: () => Promise<void>
  createSnapshot: (reason: string) => Promise<void>
}

const history = new HistoryStore<AuthoringProject>(80)
let autosave: EditorAutosave | null = null

function withRevision(project: AuthoringProject): AuthoringProject {
  return { ...project, updatedAt: new Date().toISOString(), revision: project.revision + 1 }
}

function startAutosave(set: (state: Partial<EditorState>) => void) {
  autosave?.dispose()
  autosave = new EditorAutosave(projectRepository, 800, (saveStatus, saveError) => set({ saveStatus, saveError }))
}

export const useEditorStore = create<EditorState>((set, get) => ({
  projects: [], currentProject: null, saveStatus: 'idle', saveError: null, issues: [], lastValidatedAt: null,
  loadProjects: async () => set({ projects: await projectRepository.list() }),
  createProject: async (kind, details) => {
    let draft = kind === 'blank' ? createBlankDraft() : kind === 'template' ? createMinimalTemplateDraft() : decompileCaseDefinition(getCaseDefinition(kind))
    draft = structuredClone(draft)
    draft.manifest.caseId = details.caseId
    draft.manifest.title = details.title
    draft.manifest.author = details.author
    draft.manifest.builtIn = false
    const project = createAuthoringProject(details.name, draft)
    await projectRepository.put(project)
    history.clear()
    startAutosave(set)
    set({ currentProject: project, projects: await projectRepository.list(), saveStatus: 'saved', issues: [] })
  },
  openProject: async (projectId) => {
    const project = await projectRepository.get(projectId)
    if (!project) throw new Error('工程不存在或已被移除。')
    history.clear()
    startAutosave(set)
    set({ currentProject: { ...project, lastOpenedAt: new Date().toISOString() }, saveStatus: 'saved', issues: [] })
  },
  closeProject: () => { autosave?.dispose(); autosave = null; history.clear(); set({ currentProject: null, issues: [], saveStatus: 'idle' }) },
  deleteProject: async (projectId) => { await projectRepository.delete(projectId); if (get().currentProject?.projectId === projectId) get().closeProject(); set({ projects: await projectRepository.list() }) },
  duplicateProject: async (projectId) => {
    const source = await projectRepository.get(projectId)
    if (!source) return
    const copy = createAuthoringProject(`${source.name} 副本`, structuredClone(source.draft))
    copy.draft.manifest.caseId = `${source.caseId}-copy-${copy.projectId.slice(0, 4)}`
    copy.caseId = copy.draft.manifest.caseId
    await projectRepository.put(copy)
    set({ projects: await projectRepository.list() })
  },
  importProject: async (incoming) => {
    const existing = await projectRepository.get(incoming.projectId)
    const project = existing ? createAuthoringProject(`${incoming.name} 导入副本`, incoming.draft) : structuredClone(incoming)
    await projectRepository.put(project)
    set({ projects: await projectRepository.list() })
  },
  importCaseDefinition: async (definition) => {
    const draft = decompileCaseDefinition(definition)
    draft.manifest.builtIn = false
    if (builtInCaseIds.includes(definition.id)) draft.manifest.caseId = `${definition.id}-copy`
    const project = createAuthoringProject(`${definition.title} · 导入工程`, draft)
    project.caseId = draft.manifest.caseId ?? project.caseId
    await projectRepository.put(project)
    set({ currentProject: project, projects: await projectRepository.list(), saveStatus: 'saved', issues: [] })
  },
  updateProject: (mutator, historyKey = 'project') => {
    const current = get().currentProject
    if (!current) return
    const next = structuredClone(current)
    mutator(next)
    const revised = withRevision(next)
    history.record(current, revised, historyKey)
    set({ currentProject: revised, saveStatus: 'dirty' })
    autosave?.queue(revised)
  },
  updateDraft: (mutator, historyKey = 'draft') => get().updateProject((project) => { mutator(project.draft); project.caseId = project.draft.manifest.caseId ?? project.caseId }, historyKey),
  setSection: (section) => {
    const current = get().currentProject
    if (!current) return
    const next = withRevision(structuredClone(current))
    next.uiState.activeSection = section
    set({ currentProject: next, saveStatus: 'dirty' })
    autosave?.queue(next)
  },
  validate: () => {
    const project = get().currentProject
    if (!project) return []
    const result = compileCaseDraft(project.draft, [])
    const issues = result.ok ? result.warnings : result.issues
    set({ issues, lastValidatedAt: new Date().toISOString() })
    return issues
  },
  undo: () => { const current = get().currentProject; if (!current || !history.canUndo) return; const next = withRevision(history.undo(current)); set({ currentProject: next, saveStatus: 'dirty' }); autosave?.queue(next) },
  redo: () => { const current = get().currentProject; if (!current || !history.canRedo) return; const next = withRevision(history.redo(current)); set({ currentProject: next, saveStatus: 'dirty' }); autosave?.queue(next) },
  saveNow: async () => { const current = get().currentProject; if (!current) return; if (!autosave) startAutosave(set); autosave?.queue(current); await autosave?.flush(); set({ projects: await projectRepository.list() }) },
  createSnapshot: async (reason) => { const current = get().currentProject; if (current) await projectSnapshotRepository.create(current, reason) },
}))
