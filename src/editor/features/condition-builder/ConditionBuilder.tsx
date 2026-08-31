import type { CaseCondition, GameEventType } from '../../../cases/types'

const eventTypes: { value: GameEventType; label: string }[] = [
  { value: 'OPEN_ITEM', label: '打开内容' }, { value: 'VIEW_METADATA', label: '查看元数据' }, { value: 'VIEW_LOG', label: '查看日志详情' },
  { value: 'UNLOCK_ITEM', label: '解锁内容' }, { value: 'RESTORE_ITEM', label: '恢复文件' }, { value: 'VIEW_TRANSCRIPT', label: '查看转写' },
]

interface ConditionNodeProps {
  condition: CaseCondition
  onChange: (condition: CaseCondition) => void
  onRemove?: () => void
  targets: { id: string; label: string }[]
  clueIds: string[]
  triggerIds: string[]
  depth?: number
}

function replacement(type: string, targets: ConditionNodeProps['targets'], clueIds: string[], triggerIds: string[]): CaseCondition {
  if (type === 'all' || type === 'any') return { type, conditions: [{ type: 'event', eventType: 'OPEN_ITEM', targetId: targets[0]?.id ?? '' }] }
  if (type === 'clue-count') return { type, count: 1 }
  if (type === 'clue') return { type, clueId: clueIds[0] ?? '' }
  if (type === 'trigger') return { type, triggerId: triggerIds[0] ?? '' }
  if (type === 'relation') return { type, from: clueIds[0] ?? '', to: clueIds[1] ?? '' }
  return { type: 'event', eventType: 'OPEN_ITEM', targetId: targets[0]?.id ?? '' }
}

function ConditionNode({ condition, onChange, onRemove, targets, clueIds, triggerIds, depth = 1 }: ConditionNodeProps) {
  const type = condition.type
  return <div className={`condition-node type-${type}`}>
    <div className="condition-node-head"><select aria-label={`条件类型 第${depth}层`} value={type} onChange={(event) => onChange(replacement(event.target.value, targets, clueIds, triggerIds))}><option value="event">事件发生</option><option value="all">全部满足（AND）</option><option value="any">任一满足（OR）</option><option value="clue">前置线索</option><option value="clue-count">线索数量</option><option value="relation">证据关系</option><option value="trigger">触发器已执行</option></select>{onRemove && <button aria-label="删除条件" onClick={onRemove}>×</button>}</div>
    {type === 'event' && <div className="condition-fields"><select aria-label="事件类型" value={condition.eventType} onChange={(event) => onChange({ ...condition, eventType: event.target.value as GameEventType })}>{eventTypes.map((event) => <option key={event.value} value={event.value}>{event.label}</option>)}</select><select aria-label="事件目标" value={condition.targetId} onChange={(event) => onChange({ ...condition, targetId: event.target.value })}><option value="">选择目标</option>{targets.map((target) => <option key={target.id} value={target.id}>{target.label}</option>)}</select></div>}
    {type === 'clue-count' && <label>至少发现<input type="number" min="1" value={condition.count} onChange={(event) => onChange({ ...condition, count: Number(event.target.value) })} />条线索</label>}
    {type === 'clue' && <label>前置线索<select aria-label="前置线索" value={condition.clueId} onChange={(event) => onChange({ ...condition, clueId: event.target.value })}><option value="">选择线索</option>{clueIds.map((id) => <option key={id}>{id}</option>)}</select></label>}
    {type === 'trigger' && <label>前置触发器<select aria-label="前置触发器" value={condition.triggerId} onChange={(event) => onChange({ ...condition, triggerId: event.target.value })}><option value="">选择触发器</option>{triggerIds.map((id) => <option key={id}>{id}</option>)}</select></label>}
    {type === 'relation' && <div className="condition-fields"><select aria-label="关系起点" value={condition.from} onChange={(event) => onChange({ ...condition, from: event.target.value })}><option value="">起点线索</option>{clueIds.map((id) => <option key={id}>{id}</option>)}</select><select aria-label="关系终点" value={condition.to} onChange={(event) => onChange({ ...condition, to: event.target.value })}><option value="">终点线索</option>{clueIds.map((id) => <option key={id}>{id}</option>)}</select></div>}
    {(type === 'all' || type === 'any') && <div className="condition-children">{condition.conditions.map((child, index) => <ConditionNode key={index} condition={child} targets={targets} clueIds={clueIds} triggerIds={triggerIds} depth={depth + 1} onChange={(next) => onChange({ ...condition, conditions: condition.conditions.map((item, childIndex) => childIndex === index ? next : item) })} onRemove={() => onChange({ ...condition, conditions: condition.conditions.filter((_item, childIndex) => childIndex !== index) })} />)}<button disabled={depth >= 5} onClick={() => onChange({ ...condition, conditions: [...condition.conditions, { type: 'event', eventType: 'OPEN_ITEM', targetId: targets[0]?.id ?? '' }] })}>添加子条件</button></div>}
  </div>
}

export function ConditionBuilder({ condition, onChange, targets, clueIds = [], triggerIds = [] }: { condition: CaseCondition; onChange: (condition: CaseCondition) => void; targets: { id: string; label: string }[]; clueIds?: string[]; triggerIds?: string[] }) {
  return <section className="condition-builder"><header><div><span>WHEN</span><h3>发现条件</h3></div><button onClick={() => onChange({ type: 'all', conditions: [condition, { type: 'event', eventType: 'OPEN_ITEM', targetId: targets[0]?.id ?? '' }] })}>添加AND组</button></header><ConditionNode condition={condition} onChange={onChange} targets={targets} clueIds={clueIds} triggerIds={triggerIds} /><details><summary>查看声明式数据</summary><pre>{JSON.stringify(condition, null, 2)}</pre></details></section>
}
