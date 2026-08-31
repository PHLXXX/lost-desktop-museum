import { expect, test, type Page } from '@playwright/test'
import { readFile } from 'node:fs/promises'

async function clearBrowser(page: Page) {
  await page.goto('/')
  await page.evaluate(async () => { localStorage.clear(); for (const database of await indexedDB.databases()) if (database.name) indexedDB.deleteDatabase(database.name) })
  await page.reload()
}
test('captures Archive Exchange runtime states', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 }); await clearBrowser(page)
  await page.getByRole('button', { name: '社区档案' }).click(); await expect(page.getByText('社区目录可用')).toBeVisible()
  await page.screenshot({ path: 'docs/images/stage5-community-home.png' })
  await page.getByLabel('搜索社区案件').fill('备用钥匙'); await page.screenshot({ path: 'docs/images/stage5-community-search.png' })
  await page.getByRole('button', { name: /消失的备用钥匙/ }).click(); await expect(page.getByRole('heading', { name: '消失的备用钥匙' })).toBeVisible()
  await page.screenshot({ path: 'docs/images/stage5-community-case-detail.png' })
  await page.getByText('信任范围').scrollIntoViewIfNeeded(); await page.screenshot({ path: 'docs/images/stage5-community-trust-status.png' })
  await page.getByText('私人记录').scrollIntoViewIfNeeded(); await page.getByRole('button', { name: '4' }).click(); await page.locator('.community-private textarea').fill('适合作为第一次社区调查；记录只在本机。'); await page.locator('.community-private textarea').blur(); await page.screenshot({ path: 'docs/images/stage5-private-rating-note.png' })
  await page.locator('.community-detail > header').scrollIntoViewIfNeeded()
  let releaseDownload!: () => void; const held = new Promise<void>((resolve) => { releaseDownload = resolve })
  await page.route('**/packages/valid-1.0.0.ldmcase', async (route) => { await held; await route.continue() })
  await page.getByRole('complementary').getByRole('button', { name: '安装到档案馆' }).click(); await page.getByRole('button', { name: '下载并验证' }).click(); await expect(page.getByText('正在下载')).toBeVisible(); await page.screenshot({ path: 'docs/images/stage5-install-download.png' }); releaseDownload(); await expect(page.getByText(/SHA-256 匹配/)).toBeVisible(); await page.screenshot({ path: 'docs/images/stage5-install-validation.png' })
  await page.getByRole('dialog', { name: /安装到档案馆/ }).getByRole('button', { name: '安装到档案馆', exact: true }).click(); await expect(page.getByRole('dialog', { name: '安装成功' })).toBeVisible(); await page.getByRole('button', { name: '查看我的档案' }).click(); await page.getByRole('group', { name: '案件来源筛选' }).getByRole('button', { name: '社区安装' }).click(); await expect(page.getByRole('heading', { name: '消失的备用钥匙' })).toBeVisible(); await page.screenshot({ path: 'docs/images/stage5-installed-case.png' })

  const index11 = await readFile('tests/fixtures/community/scenarios/index-1.1.0.json'); const detail11 = await readFile('tests/fixtures/community/scenarios/case-community-sample-001-1.1.0.json')
  await page.route('**/registry/v1/index.json', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: index11 }))
  await page.route('**/registry/v1/cases/case-community-sample-001.json', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: detail11 }))
  await page.getByRole('button', { name: '社区档案' }).click(); await page.getByRole('button', { name: '手动刷新' }).click(); await page.getByRole('button', { name: /消失的备用钥匙/ }).click(); await expect(page.getByRole('button', { name: '查看并安装更新' })).toBeVisible(); await page.screenshot({ path: 'docs/images/stage5-case-update.png' })

  await page.unroute('**/registry/v1/index.json'); await page.unroute('**/registry/v1/cases/case-community-sample-001.json')
  const index20 = await readFile('tests/fixtures/community/scenarios/index-2.0.0.json'); const detail20 = await readFile('tests/fixtures/community/scenarios/case-community-sample-001-2.0.0.json'); const package20 = await readFile('tests/fixtures/community/packages/incompatible-2.0.0.ldmcase')
  await page.route('**/registry/v1/index.json', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: index20 })); await page.route('**/registry/v1/cases/case-community-sample-001.json', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: detail20 })); await page.route('**/packages/incompatible-2.0.0.ldmcase', (route) => route.fulfill({ status: 200, contentType: 'application/octet-stream', body: package20 }))
  await page.evaluate(() => localStorage.setItem('archive-os:case:case-community-sample-001', JSON.stringify({ saveVersion: 2, caseId: 'case-community-sample-001', discoveredClueIds: ['clue-handover'], pinnedClueIds: ['clue-handover'] })))
  await page.getByRole('button', { name: '手动刷新' }).click(); await expect(page.getByRole('button', { name: '查看并安装更新' })).toBeVisible(); await page.getByRole('button', { name: '查看并安装更新' }).click(); await page.getByRole('button', { name: '下载并验证' }).click(); await expect(page.getByText(/SHA-256 匹配/)).toBeVisible(); await page.getByRole('dialog', { name: /安装到档案馆/ }).getByRole('button', { name: '安装到档案馆', exact: true }).click(); await expect(page.getByRole('dialog', { name: '此更新与当前进度不兼容' })).toBeVisible(); await page.screenshot({ path: 'docs/images/stage5-incompatible-update.png' }); await page.getByRole('button', { name: '取消更新' }).click(); await page.getByRole('button', { name: /关闭安装/ }).click()

  await page.unroute('**/registry/v1/index.json'); await page.unroute('**/registry/v1/cases/case-community-sample-001.json'); await page.route('**/community-fixture/**', (route) => route.abort('internetdisconnected')); await page.getByRole('button', { name: '手动刷新' }).click(); await expect(page.getByText('正在使用上次同步的社区目录')).toBeVisible(); await page.screenshot({ path: 'docs/images/stage5-offline-community.png' })
})

test('captures workshop community publishing', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 }); await clearBrowser(page); await page.getByRole('button', { name: '档案工坊' }).click(); await page.getByRole('button', { name: /创建案件工程|创建第一个工程/ }).first().click(); await page.getByRole('radio', { name: '最小可玩模板' }).check(); await page.getByRole('button', { name: '下一步' }).click(); await page.getByLabel('案件名称').fill('消失的备用钥匙'); await page.getByRole('button', { name: '下一步' }).click(); await page.getByRole('button', { name: '下一步' }).click(); await page.getByRole('button', { name: '创建并打开' }).click(); await page.getByRole('button', { name: '导出' }).click(); await page.getByRole('button', { name: '导出.ldmcase' }).click(); await expect(page.getByText(/已生成并往返校验/)).toBeVisible(); await page.getByRole('button', { name: '准备社区投稿' }).click(); await expect(page.getByRole('dialog', { name: '准备社区投稿' })).toBeVisible(); await page.screenshot({ path: 'docs/images/stage5-workshop-publishing.png' })
  await page.getByLabel('社区投稿截图').setInputFiles('docs/images/stage4-live-preview.png'); const zip = page.waitForEvent('download'); await page.getByRole('button', { name: '下载 community-submission.zip' }).click(); expect((await zip).suggestedFilename()).toMatch(/community-submission\.zip$/); await expect(page.getByText(/投稿 ZIP 已生成/)).toBeVisible(); await page.getByText('GitHub 投稿说明').scrollIntoViewIfNeeded(); await page.screenshot({ path: 'docs/images/stage5-submission-checklist.png' })
})
