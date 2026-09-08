import { useState } from 'react'
import { useActiveCaseDefinition } from '../../cases/useActiveCase'
import { useGameStore } from '../../store/gameStore'

export function AudioWorkbenchApp() {
  const definition = useActiveCaseDefinition()
  const investigate = useGameStore((state) => state.investigate)
  const [selected, setSelected] = useState(definition.audioTracks[0])
  const [revealedTrackId, setRevealedTrackId] = useState<string | null>(null)
  const selectTrack = (track: typeof selected) => {
    setSelected(track)
    setRevealedTrackId(null)
  }
  const revealTranscript = () => {
    if (!selected) return
    setRevealedTrackId(selected.id)
    investigate({ type: 'VIEW_AUDIO_MARKER', itemId: selected.id })
  }
  return <div className="extended-app audio-runtime">
    <aside>{definition.audioTracks.map((track) => <button key={track.id} className={selected?.id === track.id ? 'selected' : ''} onClick={() => selectTrack(track)}><strong>{track.title}</strong><small>{track.id}</small></button>)}</aside>
    <section><header><span>AUDIO WORKBENCH</span><h2>{selected?.title ?? '没有音轨'}</h2></header><div className="audio-wave" aria-label="音频波形示意">{Array.from({ length: 48 }, (_item, index) => <i key={index} style={{ height: `${12 + ((index * 17) % 38)}px` }} />)}</div><h3>文字转写</h3>{selected ? <><button className="secondary-button" onClick={revealTranscript}>查看转写</button>{revealedTrackId === selected.id && <p>{selected.transcript || '没有转写内容。'}</p>}</> : <p>没有恢复到音轨。</p>}</section>
  </div>
}
export function BroadcastConsoleApp() {
  const definition = useActiveCaseDefinition()
  const investigate = useGameStore((state) => state.investigate)
  return <div className="extended-app broadcast-runtime"><header><span>BROADCAST CONTROL</span><strong>节目事件线路</strong><b>LOCAL</b></header><div>{definition.broadcastEvents.length ? definition.broadcastEvents.map((event) => <button className="broadcast-event" key={event.id} onClick={() => investigate({ type: 'OPEN_ITEM', itemId: event.id })}><time>{event.time}</time><span><strong>{event.title}</strong><small>{event.detail}</small></span></button>) : <section className="empty-state app-empty-state"><h2>没有恢复到节目事件</h2><p>当前案件包没有提供广播线路记录。</p></section>}</div></div>
}
export function DataDeskApp() {
  const definition = useActiveCaseDefinition()
  const investigate = useGameStore((state) => state.investigate)
  const table = definition.dataTables[0]
  return <div className="extended-app data-runtime"><header><span>DATA DESK</span><h2>{table?.title ?? '没有数据表'}</h2>{table && <button className="secondary-button" onClick={() => investigate({ type: 'OPEN_ITEM', itemId: table.id })}>核验数据表</button>}</header>{table && <table><thead><tr>{table.columns.map((column) => <th key={column}>{column}</th>)}</tr></thead><tbody>{table.rows.map((row, index) => <tr key={index}>{row.map((value, cell) => <td key={cell}>{value}</td>)}</tr>)}</tbody></table>}</div>
}
export function TerminalApp() {
  const definition = useActiveCaseDefinition()
  const investigate = useGameStore((state) => state.investigate)
  const [selected, setSelected] = useState<string | null>(null)
  const entry = definition.terminalEntries.find((item) => item.id === selected)
  const runEntry = (item: typeof definition.terminalEntries[number]) => {
    setSelected(item.id)
    investigate({ type: 'RUN_COMMAND', itemId: item.id })
  }
  return <div className="extended-app terminal-runtime"><header>ARCHIVE/OS SAFE TERMINAL</header><div className="terminal-output">{entry ? <><span>$ {entry.command}</span><pre>{entry.output}</pre></> : <p>选择一个允许的命令。终端不会执行系统Shell。</p>}</div><footer>{definition.terminalEntries.filter((item) => item.enabled).map((item) => <button key={item.id} onClick={() => runEntry(item)}>{item.command}</button>)}</footer></div>
}
export function VersionDiffApp() {
  const definition = useActiveCaseDefinition()
  const investigate = useGameStore((state) => state.investigate)
  const [selected, setSelected] = useState(definition.versionDiffs[0])
  if (!definition.versionDiffs.length) return <div className="extended-app diff-runtime"><section className="empty-state app-empty-state"><h2>没有恢复到版本差异</h2><p>当前案件包没有提供内容修改记录。</p></section></div>
  return <div className="extended-app diff-runtime"><aside>{definition.versionDiffs.map((diff) => <button key={diff.id} onClick={() => setSelected(diff)}>{diff.title}</button>)}</aside><section><header>{selected?.title}</header><div><pre>{selected?.before}</pre><pre>{selected?.after}</pre></div>{selected && <button className="secondary-button diff-verify" onClick={() => investigate({ type: 'VIEW_VERSION_DIFF', itemId: selected.id })}>核验差异</button>}</section></div>
}
export function SitemapApp() {
  const definition = useActiveCaseDefinition()
  const investigate = useGameStore((state) => state.investigate)
  const [selected, setSelected] = useState(definition.sitemap[0])
  if (!definition.sitemap.length) return <div className="extended-app sitemap-runtime"><section className="empty-state app-empty-state"><h2>没有恢复到地点记录</h2><p>当前案件包没有提供地点关系数据。</p></section></div>
  return <div className="extended-app sitemap-runtime"><header><span>SITE MAP</span><h2>地点关系</h2></header><div>{definition.sitemap.map((node, index) => <button key={node.id} style={{ marginLeft: node.parentId ? 80 : index * 20 }} onClick={() => { setSelected(node); investigate({ type: 'VIEW_MAP_LOCATION', itemId: node.id }) }}><i />{node.label}</button>)}</div><aside><strong>{selected?.label}</strong><p>{selected?.detail}</p></aside></div>
}
