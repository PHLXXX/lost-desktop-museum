import type { AppId } from '../../cases/types'

const paths: Record<AppId, string[]> = {
  files: ['M3 6h7l2 2h9v11H3z', 'M3 10h18'], messages: ['M4 5h16v11H9l-5 4z', 'M8 9h8', 'M8 12h5'], mail: ['M3 6h18v13H3z', 'm3 3 6 5 6-5'], photos: ['M4 4h16v16H4z', 'm7 12 3-4 5 7', 'M9 9h.01'], browser: ['M4 5h16v14H4z', 'M4 9h16', 'M7 7h.01'], calendar: ['M5 4h14v16H5z', 'M5 9h14', 'M9 2v4', 'M15 2v4'], recycle: ['M7 7h10l-1 13H8z', 'M5 7h14', 'M9 4h6'], logs: ['M4 5h16v14H4z', 'M8 9h8', 'M8 13h8', 'M8 17h5'], evidence: ['M5 5h5v5H5z', 'M14 5h5v5h-5z', 'M9 15h6v5H9z', 'm10 10-4 5', 'm9 15-3-5'], settings: ['M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z', 'M12 3v2', 'M12 19v2', 'M3 12h2', 'M19 12h2', 'm5.6-6.4 1.4 1.4', 'm12 12 1.4 1.4'],
}

export function ArchiveIcon({ id, size = 24 }: { id: AppId; size?: number }) {
  return <svg className="archive-icon" aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" strokeLinejoin="miter">{paths[id].map((path) => <path key={path} d={path} />)}</svg>
}
