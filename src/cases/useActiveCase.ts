import { useGameStore } from '../store/gameStore'
import { getCaseDefinition } from './registry'

export function useActiveCaseDefinition() {
  const caseId = useGameStore((state) => state.caseId)
  return getCaseDefinition(caseId)
}

