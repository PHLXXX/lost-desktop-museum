import type { AppId } from '../cases/types'
import { BrowserApp, CalendarApp, LogsApp, PhotosApp, RecycleApp, SettingsApp } from '../features/apps/ArchiveApps'
import { FilesApp, MailApp, MessagesApp } from '../features/apps/BasicApps'
import { EvidenceBoardApp } from '../features/evidence-board/EvidenceBoardApp'

export function AppContent({ appId }: { appId: AppId }) {
  switch (appId) {
    case 'files': return <FilesApp />
    case 'messages': return <MessagesApp />
    case 'mail': return <MailApp />
    case 'photos': return <PhotosApp />
    case 'browser': return <BrowserApp />
    case 'calendar': return <CalendarApp />
    case 'recycle': return <RecycleApp />
    case 'logs': return <LogsApp />
    case 'evidence': return <EvidenceBoardApp />
    case 'settings': return <SettingsApp />
  }
}
