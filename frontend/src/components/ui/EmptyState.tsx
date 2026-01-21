import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
  className?: string
}

export default function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-16 px-4 text-center',
        className
      )}
    >
      {icon && (
        <div className="mb-4 text-light-text-tertiary dark:text-dark-text-tertiary">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-semibold text-light-text-primary dark:text-dark-text-primary">
        {title}
      </h3>
      {description && (
        <p className="mt-2 text-sm text-light-text-secondary dark:text-dark-text-secondary max-w-sm">
          {description}
        </p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}
