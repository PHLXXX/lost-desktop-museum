import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { clearGameSave, loadGameSave, saveGameSave } from '../../engine/persistence'
import { registerInstalledCase, unregisterInstalledCase } from '../../cases/registry'
import { ArchiveDialog } from '../../features/system/ArchiveDialog'
import { getCommunityRegistryUrl } from '../config/communityConfig'
import { CommunityRegistryClient, type RegistryLoadResult } from '../client/registryClient'
import { downloadCasePackage, type DownloadProgress } from '../client/downloadCasePackage'
import { communityInstallManager, type PreparedCommunityInstall } from '../install/communityInstallManager'
import { communityInstallationRepository } from '../install/communityInstallationRepository'
import { analyzeUpdateCompatibility, type UpdateCompatibilityResult } from '../updates/updateCompatibility'
import type { CommunityCaseDetail, CommunityCaseSummary, CommunityPublisher } from '../types/communityTypes'
import type { CommunityInstallationRecord } from '../types/installedCaseSource'
import { RegistryStatus } from '../components/RegistryStatus'
import { CommunityHome } from './community-home/CommunityHome'
import { CommunityCaseDetail as DetailView } from './community-case-detail/CommunityCaseDetail'
import { InstallProgressDialog, type InstallPhase } from '../components/InstallProgressDialog'
import '../../styles/community.css'

