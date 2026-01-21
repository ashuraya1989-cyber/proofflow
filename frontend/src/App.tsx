import { Routes, Route, Navigate } from 'react-router-dom'
import { useThemeStore } from '@/stores/themeStore'
import { useAuthStore } from '@/stores/authStore'
import { useEffect } from 'react'

// Admin pages
import AdminLayout from '@/components/admin/AdminLayout'
import LoginPage from '@/pages/admin/LoginPage'
import AlbumsPage from '@/pages/admin/AlbumsPage'
import AlbumDetailPage from '@/pages/admin/AlbumDetailPage'
import SharesPage from '@/pages/admin/SharesPage'

// Client pages
import ClientGalleryPage from '@/pages/client/ClientGalleryPage'

function App() {
  const { theme, initTheme } = useThemeStore()
  const { isAuthenticated, checkAuth } = useAuthStore()

  useEffect(() => {
    initTheme()
    checkAuth()
  }, [initTheme, checkAuth])

  useEffect(() => {
    // Apply theme class to document
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [theme])

  return (
    <Routes>
      {/* Client Gallery - Public */}
      <Route path="/gallery/:token" element={<ClientGalleryPage />} />
      
      {/* Admin Auth */}
      <Route
        path="/admin/login"
        element={
          isAuthenticated ? <Navigate to="/admin" replace /> : <LoginPage />
        }
      />
      
      {/* Admin Protected Routes */}
      <Route
        path="/admin"
        element={
          isAuthenticated ? <AdminLayout /> : <Navigate to="/admin/login" replace />
        }
      >
        <Route index element={<AlbumsPage />} />
        <Route path="albums" element={<AlbumsPage />} />
        <Route path="albums/:albumId" element={<AlbumDetailPage />} />
        <Route path="shares" element={<SharesPage />} />
      </Route>
      
      {/* Default redirect */}
      <Route path="/" element={<Navigate to="/admin" replace />} />
      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Routes>
  )
}

export default App
