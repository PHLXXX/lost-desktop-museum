import { useState } from 'react'

export function CommunityCaseCover({ path, resolvePath, title, archiveNumber }: { path?: string; resolvePath: (path: string) => string; title: string; archiveNumber: string }) {
  const [failed, setFailed] = useState(false)
  if (path && !failed) return <div className="community-case-cover"><img loading="lazy" src={resolvePath(path)} alt={`${title}封面`} onError={() => setFailed(true)} /></div>
  return <div className="community-cover-placeholder" aria-label={`${title}暂无封面`}><span>档案</span><b>{archiveNumber}</b></div>
}
