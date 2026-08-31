export const supportedAppComponentKeyList = ['files', 'messages', 'mail', 'photos', 'browser', 'calendar', 'recycle', 'logs', 'audio', 'broadcast', 'data', 'terminal', 'versions', 'sitemap', 'evidence', 'settings'] as const
export const supportedAppComponentKeys: ReadonlySet<string> = new Set(supportedAppComponentKeyList)
