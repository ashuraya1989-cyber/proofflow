import { useState, useRef, useEffect, ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface DropdownProps {
  trigger: ReactNode
  children: ReactNode
  align?: 'left' | 'right'
  className?: string
}

export default function Dropdown({
  trigger,
  children,
  align = 'right',
  className,
}: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div ref={dropdownRef} className="relative inline-block">
      <div onClick={() => setIsOpen(!isOpen)}>{trigger}</div>
      
      {isOpen && (
        <div
          className={cn(
            'absolute z-50 mt-2 min-w-[180px]',
            'bg-light-bg-elevated dark:bg-dark-bg-elevated',
            'border border-light-border-primary dark:border-dark-border-primary',
            'rounded-lg shadow-medium dark:shadow-dark-medium',
            'py-1 animate-fade-in',
            align === 'right' ? 'right-0' : 'left-0',
            className
          )}
          onClick={() => setIsOpen(false)}
        >
          {children}
        </div>
      )}
    </div>
  )
}

interface DropdownItemProps {
  onClick?: () => void
  children: ReactNode
  variant?: 'default' | 'danger'
  disabled?: boolean
}

Dropdown.Item = function DropdownItem({
  onClick,
  children,
  variant = 'default',
  disabled = false,
}: DropdownItemProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'w-full px-3 py-2 text-left text-sm flex items-center gap-2',
        'transition-colors duration-100',
        variant === 'default' && [
          'text-light-text-primary dark:text-dark-text-primary',
          'hover:bg-light-bg-hover dark:hover:bg-dark-bg-hover',
        ],
        variant === 'danger' && [
          'text-accent-error',
          'hover:bg-accent-error/10',
        ],
        disabled && 'opacity-50 cursor-not-allowed'
      )}
    >
      {children}
    </button>
  )
}

Dropdown.Separator = function DropdownSeparator() {
  return (
    <div className="my-1 border-t border-light-border-subtle dark:border-dark-border-subtle" />
  )
}