export default function CommunityEntry({ initialCaseId, onReturnMuseum, onStartCase }: { initialCaseId?: string | null; onReturnMuseum: () => void; onStartCase: (caseId: string) => void }) {
  const registryUrl = useMemo(() => getCommunityRegistryUrl(), [])
  const client = useMemo(() => new CommunityRegistryClient(registryUrl), [registryUrl])
  const [catalog, setCatalog] = useState<RegistryLoadResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<CommunityCaseSummary | null>(null)
  const [detail, setDetail] = useState<CommunityCaseDetail | null>(null)
  const [publisher, setPublisher] = useState<CommunityPublisher | null>(null)
  const [installations, setInstallations] = useState<CommunityInstallationRecord[]>([])
  const [ignoreInitialCase, setIgnoreInitialCase] = useState(false)
  const [installOpen, setInstallOpen] = useState(false)
  const [installPhase, setInstallPhase] = useState<InstallPhase>('confirm')
  const [progress, setProgress] = useState<DownloadProgress | null>(null)
  const [prepared, setPrepared] = useState<PreparedCommunityInstall | null>(null)
  const [installError, setInstallError] = useState<string | null>(null)
  const [compatibility, setCompatibility] = useState<UpdateCompatibilityResult | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const load = useCallback(async (force = false) => {
    setLoading(true)
    setError(null)
    try { setCatalog(await client.load({ force })) }
    catch (reason) { setError(reason instanceof Error ? reason.message : '社区目录暂时不可用。') }
    finally { setLoading(false) }
  }, [client])
  useEffect(() => {
    void Promise.resolve().then(() => load())
    void communityInstallationRepository.list().then(setInstallations)
  }, [load])
  const effectiveSelected = selected && catalog
    ? catalog.index.cases.find((value) => value.caseId === selected.caseId) ?? selected
    : selected ?? (!ignoreInitialCase && initialCaseId && catalog ? catalog.index.cases.find((value) => value.caseId === initialCaseId) ?? null : null)
  const initialMissing = Boolean(initialCaseId && catalog && !effectiveSelected)
  useEffect(() => {
    if (!effectiveSelected) return
    let active = true
    void client.detail(effectiveSelected.detailPath, { expectedVersion: effectiveSelected.latestVersion, expectedCaseId: effectiveSelected.caseId }).then(async (value) => {
      if (!active) return
      setDetail(value)
      try { const author = await client.publisher(value.publisherPath, value.publisherId); if (active) setPublisher(author) }
      catch { if (active) setPublisher(null) }
    }).catch((reason) => { if (active) setError(reason instanceof Error ? reason.message : '案件详情暂时不可用。') })
    return () => { active = false }
  }, [client, effectiveSelected])
  const openCase = (item: CommunityCaseSummary) => { setIgnoreInitialCase(true); setSelected(item); window.location.hash = `#/community/cases/${item.caseId}` }
  const back = () => { setIgnoreInitialCase(true); setSelected(null); setDetail(null); window.location.hash = '#/community' }
  const latest = detail?.versions.find((item) => item.version === detail.latestVersion) ?? null
  const installation = detail ? installations.find((item) => item.caseId === detail.caseId) ?? null : null
  const openInstall = () => { setInstallPhase('confirm'); setProgress(null); setPrepared(null); setInstallError(null); setInstallOpen(true) }
  const download = async () => {
    if (!detail || !latest) return
    const controller = new AbortController()
    abortRef.current = controller
    setInstallPhase('downloading')
    setInstallError(null)
    try {
      const bytes = await downloadCasePackage(client.resolver.resolve(latest.packagePath), { signal: controller.signal, expectedBytes: latest.packageByteSize, onProgress: setProgress })
      setInstallPhase('validating')
      setPrepared(await communityInstallManager.prepare(detail, latest, bytes))
      setInstallPhase('ready')
    } catch (reason) {
      setInstallError(reason instanceof Error ? reason.message : '下载或校验失败。')
      setInstallPhase('error')
    } finally { abortRef.current = null }
  }
  const performInstall = async (resetProgress = false) => {
    if (!prepared || !detail) return
    setCompatibility(null)
    setInstallPhase('installing')
    try {
      const progressSnapshot = installation ? loadGameSave(window.localStorage, detail.caseId).save : undefined
      const record = await communityInstallManager.install(prepared, registryUrl, catalog?.index.registryVersion ?? '1.0.0', { progressSnapshot })
      registerInstalledCase(prepared.imported.caseDefinition)
      if (resetProgress) clearGameSave(window.localStorage, detail.caseId)
      setInstallations((items) => [...items.filter((item) => item.caseId !== record.caseId), record])
      setInstallPhase('success')
    } catch (reason) {
      setInstallError(reason instanceof Error ? reason.message : '安装失败。')
      setInstallPhase('error')
    }
  }
  const confirmInstall = () => {
    if (!prepared || !detail || !installation) { void performInstall(); return }
    const current = loadGameSave(window.localStorage, detail.caseId).save
    const result = analyzeUpdateCompatibility(current, prepared.imported.caseDefinition, prepared.version.saveCompatibility, installation.installedVersion)
    if (result.status === 'compatible') void performInstall()
    else setCompatibility(result)
  }
  const exportProgress = async () => {
    if (!detail) return
    const [{ exportSavePackage }, { downloadFile }, { communityPreferencesRepository }] = await Promise.all([import('../../packages/savePackage'), import('../../editor/utils/downloadFile'), import('../preferences/communityPreferences')])
    const preference = await communityPreferencesRepository.get(detail.caseId)
    const exported = exportSavePackage(loadGameSave(window.localStorage, detail.caseId).save, installation?.installedVersion ?? detail.latestVersion, undefined, preference ? { favorite: preference.favorite, rating: preference.rating, note: preference.note } : undefined)
    downloadFile(exported.filename, exported.bytes, 'application/json')
  }
  const uninstall = async (deleteProgress: boolean) => {
    if (!detail) return
    await communityInstallManager.uninstall(detail.caseId)
    unregisterInstalledCase(detail.caseId)
    if (deleteProgress) clearGameSave(window.localStorage, detail.caseId)
    setInstallations((items) => items.filter((item) => item.caseId !== detail.caseId))
  }
  const rollback = async (version: string) => {
    if (!detail) return
    try {
      const progressSnapshot = loadGameSave(window.localStorage, detail.caseId).save
      const result = await communityInstallManager.rollback(detail.caseId, version, detail, progressSnapshot)
      if (result.restoredProgress) saveGameSave(window.localStorage, result.restoredProgress)
      const definition = await (await import('../../storage/caseRepository')).caseRepository.get(detail.caseId)
      if (definition) registerInstalledCase(definition)
      setInstallations((items) => [...items.filter((item) => item.caseId !== detail.caseId), result.record])
    } catch (reason) { setError(reason instanceof Error ? reason.message : '回滚失败，原版本保持不变。') }
  }
  const installedVersions = useMemo(() => new Map(installations.map((item) => [item.caseId, item.installedVersion])), [installations])
  return <main className="community-shell">
    <header className="community-header"><div><button onClick={onReturnMuseum}>← 我的档案</button><span>档案交换站</span><small>ARCHIVE EXCHANGE · STATIC REGISTRY</small></div><nav aria-label="社区导航"><button className="nav-current" onClick={back}>社区档案</button><button onClick={onReturnMuseum}>档案工坊与本地馆藏</button></nav></header>
    <div className="community-body">
      <RegistryStatus loading={loading} offline={catalog?.offline ?? !navigator.onLine} source={catalog?.source} fetchedAt={catalog?.fetchedAt} version={catalog?.index.registryVersion} onRefresh={() => void load(true)} />
      {error && <section className="community-error-state" role="alert"><h2>社区目录未能完成操作</h2><p>{error}</p><div><button onClick={() => void load(true)}>重试</button><button onClick={onReturnMuseum}>返回我的档案</button></div></section>}
      {initialMissing && !error && <section className="community-error-state"><h2>未找到这个社区案件</h2><p>可以返回目录或手动刷新后重试。</p><div><button onClick={back}>返回社区</button><button onClick={() => void load(true)}>刷新目录</button></div></section>}
      {catalog && !effectiveSelected && !initialMissing && <CommunityHome index={catalog.index} installedVersions={installedVersions} resolvePath={client.resolver.resolve} onOpen={openCase} />}
      {effectiveSelected && !detail && !error && <section className="community-empty" aria-busy="true">正在读取案件详情…</section>}
      {detail && <DetailView detail={detail} publisher={publisher} registryVersion={catalog?.index.registryVersion ?? 'unknown'} installation={installation} offline={catalog?.offline ?? false} resolvePath={client.resolver.resolve} onBack={back} onInstall={openInstall} onStart={() => onStartCase(detail.caseId)} onUninstall={(removeProgress) => void uninstall(removeProgress)} onRollback={(version) => void rollback(version)} />}
    </div>
    <footer className="community-footer"><span>静态目录 · 无账号 · 无公开评分 · 无下载统计</span><span>收藏、评分、备注和调查进度仅保存在本设备</span></footer>
    {installOpen && detail && latest && <InstallProgressDialog detail={detail} version={latest} phase={installPhase} progress={progress} prepared={prepared} error={installError} onClose={() => setInstallOpen(false)} onDownload={() => void download()} onInstall={confirmInstall} onCancel={() => { abortRef.current?.abort(); setInstallOpen(false) }} onStart={() => onStartCase(detail.caseId)} onMuseum={onReturnMuseum} />}
    {compatibility && detail && <ArchiveDialog title={compatibility.status === 'incompatible' ? '此更新与当前进度不兼容' : '更新前需要检查进度'} onClose={() => setCompatibility(null)} actions={<><button onClick={() => setCompatibility(null)}>取消更新</button><button onClick={() => void exportProgress()}>导出进度</button>{compatibility.status === 'review-required' && <button className="primary-button" onClick={() => void performInstall(false)}>更新并保留可兼容进度</button>}{compatibility.status === 'incompatible' && <button className="danger-button" onClick={() => void performInstall(true)}>更新并重置本案</button>}</>}><p>更新不会静默删除进度。当前包和当前进度会进入回滚备份；仍建议先导出 `.ldmsave`。</p>{'warnings' in compatibility && compatibility.warnings.length > 0 && <ul>{compatibility.warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul>}{'affectedProgress' in compatibility && compatibility.affectedProgress.length > 0 && <ul>{compatibility.affectedProgress.map((item) => <li key={`${item.type}:${item.id}`}><code>{item.id}</code>：{item.reason}</li>)}</ul>}{'reasons' in compatibility && <ul>{compatibility.reasons.map((reason) => <li key={reason}>{reason}</li>)}</ul>}</ArchiveDialog>}
  </main>
}
