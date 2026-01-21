import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { useAlbumStore } from '@/stores/albumStore'
import { FolderOpen, Plus, Calendar, ImageIcon } from 'lucide-react'
import Button from '@/components/ui/Button'
import EmptyState from '@/components/ui/EmptyState'
import Spinner from '@/components/ui/Spinner'
import { formatDate } from '@/lib/utils'

export default function AlbumsPage() {
  const navigate = useNavigate()
  const { albums, isLoading, fetchAlbums } = useAlbumStore()

  useEffect(() => {
    fetchAlbums()
  }, [fetchAlbums])

  if (isLoading && albums.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-light-text-primary dark:text-dark-text-primary">
            Albums
          </h1>
          <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mt-1">
            Manage your photo albums
          </p>
        </div>
      </div>

      {/* Albums grid */}
      {albums.length === 0 ? (
        <EmptyState
          icon={<FolderOpen className="w-12 h-12" />}
          title="No albums yet"
          description="Create your first album to start organizing your photos"
          action={
            <Button
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={() => {
                // The sidebar has the create album modal
                // For now, we'll prompt users to use the sidebar
              }}
            >
              Create Album
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {albums.map((album) => (
            <button
              key={album.id}
              onClick={() => navigate(`/admin/albums/${album.id}`)}
              className={cn(
                'group text-left p-4 rounded-xl',
                'bg-light-bg-secondary dark:bg-dark-bg-secondary',
                'border border-light-border-primary dark:border-dark-border-primary',
                'hover:border-accent-primary dark:hover:border-accent-primary',
                'transition-all duration-150',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary'
              )}
            >
              {/* Cover image or placeholder */}
              <div
                className={cn(
                  'aspect-video rounded-lg overflow-hidden mb-3',
                  'bg-light-bg-tertiary dark:bg-dark-bg-tertiary',
                  'flex items-center justify-center'
                )}
              >
                {album.cover_image_url ? (
                  <img
                    src={album.cover_image_url}
                    alt={album.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <FolderOpen className="w-10 h-10 text-light-text-tertiary dark:text-dark-text-tertiary" />
                )}
              </div>

              {/* Album info */}
              <h3 className="font-medium text-light-text-primary dark:text-dark-text-primary truncate group-hover:text-accent-primary transition-colors">
                {album.name}
              </h3>

              <div className="flex items-center gap-4 mt-2 text-xs text-light-text-tertiary dark:text-dark-text-tertiary">
                <span className="flex items-center gap-1">
                  <ImageIcon className="w-3.5 h-3.5" />
                  {album.image_count} photos
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {formatDate(album.created_at)}
                </span>
              </div>

              {album.description && (
                <p className="mt-2 text-sm text-light-text-secondary dark:text-dark-text-secondary line-clamp-2">
                  {album.description}
                </p>
              )}

              {/* Subfolders count */}
              {album.subfolders && album.subfolders.length > 0 && (
                <p className="mt-2 text-xs text-light-text-tertiary dark:text-dark-text-tertiary">
                  {album.subfolders.length} subfolder{album.subfolders.length !== 1 ? 's' : ''}
                </p>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
