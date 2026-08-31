import type { CommunityCaseSummary, CommunityContentRating, CommunityDifficulty } from '../types/communityTypes'

export interface CommunityFilters { tags: string[]; difficulties: CommunityDifficulty[]; ratings: CommunityContentRating[]; showMature: boolean; language?: string; curated?: boolean; installedIds?: Set<string>; updatesOnly?: boolean }
const normalize = (value: string) => value.normalize('NFKC').toLocaleLowerCase().trim()
function score(item: CommunityCaseSummary, rawQuery: string) {
  const query = normalize(rawQuery); if (!query) return 1
  const words = query.split(/\s+/).filter(Boolean)
  const title = normalize(item.title); const subtitle = normalize(item.subtitle ?? ''); const tags = normalize(item.tags.join(' ')); const publisher = normalize(item.publisherId); const languages = normalize([item.language, ...item.additionalLanguages].join(' ')); const summary = normalize(item.summary)
  if (!words.every((word) => [title, subtitle, tags, publisher, languages, summary].some((field) => field.includes(word)))) return 0
  return (title === query ? 100 : title.includes(query) ? 50 : 0) + (subtitle.includes(query) ? 20 : 0) + (tags.includes(query) ? 16 : 0) + (publisher.includes(query) ? 8 : 0) + (languages.includes(query) ? 6 : 0) + (summary.includes(query) ? 4 : 0)
}
export function searchCommunityCases(items: CommunityCaseSummary[], query: string) { return items.map((item) => ({ item, score: score(item, query) })).filter(({ score }) => score > 0).sort((left, right) => right.score - left.score || left.item.title.localeCompare(right.item.title, 'zh-CN')).map(({ item }) => item) }
export function filterCommunityCases(items: CommunityCaseSummary[], filters: CommunityFilters) {
  return items.filter((item) => {
    if (item.contentRating === 'mature' && !filters.showMature) return false
    if (filters.tags.length && !filters.tags.every((tag) => item.tags.includes(tag))) return false
    if (filters.difficulties.length && !filters.difficulties.includes(item.difficulty)) return false
    if (filters.ratings.length && !filters.ratings.includes(item.contentRating)) return false
    if (filters.language && ![item.language, ...item.additionalLanguages].includes(filters.language)) return false
    if (filters.curated !== undefined && item.curated !== filters.curated) return false
    if (filters.installedIds && !filters.installedIds.has(item.caseId)) return false
    return true
  })
}
