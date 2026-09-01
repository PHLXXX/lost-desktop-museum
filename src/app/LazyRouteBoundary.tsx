import { Component, type ReactNode } from 'react'

interface LazyRouteBoundaryProps {
  children: ReactNode
  featureName: string
  onReturnMuseum: () => void
}

interface LazyRouteBoundaryState {
  failed: boolean
}

export class LazyRouteBoundary extends Component<LazyRouteBoundaryProps, LazyRouteBoundaryState> {
  state: LazyRouteBoundaryState = { failed: false }

  static getDerivedStateFromError(): LazyRouteBoundaryState {
    return { failed: true }
  }

  render() {
    if (!this.state.failed) return this.props.children
    return (
      <main className="lazy-route-error" role="alert">
        <section>
          <small>LOCAL ARCHIVE RECOVERY</small>
          <h1>{this.props.featureName}暂时无法载入</h1>
          <p>相关界面文件可能尚未缓存，或当前网络连接不可用。本地案件、存档和编辑工程没有受到影响。</p>
          <div>
            <button className="primary-button" onClick={this.props.onReturnMuseum}>返回我的档案</button>
            <button onClick={() => window.location.reload()}>重试加载</button>
          </div>
        </section>
      </main>
    )
  }
}
