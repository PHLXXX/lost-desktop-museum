import type { AppId } from '../cases/types'
import { CalendarApp } from '../features/apps/CalendarApp'
import { FilesApp } from '../features/apps/FilesApp'
import { HistoryApp } from '../features/apps/HistoryApp'
import { LogsApp } from '../features/apps/LogsApp'
import { MailApp } from '../features/apps/MailApp'
import { MessagesApp } from '../features/apps/MessagesApp'
import { PhotosApp } from '../features/apps/PhotosApp'
import { RecycleApp } from '../features/apps/RecycleApp'
import { SettingsApp } from '../features/apps/SettingsApp'
import { EvidenceBoardApp } from '../features/evidence-board/EvidenceBoardApp'

export function AppContent({ appId, onDeduction, onResult }: { appId: AppId; onDeduction?: () => void; onResult?: () => void }) {
  switch (appId) {
    case 'files': return <FilesApp />
    case 'messages': return <MessagesApp />
    case 'mail': return <MailApp />
    case 'photos': return <PhotosApp />
    case 'browser': return <HistoryApp />
    case 'calendar': return <CalendarApp />
    case 'recycle': return <RecycleApp />
    case 'logs': return <LogsApp />
    case 'evidence': return <EvidenceBoardApp onDeduction={onDeduction} onResult={onResult} />
    case 'settings': return <SettingsApp />
  }
}
