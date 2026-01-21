import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { useThemeStore } from '@/stores/themeStore'
import { cn } from '@/lib/utils'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { ImageIcon, Sun, Moon, Eye, EyeOff } from 'lucide-react'

export default function LoginPage() {
  const navigate = useNavigate()
  const { login, isLoading, error, isAuthenticated } = useAuthStore()
  const { theme, toggleTheme, initTheme } = useThemeStore()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    initTheme()
  }, [initTheme])

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/admin')
    }
  }, [isAuthenticated, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const success = await login(username, password)
    if (success) {
      navigate('/admin')
    }
  }

  return (
    <div
      className={cn(
        'min-h-screen flex flex-col items-center justify-center',
        'bg-light-bg-primary dark:bg-dark-bg-primary',
        'px-4'
      )}
    >
      {/* Theme toggle */}
      <button
        onClick={toggleTheme}
        className={cn(
          'absolute top-4 right-4 p-2 rounded-lg',
          'text-light-text-secondary dark:text-dark-text-secondary',
          'hover:bg-light-bg-tertiary dark:hover:bg-dark-bg-tertiary',
          'transition-colors duration-150'
        )}
        aria-label="Toggle theme"
      >
        {theme === 'dark' ? (
          <Sun className="w-5 h-5" />
        ) : (
          <Moon className="w-5 h-5" />
        )}
      </button>

      {/* Login card */}
      <div
        className={cn(
          'w-full max-w-sm',
          'bg-light-bg-elevated dark:bg-dark-bg-elevated',
          'border border-light-border-primary dark:border-dark-border-primary',
          'rounded-2xl shadow-soft dark:shadow-dark-soft',
          'p-8'
        )}
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div
            className={cn(
              'w-14 h-14 rounded-xl flex items-center justify-center mb-4',
              'bg-accent-muted'
            )}
          >
            <ImageIcon className="w-7 h-7 text-accent-primary" />
          </div>
          <h1 className="text-xl font-semibold text-light-text-primary dark:text-dark-text-primary">
            Gallery Admin
          </h1>
          <p className="text-sm text-light-text-tertiary dark:text-dark-text-tertiary mt-1">
            Sign in to manage your photos
          </p>
        </div>

        {/* Login form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Username"
            type="text"
            placeholder="Enter your username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            autoFocus
          />

          <Input
            label="Password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            rightIcon={
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="p-1"
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            }
          />

          {error && (
            <p className="text-sm text-accent-error text-center">{error}</p>
          )}

          <Button
            type="submit"
            isLoading={isLoading}
            className="w-full"
            size="lg"
          >
            Sign In
          </Button>
        </form>
      </div>

      {/* Footer */}
      <p className="mt-8 text-xs text-light-text-tertiary dark:text-dark-text-tertiary">
        Gallery v1.0.0
      </p>
    </div>
  )
}
