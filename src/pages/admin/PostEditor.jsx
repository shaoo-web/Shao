import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { useAuth } from '../../lib/AuthContext.jsx';
import {
  getPostById,
  createPost,
  updatePost,
  getCategories,
  getTags,
  createTag,
  uploadFile,
} from '../../lib/api.js';
import {
  ArrowLeft,
  Save,
  Eye,
  Code,
  Columns,
  Upload,
  Tag as TagIcon,
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
  Image as ImageIcon,
} from 'lucide-react';

export default function PostEditor() {
  const { id } = useParams();
  const isEditing = Boolean(id);
  const navigate = useNavigate();
  const { user } = useAuth();

  // Form fields matching posts table schema
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [contentFormat, setContentFormat] = useState('markdown'); // 'markdown' | 'html'
  const [coverUrl, setCoverUrl] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [status, setStatus] = useState('draft'); // 'draft' | 'published' | 'archived'
  const [isFeatured, setIsFeatured] = useState(false);
  const [readingTime, setReadingTime] = useState(1);
  const [selectedTagIds, setSelectedTagIds] = useState([]);

  // Reference lists
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [newTagName, setNewTagName] = useState('');

  // UI states
  const [viewMode, setViewMode] = useState('split'); // 'write' | 'preview' | 'split'
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingInline, setUploadingInline] = useState(false);
  const [notice, setNotice] = useState({ type: '', text: '' });

  const slugify = (str) =>
    str
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

  // Auto-generate slug from title unless manually customized
  const handleTitleChange = (val) => {
    setTitle(val);
    if (!slugManuallyEdited && !isEditing) {
      setSlug(slugify(val));
    }
  };

  // Auto-calculate reading time when content changes
  useEffect(() => {
    const words = content
      .replace(/<[^>]*>/g, ' ')
      .trim()
      .split(/\s+/)
      .filter(Boolean).length;
    const est = Math.max(1, Math.ceil(words / 200));
    setReadingTime(est);
  }, [content]);

  // Load categories, tags, and post (if editing)
  useEffect(() => {
    let mounted = true;

    async function init() {
      try {
        const [cats, allTags] = await Promise.all([
          getCategories().catch(() => []),
          getTags().catch(() => []),
        ]);

        if (!mounted) return;
        setCategories(cats || []);
        setTags(allTags || []);

        if (isEditing) {
          const post = await getPostById(id);
          if (!mounted || !post) return;
          setTitle(post.title || '');
          setSlug(post.slug || '');
          setSlugManuallyEdited(true);
          setExcerpt(post.excerpt || '');
          setContent(post.content || '');
          setContentFormat(post.content_format || 'markdown');
          setCoverUrl(post.cover_url || '');
          setCategoryId(post.category_id || '');
          setStatus(post.status || 'draft');
          setIsFeatured(Boolean(post.is_featured));
          setReadingTime(post.reading_time || 1);
          setSelectedTagIds(post.tagIds || []);
        }
      } catch (err) {
        if (mounted) {
          setNotice({ type: 'error', text: err.message || 'Failed to load post data.' });
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    init();
    return () => {
      mounted = false;
    };
  }, [id, isEditing]);

  const toggleTag = (tagId) => {
    setSelectedTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  };

  const handleCreateQuickTag = async (e) => {
    e.preventDefault();
    if (!newTagName.trim()) return;
    const tagSlug = slugify(newTagName);
    try {
      const created = await createTag({ name: newTagName.trim(), slug: tagSlug });
      if (created) {
        setTags((prev) => [...prev, created]);
        setSelectedTagIds((prev) => [...prev, created.id]);
        setNewTagName('');
      }
    } catch (err) {
      setNotice({ type: 'error', text: err.message || 'Could not create tag.' });
    }
  };

  const handleCoverUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploadingCover(true);
      const uploaded = await uploadFile(file, title || file.name);
      if (uploaded?.public_url) {
        setCoverUrl(uploaded.public_url);
        setNotice({ type: 'success', text: 'Cover image uploaded to Cloudflare R2!' });
      }
    } catch (err) {
      setNotice({ type: 'error', text: err.message || 'Cover upload failed.' });
    } finally {
      setUploadingCover(false);
    }
  };

  const handleInlineImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploadingInline(true);
      const uploaded = await uploadFile(file, file.name);
      if (uploaded?.public_url) {
        const snippet =
          contentFormat === 'html'
            ? `\n<img src="${uploaded.public_url}" alt="${file.name}" />\n`
            : `\n![${file.name}](${uploaded.public_url})\n`;
        setContent((prev) => prev + snippet);
        setNotice({ type: 'success', text: 'Image uploaded and inserted into content!' });
      }
    } catch (err) {
      setNotice({ type: 'error', text: err.message || 'Image upload failed.' });
    } finally {
      setUploadingInline(false);
    }
  };

  const handleSave = async (targetStatus = status) => {
    if (!title.trim() || !slug.trim()) {
      setNotice({ type: 'error', text: 'Title and Slug are required.' });
      return;
    }

    try {
      setSaving(true);
      setNotice({ type: '', text: '' });

      const payload = {
        title: title.trim(),
        slug: slugify(slug),
        excerpt: excerpt.trim(),
        content,
        content_format: contentFormat,
        cover_url: coverUrl.trim(),
        category_id: categoryId || null,
        status: targetStatus,
        is_featured: isFeatured,
        reading_time: Number(readingTime) || 1,
        author_id: user?.id || null,
      };

      if (isEditing) {
        await updatePost(id, payload, selectedTagIds);
        setStatus(targetStatus);
        setNotice({ type: 'success', text: 'Post updated successfully!' });
      } else {
        const created = await createPost(payload, selectedTagIds);
        navigate(`/admin/posts/edit/${created.id}`, { replace: true });
      }
    } catch (err) {
      setNotice({ type: 'error', text: err.message || 'Failed to save post.' });
    } finally {
      setSaving(false);
    }
  };

  // Sanitize preview content via DOMPurify
  const renderPreviewHtml = () => {
    if (!content) return '<p class="text-slate-400 italic">Live preview will appear here...</p>';
    try {
      const raw = contentFormat === 'html' ? content : marked.parse(content);
      return DOMPurify.sanitize(raw);
    } catch (err) {
      return DOMPurify.sanitize(content);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-xs text-slate-500">
        Loading post editor...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4 dark:border-slate-800">
        <div className="flex items-center space-x-3">
          <Link
            to="/admin/posts"
            className="p-2 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 dark:text-white">
              {isEditing ? 'Edit Post' : 'Write New Post'}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {contentFormat === 'markdown' ? 'Markdown Mode' : 'HTML Mode'} • {readingTime} min read
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={saving}
            onClick={() => handleSave('draft')}
            className="px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-100 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 disabled:opacity-50"
          >
            Save as Draft
          </button>

          <button
            type="button"
            disabled={saving}
            onClick={() => handleSave('published')}
            className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{saving ? 'Saving...' : status === 'published' ? 'Update Published' : 'Publish Now'}</span>
          </button>
        </div>
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Editor Column */}
        <div className="lg:col-span-8 space-y-5">
          {/* Title & Auto Slug */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4 dark:border-slate-800 dark:bg-slate-900">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Article Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="e.g. How We Fixed a High-Concurrency PostgreSQL Lock in Production"
                className="w-full px-3.5 py-2.5 text-sm font-semibold rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  URL Slug *
                </label>
                <input
                  type="text"
                  required
                  value={slug}
                  onChange={(e) => {
                    setSlug(e.target.value);
                    setSlugManuallyEdited(true);
                  }}
                  placeholder="auto-generated-from-title"
                  className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-300 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Category
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200"
                >
                  <option value="">— Select Category —</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Short Excerpt / Summary
              </label>
              <textarea
                rows={2}
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                placeholder="Brief summary shown on article cards and SEO meta tags..."
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200"
              />
            </div>
          </div>

          {/* Content Editor & Live Preview */}
          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden dark:border-slate-800 dark:bg-slate-900">
            {/* Editor Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/60">
              <div className="flex items-center space-x-2">
                <select
                  value={contentFormat}
                  onChange={(e) => setContentFormat(e.target.value)}
                  className="px-2.5 py-1 text-xs font-semibold rounded border border-slate-300 bg-white dark:bg-slate-800 dark:border-slate-700"
                >
                  <option value="markdown">Markdown</option>
                  <option value="html">Raw HTML</option>
                </select>

                <label className="cursor-pointer inline-flex items-center space-x-1 px-2.5 py-1 rounded border border-slate-300 bg-white hover:bg-slate-100 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200">
                  <ImageIcon className="w-3.5 h-3.5 text-indigo-600" />
                  <span>{uploadingInline ? 'Uploading...' : 'Insert R2 Image'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleInlineImageUpload}
                    disabled={uploadingInline}
                    className="hidden"
                  />
                </label>
              </div>

              <div className="flex items-center space-x-1">
                <button
                  type="button"
                  onClick={() => setViewMode('write')}
                  className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded text-xs font-semibold ${
                    viewMode === 'write'
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-700'
                  }`}
                >
                  <Code className="w-3.5 h-3.5" />
                  <span>Write</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('split')}
                  className={`hidden sm:inline-flex items-center space-x-1 px-2.5 py-1 rounded text-xs font-semibold ${
                    viewMode === 'split'
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-700'
                  }`}
                >
                  <Columns className="w-3.5 h-3.5" />
                  <span>Split</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('preview')}
                  className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded text-xs font-semibold ${
                    viewMode === 'preview'
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-700'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Preview</span>
                </button>
              </div>
            </div>

            {/* Editor Panes */}
            <div
              className={`grid ${
                viewMode === 'split' ? 'grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-200 dark:divide-slate-800' : 'grid-cols-1'
              }`}
            >
              {(viewMode === 'write' || viewMode === 'split') && (
                <div className="p-0">
                  <textarea
                    rows={22}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder={
                      contentFormat === 'markdown'
                        ? '# Write your article in Markdown...\n\nUse ```js for code blocks.'
                        : '<h2>Write your article in HTML...</h2>'
                    }
                    className="w-full h-full p-4 text-xs font-mono leading-relaxed bg-white focus:outline-none text-slate-900 resize-y dark:bg-slate-900 dark:text-slate-100"
                  />
                </div>
              )}

              {(viewMode === 'preview' || viewMode === 'split') && (
                <div className="p-5 bg-slate-50/50 overflow-y-auto max-h-[560px] dark:bg-slate-950/40">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-3">
                    Live Sanitized Preview (DOMPurify)
                  </div>
                  <div
                    className="prose prose-slate max-w-none text-xs leading-relaxed text-slate-800 dark:text-slate-200
                      [&_h1]:text-xl [&_h1]:font-bold [&_h1]:mb-3
                      [&_h2]:text-lg [&_h2]:font-bold [&_h2]:mt-5 [&_h2]:mb-2
                      [&_h3]:text-base [&_h3]:font-bold [&_h3]:mt-4 [&_h3]:mb-2
                      [&_p]:mb-3
                      [&_pre]:bg-slate-900 [&_pre]:text-slate-100 [&_pre]:p-3 [&_pre]:rounded-lg [&_pre]:overflow-x-auto [&_pre]:my-3
                      [&_code]:bg-slate-200 [&_code]:text-indigo-700 [&_code]:px-1 [&_code]:rounded dark:[&_code]:bg-slate-800 dark:[&_code]:text-indigo-300
                      [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-3
                      [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-3
                      [&_img]:rounded-lg [&_img]:my-3"
                    dangerouslySetInnerHTML={{ __html: renderPreviewHtml() }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Sidebar Settings */}
        <div className="lg:col-span-4 space-y-5">
          {/* Publishing Options */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4 dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Post Settings
            </h3>

            <div>
              <label className="block text-xs font-semibold mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white dark:bg-slate-800 dark:border-slate-700"
              >
                <option value="draft">Draft (Hidden)</option>
                <option value="published">Published (Public)</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="text-xs font-semibold">Featured Post</label>
              <input
                type="checkbox"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1 flex items-center space-x-1">
                <Clock className="w-3.5 h-3.5 text-indigo-500" />
                <span>Reading Time (minutes)</span>
              </label>
              <input
                type="number"
                min={1}
                value={readingTime}
                onChange={(e) => setReadingTime(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white dark:bg-slate-800 dark:border-slate-700"
              />
            </div>
          </div>

          {/* Cover Image */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-3 dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Cover Image
            </h3>

            {coverUrl && (
              <div className="rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800">
                <img src={coverUrl} alt="Cover preview" className="w-full h-36 object-cover" />
              </div>
            )}

            <input
              type="url"
              placeholder="Paste image URL or upload below..."
              value={coverUrl}
              onChange={(e) => setCoverUrl(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white dark:bg-slate-800 dark:border-slate-700"
            />

            <label className="w-full cursor-pointer inline-flex items-center justify-center space-x-1.5 px-3 py-2 rounded-lg border border-dashed border-indigo-400 bg-indigo-50/50 hover:bg-indigo-50 text-indigo-600 text-xs font-semibold transition-colors dark:border-indigo-800 dark:bg-indigo-950/30 dark:text-indigo-300">
              <Upload className="w-3.5 h-3.5" />
              <span>{uploadingCover ? 'Uploading to R2...' : 'Upload Cover to R2'}</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleCoverUpload}
                disabled={uploadingCover}
                className="hidden"
              />
            </label>
          </div>

          {/* Tags Selector */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-3 dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center space-x-1">
              <TagIcon className="w-3.5 h-3.5 text-indigo-500" />
              <span>Tags</span>
            </h3>

            <div className="flex flex-wrap gap-1.5">
              {tags.map((t) => {
                const active = selectedTagIds.includes(t.id);
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => toggleTag(t.id)}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                      active
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
                    }`}
                  >
                    #{t.name}
                  </button>
                );
              })}
            </div>

            <form onSubmit={handleCreateQuickTag} className="flex gap-1.5 pt-2">
              <input
                type="text"
                placeholder="New tag name..."
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                className="flex-1 px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white dark:bg-slate-800 dark:border-slate-700"
              />
              <button
                type="submit"
                className="px-2.5 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 dark:bg-slate-700"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
