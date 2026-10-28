import { useState, useEffect } from 'react';
import {
  getAllAds,
  createAd,
  updateAd,
  deleteAd,
  uploadFile,
} from '../../lib/api.js';
import {
  Megaphone,
  Plus,
  Edit3,
  Trash2,
  Upload,
  Eye,
  MousePointerClick,
  CheckCircle2,
  AlertCircle,
  Code,
  Image as ImageIcon,
  Calendar,
  Power,
} from 'lucide-react';

const AD_SLOTS = [
  { value: 'header', label: 'Header (Top Banner)' },
  { value: 'sidebar_top', label: 'Sidebar Top' },
  { value: 'sidebar_bottom', label: 'Sidebar Bottom' },
  { value: 'in_article', label: 'In-Article (Above Post Body)' },
  { value: 'below_post', label: 'Below Post (After Article)' },
  { value: 'footer', label: 'Footer (Bottom Banner)' },
];

const emptyForm = {
  name: '',
  slot: 'sidebar_top',
  ad_type: 'image',
  image_url: '',
  link_url: '',
  script_code: '',
  width: '',
  height: '',
  position: 0,
  is_active: true,
  starts_at: '',
  ends_at: '',
};

export default function AdsAdmin() {
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [slotFilter, setSlotFilter] = useState('all');

  // Editor state
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [notice, setNotice] = useState({ type: '', text: '' });

  const showMessage = (type, text) => {
    setNotice({ type, text });
    setTimeout(() => setNotice({ type: '', text: '' }), 4000);
  };

  const loadAds = async () => {
    setLoading(true);
    try {
      const data = await getAllAds();
      setAds(data || []);
    } catch (err) {
      showMessage('error', err.message || 'Failed to load advertisements.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAds();
  }, []);

  const toInputDate = (isoStr) => {
    if (!isoStr) return '';
    try {
      return new Date(isoStr).toISOString().slice(0, 16);
    } catch {
      return '';
    }
  };

  const handleOpenNew = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const handleOpenEdit = (ad) => {
    setEditingId(ad.id);
    setForm({
      name: ad.name || '',
      slot: ad.slot || 'sidebar_top',
      ad_type: ad.ad_type || 'image',
      image_url: ad.image_url || '',
      link_url: ad.link_url || '',
      script_code: ad.script_code || '',
      width: ad.width ?? '',
      height: ad.height ?? '',
      position: ad.position ?? 0,
      is_active: Boolean(ad.is_active),
      starts_at: toInputDate(ad.starts_at),
      ends_at: toInputDate(ad.ends_at),
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploadingImage(true);
      const uploaded = await uploadFile(file, form.name || file.name);
      if (uploaded?.public_url) {
        setForm((prev) => ({ ...prev, image_url: uploaded.public_url }));
        showMessage('success', 'Ad banner uploaded to Cloudflare R2!');
      }
    } catch (err) {
      showMessage('error', err.message || 'Image upload failed.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      showMessage('error', 'Advertisement name is required.');
      return;
    }

    if (form.ad_type === 'image' && !form.image_url.trim()) {
      showMessage('error', 'Please upload or provide an Image URL for image ads.');
      return;
    }

    if (form.ad_type === 'script' && !form.script_code.trim()) {
      showMessage('error', 'Please provide HTML/JS script code for script ads.');
      return;
    }

    const payload = {
      name: form.name.trim(),
      slot: form.slot,
      ad_type: form.ad_type,
      image_url: form.ad_type === 'image' ? form.image_url.trim() : '',
      link_url: form.ad_type === 'image' ? form.link_url.trim() : '',
      script_code: form.ad_type === 'script' ? form.script_code : '',
      width: form.width !== '' ? Number(form.width) : null,
      height: form.height !== '' ? Number(form.height) : null,
      position: Number(form.position) || 0,
      is_active: Boolean(form.is_active),
      starts_at: form.starts_at ? new Date(form.starts_at).toISOString() : null,
      ends_at: form.ends_at ? new Date(form.ends_at).toISOString() : null,
    };

    try {
      setSaving(true);
      if (editingId) {
        await updateAd(editingId, payload);
        showMessage('success', 'Advertisement updated successfully.');
      } else {
        await createAd(payload);
        showMessage('success', 'Advertisement created successfully.');
      }
      setShowForm(false);
      setEditingId(null);
      setForm(emptyForm);
      loadAds();
    } catch (err) {
      showMessage('error', err.message || 'Failed to save advertisement.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (ad) => {
    try {
      await updateAd(ad.id, { is_active: !ad.is_active });
      showMessage('success', !ad.is_active ? 'Ad activated.' : 'Ad paused.');
      loadAds();
    } catch (err) {
      showMessage('error', err.message || 'Could not update ad status.');
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteAd(id);
      setConfirmDeleteId(null);
      showMessage('success', 'Advertisement deleted.');
      loadAds();
    } catch (err) {
      showMessage('error', err.message || 'Failed to delete advertisement.');
    }
  };

  const filteredAds =
    slotFilter === 'all' ? ads : ads.filter((a) => a.slot === slotFilter);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center space-x-2">
            <Megaphone className="w-6 h-6 text-indigo-600" />
            <span>Advertisement Manager</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Manage R2 image banners and Google AdSense / custom JS scripts across 6 placement slots.
          </p>
        </div>

        <button
          type="button"
          onClick={() => (showForm ? setShowForm(false) : handleOpenNew())}
          className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>{showForm ? 'Close Form' : 'New Advertisement'}</span>
        </button>
      </div>

      {/* Feedback Notice */}
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

      {/* Create / Edit Form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-slate-200 bg-white p-6 space-y-5 shadow-xs dark:border-slate-800 dark:bg-slate-900"
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              {editingId ? 'Edit Advertisement' : 'Create New Advertisement'}
            </h2>
            <span className="text-xs text-slate-400">
              Supports Cloudflare R2 Images & Script Injection
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold mb-1">Ad Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Sidebar Cloud Hosting Promo"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white dark:bg-slate-800 dark:border-slate-700"
              />
            </div>

            <div>
              <label className="block text-xs font-bold mb-1">Placement Slot *</label>
              <select
                value={form.slot}
                onChange={(e) => setForm({ ...form, slot: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white dark:bg-slate-800 dark:border-slate-700"
              >
                {AD_SLOTS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold mb-1">Ad Type *</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, ad_type: 'image' })}
                  className={`flex items-center justify-center space-x-1.5 py-2 rounded-lg text-xs font-semibold border ${
                    form.ad_type === 'image'
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'border-slate-300 text-slate-600 dark:border-slate-700 dark:text-slate-300'
                  }`}
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>Image Banner</span>
                </button>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, ad_type: 'script' })}
                  className={`flex items-center justify-center space-x-1.5 py-2 rounded-lg text-xs font-semibold border ${
                    form.ad_type === 'script'
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'border-slate-300 text-slate-600 dark:border-slate-700 dark:text-slate-300'
                  }`}
                >
                  <Code className="w-3.5 h-3.5" />
                  <span>HTML / JS Script</span>
                </button>
              </div>
            </div>
          </div>

          {/* Conditional Image Fields */}
          {form.ad_type === 'image' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200/80 dark:bg-slate-800/40 dark:border-slate-800">
              <div className="space-y-2">
                <label className="block text-xs font-bold">Banner Image URL *</label>
                <input
                  type="url"
                  placeholder="https://... or upload to R2 below"
                  value={form.image_url}
                  onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white dark:bg-slate-800 dark:border-slate-700"
                />
                <label className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold cursor-pointer">
                  <Upload className="w-3.5 h-3.5" />
                  <span>{uploadingImage ? 'Uploading to R2...' : 'Upload Image to R2'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={uploadingImage}
                    className="hidden"
                  />
                </label>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold">Target Click Link URL</label>
                <input
                  type="url"
                  placeholder="https://sponsor-website.com"
                  value={form.link_url}
                  onChange={(e) => setForm({ ...form, link_url: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white dark:bg-slate-800 dark:border-slate-700"
                />
                {form.image_url && (
                  <img
                    src={form.image_url}
                    alt="Banner preview"
                    className="max-h-24 rounded border border-slate-200 object-contain mt-2"
                  />
                )}
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2 dark:bg-slate-800/40 dark:border-slate-800">
              <label className="block text-xs font-bold">
                Raw HTML / JavaScript Code (e.g. Google AdSense) *
              </label>
              <textarea
                rows={5}
                value={form.script_code}
                onChange={(e) => setForm({ ...form, script_code: e.target.value })}
                placeholder={`<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"></script>\n<ins class="adsbygoogle" ...></ins>\n<script>(adsbygoogle = window.adsbygoogle || []).push({});</script>`}
                className="w-full p-3 text-xs font-mono rounded-lg border border-slate-300 bg-white dark:bg-slate-900 dark:border-slate-700"
              />
              <p className="text-[11px] text-slate-500">
                Note: <code className="font-mono">AdSlot</code> automatically recreates{' '}
                <code className="font-mono">&lt;script&gt;</code> nodes via{' '}
                <code className="font-mono">document.createElement(&apos;script&apos;)</code> so AdSense and external scripts execute properly.
              </p>
            </div>
          )}

          {/* Dimensions, Position & Schedule */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1">Width (px)</label>
              <input
                type="number"
                placeholder="Auto"
                value={form.width}
                onChange={(e) => setForm({ ...form, width: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white dark:bg-slate-800 dark:border-slate-700"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">Height (px)</label>
              <input
                type="number"
                placeholder="Auto"
                value={form.height}
                onChange={(e) => setForm({ ...form, height: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white dark:bg-slate-800 dark:border-slate-700"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">Position / Order</label>
              <input
                type="number"
                value={form.position}
                onChange={(e) => setForm({ ...form, position: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white dark:bg-slate-800 dark:border-slate-700"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">Starts At (Optional)</label>
              <input
                type="datetime-local"
                value={form.starts_at}
                onChange={(e) => setForm({ ...form, starts_at: e.target.value })}
                className="w-full px-2.5 py-2 text-xs rounded-lg border border-slate-300 bg-white dark:bg-slate-800 dark:border-slate-700"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">Ends At (Optional)</label>
              <input
                type="datetime-local"
                value={form.ends_at}
                onChange={(e) => setForm({ ...form, ends_at: e.target.value })}
                className="w-full px-2.5 py-2 text-xs rounded-lg border border-slate-300 bg-white dark:bg-slate-800 dark:border-slate-700"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <label className="inline-flex items-center space-x-2 text-xs font-semibold cursor-pointer">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span>Active immediately</span>
            </label>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 rounded-lg border border-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold disabled:opacity-50"
              >
                {saving ? 'Saving...' : editingId ? 'Update Ad' : 'Create Ad'}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Slot Filter Bar */}
      <div className="flex items-center space-x-1.5 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => setSlotFilter('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap ${
            slotFilter === 'all'
              ? 'bg-indigo-600 text-white'
              : 'bg-white border border-slate-200 text-slate-600 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300'
          }`}
        >
          All Slots ({ads.length})
        </button>
        {AD_SLOTS.map((s) => (
          <button
            key={s.value}
            type="button"
            onClick={() => setSlotFilter(s.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap ${
              slotFilter === s.value
                ? 'bg-indigo-600 text-white'
                : 'bg-white border border-slate-200 text-slate-600 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300'
            }`}
          >
            {s.value}
          </button>
        ))}
      </div>

      {/* Ads Table */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-xs dark:border-slate-800 dark:bg-slate-900">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-500">Loading advertisements...</div>
        ) : filteredAds.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <p className="text-sm text-slate-500">No advertisements configured for this slot.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
                  <th className="p-4 font-bold">Ad Name & Preview</th>
                  <th className="p-4 font-bold">Slot</th>
                  <th className="p-4 font-bold">Type</th>
                  <th className="p-4 font-bold">Schedule</th>
                  <th className="p-4 font-bold">Impressions / Clicks</th>
                  <th className="p-4 font-bold">Status</th>
                  <th className="p-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {filteredAds.map((ad) => {
                  const impressions = ad.impressions || 0;
                  const clicks = ad.clicks || 0;
                  const ctr = impressions > 0 ? ((clicks / impressions) * 100).toFixed(1) : '0.0';

                  return (
                    <tr key={ad.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                      <td className="p-4">
                        <div className="flex items-center space-x-3">
                          {ad.ad_type === 'image' && ad.image_url ? (
                            <img
                              src={ad.image_url}
                              alt={ad.name}
                              className="w-12 h-10 rounded object-cover border border-slate-200 shrink-0 dark:border-slate-700"
                            />
                          ) : (
                            <div className="w-12 h-10 rounded bg-slate-100 flex items-center justify-center text-slate-500 shrink-0 dark:bg-slate-800">
                              <Code className="w-4 h-4" />
                            </div>
                          )}
                          <div>
                            <p className="font-bold text-slate-900 dark:text-white">{ad.name}</p>
                            {ad.width && ad.height && (
                              <span className="text-[11px] text-slate-400">
                                {ad.width}×{ad.height}px
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="p-4 font-mono text-indigo-600 dark:text-indigo-400">
                        {ad.slot}
                      </td>

                      <td className="p-4 uppercase font-semibold text-[11px] text-slate-500">
                        {ad.ad_type}
                      </td>

                      <td className="p-4 text-[11px] text-slate-500">
                        {ad.starts_at || ad.ends_at ? (
                          <div className="space-y-0.5">
                            {ad.starts_at && (
                              <div className="flex items-center space-x-1">
                                <Calendar className="w-3 h-3 text-slate-400" />
                                <span>From: {new Date(ad.starts_at).toLocaleDateString()}</span>
                              </div>
                            )}
                            {ad.ends_at && (
                              <div className="flex items-center space-x-1">
                                <Calendar className="w-3 h-3 text-slate-400" />
                                <span>Until: {new Date(ad.ends_at).toLocaleDateString()}</span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400">Always on</span>
                        )}
                      </td>

                      <td className="p-4 font-mono">
                        <div className="flex items-center space-x-3">
                          <span className="inline-flex items-center space-x-1 text-slate-600 dark:text-slate-300" title="Impressions">
                            <Eye className="w-3.5 h-3.5 text-slate-400" />
                            <span>{impressions}</span>
                          </span>
                          <span className="inline-flex items-center space-x-1 text-indigo-600 dark:text-indigo-400" title="Clicks">
                            <MousePointerClick className="w-3.5 h-3.5" />
                            <span>{clicks}</span>
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 dark:bg-slate-800">
                            {ctr}% CTR
                          </span>
                        </div>
                      </td>

                      <td className="p-4">
                        <button
                          type="button"
                          onClick={() => handleToggleActive(ad)}
                          className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                            ad.is_active
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                          }`}
                        >
                          <Power className="w-3 h-3" />
                          <span>{ad.is_active ? 'Active' : 'Paused'}</span>
                        </button>
                      </td>

                      <td className="p-4 text-right whitespace-nowrap space-x-2">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(ad)}
                          className="inline-flex items-center space-x-1 px-2.5 py-1 rounded text-[11px] font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:text-indigo-300"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>Edit</span>
                        </button>

                        {confirmDeleteId === ad.id ? (
                          <span className="inline-flex items-center space-x-1">
                            <button
                              type="button"
                              onClick={() => handleDelete(ad.id)}
                              className="px-2 py-1 rounded bg-rose-600 text-white text-[11px] font-bold"
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
                            onClick={() => setConfirmDeleteId(ad.id)}
                            className="inline-flex items-center p-1 text-rose-500 hover:text-rose-700"
                            title="Delete ad"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
