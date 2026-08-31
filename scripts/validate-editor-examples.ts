import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { minimalValidProject } from '../examples/editor/minimal-valid-project/project'
import { compileCaseDraft } from '../src/editor/compiler/compileCaseDraft'

const coverPath = resolve(process.cwd(), 'examples/editor/minimal-valid-project/assets/spare-key-cover.png')
const cover = await readFile(coverPath)
const asset = minimalValidProject.draft.assets[0]
if (!asset) throw new Error('示例工程缺少封面资源声明。')
const digest = createHash('sha256').update(cover).digest('hex')
if (cover.length !== asset.size || digest !== asset.sha256) throw new Error('示例封面资源大小或SHA-256与声明不一致。')
const result = compileCaseDraft(minimalValidProject.draft, [{ id: asset.id, mime: asset.mime, size: cover.length, sha256: digest }])
if (!result.ok) throw new Error(`示例工程编译失败：${result.issues.map((issue) => `${issue.path}: ${issue.message}`).join('；')}`)
if (result.caseDefinition.clues.length !== 6 || result.caseDefinition.questions.reduce((sum, item) => sum + item.points, 0) !== 100) throw new Error('示例工程未满足6条线索和100分推理的最小闭环。')
console.log(`PASS minimal-valid-project · ${result.caseDefinition.clues.length} clues · ${cover.length} bytes · sha256 ${digest}`)
