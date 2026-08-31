const GLOBAL_PREFERENCES_KEY = 'archive-os:global-preferences'

interface GlobalPreferences {
  version: 1
  onboardingComplete: boolean
}

const defaults: GlobalPreferences = { version: 1, onboardingComplete: false }

export function loadGlobalPreferences(storage: Storage): GlobalPreferences {
  try {
    const raw = storage.getItem(GLOBAL_PREFERENCES_KEY)
    if (!raw) return defaults
    const value = JSON.parse(raw) as Partial<GlobalPreferences>
    return { version: 1, onboardingComplete: value.onboardingComplete === true }
  } catch {
    return defaults
  }
}

export function saveGlobalOnboardingPreference(storage: Storage, onboardingComplete: boolean): void {
  try {
    storage.setItem(GLOBAL_PREFERENCES_KEY, JSON.stringify({ version: 1, onboardingComplete } satisfies GlobalPreferences))
  } catch {
    // The in-memory case save can still continue when browser preference storage is unavailable.
  }
}
