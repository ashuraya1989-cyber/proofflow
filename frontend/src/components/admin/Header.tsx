import { useThemeStore } from '@/stores/themeStore'
import { useAuthStore } from '@/stores/authStore'
import { cn } from '@/lib/utils'
import { Sun, Moon, LogOut, User } from 'lucide-react'
import Button from '@/components/ui/Button'
import Dropdown from '@/components/ui/Dropdown'

export default function Header() {
  const { theme, toggleTheme } = useThemeStore()
  const { logout } = useAuthStore()

  const handleLogout = () => {
    logout()
    window.location.href = '/admin/login'
  }

  return (
    <header
      className={cn(
        'h-14 flex items-center justify-between px-6',
        'bg-light-bg-primary dark:bg-dark-bg-primary',
        'border-b border-light-border-primary dark:border-dark-border-primary'
      )}
    >
      {/* Breadcrumb or title area - can be customized per page */}
      <div />

      {/* Actions */}
      <div className="flex items-center gap-2">
        {/* Theme toggle */}
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleTheme}
          className="p-2"
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {theme === 'dark' ? (
            <Sun className="w-5 h-5" />
          ) : (
            <Moon className="w-5 h-5" />
          )}
        </Button>

        {/* User menu */}
        <Dropdown
          trigger={
            <Button variant="ghost" size="sm" className="p-2">
              <User className="w-5 h-5" />
            </Button>
          }
        >
          <div className="px-3 py-2 border-b border-light-border-subtle dark:border-dark-border-subtle">
            <p className="text-sm font-medium text-light-text-primary dark:text-dark-text-primary">
              Admin
            </p>
            <p className="text-xs text-light-text-tertiary dark:text-dark-text-tertiary">
              Logged in
            </p>
          </div>
          <Dropdown.Item onClick={handleLogout} variant="danger">
            <LogOut className="w-4 h-4" />
            Logout
          </Dropdown.Item>
        </Dropdown>
      </div>
    </header>
  )
}
