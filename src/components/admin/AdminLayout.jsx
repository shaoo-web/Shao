import { useState, useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../lib/AuthContext.jsx';
import {
  Terminal,
  LayoutDashboard,
  FileText,
  PlusCircle,
  Megaphone,
  Folder,
  MessageSquare,
  Image,
  Briefcase,
  Mail,
  Settings,
  LogOut,
  ExternalLink,
  Sun,
  Moon,
  Menu,
  X,
} from 'lucide-react';

export default function AdminLayout({ children }) {
  const { user, profile, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    setIsDark(currentTheme === 'dark');
  }, []);

  const toggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    const mode = nextDark ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', mode);
    localStorage.setItem('theara_theme', mode);
  };

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname, location.search]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/admin/login');
  };

  const navItems = [
    { label: 'Overview', path: '/admin', icon: LayoutDashboard, exact: true },
    { label: 'All Posts', path: '/admin/posts', icon: FileText },
    { label: 'Write Post', path: '/admin/posts/new', icon: PlusCircle },
    { label: 'Advertisements', path: '/admin/ads', icon: Megaphone },
    { label: 'Categories', path: '/admin?tab=categories', icon: Folder },
    { label: 'Comments', path: '/admin?tab=comments', icon: MessageSquare },
    { label: 'Media Library', path: '/admin?tab=media', icon: Image },
    { label: 'CV / Resume', path: '/admin?tab=cv', icon: Briefcase },
    { label: 'Messages', path: '/admin?tab=messages', icon: Mail },
    { label: 'Site Settings', path: '/admin?tab=settings', icon: Settings },
  ];

  const isNavItemActive = (item) => {
    const fullCurrent = location.pathname + location.search;
    if (item.path.includes('?tab=')) {
      return fullCurrent === item.path;
    }
    if (item.exact) {
      return location.pathname === '/admin' && !location.search.includes('tab=');
    }
    return location.pathname === item.path;
  };

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      {/* Mobile Sidebar Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 border-r border-slate-200 bg-white flex flex-col transition-transform duration-200 lg:static lg:translate-x-0 dark:border-slate-800 dark:bg-slate-900 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 px-5 flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
          <Link to="/admin" className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-mono font-bold">
              <Terminal className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-base text-slate-900 dark:text-white">
                Theara<span className="text-indigo-600 dark:text-indigo-400">Admin</span>
              </span>
              <span className="block text-[10px] text-slate-400 font-mono">
                CMS Control Panel
              </span>
            </div>
          </Link>

          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isNavItemActive(item);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-colors ${
                  active
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Bottom User Profile & Sign Out */}
        <div className="p-4 border-t border-slate-200 space-y-3 dark:border-slate-800">
          <div className="flex items-center justify-between px-2">
            <div className="truncate">
              <p className="text-xs font-bold text-slate-900 truncate dark:text-white">
                {profile?.full_name || 'Administrator'}
              </p>
              <p className="text-[11px] text-slate-500 truncate dark:text-slate-400">
                {user?.email}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSignOut}
            className="w-full flex items-center justify-center space-x-2 px-3 py-2 rounded-lg text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 transition-colors dark:bg-rose-950/40 dark:text-rose-400 dark:hover:bg-rose-950/70"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="h-16 border-b border-slate-200 bg-white px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 lg:hidden dark:text-slate-400 dark:hover:bg-slate-800"
            >
              <Menu className="w-5 h-5" />
            </button>
            <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
              Admin Workspace
            </span>
          </div>

          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
              title="Toggle theme"
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            <Link
              to="/"
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-300 hover:bg-slate-50 text-slate-700 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <span>View Public Blog</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-6xl w-full mx-auto">
          {children || <Outlet />}
        </main>
      </div>
    </div>
  );
}
