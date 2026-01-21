import { useEffect, useMemo, useState } from "react";
import { uploadFile } from "../api/uploads";
import type { ImageItem, UploadResult } from "../types";

type UploadPanelProps = {
  albumId: string | null;
  folder: string;
  onUploaded: (image: ImageItem) => void;
};

type UploadTask = {
  id: string;
  file: File;
  albumId: string;
  folder: string;
  progress: number;
  status: "queued" | "uploading" | "success" | "error";
  error?: string;
};

const MAX_CONCURRENT = 3;

export default function UploadPanel({
  albumId,
  folder,
  onUploaded,
}: UploadPanelProps) {
  const [tasks, setTasks] = useState<UploadTask[]>([]);
  const canUpload = Boolean(albumId);

  const activeCount = useMemo(
    () => tasks.filter((task) => task.status === "uploading").length,
    [tasks]
  );

  useEffect(() => {
    if (!albumId) {
      return;
    }

    const next = tasks.find((task) => task.status === "queued");
    if (!next || activeCount >= MAX_CONCURRENT) {
      return;
    }

    setTasks((prev) =>
      prev.map((task) =>
        task.id === next.id ? { ...task, status: "uploading" } : task
      )
    );

    uploadFile({
      albumId: next.albumId,
      folder: next.folder,
      file: next.file,
      onProgress: (value) =>
        setTasks((prev) =>
          prev.map((task) =>
            task.id === next.id ? { ...task, progress: value } : task
          )
        ),
    })
      .then((result: UploadResult) => {
        if (result.status === "success" && result.image) {
          onUploaded(result.image);
          setTasks((prev) =>
            prev.map((task) =>
              task.id === next.id
                ? { ...task, status: "success", progress: 100 }
                : task
            )
          );
        } else {
          setTasks((prev) =>
            prev.map((task) =>
              task.id === next.id
                ? { ...task, status: "error", error: result.error }
                : task
            )
          );
        }
      })
      .catch((error: Error) => {
        setTasks((prev) =>
          prev.map((task) =>
            task.id === next.id
              ? { ...task, status: "error", error: error.message }
              : task
          )
        );
      });
  }, [activeCount, albumId, folder, onUploaded, tasks]);

  const handleFiles = (files: FileList | null) => {
    if (!files || !albumId) {
      return;
    }
    const newTasks: UploadTask[] = Array.from(files).map((file) => ({
      id: crypto.randomUUID(),
      file,
      albumId,
      folder,
      progress: 0,
      status: "queued",
    }));
    setTasks((prev) => [...newTasks, ...prev]);
  };

  return (
    <div className="card stack">
      <div className="stack">
        <strong>Bulk upload</strong>
        <p className="muted">
          Upload full-resolution images. Thumbnails are generated automatically.
        </p>
      </div>
      <div className="field">
        <label className="muted">Choose images</label>
        <input
          className="input"
          type="file"
          accept="image/*"
          multiple
          disabled={!canUpload}
          onChange={(event) => handleFiles(event.target.files)}
        />
      </div>
      {tasks.length > 0 && (
        <div className="progress-list">
          {tasks.map((task) => (
            <div key={task.id} className="progress-item" title={task.error}>
              <span>{task.file.name}</span>
              <div className="progress-bar">
                <span style={{ width: `${task.progress}%` }} />
              </div>
              <span className="pill">
                {task.status === "error"
                  ? "Error"
                  : task.status === "success"
                  ? "Done"
                  : task.status === "uploading"
                  ? "Uploading"
                  : "Queued"}
              </span>
            </div>
          ))}
        </div>
      )}
      {!canUpload && <div className="empty">Select an album first.</div>}
    </div>
  );
}
