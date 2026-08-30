import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { createFreshSave } from '../../engine/persistence'
import { useGameStore } from '../../store/gameStore'
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

describe('archive applications', () => {
  beforeEach(() => {
    localStorage.clear()
    useGameStore.setState({ ...createFreshSave(), saveStatus: 'idle', notice: null, corruptSave: false })
    useWindowStore.setState({ windows: [], activeWindowId: null })
  })

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
    await user.click(screen.getByRole('button', { name: '打开图片附件 IMG_1117' }))
    expect(useWindowStore.getState().windows.some((window) => window.id === 'photos')).toBe(true)
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
