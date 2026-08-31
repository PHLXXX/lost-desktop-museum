export const COMMUNITY_CLIENT_VERSION = '0.5.0'
export const COMMUNITY_AUTO_REFRESH_MS = 6 * 60 * 60 * 1000

export function getCommunityRegistryUrl(): string {
  const configured = import.meta.env.VITE_COMMUNITY_REGISTRY_URL as string | undefined
  if (configured) return configured
  if (import.meta.env.DEV) return new URL('community-fixture/registry/v1/index.json', window.location.origin + import.meta.env.BASE_URL).toString()
  return 'https://phlxxx.github.io/lost-desktop-museum-community/registry/v1/index.json'
}
