import { useState, useEffect, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { Image } from '@/api/images'
import { fetchImageWithAuth } from '@/api/images'
import {
  X,
  ChevronLeft,
  ChevronRight,
  Download,
  Trash2,
  Star,
  Loader2,
  ZoomIn,
  ZoomOut,
} from 'lucide-react'
import Button from '@/components/ui/Button'

interface ImageViewerProps {
  image: Image | null
  images: Image[]
  onClose: () => void
  onDelete: (imageId: string) => void
  onSetCover: (imageId: string) => void
}

export default function ImageViewer({
  image,
  images,
  onClose,
  onDelete,
  onSetCover,
}: ImageViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [imageSrc, setImageSrc] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [zoom, setZoom] = useState(1)

  const currentImage = image ? images.find((img) => img.id === image.id) || image : null

  useEffect(() => {
    if (image) {
      const index = images.findIndex((img) => img.id === image.id)
      setCurrentIndex(index >= 0 ? index : 0)
    }
  }, [image, images])

  useEffect(() => {
    if (!currentImage) return

    let isMounted = true
    setIsLoading(true)
    setImageSrc(null)
    setZoom(1)

    // Load the original (full resolution) image for the viewer
    fetchImageWithAuth(`/api/images/${currentImage.id}/original`)
      .then((blobUrl) => {
        if (isMounted) {
          setImageSrc(blobUrl)
          setIsLoading(false)
        }
      })
      .catch(() => {
        if (isMounted) {
          setIsLoading(false)
        }
      })

    return () => {
      isMounted = false
      if (imageSrc) {
        URL.revokeObjectURL(imageSrc)
      }
    }
  }, [currentImage?.id])

  const goToPrevious = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
    }
  }, [currentIndex])

  const goToNext = useCallback(() => {
    if (currentIndex < images.length - 1) {
      setCurrentIndex(currentIndex + 1)
    }
  }, [currentIndex, images.length])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') goToPrevious()
      if (e.key === 'ArrowRight') goToNext()
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose, goToPrevious, goToNext])

  // Update current image based on index
  useEffect(() => {
    if (images[currentIndex] && images[currentIndex].id !== currentImage?.id) {
      // This will trigger the image loading effect
    }
  }, [currentIndex])

  const displayImage = images[currentIndex] || currentImage

  if (!displayImage) return null

  const handleDownload = async () => {
    if (!imageSrc) return
    const link = document.createElement('a')
    link.href = imageSrc
    link.download = displayImage.original_filename
    link.click()
  }

  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.5, 3))
  const handleZoomOut = () => setZoom((z) => Math.max(z - 0.5, 0.5))

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-black/50">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={onClose} className="text-white hover:bg-white/10">
            <X className="w-5 h-5" />
          </Button>
          <div>
            <p className="text-white text-sm font-medium">{displayImage.original_filename}</p>
            <p className="text-white/60 text-xs">
              {displayImage.width} x {displayImage.height} • {currentIndex + 1} of {images.length}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleZoomOut}
            className="text-white hover:bg-white/10"
            disabled={zoom <= 0.5}
          >
            <ZoomOut className="w-4 h-4" />
          </Button>
          <span className="text-white/60 text-xs w-12 text-center">{Math.round(zoom * 100)}%</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleZoomIn}
            className="text-white hover:bg-white/10"
            disabled={zoom >= 3}
          >
            <ZoomIn className="w-4 h-4" />
          </Button>
          <div className="w-px h-6 bg-white/20 mx-2" />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onSetCover(displayImage.id)}
            className="text-white hover:bg-white/10"
          >
            <Star className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDownload}
            className="text-white hover:bg-white/10"
          >
            <Download className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(displayImage.id)}
            className="text-red-400 hover:bg-red-500/10"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Image container */}
      <div className="flex-1 flex items-center justify-center overflow-hidden relative">
        {isLoading ? (
          <Loader2 className="w-10 h-10 animate-spin text-white/50" />
        ) : imageSrc ? (
          <img
            src={imageSrc}
            alt={displayImage.original_filename}
            className="max-w-full max-h-full object-contain transition-transform duration-200"
            style={{ transform: `scale(${zoom})` }}
            draggable={false}
          />
        ) : (
          <p className="text-white/50">Failed to load image</p>
        )}

        {/* Navigation arrows */}
        {currentIndex > 0 && (
          <button
            onClick={goToPrevious}
            className={cn(
              'absolute left-4 top-1/2 -translate-y-1/2',
              'w-12 h-12 rounded-full',
              'bg-black/30 hover:bg-black/50',
              'flex items-center justify-center',
              'text-white transition-colors duration-150'
            )}
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}

        {currentIndex < images.length - 1 && (
          <button
            onClick={goToNext}
            className={cn(
              'absolute right-4 top-1/2 -translate-y-1/2',
              'w-12 h-12 rounded-full',
              'bg-black/30 hover:bg-black/50',
              'flex items-center justify-center',
              'text-white transition-colors duration-150'
            )}
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}
      </div>

      {/* Thumbnail strip */}
      <div className="h-20 bg-black/50 px-4 py-2 overflow-x-auto">
        <div className="flex gap-2 h-full">
          {images.map((img, index) => (
            <ThumbnailStrip
              key={img.id}
              image={img}
              isActive={index === currentIndex}
              onClick={() => setCurrentIndex(index)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

interface ThumbnailStripProps {
  image: Image
  isActive: boolean
  onClick: () => void
}

function ThumbnailStrip({ image, isActive, onClick }: ThumbnailStripProps) {
  const [src, setSrc] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true
    fetchImageWithAuth(`/api/images/${image.id}/thumbnail`)
      .then((blobUrl) => {
        if (isMounted) setSrc(blobUrl)
      })
      .catch(() => {})

    return () => {
      isMounted = false
      if (src) URL.revokeObjectURL(src)
    }
  }, [image.id])

  return (
    <button
      onClick={onClick}
      className={cn(
        'h-full aspect-square rounded overflow-hidden flex-shrink-0',
        'border-2 transition-all duration-150',
        isActive
          ? 'border-accent-primary'
          : 'border-transparent hover:border-white/30'
      )}
    >
      {src ? (
        <img
          src={src}
          alt={image.original_filename}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full bg-white/10" />
      )}
    </button>
  )
}
