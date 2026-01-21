import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { useShareStore } from '@/stores/shareStore'
import { useToast } from '@/components/ui/Toast'
import { Share } from '@/api/shares'
import {
  Link2,
  Copy,
  Trash2,
  ExternalLink,
  Eye,
  Calendar,
  XCircle,
  Check,
} from 'lucide-react'
import Button from '@/components/ui/Button'
import EmptyState from '@/components/ui/EmptyState'
import Spinner from '@/components/ui/Spinner'
import Modal from '@/components/ui/Modal'
import { formatDate, formatDateTime, copyToClipboard } from '@/lib/utils'

export default function SharesPage() {
  const { shares, isLoading, fetchShares, deactivateShare, deleteShare } =
    useShareStore()
  const { success, error } = useToast()
  const [deleteConfirm, setDeleteConfirm] = useState<Share | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  useEffect(() => {
    fetchShares()
  }, [fetchShares])

  const handleCopyLink = async (share: Share) => {
    const copied = await copyToClipboard(share.share_url)
    if (copied) {
      setCopiedId(share.id)
      success('Link copied to clipboard')
      setTimeout(() => setCopiedId(null), 2000)
    } else {
      error('Failed to copy link')
    }
  }

  const handleDeactivate = async (share: Share) => {
    const result = await deactivateShare(share.id)
    if (result) {
      success('Share link deactivated')
    } else {
      error('Failed to deactivate share')
    }
  }

  const handleDelete = async () => {
    if (!deleteConfirm) return

    const result = await deleteShare(deleteConfirm.id)
    if (result) {
      success('Share link deleted')
    } else {
      error('Failed to delete share')
    }
    setDeleteConfirm(null)
  }

  if (isLoading && shares.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-light-text-primary dark:text-dark-text-primary">
          Shared Links
        </h1>
        <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mt-1">
          Manage your client gallery links
        </p>
      </div>

      {/* Shares list */}
      {shares.length === 0 ? (
        <EmptyState
          icon={<Link2 className="w-12 h-12" />}
          title="No shared links yet"
          description="Create share links from album pages to share galleries with clients"
        />
      ) : (
        <div className="space-y-3">
          {shares.map((share) => (
            <ShareCard
              key={share.id}
              share={share}
              isCopied={copiedId === share.id}
              onCopy={() => handleCopyLink(share)}
              onDeactivate={() => handleDeactivate(share)}
              onDelete={() => setDeleteConfirm(share)}
            />
          ))}
        </div>
      )}

      {/* Delete confirmation */}
      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Delete Share Link"
        description="Are you sure you want to delete this share link? Clients will no longer be able to access the gallery."
      >
        <Modal.Footer>
          <Button variant="ghost" onClick={() => setDeleteConfirm(null)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDelete}>
            Delete
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  )
}

interface ShareCardProps {
  share: Share
  isCopied: boolean
  onCopy: () => void
  onDeactivate: () => void
  onDelete: () => void
}

function ShareCard({
  share,
  isCopied,
  onCopy,
  onDeactivate,
  onDelete,
}: ShareCardProps) {
  const isExpired =
    share.expires_at && new Date(share.expires_at) < new Date()
  const isInactive = !share.is_active || isExpired

  return (
    <div
      className={cn(
        'p-4 rounded-xl',
        'bg-light-bg-secondary dark:bg-dark-bg-secondary',
        'border border-light-border-primary dark:border-dark-border-primary',
        isInactive && 'opacity-60'
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          {/* Album name */}
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-medium text-light-text-primary dark:text-dark-text-primary">
              {share.album_name}
            </h3>
            {isInactive && (
              <span
                className={cn(
                  'px-2 py-0.5 rounded-full text-xs font-medium',
                  'bg-light-bg-tertiary dark:bg-dark-bg-tertiary',
                  'text-light-text-tertiary dark:text-dark-text-tertiary'
                )}
              >
                {isExpired ? 'Expired' : 'Inactive'}
              </span>
            )}
          </div>

          {/* Share URL */}
          <div className="flex items-center gap-2 mb-3">
            <code
              className={cn(
                'flex-1 px-2 py-1 rounded text-xs',
                'bg-light-bg-tertiary dark:bg-dark-bg-tertiary',
                'text-light-text-secondary dark:text-dark-text-secondary',
                'truncate'
              )}
            >
              {share.share_url}
            </code>
            <Button
              variant="ghost"
              size="sm"
              onClick={onCopy}
              className="flex-shrink-0 p-2"
            >
              {isCopied ? (
                <Check className="w-4 h-4 text-accent-success" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </Button>
            <a
              href={share.share_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-shrink-0"
            >
              <Button variant="ghost" size="sm" className="p-2">
                <ExternalLink className="w-4 h-4" />
              </Button>
            </a>
          </div>

          {/* Meta info */}
          <div className="flex flex-wrap items-center gap-4 text-xs text-light-text-tertiary dark:text-dark-text-tertiary">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              Created {formatDate(share.created_at)}
            </span>
            {share.expires_at && (
              <span className="flex items-center gap-1">
                <XCircle className="w-3.5 h-3.5" />
                Expires {formatDate(share.expires_at)}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Eye className="w-3.5 h-3.5" />
              {share.view_count} views
            </span>
            {share.last_accessed_at && (
              <span>Last accessed {formatDateTime(share.last_accessed_at)}</span>
            )}
          </div>

          {/* Custom message */}
          {share.custom_message && (
            <p className="mt-2 text-sm text-light-text-secondary dark:text-dark-text-secondary italic">
              "{share.custom_message}"
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          {share.is_active && !isExpired && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onDeactivate}
              className="p-2"
              title="Deactivate"
            >
              <XCircle className="w-4 h-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={onDelete}
            className="p-2 text-accent-error hover:bg-accent-error/10"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
