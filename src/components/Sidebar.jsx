import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getCategories, getTags, getSiteSettings, subscribeNewsletter } from '../lib/api.js';
import AdSlot from './AdSlot.jsx';
import { Search, Mail, CheckCircle2, AlertCircle, Github, Linkedin, Twitter, Tag, Folder } from 'lucide-react';

export default function Sidebar({ className = '' }) {
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [settings, setSettings] = useState(null);
  const [search, setSearch] = useState('');

  // Newsletter state
  const [email, setEmail] = useState('');
  const [subStatus, setSubStatus] = useState(null); // 'loading', 'success', 'error'
  const [subMsg, setSubMsg] = useState('');

  useEffect(() => {
    let mounted = true;

    Promise.all([
      getCategories().catch(() => []),
      getTags().catch(() => []),
      getSiteSettings().catch(() => ({})),
    ]).then(([cats, tagList, siteSettings]) => {
      if (mounted) {
        setCategories(cats || []);
        setTags(tagList || []);
        setSettings(siteSettings?.general || null);
      }
    });

    return () => {
      mounted = false;
    };
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (search.trim()) {
      navigate(`/search?q=${encodeURIComponent(search.trim())}`);
      setSearch('');
    }
  };

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setSubStatus('error');
      setSubMsg('Please enter a valid email address.');
      return;
    }

    try {
      setSubStatus('loading');
      setSubMsg('');
      const res = await subscribeNewsletter(email);
      setSubStatus('success');
      setSubMsg(res?.message || 'Thank you for subscribing to updates!');
      setEmail('');
    } catch (err) {
      setSubStatus('error');
      setSubMsg(err.message || 'Subscription failed. Please try again later.');
    }
  };

  const authorName = settings?.author_name || 'Theara';
  const authorBio =
    settings?.author_bio ||
    'Full-stack engineer writing about modern web development, backend systems, and hard-earned engineering lessons.';
  const avatarUrl =
    settings?.avatar_url ||
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80';

  return (
    <aside className={`space-y-6 ${className}`}>
      {/* Top Sidebar Ad Slot */}
      <AdSlot slot="sidebar_top" />

      {/* Author Profile Card */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center space-x-4 mb-3">
          <img
            src={avatarUrl}
            alt={authorName}
            className="w-14 h-14 rounded-full object-cover border-2 border-indigo-500 shadow-xs"
          />
          <div>
            <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
              {authorName}
            </h3>
            <span className="text-xs text-indigo-600 font-medium dark:text-indigo-400">
              Tech Author & Engineer
            </span>
          </div>
        </div>

        <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300 mb-4">
          {authorBio}
        </p>

        {/* Social Icons */}
        <div className="flex items-center space-x-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400">
          {settings?.social_github && (
            <a
              href={settings.social_github}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-slate-900 dark:hover:text-white transition-colors"
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
              className="hover:text-indigo-600 transition-colors"
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
              className="hover:text-sky-500 transition-colors"
              title="Twitter"
            >
              <Twitter className="w-4 h-4" />
            </a>
          )}
          <Link
            to="/cv"
            className="ml-auto text-xs font-semibold text-indigo-600 hover:underline dark:text-indigo-400"
          >
            View CV →
          </Link>
        </div>
      </div>

      {/* Quick Search Widget */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 flex items-center">
          <Search className="w-3.5 h-3.5 mr-1.5 text-indigo-500" />
          Search Articles
        </h4>
        <form onSubmit={handleSearch} className="flex">
          <input
            type="text"
            placeholder="Type keyword..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-l-lg border border-slate-300 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-900 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
          />
          <button
            type="submit"
            className="px-3.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-r-lg transition-colors"
          >
            Go
          </button>
        </form>
      </div>

      {/* Categories Widget */}
      {categories.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 flex items-center">
            <Folder className="w-3.5 h-3.5 mr-1.5 text-indigo-500" />
            Categories
          </h4>
          <ul className="space-y-1.5 text-xs">
            {categories.map((cat) => (
              <li key={cat.id}>
                <Link
                  to={`/category/${cat.slug}`}
                  className="flex items-center justify-between py-1 px-2 rounded hover:bg-slate-50 text-slate-700 hover:text-indigo-600 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-indigo-400 transition-colors"
                >
                  <span>{cat.name}</span>
                  <span className="text-slate-400 text-[11px]">→</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Newsletter Box */}
      <div className="rounded-xl border border-indigo-100 bg-gradient-to-br from-indigo-50/50 to-white p-5 shadow-xs dark:border-indigo-950 dark:from-slate-900 dark:to-slate-900">
        <div className="flex items-center space-x-2 text-indigo-600 dark:text-indigo-400 mb-1">
          <Mail className="w-4 h-4" />
          <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            Tech Newsletter
          </h4>
        </div>
        <p className="text-xs text-slate-600 dark:text-slate-300 mb-3">
          Get weekly insights on real production problems and web engineering tips.
        </p>

        {subStatus === 'success' ? (
          <div className="p-3 bg-emerald-50 rounded-lg text-emerald-800 text-xs flex items-center space-x-2 dark:bg-emerald-950/50 dark:text-emerald-300">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{subMsg}</span>
          </div>
        ) : (
          <form onSubmit={handleSubscribe} className="space-y-2">
            <input
              type="email"
              placeholder="you@domain.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={subStatus === 'loading'}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
            />
            <button
              type="submit"
              disabled={subStatus === 'loading'}
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs rounded-lg transition-colors shadow-xs disabled:opacity-50"
            >
              {subStatus === 'loading' ? 'Subscribing...' : 'Subscribe Free'}
            </button>
            {subStatus === 'error' && (
              <div className="text-[11px] text-red-500 flex items-center space-x-1 pt-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{subMsg}</span>
              </div>
            )}
          </form>
        )}
      </div>

      {/* Popular Tags */}
      {tags.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 flex items-center">
            <Tag className="w-3.5 h-3.5 mr-1.5 text-indigo-500" />
            Tags
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {tags.map((t) => (
              <Link
                key={t.id}
                to={`/tag/${t.slug}`}
                className="text-[11px] px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors"
              >
                #{t.name}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Bottom Sidebar Ad Slot */}
      <AdSlot slot="sidebar_bottom" />
    </aside>
  );
}
