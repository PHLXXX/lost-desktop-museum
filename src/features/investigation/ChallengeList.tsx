import type { InvestigationChallengeDefinition } from '../../cases/types'

export function ChallengeList({
  challenges,
  earnedIds,
  historicalIds,
  settled,
}: {
  challenges: InvestigationChallengeDefinition[]
  earnedIds: string[]
  historicalIds: string[]
  settled: boolean
}) {
  return (
    <>
      <p className="challenge-summary">{settled ? `本次达成 ${earnedIds.length} / ${challenges.length}` : '未结算'}</p>
      <div className="investigation-list" role="list" aria-label="调查挑战列表">
        {challenges.map((challenge) => {
          const earned = earnedIds.includes(challenge.id)
          const historical = !earned && historicalIds.includes(challenge.id)
          return (
            <article className="investigation-entry" data-complete={earned} key={challenge.id} role="listitem">
              <header>
                <span>结案挑战</span>
                {settled && <b>{earned ? '已达成' : historical ? '历史达成' : '未达成'}</b>}
              </header>
              <h3>{challenge.title}</h3>
              <p>{challenge.description}</p>
            </article>
          )
        })}
      </div>
    </>
  )
}
