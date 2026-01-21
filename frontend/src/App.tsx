import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Dashboard } from '@/pages/admin/Dashboard';
import { AlbumView } from '@/pages/admin/AlbumView';
import { ClientGallery } from '@/pages/client/ClientGallery';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/admin" replace />} />
        
        {/* Admin Routes */}
        <Route path="/admin" element={<Dashboard />} />
        <Route path="/admin/albums/:id" element={<AlbumView />} />
        
        {/* Client Routes */}
        <Route path="/share/:token" element={<ClientGallery />} />
        
        {/* Fallback */}
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
