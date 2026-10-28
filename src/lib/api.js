import { supabase } from './supabase.js';

/**
 * ==============================================================================
 * Theara Blog Data Access Layer (API)
 * All Supabase queries and backend operations are encapsulated here.
 * Components NEVER call supabase directly.
 * ==============================================================================
 */

// ------------------------------------------------------------------------------
// 1. PROFILES
// ------------------------------------------------------------------------------

export async function getProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Error fetching profile:', error);
    return null;
  }
  return data;
}

export async function updateProfile(userId, updates) {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ------------------------------------------------------------------------------
// 2. CATEGORIES
// ------------------------------------------------------------------------------

export async function getCategories() {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('name', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function getCategoryBySlug(slug) {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error) throw error;
  return data;
}

export async function createCategory({ name, slug, description = '' }) {
  const { data, error } = await supabase
    .from('categories')
    .insert([{ name, slug, description }])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateCategory(id, { name, slug, description = '' }) {
  const { data, error } = await supabase
    .from('categories')
    .update({ name, slug, description })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteCategory(id) {
  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return true;
}

// ------------------------------------------------------------------------------
// 3. TAGS
// ------------------------------------------------------------------------------

export async function getTags() {
  const { data, error } = await supabase
    .from('tags')
    .select('*')
    .order('name', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function getTagBySlug(slug) {
  const { data, error } = await supabase
    .from('tags')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error) throw error;
  return data;
}

export async function createTag({ name, slug }) {
  const { data, error } = await supabase
    .from('tags')
    .insert([{ name, slug }])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteTag(id) {
  const { error } = await supabase
    .from('tags')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return true;
}

// ------------------------------------------------------------------------------
// 4. POSTS
// ------------------------------------------------------------------------------

export async function getPosts({
  page = 1,
  limit = 9,
  categorySlug = null,
  tagSlug = null,
  search = '',
  status = 'published', // 'published', 'draft', 'archived', or 'all'
  isFeatured = null,
} = {}) {
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from('posts')
    .select(`
      id,
      author_id,
      category_id,
      title,
      slug,
      excerpt,
      content,
      content_format,
      cover_url,
      status,
      is_featured,
      views,
      reading_time,
      published_at,
      created_at,
      updated_at,
      categories (id, name, slug),
      profiles:author_id (id, full_name, avatar_url),
      post_tags (
        tags (id, name, slug)
      )
    `, { count: 'exact' });

  if (status !== 'all') {
    query = query.eq('status', status);
  }

  if (isFeatured !== null) {
    query = query.eq('is_featured', isFeatured);
  }

  if (categorySlug) {
    const category = await getCategoryBySlug(categorySlug);
    if (category) {
      query = query.eq('category_id', category.id);
    } else {
      return { posts: [], count: 0, totalPages: 0 };
    }
  }

  if (search && search.trim() !== '') {
    query = query.ilike('title', `%${search.trim()}%`);
  }

  // Order published posts by published_at desc, others by updated_at desc
  if (status === 'published') {
    query = query.order('published_at', { ascending: false, nullsFirst: false });
  } else {
    query = query.order('created_at', { ascending: false });
  }

  query = query.range(from, to);

  const { data, count, error } = await query;
  if (error) throw error;

  let posts = (data || []).map((item) => {
    const tags = (item.post_tags || [])
      .map((pt) => pt.tags)
      .filter(Boolean);
    return {
      ...item,
      category: item.categories,
      author: item.profiles,
      tags,
    };
  });

  // Client-side tag filtering if tagSlug was passed
  if (tagSlug) {
    posts = posts.filter((p) => p.tags.some((t) => t.slug === tagSlug));
  }

  const totalCount = count || posts.length;
  const totalPages = Math.ceil(totalCount / limit);

  return {
    posts,
    count: totalCount,
    totalPages,
    currentPage: page,
  };
}

export async function getPostBySlug(slug) {
  const { data, error } = await supabase
    .from('posts')
    .select(`
      id,
      author_id,
      category_id,
      title,
      slug,
      excerpt,
      content,
      content_format,
      cover_url,
      status,
      is_featured,
      views,
      reading_time,
      published_at,
      created_at,
      updated_at,
      categories (id, name, slug, description),
      profiles:author_id (id, full_name, avatar_url, bio),
      post_tags (
        tags (id, name, slug)
      )
    `)
    .eq('slug', slug)
    .single();

  if (error) {
    console.error('Error fetching post by slug:', error);
    return null;
  }

  const tags = (data.post_tags || []).map((pt) => pt.tags).filter(Boolean);

  return {
    ...data,
    category: data.categories,
    author: data.profiles,
    tags,
  };
}

export async function getPostById(id) {
  const { data, error } = await supabase
    .from('posts')
    .select(`
      id,
      author_id,
      category_id,
      title,
      slug,
      excerpt,
      content,
      content_format,
      cover_url,
      status,
      is_featured,
      views,
      reading_time,
      published_at,
      created_at,
      updated_at,
      categories (id, name, slug),
      post_tags (
        tag_id,
        tags (id, name, slug)
      )
    `)
    .eq('id', id)
    .single();

  if (error) throw error;

  const tags = (data.post_tags || []).map((pt) => pt.tags).filter(Boolean);
  const tagIds = (data.post_tags || []).map((pt) => pt.tag_id).filter(Boolean);

  return {
    ...data,
    category: data.categories,
    tags,
    tagIds,
  };
}

export async function createPost(postData, tagIds = []) {
  const {
    title,
    slug,
    excerpt = '',
    content = '',
    content_format = 'markdown',
    cover_url = '',
    status = 'draft',
    is_featured = false,
    reading_time = 1,
    category_id = null,
    author_id = null,
    published_at = null,
  } = postData;

  const actualPublishedAt =
    status === 'published' ? (published_at || new Date().toISOString()) : null;

  const { data: post, error } = await supabase
    .from('posts')
    .insert([
      {
        title,
        slug,
        excerpt,
        content,
        content_format,
        cover_url,
        status,
        is_featured,
        reading_time,
        category_id: category_id || null,
        author_id: author_id || null,
        published_at: actualPublishedAt,
      },
    ])
    .select()
    .single();

  if (error) throw error;

  // Insert post_tags junction
  if (tagIds.length > 0 && post) {
    const junctionRows = tagIds.map((tagId) => ({
      post_id: post.id,
      tag_id: tagId,
    }));
    const { error: tagError } = await supabase.from('post_tags').insert(junctionRows);
    if (tagError) console.error('Error attaching tags to post:', tagError);
  }

  return post;
}

export async function updatePost(id, postData, tagIds = null) {
  const updates = { ...postData, updated_at: new Date().toISOString() };

  if (updates.status === 'published' && !updates.published_at) {
    updates.published_at = new Date().toISOString();
  }

  const { data: post, error } = await supabase
    .from('posts')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  // Sync tags if tagIds is provided
  if (Array.isArray(tagIds)) {
    // Remove existing
    await supabase.from('post_tags').delete().eq('post_id', id);

    // Insert updated
    if (tagIds.length > 0) {
      const junctionRows = tagIds.map((tagId) => ({
        post_id: id,
        tag_id: tagId,
      }));
      await supabase.from('post_tags').insert(junctionRows);
    }
  }

  return post;
}

export async function deletePost(id) {
  const { error } = await supabase.from('posts').delete().eq('id', id);
  if (error) throw error;
  return true;
}

export async function recordPostView(postId) {
  try {
    const { error } = await supabase.rpc('increment_post_views', {
      p_post_id: postId,
    });
    if (error) {
      // Fallback if rpc is not available
      const { data } = await supabase
        .from('posts')
        .select('views')
        .eq('id', postId)
        .single();
      if (data) {
        await supabase
          .from('posts')
          .update({ views: (data.views || 0) + 1 })
          .eq('id', postId);
      }
    }
  } catch (err) {
    console.warn('Failed to increment post view:', err);
  }
}

// ------------------------------------------------------------------------------
// 5. COMMENTS
// ------------------------------------------------------------------------------

export async function getApprovedComments(postId) {
  const { data, error } = await supabase
    .from('comments')
    .select('*')
    .eq('post_id', postId)
    .eq('is_approved', true)
    .order('created_at', { ascending: true });

  if (error) throw error;

  // Build comment trees (parent/children)
  const comments = data || [];
  const map = {};
  const roots = [];

  comments.forEach((c) => {
    map[c.id] = { ...c, replies: [] };
  });

  comments.forEach((c) => {
    if (c.parent_id && map[c.parent_id]) {
      map[c.parent_id].replies.push(map[c.id]);
    } else {
      roots.push(map[c.id]);
    }
  });

  return roots;
}

export async function getAllComments() {
  const { data, error } = await supabase
    .from('comments')
    .select(`
      *,
      posts (id, title, slug)
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function addComment({
  postId,
  parentId = null,
  authorName,
  authorEmail,
  content,
}) {
  const { data, error } = await supabase
    .from('comments')
    .insert([
      {
        post_id: postId,
        parent_id: parentId || null,
        author_name: authorName,
        author_email: authorEmail,
        content,
        is_approved: false, // Per security rule, new comments start unapproved
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function approveComment(id) {
  const { data, error } = await supabase
    .from('comments')
    .update({ is_approved: true })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteComment(id) {
  const { error } = await supabase.from('comments').delete().eq('id', id);
  if (error) throw error;
  return true;
}

// ------------------------------------------------------------------------------
// 6. ADVERTISEMENTS
// ------------------------------------------------------------------------------

export async function getActiveAdsBySlot(slot) {
  const { data, error } = await supabase
    .from('ads')
    .select('*')
    .eq('slot', slot)
    .eq('is_active', true)
    .order('position', { ascending: true });

  if (error) {
    console.warn(`Error loading ads for slot ${slot}:`, error);
    return [];
  }

  const now = new Date();
  return (data || []).filter((ad) => {
    if (ad.starts_at && new Date(ad.starts_at) > now) return false;
    if (ad.ends_at && new Date(ad.ends_at) < now) return false;
    return true;
  });
}

export async function getAllAds() {
  const { data, error } = await supabase
    .from('ads')
    .select('*')
    .order('slot', { ascending: true })
    .order('position', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function createAd(adData) {
  const { data, error } = await supabase
    .from('ads')
    .insert([adData])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateAd(id, adData) {
  const { data, error } = await supabase
    .from('ads')
    .update(adData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteAd(id) {
  const { error } = await supabase.from('ads').delete().eq('id', id);
  if (error) throw error;
  return true;
}

export async function recordAdImpression(adId) {
  try {
    await supabase.rpc('record_ad_impression', { p_ad_id: adId });
  } catch (err) {
    console.warn('Ad impression record failed:', err);
  }
}

export async function recordAdClick(adId) {
  try {
    await supabase.rpc('record_ad_click', { p_ad_id: adId });
  } catch (err) {
    console.warn('Ad click record failed:', err);
  }
}

// ------------------------------------------------------------------------------
// 7. MEDIA LIBRARY & CLOUDFLARE R2 UPLOAD
// ------------------------------------------------------------------------------

export async function getMediaList() {
  const { data, error } = await supabase
    .from('media')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function createMediaRecord(mediaData) {
  const { data, error } = await supabase
    .from('media')
    .insert([mediaData])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteMediaRecord(id, objectKey) {
  // First call worker API to delete from R2 if desired
  try {
    const session = (await supabase.auth.getSession()).data.session;
    if (session?.access_token && objectKey) {
      await fetch(`/api/media/${encodeURIComponent(objectKey)}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });
    }
  } catch (err) {
    console.warn('R2 delete request skipped or failed:', err);
  }

  // Delete from media table
  const { error } = await supabase.from('media').delete().eq('id', id);
  if (error) throw error;
  return true;
}

/**
 * Upload file through POST /api/upload in the Worker (checks admin token)
 * Never upload direct from browser to R2.
 */
export async function uploadFile(file, altText = '') {
  const session = (await supabase.auth.getSession()).data.session;
  if (!session?.access_token) {
    throw new Error('Authentication required for file upload');
  }

  const formData = new FormData();
  formData.append('file', file);
  if (altText) formData.append('alt_text', altText);

  const response = await fetch('/api/upload', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(errText || 'Upload failed');
  }

  const result = await response.json();

  // If worker returned public_url and object_key, record in media table
  if (result?.public_url) {
    const record = await createMediaRecord({
      uploaded_by: session.user.id,
      object_key: result.object_key || result.file_name || file.name,
      public_url: result.public_url,
      file_name: file.name,
      mime_type: file.type || 'application/octet-stream',
      size_bytes: file.size,
      alt_text: altText || file.name,
    });
    return record;
  }

  return result;
}

// ------------------------------------------------------------------------------
// 8. CV (SECTIONS & ITEMS)
// ------------------------------------------------------------------------------

export async function getCvData(includeHidden = false) {
  let query = supabase
    .from('cv_sections')
    .select(`
      id,
      key,
      title,
      icon,
      position,
      is_visible,
      cv_items (
        id,
        section_id,
        label,
        value,
        subtitle,
        url,
        position
      )
    `)
    .order('position', { ascending: true });

  if (!includeHidden) {
    query = query.eq('is_visible', true);
  }

  const { data, error } = await query;
  if (error) throw error;

  return (data || []).map((sec) => ({
    ...sec,
    items: (sec.cv_items || []).sort((a, b) => a.position - b.position),
  }));
}

export async function createCvSection({ key, title, icon = '', position = 0, is_visible = true }) {
  const { data, error } = await supabase
    .from('cv_sections')
    .insert([{ key, title, icon, position, is_visible }])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateCvSection(id, updates) {
  const { data, error } = await supabase
    .from('cv_sections')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteCvSection(id) {
  const { error } = await supabase.from('cv_sections').delete().eq('id', id);
  if (error) throw error;
  return true;
}

export async function createCvItem({ section_id, label, value = '', subtitle = '', url = '', position = 0 }) {
  const { data, error } = await supabase
    .from('cv_items')
    .insert([{ section_id, label, value, subtitle, url, position }])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateCvItem(id, updates) {
  const { data, error } = await supabase
    .from('cv_items')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteCvItem(id) {
  const { error } = await supabase.from('cv_items').delete().eq('id', id);
  if (error) throw error;
  return true;
}

// ------------------------------------------------------------------------------
// 9. SITE SETTINGS
// ------------------------------------------------------------------------------

export async function getSiteSettings() {
  const { data, error } = await supabase.from('site_settings').select('*');
  if (error) throw error;

  const settings = {};
  (data || []).forEach((row) => {
    settings[row.key] = row.value;
  });

  return settings;
}

export async function updateSiteSetting(key, value) {
  const { data, error } = await supabase
    .from('site_settings')
    .upsert({
      key,
      value,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ------------------------------------------------------------------------------
// 10. SUBSCRIBERS
// ------------------------------------------------------------------------------

export async function subscribeNewsletter(email) {
  const cleanEmail = email.trim().toLowerCase();
  const { data, error } = await supabase
    .from('subscribers')
    .insert([{ email: cleanEmail, is_active: true }])
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      return { success: true, message: 'You are already subscribed!' };
    }
    throw error;
  }
  return { success: true, data };
}

export async function getSubscribers() {
  const { data, error } = await supabase
    .from('subscribers')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function deleteSubscriber(id) {
  const { error } = await supabase.from('subscribers').delete().eq('id', id);
  if (error) throw error;
  return true;
}

// ------------------------------------------------------------------------------
// 11. CONTACT MESSAGES
// ------------------------------------------------------------------------------

export async function sendContactMessage({ name, email, subject = '', message }) {
  const { data, error } = await supabase
    .from('contact_messages')
    .insert([
      {
        name,
        email,
        subject,
        message,
        is_read: false,
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getContactMessages() {
  const { data, error } = await supabase
    .from('contact_messages')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function markContactMessageRead(id, is_read = true) {
  const { data, error } = await supabase
    .from('contact_messages')
    .update({ is_read })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteContactMessage(id) {
  const { error } = await supabase.from('contact_messages').delete().eq('id', id);
  if (error) throw error;
  return true;
}

// ------------------------------------------------------------------------------
// 12. DASHBOARD OVERVIEW (Admin Only)
// ------------------------------------------------------------------------------

export async function getDashboardStats() {
  const [
    { count: totalPosts },
    { count: draftPosts },
    { count: pendingComments },
    { count: activeAds },
    { count: unreadMessages },
    { count: totalSubscribers },
  ] = await Promise.all([
    supabase.from('posts').select('*', { count: 'exact', head: true }),
    supabase.from('posts').select('*', { count: 'exact', head: true }).eq('status', 'draft'),
    supabase.from('comments').select('*', { count: 'exact', head: true }).eq('is_approved', false),
    supabase.from('ads').select('*', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('contact_messages').select('*', { count: 'exact', head: true }).eq('is_read', false),
    supabase.from('subscribers').select('*', { count: 'exact', head: true }),
  ]);

  return {
    totalPosts: totalPosts || 0,
    draftPosts: draftPosts || 0,
    pendingComments: pendingComments || 0,
    activeAds: activeAds || 0,
    unreadMessages: unreadMessages || 0,
    totalSubscribers: totalSubscribers || 0,
  };
}
