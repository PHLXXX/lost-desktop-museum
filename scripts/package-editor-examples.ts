import { readFile, mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { minimalValidProject } from '../examples/editor/minimal-valid-project/project'
import { compileCaseDraft } from '../src/editor/compiler/compileCaseDraft'
import { exportCasePackage, importCasePackage } from '../src/packages/casePackage'
import { exportProjectPackage, importProjectPackage } from '../src/packages/projectPackage'

const cover = new Uint8Array(await readFile(resolve(process.cwd(), 'examples/editor/minimal-valid-project/assets/spare-key-cover.png')))
const asset = minimalValidProject.draft.assets[0]
if (!asset) throw new Error('示例工程缺少封面资源声明。')
const compiled = compileCaseDraft(minimalValidProject.draft, [{ id: asset.id, mime: asset.mime, size: cover.length, sha256: asset.sha256 }])
if (!compiled.ok) throw new Error(`示例工程无法发布：${compiled.issues.map((issue) => issue.message).join('；')}`)
const caseAssets = new Map([[asset.id, cover]])
const projectAssets = new Map([[asset.path, cover]])
const casePackage = await exportCasePackage(compiled.caseDefinition, caseAssets)
const projectPackage = await exportProjectPackage(minimalValidProject, projectAssets)
const importedCase = await importCasePackage(casePackage.bytes, casePackage.filename)
const importedProject = await importProjectPackage(projectPackage.bytes, projectPackage.filename)
if (importedCase.caseDefinition.id !== compiled.caseDefinition.id || importedProject.project.projectId !== minimalValidProject.projectId) throw new Error('示例包内存往返校验失败。')
const output = resolve(process.cwd(), 'release-assets')
await mkdir(output, { recursive: true })
await writeFile(resolve(output, 'minimal-valid-case.ldmcase'), casePackage.bytes)
await writeFile(resolve(output, 'minimal-valid-project.ldmproject'), projectPackage.bytes)
console.log(`PASS packaged and re-imported · ${casePackage.filename} · ${projectPackage.filename}`)
