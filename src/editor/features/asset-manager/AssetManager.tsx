import { useEffect, useMemo, useState } from 'react'
import type { StoredAsset } from '../../../storage/assetRepository'
import type { CaseDraft } from '../../model/caseDraft'
import { editorAssetRepository, hashBlob } from '../../storage/editorAssetRepository'
import { validateAssetFile } from '../../storage/assetSignature'
import { useEditorStore } from '../../store/editorStore'

const MAX_ASSET_BYTES = 20 * 1024 * 1024

function cleanName(name: string, fallback: string) {
  const normalized = name.toLowerCase().replace(/[^a-z0-9._-]+/g, '-').replace(/^-+/, '')
  return normalized && normalized !== '.' ? normalized : fallback
}

function assetId(asset: StoredAsset) {
  return asset.assetKey.slice(asset.ownerId.length + 1)
}

function collectReferences(draft: CaseDraft, id: string) {
  const results: string[] = []
  const walk = (value: unknown, path: string) => {
    if (value === id) { results.push(path); return }
    if (Array.isArray(value)) value.forEach((item, index) => walk(item, `${path}[${index}]`))
    else if (value && typeof value === 'object') Object.entries(value).forEach(([key, item]) => walk(item, path ? `${path}.${key}` : key))
  }
  Object.entries(draft).filter(([key]) => key !== 'assets').forEach(([key, value]) => walk(value, key))
  return results
}

