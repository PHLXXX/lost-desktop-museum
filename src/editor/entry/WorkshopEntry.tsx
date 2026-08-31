import { useEffect } from 'react'
import { EditorShell } from '../components/EditorShell'
import { WorkshopHome } from '../features/workshop-home/WorkshopHome'
import { useEditorStore } from '../store/editorStore'
import '../../styles/workshop.css'

export default function WorkshopEntry({ onReturnMuseum }: { onReturnMuseum: () => void }) {
  const currentProject = useEditorStore((state) => state.currentProject)
  const loadProjects = useEditorStore((state) => state.loadProjects)
  useEffect(() => { void loadProjects() }, [loadProjects])
  if (currentProject) return <EditorShell onReturnMuseum={onReturnMuseum} />
  return <WorkshopHome onReturnMuseum={onReturnMuseum} />
}

