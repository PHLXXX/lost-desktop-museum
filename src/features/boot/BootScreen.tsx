import { useEffect, useState } from 'react'
import { useActiveCaseDefinition } from '../../cases/useActiveCase'

export function BootScreen({ onEnter }: { onEnter: (safeMode: boolean) => void }) {
  const caseDefinition = useActiveCaseDefinition()
  const [ready, setReady] = useState(false)
  useEffect(() => { const timer = setTimeout(() => setReady(true), 3800); return () => clearTimeout(timer) }, [])
  return <main className="boot-screen">
    <div className="boot-mark" aria-hidden="true"><span>A</span><i /></div>
    <p className="boot-kicker">{caseDefinition.desktop.systemName}</p>
    <h1>遗失电脑博物馆</h1>
    <div className="boot-log" aria-live="polite">
      <p>{caseDefinition.desktop.bootMessage}</p><p>档案会话准备就绪</p><p>上次登录：{caseDefinition.desktop.lastLoginMessage}</p><p>用户：{caseDefinition.subject.name}</p>
    </div>
    {!ready && <button className="text-button" onClick={() => setReady(true)}>跳过启动</button>}
    {ready && <div className="boot-actions"><button className="primary-button" onClick={() => onEnter(false)}>进入调查桌面</button><button className="secondary-button" onClick={() => onEnter(true)}>进入安全模式</button></div>}
  </main>
}
