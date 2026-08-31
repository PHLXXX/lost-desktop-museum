import type { CaseDraft } from './caseDraft'

export type EditorSection = 'overview' | 'metadata' | 'entities' | 'timeline' | 'desktop' | 'applications' | 'files' | 'messages' | 'mail' | 'photos' | 'browser' | 'calendar' | 'logs' | 'audio' | 'broadcast' | 'data' | 'terminal' | 'versions' | 'sitemap' | 'clues' | 'triggers' | 'deduction' | 'assets' | 'validation'

export interface EditorProjectSettings { autosaveEnabled: boolean; previewSafeMode: boolean; defaultPreviewWidth: number; defaultPreviewHeight: number }
export interface EditorUiState { activeSection: EditorSection; expandedTreeIds: string[]; selectedEntityId: string | null; selectedIssueId: string | null; leftPanelWidth: number; rightPanelWidth: number }

export interface AuthoringProject {
  editorSchemaVersion: 1
  projectId: string
  name: string
  caseId: string
  createdAt: string
  updatedAt: string
  lastOpenedAt: string
  revision: number
  draft: CaseDraft
  assetIds: string[]
  projectSettings: EditorProjectSettings
  uiState: EditorUiState
}

export function createAuthoringProject(name: string, draft: CaseDraft, now = new Date().toISOString()): AuthoringProject {
  const projectId = typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `project-${Date.now()}-${Math.random().toString(16).slice(2)}`
  return { editorSchemaVersion: 1, projectId, name, caseId: draft.manifest.caseId ?? `case-${projectId.slice(0, 8)}`, createdAt: now, updatedAt: now, lastOpenedAt: now, revision: 1, draft: structuredClone(draft), assetIds: draft.assets.map((asset) => asset.id), projectSettings: { autosaveEnabled: true, previewSafeMode: true, defaultPreviewWidth: 1440, defaultPreviewHeight: 900 }, uiState: { activeSection: 'overview', expandedTreeIds: [], selectedEntityId: null, selectedIssueId: null, leftPanelWidth: 224, rightPanelWidth: 288 } }
}
