import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getPosts, updatePost, deletePost } from '../../lib/api.js';
import {
  Plus,
  Search,
  Edit3,
  Trash2,
  Eye,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Star,
  Globe,
  FileText,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

export default function PostsAdmin() {
  const [posts, setPosts] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [notice, setNotice] = useState({ type: '', text: '' });

  const showMessage = (type, text) => {
    setNotice({ type, text });
    setTimeout(() => setNotice({ type: '', text: '' }), 4000);
  };

  const fetchAllPosts = async () => {
    setLoading(true);
    try {
      const res = await getPosts({
        page,
        limit: 10,
        status: statusFilter,
        search,
      });
      setPosts(res.posts || []);
      setTotalPages(res.totalPages || 1);
      setTotalCount(res.count || 0);
    } catch (err) {
      showMessage('error', err.message || 'Failed to load posts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllPosts();
  }, [page, statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchAllPosts();
  };

  const handleTogglePublish = async (post) => {
    const nextStatus = post.status === 'published' ? 'draft' : 'published';
    try {
      await updatePost(post.id, {
        status: nextStatus,
        published_at:
          nextStatus === 'published'
            ? post.published_at || new Date().toISOString()
            : post.published_at,
      });
      showMessage(
        'success',
        nextStatus === 'published' ? 'Post published live!' : 'Post moved to drafts.'
      );
      fetchAllPosts();
    } catch (err) {
      showMessage('error', err.message || 'Could not update status.');
    }
  };

  const handleToggleFeatured = async (post) => {
    try {
      await updatePost(post.id, { is_featured: !post.is_featured });
      showMessage('success', !post.is_featured ? 'Marked as featured.' : 'Removed from featured.');
      fetchAllPosts();
    } catch (err) {
      showMessage('error', err.message || 'Could not update featured state.');
    }
  };

  const handleDeletePost = async (id) => {
    try {
      await deletePost(id);
      setConfirmDeleteId(null);
      showMessage('success', 'Post permanently deleted.');
      fetchAllPosts();
    } catch (err) {
      showMessage('error', err.message || 'Delete failed.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center space-x-2">
            <FileText className="w-6 h-6 text-indigo-600" />
            <span>Manage Posts ({totalCount})</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Create, edit, publish, unpublish, or feature blog articles.
          </p>
        </div>

        <Link
          to="/admin/posts/new"
          className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Write New Post</span>
        </Link>
      </div>

      {/* Feedback Banner */}
      {notice.text && (
        <div
          className={`p-3.5 rounded-xl text-xs font-medium flex items-center space-x-2 border ${
            notice.type === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-950/50 dark:border-rose-900 dark:text-rose-300'
              : 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/50 dark:border-emerald-900 dark:text-emerald-300'
          }`}
        >
          {notice.type === 'error' ? (
            <AlertCircle className="w-4 h-4 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          )}
          <span>{notice.text}</span>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center space-x-1.5 overflow-x-auto">
          {['all', 'published', 'draft', 'archived'].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => {
                setStatusFilter(st);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors ${
                statusFilter === st
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-64">
            <input
              type="text"
              placeholder="Search title..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
          </div>
          <button
            type="submit"
            className="px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 dark:bg-slate-700"
          >
            Filter
          </button>
        </form>
      </div>

      {/* Posts Table */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-xs dark:border-slate-800 dark:bg-slate-900">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-500">Loading posts...</div>
        ) : posts.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <p className="text-sm text-slate-500">No posts found matching your criteria.</p>
            <Link
              to="/admin/posts/new"
              className="inline-block text-xs font-semibold text-indigo-600 hover:underline"
            >
              Create your first post →
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
                  <th className="p-4 font-bold">Title & Slug</th>
                  <th className="p-4 font-bold">Category</th>
                  <th className="p-4 font-bold">Status</th>
                  <th className="p-4 font-bold">Views</th>
                  <th className="p-4 font-bold">Date</th>
                  <th className="p-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {posts.map((post) => (
                  <tr key={post.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                    <td className="p-4 max-w-xs">
                      <div className="flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={() => handleToggleFeatured(post)}
                          title={post.is_featured ? 'Featured post (click to unfeature)' : 'Mark as featured'}
                          className={`shrink-0 ${
                            post.is_featured ? 'text-amber-500' : 'text-slate-300 hover:text-amber-400 dark:text-slate-600'
                          }`}
                        >
                          <Star className="w-4 h-4 fill-current" />
                        </button>
                        <div className="truncate">
                          <Link
                            to={`/admin/posts/edit/${post.id}`}
                            className="font-bold text-slate-900 hover:text-indigo-600 dark:text-white dark:hover:text-indigo-400 block truncate"
                          >
                            {post.title}
                          </Link>
                          <span className="text-[11px] font-mono text-slate-400 block truncate">
                            /{post.slug}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="p-4 text-slate-600 dark:text-slate-300">
                      {post.category?.name || <span className="text-slate-400">—</span>}
                    </td>

                    <td className="p-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold capitalize ${
                          post.status === 'published'
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : post.status === 'draft'
                            ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                            : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                        }`}
                      >
                        {post.status}
                      </span>
                    </td>

                    <td className="p-4 font-mono text-slate-600 dark:text-slate-300">
                      <span className="inline-flex items-center space-x-1">
                        <Eye className="w-3.5 h-3.5 text-slate-400" />
                        <span>{post.views || 0}</span>
                      </span>
                    </td>

                    <td className="p-4 text-slate-500 whitespace-nowrap">
                      {new Date(post.published_at || post.created_at).toLocaleDateString()}
                    </td>

                    <td className="p-4 text-right whitespace-nowrap space-x-2">
                      <button
                        type="button"
                        onClick={() => handleTogglePublish(post)}
                        className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded text-[11px] font-semibold border transition-colors ${
                          post.status === 'published'
                            ? 'border-amber-200 text-amber-700 hover:bg-amber-50 dark:border-amber-800 dark:text-amber-300'
                            : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-300'
                        }`}
                      >
                        <Globe className="w-3 h-3" />
                        <span>{post.status === 'published' ? 'Unpublish' : 'Publish'}</span>
                      </button>

                      <Link
                        to={`/admin/posts/edit/${post.id}`}
                        className="inline-flex items-center space-x-1 px-2.5 py-1 rounded text-[11px] font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:text-indigo-300"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>Edit</span>
                      </Link>

                      {post.status === 'published' && (
                        <Link
                          to={`/post/${post.slug}`}
                          target="_blank"
                          className="inline-flex items-center p-1 text-slate-400 hover:text-indigo-600"
                          title="View live post"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                      )}

                      {confirmDeleteId === post.id ? (
                        <span className="inline-flex items-center space-x-1">
                          <button
                            type="button"
                            onClick={() => handleDeletePost(post.id)}
                            className="px-2 py-1 rounded bg-rose-600 text-white text-[11px] font-bold hover:bg-rose-700"
                          >
                            Confirm
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(null)}
                            className="px-2 py-1 rounded border border-slate-300 text-[11px]"
                          >
                            Cancel
                          </button>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(post.id)}
                          className="inline-flex items-center p-1 text-rose-500 hover:text-rose-700"
                          title="Delete post"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold disabled:opacity-40 dark:border-slate-700"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Prev</span>
          </button>
          <span className="text-xs text-slate-500">
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold disabled:opacity-40 dark:border-slate-700"
          >
            <span>Next</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
