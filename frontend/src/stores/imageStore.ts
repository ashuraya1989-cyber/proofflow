import { create } from 'zustand'
import { imagesApi, Image, UploadProgress } from '@/api/images'

interface ImageState {
  images: Image[]
  selectedImages: Set<string>
  isLoading: boolean
  error: string | null
  uploadProgress: Map<string, UploadProgress>
  
  fetchImages: (albumId: string, includeSubfolders?: boolean) => Promise<void>
  uploadImages: (albumId: string, files: File[]) => Promise<void>
  deleteImage: (imageId: string) => Promise<boolean>
  deleteImages: (imageIds: string[]) => Promise<boolean>
  setCoverImage: (imageId: string) => Promise<boolean>
  toggleImageSelection: (imageId: string) => void
  selectAllImages: () => void
  clearSelection: () => void
  clearImages: () => void
}

export const useImageStore = create<ImageState>()((set, get) => ({
  images: [],
  selectedImages: new Set(),
  isLoading: false,
  error: null,
  uploadProgress: new Map(),
  
  fetchImages: async (albumId: string, includeSubfolders = false) => {
    set({ isLoading: true, error: null })
    try {
      const images = await imagesApi.getAlbumImages(albumId, includeSubfolders)
      set({ images, isLoading: false })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch images'
      set({ error: message, isLoading: false })
    }
  },
  
  uploadImages: async (albumId: string, files: File[]) => {
    const progressMap = new Map<string, UploadProgress>()
    
    // Initialize progress for all files
    files.forEach((file, index) => {
      progressMap.set(`upload-${index}`, {
        filename: file.name,
        progress: 0,
        status: 'pending',
      })
    })
    set({ uploadProgress: new Map(progressMap) })
    
    // Upload files sequentially to avoid overwhelming the server
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const key = `upload-${i}`
      
      // Update status to uploading
      progressMap.set(key, {
        filename: file.name,
        progress: 0,
        status: 'uploading',
      })
      set({ uploadProgress: new Map(progressMap) })
      
      try {
        await imagesApi.uploadImage(albumId, file, (progress) => {
          progressMap.set(key, {
            filename: file.name,
            progress,
            status: 'uploading',
          })
          set({ uploadProgress: new Map(progressMap) })
        })
        
        // Mark as complete
        progressMap.set(key, {
          filename: file.name,
          progress: 100,
          status: 'complete',
        })
        set({ uploadProgress: new Map(progressMap) })
      } catch (err) {
        // Mark as error
        progressMap.set(key, {
          filename: file.name,
          progress: 0,
          status: 'error',
          error: err instanceof Error ? err.message : 'Upload failed',
        })
        set({ uploadProgress: new Map(progressMap) })
      }
    }
    
    // Refresh images after all uploads
    await get().fetchImages(albumId)
    
    // Clear progress after a delay
    setTimeout(() => {
      set({ uploadProgress: new Map() })
    }, 3000)
  },
  
  deleteImage: async (imageId: string) => {
    try {
      await imagesApi.deleteImage(imageId)
      set((state) => ({
        images: state.images.filter((img) => img.id !== imageId),
        selectedImages: new Set([...state.selectedImages].filter((id) => id !== imageId)),
      }))
      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete image'
      set({ error: message })
      return false
    }
  },
  
  deleteImages: async (imageIds: string[]) => {
    let success = true
    for (const id of imageIds) {
      const result = await get().deleteImage(id)
      if (!result) success = false
    }
    return success
  },
  
  setCoverImage: async (imageId: string) => {
    try {
      await imagesApi.setCoverImage(imageId)
      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to set cover image'
      set({ error: message })
      return false
    }
  },
  
  toggleImageSelection: (imageId: string) => {
    set((state) => {
      const newSelection = new Set(state.selectedImages)
      if (newSelection.has(imageId)) {
        newSelection.delete(imageId)
      } else {
        newSelection.add(imageId)
      }
      return { selectedImages: newSelection }
    })
  },
  
  selectAllImages: () => {
    set((state) => ({
      selectedImages: new Set(state.images.map((img) => img.id)),
    }))
  },
  
  clearSelection: () => {
    set({ selectedImages: new Set() })
  },
  
  clearImages: () => {
    set({ images: [], selectedImages: new Set() })
  },
}))
