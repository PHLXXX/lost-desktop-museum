import { expect, test, type Page } from '@playwright/test'
import { readFile } from 'node:fs/promises'

function watchErrors(page: Page) {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()) })
  return errors
}

async function enterFirstCase(page: Page) {
  await page.goto('/')
  await page.getByRole('button', { name: '查看案件简介' }).click()
  await page.getByRole('button', { name: '开始调查' }).click()
  await page.getByRole('button', { name: '跳过启动' }).click()
  await page.getByRole('button', { name: '进入调查桌面' }).click()
  const onboarding = page.getByRole('button', { name: '跳过介绍' })
  if (await onboarding.count()) await onboarding.click()
  await expect(page.getByTestId('desktop')).toBeVisible()
}

async function openApp(page: Page, name: string) {
  await page.getByRole('button', { name, exact: true }).dblclick()
  await expect(page.getByRole('dialog', { name })).toBeVisible()
}

async function closeApp(page: Page, name: string) {
  await page.getByRole('button', { name: `关闭 ${name}` }).click()
}

async function discoverAllClues(page: Page) {
  await openApp(page, '邮件')
  await page.getByRole('button', { name: /HX217 订单取消成功/ }).click()
  await closeApp(page, '邮件')
  await openApp(page, '讯息')
  await page.getByRole('button', { name: /周屿 · 23:12/ }).click()
  await closeApp(page, '讯息')
  await openApp(page, '照片')
  await page.getByRole('button', { name: /IMG_1117_发给唐遥/ }).click()
  await page.getByRole('button', { name: '查看元数据' }).click()
  await closeApp(page, '照片')
  await openApp(page, '浏览记录')
  await page.getByRole('button', { name: /如何保留照片画面但更改拍摄时间/ }).click()
  await closeApp(page, '浏览记录')
  await openApp(page, '回收站')
  await page.getByRole('button', { name: /告别信_v3/ }).click()
  await closeApp(page, '回收站')
  await openApp(page, '日历')
  await page.getByRole('button', { name: '林然生日' }).click()
  await closeApp(page, '日历')
  await openApp(page, '系统日志')
  await page.getByRole('button', { name: /创建隐藏用户 LINRAN/ }).click()
  await page.getByRole('button', { name: /HOME-NET-5G/ }).click()
  await closeApp(page, '系统日志')
  await openApp(page, '邮件')
  await page.getByRole('button', { name: /草稿/ }).click()
  await page.getByRole('button', { name: /给妈妈/ }).click()
  await page.getByRole('button', { name: /收件箱/ }).click()
  await page.getByRole('button', { name: /北岸酒店预订成功/ }).click()
  await closeApp(page, '邮件')
  await openApp(page, '讯息')
  await page.getByRole('button', { name: /房东陈女士/ }).click()
  await page.getByRole('button', { name: /陈女士 · 23:31/ }).click()
  await closeApp(page, '讯息')
  await openApp(page, '我的文件')
  await page.getByRole('button', { name: /不要打开/ }).click()
  await page.getByRole('button', { name: /mirror\.lock/ }).dblclick()
  await page.getByRole('textbox', { name: 'mirror.lock 密码' }).fill('1119')
  await page.getByRole('button', { name: '解锁' }).click()
  await expect(page.getByText(/mirror\.lock 已解锁/)).toBeVisible()
  await page.getByRole('button', { name: /录音/ }).click()
  await page.getByRole('button', { name: /录音_2316/ }).dblclick()
  await page.getByRole('button', { name: '辅助转写' }).click()
  await closeApp(page, '我的文件')
  await expect(page.getByRole('button', { name: /已记录 12 \/ 12/ })).toBeVisible()
}

async function buildCompleteDeduction(page: Page) {
  await openApp(page, '证据板')
  for (const id of ['C01', 'C02', 'C03', 'C05', 'C08', 'C09']) {
    await page.getByRole('button', { name: `标记 ${id} 为关键证据` }).click()
  }
  for (const [from, to] of [['C01', 'C02'], ['C03', 'C04']]) {
    await page.getByLabel('关系起点').selectOption(from)
    await page.getByLabel('关系终点').selectOption(to)
    await page.getByRole('button', { name: '连接' }).click()
  }
  await page.getByRole('button', { name: '打开最终推理' }).click()
  await page.getByLabel('主动制造已经离开的假象').check()
  await page.getByLabel('周屿的住所').check()
  await page.getByLabel('周屿准备使用的新身份').check()
  await page.getByLabel('个人推理（只保存在本地）').fill('取消的航班、旧照片、住宅网络登录和录音环境形成互相校验的证据链。')
  await page.getByRole('button', { name: '提交推理' }).click()
}

