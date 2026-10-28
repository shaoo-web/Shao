import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext.jsx';
import { getCategories } from '../lib/api.js';
import AdSlot from './AdSlot.jsx';
import { 
  Sun, 
  Moon, 
  Search, 
  Menu, 
  X, 
  Terminal, 
  ShieldCheck 
} from 'lucide-react';

export default function Header() {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [categories, setCategories] = useState([]);
  const [isDark, setIsDark] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);

  // Initialize and toggle theme using [data-theme="dark"] on <html>
  useEffect(() => {
    const savedTheme = localStorage.getItem('theara_theme');
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialDark = savedTheme ? savedTheme === 'dark' : prefersDark;

    setIsDark(initialDark);
    if (initialDark) {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.setAttribute('data-theme', 'light');
    }
  }, []);

  const toggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    const mode = nextDark ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', mode);
    localStorage.setItem('theara_theme', mode);
  };

  useEffect(() => {
    let mounted = true;
    getCategories()
      .then((cats) => {
        if (mounted) setCategories(cats || []);
      })
      .catch((err) => console.warn('Failed to load categories for header:', err));
    return () => {
      mounted = false;
    };
  }, []);

  // Close menus when route changes
  useEffect(() => {
    setMobileMenuOpen(false);
    setSearchOpen(false);
  }, [location.pathname]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery('');
    }
  };

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'CV / Resume', path: '/cv' },
    { name: 'About', path: '/about' },
    { name: 'Contact', path: '/contact' },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/90 backdrop-blur-md transition-colors dark:border-slate-800 dark:bg-slate-900/90">
      {/* Top Header Ad Slot if present */}
      <div className="max-w-6xl mx-auto px-4">
        <AdSlot slot="header" />
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Logo & Brand */}
          <Link to="/" className="flex items-center space-x-2 group">
            <div className="w-9 h-9 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-mono font-bold shadow-sm transition-transform group-hover:scale-105">
              <Terminal className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-lg tracking-tight text-slate-900 dark:text-slate-100">
                Theara<span className="text-indigo-600 dark:text-indigo-400">.blog</span>
              </span>
              <span className="text-[11px] text-slate-500 font-mono hidden sm:inline-block dark:text-slate-400">
                code • architecture • cases
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
            {navLinks.map((link) => {
              const active = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`transition-colors py-1 ${
                    active
                      ? 'text-indigo-600 font-semibold border-b-2 border-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}

            {/* Categories dropdown */}
            {categories.length > 0 && (
              <div className="relative group">
                <button
                  type="button"
                  className="flex items-center text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white py-1"
                >
                  <span>Categories</span>
                  <span className="ml-1 text-xs opacity-60">▾</span>
                </button>
                <div className="absolute left-0 mt-2 w-56 rounded-md bg-white p-2 shadow-lg border border-slate-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-150 dark:bg-slate-800 dark:border-slate-700">
                  {categories.map((c) => (
                    <Link
                      key={c.id}
                      to={`/category/${c.slug}`}
                      className="block px-3 py-1.5 text-xs rounded hover:bg-slate-100 text-slate-700 dark:text-slate-200 dark:hover:bg-slate-700"
                    >
                      {c.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </nav>

          {/* Actions: Search, Theme Toggle, Admin / Sign In */}
          <div className="flex items-center space-x-2">
            {/* Search Button / Bar */}
            {searchOpen ? (
              <form onSubmit={handleSearchSubmit} className="relative flex items-center">
                <input
                  type="text"
                  placeholder="Search articles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                  className="w-40 sm:w-60 px-3 py-1.5 text-xs rounded-full border border-slate-300 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
                />
                <button
                  type="button"
                  onClick={() => setSearchOpen(false)}
                  className="ml-1.5 p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  aria-label="Close search"
                >
                  <X className="w-4 h-4" />
                </button>
              </form>
            ) : (
              <button
                type="button"
                onClick={() => setSearchOpen(true)}
                className="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 transition-colors"
                aria-label="Search"
              >
                <Search className="w-5 h-5" />
              </button>
            )}

            {/* Dark Mode Toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-yellow-400 dark:hover:bg-slate-800 transition-colors"
              aria-label="Toggle theme"
              title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            {/* Admin Badge or Link */}
            {isAdmin ? (
              <Link
                to="/admin"
                className="hidden sm:inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800 transition-colors"
              >
                <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>Admin</span>
              </Link>
            ) : user ? (
              <Link
                to="/admin/login"
                className="text-xs font-medium text-slate-600 hover:text-indigo-600 dark:text-slate-300"
              >
                Account
              </Link>
            ) : null}

            {/* Mobile Hamburger Toggle */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 md:hidden rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-3 dark:border-slate-800 dark:bg-slate-900">
          <form onSubmit={handleSearchSubmit} className="mb-3">
            <div className="relative">
              <input
                type="text"
                placeholder="Search posts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 pl-9 text-sm rounded-lg border border-slate-300 bg-slate-50 text-slate-900 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
              />
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            </div>
          </form>

          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className="block px-2 py-1.5 rounded text-sm font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              {link.name}
            </Link>
          ))}

          {categories.length > 0 && (
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <span className="text-xs font-semibold uppercase text-slate-400 block px-2 mb-1">
                Categories
              </span>
              <div className="grid grid-cols-2 gap-1">
                {categories.map((c) => (
                  <Link
                    key={c.id}
                    to={`/category/${c.slug}`}
                    className="text-xs px-2 py-1 text-slate-600 hover:text-indigo-600 rounded dark:text-slate-300"
                  >
                    {c.name}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {isAdmin && (
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <Link
                to="/admin"
                className="flex items-center space-x-2 px-2 py-2 rounded text-sm font-semibold text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 dark:text-indigo-300"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Admin Dashboard</span>
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
