import type { AuthoringProject } from './authoringProject'
import { authoringProjectEnvelopeSchema } from './projectSchema'

export type ProjectMigrationResult = { ok: true; project: AuthoringProject; original: unknown } | { ok: false; error: string; original: unknown }

export function migrateAuthoringProject(input: unknown): ProjectMigrationResult {
  const original = structuredClone(input)
  const parsed = authoringProjectEnvelopeSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('；'), original }
  return { ok: true, project: structuredClone(input) as AuthoringProject, original }
}

