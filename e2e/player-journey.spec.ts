import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'

async function openApp(page: Page, name: string) {
  await page.getByRole('button', { name, exact: true }).first().click()
}

async function closeApp(page: Page, name: string) {
  await page.getByRole('button', { name: `关闭 ${name}` }).click()
}

test('completes the first archive from boot to deduction', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()) })
  await page.goto('/')
  await page.getByRole('button', { name: '跳过启动' }).click()
  await page.getByRole('button', { name: '恢复上次会话' }).click()
  await expect(page.getByTestId('desktop')).toBeVisible()
  await page.screenshot({ path: 'docs/images/desktop.png', fullPage: true })

  await openApp(page, '邮件')
  await page.getByRole('button', { name: /HX217 订单取消成功/ }).click()
  await closeApp(page, '邮件')

  await openApp(page, '讯息')
  await page.getByRole('button', { name: /周屿 · 23:12/ }).click()
  await closeApp(page, '讯息')

  await openApp(page, '照片')
  await page.getByRole('button', { name: '下一张' }).click()
  await page.getByRole('button', { name: '查看元数据' }).click()
  await expect(page.getByText('2031-08-03 18:46')).toBeVisible()
  await closeApp(page, '照片')

  await openApp(page, '浏览记录')
  await page.getByRole('button', { name: /如何保留照片画面但更改拍摄时间/ }).click()
  await closeApp(page, '浏览记录')

  await openApp(page, '回收站')
  await page.getByRole('button', { name: /告别信_v3/ }).click()
  await closeApp(page, '回收站')

  await openApp(page, '日历')
  await page.getByRole('button', { name: /林然生日/ }).click()
  await closeApp(page, '日历')

  await expect(page.getByText('6 / 12')).toBeVisible()
  await openApp(page, '我的文件')
  await page.getByRole('button', { name: '不要打开' }).click()
  await page.getByRole('button', { name: /mirror.lock/ }).click()
  await page.getByLabel('mirror.lock 密码').fill('1119')
  await page.getByRole('button', { name: '解锁' }).click()
  await expect(page.getByText(/发现 3 个身份档案/)).toBeVisible()
  await closeApp(page, '我的文件')

  await openApp(page, '系统日志')
  await page.getByRole('button', { name: /创建隐藏用户 LINRAN/ }).click()
  await page.getByRole('button', { name: /HOME-NET-5G/ }).click()
  await closeApp(page, '系统日志')

  await openApp(page, '证据板')
  for (const id of ['C01', 'C02', 'C03', 'C05', 'C08', 'C09']) {
    if (await page.getByRole('button', { name: `标记 ${id} 为关键证据` }).count()) await page.getByRole('button', { name: `标记 ${id} 为关键证据` }).click()
  }
  await page.getByLabel('关系起点').selectOption('C01'); await page.getByLabel('关系终点').selectOption('C02'); await page.getByRole('button', { name: '连接' }).click()
  await page.getByLabel('关系起点').selectOption('C03'); await page.getByLabel('关系终点').selectOption('C04'); await page.getByRole('button', { name: '连接' }).click()
  await page.locator('.evidence-workspace').evaluate((element) => { element.scrollTop = 0 })
  await page.screenshot({ path: 'docs/images/evidence-board.png', fullPage: true })
  const firstCard = page.locator('.evidence-card').first()
  const beforeDrag = await firstCard.boundingBox()
  if (!beforeDrag) throw new Error('Evidence card has no bounding box')
  await firstCard.locator('.card-drag-handle').dragTo(page.getByTestId('evidence-board'), { targetPosition: { x: 620, y: 300 } })
  const afterDrag = await firstCard.boundingBox()
  expect(afterDrag?.x).not.toBe(beforeDrag.x)
  await page.getByRole('button', { name: '打开最终推理' }).click()
  await page.getByLabel('主动制造已经离开的假象').check()
  await page.getByLabel('周屿的住所').check()
  await page.getByLabel('周屿准备使用的新身份').check()
  await page.getByLabel('个人推理（只保存在本地）').fill('周屿制造了出发假象，并在住所启用了林然身份。')
  await page.getByRole('button', { name: '提交推理' }).click()
  await expect(page.getByText('档案重建完成')).toBeVisible()
  expect(errors).toEqual([])
})

test('restores progress after refresh and resets safely', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: '跳过启动' }).click(); await page.getByRole('button', { name: '恢复上次会话' }).click()
  await openApp(page, '邮件'); await page.getByRole('button', { name: /HX217 订单取消成功/ }).click()
  await page.reload(); await page.getByRole('button', { name: '跳过启动' }).click(); await page.getByRole('button', { name: '恢复上次会话' }).click()
  await expect(page.getByText('1 / 12')).toBeVisible()
  await openApp(page, '设置'); await page.getByRole('button', { name: '重置案件' }).click(); await page.keyboard.press('Escape'); await expect(page.getByRole('dialog', { name: '确认重置案件' })).toHaveCount(0)
  await page.getByRole('button', { name: '重置案件' }).click(); await page.getByRole('button', { name: '再次确认重置' }).click()
  await expect(page.getByText('0 / 12')).toBeVisible()
})
