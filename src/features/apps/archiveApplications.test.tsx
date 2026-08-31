import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { caseDefinition as case002 } from '../../cases/case-002/case'
import { caseDefinition as case001 } from '../../cases/case-001/case'
import { registerInstalledCase, unregisterInstalledCase } from '../../cases/registry'
import { createFreshSave } from '../../engine/persistence'
import { useGameStore } from '../../store/gameStore'
import { useApplicationStore } from '../../store/applicationStore'
import { useWindowStore } from '../../store/windowStore'
import { CalendarApp } from './CalendarApp'
import { FilesApp } from './FilesApp'
import { HistoryApp } from './HistoryApp'
import { LogsApp } from './LogsApp'
import { MailApp } from './MailApp'
import { MessagesApp } from './MessagesApp'
import { PhotosApp } from './PhotosApp'
import { RecycleApp } from './RecycleApp'
import { SettingsApp } from './SettingsApp'
import { BroadcastConsoleApp, SitemapApp, VersionDiffApp } from './ExtendedApps'

describe('archive applications', () => {
  beforeEach(() => {
    localStorage.clear()
    useGameStore.setState({ ...createFreshSave(), saveStatus: 'idle', notice: null, corruptSave: false })
    useApplicationStore.setState({ selectedPhotoId: null })
    useWindowStore.setState({ windows: [], activeWindowId: null })
  })

  afterEach(() => {
    for (const caseId of ['test-empty-photos', 'test-empty-logs', 'test-empty-messages', 'test-recycle-metadata', 'test-empty-extended']) {
      unregisterInstalledCase(caseId)
    }
  })

  const activateCase002 = () => {
    useGameStore.setState({ ...createFreshSave('case-002'), saveStatus: 'idle', notice: null, corruptSave: false })
  }

  it('persists recycle restoration and returns the file to its original folder', async () => {
    const user = userEvent.setup()
    const recycle = render(<RecycleApp />)
    await user.click(screen.getByRole('button', { name: /告别信_v3/ }))
    await user.click(screen.getByRole('button', { name: '恢复到原位置' }))
    expect(useGameStore.getState().restoredItemIds).toContain('farewell-v3')
    recycle.unmount()

    render(<FilesApp />)
    await user.click(screen.getByRole('button', { name: /日记/ }))
    expect(screen.getByRole('button', { name: /告别信_v3/ })).toBeInTheDocument()
  })

  it('shows complete file properties', async () => {
    const user = userEvent.setup()
    render(<FilesApp />)
    await user.click(screen.getByRole('button', { name: /北岸市_四日行程/ }))
    await user.click(screen.getByRole('button', { name: '属性' }))
    const properties = screen.getByRole('region', { name: '文件详情' })
    for (const label of ['文件类型', '大小', '创建时间', '修改时间', '是否隐藏', '所属用户']) {
      expect(within(properties).getByText(label)).toBeInTheDocument()
    }
  })

  it('closes the file context menu with Escape', async () => {
    const user = userEvent.setup()
    render(<FilesApp />)
    const file = screen.getByRole('button', { name: /北岸市_四日行程/ })
    await user.pointer({ target: file, keys: '[MouseRight]' })
    expect(screen.getByRole('menu')).toBeInTheDocument()
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  it('filters mail and selects the first message when changing folders', async () => {
    const user = userEvent.setup()
    render(<MailApp />)
    await user.type(screen.getByRole('searchbox', { name: '搜索邮件' }), '酒店')
    expect(screen.getByRole('button', { name: /北岸酒店预订成功/ })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /HX217 订单取消成功/ })).not.toBeInTheDocument()
    await user.clear(screen.getByRole('searchbox', { name: '搜索邮件' }))
    await user.click(screen.getByRole('button', { name: /草稿/ }))
    expect(screen.getByRole('heading', { name: '给妈妈' })).toBeInTheDocument()
    expect(screen.getByText(/这封邮件从未发送/)).toBeInTheDocument()
  })

  it('keeps the birthday note hidden until the event is opened', async () => {
    const user = userEvent.setup()
    render(<CalendarApp />)
    await user.click(screen.getByRole('button', { name: '列表' }))
    expect(screen.queryByText('以后不要再忘记这一天。')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /林然生日/ }))
    expect(screen.getByText('以后不要再忘记这一天。')).toBeInTheDocument()
  })

  it('navigates photos and reveals the complete metadata only on request', async () => {
    const user = userEvent.setup()
    render(<PhotosApp />)
    expect(screen.queryByText('文件修改时间')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '下一张' }))
    await user.click(screen.getByRole('button', { name: '查看元数据' }))
    for (const label of ['原始拍摄时间', '导出时间', '文件修改时间', '分辨率', '设备', '文件路径']) {
      expect(screen.getByText(label)).toBeInTheDocument()
    }
  })

  it('renders a stable empty state when an enabled photo app has no records', () => {
    registerInstalledCase({
      ...structuredClone(case002),
      id: 'test-empty-photos',
      manifest: { ...structuredClone(case002.manifest), caseId: 'test-empty-photos', builtIn: false },
      photos: [],
    })
    useGameStore.setState({ ...createFreshSave('test-empty-photos'), saveStatus: 'idle', notice: null, corruptSave: false })

    render(<PhotosApp />)

    expect(screen.getByRole('heading', { name: '没有恢复到照片' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '查看元数据' })).not.toBeInTheDocument()
  })

  it('uses the active case identity and dates across personal archive apps', async () => {
    const user = userEvent.setup()
    activateCase002()

    const mail = render(<MailApp />)
    expect(mail.container).toHaveTextContent('林默@LOCAL')
    expect(mail.container).not.toHaveTextContent(/ZHOU_YU|2031\.11\.17/)
    mail.unmount()

    const calendar = render(<CalendarApp />)
    expect(calendar.container).toHaveTextContent('2032 年 4 月')
    expect(calendar.container).not.toHaveTextContent('改为预录，不进入A演播室')
    await user.click(screen.getByRole('button', { name: '零点特别节目' }))
    expect(calendar.container).toHaveTextContent('林默 / 个人')
    expect(calendar.container).not.toHaveTextContent(/ZHOU_YU|2031 年/)
    calendar.unmount()

    const messages = render(<MessagesApp />)
    expect(messages.container).toHaveTextContent('2032 年 4 月 9 日')
    expect(messages.container).toHaveTextContent('林默、乔安')
    expect(messages.container).not.toHaveTextContent(/周屿、|2031\.11\.17/)
    messages.unmount()

    const photos = render(<PhotosApp />)
    await user.click(screen.getByRole('button', { name: '查看元数据' }))
    expect(photos.container).toHaveTextContent('2032 年恢复档案')
    expect(photos.container).toHaveTextContent('林默/照片/控制台恢复图.svg')
    expect(photos.container).not.toHaveTextContent(/ZHOU_YU|2031/)
  })

  it('does not fabricate first-case dates or devices in files and browser history', () => {
    activateCase002()

    const files = render(<FilesApp />)
    expect(files.container).not.toHaveTextContent('2031.11')
    expect(files.container).toHaveTextContent('2032-04-09')
    files.unmount()

    const history = render(<HistoryApp />)
    expect(history.container).toHaveTextContent('本机档案终端')
    expect(history.container).not.toHaveTextContent(/2031\.11\.17|ZHOU-YU-DESKTOP/)
  })

  it('derives log filters from the active case and handles an empty log archive', () => {
    activateCase002()
    const logs = render(<LogsApp />)
    expect(screen.getByRole('option', { name: '2032-04-09' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'ACCESS' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: '门禁' })).toBeInTheDocument()
    expect(logs.container).not.toHaveTextContent(/ZHOU_YU|LINRAN|2031-11-17/)
    logs.unmount()

    registerInstalledCase({
      ...structuredClone(case002),
      id: 'test-empty-logs',
      manifest: { ...structuredClone(case002.manifest), caseId: 'test-empty-logs', builtIn: false },
      logs: [],
    })
    useGameStore.setState({ ...createFreshSave('test-empty-logs'), saveStatus: 'idle', notice: null, corruptSave: false })
    render(<LogsApp />)
    expect(screen.getByRole('heading', { name: '没有恢复到系统日志' })).toBeInTheDocument()
  })

  it('renders a stable empty state when an enabled messages app has no conversations', () => {
    registerInstalledCase({
      ...structuredClone(case002),
      id: 'test-empty-messages',
      manifest: { ...structuredClone(case002.manifest), caseId: 'test-empty-messages', builtIn: false },
      chats: [],
    })
    useGameStore.setState({ ...createFreshSave('test-empty-messages'), saveStatus: 'idle', notice: null, corruptSave: false })

    render(<MessagesApp />)

    expect(screen.getByRole('heading', { name: '没有恢复到会话' })).toBeInTheDocument()
  })

  it('shows recycle metadata supplied by the active case package', async () => {
    const user = userEvent.setup()
    registerInstalledCase({
      ...structuredClone(case002),
      id: 'test-recycle-metadata',
      manifest: { ...structuredClone(case002.manifest), caseId: 'test-recycle-metadata', builtIn: false },
      files: [...structuredClone(case002.files), {
        id: 'trashed-note',
        name: '旧便笺.txt',
        folder: '回收站',
        originalFolder: '便笺',
        content: '归档前的旧版本。',
        owner: '林默',
        deletedAt: '2032-04-09 00:12',
      }],
    })
    useGameStore.setState({ ...createFreshSave('test-recycle-metadata'), saveStatus: 'idle', notice: null, corruptSave: false })

    const recycle = render(<RecycleApp />)
    await user.click(screen.getByRole('button', { name: /旧便笺/ }))

    expect(recycle.container).toHaveTextContent('林默/便笺')
    expect(recycle.container).toHaveTextContent('2032-04-09 00:12')
    expect(recycle.container).not.toHaveTextContent(/ZHOU_YU|周屿|2031\.11\.17/)
  })

  it('explains empty optional archives instead of rendering blank application panes', () => {
    registerInstalledCase({
      ...structuredClone(case002),
      id: 'test-empty-extended',
      manifest: { ...structuredClone(case002.manifest), caseId: 'test-empty-extended', builtIn: false },
      broadcastEvents: [],
      versionDiffs: [],
      sitemap: [],
    })
    useGameStore.setState({ ...createFreshSave('test-empty-extended'), saveStatus: 'idle', notice: null, corruptSave: false })

    const broadcast = render(<BroadcastConsoleApp />)
    expect(screen.getByText('没有恢复到节目事件')).toBeInTheDocument()
    broadcast.unmount()
    const versions = render(<VersionDiffApp />)
    expect(screen.getByText('没有恢复到版本差异')).toBeInTheDocument()
    versions.unmount()
    render(<SitemapApp />)
    expect(screen.getByText('没有恢复到地点记录')).toBeInTheDocument()
  })

  it('searches history by domain and can add the selected record to evidence', async () => {
    const user = userEvent.setup()
    render(<HistoryApp />)
    await user.type(screen.getByRole('searchbox', { name: '搜索浏览记录' }), 'privacy.local')
    await user.click(screen.getByRole('button', { name: /如何保留照片画面/ }))
    await user.click(screen.getByRole('button', { name: '加入证据板' }))
    expect(useGameStore.getState().pinnedClueIds).toContain('C04')
  })

  it('filters message threads and opens image attachments in Photos', async () => {
    const user = userEvent.setup()
    render(<MessagesApp />)
    await user.type(screen.getByRole('searchbox', { name: '搜索会话' }), '房东')
    const contacts = screen.getByRole('navigation', { name: '联系人' })
    expect(within(contacts).getByRole('button', { name: /房东陈女士/ })).toBeInTheDocument()
    expect(within(contacts).queryByRole('button', { name: /唐遥/ })).not.toBeInTheDocument()
    await user.clear(screen.getByRole('searchbox', { name: '搜索会话' }))
    await user.click(within(contacts).getByRole('button', { name: /唐遥/ }))
    await user.click(screen.getByRole('button', { name: '打开图片附件 photo-sent' }))
    expect(useWindowStore.getState().windows.some((window) => window.id === 'photos')).toBe(true)

    render(<PhotosApp />)
    expect(document.querySelector('.photo-library button[data-selected="true"]')).toHaveTextContent('IMG_1117_发给唐遥.svg')
  })

  it('shows the real total beside the all-files folder', () => {
    render(<FilesApp />)

    const allFiles = screen.getByRole('button', { name: /全部档案/ })
    expect(within(allFiles).getByText(String(case001.files.length))).toBeInTheDocument()
  })

  it('filters logs and discovers LINRAN only after opening the matching detail', async () => {
    const user = userEvent.setup()
    render(<LogsApp />)
    await user.type(screen.getByRole('searchbox', { name: '搜索日志' }), 'HOME-NET-5G')
    await user.click(screen.getByRole('button', { name: /LINRAN.*HOME-NET-5G/ }))
    expect(screen.getByText('ARCHIVE/OS 本地事件日志')).toBeInTheDocument()
    expect(useGameStore.getState().discoveredClueIds).toContain('C08')
  })

  it('switches settings sections without silent controls', async () => {
    const user = userEvent.setup()
    render(<SettingsApp />)
    await user.click(screen.getByRole('button', { name: '关于系统' }))
    expect(screen.getByRole('heading', { name: 'ARCHIVE/OS 3.1' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '调查数据' }))
    expect(screen.getByText(/线索、证据关系、解锁内容和窗口布局/)).toBeInTheDocument()
  })
})
