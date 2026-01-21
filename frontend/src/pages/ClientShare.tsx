import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { accessShare, getShare } from "../api/client";
import AppShell from "../components/AppShell";
import ImageGrid from "../components/ImageGrid";
import ImageViewer from "../components/ImageViewer";
import type { Album, ImageItem, Share } from "../types";

export default function ClientShare() {
  const { token } = useParams();
  const [share, setShare] = useState<Share | null>(null);
  const [album, setAlbum] = useState<Album | null>(null);
  const [images, setImages] = useState<ImageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [viewerImage, setViewerImage] = useState<ImageItem | null>(null);

  useEffect(() => {
    if (!token) {
      return;
    }
    setLoading(true);
    getShare(token)
      .then((payload) => {
        setShare(payload.share);
        setAlbum(payload.album);
        setImages(payload.images || []);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [token]);

  const handleAccess = async () => {
    if (!token) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const payload = await accessShare(token, password);
      setShare(payload.share);
      setAlbum(payload.album);
      setImages(payload.images);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell title={album?.name ?? "Shared gallery"}>
      <div className="page">
        <div className="stack">
          <p className="muted">
            {share?.folder ? share.folder : "All folders"}
          </p>
        </div>
        {loading && <div className="empty">Loading...</div>}
        {error && <div className="empty">{error}</div>}
        {share?.requires_password && images.length === 0 && !loading && (
          <div className="card stack">
            <h3>Enter access password</h3>
            <div className="field">
              <input
                className="input"
                type="password"
                placeholder="Password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </div>
            <button className="btn btn-primary" type="button" onClick={handleAccess}>
              Unlock gallery
            </button>
          </div>
        )}
        {!share?.requires_password && images.length === 0 && !loading && (
          <div className="empty">No images yet.</div>
        )}
        {images.length > 0 && (
          <ImageGrid images={images} onSelect={setViewerImage} />
        )}
      </div>
      <ImageViewer image={viewerImage} onClose={() => setViewerImage(null)} />
    </AppShell>
  );
}
