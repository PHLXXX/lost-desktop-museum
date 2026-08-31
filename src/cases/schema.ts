import { z } from 'zod'
import type { CaseCondition } from './types'

const appIdSchema = z.enum(['files', 'messages', 'mail', 'photos', 'browser', 'calendar', 'recycle', 'logs', 'evidence', 'settings'])
const actionTypeSchema = z.enum(['OPEN_ITEM', 'VIEW_METADATA', 'COMPARE_ITEMS', 'VIEW_TRANSCRIPT', 'UNLOCK_ITEM', 'VIEW_LOG'])
const eventTypeSchema = z.enum(['OPEN_ITEM', 'VIEW_METADATA', 'COMPARE_ITEMS', 'VIEW_TRANSCRIPT', 'UNLOCK_ITEM', 'VIEW_LOG', 'VIEW_MAIL_HEADERS', 'RESTORE_ITEM', 'RUN_COMMAND', 'VIEW_AUDIO_MARKER', 'COMPARE_AUDIO', 'VIEW_MAP_LOCATION', 'VIEW_VERSION_DIFF', 'CREATE_RELATION'])
const actionSchema = z.object({ type: actionTypeSchema, itemId: z.string().min(1) }).strict()

export const conditionSchema: z.ZodType<CaseCondition> = z.lazy(() => z.discriminatedUnion('type', [
  z.object({ type: z.literal('event'), eventType: eventTypeSchema, targetId: z.string().min(1) }).strict(),
  z.object({ type: z.literal('all'), conditions: z.array(conditionSchema).min(1).max(100) }).strict(),
  z.object({ type: z.literal('any'), conditions: z.array(conditionSchema).min(1).max(100) }).strict(),
  z.object({ type: z.literal('clue'), clueId: z.string().min(1) }).strict(),
  z.object({ type: z.literal('clue-count'), count: z.number().int().nonnegative() }).strict(),
  z.object({ type: z.literal('relation'), from: z.string().min(1), to: z.string().min(1), relationType: z.enum(['相互矛盾', '相互支持', '时间先后', '同一人物']).optional() }).strict(),
  z.object({ type: z.literal('trigger'), triggerId: z.string().min(1) }).strict(),
]))

