import { Fragment, ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { X } from 'lucide-react'
import Button from './Button'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  description?: string
  children: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  showCloseButton?: boolean
}

export default function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  size = 'md',
  showCloseButton = true,
}: ModalProps) {
  if (!isOpen) return null

  const sizeStyles = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    full: 'max-w-4xl',
  }

  return (
    <Fragment>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 animate-fade-in"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className={cn(
            'w-full pointer-events-auto',
            'bg-light-bg-elevated dark:bg-dark-bg-elevated',
            'rounded-xl shadow-elevated dark:shadow-dark-elevated',
            'border border-light-border-primary dark:border-dark-border-primary',
            'animate-scale-in',
            sizeStyles[size]
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          {(title || showCloseButton) && (
            <div className="flex items-start justify-between p-4 border-b border-light-border-subtle dark:border-dark-border-subtle">
              <div>
                {title && (
                  <h2 className="text-lg font-semibold text-light-text-primary dark:text-dark-text-primary">
                    {title}
                  </h2>
                )}
                {description && (
                  <p className="mt-1 text-sm text-light-text-secondary dark:text-dark-text-secondary">
                    {description}
                  </p>
                )}
              </div>
              {showCloseButton && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="p-1.5 h-auto -mr-1 -mt-1"
                >
                  <X className="w-5 h-5" />
                </Button>
              )}
            </div>
          )}
          
          {/* Content */}
          <div className="p-4">
            {children}
          </div>
        </div>
      </div>
    </Fragment>
  )
}

// Convenience components for modal structure
Modal.Footer = function ModalFooter({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex items-center justify-end gap-3 pt-4 mt-4',
        'border-t border-light-border-subtle dark:border-dark-border-subtle',
        className
      )}
    >
      {children}
    </div>
  )
}
