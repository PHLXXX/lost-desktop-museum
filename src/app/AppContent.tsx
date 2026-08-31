import type { AppId } from '../cases/types'
import { getCaseDefinition } from '../cases/registry'
import { useGameStore } from '../store/gameStore'
import { appComponentRegistry } from './appComponentRegistry'

export function AppContent({ appId, onDeduction, onResult }: { appId: AppId; onDeduction?: () => void; onResult?: () => void }) {
  const caseId = useGameStore((state) => state.caseId)
  const componentKey = getCaseDefinition(caseId).applications.find((app) => app.id === appId)?.componentKey ?? appId
  const module = appComponentRegistry.get(componentKey)
  if (!module) return <section className="unsupported-app"><h2>不支持的应用类型</h2><p>当前引擎无法加载组件“{componentKey}”。案件数据仍保留，请升级后重试。</p></section>
  return module.render({ onDeduction, onResult })
}
