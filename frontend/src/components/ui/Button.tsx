import { forwardRef, ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
  leftIcon?: ReactNode
  rightIcon?: ReactNode
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles = cn(
      'inline-flex items-center justify-center font-medium',
      'rounded-lg transition-all duration-150',
      'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary focus-visible:ring-offset-2',
      'disabled:opacity-50 disabled:cursor-not-allowed',
      'dark:focus-visible:ring-offset-dark-bg-primary'
    )

    const variantStyles = {
      primary: cn(
        'bg-accent-primary text-white',
        'hover:bg-accent-hover',
        'active:scale-[0.98]'
      ),
      secondary: cn(
        'bg-light-bg-tertiary text-light-text-primary',
        'dark:bg-dark-bg-tertiary dark:text-dark-text-primary',
        'hover:bg-light-bg-hover dark:hover:bg-dark-bg-hover',
        'active:scale-[0.98]'
      ),
      ghost: cn(
        'bg-transparent text-light-text-secondary',
        'dark:text-dark-text-secondary',
        'hover:bg-light-bg-tertiary dark:hover:bg-dark-bg-tertiary',
        'hover:text-light-text-primary dark:hover:text-dark-text-primary'
      ),
      danger: cn(
        'bg-accent-error text-white',
        'hover:bg-red-600',
        'active:scale-[0.98]'
      ),
      outline: cn(
        'border border-light-border-primary',
        'dark:border-dark-border-primary',
        'bg-transparent text-light-text-primary',
        'dark:text-dark-text-primary',
        'hover:bg-light-bg-tertiary dark:hover:bg-dark-bg-tertiary',
        'active:scale-[0.98]'
      ),
    }

    const sizeStyles = {
      sm: 'h-8 px-3 text-sm gap-1.5',
      md: 'h-10 px-4 text-sm gap-2',
      lg: 'h-12 px-6 text-base gap-2',
    }

    return (
      <button
        ref={ref}
        className={cn(
          baseStyles,
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <svg
            className="animate-spin h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        ) : (
          leftIcon
        )}
        {children}
        {!isLoading && rightIcon}
      </button>
    )
  }
)

Button.displayName = 'Button'

export default Button
