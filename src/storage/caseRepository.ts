import { builtInCaseIds } from '../cases/registry'
import type { CaseDefinition } from '../cases/types'
import { validateCaseDefinition } from '../engine/validation'
import { IndexedDbRepository, type KeyValueRepository } from './indexedDb'

export interface InstalledCaseRecord { id: string; installedAt: string; definition: CaseDefinition }
export interface CaseRepository { install(definition: CaseDefinition): Promise<void>; remove(caseId: string): Promise<void>; list(): Promise<CaseDefinition[]>; get(caseId: string): Promise<CaseDefinition | null> }

export class InMemoryCaseRepository implements CaseRepository {
  private cases = new Map<string, CaseDefinition>()
  async install(definition: CaseDefinition) {
    if (builtInCaseIds.includes(definition.id)) throw new Error('不能覆盖内置案件。')
    const errors = validateCaseDefinition(definition).filter((issue) => issue.severity === 'error')
    if (errors.length) throw new Error(`案件校验失败：${errors.map((issue) => issue.message).join('；')}`)
    this.cases.set(definition.id, structuredClone(definition))
  }
  async remove(caseId: string) { this.cases.delete(caseId) }
  async list() { return [...this.cases.values()].map((value) => structuredClone(value)) }
  async get(caseId: string) { return this.cases.has(caseId) ? structuredClone(this.cases.get(caseId)!) : null }
}

export class BrowserCaseRepository implements CaseRepository {
  constructor(private adapter: KeyValueRepository<InstalledCaseRecord> = new IndexedDbRepository('lost-desktop-museum-v4-cases', 'installed-cases', 'id')) {}
  async install(definition: CaseDefinition) {
    if (builtInCaseIds.includes(definition.id)) throw new Error('不能覆盖内置案件。')
    const errors = validateCaseDefinition(definition).filter((issue) => issue.severity === 'error')
    if (errors.length) throw new Error(`案件校验失败：${errors.map((issue) => issue.message).join('；')}`)
    await this.adapter.set(definition.id, { id: definition.id, installedAt: new Date().toISOString(), definition })
  }
  remove(caseId: string) { return this.adapter.delete(caseId) }
  async list() { return (await this.adapter.list()).map((record) => record.definition) }
  async get(caseId: string) { return (await this.adapter.get(caseId))?.definition ?? null }
}

export const caseRepository: CaseRepository = typeof indexedDB === 'undefined' ? new InMemoryCaseRepository() : new BrowserCaseRepository()
