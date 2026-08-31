interface ParsedSemver {
  core: [number, number, number]
  prerelease: string[]
}

function parseSemver(value: string): ParsedSemver {
  const match = value.match(/^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?$/)
  if (!match) throw new Error(`无效语义化版本：${value}`)
  return {
    core: [Number(match[1]), Number(match[2]), Number(match[3])],
    prerelease: match[4]?.split('.') ?? [],
  }
}

export function compareSemver(left: string, right: string): -1 | 0 | 1 {
  const a = parseSemver(left)
  const b = parseSemver(right)
  for (let index = 0; index < 3; index += 1) {
    if (a.core[index]! < b.core[index]!) return -1
    if (a.core[index]! > b.core[index]!) return 1
  }
  if (a.prerelease.length === 0 && b.prerelease.length === 0) return 0
  if (a.prerelease.length === 0) return 1
  if (b.prerelease.length === 0) return -1
  const length = Math.max(a.prerelease.length, b.prerelease.length)
  for (let index = 0; index < length; index += 1) {
    const leftPart = a.prerelease[index]
    const rightPart = b.prerelease[index]
    if (leftPart === undefined) return -1
    if (rightPart === undefined) return 1
    if (leftPart === rightPart) continue
    const leftNumeric = /^\d+$/.test(leftPart)
    const rightNumeric = /^\d+$/.test(rightPart)
    if (leftNumeric && rightNumeric) return Number(leftPart) < Number(rightPart) ? -1 : 1
    if (leftNumeric !== rightNumeric) return leftNumeric ? -1 : 1
    return leftPart < rightPart ? -1 : 1
  }
  return 0
}

export function isEngineVersionCompatible(current: string, range: { minimum: string; maximumExclusive?: string }): boolean {
  return compareSemver(current, range.minimum) >= 0 && (!range.maximumExclusive || compareSemver(current, range.maximumExclusive) < 0)
}