test('objectives, finite hints, mastery report and restart form a replayable loop', async ({ page }) => {
  test.setTimeout(60_000)
  const errors = watchErrors(page)
  await enterFirstCase(page)

  await page.getByRole('button', { name: /调查目标 0\/3/ }).click()
  const panel = page.getByRole('dialog', { name: '深度调查' })
  await expect(panel).toContainText('核对离开叙述')
  await page.screenshot({ path: 'docs/images/stage6-investigation-objectives.png', fullPage: true })
  await panel.getByRole('tab', { name: '分析提示' }).click()
  await expect(panel).toContainText('剩余 3 / 3')
  const flightHint = panel.locator('.hint-entry').filter({ hasText: '行程状态' })
  await flightHint.getByRole('button', { name: '使用 1 点分析' }).click()
  await page.getByRole('dialog', { name: '使用分析提示？' }).getByRole('button', { name: '显示提示' }).click()
  await expect(panel).toContainText('剩余 2 / 3')
  await expect(flightHint).toContainText('先确认计划中的交通工具是否仍然有效。')
  await page.screenshot({ path: 'docs/images/stage6-analysis-hints.png', fullPage: true })
  await page.keyboard.press('Escape')
  await expect(panel).toBeHidden()

  await openApp(page, '邮件')
  await page.getByRole('button', { name: /HX217 订单取消成功/ }).click()
  await closeApp(page, '邮件')
  await page.getByRole('button', { name: /调查目标 \d+\/\d+/ }).click()
  await panel.getByRole('tab', { name: '分析提示' }).click()
  await expect(flightHint).toContainText('已记录')
  await expect(flightHint).toContainText('先确认计划中的交通工具是否仍然有效。')
  await page.keyboard.press('Escape')

  await discoverAllClues(page)
  await buildCompleteDeduction(page)
  const result = page.locator('.result-screen')
  await expect(result).toContainText('档案重建完成')
  await expect(result).toContainText('目标完成 5 / 5')
  await expect(result).toContainText('本次挑战 4 / 5')
  await expect(result).toContainText('使用提示 1 层')
  await expect(result).toContainText('完整归档注记')
  await page.screenshot({ path: 'docs/images/stage6-investigation-report.png', fullPage: true })

  await page.getByRole('button', { name: '保存并返回档案馆' }).click()
  const caseRow = page.locator('.exhibit-row').filter({ hasText: '没有出发的旅行' })
  await expect(caseRow).toContainText('专精 4 / 5')
  await caseRow.getByRole('button', { name: '重新调查' }).click()
  await page.getByRole('dialog', { name: '重新开始调查？' }).getByRole('button', { name: '清除进度并重新开始' }).click()
  await expect(page.getByRole('heading', { name: '没有出发的旅行' })).toBeVisible()
  await page.getByRole('button', { name: '← 返回档案馆' }).click()
  await expect(caseRow).toContainText('专精 4 / 5')

  await caseRow.getByRole('button', { name: '查看案件简介' }).click()
  await page.getByRole('button', { name: '开始调查' }).click()
  await page.getByRole('button', { name: '跳过启动' }).click()
  await page.getByRole('button', { name: '进入调查桌面' }).click()
  await page.getByRole('button', { name: /调查目标 0\/3/ }).click()
  await panel.getByRole('tab', { name: '分析提示' }).click()
  await expect(panel).toContainText('剩余 3 / 3')
  expect(errors).toEqual([])
})

