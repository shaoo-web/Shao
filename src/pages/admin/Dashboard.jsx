import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  getDashboardStats,
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getAllComments,
  approveComment,
  deleteComment,
  getMediaList,
  uploadFile,
  deleteMediaRecord,
  getCvData,
  createCvSection,
  deleteCvSection,
  createCvItem,
  updateCvItem,
  deleteCvItem,
  getContactMessages,
  markContactMessageRead,
  deleteContactMessage,
  getSiteSettings,
  updateSiteSetting,
} from '../../lib/api.js';
import {
  FileText,
  FileEdit,
  MessageSquare,
  Megaphone,
  Mail,
  Users,
  Plus,
  Trash2,
  Check,
  Copy,
  Upload,
  Folder,
  Briefcase,
  Settings,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';

export default function Dashboard() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'overview';

  const [stats, setStats] = useState({
    totalPosts: 0,
    draftPosts: 0,
    pendingComments: 0,
    activeAds: 0,
    unreadMessages: 0,
    totalSubscribers: 0,
  });
  const [loadingStats, setLoadingStats] = useState(true);
  const [feedback, setFeedback] = useState({ type: '', text: '' });

  // Categories state
  const [categories, setCategories] = useState([]);
  const [catName, setCatName] = useState('');
  const [catSlug, setCatSlug] = useState('');
  const [catDesc, setCatDesc] = useState('');
  const [editingCatId, setEditingCatId] = useState(null);

  // Comments state
  const [comments, setComments] = useState([]);

  // Media state
  const [mediaList, setMediaList] = useState([]);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [altText, setAltText] = useState('');

  // CV state
  const [cvSections, setCvSections] = useState([]);
  const [newSecTitle, setNewSecTitle] = useState('');
  const [newSecKey, setNewSecKey] = useState('');
  const [newSecIcon, setNewSecIcon] = useState('briefcase');
  const [newItemSectionId, setNewItemSectionId] = useState('');
  const [newItemLabel, setNewItemLabel] = useState('');
  const [newItemSubtitle, setNewItemSubtitle] = useState('');
  const [newItemValue, setNewItemValue] = useState('');
  const [newItemUrl, setNewItemUrl] = useState('');

  // Messages state
  const [messages, setMessages] = useState([]);

  // Site settings state
  const [generalSettings, setGeneralSettings] = useState({
    site_title: 'Theara Blog',
    tagline: '',
    author_name: 'Theara',
    author_bio: '',
    avatar_url: '',
    cv_pdf_url: '',
    social_github: '',
    social_linkedin: '',
    social_twitter: '',
  });
  const [savingSettings, setSavingSettings] = useState(false);

  const showNotice = (type, text) => {
    setFeedback({ type, text });
    setTimeout(() => setFeedback({ type: '', text: '' }), 4000);
  };

  useEffect(() => {
    loadOverview();
  }, []);

  useEffect(() => {
    if (activeTab === 'categories') loadCategories();
    if (activeTab === 'comments') loadComments();
    if (activeTab === 'media') loadMedia();
    if (activeTab === 'cv') loadCv();
    if (activeTab === 'messages') loadMessages();
    if (activeTab === 'settings') loadSettings();
  }, [activeTab]);

  async function loadOverview() {
    setLoadingStats(true);
    try {
      const data = await getDashboardStats();
      setStats(data);
    } catch (err) {
      console.warn('Error loading dashboard stats:', err);
    } finally {
      setLoadingStats(false);
    }
  }

  async function loadCategories() {
    try {
      const data = await getCategories();
      setCategories(data || []);
    } catch (err) {
      showNotice('error', err.message);
    }
  }

  async function loadComments() {
    try {
      const data = await getAllComments();
      setComments(data || []);
    } catch (err) {
      showNotice('error', err.message);
    }
  }

  async function loadMedia() {
    try {
      const data = await getMediaList();
      setMediaList(data || []);
    } catch (err) {
      showNotice('error', err.message);
    }
  }

  async function loadCv() {
    try {
      const data = await getCvData(true);
      setCvSections(data || []);
      if (data?.length > 0 && !newItemSectionId) {
        setNewItemSectionId(data[0].id);
      }
    } catch (err) {
      showNotice('error', err.message);
    }
  }

  async function loadMessages() {
    try {
      const data = await getContactMessages();
      setMessages(data || []);
    } catch (err) {
      showNotice('error', err.message);
    }
  }

  async function loadSettings() {
    try {
      const data = await getSiteSettings();
      if (data?.general) {
        setGeneralSettings((prev) => ({ ...prev, ...data.general }));
      }
    } catch (err) {
      showNotice('error', err.message);
    }
  }

  // Category Handlers
  const handleSaveCategory = async (e) => {
    e.preventDefault();
    if (!catName.trim()) return;
    const slug =
      catSlug.trim() ||
      catName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

    try {
      if (editingCatId) {
        await updateCategory(editingCatId, { name: catName.trim(), slug, description: catDesc.trim() });
        showNotice('success', 'Category updated.');
      } else {
        await createCategory({ name: catName.trim(), slug, description: catDesc.trim() });
        showNotice('success', 'Category created.');
      }
      setCatName('');
      setCatSlug('');
      setCatDesc('');
      setEditingCatId(null);
      loadCategories();
    } catch (err) {
      showNotice('error', err.message);
    }
  };

  const handleDeleteCategory = async (id) => {
    try {
      await deleteCategory(id);
      showNotice('success', 'Category deleted.');
      loadCategories();
    } catch (err) {
      showNotice('error', err.message);
    }
  };

  // Comment Handlers
  const handleApproveComment = async (id) => {
    try {
      await approveComment(id);
      showNotice('success', 'Comment approved.');
      loadComments();
      loadOverview();
    } catch (err) {
      showNotice('error', err.message);
    }
  };

  const handleDeleteComment = async (id) => {
    try {
      await deleteComment(id);
      showNotice('success', 'Comment deleted.');
      loadComments();
      loadOverview();
    } catch (err) {
      showNotice('error', err.message);
    }
  };

  // Media Handlers
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploadingMedia(true);
      await uploadFile(file, altText.trim() || file.name);
      setAltText('');
      showNotice('success', 'File uploaded to Cloudflare R2.');
      loadMedia();
    } catch (err) {
      showNotice('error', err.message);
    } finally {
      setUploadingMedia(false);
    }
  };

  const handleDeleteMedia = async (item) => {
    try {
      await deleteMediaRecord(item.id, item.object_key);
      showNotice('success', 'Media deleted.');
      loadMedia();
    } catch (err) {
      showNotice('error', err.message);
    }
  };

  // CV Handlers
  const handleCreateCvSection = async (e) => {
    e.preventDefault();
    if (!newSecTitle.trim()) return;
    const key =
      newSecKey.trim() ||
      newSecTitle
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-');
    try {
      await createCvSection({
        key,
        title: newSecTitle.trim(),
        icon: newSecIcon,
        position: cvSections.length + 1,
        is_visible: true,
      });
      setNewSecTitle('');
      setNewSecKey('');
      showNotice('success', 'CV section added.');
      loadCv();
    } catch (err) {
      showNotice('error', err.message);
    }
  };

  const handleCreateCvItem = async (e) => {
    e.preventDefault();
    if (!newItemSectionId || !newItemLabel.trim()) return;
    try {
      await createCvItem({
        section_id: newItemSectionId,
        label: newItemLabel.trim(),
        subtitle: newItemSubtitle.trim(),
        value: newItemValue.trim(),
        url: newItemUrl.trim(),
        position: 0,
      });
      setNewItemLabel('');
      setNewItemSubtitle('');
      setNewItemValue('');
      setNewItemUrl('');
      showNotice('success', 'CV item added.');
      loadCv();
    } catch (err) {
      showNotice('error', err.message);
    }
  };

  // Settings Handler
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      setSavingSettings(true);
      await updateSiteSetting('general', generalSettings);
      showNotice('success', 'Site settings saved.');
    } catch (err) {
      showNotice('error', err.message);
    } finally {
      setSavingSettings(false);
    }
  };

  const statCards = [
    {
      label: 'Total Posts',
      value: stats.totalPosts,
      icon: FileText,
      color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 dark:text-indigo-400',
      link: '/admin/posts',
    },
    {
      label: 'Drafts',
      value: stats.draftPosts,
      icon: FileEdit,
      color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/60 dark:text-amber-400',
      link: '/admin/posts',
    },
    {
      label: 'Comments Waiting',
      value: stats.pendingComments,
      icon: MessageSquare,
      color: 'text-rose-600 bg-rose-50 dark:bg-rose-950/60 dark:text-rose-400',
      link: '/admin?tab=comments',
    },
    {
      label: 'Active Ads',
      value: stats.activeAds,
      icon: Megaphone,
      color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 dark:text-emerald-400',
      link: '/admin/ads',
    },
    {
      label: 'Unread Messages',
      value: stats.unreadMessages,
      icon: Mail,
      color: 'text-sky-600 bg-sky-50 dark:bg-sky-950/60 dark:text-sky-400',
      link: '/admin?tab=messages',
    },
    {
      label: 'Subscribers',
      value: stats.totalSubscribers,
      icon: Users,
      color: 'text-purple-600 bg-purple-50 dark:bg-purple-950/60 dark:text-purple-400',
      link: '/admin',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Feedback Banner */}
      {feedback.text && (
        <div
          className={`p-4 rounded-xl text-xs font-medium flex items-center space-x-2 border ${
            feedback.type === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-950/50 dark:border-rose-900 dark:text-rose-300'
              : 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/50 dark:border-emerald-900 dark:text-emerald-300'
          }`}
        >
          {feedback.type === 'error' ? (
            <AlertCircle className="w-4 h-4 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
                Dashboard Overview
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Monitor blog metrics, moderate comments, and publish articles.
              </p>
            </div>
            <Link
              to="/admin/posts/new"
              className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Write New Article</span>
            </Link>
          </div>

          {/* Count Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {statCards.map((card) => {
              const Icon = card.icon;
              return (
                <Link
                  key={card.label}
                  to={card.link}
                  className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs hover:shadow-md transition-all flex items-center justify-between dark:border-slate-800 dark:bg-slate-900"
                >
                  <div>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                      {card.label}
                    </p>
                    <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
                      {loadingStats ? '...' : card.value}
                    </p>
                  </div>
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${card.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Quick Management Modules */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-4 dark:border-slate-800 dark:bg-slate-900">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Content & Taxonomy
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Manage articles, organize categories, upload images to Cloudflare R2, or update your CV.
              </p>
              <div className="grid grid-cols-2 gap-2.5 pt-2">
                <Link
                  to="/admin/posts"
                  className="p-3 rounded-lg border border-slate-200 hover:border-indigo-500 text-xs font-semibold text-slate-700 hover:text-indigo-600 dark:border-slate-800 dark:text-slate-200"
                >
                  Manage Posts →
                </Link>
                <button
                  type="button"
                  onClick={() => setSearchParams({ tab: 'categories' })}
                  className="p-3 text-left rounded-lg border border-slate-200 hover:border-indigo-500 text-xs font-semibold text-slate-700 hover:text-indigo-600 dark:border-slate-800 dark:text-slate-200"
                >
                  Categories →
                </button>
                <button
                  type="button"
                  onClick={() => setSearchParams({ tab: 'media' })}
                  className="p-3 text-left rounded-lg border border-slate-200 hover:border-indigo-500 text-xs font-semibold text-slate-700 hover:text-indigo-600 dark:border-slate-800 dark:text-slate-200"
                >
                  Media Library (R2) →
                </button>
                <button
                  type="button"
                  onClick={() => setSearchParams({ tab: 'cv' })}
                  className="p-3 text-left rounded-lg border border-slate-200 hover:border-indigo-500 text-xs font-semibold text-slate-700 hover:text-indigo-600 dark:border-slate-800 dark:text-slate-200"
                >
                  CV / Resume Editor →
                </button>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-4 dark:border-slate-800 dark:bg-slate-900">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Community & Monetization
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Approve reader comments, configure banner/AdSense slots, and read contact inquiries.
              </p>
              <div className="grid grid-cols-2 gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setSearchParams({ tab: 'comments' })}
                  className="p-3 text-left rounded-lg border border-slate-200 hover:border-indigo-500 text-xs font-semibold text-slate-700 hover:text-indigo-600 dark:border-slate-800 dark:text-slate-200"
                >
                  Comments ({stats.pendingComments} waiting) →
                </button>
                <Link
                  to="/admin/ads"
                  className="p-3 rounded-lg border border-slate-200 hover:border-indigo-500 text-xs font-semibold text-slate-700 hover:text-indigo-600 dark:border-slate-800 dark:text-slate-200"
                >
                  Manage Ads →
                </Link>
                <button
                  type="button"
                  onClick={() => setSearchParams({ tab: 'messages' })}
                  className="p-3 text-left rounded-lg border border-slate-200 hover:border-indigo-500 text-xs font-semibold text-slate-700 hover:text-indigo-600 dark:border-slate-800 dark:text-slate-200"
                >
                  Contact Messages →
                </button>
                <button
                  type="button"
                  onClick={() => setSearchParams({ tab: 'settings' })}
                  className="p-3 text-left rounded-lg border border-slate-200 hover:border-indigo-500 text-xs font-semibold text-slate-700 hover:text-indigo-600 dark:border-slate-800 dark:text-slate-200"
                >
                  Site Settings →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CATEGORIES TAB */}
      {activeTab === 'categories' && (
        <div className="space-y-6">
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center space-x-2">
            <Folder className="w-6 h-6 text-indigo-600" />
            <span>Manage Categories</span>
          </h1>

          <form
            onSubmit={handleSaveCategory}
            className="rounded-xl border border-slate-200 bg-white p-6 space-y-4 dark:border-slate-800 dark:bg-slate-900"
          >
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              {editingCatId ? 'Rename / Edit Category' : 'Create Category'}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <input
                type="text"
                required
                placeholder="Category Name"
                value={catName}
                onChange={(e) => setCatName(e.target.value)}
                className="px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white dark:bg-slate-800 dark:border-slate-700"
              />
              <input
                type="text"
                placeholder="Slug (optional auto)"
                value={catSlug}
                onChange={(e) => setCatSlug(e.target.value)}
                className="px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white dark:bg-slate-800 dark:border-slate-700"
              />
              <input
                type="text"
                placeholder="Short description"
                value={catDesc}
                onChange={(e) => setCatDesc(e.target.value)}
                className="px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white dark:bg-slate-800 dark:border-slate-700"
              />
            </div>
            <div className="flex items-center space-x-2">
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold"
              >
                {editingCatId ? 'Update Category' : 'Add Category'}
              </button>
              {editingCatId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingCatId(null);
                    setCatName('');
                    setCatSlug('');
                    setCatDesc('');
                  }}
                  className="px-3 py-2 rounded-lg border border-slate-300 text-xs"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>

          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden dark:border-slate-800 dark:bg-slate-900">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/50">
                  <th className="p-3.5 font-bold">Name</th>
                  <th className="p-3.5 font-bold">Slug</th>
                  <th className="p-3.5 font-bold">Description</th>
                  <th className="p-3.5 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {categories.map((c) => (
                  <tr key={c.id}>
                    <td className="p-3.5 font-semibold text-slate-900 dark:text-white">{c.name}</td>
                    <td className="p-3.5 font-mono text-slate-500">{c.slug}</td>
                    <td className="p-3.5 text-slate-500">{c.description}</td>
                    <td className="p-3.5 text-right space-x-2">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingCatId(c.id);
                          setCatName(c.name);
                          setCatSlug(c.slug);
                          setCatDesc(c.description || '');
                        }}
                        className="text-indigo-600 hover:underline font-medium"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteCategory(c.id)}
                        className="text-rose-600 hover:underline font-medium"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* COMMENTS TAB */}
      {activeTab === 'comments' && (
        <div className="space-y-6">
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center space-x-2">
            <MessageSquare className="w-6 h-6 text-indigo-600" />
            <span>Comment Moderation</span>
          </h1>

          <div className="space-y-3">
            {comments.length === 0 ? (
              <p className="text-xs text-slate-500 py-8 text-center">No comments recorded yet.</p>
            ) : (
              comments.map((c) => (
                <div
                  key={c.id}
                  className="rounded-xl border border-slate-200 bg-white p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 dark:border-slate-800 dark:bg-slate-900"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-xs text-slate-900 dark:text-white">
                        {c.author_name}
                      </span>
                      <span className="text-[11px] text-slate-400">({c.author_email})</span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          c.is_approved
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                        }`}
                      >
                        {c.is_approved ? 'Approved' : 'Pending Approval'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 dark:text-slate-300">{c.content}</p>
                    {c.posts && (
                      <p className="text-[11px] text-slate-400">
                        On article: <strong className="text-slate-600 dark:text-slate-300">{c.posts.title}</strong>
                      </p>
                    )}
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    {!c.is_approved && (
                      <button
                        type="button"
                        onClick={() => handleApproveComment(c.id)}
                        className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Approve</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDeleteComment(c.id)}
                      className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-semibold dark:bg-rose-950/50 dark:text-rose-400"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* MEDIA LIBRARY TAB */}
      {activeTab === 'media' && (
        <div className="space-y-6">
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            Cloudflare R2 Media Library
          </h1>

          <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-4 dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-sm font-bold">Upload Image or PDF via Worker API (/api/upload)</h3>
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <input
                type="text"
                placeholder="Alt text / description (optional)"
                value={altText}
                onChange={(e) => setAltText(e.target.value)}
                className="w-full sm:w-64 px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white dark:bg-slate-800 dark:border-slate-700"
              />
              <label className="cursor-pointer inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold">
                <Upload className="w-4 h-4" />
                <span>{uploadingMedia ? 'Uploading...' : 'Select File & Upload'}</span>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={handleFileUpload}
                  disabled={uploadingMedia}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {mediaList.map((item) => (
              <div
                key={item.id}
                className="rounded-xl border border-slate-200 bg-white overflow-hidden flex flex-col justify-between dark:border-slate-800 dark:bg-slate-900"
              >
                {item.mime_type?.startsWith('image/') ? (
                  <img
                    src={item.public_url}
                    alt={item.alt_text || item.file_name}
                    className="w-full h-40 object-cover bg-slate-100 dark:bg-slate-800"
                  />
                ) : (
                  <div className="w-full h-40 flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-xs font-mono text-slate-500">
                    {item.file_name}
                  </div>
                )}
                <div className="p-3 space-y-2">
                  <p className="text-xs font-semibold truncate">{item.file_name}</p>
                  <div className="flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(item.public_url);
                        showNotice('success', 'URL copied to clipboard!');
                      }}
                      className="inline-flex items-center space-x-1 text-[11px] font-semibold text-indigo-600 hover:underline"
                    >
                      <Copy className="w-3 h-3" />
                      <span>Copy URL</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteMedia(item)}
                      className="text-[11px] font-semibold text-rose-600 hover:underline"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CV EDITOR TAB */}
      {activeTab === 'cv' && (
        <div className="space-y-6">
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center space-x-2">
            <Briefcase className="w-6 h-6 text-indigo-600" />
            <span>CV / Resume Editor</span>
          </h1>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Add Section */}
            <form
              onSubmit={handleCreateCvSection}
              className="rounded-xl border border-slate-200 bg-white p-5 space-y-3 dark:border-slate-800 dark:bg-slate-900"
            >
              <h3 className="text-sm font-bold">Add CV Section</h3>
              <input
                type="text"
                required
                placeholder="Section Title (e.g. Work Experience)"
                value={newSecTitle}
                onChange={(e) => setNewSecTitle(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white dark:bg-slate-800 dark:border-slate-700"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Key (e.g. experience)"
                  value={newSecKey}
                  onChange={(e) => setNewSecKey(e.target.value)}
                  className="px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white dark:bg-slate-800 dark:border-slate-700"
                />
                <select
                  value={newSecIcon}
                  onChange={(e) => setNewSecIcon(e.target.value)}
                  className="px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white dark:bg-slate-800 dark:border-slate-700"
                >
                  <option value="briefcase">Briefcase Icon</option>
                  <option value="graduation-cap">Graduation Icon</option>
                  <option value="code">Code Icon</option>
                  <option value="folder-git-2">Project Icon</option>
                </select>
              </div>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold"
              >
                Create Section
              </button>
            </form>

            {/* Add CV Row Item */}
            <form
              onSubmit={handleCreateCvItem}
              className="rounded-xl border border-slate-200 bg-white p-5 space-y-3 dark:border-slate-800 dark:bg-slate-900"
            >
              <h3 className="text-sm font-bold">Add CV Entry Row</h3>
              <select
                value={newItemSectionId}
                onChange={(e) => setNewItemSectionId(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white dark:bg-slate-800 dark:border-slate-700"
              >
                <option value="">Select Section...</option>
                {cvSections.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.title}
                  </option>
                ))}
              </select>
              <input
                type="text"
                required
                placeholder="Role / Title / Skill Label *"
                value={newItemLabel}
                onChange={(e) => setNewItemLabel(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white dark:bg-slate-800 dark:border-slate-700"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Subtitle (Company / Date)"
                  value={newItemSubtitle}
                  onChange={(e) => setNewItemSubtitle(e.target.value)}
                  className="px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white dark:bg-slate-800 dark:border-slate-700"
                />
                <input
                  type="url"
                  placeholder="Optional Link URL"
                  value={newItemUrl}
                  onChange={(e) => setNewItemUrl(e.target.value)}
                  className="px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white dark:bg-slate-800 dark:border-slate-700"
                />
              </div>
              <textarea
                rows={2}
                placeholder="Details / accomplishments..."
                value={newItemValue}
                onChange={(e) => setNewItemValue(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white dark:bg-slate-800 dark:border-slate-700"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold"
              >
                Add Entry to CV
              </button>
            </form>
          </div>

          {/* Existing CV Sections & Rows */}
          <div className="space-y-4">
            {cvSections.map((sec) => (
              <div
                key={sec.id}
                className="rounded-xl border border-slate-200 bg-white p-5 space-y-3 dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-2 dark:border-slate-800">
                  <h4 className="font-bold text-sm">{sec.title}</h4>
                  <button
                    type="button"
                    onClick={async () => {
                      await deleteCvSection(sec.id);
                      loadCv();
                    }}
                    className="text-xs text-rose-600 hover:underline"
                  >
                    Delete Section
                  </button>
                </div>
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {(sec.items || []).map((item) => (
                    <div key={item.id} className="py-2.5 flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs font-bold">{item.label}</p>
                        {item.subtitle && <p className="text-[11px] text-slate-400">{item.subtitle}</p>}
                        {item.value && <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">{item.value}</p>}
                      </div>
                      <button
                        type="button"
                        onClick={async () => {
                          await deleteCvItem(item.id);
                          loadCv();
                        }}
                        className="text-xs text-rose-500 hover:underline shrink-0"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CONTACT MESSAGES TAB */}
      {activeTab === 'messages' && (
        <div className="space-y-6">
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center space-x-2">
            <Mail className="w-6 h-6 text-indigo-600" />
            <span>Contact Messages</span>
          </h1>

          <div className="space-y-3">
            {messages.length === 0 ? (
              <p className="text-xs text-slate-500 py-8 text-center">No contact messages yet.</p>
            ) : (
              messages.map((m) => (
                <div
                  key={m.id}
                  className="rounded-xl border border-slate-200 bg-white p-5 space-y-2 dark:border-slate-800 dark:bg-slate-900"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-sm text-slate-900 dark:text-white">{m.name}</span>
                      <span className="text-xs text-slate-400 ml-2">&lt;{m.email}&gt;</span>
                      {!m.is_read && (
                        <span className="ml-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-300">
                          NEW
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      {!m.is_read && (
                        <button
                          type="button"
                          onClick={async () => {
                            await markContactMessageRead(m.id, true);
                            loadMessages();
                            loadOverview();
                          }}
                          className="text-xs text-indigo-600 hover:underline font-medium"
                        >
                          Mark Read
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={async () => {
                          await deleteContactMessage(m.id);
                          loadMessages();
                          loadOverview();
                        }}
                        className="text-xs text-rose-600 hover:underline font-medium"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  {m.subject && <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">{m.subject}</p>}
                  <p className="text-xs text-slate-600 dark:text-slate-300 whitespace-pre-line">{m.message}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* SITE SETTINGS TAB */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center space-x-2">
            <Settings className="w-6 h-6 text-indigo-600" />
            <span>Site Settings</span>
          </h1>

          <form
            onSubmit={handleSaveSettings}
            className="rounded-xl border border-slate-200 bg-white p-6 space-y-4 dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold mb-1">Site Title</label>
                <input
                  type="text"
                  value={generalSettings.site_title || ''}
                  onChange={(e) => setGeneralSettings({ ...generalSettings, site_title: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white dark:bg-slate-800 dark:border-slate-700"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Author Name</label>
                <input
                  type="text"
                  value={generalSettings.author_name || ''}
                  onChange={(e) => setGeneralSettings({ ...generalSettings, author_name: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white dark:bg-slate-800 dark:border-slate-700"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">Tagline</label>
              <input
                type="text"
                value={generalSettings.tagline || ''}
                onChange={(e) => setGeneralSettings({ ...generalSettings, tagline: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white dark:bg-slate-800 dark:border-slate-700"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">Author Bio</label>
              <textarea
                rows={3}
                value={generalSettings.author_bio || ''}
                onChange={(e) => setGeneralSettings({ ...generalSettings, author_bio: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white dark:bg-slate-800 dark:border-slate-700"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold mb-1">Avatar Image URL</label>
                <input
                  type="url"
                  value={generalSettings.avatar_url || ''}
                  onChange={(e) => setGeneralSettings({ ...generalSettings, avatar_url: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white dark:bg-slate-800 dark:border-slate-700"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">CV PDF Download Link</label>
                <input
                  type="url"
                  value={generalSettings.cv_pdf_url || ''}
                  onChange={(e) => setGeneralSettings({ ...generalSettings, cv_pdf_url: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white dark:bg-slate-800 dark:border-slate-700"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold mb-1">GitHub URL</label>
                <input
                  type="url"
                  value={generalSettings.social_github || ''}
                  onChange={(e) => setGeneralSettings({ ...generalSettings, social_github: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white dark:bg-slate-800 dark:border-slate-700"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">LinkedIn URL</label>
                <input
                  type="url"
                  value={generalSettings.social_linkedin || ''}
                  onChange={(e) => setGeneralSettings({ ...generalSettings, social_linkedin: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white dark:bg-slate-800 dark:border-slate-700"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Twitter URL</label>
                <input
                  type="url"
                  value={generalSettings.social_twitter || ''}
                  onChange={(e) => setGeneralSettings({ ...generalSettings, social_twitter: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white dark:bg-slate-800 dark:border-slate-700"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={savingSettings}
              className="px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold disabled:opacity-50"
            >
              {savingSettings ? 'Saving...' : 'Save Site Settings'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
