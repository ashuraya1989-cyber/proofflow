import { create } from 'zustand'
import { albumsApi, Album, AlbumTree } from '@/api/albums'

interface AlbumState {
  albums: Album[]
  albumTree: AlbumTree[]
  currentAlbum: Album | null
  isLoading: boolean
  error: string | null
  
  fetchAlbums: () => Promise<void>
  fetchAlbumTree: () => Promise<void>
  fetchAlbum: (id: string) => Promise<Album | null>
  createAlbum: (name: string, description?: string, parentId?: string) => Promise<Album | null>
  updateAlbum: (id: string, data: { name?: string; description?: string }) => Promise<boolean>
  deleteAlbum: (id: string) => Promise<boolean>
  setCurrentAlbum: (album: Album | null) => void
}

export const useAlbumStore = create<AlbumState>()((set, get) => ({
  albums: [],
  albumTree: [],
  currentAlbum: null,
  isLoading: false,
  error: null,
  
  fetchAlbums: async () => {
    set({ isLoading: true, error: null })
    try {
      const albums = await albumsApi.getAlbums()
      set({ albums, isLoading: false })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch albums'
      set({ error: message, isLoading: false })
    }
  },
  
  fetchAlbumTree: async () => {
    try {
      const albumTree = await albumsApi.getAlbumTree()
      set({ albumTree })
    } catch (err) {
      console.error('Failed to fetch album tree:', err)
    }
  },
  
  fetchAlbum: async (id: string) => {
    set({ isLoading: true, error: null })
    try {
      const album = await albumsApi.getAlbum(id)
      set({ currentAlbum: album, isLoading: false })
      return album
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch album'
      set({ error: message, isLoading: false, currentAlbum: null })
      return null
    }
  },
  
  createAlbum: async (name: string, description?: string, parentId?: string) => {
    try {
      const album = await albumsApi.createAlbum({ name, description, parent_id: parentId })
      // Refresh albums list
      await get().fetchAlbums()
      await get().fetchAlbumTree()
      return album
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create album'
      set({ error: message })
      return null
    }
  },
  
  updateAlbum: async (id: string, data: { name?: string; description?: string }) => {
    try {
      await albumsApi.updateAlbum(id, data)
      // Refresh current album if it's the one being updated
      if (get().currentAlbum?.id === id) {
        await get().fetchAlbum(id)
      }
      await get().fetchAlbums()
      await get().fetchAlbumTree()
      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update album'
      set({ error: message })
      return false
    }
  },
  
  deleteAlbum: async (id: string) => {
    try {
      await albumsApi.deleteAlbum(id)
      await get().fetchAlbums()
      await get().fetchAlbumTree()
      if (get().currentAlbum?.id === id) {
        set({ currentAlbum: null })
      }
      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete album'
      set({ error: message })
      return false
    }
  },
  
  setCurrentAlbum: (album) => {
    set({ currentAlbum: album })
  },
}))
