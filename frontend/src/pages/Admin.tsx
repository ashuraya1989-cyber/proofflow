import { useEffect, useMemo, useState } from "react";
import AppShell from "../components/AppShell";
import ImageGrid from "../components/ImageGrid";
import ImageViewer from "../components/ImageViewer";
import ShareModal from "../components/ShareModal";
import UploadPanel from "../components/UploadPanel";
import {
  createAlbum,
  getAlbumDetail,
  listAlbums,
  listImages,
} from "../api/client";
import type { Album, ImageItem } from "../types";

export default function Admin() {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [selectedAlbumId, setSelectedAlbumId] = useState<string | null>(null);
  const [folders, setFolders] = useState<string[]>([]);
  const [selectedFolder, setSelectedFolder] = useState("All");
  const [uploadFolder, setUploadFolder] = useState("General");
  const [images, setImages] = useState<ImageItem[]>([]);
  const [viewerImage, setViewerImage] = useState<ImageItem | null>(null);
  const [newAlbumName, setNewAlbumName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  const folderOptions = useMemo(() => ["All", ...folders], [folders]);

  const refreshImages = async (albumId: string, folder: string) => {
    const data = await listImages(albumId, folder);
    setImages(data);
  };

  const refreshAlbum = async (albumId: string) => {
    const detail = await getAlbumDetail(albumId);
    setFolders(detail.folders);
    if (selectedFolder !== "All" && !detail.folders.includes(selectedFolder)) {
      setSelectedFolder("All");
    }
    if (!detail.folders.includes(uploadFolder)) {
      setUploadFolder(detail.folders[0] || "General");
    }
  };

  useEffect(() => {
    listAlbums()
      .then((data) => {
        setAlbums(data);
        if (data.length > 0) {
          setSelectedAlbumId(data[0].id);
        }
      })
      .catch((err) => setError(err.message));
  }, []);

  useEffect(() => {
    if (!selectedAlbumId) {
      setImages([]);
      return;
    }
    refreshAlbum(selectedAlbumId)
      .then(() => refreshImages(selectedAlbumId, selectedFolder))
      .catch((err) => setError(err.message));
  }, [selectedAlbumId, selectedFolder]);

  const handleCreateAlbum = async () => {
    if (!newAlbumName.trim()) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const album = await createAlbum(newAlbumName.trim());
      setAlbums((prev) => [album, ...prev]);
      setSelectedAlbumId(album.id);
      setNewAlbumName("");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleUploaded = (image: ImageItem) => {
    setImages((prev) => [image, ...prev]);
    refreshAlbum(image.album_id).catch(() => undefined);
  };

  const currentAlbum = albums.find((album) => album.id === selectedAlbumId);

  return (
    <AppShell
      title="Studio Gallery Admin"
      actions={
        <button
          className="btn btn-primary"
          type="button"
          onClick={() => setShareOpen(true)}
          disabled={!selectedAlbumId}
        >
          Send to client
        </button>
      }
    >
      <div className="page">
        <div className="page-header">
          <div>
            <h2>Albums</h2>
            <p className="muted">Manage uploads and share curated folders.</p>
          </div>
        </div>
        {error && <div className="empty">{error}</div>}
        <div className="split">
          <div className="stack">
            <div className="card stack">
              <div className="field">
                <label className="muted">Create album</label>
                <input
                  className="input"
                  value={newAlbumName}
                  onChange={(event) => setNewAlbumName(event.target.value)}
                  placeholder="e.g. Product Launch"
                />
              </div>
              <button
                className="btn btn-primary"
                type="button"
                onClick={handleCreateAlbum}
                disabled={loading}
              >
                {loading ? "Creating..." : "Add album"}
              </button>
            </div>

            <div className="card stack">
              <div className="field">
                <label className="muted">Album</label>
                <select
                  className="select"
                  value={selectedAlbumId ?? ""}
                  onChange={(event) => setSelectedAlbumId(event.target.value)}
                >
                  <option value="" disabled>
                    Select album
                  </option>
                  {albums.map((album) => (
                    <option key={album.id} value={album.id}>
                      {album.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label className="muted">View folder</label>
                <select
                  className="select"
                  value={selectedFolder}
                  onChange={(event) => setSelectedFolder(event.target.value)}
                >
                  {folderOptions.map((folder) => (
                    <option key={folder} value={folder}>
                      {folder}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label className="muted">Upload folder</label>
                <input
                  className="input"
                  value={uploadFolder}
                  onChange={(event) => setUploadFolder(event.target.value)}
                />
              </div>
              {currentAlbum && (
                <div className="pill">
                  {currentAlbum.name} · {folders.length || 0} folders
                </div>
              )}
            </div>

            <UploadPanel
              albumId={selectedAlbumId}
              folder={uploadFolder}
              onUploaded={handleUploaded}
            />
          </div>

          <div className="stack">
            <div className="toolbar">
              <h3>{currentAlbum ? currentAlbum.name : "Select an album"}</h3>
              {selectedAlbumId && (
                <span className="pill">
                  {selectedFolder === "All" ? "All folders" : selectedFolder}
                </span>
              )}
            </div>
            <ImageGrid images={images} onSelect={setViewerImage} />
          </div>
        </div>
      </div>

      <ImageViewer image={viewerImage} onClose={() => setViewerImage(null)} />
      <ShareModal
        open={shareOpen}
        albumId={selectedAlbumId}
        folder={selectedFolder}
        onClose={() => setShareOpen(false)}
      />
    </AppShell>
  );
}