const manifestSchema = z.object({
  caseId: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/), version: z.string().regex(/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/),
  title: z.string().trim().min(1), subtitle: z.string(), author: z.string().trim().min(1), language: z.string().min(2), summary: z.string(),
  estimatedMinutes: z.number().int().positive(), difficulty: z.enum(['入门', '普通', '困难']), tags: z.array(z.string()), contentWarnings: z.array(z.string()), builtIn: z.boolean(), archivedAt: z.string().datetime({ offset: true }),
}).strict()
const subjectSchema = z.object({ name: z.string().trim().min(1), age: z.number().int().positive().optional(), occupation: z.string(), location: z.string(), lastLoginAt: z.string().datetime({ offset: true }) }).strict()
const entitySchema = z.object({ id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/), type: z.enum(['person', 'location', 'organization', 'account', 'device', 'vehicle', 'user', 'custom']), name: z.string().min(1), summary: z.string(), description: z.string(), aliases: z.array(z.string()), tags: z.array(z.string()) }).strict()
const desktopSchema = z.object({ systemName: z.string().min(1), bootMessage: z.string(), lastLoginMessage: z.string(), themeColor: z.string().regex(/^#[0-9a-fA-F]{6}$/), wallpaperAssetId: z.string().optional() }).strict()
const applicationSchema = z.object({ id: appIdSchema, componentKey: z.string().regex(/^[a-z0-9-]+$/), title: z.string().min(1), enabled: z.boolean(), desktopX: z.number().finite(), desktopY: z.number().finite() }).strict()
const assetSchema = z.object({ id: z.string().min(1), kind: z.enum(['image', 'audio', 'text']), mime: z.string().min(1), path: z.string().min(1), size: z.number().int().nonnegative(), sha256: z.string().regex(/^[a-fA-F0-9]{64}$/), alt: z.string() }).strict()
const folderSchema = z.object({ id: z.string().min(1), name: z.string().min(1) }).strict()
const fileSchema = z.object({ id: z.string().min(1), name: z.string().min(1), folder: z.string().min(1), originalFolder: z.string().optional(), content: z.string(), locked: z.boolean().optional(), password: z.string().optional(), clueAction: actionTypeSchema.optional() }).strict()
const messageSchema = z.object({ id: z.string().min(1), sender: z.string().min(1), time: z.string(), text: z.string(), attachmentId: z.string().optional(), unread: z.boolean().optional(), clueId: z.string().optional() }).strict()
const chatSchema = z.object({ id: z.string().min(1), title: z.string().min(1), messages: z.array(messageSchema) }).strict()
const emailSchema = z.object({ id: z.string().min(1), folder: z.enum(['收件箱', '草稿']), from: z.string(), subject: z.string(), time: z.string(), body: z.string(), attachmentName: z.string().optional(), clueId: z.string().optional() }).strict()
const browserSchema = z.object({ id: z.string().min(1), time: z.string(), title: z.string(), category: z.string(), clueId: z.string().optional() }).strict()
const calendarSchema = z.object({ id: z.string().min(1), date: z.string(), title: z.string(), note: z.string(), clueId: z.string().optional() }).strict()
const photoSchema = z.object({ id: z.string().min(1), title: z.string(), image: z.string(), metadata: z.object({ capturedAt: z.string(), exportedAt: z.string(), camera: z.string() }).strict(), clueId: z.string().optional() }).strict()
const logSchema = z.object({ id: z.string().min(1), time: z.string(), user: z.string(), eventType: z.string(), detail: z.string(), clueId: z.string().optional() }).strict()
const clueSchema = z.object({ id: z.string().min(1), title: z.string().min(1), summary: z.string(), explanation: z.string(), source: appIdSchema, discovery: actionSchema, condition: conditionSchema, people: z.array(z.string()), times: z.array(z.string()), places: z.array(z.string()), isCore: z.boolean(), isRedHerring: z.boolean() }).strict()
const effectSchema = z.discriminatedUnion('type', [
  z.object({ id: z.string().min(1), type: z.enum(['NOTIFICATION', 'SYSTEM_MESSAGE']), message: z.string() }).strict(),
  z.object({ id: z.string().min(1), type: z.literal('CLOCK_OFFSET'), message: z.string(), minutes: z.number().int() }).strict(),
  z.object({ id: z.string().min(1), type: z.enum(['UNLOCK_ITEM', 'SHOW_ITEM', 'OPEN_APP', 'FOCUS_APP']), message: z.string(), itemId: z.string().min(1) }).strict(),
  z.object({ id: z.string().min(1), type: z.enum(['SET_BADGE', 'SET_FLAG']), message: z.string(), itemId: z.string().min(1), value: z.string() }).strict(),
  z.object({ id: z.string().min(1), type: z.enum(['PLAY_SOUND', 'WALLPAPER_STATE']), message: z.string(), itemId: z.string().min(1), durationMs: z.number().int().positive().max(10000) }).strict(),
])
const legacyTriggerSchema = z.object({ id: z.string().min(1), kind: z.enum(['clue-count', 'item-opened', 'deduction']), threshold: z.number().int().optional(), itemId: z.string().optional(), effect: effectSchema }).strict()
const declarativeTriggerSchema = z.object({ id: z.string().min(1), name: z.string().min(1), once: z.boolean(), condition: conditionSchema, effects: z.array(effectSchema), reducedMotionEffects: z.array(effectSchema), safeModeEffects: z.array(effectSchema) }).strict()
const questionSchema = z.object({ id: z.string().min(1), prompt: z.string().min(1), options: z.array(z.object({ id: z.string().min(1), label: z.string().min(1) }).strict()).min(2), correctId: z.string().min(1), points: z.number().int().nonnegative() }).strict()

export const caseDefinitionSchema = z.object({
  formatVersion: z.literal(1), id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/), title: z.string().min(1), owner: z.string().min(1), manifest: manifestSchema, subject: subjectSchema,
  entities: z.array(entitySchema), desktop: desktopSchema, applications: z.array(applicationSchema).min(2), assets: z.array(assetSchema), timeline: z.array(z.object({ time: z.string(), text: z.string() }).strict()),
  folders: z.array(folderSchema), files: z.array(fileSchema), chats: z.array(chatSchema), emails: z.array(emailSchema), browser: z.array(browserSchema), calendar: z.array(calendarSchema), photos: z.array(photoSchema), logs: z.array(logSchema),
  clues: z.array(clueSchema).min(1), triggers: z.array(z.union([legacyTriggerSchema, declarativeTriggerSchema])), questions: z.array(questionSchema).min(1), coreEvidenceIds: z.array(z.string()), correctContradictions: z.array(z.tuple([z.string(), z.string()])), ending: z.string(),
}).strict()

