/**
 * ==============================================================================
 * Project: Theara Blog
 * File: worker/index.js
 * Description: Cloudflare Worker serving the React SPA, handling admin-only
 *              uploads to Cloudflare R2 (POST /api/upload, DELETE /api/media/*),
 *              and serving R2 assets at /cdn/*.
 * ==============================================================================
 */

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml',
  'image/avif',
  'application/pdf',
]);

const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024; // 20 MB

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

function jsonResponse(body, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...CORS_HEADERS,
      ...extraHeaders,
    },
  });
}

/**
 * Verify that the incoming request has a valid Supabase Bearer token
 * AND that the user has is_admin = true in public.profiles.
 */
async function verifyAdminToken(request, env) {
  const authHeader = request.headers.get('Authorization') || '';
  if (!authHeader.startsWith('Bearer ')) {
    return { ok: false, status: 401, error: 'Missing or invalid Authorization header' };
  }

  const token = authHeader.slice(7).trim();
  if (!token) {
    return { ok: false, status: 401, error: 'Empty bearer token' };
  }

  const supabaseUrl = env.SUPABASE_URL || env.VITE_SUPABASE_URL;
  const supabaseAnonKey = env.SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return {
      ok: false,
      status: 500,
      error: 'Worker environment missing SUPABASE_URL or SUPABASE_ANON_KEY',
    };
  }

  // 1. Verify token with Supabase Auth
  const userRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: {
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${token}`,
    },
  });

  if (!userRes.ok) {
    return { ok: false, status: 401, error: 'Invalid or expired Supabase session token' };
  }

  const user = await userRes.json();
  if (!user?.id) {
    return { ok: false, status: 401, error: 'User not found' };
  }

  // 2. Check profiles.is_admin in Supabase REST API
  const profileUrl = `${supabaseUrl}/rest/v1/profiles?id=eq.${encodeURIComponent(
    user.id
  )}&select=id,email,is_admin`;

  const profileRes = await fetch(profileUrl, {
    headers: {
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  });

  if (!profileRes.ok) {
    return { ok: false, status: 403, error: 'Failed to verify administrator profile' };
  }

  const profiles = await profileRes.json();
  const profile = Array.isArray(profiles) ? profiles[0] : null;

  if (!profile || profile.is_admin !== true) {
    return { ok: false, status: 403, error: 'Forbidden: Administrator privileges required' };
  }

  return { ok: true, user, profile };
}

/**
 * Sanitize filename and build a structured R2 object key:
 * uploads/YYYY-MM/<timestamp>-<random>-<clean_name>
 */
function generateObjectKey(originalName = 'file') {
  const now = new Date();
  const yearMonth = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  const cleanName = originalName
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);

  return `uploads/${yearMonth}/${Date.now()}-${randomSuffix}-${cleanName || 'asset'}`;
}

/**
 * Handle POST /api/upload
 */
async function handleUpload(request, env, url) {
  const auth = await verifyAdminToken(request, env);
  if (!auth.ok) {
    return jsonResponse({ error: auth.error }, auth.status);
  }

  if (!env.MEDIA_BUCKET) {
    return jsonResponse({ error: 'Cloudflare R2 bucket binding MEDIA_BUCKET is not configured' }, 500);
  }

  let formData;
  try {
    formData = await request.formData();
  } catch {
    return jsonResponse({ error: 'Invalid multipart/form-data payload' }, 400);
  }

  const file = formData.get('file');
  if (!file || typeof file.arrayBuffer !== 'function') {
    return jsonResponse({ error: 'No file field provided in form data' }, 400);
  }

  const mimeType = file.type || 'application/octet-stream';
  if (!ALLOWED_MIME_TYPES.has(mimeType)) {
    return jsonResponse(
      { error: `Unsupported file type: ${mimeType}. Allowed: images and PDF.` },
      415
    );
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return jsonResponse(
      { error: `File exceeds maximum size of ${MAX_FILE_SIZE_BYTES / (1024 * 1024)}MB` },
      413
    );
  }

  const objectKey = generateObjectKey(file.name);
  const arrayBuffer = await file.arrayBuffer();

  await env.MEDIA_BUCKET.put(objectKey, arrayBuffer, {
    httpMetadata: {
      contentType: mimeType,
      cacheControl: 'public, max-age=31536000, immutable',
    },
    customMetadata: {
      uploadedBy: auth.user.id,
      originalName: file.name || '',
    },
  });

  const cdnBase = env.PUBLIC_CDN_BASE_URL
    ? env.PUBLIC_CDN_BASE_URL.replace(/\/+$/, '')
    : `${url.origin}/cdn`;

  const publicUrl = `${cdnBase}/${objectKey}`;

  return jsonResponse({
    object_key: objectKey,
    public_url: publicUrl,
    file_name: file.name,
    mime_type: mimeType,
    size_bytes: file.size,
  });
}

/**
 * Handle DELETE /api/media/:objectKey
 */
async function handleDeleteMedia(request, env, pathname) {
  const auth = await verifyAdminToken(request, env);
  if (!auth.ok) {
    return jsonResponse({ error: auth.error }, auth.status);
  }

  if (!env.MEDIA_BUCKET) {
    return jsonResponse({ error: 'Cloudflare R2 bucket binding MEDIA_BUCKET is not configured' }, 500);
  }

  const encodedKey = pathname.replace(/^\/api\/media\//, '');
  const objectKey = decodeURIComponent(encodedKey);

  if (!objectKey) {
    return jsonResponse({ error: 'Missing object_key parameter' }, 400);
  }

  await env.MEDIA_BUCKET.delete(objectKey);

  return jsonResponse({
    deleted: true,
    object_key: objectKey,
  });
}

/**
 * Handle GET /cdn/* -> Read and stream object from Cloudflare R2
 */
async function handleCdnRead(request, env, pathname) {
  if (!env.MEDIA_BUCKET) {
    return new Response('R2 bucket binding MEDIA_BUCKET not configured', { status: 500 });
  }

  const rawKey = pathname.replace(/^\/cdn\//, '');
  const objectKey = decodeURIComponent(rawKey);

  if (!objectKey) {
    return new Response('Not Found', { status: 404 });
  }

  const object = await env.MEDIA_BUCKET.get(objectKey);
  if (!object) {
    return new Response('Object Not Found', { status: 404 });
  }

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set('etag', object.httpEtag);
  if (!headers.has('Cache-Control')) {
    headers.set('Cache-Control', 'public, max-age=31536000, immutable');
  }
  headers.set('Access-Control-Allow-Origin', '*');

  return new Response(object.body, {
    status: 200,
    headers,
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const { pathname } = url;

    // 1. CORS Preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    // 2. Upload endpoint: POST /api/upload
    if (pathname === '/api/upload' && request.method === 'POST') {
      return handleUpload(request, env, url);
    }

    // 3. Delete R2 media endpoint: DELETE /api/media/:key
    if (pathname.startsWith('/api/media/') && request.method === 'DELETE') {
      return handleDeleteMedia(request, env, pathname);
    }

    // 4. Read R2 asset endpoint: GET /cdn/*
    if (pathname.startsWith('/cdn/') && (request.method === 'GET' || request.method === 'HEAD')) {
      return handleCdnRead(request, env, pathname);
    }

    // 5. Serve React static assets + SPA fallback
    if (env.ASSETS) {
      const assetResponse = await env.ASSETS.fetch(request);
      if (assetResponse.status !== 404) {
        return assetResponse;
      }

      // SPA Fallback: serve index.html for non-asset navigation routes
      const indexUrl = new URL('/index.html', url.origin);
      return env.ASSETS.fetch(new Request(indexUrl, request));
    }

    return new Response('Theara Blog Worker is running.', { status: 200 });
  },
};
