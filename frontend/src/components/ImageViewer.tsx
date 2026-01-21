import { useEffect } from "react";
import type { ImageItem } from "../types";

type ImageViewerProps = {
  image: ImageItem | null;
  onClose: () => void;
};

export default function ImageViewer({ image, onClose }: ImageViewerProps) {
  useEffect(() => {
    if (!image) {
      return;
    }
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [image, onClose]);

  if (!image) {
    return null;
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="viewer" onClick={(event) => event.stopPropagation()}>
        <div className="viewer-media">
          <img
            src={image.urls.display}
            srcSet={`${image.urls.display} 1x, ${image.urls.original} 2x`}
            alt={image.filename}
          />
        </div>
        <div className="stack">
          <div className="toolbar">
            <span className="tag">{image.folder}</span>
            <span className="muted">
              {image.width}×{image.height}
            </span>
          </div>
          <div className="toolbar">
            <button className="btn" type="button" onClick={onClose}>
              Close
            </button>
            <a className="btn btn-primary" href={image.urls.original} target="_blank" rel="noreferrer">
              Open original
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
