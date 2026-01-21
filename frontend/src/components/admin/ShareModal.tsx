import { useState } from 'react'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { useShareStore } from '@/stores/shareStore'
import { useToast } from '@/components/ui/Toast'
import { Copy, Check, Link2, Eye, EyeOff } from 'lucide-react'
import { cn } from '@/lib/utils'
import { copyToClipboard } from '@/lib/utils'

interface ShareModalProps {
  isOpen: boolean
  onClose: () => void
  albumId: string
  albumName: string
}

export default function ShareModal({
  isOpen,
  onClose,
  albumId,
  albumName,
}: ShareModalProps) {
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [includeSubfolders, setIncludeSubfolders] = useState(true)
  const [expiresInDays, setExpiresInDays] = useState<string>('')
  const [customMessage, setCustomMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const { createShare } = useShareStore()
  const { success, error } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!password || password.length < 4) {
      error('Password must be at least 4 characters')
      return
    }

    setIsLoading(true)
    try {
      const share = await createShare({
        album_id: albumId,
        password,
        include_subfolders: includeSubfolders,
        expires_in_days: expiresInDays ? parseInt(expiresInDays) : undefined,
        custom_message: customMessage || undefined,
      })

      if (share) {
        setGeneratedUrl(share.share_url)
        success('Share link created successfully')
      } else {
        error('Failed to create share link')
      }
    } catch {
      error('Failed to create share link')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCopyUrl = async () => {
    if (generatedUrl) {
      const copied = await copyToClipboard(generatedUrl)
      if (copied) {
        setCopied(true)
        success('Link copied to clipboard')
        setTimeout(() => setCopied(false), 2000)
      }
    }
  }

  const handleClose = () => {
    setPassword('')
    setShowPassword(false)
    setIncludeSubfolders(true)
    setExpiresInDays('')
    setCustomMessage('')
    setGeneratedUrl(null)
    setCopied(false)
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Send to Client"
      description={`Create a password-protected link for "${albumName}"`}
      size="md"
    >
      {!generatedUrl ? (
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            {/* Password input */}
            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter a password for the client"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              hint="The client will need this password to access the gallery"
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="p-1"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              }
            />

            {/* Include subfolders toggle */}
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium text-light-text-primary dark:text-dark-text-primary">
                  Include subfolders
                </p>
                <p className="text-xs text-light-text-tertiary dark:text-dark-text-tertiary">
                  Share images from all subfolders
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIncludeSubfolders(!includeSubfolders)}
                className={cn(
                  'w-11 h-6 rounded-full transition-colors duration-200',
                  'relative',
                  includeSubfolders ? 'bg-accent-primary' : 'bg-light-border-secondary dark:bg-dark-border-secondary'
                )}
              >
                <span
                  className={cn(
                    'absolute top-1 w-4 h-4 rounded-full bg-white transition-transform duration-200',
                    includeSubfolders ? 'translate-x-6' : 'translate-x-1'
                  )}
                />
              </button>
            </div>

            {/* Expiration */}
            <Input
              label="Expires in (days)"
              type="number"
              placeholder="Leave empty for no expiration"
              value={expiresInDays}
              onChange={(e) => setExpiresInDays(e.target.value)}
              min={1}
              max={365}
            />

            {/* Custom message */}
            <div>
              <label className="text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary">
                Custom message (optional)
              </label>
              <textarea
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                placeholder="Add a personal message for the client"
                className={cn(
                  'mt-1.5 w-full h-20 px-3 py-2 rounded-lg resize-none',
                  'bg-light-bg-secondary dark:bg-dark-bg-secondary',
                  'border border-light-border-primary dark:border-dark-border-primary',
                  'text-light-text-primary dark:text-dark-text-primary',
                  'placeholder:text-light-text-tertiary dark:placeholder:text-dark-text-tertiary',
                  'focus:outline-none focus:ring-2 focus:ring-accent-primary focus:border-transparent'
                )}
                maxLength={500}
              />
            </div>
          </div>

          <Modal.Footer>
            <Button variant="ghost" onClick={handleClose} type="button">
              Cancel
            </Button>
            <Button type="submit" isLoading={isLoading} leftIcon={<Link2 className="w-4 h-4" />}>
              Create Link
            </Button>
          </Modal.Footer>
        </form>
      ) : (
        <div className="space-y-4">
          <div
            className={cn(
              'p-4 rounded-lg',
              'bg-accent-success/10 border border-accent-success/20'
            )}
          >
            <p className="text-sm font-medium text-accent-success mb-2">
              Share link created!
            </p>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={generatedUrl}
                readOnly
                className={cn(
                  'flex-1 px-3 py-2 rounded-lg text-sm',
                  'bg-white dark:bg-dark-bg-secondary',
                  'border border-light-border-primary dark:border-dark-border-primary',
                  'text-light-text-primary dark:text-dark-text-primary'
                )}
              />
              <Button
                variant="secondary"
                size="sm"
                onClick={handleCopyUrl}
                leftIcon={copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              >
                {copied ? 'Copied' : 'Copy'}
              </Button>
            </div>
          </div>

          <div className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
            <p>
              <strong>Password:</strong> {password}
            </p>
            <p className="text-xs mt-1 text-light-text-tertiary dark:text-dark-text-tertiary">
              Share this password with your client separately
            </p>
          </div>

          <Modal.Footer>
            <Button onClick={handleClose}>Done</Button>
          </Modal.Footer>
        </div>
      )}
    </Modal>
  )
}
