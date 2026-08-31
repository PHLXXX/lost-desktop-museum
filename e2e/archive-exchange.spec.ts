import { expect, test } from '@playwright/test'

test.describe('Archive Exchange', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.evaluate(async () => { localStorage.clear(); for (const database of await indexedDB.databases()) if (database.name) indexedDB.deleteDatabase(database.name) })
    await page.reload()
  })

  test('browses verifies installs and starts the community sample', async ({ page }) => {
    await page.getByRole('button', { name: '社区档案' }).click()
    await expect(page.getByText('社区目录可用')).toBeVisible()
    await page.getByLabel('搜索社区案件').fill('备用钥匙')
    await page.getByRole('button', { name: /消失的备用钥匙/ }).click()
    await expect(page.getByRole('heading', { name: '消失的备用钥匙' })).toBeVisible()
    await expect(page.getByText('自动校验可以降低格式和执行风险')).toBeVisible()
    await page.getByRole('complementary').getByRole('button', { name: '安装到档案馆' }).click()
    await expect(page.getByRole('dialog', { name: /安装到档案馆/ })).toContainText('确认后才会下载完整案件包')
    await page.getByRole('button', { name: '下载并验证' }).click()
    await expect(page.getByText(/SHA-256 匹配/)).toBeVisible()
    await page.getByRole('dialog', { name: /安装到档案馆/ }).getByRole('button', { name: '安装到档案馆', exact: true }).click()
    await expect(page.getByRole('dialog', { name: '安装成功' })).toBeVisible()
    await page.getByRole('button', { name: '查看我的档案' }).click()
    await expect(page.getByText('社区档案', { exact: true }).last()).toBeVisible()
    await page.getByRole('button', { name: /查看 消失的备用钥匙 案件简介/ }).click()
    await expect(page.getByRole('heading', { name: '消失的备用钥匙' })).toBeVisible()
  })

  test('deep link loads details but does not download a package', async ({ page }) => {
    let packageRequests = 0
    page.on('request', (request) => { if (request.url().endsWith('.ldmcase')) packageRequests += 1 })
    await page.goto('/#/community/cases/case-community-sample-001')
    await expect(page.getByRole('heading', { name: '消失的备用钥匙' })).toBeVisible()
    expect(packageRequests).toBe(0)
  })

  test('uses cached catalog when registry requests fail without blocking local archives', async ({ page }) => {
    await page.getByRole('button', { name: '社区档案' }).click()
    await expect(page.getByText('社区目录可用')).toBeVisible()
    await page.route('**/community-fixture/**', (route) => route.abort('internetdisconnected'))
    await page.getByRole('button', { name: '手动刷新' }).click()
    await expect(page.getByText('正在使用上次同步的社区目录')).toBeVisible()
    await expect(page.getByRole('button', { name: /消失的备用钥匙/ })).toBeVisible()
    await page.getByRole('button', { name: '← 我的档案' }).click()
    await expect(page.getByText('遗失电脑博物馆')).toBeVisible()
  })
})
