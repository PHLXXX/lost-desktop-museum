import { create } from 'zustand'

interface ApplicationState {
  selectedPhotoId: string | null
  selectPhoto: (photoId: string) => void
}

export const useApplicationStore = create<ApplicationState>((set) => ({
  selectedPhotoId: null,
  selectPhoto: (selectedPhotoId) => set({ selectedPhotoId }),
}))
