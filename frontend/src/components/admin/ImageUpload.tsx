import { useCallback, useState } from 'react'
import { cn } from '@/lib/utils'
import { Upload, X, Check, AlertCircle, File } from 'lucide-react'
import { useImageStore } from '@/stores/imageStore'
import { isAllowedImageType, formatFileSize } from '@/lib/utils'
import Button from '@/components/ui/Button'
import ProgressBar from '@/components/ui/ProgressBar'

interface ImageUploadProps {
  albumId: string
  onComplete?: () => void
}

export default function ImageUpload({ albumId, onComplete }: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const { uploadImages, uploadProgress } = useImageStore()
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [isUploading, setIsUploading] = useState(false)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const files = Array.from(e.dataTransfer.files).filter(isAllowedImageType)
    if (files.length > 0) {
      setSelectedFiles((prev) => [...prev, ...files])
    }
  }, [])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files).filter(isAllowedImageType)
      setSelectedFiles((prev) => [...prev, ...files])
    }
    // Reset input
    e.target.value = ''
  }, [])

  const removeFile = useCallback((index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index))
  }, [])

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return

    setIsUploading(true)
    await uploadImages(albumId, selectedFiles)
    setIsUploading(false)
    setSelectedFiles([])
    onComplete?.()
  }

  const hasProgress = uploadProgress.size > 0

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          'border-2 border-dashed rounded-xl p-8',
          'transition-all duration-200',
          'flex flex-col items-center justify-center gap-4',
          isDragging
            ? 'border-accent-primary bg-accent-muted'
            : 'border-light-border-secondary dark:border-dark-border-secondary',
          'hover:border-accent-primary hover:bg-accent-muted/50'
        )}
      >
        <div
          className={cn(
            'w-14 h-14 rounded-full flex items-center justify-center',
            'bg-light-bg-tertiary dark:bg-dark-bg-tertiary'
          )}
        >
          <Upload className="w-6 h-6 text-light-text-secondary dark:text-dark-text-secondary" />
        </div>

        <div className="text-center">
          <p className="text-sm font-medium text-light-text-primary dark:text-dark-text-primary">
            Drag and drop images here
          </p>
          <p className="text-xs text-light-text-tertiary dark:text-dark-text-tertiary mt-1">
            or click to browse
          </p>
        </div>

        <input
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          multiple
          onChange={handleFileSelect}
          className="absolute inset-0 opacity-0 cursor-pointer"
          style={{ position: 'relative' }}
        />

        <label className="cursor-pointer">
          <input
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />
          <Button variant="secondary" size="sm" className="pointer-events-none">
            Select Files
          </Button>
        </label>

        <p className="text-xs text-light-text-tertiary dark:text-dark-text-tertiary">
          Supports: JPG, PNG, GIF, WebP (max 50MB each)
        </p>
      </div>

      {/* Selected files list */}
      {selectedFiles.length > 0 && !hasProgress && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-light-text-primary dark:text-dark-text-primary">
              {selectedFiles.length} file{selectedFiles.length !== 1 ? 's' : ''} selected
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedFiles([])}
            >
              Clear all
            </Button>
          </div>

          <div className="max-h-48 overflow-y-auto space-y-1">
            {selectedFiles.map((file, index) => (
              <div
                key={`${file.name}-${index}`}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg',
                  'bg-light-bg-secondary dark:bg-dark-bg-secondary'
                )}
              >
                <File className="w-4 h-4 text-light-text-tertiary dark:text-dark-text-tertiary flex-shrink-0" />
                <span className="flex-1 text-sm text-light-text-primary dark:text-dark-text-primary truncate">
                  {file.name}
                </span>
                <span className="text-xs text-light-text-tertiary dark:text-dark-text-tertiary">
                  {formatFileSize(file.size)}
                </span>
                <button
                  onClick={() => removeFile(index)}
                  className="p-1 rounded hover:bg-light-bg-hover dark:hover:bg-dark-bg-hover"
                >
                  <X className="w-4 h-4 text-light-text-tertiary dark:text-dark-text-tertiary" />
                </button>
              </div>
            ))}
          </div>

          <Button onClick={handleUpload} isLoading={isUploading} className="w-full">
            Upload {selectedFiles.length} file{selectedFiles.length !== 1 ? 's' : ''}
          </Button>
        </div>
      )}

      {/* Upload progress */}
      {hasProgress && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-light-text-primary dark:text-dark-text-primary">
            Uploading...
          </p>

          <div className="max-h-48 overflow-y-auto space-y-2">
            {Array.from(uploadProgress.entries()).map(([key, progress]) => (
              <div
                key={key}
                className={cn(
                  'px-3 py-2 rounded-lg',
                  'bg-light-bg-secondary dark:bg-dark-bg-secondary'
                )}
              >
                <div className="flex items-center gap-2 mb-1">
                  {progress.status === 'complete' && (
                    <Check className="w-4 h-4 text-accent-success" />
                  )}
                  {progress.status === 'error' && (
                    <AlertCircle className="w-4 h-4 text-accent-error" />
                  )}
                  {(progress.status === 'pending' || progress.status === 'uploading') && (
                    <div className="w-4 h-4" />
                  )}
                  <span className="flex-1 text-sm text-light-text-primary dark:text-dark-text-primary truncate">
                    {progress.filename}
                  </span>
                  {progress.status === 'complete' && (
                    <span className="text-xs text-accent-success">Done</span>
                  )}
                  {progress.status === 'error' && (
                    <span className="text-xs text-accent-error">Failed</span>
                  )}
                </div>

                {progress.status === 'uploading' && (
                  <ProgressBar value={progress.progress} size="sm" />
                )}

                {progress.error && (
                  <p className="text-xs text-accent-error mt-1">{progress.error}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
