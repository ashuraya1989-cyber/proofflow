import { useState, useCallback, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { Image } from '@/api/images'
import { fetchImageWithAuth } from '@/api/images'
import { Check, Loader2 } from 'lucide-react'

interface ImageGridProps {
  images: Image[]
  selectedIds: Set<string>
  onSelect: (id: string) => void
  onImageClick: (image: Image) => void
  isLoading?: boolean
}

export default function ImageGrid({
  images,
  selectedIds,
  onSelect,
  onImageClick,
  isLoading,
}: ImageGridProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-light-text-tertiary dark:text-dark-text-tertiary" />
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
      {images.map((image) => (
        <ImageGridItem
          key={image.id}
          image={image}
          isSelected={selectedIds.has(image.id)}
          onSelect={() => onSelect(image.id)}
          onClick={() => onImageClick(image)}
        />
      ))}
    </div>
  )
}

interface ImageGridItemProps {
  image: Image
  isSelected: boolean
  onSelect: () => void
  onClick: () => void
}

function ImageGridItem({ image, isSelected, onSelect, onClick }: ImageGridItemProps) {
  const [imageSrc, setImageSrc] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    let isMounted = true
    setIsLoading(true)
    setError(false)

    fetchImageWithAuth(`/api/images/${image.id}/thumbnail`)
      .then((blobUrl) => {
        if (isMounted) {
          setImageSrc(blobUrl)
          setIsLoading(false)
        }
      })
      .catch(() => {
        if (isMounted) {
          setError(true)
          setIsLoading(false)
        }
      })

    return () => {
      isMounted = false
      if (imageSrc) {
        URL.revokeObjectURL(imageSrc)
      }
    }
  }, [image.id])

  const handleCheckboxClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      onSelect()
    },
    [onSelect]
  )

  return (
    <div
      className={cn(
        'group relative aspect-square rounded-lg overflow-hidden cursor-pointer',
        'bg-light-bg-tertiary dark:bg-dark-bg-tertiary',
        'border-2 transition-all duration-150',
        isSelected
          ? 'border-accent-primary ring-2 ring-accent-primary/30'
          : 'border-transparent hover:border-light-border-secondary dark:hover:border-dark-border-secondary'
      )}
      onClick={onClick}
    >
      {/* Image */}
      {isLoading ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-light-text-tertiary dark:text-dark-text-tertiary" />
        </div>
      ) : error ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs text-light-text-tertiary dark:text-dark-text-tertiary">
            Error
          </span>
        </div>
      ) : (
        <img
          src={imageSrc || ''}
          alt={image.original_filename}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      )}

      {/* Selection checkbox */}
      <div
        onClick={handleCheckboxClick}
        className={cn(
          'absolute top-2 left-2 w-5 h-5 rounded-md',
          'flex items-center justify-center',
          'transition-all duration-150',
          isSelected
            ? 'bg-accent-primary text-white'
            : 'bg-black/30 text-white opacity-0 group-hover:opacity-100'
        )}
      >
        {isSelected && <Check className="w-3.5 h-3.5" />}
      </div>

      {/* Hover overlay */}
      <div
        className={cn(
          'absolute inset-0 bg-black/0 group-hover:bg-black/10',
          'transition-colors duration-150 pointer-events-none'
        )}
      />

      {/* Filename tooltip on hover */}
      <div
        className={cn(
          'absolute bottom-0 left-0 right-0 p-2',
          'bg-gradient-to-t from-black/60 to-transparent',
          'opacity-0 group-hover:opacity-100 transition-opacity duration-150'
        )}
      >
        <p className="text-xs text-white truncate">{image.original_filename}</p>
      </div>
    </div>
  )
}
