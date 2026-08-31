import type { GameSave } from '../cases/types'
import { CURRENT_SAVE_VERSION, migrateGameSave } from '../engine/persistence'

interface SavePackageEnvelope {
  kind: 'ldmsave'
  formatVersion: 1
  caseId: string
  caseVersion: string
  exportedAt: string
  save: GameSave
}

const encoder = new TextEncoder()
const decoder = new TextDecoder()

export function exportSavePackage(save: GameSave, caseVersion: string, now = new Date().toISOString()) {
  const envelope: SavePackageEnvelope = { kind: 'ldmsave', formatVersion: 1, caseId: save.caseId, caseVersion, exportedAt: now, save: migrateGameSave(save, save.caseId) }
  return { filename: `${save.caseId}-progress.ldmsave`, bytes: encoder.encode(`${JSON.stringify(envelope, null, 2)}\n`) }
}

export function importSavePackage(bytes: Uint8Array, filename: string): { save: GameSave; caseVersion: string; exportedAt: string } {
  if (!filename.toLowerCase().endsWith('.ldmsave')) throw new Error('请选择.ldmsave玩家进度备份。')
  if (bytes.length > 5 * 1024 * 1024) throw new Error('玩家进度备份超过5MB限制。')
  let raw: unknown
  try { raw = JSON.parse(decoder.decode(bytes)) as unknown } catch { throw new Error('玩家进度备份不是有效JSON。') }
  if (!raw || typeof raw !== 'object') throw new Error('玩家进度备份结构无效。')
  const value = raw as Partial<SavePackageEnvelope>
  if (value.kind !== 'ldmsave' || value.formatVersion !== 1 || typeof value.caseId !== 'string' || !value.caseId || typeof value.caseVersion !== 'string' || typeof value.exportedAt !== 'string' || !value.save || typeof value.save !== 'object') throw new Error('不支持的玩家进度备份格式。')
  if ((value.save as Partial<GameSave>).caseId !== value.caseId) throw new Error('玩家进度与案件ID不一致。')
  const save = migrateGameSave(value.save, value.caseId)
  if (save.saveVersion !== CURRENT_SAVE_VERSION) throw new Error('玩家进度迁移失败。')
  return { save, caseVersion: value.caseVersion, exportedAt: value.exportedAt }
}
