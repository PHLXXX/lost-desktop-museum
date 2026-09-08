import { useState } from 'react'
import { createInitialGameplayDraft } from '../../model/caseDraft'
import { useEditorStore } from '../../store/editorStore'
import { HintEditor } from './HintEditor'
import { ObjectiveEditor } from './ObjectiveEditor'
import { OutcomeEditor } from './OutcomeEditor'

type GameplayEditorTab = 'objectives' | 'hints' | 'outcomes'

export function GameplayEditor() {
  const { currentProject: project, updateDraft } = useEditorStore()
  const [tab, setTab] = useState<GameplayEditorTab>('objectives')
  if (!project) return null
  const gameplay = project.draft.gameplay

  return <section className="editor-document gameplay-editor"><header><div><span>DEEP INVESTIGATION</span><h1>玩法设计</h1><p>使用声明式条件设计调查目标、有限提示、结案挑战、补充档案注记与通关馆藏。</p></div><label className="gameplay-enable"><input type="checkbox" checked={Boolean(gameplay)} onChange={(event) => updateDraft((draft) => { draft.gameplay = event.target.checked ? createInitialGameplayDraft(draft) : undefined }, 'gameplay-toggle')} />启用自定义玩法</label></header>{!gameplay ? <div className="gameplay-disabled"><strong>当前使用兼容玩法</strong><p>运行时会根据现有线索生成基础目标、三层提示、通用挑战与兼容藏品。启用后可以逐项改写，其他案件内容不会改变。</p></div> : <><section className="gameplay-general"><label>初始分析额度<input aria-label="初始分析额度" type="number" min="0" max="9" value={gameplay.initialAnalysisPoints} onChange={(event) => updateDraft((draft) => { if (draft.gameplay) draft.gameplay.initialAnalysisPoints = Number(event.target.value) }, 'gameplay-analysis-points')} /></label><div><span>目标</span><strong>{gameplay.objectives.length}</strong></div><div><span>提示</span><strong>{gameplay.hints.length}</strong></div><div><span>挑战</span><strong>{gameplay.challenges.length}</strong></div><div><span>结局分支</span><strong>{gameplay.endingVariants.length}</strong></div><div><span>奖励</span><strong>{gameplay.rewards?.length ?? 0}</strong></div></section><div className="gameplay-editor-tabs" role="tablist" aria-label="玩法设计模块"><button role="tab" aria-selected={tab === 'objectives'} onClick={() => setTab('objectives')}>调查目标</button><button role="tab" aria-selected={tab === 'hints'} onClick={() => setTab('hints')}>分析提示</button><button role="tab" aria-selected={tab === 'outcomes'} onClick={() => setTab('outcomes')}>挑战与结局</button></div>{tab === 'objectives' && <ObjectiveEditor draft={project.draft} gameplay={gameplay} updateDraft={updateDraft} />}{tab === 'hints' && <HintEditor draft={project.draft} gameplay={gameplay} updateDraft={updateDraft} />}{tab === 'outcomes' && <OutcomeEditor gameplay={gameplay} updateDraft={updateDraft} />}</>}</section>
}
