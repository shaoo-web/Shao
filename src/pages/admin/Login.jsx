import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../lib/AuthContext.jsx';
import { Terminal, Lock, Mail, AlertCircle, ArrowLeft, ShieldAlert } from 'lucide-react';

export default function Login() {
  const { user, isAdmin, signIn, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const from = location.state?.from?.pathname || '/admin';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError('Please enter both email and password.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      await signIn({ email: email.trim(), password });
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || 'Invalid login credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  // If logged in as admin, offer quick redirect
  if (user && isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 dark:bg-slate-950">
        <div className="max-w-md w-full rounded-2xl border border-slate-200 bg-white p-8 text-center space-y-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center mx-auto">
            <Terminal className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            Already Signed In
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Signed in as <strong className="text-slate-800 dark:text-slate-200">{user.email}</strong> (Administrator)
          </p>
          <div className="flex flex-col space-y-2 pt-2">
            <Link
              to="/admin"
              className="w-full py-2.5 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-colors"
            >
              Go to Admin Dashboard →
            </Link>
            <button
              type="button"
              onClick={() => signOut()}
              className="w-full py-2 px-4 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 font-medium text-xs transition-colors dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  // If logged in but NOT admin
  if (user && !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 dark:bg-slate-950">
        <div className="max-w-md w-full rounded-2xl border border-rose-200 bg-white p-8 text-center space-y-5 shadow-xs dark:border-rose-900/50 dark:bg-slate-900">
          <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto dark:bg-rose-950 dark:text-rose-400">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            Admin Access Required
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Your account (<strong className="text-slate-900 dark:text-white">{user.email}</strong>) is signed in, but does not have <code className="px-1 py-0.5 bg-slate-100 dark:bg-slate-800 rounded">is_admin = true</code> in the <code className="px-1 py-0.5 bg-slate-100 dark:bg-slate-800 rounded">profiles</code> table.
          </p>
          <div className="flex flex-col space-y-2 pt-2">
            <button
              type="button"
              onClick={() => signOut()}
              className="w-full py-2.5 px-4 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs transition-colors"
            >
              Sign Out & Switch Account
            </button>
            <Link
              to="/"
              className="w-full py-2 px-4 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 font-medium text-xs transition-colors dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Back to Public Blog
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-slate-50 px-4 py-12 dark:bg-slate-950">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <Link
            to="/"
            className="inline-flex items-center space-x-1.5 text-xs font-medium text-slate-500 hover:text-indigo-600 dark:text-slate-400 mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Theara Blog</span>
          </Link>

          <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center mx-auto shadow-sm">
            <Terminal className="w-6 h-6" />
          </div>

          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            Admin Sign In
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Authenticate with your Supabase administrator credentials
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          {error && (
            <div className="mb-5 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2 dark:bg-rose-950/50 dark:border-rose-900 dark:text-rose-300">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@theara.blog"
                  className="w-full pl-9 pr-3.5 py-2.5 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3.5 py-2.5 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-lg transition-colors shadow-xs disabled:opacity-50"
            >
              {submitting ? 'Signing in...' : 'Sign In to Dashboard'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
