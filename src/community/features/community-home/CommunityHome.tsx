import { useMemo, useState } from 'react'
import type { CommunityRegistryIndex, CommunityCaseSummary, CommunityContentRating, CommunityDifficulty } from '../../types/communityTypes'
import { filterCommunityCases, searchCommunityCases } from '../../search/communitySearch'
import { TrustBadge } from '../../components/TrustBadge'
import { CommunityCaseCover } from '../../components/CommunityCaseCover'
import { compareSemver } from '../../updates/semver'

const difficultyLabel = { easy: '新手', normal: '普通', hard: '困难' } as const
type InstallationFilter = '' | 'installed' | 'updates'

export function CommunityHome({ index, installedVersions, resolvePath, onOpen }: {
  index: CommunityRegistryIndex
  installedVersions: Map<string, string>
  resolvePath: (path: string) => string
  onOpen: (item: CommunityCaseSummary) => void
}) {
  const [query, setQuery] = useState('')
  const [difficulty, setDifficulty] = useState<CommunityDifficulty | ''>('')
  const [rating, setRating] = useState<CommunityContentRating | ''>('')
  const [language, setLanguage] = useState('')
  const [tag, setTag] = useState('')
  const [duration, setDuration] = useState('')
  const [installationFilter, setInstallationFilter] = useState<InstallationFilter>('')
  const [curated, setCurated] = useState(false)
  const [showMature, setShowMature] = useState(false)
  const [sort, setSort] = useState('updated')
  const [view, setView] = useState<'list' | 'grid'>('list')
  const languages = useMemo(() => [...new Set(index.cases.flatMap((item) => [item.language, ...item.additionalLanguages]))].sort(), [index])
  const tags = useMemo(() => [...new Set(index.cases.flatMap((item) => item.tags))].sort((a, b) => a.localeCompare(b, 'zh-CN')), [index])
  const results = useMemo(() => {
    const filtered = filterCommunityCases(index.cases, {
      tags: tag ? [tag] : [], difficulties: difficulty ? [difficulty] : [], ratings: rating ? [rating] : ['general', 'teen', ...(showMature ? ['mature' as const] : [])],
      showMature, language: language || undefined, curated: curated ? true : undefined,
    }).filter((item) => {
      const installedVersion = installedVersions.get(item.caseId)
      if (installationFilter === 'installed' && !installedVersion) return false
      if (installationFilter === 'updates' && (!installedVersion || compareSemver(item.latestVersion, installedVersion) <= 0)) return false
      if (duration === 'short' && item.estimatedMinutes.max > 15) return false
      if (duration === 'medium' && (item.estimatedMinutes.min < 15 || item.estimatedMinutes.max > 30)) return false
      if (duration === 'long' && item.estimatedMinutes.min < 30) return false
      return true
    })
    const searched = searchCommunityCases(filtered, query)
    return [...searched].sort((a, b) => {
      if (sort === 'name') return a.title.localeCompare(b.title, 'zh-CN')
      if (sort === 'duration') return a.estimatedMinutes.min - b.estimatedMinutes.min
      if (sort === 'difficulty') return ['easy', 'normal', 'hard'].indexOf(a.difficulty) - ['easy', 'normal', 'hard'].indexOf(b.difficulty)
      if (sort === 'published') return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    })
  }, [index, installedVersions, query, difficulty, rating, language, tag, duration, installationFilter, curated, showMature, sort])
  const clear = () => { setQuery(''); setDifficulty(''); setRating(''); setLanguage(''); setTag(''); setDuration(''); setInstallationFilter(''); setCurated(false); setShowMature(false) }
  return <>
    <h1 className="community-page-title">社区档案</h1>
    <section className="community-tools">
      <label className="community-search"><span>搜索社区案件</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="标题、标签、发布者或语言" /></label>
      <fieldset><legend>筛选</legend>
        <select aria-label="难度" value={difficulty} onChange={(event) => setDifficulty(event.target.value as CommunityDifficulty | '')}><option value="">全部难度</option><option value="easy">新手</option><option value="normal">普通</option><option value="hard">困难</option></select>
        <select aria-label="语言" value={language} onChange={(event) => setLanguage(event.target.value)}><option value="">全部语言</option>{languages.map((value) => <option key={value}>{value}</option>)}</select>
        <select aria-label="标签" value={tag} onChange={(event) => setTag(event.target.value)}><option value="">全部标签</option>{tags.map((value) => <option key={value}>{value}</option>)}</select>
        <select aria-label="预计时长" value={duration} onChange={(event) => setDuration(event.target.value)}><option value="">全部时长</option><option value="short">15分钟内</option><option value="medium">15—30分钟</option><option value="long">30分钟以上</option></select>
        <select aria-label="安装状态" value={installationFilter} onChange={(event) => setInstallationFilter(event.target.value as InstallationFilter)}><option value="">全部状态</option><option value="installed">已经安装</option><option value="updates">有更新</option></select>
        <select aria-label="内容评级" value={rating} onChange={(event) => setRating(event.target.value as CommunityContentRating | '')}><option value="">general + teen</option><option value="general">general</option><option value="teen">teen</option>{showMature && <option value="mature">mature</option>}</select>
        <label><input type="checkbox" checked={curated} onChange={(event) => setCurated(event.target.checked)} /> 人工精选</label>
        <label><input type="checkbox" checked={showMature} onChange={(event) => setShowMature(event.target.checked)} /> 显示成熟主题案件</label>
      </fieldset>
      <div className="community-sort"><label>排序 <select value={sort} onChange={(event) => setSort(event.target.value)}><option value="updated">最近更新</option><option value="published">最近发布</option><option value="name">案件名称</option><option value="duration">预计时长</option><option value="difficulty">难度</option></select></label><button aria-label="列表视图" className={view === 'list' ? 'selected' : ''} onClick={() => setView('list')}>列表</button><button aria-label="紧凑网格视图" className={view === 'grid' ? 'selected' : ''} onClick={() => setView('grid')}>网格</button></div>
    </section>
    {results.length === 0 ? <section className="community-empty"><h2>没有匹配的馆藏条目</h2><p>可以清除筛选，或检查社区同步状态。</p><button onClick={clear}>清除筛选并查看全部</button></section> : <section className={`community-catalog ${view}`} aria-label="社区案件列表">{results.map((item) => {
      const installedVersion = installedVersions.get(item.caseId)
      const updateAvailable = Boolean(installedVersion && compareSemver(item.latestVersion, installedVersion) > 0)
      return <button className="community-case-row" key={item.caseId} onClick={() => onOpen(item)}>
        <CommunityCaseCover path={item.coverPath} resolvePath={resolvePath} title={item.title} archiveNumber={item.caseId.split('-').at(-1) ?? '—'} />
        <div className="community-case-copy"><small>{item.caseId} · v{item.latestVersion}</small><h2>{item.title}</h2>{item.subtitle && <p className="community-subtitle">{item.subtitle}</p>}<p>{item.summary}</p><div className="community-tags">{item.tags.map((value) => <span key={value}>{value}</span>)}</div></div>
        <dl><div><dt>发布者</dt><dd>{item.publisherId}</dd></div><div><dt>难度</dt><dd>{difficultyLabel[item.difficulty]}</dd></div><div><dt>预计时长</dt><dd>{item.estimatedMinutes.min}—{item.estimatedMinutes.max} 分钟</dd></div><div><dt>内容评级</dt><dd>{item.contentRating}</dd></div></dl>
        <div className="community-row-state"><TrustBadge curated={item.curated} /><span>{updateAvailable ? `有更新 · v${installedVersion} → v${item.latestVersion}` : installedVersion ? `已安装 v${installedVersion}` : item.status === 'deprecated' ? '停止维护' : item.status === 'blocked' ? '已阻止' : '可安装'}</span></div>
      </button>
    })}</section>}
  </>
}
