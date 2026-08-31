import type { CaseDraft } from '../model/caseDraft'

export function normalizeCaseDraft(draft: CaseDraft): CaseDraft {
  const normalized = structuredClone(draft)
  normalized.manifest.caseId = normalized.manifest.caseId?.trim().toLowerCase()
  normalized.manifest.title = normalized.manifest.title?.trim()
  normalized.manifest.author = normalized.manifest.author?.trim()
  normalized.manifest.tags = [...new Set(normalized.manifest.tags ?? [])]
  normalized.manifest.contentWarnings = [...new Set(normalized.manifest.contentWarnings ?? [])]
  normalized.entities = normalized.entities.map((entity) => ({ ...entity, id: entity.id.trim().toLowerCase(), name: entity.name.trim() }))
  return normalized
}

