import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'

function watchErrors(page: Page) {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()) })
  return errors
}

async function startCase(page: Page) {
  await page.goto('/')
  await page.getByRole('button', { name: /查看案件|继续调查/ }).click()
  await page.getByRole('button', { name: /开始调查|继续调查/ }).click()
  await page.getByRole('button', { name: '跳过启动' }).click()
  await page.getByRole('button', { name: '恢复上次会话' }).click()
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

async function discoverSix(page: Page) {
  await openApp(page, '邮件'); await page.getByRole('button', { name: /HX217 订单取消成功/ }).click(); await closeApp(page, '邮件')
  await openApp(page, '讯息'); await page.getByRole('button', { name: /周屿 · 23:12/ }).click(); await closeApp(page, '讯息')
  await openApp(page, '照片'); await page.getByRole('button', { name: /IMG_1117_发给唐遥/ }).click(); await page.getByRole('button', { name: '查看元数据' }).click(); await closeApp(page, '照片')
  await openApp(page, '浏览记录'); await page.getByRole('button', { name: /如何保留照片画面但更改拍摄时间/ }).click(); await closeApp(page, '浏览记录')
  await openApp(page, '回收站'); await page.getByRole('button', { name: /告别信_v3/ }).click(); await closeApp(page, '回收站')
  await openApp(page, '日历'); await page.getByRole('button', { name: '林然生日' }).click(); await closeApp(page, '日历')
}

test('museum to case detail to desktop and core system surfaces', async ({ page }) => {
  const errors = watchErrors(page)
  await page.goto('/')
  await page.screenshot({ path: 'docs/images/stage2-museum-home.png', fullPage: true })
  await page.getByRole('button', { name: '查看案件' }).click()
  await page.screenshot({ path: 'docs/images/stage2-case-detail.png', fullPage: true })
  await page.getByRole('button', { name: '开始调查' }).click(); await page.getByRole('button', { name: '跳过启动' }).click(); await page.getByRole('button', { name: '恢复上次会话' }).click(); await page.getByRole('button', { name: '跳过介绍' }).click()
  await page.screenshot({ path: 'docs/images/stage2-desktop.png', fullPage: true })
  await openApp(page, '我的文件')
  await page.screenshot({ path: 'docs/images/stage2-file-explorer.png', fullPage: true })
  for (const viewport of [{ width: 1366, height: 768 }, { width: 1280, height: 720 }]) {
    await page.setViewportSize(viewport)
    const box = await page.getByRole('dialog', { name: '我的文件' }).boundingBox()
    expect(box?.x).toBeGreaterThanOrEqual(0); expect(box?.y).toBeGreaterThanOrEqual(0)
    expect((box?.x ?? 0) + (box?.width ?? 0)).toBeLessThanOrEqual(viewport.width)
    expect((box?.y ?? 0) + (box?.height ?? 0)).toBeLessThanOrEqual(viewport.height)
  }
  await page.setViewportSize({ width: 1440, height: 900 }); await closeApp(page, '我的文件')
  await page.getByRole('button', { name: 'A/OS 系统菜单' }).click()
  await expect(page.getByRole('menu', { name: 'A/OS 系统菜单' })).toBeVisible()
  await page.screenshot({ path: 'docs/images/stage2-system-menu.png', fullPage: true })
  expect(errors).toEqual([])
})

test('discovers representative clues across six distinct applications', async ({ page }) => {
  const errors = watchErrors(page); await startCase(page)
  await openApp(page, '邮件'); await page.getByRole('button', { name: /HX217 订单取消成功/ }).click(); await page.screenshot({ path: 'docs/images/stage2-mail.png', fullPage: true }); await closeApp(page, '邮件')
  await openApp(page, '讯息'); await page.getByRole('button', { name: /周屿 · 23:12/ }).click(); await closeApp(page, '讯息')
  await openApp(page, '照片'); await page.getByRole('button', { name: /IMG_1117_发给唐遥/ }).click(); await page.getByRole('button', { name: '查看元数据' }).click(); await expect(page.getByText('2031-08-03 18:46')).toBeVisible(); await page.screenshot({ path: 'docs/images/stage2-photo-metadata.png', fullPage: true }); await closeApp(page, '照片')
  await openApp(page, '浏览记录'); await page.getByRole('button', { name: /如何保留照片画面但更改拍摄时间/ }).click(); await closeApp(page, '浏览记录')
  await openApp(page, '回收站'); await page.getByRole('button', { name: /告别信_v3/ }).click(); await closeApp(page, '回收站')
  await openApp(page, '日历'); await page.getByRole('button', { name: '林然生日' }).click(); await closeApp(page, '日历')
  await expect(page.getByRole('button', { name: /已记录 6 \/ 12/ })).toBeVisible()
  expect(errors).toEqual([])
})

test('saves, returns to the museum, reloads and resumes progress', async ({ page }) => {
  const errors = watchErrors(page); await startCase(page)
  await openApp(page, '邮件'); await page.getByRole('button', { name: /HX217 订单取消成功/ }).click(); await closeApp(page, '邮件')
  await page.getByRole('button', { name: 'A/OS 系统菜单' }).click(); await page.getByRole('menuitem', { name: /保存并返回展馆/ }).click()
  await expect(page.getByRole('button', { name: '继续调查' })).toBeVisible()
  await page.reload(); await page.getByRole('button', { name: '继续调查' }).click(); await page.getByRole('button', { name: '继续调查' }).click(); await page.getByRole('button', { name: '跳过启动' }).click(); await page.getByRole('button', { name: '恢复上次会话' }).click()
  await expect(page.getByRole('button', { name: /已记录 1 \/ 12/ })).toBeVisible()
  expect(errors).toEqual([])
})

test('connects evidence, submits a deduction and reaches the result phase', async ({ page }) => {
  const errors = watchErrors(page); await startCase(page); await discoverSix(page)
  await openApp(page, '证据板')
  for (const id of ['C01', 'C02', 'C03', 'C04', 'C05', 'C06']) await page.getByRole('button', { name: `标记 ${id} 为关键证据` }).click()
  await page.getByLabel('关系起点').selectOption('C01'); await page.getByLabel('关系终点').selectOption('C02'); await page.getByRole('button', { name: '连接' }).click()
  await page.screenshot({ path: 'docs/images/stage2-evidence-board.png', fullPage: true })
  await page.getByRole('button', { name: '打开最终推理' }).click()
  await page.getByLabel('主动制造已经离开的假象').check(); await page.getByLabel('周屿的住所').check(); await page.getByLabel('周屿准备使用的新身份').check(); await page.getByLabel('个人推理（只保存在本地）').fill('航班取消与旧照片证明周屿制造了出发假象，住所网络的新身份登录显示他仍在本地。'); await page.getByRole('button', { name: '提交推理' }).click()
  await expect(page.getByText('档案重建完成')).toBeVisible()
  await expect(page.getByRole('button', { name: '保存并返回展馆' })).toBeVisible()
  expect(errors).toEqual([])
})
