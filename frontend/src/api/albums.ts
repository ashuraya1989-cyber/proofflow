import apiClient from './client'

export interface Album {
  id: string
  name: string
  description?: string
  parent_id?: string
  image_count: number
  cover_image_url?: string
  created_at: string
  updated_at: string
  subfolders: Album[]
}

export interface AlbumTree {
  id: string
  name: string
  image_count: number
  children: AlbumTree[]
}

export interface CreateAlbumData {
  name: string
  description?: string
  parent_id?: string
}

export interface UpdateAlbumData {
  name?: string
  description?: string
}

export const albumsApi = {
  getAlbums: async (parentId?: string): Promise<Album[]> => {
    const params = parentId ? { parent_id: parentId } : {}
    const response = await apiClient.get<Album[]>('/albums', { params })
    return response.data
  },
  
  getAlbumTree: async (): Promise<AlbumTree[]> => {
    const response = await apiClient.get<AlbumTree[]>('/albums/tree')
    return response.data
  },
  
  getAlbum: async (id: string): Promise<Album> => {
    const response = await apiClient.get<Album>(`/albums/${id}`)
    return response.data
  },
  
  createAlbum: async (data: CreateAlbumData): Promise<Album> => {
    const response = await apiClient.post<Album>('/albums', data)
    return response.data
  },
  
  updateAlbum: async (id: string, data: UpdateAlbumData): Promise<Album> => {
    const response = await apiClient.patch<Album>(`/albums/${id}`, data)
    return response.data
  },
  
  deleteAlbum: async (id: string): Promise<void> => {
    await apiClient.delete(`/albums/${id}`)
  },
  
  getSubfolders: async (id: string): Promise<Album[]> => {
    const response = await apiClient.get<Album[]>(`/albums/${id}/subfolders`)
    return response.data
  },
}
