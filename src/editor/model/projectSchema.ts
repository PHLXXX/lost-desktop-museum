import { z } from 'zod'

const draftSchema = z.object({
  manifest: z.record(z.string(), z.unknown()), subject: z.record(z.string(), z.unknown()), entities: z.array(z.unknown()), timeline: z.array(z.unknown()), desktop: z.record(z.string(), z.unknown()), applications: z.array(z.unknown()), folders: z.array(z.unknown()), files: z.array(z.unknown()), chats: z.array(z.unknown()), emails: z.array(z.unknown()), browserHistory: z.array(z.unknown()), calendarEvents: z.array(z.unknown()), photos: z.array(z.unknown()), systemLogs: z.array(z.unknown()), audioTracks: z.array(z.unknown()), broadcastEvents: z.array(z.unknown()), dataTables: z.array(z.unknown()), terminalEntries: z.array(z.unknown()), versionDiffs: z.array(z.unknown()), sitemap: z.array(z.unknown()), clues: z.array(z.unknown()), triggers: z.array(z.unknown()), deduction: z.record(z.string(), z.unknown()), assets: z.array(z.unknown()),
})

export const authoringProjectEnvelopeSchema = z.object({
  editorSchemaVersion: z.literal(1), projectId: z.string().min(1), name: z.string().min(1), caseId: z.string().min(1), createdAt: z.string(), updatedAt: z.string(), lastOpenedAt: z.string(), revision: z.number().int().nonnegative(), draft: draftSchema, assetIds: z.array(z.string()),
  projectSettings: z.object({ autosaveEnabled: z.boolean(), previewSafeMode: z.boolean(), defaultPreviewWidth: z.number().positive(), defaultPreviewHeight: z.number().positive() }),
  uiState: z.object({ activeSection: z.string(), expandedTreeIds: z.array(z.string()), selectedEntityId: z.string().nullable(), selectedIssueId: z.string().nullable(), leftPanelWidth: z.number(), rightPanelWidth: z.number() }),
})
