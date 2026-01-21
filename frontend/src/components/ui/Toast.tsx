import { useEffect, useState, createContext, useContext, ReactNode, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { X, CheckCircle2, AlertCircle, Info, AlertTriangle } from 'lucide-react'

type ToastType = 'success' | 'error' | 'info' | 'warning'

interface Toast {
  id: string
  type: ToastType
  message: string
  duration?: number
}

interface ToastContextType {
  toasts: Toast[]
  addToast: (type: ToastType, message: string, duration?: number) => void
  removeToast: (id: string) => void
  success: (message: string, duration?: number) => void
  error: (message: string, duration?: number) => void
  info: (message: string, duration?: number) => void
  warning: (message: string, duration?: number) => void
}

const ToastContext = createContext<ToastContextType | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const addToast = useCallback((type: ToastType, message: string, duration = 4000) => {
    const id = Math.random().toString(36).substring(2, 9)
    setToasts((prev) => [...prev, { id, type, message, duration }])
  }, [])

  const success = useCallback((message: string, duration?: number) => {
    addToast('success', message, duration)
  }, [addToast])

  const error = useCallback((message: string, duration?: number) => {
    addToast('error', message, duration)
  }, [addToast])

  const info = useCallback((message: string, duration?: number) => {
    addToast('info', message, duration)
  }, [addToast])

  const warning = useCallback((message: string, duration?: number) => {
    addToast('warning', message, duration)
  }, [addToast])

  return (
    <ToastContext.Provider
      value={{ toasts, addToast, removeToast, success, error, info, warning }}
    >
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

function ToastContainer({
  toasts,
  removeToast,
}: {
  toasts: Toast[]
  removeToast: (id: string) => void
}) {
  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
      ))}
    </div>
  )
}

function ToastItem({
  toast,
  onRemove,
}: {
  toast: Toast
  onRemove: (id: string) => void
}) {
  useEffect(() => {
    if (toast.duration) {
      const timer = setTimeout(() => {
        onRemove(toast.id)
      }, toast.duration)
      return () => clearTimeout(timer)
    }
  }, [toast, onRemove])

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-accent-success" />,
    error: <AlertCircle className="w-5 h-5 text-accent-error" />,
    info: <Info className="w-5 h-5 text-accent-primary" />,
    warning: <AlertTriangle className="w-5 h-5 text-accent-warning" />,
  }

  const bgColors = {
    success: 'bg-accent-success/10 border-accent-success/20',
    error: 'bg-accent-error/10 border-accent-error/20',
    info: 'bg-accent-primary/10 border-accent-primary/20',
    warning: 'bg-accent-warning/10 border-accent-warning/20',
  }

  return (
    <div
      className={cn(
        'flex items-start gap-3 p-4 rounded-lg border',
        'bg-light-bg-elevated dark:bg-dark-bg-elevated',
        'shadow-medium dark:shadow-dark-medium',
        'animate-slide-up',
        bgColors[toast.type]
      )}
    >
      {icons[toast.type]}
      <p className="flex-1 text-sm text-light-text-primary dark:text-dark-text-primary">
        {toast.message}
      </p>
      <button
        onClick={() => onRemove(toast.id)}
        className="p-0.5 rounded hover:bg-light-bg-hover dark:hover:bg-dark-bg-hover"
      >
        <X className="w-4 h-4 text-light-text-tertiary dark:text-dark-text-tertiary" />
      </button>
    </div>
  )
}
