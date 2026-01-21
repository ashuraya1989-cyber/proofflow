import type { UploadResult } from "../types";

const API_BASE = import.meta.env.VITE_API_BASE ?? "/api";

type UploadParams = {
  albumId: string;
  folder: string;
  file: File;
  onProgress: (value: number) => void;
};

export function uploadFile({
  albumId,
  folder,
  file,
  onProgress,
}: UploadParams): Promise<UploadResult> {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append("album_id", albumId);
    formData.append("folder", folder);
    formData.append("files", file);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${API_BASE}/images/upload`);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const value = Math.round((event.loaded / event.total) * 100);
        onProgress(value);
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const payload = JSON.parse(xhr.responseText) as UploadResult[];
          resolve(payload[0]);
        } catch (err) {
          reject(new Error("Upload succeeded, but parsing failed."));
        }
      } else {
        let message = xhr.statusText || "Upload failed.";
        try {
          const payload = JSON.parse(xhr.responseText) as { detail?: string };
          message = payload.detail || message;
        } catch {
          // ignore parse errors
        }
        reject(new Error(message));
      }
    };

    xhr.onerror = () => {
      reject(new Error("Network error during upload."));
    };

    xhr.send(formData);
  });
}
