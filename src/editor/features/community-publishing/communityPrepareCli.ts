import { readFile, readdir, mkdir, writeFile } from 'node:fs/promises'
import { basename, extname, join, resolve } from 'node:path'
import { unzipSync } from 'fflate'
import { importCasePackage } from '../../../packages/casePackage'
import { parseCommunityPublisher } from '../../../community/schema/registrySchema'
import { buildSubmissionBundle, type BuiltSubmissionBundle, type SubmissionScreenshot } from './SubmissionBundleBuilder'

export interface CommunityPrepareCliOptions { packagePath: string; publisherPath: string; screenshotsPath: string; outputPath: string; dryRun: boolean; generatedAt?: string }
function screenshotMime(path: string): SubmissionScreenshot['mime'] {
  const extension = extname(path).toLowerCase(); if (extension === '.png') return 'image/png'; if (extension === '.jpg' || extension === '.jpeg') return 'image/jpeg'; if (extension === '.webp') return 'image/webp'; throw new Error(`不支持的截图格式：${path}`)
}
export async function prepareCommunitySubmissionCli(options: CommunityPrepareCliOptions): Promise<BuiltSubmissionBundle> {
  const packagePath = resolve(options.packagePath); const packageBytes = new Uint8Array(await readFile(packagePath)); const imported = await importCasePackage(packageBytes, basename(packagePath))
  const publisher = parseCommunityPublisher(JSON.parse(await readFile(resolve(options.publisherPath), 'utf8')) as unknown)
  const files = (await readdir(resolve(options.screenshotsPath), { withFileTypes: true })).filter((item) => item.isFile()).map((item) => join(resolve(options.screenshotsPath), item.name)).sort()
  const screenshots = await Promise.all(files.map(async (path) => ({ filename: basename(path), mime: screenshotMime(path), bytes: new Uint8Array(await readFile(path)) })))
  const definition = imported.caseDefinition
  const bundle = await buildSubmissionBundle({ packageBytes, packageFilename: basename(packagePath), publisher, metadata: { title: definition.title, subtitle: definition.manifest.subtitle, summary: definition.manifest.summary, language: definition.manifest.language, additionalLanguages: [], difficulty: definition.manifest.difficulty === '入门' ? 'easy' : definition.manifest.difficulty === '困难' ? 'hard' : 'normal', estimatedMinutes: { min: Math.max(5, definition.manifest.estimatedMinutes - 5), max: definition.manifest.estimatedMinutes + 5 }, tags: definition.manifest.tags, contentRating: definition.manifest.contentWarnings.length ? 'teen' : 'general', contentWarnings: definition.manifest.contentWarnings, license: { name: 'MIT' }, changelog: `发布 ${definition.manifest.version}：由档案工坊完整校验后生成。`, engineCompatibility: { minimum: '0.5.0' }, saveCompatibility: { mode: 'compatible', compatibleFromVersions: [definition.manifest.version] }, requestCuration: false }, screenshots, generatedAt: options.generatedAt })
  if (!options.dryRun) {
    const output = resolve(options.outputPath); await mkdir(output, { recursive: true }); await writeFile(join(output, bundle.filename), bundle.bytes)
    for (const [path, bytes] of Object.entries(unzipSync(bundle.bytes))) { const target = join(output, path); await mkdir(resolve(target, '..'), { recursive: true }); await writeFile(target, bytes) }
  }
  return bundle
}
