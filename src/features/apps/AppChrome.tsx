import type { ReactNode } from 'react'

export function AppToolbar({ children }: { children: ReactNode }) { return <div className="app-commandbar">{children}</div> }
export function AppStatusBar({ children }: { children: ReactNode }) { return <footer className="app-statusbar">{children}</footer> }
export function PaneHeader({ title, meta }: { title: string; meta?: string }) { return <header className="pane-header"><strong>{title}</strong>{meta && <span>{meta}</span>}</header> }
