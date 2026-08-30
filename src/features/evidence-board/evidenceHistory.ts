export type EvidencePositions = Record<string, { x: number; y: number }>

export function createEvidenceLayout(ids: string[], columns = 2): EvidencePositions {
  return Object.fromEntries(ids.map((id, index) => [id, { x: 26 + (index % columns) * 238, y: 28 + Math.floor(index / columns) * 172 }]))
}

export function clampEvidenceZoom(value: number): number { return Math.max(.7, Math.min(1.4, Number(value.toFixed(1)))) }
