import { useEffect, useState } from "react";
import { createShare } from "../api/client";
import type { Share } from "../types";

type ShareModalProps = {
  open: boolean;
  albumId: string | null;
  folder: string;
  onClose: () => void;
};

export default function ShareModal({
  open,
  albumId,
  folder,
  onClose,
}: ShareModalProps) {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [share, setShare] = useState<Share | null>(null);

  useEffect(() => {
    if (open) {
      setPassword("");
      setShare(null);
      setError(null);
      setLoading(false);
    }
  }, [open]);

  if (!open) {
    return null;
  }

  const handleCreate = async () => {
    if (!albumId) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const payload = await createShare(
        albumId,
        folder === "All" ? null : folder,
        password.trim() ? password : null
      );
      setShare(payload);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!share) {
      return;
    }
    await navigator.clipboard.writeText(share.url);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(event) => event.stopPropagation()}>
        <div className="stack">
          <h3>Send to client</h3>
          <p className="muted">
            Share {folder === "All" ? "all folders" : folder} with an optional
            password.
          </p>
          <div className="field">
            <label className="muted">Password (optional)</label>
            <input
              className="input"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Set a manual password"
            />
          </div>
          {error && <div className="muted">{error}</div>}
          {share ? (
            <div className="stack">
              <div className="share-link">{share.url}</div>
              <div className="toolbar">
                <button className="btn btn-primary" type="button" onClick={handleCopy}>
                  Copy link
                </button>
                <button className="btn" type="button" onClick={onClose}>
                  Close
                </button>
              </div>
            </div>
          ) : (
            <div className="toolbar">
              <button
                className="btn btn-primary"
                type="button"
                onClick={handleCreate}
                disabled={loading || !albumId}
              >
                {loading ? "Creating..." : "Create link"}
              </button>
              <button className="btn" type="button" onClick={onClose}>
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
