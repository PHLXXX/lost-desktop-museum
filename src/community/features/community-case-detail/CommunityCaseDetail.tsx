import { useEffect, useState } from 'react'
import { loadGameSave } from '../../../engine/persistence'
import { ArchiveDialog } from '../../../features/system/ArchiveDialog'
import type { CommunityCaseDetail as Detail, CommunityPublisher } from '../../types/communityTypes'
import type { CommunityInstallationRecord } from '../../types/installedCaseSource'
import { communityPreferencesRepository, type CommunityPreference } from '../../preferences/communityPreferences'
import { TrustBadge } from '../../components/TrustBadge'
import { compareSemver } from '../../updates/semver'

const difficulty = { easy: '新手', normal: '普通', hard: '困难' } as const
const reportTypes = ['包损坏', '内容提示不准确', '版权问题', '隐私问题', '冒充', '恶意或误导内容', '其他'] as const

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} bytes`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

function contentReportUrl(detail: Detail, registryVersion: string, reportType: string) {
  const version = detail.latestVersion
  const body = [`## 社区内容问题`, '', `- caseId: ${detail.caseId}`, `- version: ${version}`, `- problemType: ${reportType}`, `- registryVersion: ${registryVersion}`, '', '此链接未包含玩家存档、调查内容、私人备注或设备信息。'].join('\n')
  return `https://github.com/PHLXXX/lost-desktop-museum-community/issues/new?${new URLSearchParams({ title: `content: ${detail.caseId}@${version}`, body, labels: 'content-report' })}`
}

