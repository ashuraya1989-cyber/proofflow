import { useState } from 'react'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { useAlbumStore } from '@/stores/albumStore'
import { useToast } from '@/components/ui/Toast'

interface CreateAlbumModalProps {
  isOpen: boolean
  onClose: () => void
  parentId?: string
}

export default function CreateAlbumModal({
  isOpen,
  onClose,
  parentId,
}: CreateAlbumModalProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { createAlbum } = useAlbumStore()
  const { success, error } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!name.trim()) {
      error('Album name is required')
      return
    }

    setIsLoading(true)
    try {
      const album = await createAlbum(name.trim(), description.trim() || undefined, parentId)
      if (album) {
        success('Album created successfully')
        setName('')
        setDescription('')
        onClose()
      } else {
        error('Failed to create album')
      }
    } catch {
      error('Failed to create album')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={parentId ? 'Create Subfolder' : 'Create Album'}
      description={parentId ? 'Create a new subfolder within this album' : 'Create a new album to organize your photos'}
    >
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          <Input
            label="Name"
            placeholder="Enter album name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
          <Input
            label="Description (optional)"
            placeholder="Enter a description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <Modal.Footer>
          <Button variant="ghost" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button type="submit" isLoading={isLoading}>
            Create
          </Button>
        </Modal.Footer>
      </form>
    </Modal>
  )
}
