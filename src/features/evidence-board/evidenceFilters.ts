import type { ClueDefinition } from '../../cases/types'

export interface EvidenceFilters { source: string; person: string; time: string; place: string }

export function filterEvidenceClues(clues: ClueDefinition[], filters: EvidenceFilters): ClueDefinition[] {
  const includes = (values: string[], query: string) => !query || values.some((value) => value.includes(query))
  return clues.filter((clue) =>
    (!filters.source || clue.source === filters.source) &&
    includes(clue.people, filters.person) &&
    includes(clue.times, filters.time) &&
    includes(clue.places, filters.place),
  )
}

