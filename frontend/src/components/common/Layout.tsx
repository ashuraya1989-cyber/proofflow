import React from 'react';
import { useTheme } from '@/context/ThemeContext';
import { Link, useLocation } from 'react-router-dom';
import { Home, Image as ImageIcon, Settings, Sun, Moon } from 'lucide-react'; // Need to add lucide-react or use MUI icons. I added MUI icons in package.json but lucide is more "Cursor-like". I'll stick to MUI icons as installed.
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import DashboardIcon from '@mui/icons-material/Dashboard';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { theme, setTheme } = useTheme();
  const location = useLocation();

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex transition-colors duration-200">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border flex flex-col p-4 bg-muted/20">
        <div className="mb-8 px-2">
          <h1 className="font-semibold text-lg tracking-tight">Gallery Admin</h1>
        </div>
        
        <nav className="space-y-1 flex-1">
          <Link 
            to="/admin" 
            className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              location.pathname === '/admin' 
                ? 'bg-secondary text-secondary-foreground' 
                : 'hover:bg-secondary/50 text-muted-foreground hover:text-foreground'
            }`}
          >
            <DashboardIcon fontSize="small" />
            Albums
          </Link>
        </nav>

        <div className="mt-auto pt-4 border-t border-border">
          <button
            onClick={toggleTheme}
            className="flex items-center gap-3 px-3 py-2 w-full rounded-md text-sm font-medium hover:bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors"
          >
            {theme === 'dark' ? <Brightness7Icon fontSize="small" /> : <Brightness4Icon fontSize="small" />}
            {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto p-8">
          {children}
        </div>
      </main>
    </div>
  );
};
