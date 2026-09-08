import type { CaseDefinition, GameplayRequirement, InvestigationRewardDefinition } from '../../cases/types'
import { resolveInvestigationRewards } from '../../gameplay/rewardEngine'
import { archiveThemes } from '../../rewards/archiveThemes'
import { useRewardStore } from '../../rewards/rewardStore'

const kindLabels: Record<InvestigationRewardDefinition['kind'], string> = {
  artifact: '纪念藏品',
  badge: '专精徽章',
  theme: '系统主题',
}

function requirementLabel(requirement: GameplayRequirement, definition: CaseDefinition): string {
  switch (requirement.type) {
    case 'all-clues': return '发现全部线索'
    case 'no-hints': return '不使用分析提示'
    case 'score-at-least': return `可信度达到 ${requirement.value}`
    case 'relation-count-at-least': return `验证 ${requirement.value} 组关键关系`
    case 'objective': return `完成目标：${definition.gameplay?.objectives.find((objective) => objective.id === requirement.objectiveId)?.title ?? requirement.objectiveId}`
  }
}

export function RewardCollection({ cases }: { cases: CaseDefinition[] }) {
  const { unlocks, selectedTheme, selectTheme } = useRewardStore()
  const knownRewards = cases.flatMap((definition) => resolveInvestigationRewards(definition).map((reward) => ({ definition, reward, key: `${definition.id}:${reward.id}` })))
  const knownKeys = new Set(knownRewards.map((item) => item.key))
  const unlockKeys = new Set(unlocks.map((record) => record.key))
  const orphaned = unlocks.filter((record) => !knownKeys.has(record.key))
  const total = knownRewards.length + orphaned.length
  const unlocked = knownRewards.filter((item) => unlockKeys.has(item.key)).length + orphaned.length

  return (
    <section className="reward-collection" aria-labelledby="reward-collection-title">
      <header>
        <div><span>LOCAL COLLECTION</span><h3 id="reward-collection-title">个人馆藏记录</h3></div>
        <strong>{unlocked} / {total}</strong>
      </header>
      <p>通关藏品、专精徽章与可装备主题只保存在本设备。</p>
      <div className="reward-theme-standard">
        <div><strong>标准档案</strong><span>{archiveThemes[0].description}</span></div>
        <button
          aria-label={selectedTheme === 'archive-standard' ? '当前使用 标准档案' : '装备 标准档案'}
          disabled={selectedTheme === 'archive-standard'}
          onClick={() => selectTheme('archive-standard')}
        >{selectedTheme === 'archive-standard' ? '当前使用' : '恢复默认'}</button>
      </div>
      <div className="reward-records">
        {knownRewards.map(({ definition, reward, key }) => {
          const isUnlocked = unlockKeys.has(key)
          const isCurrent = reward.kind === 'theme' && reward.themeId === selectedTheme
          const conditions = reward.requirements.length ? reward.requirements.map((item) => requirementLabel(item, definition)).join(' · ') : '完成一次推理'
          return <article data-unlocked={isUnlocked} key={key}>
            <div className="reward-record-code"><span>{kindLabels[reward.kind]}</span><b>{isUnlocked ? '已解锁' : '尚未解锁'}</b></div>
            <div><strong>{reward.title}</strong><p>{reward.description}</p><small>{definition.title} · {conditions}</small></div>
            {reward.kind === 'theme' && reward.themeId && <button
              aria-label={isCurrent ? `当前使用 ${reward.title}` : `装备 ${reward.title}`}
              disabled={!isUnlocked || isCurrent}
              onClick={() => selectTheme(reward.themeId!)}
            >{isCurrent ? '当前使用' : '装备主题'}</button>}
          </article>
        })}
        {orphaned.map((record) => <article data-unlocked="true" key={record.key}>
          <div className="reward-record-code"><span>{kindLabels[record.kind]}</span><b>已解锁</b></div>
          <div><strong>{record.title}</strong><p>{record.description}</p><small>{record.caseTitle} · 案件当前未安装</small></div>
          {record.kind === 'theme' && record.themeId && <button
            aria-label={selectedTheme === record.themeId ? `当前使用 ${record.title}` : `装备 ${record.title}`}
            disabled={selectedTheme === record.themeId}
            onClick={() => selectTheme(record.themeId!)}
          >{selectedTheme === record.themeId ? '当前使用' : '装备主题'}</button>}
        </article>)}
      </div>
    </section>
  )
}
