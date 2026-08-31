import { expect, test } from '@playwright/test'

test.skip('captures the historical v0.1.0 baseline at required desktop widths', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()) })

  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/')
  await expect(page.getByRole('heading', { name: '遗失电脑博物馆' })).toBeVisible()
  await page.screenshot({ path: 'docs/images/stage2-before-home.png', fullPage: true })

  await page.getByRole('button', { name: '跳过启动' }).click()
  await page.getByRole('button', { name: '进入调查桌面' }).click()
  await expect(page.getByTestId('desktop')).toBeVisible()
  await page.screenshot({ path: 'docs/images/stage2-before-desktop.png', fullPage: true })

  await page.getByRole('button', { name: '我的文件', exact: true }).click()
  const fileWindow = page.locator('section.app-window').filter({ has: page.getByRole('heading', { name: '我的文件' }) })
  await expect(fileWindow).toBeVisible()
  await page.screenshot({ path: 'docs/images/stage2-before-app.png', fullPage: true })

  for (const viewport of [{ width: 1366, height: 768 }, { width: 1280, height: 720 }]) {
    await page.setViewportSize(viewport)
    await expect(fileWindow).toBeVisible()
    const box = await fileWindow.boundingBox()
    expect(box?.x).toBeGreaterThanOrEqual(0)
    expect(box?.y).toBeGreaterThanOrEqual(0)
    expect((box?.x ?? 0) + (box?.width ?? 0)).toBeLessThanOrEqual(viewport.width)
    expect((box?.y ?? 0) + (box?.height ?? 0)).toBeLessThanOrEqual(viewport.height)
  }

  expect(errors).toEqual([])
})
