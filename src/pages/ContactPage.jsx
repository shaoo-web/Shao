import { useState } from 'react';
import { sendContactMessage } from '../lib/api.js';
import Sidebar from '../components/Sidebar.jsx';
import { Mail, CheckCircle2, AlertCircle, Send } from 'lucide-react';

export default function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) {
      setError('Please provide your name, email, and message.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await sendContactMessage({
        name: name.trim(),
        email: email.trim(),
        subject: subject.trim(),
        message: message.trim(),
      });
      setSuccess(true);
      setName('');
      setEmail('');
      setSubject('');
      setMessage('');
    } catch (err) {
      setError(err.message || 'Failed to send message. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      <div className="lg:col-span-8 space-y-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="space-y-1 pb-6 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center space-x-2 text-indigo-600 dark:text-indigo-400">
              <Mail className="w-5 h-5" />
              <span className="text-xs font-semibold uppercase tracking-wider">Contact</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              Get in Touch
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Have a question about an article, project inquiry, or just want to discuss software architecture? Drop a note below.
            </p>
          </div>

          {success && (
            <div className="my-6 p-4 rounded-xl bg-emerald-50 text-emerald-800 text-xs flex items-center space-x-3 dark:bg-emerald-950/60 dark:text-emerald-300">
              <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
              <div>
                <p className="font-semibold text-sm">Message Sent Successfully!</p>
                <p className="text-xs mt-0.5">Thank you for reaching out. I will reply to your email as soon as possible.</p>
              </div>
            </div>
          )}

          {error && (
            <div className="my-6 p-3 rounded-lg bg-rose-50 text-rose-700 text-xs flex items-center space-x-2 dark:bg-rose-950/60 dark:text-rose-300">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 pt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Your Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full px-3.5 py-2.5 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Your Email *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@domain.com"
                  className="w-full px-3.5 py-2.5 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Subject
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Question regarding article / Consulting / Collaboration"
                className="w-full px-3.5 py-2.5 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Message *
              </label>
              <textarea
                required
                rows={5}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Write your message here..."
                className="w-full px-3.5 py-2.5 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center space-x-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-lg transition-colors shadow-xs disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>{loading ? 'Sending Message...' : 'Send Message'}</span>
            </button>
          </form>
        </div>
      </div>

      <div className="lg:col-span-4">
        <Sidebar />
      </div>
    </div>
  );
}
