export type AppId = 'files' | 'messages' | 'mail' | 'photos' | 'browser' | 'calendar' | 'recycle' | 'logs' | 'evidence' | 'settings'

export type InvestigationAction =
  | { type: 'OPEN_ITEM'; itemId: string }
  | { type: 'VIEW_METADATA'; itemId: string }
  | { type: 'COMPARE_ITEMS'; itemId: string }
  | { type: 'VIEW_TRANSCRIPT'; itemId: string }
  | { type: 'UNLOCK_ITEM'; itemId: string }
  | { type: 'VIEW_LOG'; itemId: string }

export type GameEventType = InvestigationAction['type'] | 'VIEW_MAIL_HEADERS' | 'RESTORE_ITEM' | 'RUN_COMMAND' | 'VIEW_AUDIO_MARKER' | 'COMPARE_AUDIO' | 'VIEW_MAP_LOCATION' | 'VIEW_VERSION_DIFF' | 'CREATE_RELATION'

export type CaseCondition =
  | { type: 'event'; eventType: GameEventType; targetId: string }
  | { type: 'all'; conditions: CaseCondition[] }
  | { type: 'any'; conditions: CaseCondition[] }
  | { type: 'clue'; clueId: string }
  | { type: 'clue-count'; count: number }
  | { type: 'relation'; from: string; to: string; relationType?: EvidenceRelation['type'] }
  | { type: 'trigger'; triggerId: string }

export interface CaseManifest {
  caseId: string
  version: string
  title: string
  subtitle: string
  author: string
  language: string
  summary: string
  estimatedMinutes: number
  difficulty: '入门' | '普通' | '困难'
  tags: string[]
  contentWarnings: string[]
  builtIn: boolean
  archivedAt: string
}

export interface CaseSubject {
  name: string
  age?: number
  occupation: string
  location: string
  lastLoginAt: string
}

export interface CaseEntity {
  id: string
  type: 'person' | 'location' | 'organization' | 'account' | 'device' | 'vehicle' | 'user' | 'custom'
  name: string
  summary: string
  description: string
  aliases: string[]
  tags: string[]
}

export interface DesktopDefinition {
  systemName: string
  bootMessage: string
  lastLoginMessage: string
  themeColor: string
  wallpaperAssetId?: string
}

export interface ApplicationDefinition {
  id: AppId
  componentKey: string
  title: string
  enabled: boolean
  desktopX: number
  desktopY: number
}

export interface CaseAssetReference {
  id: string
  kind: 'image' | 'audio' | 'text'
  mime: string
  path: string
  size: number
  sha256: string
  alt: string
}

export interface VirtualFile { id: string; name: string; folder: string; originalFolder?: string; content: string; locked?: boolean; password?: string; clueAction?: InvestigationAction['type'] }
export interface VirtualFolder { id: string; name: string }
export interface ChatMessage { id: string; sender: string; time: string; text: string; attachmentId?: string; unread?: boolean; clueId?: string }
export interface ChatThread { id: string; title: string; messages: ChatMessage[] }
export interface EmailMessage { id: string; folder: '收件箱' | '草稿'; from: string; subject: string; time: string; body: string; attachmentName?: string; clueId?: string }
export interface BrowserHistoryEntry { id: string; time: string; title: string; category: string; clueId?: string }
export interface CalendarEvent { id: string; date: string; title: string; note: string; clueId?: string }
export interface PhotoMetadata { capturedAt: string; exportedAt: string; camera: string }
export interface PhotoAsset { id: string; title: string; image: string; metadata: PhotoMetadata; clueId?: string }
export interface SystemLog { id: string; time: string; user: string; eventType: string; detail: string; clueId?: string }
export interface ClueDefinition { id: string; title: string; summary: string; explanation: string; source: AppId; discovery: InvestigationAction; condition: CaseCondition; people: string[]; times: string[]; places: string[]; isCore: boolean; isRedHerring: boolean }
export type TriggerEffect =
  | { id: string; type: 'NOTIFICATION' | 'SYSTEM_MESSAGE'; message: string }
  | { id: string; type: 'CLOCK_OFFSET'; message: string; minutes: number }
  | { id: string; type: 'UNLOCK_ITEM' | 'SHOW_ITEM' | 'OPEN_APP' | 'FOCUS_APP'; message: string; itemId: string }
  | { id: string; type: 'SET_BADGE' | 'SET_FLAG'; message: string; itemId: string; value: string }
  | { id: string; type: 'PLAY_SOUND' | 'WALLPAPER_STATE'; message: string; itemId: string; durationMs: number }
export type GameTrigger =
  | { id: string; kind: 'clue-count' | 'item-opened' | 'deduction'; threshold?: number; itemId?: string; effect: TriggerEffect }
  | { id: string; name: string; once: boolean; condition: CaseCondition; effects: TriggerEffect[]; reducedMotionEffects: TriggerEffect[]; safeModeEffects: TriggerEffect[] }
export interface EvidenceRelation { id: string; from: string; to: string; type: '相互矛盾' | '相互支持' | '时间先后' | '同一人物' }
export interface DeductionQuestion { id: string; prompt: string; options: { id: string; label: string }[]; correctId: string; points: number }
export interface DeductionSubmission { answers: string[]; evidenceIds: string[]; contradictionPairs: [string, string][]; note: string }
export interface DeductionResult { score: number; level: string; answerScore: number; evidenceScore: number; relationScore: number; note: string }
export interface WindowSnapshot { id: AppId; x: number; y: number; width: number; height: number; minimized: boolean; maximized: boolean }
export interface GameSave {
  saveVersion: number
  caseId: string
  caseStarted: boolean
  openedItems: string[]
  completedEventKeys: string[]
  discoveredClueIds: string[]
  pinnedClueIds: string[]
  unlockedItemIds: string[]
  restoredItemIds: string[]
  triggeredEventIds: string[]
  evidenceCardPositions: Record<string, { x: number; y: number }>
  evidenceRelations: EvidenceRelation[]
  evidenceNotes: Record<string, string>
  currentWindows: WindowSnapshot[]
  settings: { sound: boolean; anomalies: boolean; scanlines: number; safeMode: boolean }
  deductionResult: DeductionResult | null
  bestScore: number | null
  onboardingComplete: boolean
  desktopNote: string
  playTime: number
  lastSavedAt: string
}
export interface TimelineEntry { time: string; text: string }
export interface CaseDefinition {
  formatVersion: 1
  id: string
  title: string
  owner: string
  manifest: CaseManifest
  subject: CaseSubject
  entities: CaseEntity[]
  desktop: DesktopDefinition
  applications: ApplicationDefinition[]
  assets: CaseAssetReference[]
  timeline: TimelineEntry[]
  folders: VirtualFolder[]
  files: VirtualFile[]
  chats: ChatThread[]
  emails: EmailMessage[]
  browser: BrowserHistoryEntry[]
  calendar: CalendarEvent[]
  photos: PhotoAsset[]
  logs: SystemLog[]
  clues: ClueDefinition[]
  triggers: GameTrigger[]
  questions: DeductionQuestion[]
  coreEvidenceIds: string[]
  correctContradictions: [string, string][]
  ending: string
}