export function CommunityCaseDetail({ detail, publisher, registryVersion, installation, offline, resolvePath, onBack, onInstall, onStart, onUninstall, onRollback }: {
  detail: Detail
  publisher: CommunityPublisher | null
  registryVersion: string
  installation: CommunityInstallationRecord | null
  offline: boolean
  resolvePath: (path: string) => string
  onBack: () => void
  onInstall: () => void
  onStart: () => void
  onUninstall: (deleteProgress: boolean) => void
  onRollback: (version: string) => void
}) {
  const [preference, setPreference] = useState<CommunityPreference>({ caseId: detail.caseId, favorite: false, rating: null, note: '', updatedAt: '' })
  const [notice, setNotice] = useState('')
  const [externalUrl, setExternalUrl] = useState<string | null>(null)
  const [uninstall, setUninstall] = useState(false)
  const [deleteProgress, setDeleteProgress] = useState(false)
  const [reportOpen, setReportOpen] = useState(false)
  const [reportType, setReportType] = useState<(typeof reportTypes)[number]>('包损坏')
  const [rollbackVersion, setRollbackVersion] = useState<string | null>(null)
  useEffect(() => { void communityPreferencesRepository.get(detail.caseId).then((value) => { if (value) setPreference(value) }) }, [detail.caseId])
  const savePreference = (next: CommunityPreference) => { setPreference(next); void communityPreferencesRepository.save(detail.caseId, next); setNotice('仅保存到本设备') }
  const latest = detail.versions.find((item) => item.version === detail.latestVersion) ?? detail.versions.at(-1)!
  const versionComparison = installation ? compareSemver(detail.latestVersion, installation.installedVersion) : 1
  const hasUpdate = Boolean(installation && versionComparison > 0)
  const installedAhead = Boolean(installation && versionComparison < 0)
  const save = loadGameSave(window.localStorage, detail.caseId).save
  const storedBytes = installation ? installation.packageBlob.size + installation.rollbackVersions.reduce((total, item) => total + item.packageBlob.size, 0) : 0
  const share = async () => {
    try { await navigator.clipboard.writeText(window.location.href); setNotice('详情链接已复制；不会自动下载或安装。') }
    catch { setNotice('浏览器未允许复制；可以直接复制地址栏中的详情链接。') }
  }
  return <>
    <button className="community-back" onClick={onBack}>← 返回社区目录</button>
    <article className="community-detail">
      <header>
        <div className="community-detail-cover"><span>COMMUNITY ARCHIVE</span><b>{detail.caseId.split('-').at(-1)}</b><small>v{detail.latestVersion}</small></div>
        <div><small>{detail.caseId}</small><h1>{detail.title}</h1>{detail.subtitle && <p className="community-detail-subtitle">{detail.subtitle}</p>}<p>{detail.summary}</p><TrustBadge curated={detail.curated} />{detail.status === 'deprecated' && <p className="community-warning">此案件已停止维护；已安装副本仍可游玩。</p>}{detail.status === 'blocked' && <p className="community-error">此案件已被阻止：{detail.blockReason ?? '维护者正在处理内容或包问题。'}</p>}</div>
        <aside><button className="primary-button" disabled={offline || detail.status === 'blocked' || Boolean(installation && !hasUpdate)} onClick={onInstall}>{installation ? hasUpdate ? '查看并安装更新' : installedAhead ? `本地版本 v${installation.installedVersion} 较新` : `已安装 v${installation.installedVersion}` : '安装到档案馆'}</button>{installation && <button onClick={onStart}>开始调查</button>}<button onClick={() => void share()}>复制分享链接</button><small>{offline ? '离线时不能下载或更新；已安装案件仍可开始。' : installedAhead ? '目录不会把较旧版本静默覆盖到本地。' : '点击安装前不会下载完整案件包。'}</small></aside>
      </header>
      <section className="community-detail-facts">
        <dl><div><dt>发布者</dt><dd>{publisher?.displayName ?? detail.publisherId}</dd></div><div><dt>语言</dt><dd>{[detail.language, ...detail.additionalLanguages].join(' / ')}</dd></div><div><dt>难度</dt><dd>{difficulty[detail.difficulty]}</dd></div><div><dt>预计时长</dt><dd>{detail.estimatedMinutes.min}—{detail.estimatedMinutes.max} 分钟</dd></div><div><dt>内容评级</dt><dd>{detail.contentRating}</dd></div><div><dt>包大小</dt><dd>{formatBytes(latest.packageByteSize)}</dd></div><div><dt>引擎要求</dt><dd>≥ {latest.engineCompatibility.minimum}</dd></div><div><dt>许可证</dt><dd>{latest.license.name}</dd></div></dl>
        <section><h2>内容提示</h2><p>{detail.contentWarnings.length ? detail.contentWarnings.join('、') : '无特别内容提示'}</p><h2>信任范围</h2><p>自动校验可以降低格式和执行风险，但不能替代对故事内容、版权和主题的人工判断。</p></section>
      </section>
      {publisher && <section className="community-publisher"><div><h2>发布者资料</h2><strong>{publisher.displayName}</strong><small>{publisher.publisherId} · {publisher.languages.join(' / ')}</small><p>{publisher.description}</p></div><div>{publisher.repositoryUrl && <button className="text-button" onClick={() => setExternalUrl(publisher.repositoryUrl!)}>GitHub资料（外部：{new URL(publisher.repositoryUrl).hostname}）</button>}{publisher.links.map((link) => <button key={link.url} className="text-button" onClick={() => setExternalUrl(link.url)}>{link.label}（外部：{new URL(link.url).hostname}）</button>)}</div></section>}
      <section className="community-screenshots"><h2>案件截图</h2><div>{latest.screenshots.map((path, index) => <img key={path} loading="lazy" src={resolvePath(path)} alt={`${detail.title}社区截图 ${index + 1}`} onError={(event) => { event.currentTarget.hidden = true }} />)}</div></section>
      <section className="community-version-panel"><h2>版本历史</h2>{[...detail.versions].reverse().map((version) => <article key={version.version}><div><strong>v{version.version}</strong><span>{new Date(version.updatedAt).toLocaleDateString('zh-CN')}</span>{version.version === installation?.installedVersion && <em>当前安装</em>}</div><p>{version.changelog}</p><code>SHA-256 {version.packageSha256}</code>{installation?.rollbackVersions.some((item) => item.version === version.version) && <button onClick={() => setRollbackVersion(version.version)}>回滚到此版本</button>}</article>)}</section>
      <section className="community-private"><div><h2>私人记录</h2><p>收藏、评分和备注仅保存在本设备，不会公开或上传。</p></div><label><input type="checkbox" checked={preference.favorite} onChange={(event) => savePreference({ ...preference, favorite: event.target.checked })} /> 收藏此案件</label><fieldset><legend>私人评分</legend>{([1, 2, 3, 4, 5] as const).map((rating) => <button aria-pressed={preference.rating === rating} key={rating} onClick={() => savePreference({ ...preference, rating })}>{rating}</button>)}</fieldset><label><span>私人备注</span><textarea maxLength={5000} value={preference.note} onChange={(event) => setPreference({ ...preference, note: event.target.value })} onBlur={() => savePreference(preference)} /></label>{notice && <small role="status">{notice}</small>}</section>
      <footer className="community-detail-actions"><button onClick={() => setReportOpen(true)}>报告内容问题</button>{installation && <button className="danger-button" onClick={() => setUninstall(true)}>卸载社区案件</button>}</footer>
    </article>
    {reportOpen && <ArchiveDialog title="报告内容问题" onClose={() => setReportOpen(false)} actions={<><button onClick={() => setReportOpen(false)}>取消</button><button className="primary-button" onClick={() => { setReportOpen(false); setExternalUrl(contentReportUrl(detail, registryVersion, reportType)) }}>继续到 GitHub</button></>}><p>{detail.title} · v{detail.latestVersion} · {detail.publisherId}</p><label className="dialog-setting"><span>反馈类型</span><select value={reportType} onChange={(event) => setReportType(event.target.value as (typeof reportTypes)[number])}>{reportTypes.map((value) => <option key={value}>{value}</option>)}</select></label><p>只会预填 caseId、版本、问题类型和社区索引版本；不会包含存档、私人备注、调查内容、设备标识或浏览历史。</p></ArchiveDialog>}
    {externalUrl && <ArchiveDialog title="打开外部链接？" onClose={() => setExternalUrl(null)} actions={<><button onClick={() => setExternalUrl(null)}>取消</button><a className="primary-button" href={externalUrl} target="_blank" rel="noopener noreferrer" onClick={() => setExternalUrl(null)}>打开 {new URL(externalUrl).hostname}</a></>}><p>目标域名：<strong>{new URL(externalUrl).hostname}</strong>。不会上传玩家存档、调查内容、私人评分或备注。</p></ArchiveDialog>}
    {rollbackVersion && <ArchiveDialog title="回滚社区案件？" onClose={() => setRollbackVersion(null)} actions={<><button onClick={() => setRollbackVersion(null)}>取消</button><button className="primary-button" onClick={() => { const version = rollbackVersion; setRollbackVersion(null); onRollback(version) }}>检查兼容性并回滚</button></>}><p>将从 v{installation?.installedVersion} 回滚到 v{rollbackVersion}。当前包和进度会先进入回滚备份；不兼容时操作会被拒绝。</p></ArchiveDialog>}
    {uninstall && <ArchiveDialog title="卸载社区案件？" onClose={() => setUninstall(false)} actions={<><button onClick={() => setUninstall(false)}>取消</button><button className="danger-button" onClick={() => { setUninstall(false); onUninstall(deleteProgress) }}>确认卸载</button></>}><dl className="uninstall-summary"><div><dt>案件</dt><dd>{detail.title}</dd></div><div><dt>版本</dt><dd>{installation?.installedVersion}</dd></div><div><dt>调查进度</dt><dd>{save.discoveredClueIds.length} 条线索 · {Math.floor(save.playTime / 60)} 分钟</dd></div><div><dt>最高分</dt><dd>{save.bestScore ?? save.deductionResult?.score ?? '—'}</dd></div><div><dt>本地包占用</dt><dd>{formatBytes(storedBytes)}</dd></div><div><dt>回滚包</dt><dd>{installation?.rollbackVersions.length ?? 0}</dd></div><div><dt>收藏</dt><dd>{preference.favorite ? '保留' : '无'}</dd></div><div><dt>私人备注</dt><dd>{preference.note ? '保留' : '无'}</dd></div></dl><label className="dialog-setting"><span>同时删除该案件的调查进度</span><input type="checkbox" checked={deleteProgress} onChange={(event) => setDeleteProgress(event.target.checked)} /></label><p>{deleteProgress ? '案件资源和进度都会删除；收藏、评分和私人备注仍保留。' : '只删除案件资源；本地进度将保留，兼容版本重新安装后可尝试恢复。'}</p></ArchiveDialog>}
  </>
}
