import type { ObjectiveState } from '../../gameplay/objectiveEngine'

export function ObjectiveList({ objectives }: { objectives: ObjectiveState[] }) {
  const visibleObjectives = objectives.filter((objective) => objective.visible)

  return (
    <div className="investigation-list" role="list" aria-label="调查目标列表">
      {visibleObjectives.map((objective) => (
        <article className="investigation-entry" data-complete={objective.complete} key={objective.id} role="listitem">
          <header>
            <span>{objective.kind === 'primary' ? '主要目标' : '可选目标'}</span>
            <b>{objective.complete ? '完成' : '进行中'}</b>
          </header>
          <h3>{objective.title}</h3>
          <p>{objective.description}</p>
        </article>
      ))}
    </div>
  )
}
