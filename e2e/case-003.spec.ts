import { expect, test, type Page } from '@playwright/test'

function watchErrors(page: Page) {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()) })
  return errors
}

async function openApp(page: Page, name: string) {
  await page.getByRole('button', { name, exact: true }).dblclick()
  await expect(page.getByRole('dialog', { name })).toBeVisible()
}

async function closeApp(page: Page, name: string) {
  await page.getByRole('button', { name: `关闭 ${name}` }).click()
}

async function enterCase003(page: Page) {
  await page.goto('/#/museum')
  const row = page.locator('.exhibit-row').filter({ hasText: '编号之外' })
  await expect(row).toBeVisible()
  await row.scrollIntoViewIfNeeded()
  await page.screenshot({ path: 'docs/images/stage6-case003-museum.png' })
  await row.getByRole('button', { name: '查看 编号之外 案件简介' }).click()
  await expect(page.getByRole('heading', { name: '编号之外' })).toBeVisible()
  await page.getByRole('button', { name: '开始调查' }).click()
  await page.getByRole('button', { name: '跳过启动' }).click()
  await page.getByRole('button', { name: '进入调查桌面' }).click()
  const onboarding = page.getByRole('button', { name: '跳过介绍' })
  if (await onboarding.count()) await onboarding.click()
  await expect(page.getByTestId('desktop')).toBeVisible()
}

async function discoverFirstTwoExtendedClues(page: Page) {
  await openApp(page, '版本差异')
  await page.getByRole('button', { name: '核验差异' }).click()
  await closeApp(page, '版本差异')
  await openApp(page, '维护终端')
  await page.getByRole('button', { name: 'queue --inspect A-731' }).click()
  const clueToast = page.getByRole('status', { name: '线索通知' })
  await expect(clueToast).toContainText('新证据已记录')
  await expect(clueToast).toContainText('打印队列残留')
  await page.screenshot({ path: 'docs/images/stage6-case003-investigation.png', fullPage: true })
  await closeApp(page, '维护终端')
  await expect(page.getByRole('button', { name: /已记录 2 \/ 10/ })).toBeVisible()
}

async function discoverRemainingClues(page: Page) {
  await openApp(page, '我的文件')
  await page.getByRole('button', { name: /A-731_封存清单/ }).dblclick()
  await closeApp(page, '我的文件')

  await openApp(page, '藏品数据台')
  await page.getByRole('button', { name: '核验数据表' }).click()
  await closeApp(page, '藏品数据台')

  await openApp(page, '系统日志')
  await page.getByRole('button', { name: /QIAO\.WEN.*EAST-B2-MAINT/ }).click()
  await closeApp(page, '系统日志')

  await openApp(page, '讯息')
  await page.getByRole('button', { name: /乔文 · 21:12/ }).click()
  await closeApp(page, '讯息')

  await openApp(page, '邮件')
  await page.getByRole('button', { name: /草稿/ }).click()
  await page.getByRole('button', { name: /临时离库单 \/ R-731 \/ 外部修复/ }).click()
  await closeApp(page, '邮件')

  await openApp(page, '日历')
  await page.getByRole('button', { name: '运输安排：无' }).click()
  await closeApp(page, '日历')

  await openApp(page, '照片')
  await page.getByRole('button', { name: /R-731_标签复核/ }).click()
  await page.getByRole('button', { name: '查看元数据' }).click()
  await closeApp(page, '照片')

  await openApp(page, '馆区地图')
  await page.getByRole('button', { name: '东货梯' }).click()
  await closeApp(page, '馆区地图')

  await expect(page.getByRole('button', { name: /已记录 10 \/ 10/ })).toBeVisible()
}

async function submitCompleteDeduction(page: Page) {
  await openApp(page, '证据板')
  for (const id of ['C01', 'C02', 'C03', 'C04', 'C06', 'C07']) {
    await page.getByRole('button', { name: `标记 ${id} 为关键证据` }).click()
  }
  for (const [from, to] of [['C01', 'C02'], ['C06', 'C07']]) {
    await page.getByLabel('关系起点').selectOption(from)
    await page.getByLabel('关系终点').selectOption(to)
    await page.getByRole('button', { name: '连接' }).click()
  }
  await page.getByRole('button', { name: '打开最终推理' }).click()
  await page.getByLabel('A-731 原件被标成 R-731 复制品').check()
  await page.getByLabel('让原件以复制品身份通过临时修复运输离馆').check()
  await page.getByLabel('乔文账户参与数字操作链，实物搬运者仍需核验').check()
  await page.getByLabel('个人推理（只保存在本地）').fill('封存清单与目录修订矛盾；维护认证、标签队列和未获批离库路线形成连续记录，但账户不能单独证明实际搬运者。')
  await page.getByRole('button', { name: '提交推理' }).click()
}

test('case 003 restores a saved investigation and completes through extended archive tools', async ({ page }) => {
  test.setTimeout(90_000)
  const errors = watchErrors(page)

  await enterCase003(page)
  await discoverFirstTwoExtendedClues(page)

  await page.keyboard.press('Escape')
  await page.getByRole('menuitem', { name: /保存并返回档案馆/ }).click()
  const row = page.locator('.exhibit-row').filter({ hasText: '编号之外' })
  await expect(row).toContainText('2 / 10')

  await row.getByRole('button', { name: '继续调查 编号之外' }).click()
  await expect(page.getByTestId('desktop')).toBeVisible()
  await expect(page.getByRole('button', { name: /已记录 2 \/ 10/ })).toBeVisible()
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('archive-os:case:case-003') ?? '{}'))
  expect(saved.discoveredClueIds).toEqual(expect.arrayContaining(['C02', 'C10']))

  await discoverRemainingClues(page)
  await submitCompleteDeduction(page)

  const result = page.locator('.result-screen')
  await expect(result).toContainText('馆藏链已还原')
  await expect(result).toContainText('已发现 10/10 条线索')
  await expect(result).toContainText('目标完成 5 / 5')
  await expect(result).toContainText('本次挑战 5 / 5')
  await expect(result).toContainText('首席馆藏审计注记')
  await expect(result).toContainText('双层藏品标签')
  await expect(result).toContainText('目录核验员')
  await expect(result).toContainText('无痕复核')
  await result.locator('.result-rewards').scrollIntoViewIfNeeded()
  await page.screenshot({ path: 'docs/images/stage6-case003-result.png' })

  await page.getByRole('button', { name: '保存并返回档案馆' }).click()
  await expect(row).toContainText('奖励 3 / 3')
  expect(errors).toEqual([])
})