export function AssetManager() {
  const { currentProject: project, updateDraft } = useEditorStore()
  const [assets, setAssets] = useState<StoredAsset[]>([])
  const [selectedKey, setSelectedKey] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const [mediaInfo, setMediaInfo] = useState('—')

  useEffect(() => { if (project) void editorAssetRepository.list(project.projectId).then(setAssets) }, [project])
  const selected = assets.find((asset) => asset.assetKey === selectedKey) ?? assets[0]
  const selectedRef = selected ? project?.draft.assets.find((ref) => ref.sha256 === selected.sha256 || ref.id === assetId(selected)) : undefined
  const references = selectedRef && project ? collectReferences(project.draft, selectedRef.id) : []
  const previewUrl = useMemo(() => selected ? URL.createObjectURL(selected.blob) : null, [selected])
  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl) }, [previewUrl])

  if (!project) return null

  const refreshAssets = async () => setAssets(await editorAssetRepository.list(project.projectId))
  const prepareFile = async (file: File) => {
    if (file.size > MAX_ASSET_BYTES) throw new Error(`${file.name} 超过20MB限制。`)
    const signature = await validateAssetFile(file)
    if (!signature.valid) throw new Error(signature.message)
    return hashBlob(file)
  }

  const importFiles = async (files: FileList | null) => {
    if (!files) return
    const existingHashes = new Set(assets.map((asset) => asset.sha256))
    for (const file of [...files]) {
      try {
        const sha256 = await prepareFile(file)
        const duplicate = assets.find((asset) => asset.sha256 === sha256)
        if (existingHashes.has(sha256)) { setNotice(`检测到重复资源：${duplicate?.path ?? file.name}`); continue }
        existingHashes.add(sha256)
        const id = `asset-${sha256.slice(0, 12)}`
        const extension = file.name.split('.').pop()?.toLowerCase() ?? 'bin'
        const filename = cleanName(file.name, `${id}.${extension}`)
        await editorAssetRepository.put({ id, projectId: project.projectId, filename, mime: file.type, size: file.size, sha256, alt: '', transcript: '' }, file)
        updateDraft((draft) => {
          draft.assets.push({ id, kind: file.type.startsWith('image/') ? 'image' : file.type.startsWith('audio/') ? 'audio' : 'text', mime: file.type, path: `assets/${filename}`, size: file.size, sha256, alt: file.type.startsWith('image/') ? '请填写替代文本' : '' })
        }, 'asset-import')
        setNotice(`已导入 ${file.name}`)
      } catch (error) {
        setNotice(error instanceof Error ? error.message : `${file.name} 导入失败。`)
      }
    }
    await refreshAssets()
  }

  const renameSelected = async () => {
    if (!selected || !selectedRef) return
    const filename = cleanName(renameValue, selected.path)
    if (assets.some((asset) => asset.assetKey !== selected.assetKey && asset.path === filename)) { setNotice('工程中已经存在同名资源。'); return }
    await editorAssetRepository.put({ id: assetId(selected), projectId: project.projectId, filename, mime: selected.mime, size: selected.size, sha256: selected.sha256, alt: selectedRef.alt, transcript: '' }, selected.blob)
    updateDraft((draft) => { const ref = draft.assets.find((item) => item.id === selectedRef.id); if (ref) ref.path = `assets/${filename}` }, `asset.${selectedRef.id}.path`)
    setRenameValue(filename)
    setNotice(`资源已重命名为 ${filename}`)
    await refreshAssets()
  }

  const replaceSelected = async (files: FileList | null) => {
    const file = files?.[0]
    if (!file || !selected || !selectedRef) return
    try {
      const sha256 = await prepareFile(file)
      const duplicate = assets.find((asset) => asset.assetKey !== selected.assetKey && asset.sha256 === sha256)
      if (duplicate) throw new Error(`替换内容与 ${duplicate.path} 重复。`)
      const filename = cleanName(file.name, selected.path)
      await editorAssetRepository.put({ id: assetId(selected), projectId: project.projectId, filename, mime: file.type, size: file.size, sha256, alt: selectedRef.alt, transcript: '' }, file)
      updateDraft((draft) => {
        const ref = draft.assets.find((item) => item.id === selectedRef.id)
        if (!ref) return
        ref.kind = file.type.startsWith('image/') ? 'image' : file.type.startsWith('audio/') ? 'audio' : 'text'
        ref.mime = file.type; ref.path = `assets/${filename}`; ref.size = file.size; ref.sha256 = sha256
      }, `asset.${selectedRef.id}.replace`)
      setNotice(`已替换 ${selected.path}，引用ID保持不变。`)
      await refreshAssets()
    } catch (error) {
      setNotice(error instanceof Error ? error.message : '资源替换失败。')
    }
  }

  const removeSelected = async () => {
    if (!selected || !selectedRef) return
    if (references.length) { setNotice(`无法删除：仍被 ${references.join('、')} 引用。`); return }
    await editorAssetRepository.remove(project.projectId, assetId(selected))
    updateDraft((draft) => { draft.assets = draft.assets.filter((item) => item.id !== selectedRef.id) }, `asset.${selectedRef.id}.delete`)
    setSelectedKey(null); await refreshAssets(); setNotice(`已删除未引用资源：${selected.path}`)
  }

  return <section className="editor-document">
    <header><div><span>LOCAL ASSET VAULT</span><h1>资源管理器</h1><p>资源存入IndexedDB；导入会校验扩展名、MIME、文件签名和SHA-256。</p></div><label className="file-import-button">导入本地资源<input type="file" multiple accept=".png,.jpg,.jpeg,.webp,.wav,.ogg,.txt,.md" onChange={(event) => void importFiles(event.target.files)} /></label></header>
    {notice && <div className="asset-notice" role="status">{notice}<button aria-label="关闭资源提示" onClick={() => setNotice(null)}>×</button></div>}
    <div className="asset-summary"><div><span>资源数量</span><strong>{assets.length}</strong></div><div><span>合计大小</span><strong>{(assets.reduce((sum, asset) => sum + asset.size, 0) / 1024).toFixed(1)} KB</strong></div><div><span>孤立资源</span><strong>{assets.filter((asset) => { const ref = project.draft.assets.find((item) => item.sha256 === asset.sha256); return !ref || collectReferences(project.draft, ref.id).length === 0 }).length}</strong></div></div>
    <div className="asset-table"><div><span>文件</span><span>类型</span><span>大小</span><span>SHA-256</span><span>引用</span></div>{assets.map((asset) => { const ref = project.draft.assets.find((item) => item.sha256 === asset.sha256 || item.id === assetId(asset)); const used = ref ? collectReferences(project.draft, ref.id).length : 0; return <button className={asset.assetKey === selected?.assetKey ? 'selected' : ''} key={asset.assetKey} onClick={() => { setSelectedKey(asset.assetKey); setRenameValue(asset.path); setMediaInfo('—') }}><strong>{asset.path}</strong><span>{asset.mime}</span><span>{(asset.size / 1024).toFixed(1)} KB</span><code>{asset.sha256.slice(0, 16)}…</code><span>{used ? `${used}处` : '孤立'}</span></button> })}</div>
    {selected && selectedRef && <section className="asset-detail">
      <div className="asset-preview">{selected.mime.startsWith('image/') && previewUrl ? <img src={previewUrl} alt={selectedRef.alt || selected.path} onLoad={(event) => setMediaInfo(`${event.currentTarget.naturalWidth} × ${event.currentTarget.naturalHeight} px`)} /> : selected.mime.startsWith('audio/') && previewUrl ? <audio controls src={previewUrl} onLoadedMetadata={(event) => setMediaInfo(`${event.currentTarget.duration.toFixed(2)} 秒`)} /> : <div><strong>{selected.mime}</strong><span>纯文本资源将在案件运行时按引用读取。</span></div>}</div>
      <div className="detail-form"><label>文件名<span className="inline-field"><input value={renameValue || selected.path} onChange={(event) => setRenameValue(event.target.value)} /><button onClick={() => void renameSelected()}>重命名</button></span></label><label>用途<select value={selectedRef.kind} onChange={(event) => updateDraft((draft) => { const ref = draft.assets.find((item) => item.id === selectedRef.id); if (ref) ref.kind = event.target.value as typeof ref.kind }, `asset.${selectedRef.id}.kind`)}><option value="image">图片</option><option value="audio">音频</option><option value="text">文本</option></select></label><label>替代文本<input value={selectedRef.alt} onChange={(event) => updateDraft((draft) => { const ref = draft.assets.find((item) => item.id === selectedRef.id); if (ref) ref.alt = event.target.value }, `asset.${selectedRef.id}.alt`)} /></label>
        <dl><div><dt>大小</dt><dd>{selected.size} bytes</dd></div><div><dt>类型</dt><dd>{selected.mime}</dd></div><div><dt>尺寸 / 时长</dt><dd>{mediaInfo}</dd></div><div><dt>SHA-256</dt><dd><code>{selected.sha256}</code></dd></div><div><dt>引用位置</dt><dd>{references.length ? references.join('、') : '无引用'}</dd></div></dl>
        <div className="asset-actions"><label className="file-import-button">替换资源<input type="file" accept=".png,.jpg,.jpeg,.webp,.wav,.ogg,.txt,.md" onChange={(event) => void replaceSelected(event.target.files)} /></label><button className="danger-button" disabled={references.length > 0} title={references.length ? `仍被 ${references.join('、')} 引用` : undefined} onClick={() => void removeSelected()}>删除未引用资源</button></div>
      </div>
    </section>}
  </section>
}
