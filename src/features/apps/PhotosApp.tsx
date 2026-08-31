import { useState } from 'react'
import { useActiveCaseDefinition } from '../../cases/useActiveCase'
import { useGameStore } from '../../store/gameStore'
import { AppStatusBar, AppToolbar, PaneHeader } from './AppChrome'

export function PhotosApp() {
  const caseDefinition = useActiveCaseDefinition()
  const [index, setIndex] = useState(0)
  const [metadata, setMetadata] = useState(false)
  const [rotation, setRotation] = useState(0)
  const [zoom, setZoom] = useState(1)
  const [fullscreen, setFullscreen] = useState(false)
  const photo = caseDefinition.photos[index]!
  const { investigate, togglePinned, discoveredClueIds, pinnedClueIds } = useGameStore()
  const choose = (nextIndex: number) => { setIndex((nextIndex + caseDefinition.photos.length) % caseDefinition.photos.length); setMetadata(false); setRotation(0); setZoom(1) }

  return (
    <div className={`application photos-app ${fullscreen ? 'viewer-fullscreen' : ''}`}>
      <AppToolbar>
        <button aria-label="上一张" onClick={() => choose(index - 1)}>上一张</button>
        <button aria-label="下一张" onClick={() => choose(index + 1)}>下一张</button>
        <button onClick={() => setRotation((value) => value - 90)}>向左旋转</button>
        <button onClick={() => setRotation((value) => value + 90)}>向右旋转</button>
        <button onClick={() => setZoom(Math.max(.6, zoom - .15))}>缩小</button>
        <button onClick={() => setZoom(Math.min(2, zoom + .15))}>放大</button>
        <button onClick={() => setFullscreen((value) => !value)}>{fullscreen ? '退出全屏查看' : '全屏查看'}</button>
        <span className="path-field">照片 / 2031 / 档案恢复</span>
        <button className="primary-button" onClick={() => { setMetadata(true); investigate({ type: 'VIEW_METADATA', itemId: photo.id }) }}>查看元数据</button>
      </AppToolbar>
      <div className="photo-layout">
        <nav className="photo-library" aria-label="照片库"><PaneHeader title="2031 年恢复档案" meta={`${caseDefinition.photos.length} 张`} />{caseDefinition.photos.map((item, itemIndex) => <button key={item.id} data-selected={index === itemIndex} onClick={() => choose(itemIndex)}><img src={item.image} alt="机场照片缩略图" /><span>{item.title}<small>{item.metadata.exportedAt.slice(0, 10)}</small></span></button>)}</nav>
        <section className="photo-viewer"><img src={photo.image} alt="虚构海津机场候机区" style={{ transform: `rotate(${rotation}deg) scale(${zoom})` }} /><div className="viewer-index">{index + 1} / {caseDefinition.photos.length}</div></section>
        <aside className="photo-info"><PaneHeader title="信息" meta={photo.title} /><dl><dt>文件名</dt><dd>{photo.title}</dd><dt>文件格式</dt><dd>SVG / 本地恢复图像</dd><dt>档案编号</dt><dd>{photo.id}</dd>{metadata && <><dt>原始拍摄时间</dt><dd>{photo.metadata.capturedAt}</dd><dt>导出时间</dt><dd>{photo.metadata.exportedAt}</dd><dt>文件修改时间</dt><dd>{photo.metadata.exportedAt}</dd><dt>分辨率</dt><dd>1920 × 1080</dd><dt>设备</dt><dd>{photo.metadata.camera}</dd><dt>文件路径</dt><dd>ZHOU_YU/照片/{photo.title}</dd></>}</dl><button disabled={photo.id !== 'photo-sent' || !discoveredClueIds.includes('C03')} onClick={() => togglePinned('C03')}>{pinnedClueIds.includes('C03') ? '已加入证据板' : '加入证据板'}</button></aside>
      </div>
      <AppStatusBar><span>{photo.title}</span><span>旋转 {rotation}° · 缩放 {Math.round(zoom * 100)}%</span></AppStatusBar>
    </div>
  )
}
