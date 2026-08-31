import { useCallback, useEffect, useState } from 'react'
import type { ProjectSnapshot } from '../storage/projectSnapshotRepository'
import { useEditorStore } from '../store/editorStore'

export function SnapshotDialog({ onClose }: { onClose: () => void }) {
  const { currentProject, createSnapshot, listSnapshots, restoreSnapshot, deleteSnapshot } = useEditorStore()
  const [items, setItems] = useState<ProjectSnapshot[]>([])
  const [restoreId, setRestoreId] = useState<string | null>(null)
  const refresh = useCallback(async () => setItems(await listSnapshots()), [listSnapshots])
  useEffect(() => {
    let active = true
    void listSnapshots().then((snapshots) => { if (active) setItems(snapshots) })
    return () => { active = false }
  }, [listSnapshots])
  if (!currentProject) return null
  return <div className="workshop-modal-backdrop"><section className="workshop-modal snapshot-dialog" role="dialog" aria-modal="true" aria-labelledby="snapshot-title"><header><div><span>RECOVERY REGISTER</span><h2 id="snapshot-title">恢复快照</h2></div><button aria-label="关闭快照" onClick={onClose}>×</button></header><div className="snapshot-actions"><button autoFocus onClick={() => void createSnapshot('手动创建').then(refresh)}>创建当前快照</button><p>最多保留20个。恢复前会自动保存当前版本，Blob资源不重复复制。</p></div><div className="snapshot-list">{items.length === 0 ? <div className="snapshot-empty">还没有恢复快照。</div> : items.map((item) => <article key={item.snapshotId}><div><strong>{item.reason}</strong><time>{new Date(item.createdAt).toLocaleString('zh-CN', { hour12: false })}</time><small>修订 {item.project.revision} · {item.project.draft.clues.length} 条线索</small></div><div><button onClick={() => setRestoreId(item.snapshotId)}>恢复</button><button onClick={() => void deleteSnapshot(item.snapshotId).then(refresh)}>删除</button></div></article>)}</div>{restoreId && <div className="snapshot-confirm" role="alertdialog" aria-modal="true" aria-labelledby="snapshot-confirm-title"><strong id="snapshot-confirm-title">恢复这个快照？</strong><p>当前版本会先创建一份“恢复快照前”备份，然后替换草稿内容。</p><div><button onClick={() => setRestoreId(null)}>取消</button><button className="primary-button" onClick={() => void restoreSnapshot(restoreId).then(() => { setRestoreId(null); void refresh() })}>确认恢复</button></div></div>}</section></div>
}
