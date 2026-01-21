import type { Album, ImageItem, Share } from "../types";

const API_BASE = import.meta.env.VITE_API_BASE ?? "/api";

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    let message = "Request failed.";
    try {
      const payload = await response.json();
      message = payload.detail || payload.error || message;
    } catch {
      message = response.statusText || message;
    }
    throw new Error(message);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return (await response.json()) as T;
}

export async function listAlbums(): Promise<Album[]> {
  return apiFetch<Album[]>("/albums");
}

export async function createAlbum(name: string): Promise<Album> {
  return apiFetch<Album>("/albums", {
    method: "POST",
    body: JSON.stringify({ name }),
  });
}

export async function getAlbumDetail(albumId: string): Promise<{
  album: Album;
  folders: string[];
}> {
  return apiFetch(`/albums/${albumId}`);
}

export async function listImages(
  albumId: string,
  folder?: string
): Promise<ImageItem[]> {
  const params = new URLSearchParams({ album_id: albumId });
  if (folder && folder !== "All") {
    params.set("folder", folder);
  }
  return apiFetch(`/images?${params.toString()}`);
}

export async function createShare(
  albumId: string,
  folder: string | null,
  password: string | null
): Promise<Share> {
  return apiFetch<Share>("/shares", {
    method: "POST",
    body: JSON.stringify({
      album_id: albumId,
      folder,
      password,
    }),
  });
}

export async function getShare(token: string): Promise<{
  share: Share;
  album: Album;
  images?: ImageItem[];
}> {
  return apiFetch(`/shares/${token}`);
}

export async function accessShare(
  token: string,
  password?: string
): Promise<{
  share: Share;
  album: Album;
  images: ImageItem[];
}> {
  return apiFetch(`/shares/${token}/access`, {
    method: "POST",
    body: JSON.stringify({ password }),
  });
}
