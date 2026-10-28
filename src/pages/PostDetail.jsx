import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { 
  getPostBySlug, 
  recordPostView, 
  getApprovedComments, 
  addComment 
} from '../lib/api.js';
import Sidebar from '../components/Sidebar.jsx';
import AdSlot from '../components/AdSlot.jsx';
import { 
  Calendar, 
  Clock, 
  Eye, 
  Tag, 
  User, 
  MessageSquare, 
  ArrowLeft, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';

export default function PostDetail() {
  const { slug } = useParams();

  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // New comment form state
  const [authorName, setAuthorName] = useState('');
  const [authorEmail, setAuthorEmail] = useState('');
  const [commentContent, setCommentContent] = useState('');
  const [replyToId, setReplyToId] = useState(null);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [commentSuccess, setCommentSuccess] = useState(false);
  const [commentError, setCommentError] = useState('');

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);

    getPostBySlug(slug)
      .then(async (fetchedPost) => {
        if (!mounted) return;
        if (!fetchedPost) {
          setError('Article not found.');
          setLoading(false);
          return;
        }

        setPost(fetchedPost);

        // Record post view counter
        recordPostView(fetchedPost.id);

        // Fetch approved comments
        try {
          const approved = await getApprovedComments(fetchedPost.id);
          if (mounted) setComments(approved || []);
        } catch (cErr) {
          console.warn('Failed to load comments:', cErr);
        }
      })
      .catch((err) => {
        if (mounted) setError(err.message || 'Error loading post.');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [slug]);

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!authorName.trim() || !authorEmail.trim() || !commentContent.trim()) {
      setCommentError('Please fill in your name, email, and comment message.');
      return;
    }

    try {
      setSubmittingComment(true);
      setCommentError('');
      await addComment({
        postId: post.id,
        parentId: replyToId,
        authorName: authorName.trim(),
        authorEmail: authorEmail.trim(),
        content: commentContent.trim(),
      });

      setCommentSuccess(true);
      setCommentContent('');
      setReplyToId(null);
    } catch (err) {
      setCommentError(err.message || 'Failed to submit comment. Please try again.');
    } finally {
      setSubmittingComment(false);
    }
  };

  // Convert and sanitize content
  const renderSanitizedContent = (rawContent, format = 'markdown') => {
    if (!rawContent) return '';
    try {
      const rawHtml = format === 'html' ? rawContent : marked.parse(rawContent);
      return DOMPurify.sanitize(rawHtml);
    } catch (e) {
      console.error('Markdown parsing error:', e);
      return DOMPurify.sanitize(rawContent);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-12 space-y-6 animate-pulse">
        <div className="h-4 bg-slate-200 rounded w-28 dark:bg-slate-800" />
        <div className="h-10 bg-slate-200 rounded w-3/4 dark:bg-slate-800" />
        <div className="h-64 bg-slate-200 rounded-xl dark:bg-slate-800" />
        <div className="space-y-3">
          <div className="h-4 bg-slate-200 rounded dark:bg-slate-800" />
          <div className="h-4 bg-slate-200 rounded w-5/6 dark:bg-slate-800" />
          <div className="h-4 bg-slate-200 rounded w-4/6 dark:bg-slate-800" />
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="text-center py-20">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
          {error || 'Article Not Found'}
        </h2>
        <p className="text-sm text-slate-500 mt-2 mb-6">
          The requested article may have been unpublished or removed.
        </p>
        <Link
          to="/"
          className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return Home</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Article Content Column */}
      <article className="lg:col-span-8 space-y-8">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center space-x-2 text-xs text-slate-500 dark:text-slate-400">
          <Link to="/" className="hover:text-indigo-600 flex items-center space-x-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>All Articles</span>
          </Link>
          {post.category && (
            <>
              <span>/</span>
              <Link
                to={`/category/${post.category.slug}`}
                className="hover:text-indigo-600 text-indigo-600 font-medium dark:text-indigo-400"
              >
                {post.category.name}
              </Link>
            </>
          )}
        </div>

        {/* Post Header */}
        <header className="space-y-4">
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
            {post.title}
          </h1>

          {post.excerpt && (
            <p className="text-base text-slate-600 dark:text-slate-300 italic leading-relaxed">
              {post.excerpt}
            </p>
          )}

          {/* Metadata bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 py-4 border-y border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                {post.author?.avatar_url ? (
                  <img
                    src={post.author.avatar_url}
                    alt={post.author.full_name || 'Author'}
                    className="w-7 h-7 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs dark:bg-indigo-950">
                    <User className="w-4 h-4" />
                  </div>
                )}
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {post.author?.full_name || 'Theara'}
                </span>
              </div>

              {post.published_at && (
                <span className="flex items-center">
                  <Calendar className="w-3.5 h-3.5 mr-1" />
                  {new Date(post.published_at).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
              )}

              <span className="flex items-center">
                <Clock className="w-3.5 h-3.5 mr-1" />
                {post.reading_time || 3} min read
              </span>
            </div>

            <div className="flex items-center space-x-4">
              <span className="flex items-center">
                <Eye className="w-3.5 h-3.5 mr-1" />
                {post.views || 0} views
              </span>
              <span className="flex items-center">
                <MessageSquare className="w-3.5 h-3.5 mr-1" />
                {comments.length} comments
              </span>
            </div>
          </div>
        </header>

        {/* Cover Image */}
        {post.cover_url && (
          <div className="rounded-xl overflow-hidden shadow-xs border border-slate-200 dark:border-slate-800">
            <img
              src={post.cover_url}
              alt={post.title}
              className="w-full max-h-[460px] object-cover"
            />
          </div>
        )}

        {/* In-Article Advertisement Slot */}
        <AdSlot slot="in_article" />

        {/* Article Body (Sanitized Markdown / HTML) */}
        <div
          className="theara-content prose prose-slate max-w-none text-slate-800 leading-relaxed dark:text-slate-200
            [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:tracking-tight [&_h2]:mt-8 [&_h2]:mb-4 [&_h2]:text-slate-900 dark:[&_h2]:text-white
            [&_h3]:text-xl [&_h3]:font-bold [&_h3]:mt-6 [&_h3]:mb-3 [&_h3]:text-slate-900 dark:[&_h3]:text-white
            [&_p]:mb-4 [&_p]:leading-relaxed
            [&_pre]:bg-slate-900 [&_pre]:text-slate-100 [&_pre]:p-4 [&_pre]:rounded-lg [&_pre]:overflow-x-auto [&_pre]:my-4 dark:[&_pre]:bg-slate-950 dark:[&_pre]:border dark:[&_pre]:border-slate-800
            [&_code]:bg-slate-100 [&_code]:text-indigo-600 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-xs [&_code]:font-mono dark:[&_code]:bg-slate-800 dark:[&_code]:text-indigo-400
            [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-4 [&_ul]:space-y-1
            [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-4 [&_ol]:space-y-1
            [&_blockquote]:border-l-4 [&_blockquote]:border-indigo-500 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-slate-600 dark:[&_blockquote]:text-slate-400
            [&_img]:rounded-lg [&_img]:my-4"
          dangerouslySetInnerHTML={{
            __html: renderSanitizedContent(post.content, post.content_format),
          }}
        />

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="pt-6 border-t border-slate-200 dark:border-slate-800">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center">
              <Tag className="w-3.5 h-3.5 mr-1.5 text-indigo-500" />
              Related Tags
            </h4>
            <div className="flex flex-wrap gap-2">
              {post.tags.map((t) => (
                <Link
                  key={t.id}
                  to={`/tag/${t.slug}`}
                  className="text-xs px-3 py-1 rounded-full bg-slate-100 text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors"
                >
                  #{t.name}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Below Post Ad Slot */}
        <AdSlot slot="below_post" />

        {/* Comments Section */}
        <section className="pt-8 border-t border-slate-200 dark:border-slate-800 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-2">
              <MessageSquare className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <span>Discussion ({comments.length})</span>
            </h3>
            <span className="text-xs text-slate-400">Moderated comments</span>
          </div>

          {/* Comments List */}
          {comments.length === 0 ? (
            <p className="text-sm text-slate-500 italic py-4">
              No comments yet. Share your thoughts or questions below!
            </p>
          ) : (
            <div className="space-y-4">
              {comments.map((c) => (
                <div
                  key={c.id}
                  className="rounded-xl border border-slate-200 bg-white p-4 space-y-2 dark:border-slate-800 dark:bg-slate-900"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                      {c.author_name}
                    </span>
                    <span className="text-xs text-slate-400">
                      {new Date(c.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                    {c.content}
                  </p>

                  {/* Render nested replies if any */}
                  {c.replies && c.replies.length > 0 && (
                    <div className="mt-3 pl-4 border-l-2 border-indigo-200 space-y-3 dark:border-indigo-900">
                      {c.replies.map((reply) => (
                        <div key={reply.id} className="pt-2">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-xs text-slate-900 dark:text-slate-100">
                              {reply.author_name}
                            </span>
                            <span className="text-[11px] text-slate-400">
                              {new Date(reply.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-xs text-slate-700 dark:text-slate-300 mt-1">
                            {reply.content}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Add Comment Form */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 dark:border-slate-800 dark:bg-slate-900">
            <h4 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-1">
              Leave a Comment
            </h4>
            <p className="text-xs text-slate-500 mb-4">
              Your email will remain private. Comments are reviewed before appearing publicly.
            </p>

            {commentSuccess && (
              <div className="mb-4 p-4 rounded-lg bg-emerald-50 text-emerald-800 text-xs flex items-center space-x-2 dark:bg-emerald-950/60 dark:text-emerald-300">
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                <span>
                  Thank you! Your comment has been submitted and is awaiting administrator approval.
                </span>
              </div>
            )}

            {commentError && (
              <div className="mb-4 p-3 rounded-lg bg-rose-50 text-rose-700 text-xs flex items-center space-x-2 dark:bg-rose-950/60 dark:text-rose-300">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{commentError}</span>
              </div>
            )}

            <form onSubmit={handleCommentSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Your Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                    placeholder="e.g. Alex"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Your Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={authorEmail}
                    onChange={(e) => setAuthorEmail(e.target.value)}
                    placeholder="alex@example.com"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Comment *
                </label>
                <textarea
                  required
                  rows={4}
                  value={commentContent}
                  onChange={(e) => setCommentContent(e.target.value)}
                  placeholder="Share your thoughts, suggestions, or feedback..."
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
                />
              </div>

              <button
                type="submit"
                disabled={submittingComment}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-lg transition-colors shadow-xs disabled:opacity-50"
              >
                {submittingComment ? 'Submitting...' : 'Post Comment'}
              </button>
            </form>
          </div>
        </section>
      </article>

      {/* Sidebar */}
      <div className="lg:col-span-4">
        <Sidebar />
      </div>
    </div>
  );
}
