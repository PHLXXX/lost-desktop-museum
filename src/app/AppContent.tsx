import { Component, type ReactNode } from 'react'
import type { AppId } from '../cases/types'
import { getCaseDefinition } from '../cases/registry'
import { useGameStore } from '../store/gameStore'
import { appComponentRegistry } from './appComponentRegistry'
import type { AppComponentModule, AppRuntimeContext } from './appComponentRegistry'

class ApplicationErrorBoundary extends Component<{ children: ReactNode; resetKey: string }, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidUpdate(previous: Readonly<{ children: ReactNode; resetKey: string }>) {
    if (previous.resetKey !== this.props.resetKey && this.state.failed) this.setState({ failed: false })
  }

  render() {
    if (this.state.failed) {
      return <section className="unsupported-app application-error" role="alert"><h2>应用暂时无法显示</h2><p>案件数据和其他窗口没有受到影响。你可以关闭窗口后重新打开。</p><button onClick={() => this.setState({ failed: false })}>重新载入应用</button></section>
    }
    return this.props.children
  }
}

function ApplicationRenderer({ module, context }: { module: AppComponentModule; context: AppRuntimeContext }) {
  return module.render(context)
}

export function AppContent({ appId, onDeduction, onResult }: { appId: AppId; onDeduction?: () => void; onResult?: () => void }) {
  const caseId = useGameStore((state) => state.caseId)
  const componentKey = getCaseDefinition(caseId).applications.find((app) => app.id === appId)?.componentKey ?? appId
  const module = appComponentRegistry.get(componentKey)
  if (!module) return <section className="unsupported-app"><h2>不支持的应用类型</h2><p>当前引擎无法加载组件“{componentKey}”。案件数据仍保留，请升级后重试。</p></section>
  return <ApplicationErrorBoundary resetKey={`${caseId}:${componentKey}`}><ApplicationRenderer module={module} context={{ onDeduction, onResult }} /></ApplicationErrorBoundary>
}
