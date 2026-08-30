import { useState } from 'react'
import { BootScreen } from '../features/boot/BootScreen'
import { Desktop } from '../features/desktop/Desktop'
import { useGameStore } from '../store/gameStore'

export function AppShell() {
  const [entered, setEntered] = useState(false)
  const updateSettings = useGameStore((state) => state.updateSettings)
  if (!entered) return <BootScreen onEnter={(safeMode) => { if (safeMode) updateSettings({ anomalies: false }); setEntered(true) }} />
  return <Desktop />
}

