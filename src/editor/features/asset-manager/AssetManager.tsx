import { useEffect, useState } from 'react'
import type { StoredAsset } from '../../../storage/assetRepository'
import { editorAssetRepository, hashBlob } from '../../storage/editorAssetRepository'
import { useEditorStore } from '../../store/editorStore'

const allowedMime = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'audio/wav', 'audio/mpeg', 'audio/ogg', 'text/plain', 'text/markdown'])
function cleanName(name: string) { return name.toLowerCase().replace(/[^a-z0-9._-]+/g, '-').replace(/^-+/, '') }

export function AssetManager() {
  const { currentProject: project, updateDraft } = useEditorStore()
  const [assets, setAssets] = useState<StoredAsset[]>([])
  const [notice, setNotice] = useState<string | null>(null)
  useEffect(() => { if (project) void editorAssetRepository.list(project.projectId).then(setAssets) }, [project])
  if (!project) return null
  const importFiles = async (files: FileList | null) => {
    if (!files) return
    for (const file of [...files]) {
      if (!allowedMime.has(file.type) || file.type === 'image/svg+xml') { setNotice(`${file.name} 的文件类型不在安全白名单中。`); continue }
      if (file.size > 20 * 1024 * 1024) { setNotice(`${file.name} 超过20MB限制。`); continue }
      const sha256 = await hashBlob(file)
      const duplicate = assets.find((asset) => asset.sha256 === sha256)
      if (duplicate) { setNotice(`检测到重复资源：${duplicate.path}`); continue }
      const id = `asset-${sha256.slice(0, 12)}`
      const filename = cleanName(file.name)
      await editorAssetRepository.put({ id, projectId: project.projectId, filename, mime: file.type, size: file.size, sha256, alt: '', transcript: '' }, file)
      updateDraft((draft) => { draft.assets.push({ id, kind: file.type.startsWith('image/') ? 'image' : file.type.startsWith('audio/') ? 'audio' : 'text', mime: file.type, path: `assets/${filename}`, size: file.size, sha256, alt: file.type.startsWith('image/') ? '请填写替代文本' : '' }) }, 'asset-import')
      setNotice(`已导入 ${file.name}`)
    }
    setAssets(await editorAssetRepository.list(project.projectId))
  }
  return <section className="editor-document"><header><div><span>LOCAL ASSET VAULT</span><h1>资源管理器</h1><p>资源存入IndexedDB，Blob不进入Zustand；哈希用于去重和发布校验。</p></div><label className="file-import-button">导入本地资源<input type="file" multiple accept=".png,.jpg,.jpeg,.webp,.gif,.wav,.mp3,.ogg,.txt,.md" onChange={(event) => void importFiles(event.target.files)} /></label></header>{notice && <div className="asset-notice" role="status">{notice}<button aria-label="关闭资源提示" onClick={() => setNotice(null)}>×</button></div>}<div className="asset-summary"><div><span>资源数量</span><strong>{assets.length}</strong></div><div><span>合计大小</span><strong>{(assets.reduce((sum, asset) => sum + asset.size, 0) / 1024).toFixed(1)} KB</strong></div><div><span>孤立资源</span><strong>{assets.filter((asset) => !JSON.stringify(project.draft).includes(asset.sha256)).length}</strong></div></div><div className="asset-table"><div><span>文件</span><span>类型</span><span>大小</span><span>SHA-256</span><span>引用</span></div>{assets.map((asset) => <div key={asset.assetKey}><strong>{asset.path}</strong><span>{asset.mime}</span><span>{(asset.size / 1024).toFixed(1)} KB</span><code>{asset.sha256.slice(0, 16)}…</code><span>{project.draft.assets.some((ref) => ref.sha256 === asset.sha256) ? '已引用' : '孤立'}</span></div>)}</div></section>
}
