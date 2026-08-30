import { useEffect, useState } from 'react'

export function BootScreen({ onEnter }: { onEnter: (safeMode: boolean) => void }) {
  const [ready, setReady] = useState(false)
  useEffect(() => { const timer = setTimeout(() => setReady(true), 3800); return () => clearTimeout(timer) }, [])
  return <main className="boot-screen">
    <div className="boot-mark" aria-hidden="true"><span>A</span><i /></div>
    <p className="boot-kicker">ARCHIVE/OS 3.1</p>
    <h1>遗失电脑博物馆</h1>
    <div className="boot-log" aria-live="polite">
      <p>正在检查异常关机记录……</p><p>发现未完成会话</p><p>上次登录：2031年11月17日 23:48</p><p>用户：ZHOU_YU</p>
    </div>
    {!ready && <button className="text-button" onClick={() => setReady(true)}>跳过启动</button>}
    {ready && <div className="boot-actions"><button className="primary-button" onClick={() => onEnter(false)}>恢复上次会话</button><button className="secondary-button" onClick={() => onEnter(true)}>进入安全模式</button></div>}
  </main>
}

