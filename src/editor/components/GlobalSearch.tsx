import { useMemo, useState } from 'react'
import type { EditorSection } from '../model/authoringProject'
import { findReferences } from '../compiler/referenceResolver'
import { useEditorStore } from '../store/editorStore'

interface SearchEntry { id: string; type: string; name: string; path: string; summary: string; section: EditorSection }

function entriesForProject(project: NonNullable<ReturnType<typeof useEditorStore.getState>['currentProject']>): SearchEntry[] {
  const draft = project.draft
  const entries: SearchEntry[] = [
    { id: project.caseId, type: '案件', name: draft.manifest.title ?? project.name, path: '基本信息 / caseId', summary: draft.manifest.summary ?? '', section: 'metadata' },
    ...draft.entities.map((item) => ({ id: item.id, type: '实体', name: item.name, path: `人物与实体 / ${item.id}`, summary: `${item.summary} ${item.description} ${item.aliases.join(' ')}`, section: 'entities' as const })),
    ...draft.files.map((item) => ({ id: item.id, type: '文件', name: item.name, path: `文件系统 / ${item.folder}`, summary: item.content, section: 'files' as const })),
    ...draft.chats.flatMap((thread) => thread.messages.map((item) => ({ id: item.id, type: '消息', name: `${thread.title} · ${item.sender}`, path: `讯息 / ${thread.title}`, summary: item.text, section: 'messages' as const }))),
    ...draft.emails.map((item) => ({ id: item.id, type: '邮件', name: item.subject, path: `邮件 / ${item.folder}`, summary: `${item.from} ${item.body}`, section: 'mail' as const })),
    ...draft.systemLogs.map((item) => ({ id: item.id, type: '日志', name: item.eventType, path: `系统日志 / ${item.id}`, summary: `${item.user} ${item.detail}`, section: 'logs' as const })),
    ...draft.clues.map((item) => ({ id: item.id, type: '线索', name: item.title, path: `线索与条件 / ${item.id}`, summary: `${item.summary} ${item.explanation}`, section: 'clues' as const })),
    ...draft.triggers.map((item) => ({ id: item.id, type: '触发器', name: 'name' in item ? item.name : item.id, path: `剧情触发器 / ${item.id}`, summary: JSON.stringify(item), section: 'triggers' as const })),
    ...(draft.deduction.questions ?? []).map((item) => ({ id: item.id, type: '推理题', name: item.prompt, path: `最终推理 / ${item.id}`, summary: item.options.map((option) => option.label).join(' '), section: 'deduction' as const })),
    ...draft.assets.map((item) => ({ id: item.id, type: '资源', name: item.path.replace(/^assets\//, ''), path: `资源管理器 / ${item.id}`, summary: `${item.mime} ${item.alt} ${item.sha256}`, section: 'assets' as const })),
  ]
  return entries
}

export function GlobalSearch({ onClose }: { onClose: () => void }) {
  const project = useEditorStore((state) => state.currentProject)
  const setSection = useEditorStore((state) => state.setSection)
  const updateProject = useEditorStore((state) => state.updateProject)
  const [query, setQuery] = useState('')
  const all = useMemo(() => project ? entriesForProject(project) : [], [project])
  if (!project) return null
  const normalized = query.trim().toLocaleLowerCase('zh-CN')
  const results = normalized.length < 1 ? [] : all.filter((entry) => `${entry.id} ${entry.name} ${entry.path} ${entry.summary}`.toLocaleLowerCase('zh-CN').includes(normalized)).slice(0, 40)
  const open = (entry: SearchEntry) => {
    updateProject((next) => { next.uiState.selectedIssueId = entry.id; if (entry.section === 'entities') next.uiState.selectedEntityId = entry.id }, 'search-selection')
    setSection(entry.section)
    onClose()
  }
  return <div className="editor-search-popover" role="dialog" aria-label="工程全局搜索"><label>搜索工程内容<input autoFocus value={query} placeholder="ID、文件、人物、线索或正文" onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => { if (event.key === 'Escape') onClose(); if (event.key === 'Enter' && results[0]) open(results[0]) }} /></label>{!normalized && <p>输入关键词。Ctrl/Cmd + K 可随时打开。</p>}{normalized && <div className="global-search-results" role="listbox" aria-label="搜索结果">{results.length ? results.map((entry) => <button role="option" key={`${entry.section}-${entry.id}`} onClick={() => open(entry)}><span>{entry.type}</span><div><strong>{entry.name}</strong><small>{entry.path}</small><p>{entry.summary.slice(0, 90) || entry.id}</p></div><em>{findReferences(project.draft, entry.id).length} 引用</em></button>) : <div className="search-empty">没有匹配内容</div>}</div>}</div>
}
