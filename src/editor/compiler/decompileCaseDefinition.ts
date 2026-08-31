import type { CaseDefinition } from '../../cases/types'
import type { CaseDraft } from '../model/caseDraft'

export function decompileCaseDefinition(definition: CaseDefinition): CaseDraft {
  return {
    manifest: structuredClone(definition.manifest), subject: structuredClone(definition.subject), entities: structuredClone(definition.entities), timeline: structuredClone(definition.timeline), desktop: structuredClone(definition.desktop), applications: structuredClone(definition.applications),
    folders: structuredClone(definition.folders), files: structuredClone(definition.files), chats: structuredClone(definition.chats), emails: structuredClone(definition.emails), browserHistory: structuredClone(definition.browser), calendarEvents: structuredClone(definition.calendar), photos: structuredClone(definition.photos), systemLogs: structuredClone(definition.logs),
    audioTracks: [], broadcastEvents: [], clues: structuredClone(definition.clues), triggers: structuredClone(definition.triggers),
    deduction: { questions: structuredClone(definition.questions), coreEvidenceIds: structuredClone(definition.coreEvidenceIds), correctContradictions: structuredClone(definition.correctContradictions), ending: definition.ending, resultLevels: [] }, assets: structuredClone(definition.assets),
  }
}

