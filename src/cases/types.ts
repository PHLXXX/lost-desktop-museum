export type AppId = 'files' | 'messages' | 'mail' | 'photos' | 'browser' | 'calendar' | 'recycle' | 'logs' | 'evidence' | 'settings'

export type InvestigationAction =
  | { type: 'OPEN_ITEM'; itemId: string }
  | { type: 'VIEW_METADATA'; itemId: string }
  | { type: 'COMPARE_ITEMS'; itemId: string }
  | { type: 'VIEW_TRANSCRIPT'; itemId: string }
  | { type: 'UNLOCK_ITEM'; itemId: string }
  | { type: 'VIEW_LOG'; itemId: string }

export interface VirtualFile { id: string; name: string; folder: string; content: string; locked?: boolean; password?: string; clueAction?: InvestigationAction['type'] }
export interface VirtualFolder { id: string; name: string }
export interface ChatMessage { id: string; sender: string; time: string; text: string; attachmentId?: string; unread?: boolean; clueId?: string }
export interface ChatThread { id: string; title: string; messages: ChatMessage[] }
export interface EmailMessage { id: string; folder: '收件箱' | '草稿'; from: string; subject: string; time: string; body: string; clueId?: string }
export interface BrowserHistoryEntry { id: string; time: string; title: string; category: string; clueId?: string }
export interface CalendarEvent { id: string; date: string; title: string; note: string; clueId?: string }
export interface PhotoMetadata { capturedAt: string; exportedAt: string; camera: string }
export interface PhotoAsset { id: string; title: string; image: string; metadata: PhotoMetadata; clueId?: string }
export interface SystemLog { id: string; time: string; user: string; eventType: string; detail: string; clueId?: string }
export interface ClueDefinition { id: string; title: string; summary: string; explanation: string; source: AppId; discovery: InvestigationAction; people: string[]; times: string[]; places: string[]; isCore: boolean; isRedHerring: boolean }
export interface GameTrigger { id: string; kind: 'clue-count' | 'item-opened' | 'deduction'; threshold?: number; itemId?: string; effect: TriggerEffect }
export type TriggerEffect = { id: string; type: 'NOTIFICATION' | 'CLOCK_OFFSET' | 'UNLOCK_ITEM'; message: string; minutes?: number; itemId?: string }
export interface EvidenceRelation { id: string; from: string; to: string; type: '相互矛盾' | '相互支持' | '时间先后' | '同一人物' }
export interface DeductionQuestion { id: string; prompt: string; options: { id: string; label: string }[]; correctId: string; points: number }
export interface DeductionSubmission { answers: string[]; evidenceIds: string[]; contradictionPairs: [string, string][]; note: string }
export interface DeductionResult { score: number; level: string; answerScore: number; evidenceScore: number; relationScore: number; note: string }
export interface WindowSnapshot { id: AppId; x: number; y: number; width: number; height: number; minimized: boolean; maximized: boolean }
export interface GameSave { saveVersion: number; caseId: string; openedItems: string[]; discoveredClueIds: string[]; pinnedClueIds: string[]; unlockedItemIds: string[]; triggeredEventIds: string[]; evidenceCardPositions: Record<string, { x: number; y: number }>; evidenceRelations: EvidenceRelation[]; currentWindows: WindowSnapshot[]; settings: { sound: boolean; anomalies: boolean; scanlines: number }; deductionResult: DeductionResult | null; onboardingComplete: boolean; desktopNote: string; playTime: number; lastSavedAt: string }
export interface TimelineEntry { time: string; text: string }
export interface CaseDefinition { id: string; title: string; owner: string; timeline: TimelineEntry[]; folders: VirtualFolder[]; files: VirtualFile[]; chats: ChatThread[]; emails: EmailMessage[]; browser: BrowserHistoryEntry[]; calendar: CalendarEvent[]; photos: PhotoAsset[]; logs: SystemLog[]; clues: ClueDefinition[]; triggers: GameTrigger[]; questions: DeductionQuestion[]; coreEvidenceIds: string[]; correctContradictions: [string, string][]; ending: string }
