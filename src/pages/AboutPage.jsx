import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getSiteSettings } from '../lib/api.js';
import { Mail, ArrowRight, Code2, Server, Cpu } from 'lucide-react';

export default function AboutPage() {
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    getSiteSettings()
      .then((s) => setSettings(s?.general || null))
      .catch(() => {});
  }, []);

  const authorName = settings?.author_name || 'Theara';
  const authorBio =
    settings?.author_bio ||
    'Full-stack engineer, modern web enthusiast, and systems tinkerer.';
  const avatarUrl =
    settings?.avatar_url ||
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80';

  return (
    <div className="max-w-4xl mx-auto space-y-10">
      {/* Intro hero card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-10 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col md:flex-row items-center gap-8">
          <img
            src={avatarUrl}
            alt={authorName}
            className="w-36 h-36 rounded-2xl object-cover shadow-md border-2 border-indigo-500 shrink-0"
          />
          <div className="space-y-4 text-center md:text-left">
            <div className="space-y-1">
              <span className="text-xs font-semibold tracking-wider uppercase text-indigo-600 dark:text-indigo-400">
                Author & Engineer
              </span>
              <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">
                Hi, I&apos;m {authorName}
              </h1>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {authorBio}
            </p>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-2">
              <Link
                to="/contact"
                className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 shadow-xs"
              >
                <Mail className="w-4 h-4" />
                <span>Get in touch</span>
              </Link>
              <Link
                to="/cv"
                className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-lg text-xs font-semibold border border-slate-300 hover:bg-slate-50 text-slate-700 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                <span>View Full CV</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Philosophy & What I write about */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center dark:bg-indigo-950/60 dark:text-indigo-400">
            <Code2 className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
            Frontend Precision
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            Building intuitive user interfaces with React, state machines, and micro-interactions without bloat or slowdown.
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center dark:bg-emerald-950/60 dark:text-emerald-400">
            <Server className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
            Resilient Backends
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            Designing schema models, RLS policies in PostgreSQL, and edge workers with Cloudflare and serverless platforms.
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-3">
          <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center dark:bg-amber-950/60 dark:text-amber-400">
            <Cpu className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
            Real Problem Solving
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            Sharing unfiltered production debug logs, memory leaks, performance profiling, and architecture pivots.
          </p>
        </div>
      </div>
    </div>
  );
}
