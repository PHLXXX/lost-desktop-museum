import { useState } from 'react'
import type {
  GameplayRequirement,
  InvestigationChallengeDefinition,
  InvestigationEndingVariant,
  InvestigationGameplayDefinition,
  InvestigationRewardDefinition,
} from '../../../cases/types'
import { archiveThemes } from '../../../rewards/archiveThemes'
import type { CaseDraft } from '../../model/caseDraft'

type UpdateDraft = (mutator: (draft: CaseDraft) => void, historyKey?: string) => void

const requirementLabels: Record<GameplayRequirement['type'], string> = {
  'all-clues': '发现全部线索',
  'no-hints': '不使用提示',
  'score-at-least': '分数至少达到',
  'relation-count-at-least': '正确关系至少达到',
  objective: '完成指定目标',
}

const rewardKindLabels: Record<InvestigationRewardDefinition['kind'], string> = {
  artifact: '案件藏品',
  badge: '调查徽章',
  theme: '档案馆主题',
}

function requirementFor(type: GameplayRequirement['type'], objectiveId = ''): GameplayRequirement {
  if (type === 'score-at-least') return { type, value: 90 }
  if (type === 'relation-count-at-least') return { type, value: 1 }
  if (type === 'objective') return { type, objectiveId }
  return { type }
}

function nextId(prefix: string, items: { id: string }[]) {
  let index = items.length + 1
  while (items.some((item) => item.id === `${prefix}-${index}`)) index += 1
  return `${prefix}-${index}`
}

