import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getSiteSettings, getCategories } from '../lib/api.js';
import AdSlot from './AdSlot.jsx';
import { Terminal, Github, Linkedin, Twitter, ArrowUp } from 'lucide-react';

export default function Footer() {
  const [settings, setSettings] = useState(null);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    let mounted = true;
    Promise.all([
      getSiteSettings().catch(() => ({})),
      getCategories().catch(() => []),
    ]).then(([siteSettings, cats]) => {
      if (mounted) {
        setSettings(siteSettings?.general || null);
        setCategories((cats || []).slice(0, 5));
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-16 border-t border-slate-200 bg-slate-50 transition-colors dark:border-slate-800 dark:bg-slate-950">
      {/* Footer Ad Slot */}
      <div className="max-w-6xl mx-auto px-4 pt-4">
        <AdSlot slot="footer" />
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand & Statement */}
          <div className="md:col-span-2 space-y-4">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-mono font-bold">
                <Terminal className="w-4 h-4" />
              </div>
              <span className="font-bold text-lg text-slate-900 dark:text-slate-100">
                Theara<span className="text-indigo-600 dark:text-indigo-400">.blog</span>
              </span>
            </Link>
            <p className="text-sm text-slate-600 dark:text-slate-400 max-w-sm leading-relaxed">
              {settings?.tagline ||
                'A personal technology blog detailing real web development hurdles, system design paradigms, and practical solutions from daily software engineering.'}
            </p>
            <div className="flex items-center space-x-3 text-slate-500 dark:text-slate-400">
              {settings?.social_github && (
                <a
                  href={settings.social_github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg bg-white border border-slate-200 hover:text-slate-900 dark:bg-slate-900 dark:border-slate-800 dark:hover:text-white"
                  title="GitHub"
                >
                  <Github className="w-4 h-4" />
                </a>
              )}
              {settings?.social_linkedin && (
                <a
                  href={settings.social_linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg bg-white border border-slate-200 hover:text-indigo-600 dark:bg-slate-900 dark:border-slate-800"
                  title="LinkedIn"
                >
                  <Linkedin className="w-4 h-4" />
                </a>
              )}
              {settings?.social_twitter && (
                <a
                  href={settings.social_twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg bg-white border border-slate-200 hover:text-sky-500 dark:bg-slate-900 dark:border-slate-800"
                  title="Twitter"
                >
                  <Twitter className="w-4 h-4" />
                </a>
              )}
            </div>
          </div>

          {/* Navigation Links */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-200 mb-3">
              Explore
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  to="/"
                  className="text-slate-600 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400"
                >
                  Home / Latest Posts
                </Link>
              </li>
              <li>
                <Link
                  to="/cv"
                  className="text-slate-600 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400"
                >
                  Curriculum Vitae
                </Link>
              </li>
              <li>
                <Link
                  to="/about"
                  className="text-slate-600 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400"
                >
                  About The Author
                </Link>
              </li>
              <li>
                <Link
                  to="/contact"
                  className="text-slate-600 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400"
                >
                  Contact & Inquiries
                </Link>
              </li>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-200 mb-3">
              Topics
            </h4>
            <ul className="space-y-2 text-sm">
              {categories.map((c) => (
                <li key={c.id}>
                  <Link
                    to={`/category/${c.slug}`}
                    className="text-slate-600 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400"
                  >
                    {c.name}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  to="/admin/login"
                  className="text-xs text-slate-400 hover:text-indigo-500 pt-2 block"
                >
                  Admin Portal →
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-6 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 dark:text-slate-400 gap-4">
          <p>© {currentYear} Theara Blog. Built with care & clean architecture.</p>

          <button
            onClick={scrollToTop}
            className="flex items-center space-x-1.5 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
          >
            <span>Back to top</span>
            <ArrowUp className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </footer>
  );
}
