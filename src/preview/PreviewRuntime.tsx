import { useState } from 'react'
import { Desktop } from '../features/desktop/Desktop'
import { PreviewDebugPanel } from './PreviewDebugPanel'

export function PreviewRuntime({ onReturn }: { onReturn: () => void }) {
  const [debug, setDebug] = useState(true)
  return <main className="preview-runtime"><div className="preview-banner"><strong>试玩模式 / PREVIEW SESSION</strong><span>试玩进度与正式调查完全隔离</span><button onClick={() => setDebug(!debug)}>{debug ? '隐藏调试' : '显示调试'}</button><button onClick={onReturn}>返回档案工坊</button></div><div className="preview-desktop"><Desktop onReturnMuseum={onReturn} onDeduction={() => {}} onResult={() => {}} /></div>{debug && <PreviewDebugPanel />}</main>
}
