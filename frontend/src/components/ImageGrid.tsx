import type { ImageItem } from "../types";

type ImageGridProps = {
  images: ImageItem[];
  onSelect: (image: ImageItem) => void;
};

export default function ImageGrid({ images, onSelect }: ImageGridProps) {
  if (images.length === 0) {
    return <div className="empty">No images yet.</div>;
  }

  return (
    <div className="grid image-grid">
      {images.map((image) => (
        <button
          key={image.id}
          className="image-card"
          type="button"
          onClick={() => onSelect(image)}
        >
          <img src={image.urls.thumb} alt={image.filename} loading="lazy" />
          <div className="image-meta">
            <strong>{image.filename}</strong>
            <span className="muted">
              {image.width}×{image.height}
            </span>
          </div>
        </button>
      ))}
    </div>
  );
}