function RequirementFields({ requirements, prefix, objectiveIds, allowEmpty = false, onChange }: {
  requirements: GameplayRequirement[]
  prefix: '挑战' | '结局' | '奖励'
  objectiveIds: string[]
  allowEmpty?: boolean
  onChange: (requirements: GameplayRequirement[]) => void
}) {
  return (
    <div className="requirement-editor">
      <header>
        <div>
          <strong>达成条件</strong>
          {allowEmpty && requirements.length === 0 && <small>无附加条件：完成案件即可获得</small>}
        </div>
        <button onClick={() => onChange([...requirements, { type: 'all-clues' }])}>添加条件</button>
      </header>
      {requirements.map((requirement, index) => (
        <div key={index}>
          <select
            aria-label={`${prefix}要求 ${index + 1}`}
            value={requirement.type}
            onChange={(event) => onChange(requirements.map((item, itemIndex) => (
              itemIndex === index
                ? requirementFor(event.target.value as GameplayRequirement['type'], objectiveIds[0])
                : item
            )))}
          >
            {Object.entries(requirementLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
          {(requirement.type === 'score-at-least' || requirement.type === 'relation-count-at-least') && (
            <input
              aria-label={`${prefix}阈值 ${index + 1}`}
              type="number"
              min="0"
              max="100"
              value={requirement.value}
              onChange={(event) => onChange(requirements.map((item, itemIndex) => (
                itemIndex === index ? { ...requirement, value: Number(event.target.value) } : item
              )))}
            />
          )}
          {requirement.type === 'objective' && (
            <select
              aria-label={`${prefix}目标 ${index + 1}`}
              value={requirement.objectiveId}
              onChange={(event) => onChange(requirements.map((item, itemIndex) => (
                itemIndex === index ? { ...requirement, objectiveId: event.target.value } : item
              )))}
            >
              {objectiveIds.map((id) => <option key={id}>{id}</option>)}
            </select>
          )}
          <button
            aria-label={`删除${prefix}要求 ${index + 1}`}
            disabled={!allowEmpty && requirements.length === 1}
            onClick={() => onChange(requirements.filter((_item, itemIndex) => itemIndex !== index))}
          >×</button>
        </div>
      ))}
    </div>
  )
}

export function OutcomeEditor({ gameplay, updateDraft }: { gameplay: InvestigationGameplayDefinition; updateDraft: UpdateDraft }) {
  const rewards = gameplay.rewards ?? []
  const [selectedChallengeId, setSelectedChallengeId] = useState(gameplay.challenges[0]?.id ?? null)
  const [selectedEndingId, setSelectedEndingId] = useState(gameplay.endingVariants[0]?.id ?? null)
  const [selectedRewardId, setSelectedRewardId] = useState(rewards[0]?.id ?? null)
  const selectedChallenge = gameplay.challenges.find((item) => item.id === selectedChallengeId)
  const selectedEnding = gameplay.endingVariants.find((item) => item.id === selectedEndingId)
  const selectedReward = rewards.find((item) => item.id === selectedRewardId)
  const objectiveIds = gameplay.objectives.map((objective) => objective.id)

  const updateChallenge = (mutator: (challenge: InvestigationChallengeDefinition) => void, key: string) => updateDraft((draft) => {
    const challenge = draft.gameplay?.challenges.find((item) => item.id === selectedChallengeId)
    if (challenge) mutator(challenge)
  }, key)
  const updateEnding = (mutator: (ending: InvestigationEndingVariant) => void, key: string) => updateDraft((draft) => {
    const ending = draft.gameplay?.endingVariants.find((item) => item.id === selectedEndingId)
    if (ending) mutator(ending)
  }, key)
  const updateReward = (mutator: (reward: InvestigationRewardDefinition) => void, key: string) => updateDraft((draft) => {
    const reward = draft.gameplay?.rewards?.find((item) => item.id === selectedRewardId)
    if (reward) mutator(reward)
  }, key)

  const addChallenge = () => {
    const id = nextId('challenge', gameplay.challenges)
    updateDraft((draft) => draft.gameplay?.challenges.push({
      id,
      title: '新调查挑战',
      description: '说明这项可选挑战的达成方式。',
      requirements: [{ type: 'no-hints' }],
    }), 'gameplay-challenge-add')
    setSelectedChallengeId(id)
  }
  const addEnding = () => {
    const id = nextId('ending', gameplay.endingVariants)
    updateDraft((draft) => draft.gameplay?.endingVariants.push({
      id,
      title: '新档案注记',
      text: '写下满足条件后显示的补充结论。',
      priority: 10,
      requirements: [{ type: 'score-at-least', value: 90 }],
    }), 'gameplay-ending-add')
    setSelectedEndingId(id)
  }
  const addReward = () => {
    const id = nextId('reward', rewards)
    updateDraft((draft) => {
      if (!draft.gameplay) return
      draft.gameplay.rewards ??= []
      draft.gameplay.rewards.push({
        id,
        kind: 'artifact',
        title: '新通关藏品',
        description: '完成案件后归入个人馆藏。',
        requirements: [],
      })
    }, 'gameplay-reward-add')
    setSelectedRewardId(id)
  }
  const deleteReward = () => {
    if (!selectedRewardId) return
    const remaining = rewards.filter((reward) => reward.id !== selectedRewardId)
    updateDraft((draft) => {
      if (draft.gameplay) draft.gameplay.rewards = draft.gameplay.rewards?.filter((reward) => reward.id !== selectedRewardId)
    }, 'gameplay-reward-delete')
    setSelectedRewardId(remaining[0]?.id ?? null)
  }

  return (
    <div className="outcome-editor">
      <section>
        <header><div><h2>调查挑战</h2><p>挑战只影响专精记录，不阻断主结局。</p></div><button onClick={addChallenge}>新建挑战</button></header>
        <div className="outcome-master">
          <aside>{gameplay.challenges.map((challenge) => <button className={challenge.id === selectedChallengeId ? 'selected' : ''} key={challenge.id} onClick={() => setSelectedChallengeId(challenge.id)}><strong>{challenge.title}</strong><small>{challenge.requirements.length} 个条件</small></button>)}</aside>
          {selectedChallenge ? <div className="gameplay-detail">
            <label>挑战标题<input value={selectedChallenge.title} onChange={(event) => updateChallenge((challenge) => { challenge.title = event.target.value }, `gameplay.challenge.${selectedChallenge.id}.title`)} /></label>
            <label>挑战说明<textarea value={selectedChallenge.description} onChange={(event) => updateChallenge((challenge) => { challenge.description = event.target.value }, `gameplay.challenge.${selectedChallenge.id}.description`)} /></label>
            <RequirementFields requirements={selectedChallenge.requirements} prefix="挑战" objectiveIds={objectiveIds} onChange={(requirements) => updateChallenge((challenge) => { challenge.requirements = requirements }, `gameplay.challenge.${selectedChallenge.id}.requirements`)} />
          </div> : <div className="gameplay-empty">尚未创建调查挑战。</div>}
        </div>
      </section>

      <section>
        <header><div><h2>条件结局</h2><p>未命中分支时仍显示最终推理中的主结局。</p></div><button onClick={addEnding}>新建结局分支</button></header>
        <div className="outcome-master">
          <aside>{gameplay.endingVariants.map((ending) => <button className={ending.id === selectedEndingId ? 'selected' : ''} key={ending.id} onClick={() => setSelectedEndingId(ending.id)}><strong>{ending.title}</strong><small>优先级 {ending.priority}</small></button>)}</aside>
          {selectedEnding ? <div className="gameplay-detail">
            <label>结局标题<input value={selectedEnding.title} onChange={(event) => updateEnding((ending) => { ending.title = event.target.value }, `gameplay.ending.${selectedEnding.id}.title`)} /></label>
            <label>补充结论<textarea value={selectedEnding.text} onChange={(event) => updateEnding((ending) => { ending.text = event.target.value }, `gameplay.ending.${selectedEnding.id}.text`)} /></label>
            <label>优先级<input aria-label="结局优先级" type="number" min="-100" max="100" value={selectedEnding.priority} onChange={(event) => updateEnding((ending) => { ending.priority = Number(event.target.value) }, `gameplay.ending.${selectedEnding.id}.priority`)} /></label>
            <RequirementFields requirements={selectedEnding.requirements} prefix="结局" objectiveIds={objectiveIds} onChange={(requirements) => updateEnding((ending) => { ending.requirements = requirements }, `gameplay.ending.${selectedEnding.id}.requirements`)} />
          </div> : <div className="gameplay-empty">没有条件结局；玩家会看到主结局。</div>}
        </div>
      </section>

      <section>
        <header><div><h2>通关奖励</h2><p>奖励只进入本机馆藏，不改变案件难度或提示额度。</p></div><button onClick={addReward}>新建奖励</button></header>
        <div className="outcome-master">
          <aside>{rewards.map((reward) => <button className={reward.id === selectedRewardId ? 'selected' : ''} key={reward.id} onClick={() => setSelectedRewardId(reward.id)}><strong>{reward.title}</strong><small>{rewardKindLabels[reward.kind]}</small></button>)}</aside>
          {selectedReward ? <div className="gameplay-detail">
            <label>奖励标题<input value={selectedReward.title} onChange={(event) => updateReward((reward) => { reward.title = event.target.value }, `gameplay.reward.${selectedReward.id}.title`)} /></label>
            <label>奖励说明<textarea value={selectedReward.description} onChange={(event) => updateReward((reward) => { reward.description = event.target.value }, `gameplay.reward.${selectedReward.id}.description`)} /></label>
            <label>奖励类型<select aria-label="奖励类型" value={selectedReward.kind} onChange={(event) => updateReward((reward) => {
              reward.kind = event.target.value as InvestigationRewardDefinition['kind']
              if (reward.kind === 'theme') reward.themeId = 'departure-night'
              else delete reward.themeId
            }, `gameplay.reward.${selectedReward.id}.kind`)}>{Object.entries(rewardKindLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
            {selectedReward.kind === 'theme' && <label>档案馆主题<select aria-label="奖励主题" value={selectedReward.themeId ?? 'departure-night'} onChange={(event) => updateReward((reward) => { reward.themeId = event.target.value as InvestigationRewardDefinition['themeId'] }, `gameplay.reward.${selectedReward.id}.theme`)}>{archiveThemes.filter((theme) => theme.id !== 'archive-standard').map((theme) => <option key={theme.id} value={theme.id}>{theme.title}</option>)}</select></label>}
            <RequirementFields requirements={selectedReward.requirements} prefix="奖励" objectiveIds={objectiveIds} allowEmpty onChange={(requirements) => updateReward((reward) => { reward.requirements = requirements }, `gameplay.reward.${selectedReward.id}.requirements`)} />
            <button className="gameplay-delete" onClick={deleteReward}>删除当前奖励</button>
          </div> : <div className="gameplay-empty">尚未设置通关奖励。旧案件仍会获得兼容藏品。</div>}
        </div>
      </section>
    </div>
  )
}
