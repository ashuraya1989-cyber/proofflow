import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { clientApi, ClientShareInfo } from '@/api/shares'
import { Image } from '@/api/images'
import { Lock, ImageIcon, Loader2, X, ChevronLeft, ChevronRight, Download } from 'lucide-react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Spinner from '@/components/ui/Spinner'

type PageState = 'loading' | 'password' | 'gallery' | 'error'

export default function ClientGalleryPage() {
  const { token } = useParams<{ token: string }>()
  const [pageState, setPageState] = useState<PageState>('loading')
  const [shareInfo, setShareInfo] = useState<ClientShareInfo | null>(null)
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Password form state
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [passwordError, setPasswordError] = useState<string | null>(null)

  // Gallery state
  const [images, setImages] = useState<Image[]>([])
  const [isLoadingImages, setIsLoadingImages] = useState(false)
  const [viewerIndex, setViewerIndex] = useState<number | null>(null)

  // Fetch share info on mount
  useEffect(() => {
    if (!token) {
      setErrorMessage('Invalid share link')
      setPageState('error')
      return
    }

    async function fetchShareInfo() {
      try {
        const info = await clientApi.getShareInfo(token!)
        setShareInfo(info)
        setPageState('password')
      } catch (err) {
        setErrorMessage(
          err instanceof Error
            ? err.message
            : 'This gallery link is invalid or has expired'
        )
        setPageState('error')
      }
    }

    fetchShareInfo()
  }, [token])

  // Handle password submission
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token || !password) return

    setIsSubmitting(true)
    setPasswordError(null)

    try {
      const response = await clientApi.accessShare(token, password)
      
      if (response.valid && response.access_token) {
        setAccessToken(response.access_token)
        setPageState('gallery')
      } else {
        setPasswordError(response.error || 'Invalid password')
      }
    } catch (err) {
      setPasswordError(
        err instanceof Error ? err.message : 'Failed to verify password'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  // Fetch images when accessing gallery
  useEffect(() => {
    if (pageState !== 'gallery' || !token || !accessToken) return

    async function fetchImages() {
      setIsLoadingImages(true)
      try {
        const fetchedImages = await clientApi.getGalleryImages(
          token!,
          accessToken!,
          0,
          200
        )
        setImages(fetchedImages as Image[])
      } catch (err) {
        console.error('Failed to load images:', err)
      } finally {
        setIsLoadingImages(false)
      }
    }

    fetchImages()
  }, [pageState, token, accessToken])

  // Loading state
  if (pageState === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-bg-primary">
        <Spinner size="lg" className="text-white" />
      </div>
    )
  }

  // Error state
  if (pageState === 'error') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-dark-bg-primary px-4">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-dark-bg-tertiary flex items-center justify-center mx-auto mb-4">
            <X className="w-8 h-8 text-accent-error" />
          </div>
          <h1 className="text-xl font-semibold text-white mb-2">
            Gallery Not Available
          </h1>
          <p className="text-dark-text-secondary max-w-sm">
            {errorMessage}
          </p>
        </div>
      </div>
    )
  }

  // Password entry state
  if (pageState === 'password') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-dark-bg-primary px-4">
        <div
          className={cn(
            'w-full max-w-sm',
            'bg-dark-bg-elevated',
            'border border-dark-border-primary',
            'rounded-2xl shadow-dark-elevated',
            'p-8'
          )}
        >
          {/* Header */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-14 h-14 rounded-full bg-dark-bg-tertiary flex items-center justify-center mb-4">
              <Lock className="w-6 h-6 text-dark-text-secondary" />
            </div>
            <h1 className="text-xl font-semibold text-white">
              {shareInfo?.album_name || 'Gallery'}
            </h1>
            {shareInfo?.custom_message && (
              <p className="text-sm text-dark-text-secondary mt-2 text-center">
                {shareInfo.custom_message}
              </p>
            )}
            <p className="text-xs text-dark-text-tertiary mt-2">
              {shareInfo?.image_count || 0} photos
            </p>
          </div>

          {/* Password form */}
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <Input
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={passwordError || undefined}
              autoFocus
              className="bg-dark-bg-secondary border-dark-border-primary text-white placeholder:text-dark-text-tertiary"
            />
            <Button
              type="submit"
              isLoading={isSubmitting}
              className="w-full"
              size="lg"
            >
              View Gallery
            </Button>
          </form>
        </div>
      </div>
    )
  }

  // Gallery view state
  return (
    <div className="min-h-screen bg-dark-bg-primary">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-dark-bg-primary/80 backdrop-blur-md border-b border-dark-border-subtle">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-white">
              {shareInfo?.album_name || 'Gallery'}
            </h1>
            <p className="text-sm text-dark-text-secondary">
              {images.length} photos
            </p>
          </div>
        </div>
      </header>

      {/* Custom message */}
      {shareInfo?.custom_message && (
        <div className="max-w-7xl mx-auto px-4 py-4">
          <p className="text-dark-text-secondary text-center italic">
            "{shareInfo.custom_message}"
          </p>
        </div>
      )}

      {/* Gallery Grid */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {isLoadingImages ? (
          <div className="flex items-center justify-center py-16">
            <Spinner size="lg" className="text-white" />
          </div>
        ) : images.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <ImageIcon className="w-12 h-12 text-dark-text-tertiary mb-4" />
            <p className="text-dark-text-secondary">No images in this gallery</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
            {images.map((image, index) => (
              <ClientGalleryImage
                key={image.id}
                image={image}
                accessToken={accessToken!}
                onClick={() => setViewerIndex(index)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Image Viewer */}
      {viewerIndex !== null && (
        <ClientImageViewer
          images={images}
          currentIndex={viewerIndex}
          accessToken={accessToken!}
          onClose={() => setViewerIndex(null)}
          onNavigate={setViewerIndex}
        />
      )}
    </div>
  )
}

interface ClientGalleryImageProps {
  image: Image
  accessToken: string
  onClick: () => void
}

function ClientGalleryImage({ image, accessToken, onClick }: ClientGalleryImageProps) {
  const [src, setSrc] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    async function fetchImage() {
      try {
        const response = await fetch(`/api/images/${image.id}/thumbnail`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        })

        if (!response.ok) throw new Error('Failed to load')

        const blob = await response.blob()
        const url = URL.createObjectURL(blob)

        if (isMounted) {
          setSrc(url)
          setIsLoading(false)
        }
      } catch {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    fetchImage()

    return () => {
      isMounted = false
      if (src) URL.revokeObjectURL(src)
    }
  }, [image.id, accessToken])

  return (
    <button
      onClick={onClick}
      className={cn(
        'relative aspect-square rounded-lg overflow-hidden',
        'bg-dark-bg-tertiary',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary'
      )}
    >
      {isLoading ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-dark-text-tertiary" />
        </div>
      ) : src ? (
        <img
          src={src}
          alt={image.original_filename}
          className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <ImageIcon className="w-6 h-6 text-dark-text-tertiary" />
        </div>
      )}
    </button>
  )
}

interface ClientImageViewerProps {
  images: Image[]
  currentIndex: number
  accessToken: string
  onClose: () => void
  onNavigate: (index: number) => void
}

function ClientImageViewer({
  images,
  currentIndex,
  accessToken,
  onClose,
  onNavigate,
}: ClientImageViewerProps) {
  const [src, setSrc] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const image = images[currentIndex]

  useEffect(() => {
    let isMounted = true
    setSrc(null)
    setIsLoading(true)

    async function fetchImage() {
      try {
        // Load ORIGINAL resolution for client viewing (no pixelation)
        const response = await fetch(`/api/images/${image.id}/original`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        })

        if (!response.ok) throw new Error('Failed to load')

        const blob = await response.blob()
        const url = URL.createObjectURL(blob)

        if (isMounted) {
          setSrc(url)
          setIsLoading(false)
        }
      } catch {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    fetchImage()

    return () => {
      isMounted = false
      if (src) URL.revokeObjectURL(src)
    }
  }, [image.id, accessToken])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft' && currentIndex > 0) {
        onNavigate(currentIndex - 1)
      }
      if (e.key === 'ArrowRight' && currentIndex < images.length - 1) {
        onNavigate(currentIndex + 1)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [currentIndex, images.length, onClose, onNavigate])

  const handleDownload = () => {
    if (!src) return
    const link = document.createElement('a')
    link.href = src
    link.download = image.original_filename
    link.click()
  }

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-black/50">
        <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10">
          <X className="w-6 h-6 text-white" />
        </button>

        <span className="text-white/60 text-sm">
          {currentIndex + 1} / {images.length}
        </span>

        <button onClick={handleDownload} className="p-2 rounded-lg hover:bg-white/10">
          <Download className="w-6 h-6 text-white" />
        </button>
      </div>

      {/* Image */}
      <div className="flex-1 flex items-center justify-center relative">
        {isLoading ? (
          <Loader2 className="w-10 h-10 animate-spin text-white/50" />
        ) : src ? (
          <img
            src={src}
            alt={image.original_filename}
            className="max-w-full max-h-full object-contain"
          />
        ) : (
          <p className="text-white/50">Failed to load image</p>
        )}

        {/* Navigation */}
        {currentIndex > 0 && (
          <button
            onClick={() => onNavigate(currentIndex - 1)}
            className={cn(
              'absolute left-4 top-1/2 -translate-y-1/2',
              'w-12 h-12 rounded-full bg-black/30 hover:bg-black/50',
              'flex items-center justify-center text-white'
            )}
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}

        {currentIndex < images.length - 1 && (
          <button
            onClick={() => onNavigate(currentIndex + 1)}
            className={cn(
              'absolute right-4 top-1/2 -translate-y-1/2',
              'w-12 h-12 rounded-full bg-black/30 hover:bg-black/50',
              'flex items-center justify-center text-white'
            )}
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}
      </div>

      {/* Filename */}
      <div className="px-4 py-3 bg-black/50 text-center">
        <p className="text-white/80 text-sm truncate">{image.original_filename}</p>
      </div>
    </div>
  )
}
