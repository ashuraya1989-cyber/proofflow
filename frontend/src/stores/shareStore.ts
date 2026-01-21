import { create } from 'zustand'
import { sharesApi, Share, ShareCreate } from '@/api/shares'

interface ShareState {
  shares: Share[]
  isLoading: boolean
  error: string | null
  
  fetchShares: (albumId?: string) => Promise<void>
  createShare: (data: ShareCreate) => Promise<Share | null>
  deactivateShare: (shareId: string) => Promise<boolean>
  deleteShare: (shareId: string) => Promise<boolean>
}

export const useShareStore = create<ShareState>()((set, get) => ({
  shares: [],
  isLoading: false,
  error: null,
  
  fetchShares: async (albumId?: string) => {
    set({ isLoading: true, error: null })
    try {
      const shares = await sharesApi.getShares(albumId)
      set({ shares, isLoading: false })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch shares'
      set({ error: message, isLoading: false })
    }
  },
  
  createShare: async (data: ShareCreate) => {
    try {
      const share = await sharesApi.createShare(data)
      await get().fetchShares()
      return share
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create share'
      set({ error: message })
      return null
    }
  },
  
  deactivateShare: async (shareId: string) => {
    try {
      await sharesApi.deactivateShare(shareId)
      await get().fetchShares()
      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to deactivate share'
      set({ error: message })
      return false
    }
  },
  
  deleteShare: async (shareId: string) => {
    try {
      await sharesApi.deleteShare(shareId)
      set((state) => ({
        shares: state.shares.filter((s) => s.id !== shareId),
      }))
      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete share'
      set({ error: message })
      return false
    }
  },
}))
