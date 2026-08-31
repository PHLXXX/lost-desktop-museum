export type CommunityDifficulty = 'easy' | 'normal' | 'hard'
export type CommunityContentRating = 'general' | 'teen' | 'mature'
export type CommunityCaseStatus = 'active' | 'deprecated' | 'blocked'

export interface PublisherLink { label: string; url: string }
export interface CommunityPublisher {
  schemaVersion: 1
  publisherId: string
  displayName: string
  description: string
  githubUsername?: string
  repositoryUrl?: string
  avatarPath?: string
  languages: string[]
  links: PublisherLink[]
  joinedAt: string
  status: 'active' | 'suspended'
}

export interface CommunityCaseSummary {
  caseId: string
  latestVersion: string
  publisherId: string
  title: string
  subtitle?: string
  summary: string
  language: string
  additionalLanguages: string[]
  difficulty: CommunityDifficulty
  estimatedMinutes: { min: number; max: number }
  tags: string[]
  contentRating: CommunityContentRating
  contentWarnings: string[]
  coverPath?: string
  status: CommunityCaseStatus
  curated: boolean
  featured: boolean
  publishedAt: string
  updatedAt: string
  detailPath: string
}

export interface CommunityRegistryIndex {
  schemaVersion: 1
  registryVersion: string
  generatedAt: string
  sourceCommit: string
  engineCompatibility: { minimumClientVersion: string }
  stats: { activeCases: number; publishers: number; languages: number; totalPackageBytes: number }
  featuredCaseIds: string[]
  cases: CommunityCaseSummary[]
}

export interface CommunitySaveCompatibility {
  mode: 'compatible' | 'requires-review' | 'incompatible'
  compatibleFromVersions: string[]
  notes?: string
}

export interface CommunityCaseVersion {
  version: string
  packagePath: string
  packageSha256: string
  packageByteSize: number
  engineCompatibility: { minimum: string; maximumExclusive?: string }
  saveCompatibility: CommunitySaveCompatibility
  changelog: string
  screenshots: string[]
  license: { name: string; url?: string; customTextPath?: string }
  automatedValidation: { passed: true; checkedAt: string }
  publishedAt: string
  updatedAt: string
}

export interface CommunityCaseDetail {
  schemaVersion: 1
  caseId: string
  publisherId: string
  title: string
  subtitle?: string
  summary: string
  language: string
  additionalLanguages: string[]
  difficulty: CommunityDifficulty
  estimatedMinutes: { min: number; max: number }
  tags: string[]
  contentRating: CommunityContentRating
  contentWarnings: string[]
  status: CommunityCaseStatus
  blockReason?: string
  curated: boolean
  featured: boolean
  publisherPath: string
  latestVersion: string
  versions: CommunityCaseVersion[]
}

export interface CommunityCatalogEntry {
  schemaVersion: 1
  caseId: string
  version: string
  publisherId: string
  title: string
  subtitle?: string
  summary: string
  language: string
  additionalLanguages: string[]
  difficulty: CommunityDifficulty
  estimatedMinutes: { min: number; max: number }
  tags: string[]
  contentRating: CommunityContentRating
  contentWarnings: string[]
  engineCompatibility: { minimum: string; maximumExclusive?: string }
  packageFile: string
  changelogFile: string
  screenshotFiles: string[]
  license: { name: string; url?: string; customTextFile?: string }
  distributionConsent: true
  saveCompatibility: CommunitySaveCompatibility
  status: CommunityCaseStatus
  moderation: { automatedValidationRequired: true; curated: boolean; featured: boolean; notes?: string }
  publishedAt: string
  updatedAt: string
}
