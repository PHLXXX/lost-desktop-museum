import { prepareCommunitySubmissionCli } from '../src/editor/features/community-publishing/communityPrepareCli'

function option(name: string) { const index = process.argv.indexOf(name); return index >= 0 ? process.argv[index + 1] : undefined }
const packagePath = option('--package'); const publisherPath = option('--publisher'); const screenshotsPath = option('--screenshots'); const outputPath = option('--output'); const dryRun = process.argv.includes('--dry-run')
if (!packagePath || !publisherPath || !screenshotsPath || !outputPath) {
  console.error('Usage: npm run community:prepare -- --package <case.ldmcase> --publisher <publisher.json> --screenshots <folder> --output <folder> [--dry-run]')
  process.exitCode = 2
} else {
  const result = await prepareCommunitySubmissionCli({ packagePath, publisherPath, screenshotsPath, outputPath, dryRun })
  console.log(`${dryRun ? 'DRY RUN PASS' : 'PASS'} ${result.entry.caseId}@${result.entry.version}`)
  console.log(`Suggested catalog path: ${result.suggestedDirectory}`)
  console.log(`Suggested PR title: ${result.suggestedPullRequestTitle}`)
}
