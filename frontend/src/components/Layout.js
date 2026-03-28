import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { 
  LayoutDashboard, 
  BookOpen, 
  ClipboardList, 
  UtensilsCrossed, 
  WashingMachine,
  Users,
  FileText,
  Download,
  LogOut,
  Menu,
  X,
  Sun,
  Moon,
  User
} from 'lucide-react';
import { Button } from './ui/button';

const navItems = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/diario', icon: BookOpen, label: 'Diario Digitale' },
  { path: '/consegne', icon: ClipboardList, label: 'Passaggio Consegne' },
  { path: '/pasti', icon: UtensilsCrossed, label: 'Gestione Pasti' },
  { path: '/lavanderia', icon: WashingMachine, label: 'Lavanderia' },
  { path: '/residenti', icon: Users, label: 'Residenti' },
  { path: '/report', icon: FileText, label: 'Report' },
  { path: '/backup', icon: Download, label: 'Backup Dati' },
];

export const Layout = ({ children }) => {
  const { currentUser, logout, theme, toggleTheme } = useApp();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex">
      {/* Mobile menu button */}
      <button
        data-testid="mobile-menu-button"
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-zinc-900 border border-zinc-800 text-white"
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar */}
      <aside 
        className={`
          fixed lg:static inset-y-0 left-0 z-40
          w-64 bg-zinc-950 border-r border-zinc-800
          transform transition-transform duration-200 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Logo/Header */}
        <div className="h-16 flex items-center px-6 border-b border-zinc-800">
          <h1 className="text-xl font-black text-white tracking-tight">SAVERIANI</h1>
        </div>

        {/* User info */}
        <div className="px-4 py-4 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-zinc-800 flex items-center justify-center">
              <User size={20} className="text-zinc-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-white" data-testid="current-user-name">
                {currentUser?.name}
              </p>
              <p className="text-xs text-zinc-500 capitalize">{currentUser?.role}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="py-4 flex-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              data-testid={`nav-${item.path.slice(1)}`}
              className={({ isActive }) => `
                sidebar-link
                ${isActive ? 'active' : ''}
              `}
              onClick={() => setSidebarOpen(false)}
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Footer actions */}
        <div className="p-4 border-t border-zinc-800 space-y-2">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-zinc-400 hover:text-white"
            onClick={toggleTheme}
            data-testid="theme-toggle"
          >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            <span>{theme === 'dark' ? 'Tema Chiaro' : 'Tema Scuro'}</span>
          </Button>
          
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-red-500 hover:text-red-400 hover:bg-red-500/10"
            onClick={handleLogout}
            data-testid="logout-button"
          >
            <LogOut size={20} />
            <span>Esci</span>
          </Button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/80 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <main className="flex-1 min-h-screen overflow-x-hidden">
        <div className="p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
};
