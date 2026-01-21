import { forwardRef, InputHTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  leftIcon?: ReactNode
  rightIcon?: ReactNode
  containerClassName?: string
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      containerClassName,
      label,
      error,
      hint,
      leftIcon,
      rightIcon,
      type = 'text',
      ...props
    },
    ref
  ) => {
    return (
      <div className={cn('flex flex-col gap-1.5', containerClassName)}>
        {label && (
          <label className="text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary">
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-light-text-tertiary dark:text-dark-text-tertiary">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            type={type}
            className={cn(
              'w-full h-10 px-3 rounded-lg',
              'bg-light-bg-secondary dark:bg-dark-bg-secondary',
              'border border-light-border-primary dark:border-dark-border-primary',
              'text-light-text-primary dark:text-dark-text-primary',
              'placeholder:text-light-text-tertiary dark:placeholder:text-dark-text-tertiary',
              'focus:outline-none focus:ring-2 focus:ring-accent-primary focus:border-transparent',
              'transition-all duration-150',
              leftIcon && 'pl-10',
              rightIcon && 'pr-10',
              error && 'border-accent-error focus:ring-accent-error',
              className
            )}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-light-text-tertiary dark:text-dark-text-tertiary">
              {rightIcon}
            </div>
          )}
        </div>
        {error && (
          <p className="text-sm text-accent-error">{error}</p>
        )}
        {hint && !error && (
          <p className="text-sm text-light-text-tertiary dark:text-dark-text-tertiary">
            {hint}
          </p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

export default Input
