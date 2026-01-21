import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'
import { ToastProvider } from '@/components/ui/Toast'

export default function AdminLayout() {
  return (
    <ToastProvider>
      <div className="flex h-screen bg-light-bg-primary dark:bg-dark-bg-primary">
        {/* Sidebar */}
        <Sidebar />
        
        {/* Main content area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <Header />
          
          {/* Page content */}
          <main className="flex-1 overflow-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </ToastProvider>
  )
}
