import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { useAlbumStore } from '@/stores/albumStore'
import { useImageStore } from '@/stores/imageStore'
import { useToast } from '@/components/ui/Toast'
import { Image } from '@/api/images'
import {
  ChevronLeft,
  Upload,
  Share2,
  Trash2,
  MoreHorizontal,
  FolderOpen,
  Edit,
  ImageIcon,
} from 'lucide-react'
import Button from '@/components/ui/Button'
import Dropdown from '@/components/ui/Dropdown'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import EmptyState from '@/components/ui/EmptyState'
import Spinner from '@/components/ui/Spinner'
import ImageGrid from '@/components/admin/ImageGrid'
import ImageViewer from '@/components/admin/ImageViewer'
import ImageUpload from '@/components/admin/ImageUpload'
import ShareModal from '@/components/admin/ShareModal'

export default function AlbumDetailPage() {
  const { albumId } = useParams<{ albumId: string }>()
  const navigate = useNavigate()
  const { success, error } = useToast()

  const { currentAlbum, fetchAlbum, updateAlbum, deleteAlbum } = useAlbumStore()
  const {
    images,
    selectedImages,
    isLoading: imagesLoading,
    fetchImages,
    deleteImage,
    deleteImages,
    setCoverImage,
    toggleImageSelection,
    selectAllImages,
    clearSelection,
    clearImages,
  } = useImageStore()

  const [showUploadModal, setShowUploadModal] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [viewerImage, setViewerImage] = useState<Image | null>(null)
  const [includeSubfolders, setIncludeSubfolders] = useState(false)

  const [editName, setEditName] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [isEditing, setIsEditing] = useState(false)

  useEffect(() => {
    if (albumId) {
      fetchAlbum(albumId)
      clearSelection()
    }
    return () => {
      clearImages()
    }
  }, [albumId, fetchAlbum, clearSelection, clearImages])

  useEffect(() => {
    if (albumId) {
      fetchImages(albumId, includeSubfolders)
    }
  }, [albumId, includeSubfolders, fetchImages])

  useEffect(() => {
    if (currentAlbum) {
      setEditName(currentAlbum.name)
      setEditDescription(currentAlbum.description || '')
    }
  }, [currentAlbum])

  const handleDeleteSelected = async () => {
    const count = selectedImages.size
    if (count === 0) return

    const confirmed = window.confirm(
      `Delete ${count} selected image${count !== 1 ? 's' : ''}?`
    )
    if (!confirmed) return

    const result = await deleteImages(Array.from(selectedImages))
    if (result) {
      success(`Deleted ${count} image${count !== 1 ? 's' : ''}`)
      clearSelection()
    } else {
      error('Failed to delete some images')
    }
  }

  const handleViewerDelete = async (imageId: string) => {
    const confirmed = window.confirm('Delete this image?')
    if (!confirmed) return

    const result = await deleteImage(imageId)
    if (result) {
      success('Image deleted')
      setViewerImage(null)
    } else {
      error('Failed to delete image')
    }
  }

  const handleSetCover = async (imageId: string) => {
    const result = await setCoverImage(imageId)
    if (result) {
      success('Cover image updated')
      if (albumId) {
        fetchAlbum(albumId)
      }
    } else {
      error('Failed to set cover image')
    }
  }

  const handleEditSubmit = async () => {
    if (!albumId || !editName.trim()) return

    setIsEditing(true)
    const result = await updateAlbum(albumId, {
      name: editName.trim(),
      description: editDescription.trim() || undefined,
    })

    if (result) {
      success('Album updated')
      setShowEditModal(false)
    } else {
      error('Failed to update album')
    }
    setIsEditing(false)
  }

  const handleDeleteAlbum = async () => {
    if (!albumId) return

    const result = await deleteAlbum(albumId)
    if (result) {
      success('Album deleted')
      navigate('/admin/albums')
    } else {
      error('Failed to delete album')
    }
  }

  if (!currentAlbum) {
    return (
      <div className="flex items-center justify-center h-full">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div
        className={cn(
          'flex items-center justify-between gap-4 px-6 py-4',
          'border-b border-light-border-subtle dark:border-dark-border-subtle'
        )}
      >
        <div className="flex items-center gap-3 min-w-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/admin/albums')}
            className="p-2"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>

          <div className="min-w-0">
            <h1 className="text-xl font-semibold text-light-text-primary dark:text-dark-text-primary truncate">
              {currentAlbum.name}
            </h1>
            <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
              {currentAlbum.image_count} photos
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {selectedImages.size > 0 ? (
            <>
              <span className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
                {selectedImages.size} selected
              </span>
              <Button variant="ghost" size="sm" onClick={clearSelection}>
                Clear
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleDeleteSelected}
                leftIcon={<Trash2 className="w-4 h-4" />}
              >
                Delete
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowUploadModal(true)}
                leftIcon={<Upload className="w-4 h-4" />}
              >
                Upload
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowShareModal(true)}
                leftIcon={<Share2 className="w-4 h-4" />}
              >
                Share
              </Button>
              <Dropdown
                trigger={
                  <Button variant="ghost" size="sm" className="p-2">
                    <MoreHorizontal className="w-5 h-5" />
                  </Button>
                }
              >
                <Dropdown.Item onClick={() => setShowEditModal(true)}>
                  <Edit className="w-4 h-4" />
                  Edit Album
                </Dropdown.Item>
                <Dropdown.Item onClick={selectAllImages}>
                  Select All
                </Dropdown.Item>
                <Dropdown.Separator />
                <Dropdown.Item
                  variant="danger"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Album
                </Dropdown.Item>
              </Dropdown>
            </>
          )}
        </div>
      </div>

      {/* Subfolders toggle */}
      {currentAlbum.subfolders && currentAlbum.subfolders.length > 0 && (
        <div className="px-6 py-3 border-b border-light-border-subtle dark:border-dark-border-subtle">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIncludeSubfolders(!includeSubfolders)}
              className={cn(
                'flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm',
                'transition-colors duration-150',
                includeSubfolders
                  ? 'bg-accent-muted text-accent-primary'
                  : 'bg-light-bg-tertiary dark:bg-dark-bg-tertiary text-light-text-secondary dark:text-dark-text-secondary'
              )}
            >
              <FolderOpen className="w-4 h-4" />
              Show all ({currentAlbum.subfolders.length} subfolders)
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {imagesLoading && images.length === 0 ? (
          <div className="flex items-center justify-center py-16">
            <Spinner size="lg" />
          </div>
        ) : images.length === 0 ? (
          <EmptyState
            icon={<ImageIcon className="w-12 h-12" />}
            title="No images yet"
            description="Upload images to this album"
            action={
              <Button
                leftIcon={<Upload className="w-4 h-4" />}
                onClick={() => setShowUploadModal(true)}
              >
                Upload Images
              </Button>
            }
          />
        ) : (
          <ImageGrid
            images={images}
            selectedIds={selectedImages}
            onSelect={toggleImageSelection}
            onImageClick={setViewerImage}
            isLoading={imagesLoading}
          />
        )}
      </div>

      {/* Image Viewer */}
      {viewerImage && (
        <ImageViewer
          image={viewerImage}
          images={images}
          onClose={() => setViewerImage(null)}
          onDelete={handleViewerDelete}
          onSetCover={handleSetCover}
        />
      )}

      {/* Upload Modal */}
      <Modal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        title="Upload Images"
        size="lg"
      >
        <ImageUpload
          albumId={albumId!}
          onComplete={() => {
            if (albumId) {
              fetchImages(albumId, includeSubfolders)
              fetchAlbum(albumId)
            }
          }}
        />
      </Modal>

      {/* Share Modal */}
      {showShareModal && (
        <ShareModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          albumId={albumId!}
          albumName={currentAlbum.name}
        />
      )}

      {/* Edit Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Album"
      >
        <div className="space-y-4">
          <Input
            label="Name"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
          />
          <Input
            label="Description"
            value={editDescription}
            onChange={(e) => setEditDescription(e.target.value)}
          />
        </div>
        <Modal.Footer>
          <Button variant="ghost" onClick={() => setShowEditModal(false)}>
            Cancel
          </Button>
          <Button onClick={handleEditSubmit} isLoading={isEditing}>
            Save
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Delete Confirmation */}
      <Modal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title="Delete Album"
        description="Are you sure you want to delete this album? This will permanently delete all images and subfolders. This action cannot be undone."
      >
        <Modal.Footer>
          <Button variant="ghost" onClick={() => setShowDeleteConfirm(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDeleteAlbum}>
            Delete Album
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  )
}
