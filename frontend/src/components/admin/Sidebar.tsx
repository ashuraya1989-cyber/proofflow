import { Link, useLocation, useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { useAlbumStore } from '@/stores/albumStore'
import { useEffect, useState } from 'react'
import {
  FolderOpen,
  Share2,
  ChevronRight,
  ChevronDown,
  Plus,
  ImageIcon,
} from 'lucide-react'
import { AlbumTree } from '@/api/albums'
import Button from '@/components/ui/Button'
import CreateAlbumModal from './CreateAlbumModal'

export default function Sidebar() {
  const location = useLocation()
  const { albumTree, fetchAlbumTree } = useAlbumStore()
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createParentId, setCreateParentId] = useState<string | undefined>()

  useEffect(() => {
    fetchAlbumTree()
  }, [fetchAlbumTree])

  const toggleExpanded = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const handleCreateAlbum = (parentId?: string) => {
    setCreateParentId(parentId)
    setShowCreateModal(true)
  }

  return (
    <>
      <aside
        className={cn(
          'w-64 h-full flex flex-col',
          'bg-light-bg-secondary dark:bg-dark-bg-secondary',
          'border-r border-light-border-primary dark:border-dark-border-primary'
        )}
      >
        {/* Logo / Brand */}
        <div className="h-14 flex items-center px-4 border-b border-light-border-subtle dark:border-dark-border-subtle">
          <Link to="/admin" className="flex items-center gap-2">
            <ImageIcon className="w-6 h-6 text-accent-primary" />
            <span className="font-semibold text-light-text-primary dark:text-dark-text-primary">
              Gallery
            </span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          {/* Albums Section */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2 px-2">
              <span className="text-xs font-medium text-light-text-tertiary dark:text-dark-text-tertiary uppercase tracking-wider">
                Albums
              </span>
              <button
                onClick={() => handleCreateAlbum()}
                className="p-1 rounded hover:bg-light-bg-hover dark:hover:bg-dark-bg-hover text-light-text-secondary dark:text-dark-text-secondary"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {albumTree.length === 0 ? (
              <p className="text-sm text-light-text-tertiary dark:text-dark-text-tertiary px-2 py-2">
                No albums yet
              </p>
            ) : (
              <div className="space-y-0.5">
                {albumTree.map((album) => (
                  <AlbumTreeItem
                    key={album.id}
                    album={album}
                    depth={0}
                    expandedIds={expandedIds}
                    toggleExpanded={toggleExpanded}
                    currentPath={location.pathname}
                    onCreateSubfolder={handleCreateAlbum}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Quick Links */}
          <div className="space-y-0.5">
            <NavItem
              to="/admin/shares"
              icon={<Share2 className="w-4 h-4" />}
              label="Shared Links"
              isActive={location.pathname === '/admin/shares'}
            />
          </div>
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-light-border-subtle dark:border-dark-border-subtle">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => handleCreateAlbum()}
            leftIcon={<Plus className="w-4 h-4" />}
            className="w-full"
          >
            New Album
          </Button>
        </div>
      </aside>

      <CreateAlbumModal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false)
          setCreateParentId(undefined)
        }}
        parentId={createParentId}
      />
    </>
  )
}

interface AlbumTreeItemProps {
  album: AlbumTree
  depth: number
  expandedIds: Set<string>
  toggleExpanded: (id: string) => void
  currentPath: string
  onCreateSubfolder: (parentId: string) => void
}

function AlbumTreeItem({
  album,
  depth,
  expandedIds,
  toggleExpanded,
  currentPath,
  onCreateSubfolder,
}: AlbumTreeItemProps) {
  const navigate = useNavigate()
  const isExpanded = expandedIds.has(album.id)
  const hasChildren = album.children.length > 0
  const isActive = currentPath === `/admin/albums/${album.id}`

  return (
    <div>
      <div
        className={cn(
          'group flex items-center gap-1 px-2 py-1.5 rounded-md cursor-pointer',
          'transition-colors duration-100',
          isActive
            ? 'bg-accent-muted text-accent-primary'
            : 'text-light-text-secondary dark:text-dark-text-secondary hover:bg-light-bg-hover dark:hover:bg-dark-bg-hover'
        )}
        style={{ paddingLeft: `${8 + depth * 12}px` }}
      >
        {/* Expand/collapse button */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            toggleExpanded(album.id)
          }}
          className={cn(
            'p-0.5 rounded',
            hasChildren ? 'visible' : 'invisible'
          )}
        >
          {isExpanded ? (
            <ChevronDown className="w-3.5 h-3.5" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5" />
          )}
        </button>

        {/* Album icon and name */}
        <div
          onClick={() => navigate(`/admin/albums/${album.id}`)}
          className="flex-1 flex items-center gap-2 min-w-0"
        >
          <FolderOpen className="w-4 h-4 flex-shrink-0" />
          <span className="text-sm truncate">{album.name}</span>
          {album.image_count > 0 && (
            <span className="text-xs text-light-text-tertiary dark:text-dark-text-tertiary">
              {album.image_count}
            </span>
          )}
        </div>

        {/* Add subfolder button */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            onCreateSubfolder(album.id)
          }}
          className="p-0.5 rounded opacity-0 group-hover:opacity-100 hover:bg-light-bg-tertiary dark:hover:bg-dark-bg-tertiary"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Children */}
      {isExpanded && hasChildren && (
        <div>
          {album.children.map((child) => (
            <AlbumTreeItem
              key={child.id}
              album={child}
              depth={depth + 1}
              expandedIds={expandedIds}
              toggleExpanded={toggleExpanded}
              currentPath={currentPath}
              onCreateSubfolder={onCreateSubfolder}
            />
          ))}
        </div>
      )}
    </div>
  )
}

interface NavItemProps {
  to: string
  icon: React.ReactNode
  label: string
  isActive: boolean
}

function NavItem({ to, icon, label, isActive }: NavItemProps) {
  return (
    <Link
      to={to}
      className={cn(
        'flex items-center gap-2 px-3 py-2 rounded-md text-sm',
        'transition-colors duration-100',
        isActive
          ? 'bg-accent-muted text-accent-primary'
          : 'text-light-text-secondary dark:text-dark-text-secondary hover:bg-light-bg-hover dark:hover:bg-dark-bg-hover'
      )}
    >
      {icon}
      {label}
    </Link>
  )
}