test('completion rewards persist across theme reload and case restart', async ({ page }) => {
  test.setTimeout(75_000)
  const errors = watchErrors(page)
  await enterFirstCase(page)
  await discoverAllClues(page)
  await buildCompleteDeduction(page)

  const result = page.locator('.result-screen')
  await expect(result).toContainText('本次通关奖励')
  await expect(result).toContainText('未启程登机牌')
  await expect(result).toContainText('独立调查员')
  await expect(result).toContainText('候机厅夜色')
  await expect(result.getByText('首次解锁')).toHaveCount(3)
  await result.locator('.result-rewards').scrollIntoViewIfNeeded()
  await page.screenshot({ path: 'docs/images/stage6-completion-rewards.png', fullPage: true })

  await page.getByRole('button', { name: '保存并返回档案馆' }).click()
  const caseRow = page.locator('.exhibit-row').filter({ hasText: '没有出发的旅行' })
  await expect(caseRow).toContainText('奖励 3 / 3')
  await page.getByRole('button', { name: '馆藏奖励' }).click()
  const collection = page.getByRole('dialog', { name: '馆藏奖励' })
  await expect(collection.getByText('3 / 6', { exact: true })).toBeVisible()
  await collection.getByRole('button', { name: '装备 候机厅夜色' }).click()
  await expect(collection.getByRole('button', { name: '当前使用 候机厅夜色' })).toBeVisible()
  await expect.poll(() => page.locator('html').getAttribute('data-archive-theme')).toBe('departure-night')
  await page.screenshot({ path: 'docs/images/stage6-reward-collection.png', fullPage: true })

  await page.reload()
  await expect.poll(() => page.locator('html').getAttribute('data-archive-theme')).toBe('departure-night')
  await page.getByRole('button', { name: '馆藏奖励' }).click()
  await expect(page.getByRole('dialog', { name: '馆藏奖励' }).getByRole('button', { name: '当前使用 候机厅夜色' })).toBeVisible()
  await page.getByRole('dialog', { name: '馆藏奖励' }).getByRole('button', { name: '返回档案馆' }).click()

  await caseRow.getByRole('button', { name: '重新调查' }).click()
  await page.getByRole('dialog', { name: '重新开始调查？' }).getByRole('button', { name: '清除进度并重新开始' }).click()
  await page.getByRole('button', { name: '← 返回档案馆' }).click()
  await expect(caseRow).toContainText('奖励 3 / 3')
  await page.getByRole('button', { name: '馆藏奖励' }).click()
  await expect(page.getByRole('dialog', { name: '馆藏奖励' })).toContainText('未启程登机牌')
  expect(errors).toEqual([])
})

test('a pre-gameplay ldmcase imports with generated objectives and hints', async ({ page }) => {
  const errors = watchErrors(page)
  await page.goto('/')
  const bytes = await readFile('tests/fixtures/community/packages/valid-1.0.0.ldmcase')
  await page.locator('input[type="file"][accept*=".ldmcase"]').setInputFiles({
    name: 'legacy-community-case.ldmcase',
    mimeType: 'application/zip',
    buffer: bytes,
  })
  await expect(page.getByText(/已安装案件：消失的备用钥匙/)).toBeVisible()
  const row = page.locator('.exhibit-row').filter({ hasText: '消失的备用钥匙' })
  await row.getByRole('button', { name: /查看 消失的备用钥匙 案件简介/ }).click()
  await expect(page.getByRole('heading', { name: '深度调查规则' })).toBeVisible()
  await expect(page.getByText('独立分析')).toBeVisible()
  await expect(page.getByText('独立受训员')).toHaveCount(0)
  await page.getByRole('button', { name: '开始调查' }).click()
  await page.getByRole('button', { name: '跳过启动' }).click()
  await page.getByRole('button', { name: '进入调查桌面' }).click()
  const onboarding = page.getByRole('button', { name: '跳过介绍' })
  if (await onboarding.count()) await onboarding.click()
  await page.getByRole('button', { name: /调查目标 0\/3/ }).click()
  const panel = page.getByRole('dialog', { name: '深度调查' })
  await panel.getByRole('tab', { name: '分析提示' }).click()
  await expect(panel).toContainText('剩余 3 / 3')
  const generatedHint = panel.locator('.hint-entry').filter({ hasText: '未解记录 01' })
  await generatedHint.getByRole('button', { name: '使用 1 点分析' }).click()
  await page.getByRole('dialog', { name: '使用分析提示？' }).getByRole('button', { name: '显示提示' }).click()
  await expect(generatedHint).toContainText('留意「文件管理器」中的可验证记录。')
  expect(errors).toEqual([])
})
