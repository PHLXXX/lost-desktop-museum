import { z } from 'zod'

const actionSchema = z.object({ type: z.string().min(1), itemId: z.string().min(1) })
const clueSchema = z.object({
  id: z.string().regex(/^C\d{2}$/), title: z.string(), summary: z.string(), explanation: z.string(),
  source: z.string(), discovery: actionSchema, people: z.array(z.string()), times: z.array(z.string()), places: z.array(z.string()),
  isCore: z.boolean(), isRedHerring: z.boolean(),
})

export const caseDefinitionSchema = z.object({
  id: z.string(), title: z.string(), owner: z.string(), timeline: z.array(z.object({ time: z.string(), text: z.string() })),
  folders: z.array(z.object({ id: z.string(), name: z.string() })), files: z.array(z.object({ id: z.string(), name: z.string(), folder: z.string(), content: z.string() }).passthrough()),
  chats: z.array(z.any()), emails: z.array(z.any()), browser: z.array(z.any()), calendar: z.array(z.any()), photos: z.array(z.any()), logs: z.array(z.any()),
  clues: z.array(clueSchema).length(12), triggers: z.array(z.any()), questions: z.array(z.any()).length(3), coreEvidenceIds: z.array(z.string()), correctContradictions: z.array(z.tuple([z.string(), z.string()])), ending: z.string(),
})

