import { describe, expect, it } from 'vitest'
import { caseDefinition as case002 } from '../cases/case-002/case'
import { caseDefinition as case001 } from '../cases/case-001/case'
import { getRuntimeAppRegistry } from './appRegistry'

describe('getRuntimeAppRegistry', () => {
  it('derives application descriptions from the active case data', () => {
    const descriptions = Object.fromEntries(getRuntimeAppRegistry(case002).map((app) => [app.id, app.description]))

    expect(descriptions).toMatchObject({
      files: '3 个文件项目',
      messages: '1 个会话',
      mail: '2 封邮件',
      photos: '1 张档案照片',
      browser: '1 条本地记录',
      calendar: '2032 年 4 月',
      recycle: '0 个保留项目',
      logs: '1 条系统事件',
      evidence: '6 条可记录线索',
    })
    expect(Object.values(descriptions).join(' ')).not.toContain('2031 年 11 月')
  })

  it('describes only currently visible recycle items', () => {
    const initial = Object.fromEntries(getRuntimeAppRegistry(case001, { unlockedItemIds: [], restoredItemIds: [] }).map((app) => [app.id, app.description]))
    const restored = Object.fromEntries(getRuntimeAppRegistry(case001, { unlockedItemIds: [], restoredItemIds: ['farewell-v3'] }).map((app) => [app.id, app.description]))

    expect(initial.recycle).toBe('5 个保留项目')
    expect(restored.recycle).toBe('4 个保留项目')
  })
})
