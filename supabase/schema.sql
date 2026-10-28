-- ==============================================================================
-- Project: Theara Blog
-- Database: Supabase PostgreSQL Schema
-- Step 1: Tables, Functions, Row Level Security (RLS) Policies & Seed Data
-- ==============================================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ==============================================================================
-- 1. TABLES DEFINITION
-- ==============================================================================

-- Table: profiles
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text default '',
  avatar_url text default '',
  bio text default '',
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

-- Table: categories
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text default '',
  created_at timestamptz not null default now()
);

-- Table: tags
create table if not exists public.tags (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique
);

-- Table: posts
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid references public.profiles(id) on delete set null,
  category_id uuid references public.categories(id) on delete set null,
  title text not null,
  slug text not null unique,
  excerpt text default '',
  content text not null default '',
  content_format text not null default 'markdown' check (content_format in ('markdown', 'html')),
  cover_url text default '',
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  is_featured boolean not null default false,
  views integer not null default 0,
  reading_time integer not null default 1,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Table: post_tags (Many-to-Many junction)
create table if not exists public.post_tags (
  post_id uuid not null references public.posts(id) on delete cascade,
  tag_id uuid not null references public.tags(id) on delete cascade,
  primary key (post_id, tag_id)
);

-- Table: comments
create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  parent_id uuid references public.comments(id) on delete cascade,
  author_name text not null,
  author_email text not null,
  content text not null,
  is_approved boolean not null default false,
  created_at timestamptz not null default now()
);

-- Table: ads
create table if not exists public.ads (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slot text not null check (slot in ('header', 'sidebar_top', 'sidebar_bottom', 'in_article', 'below_post', 'footer')),
  ad_type text not null check (ad_type in ('image', 'script')),
  image_url text default '',
  link_url text default '',
  script_code text default '',
  width integer,
  height integer,
  position integer not null default 0,
  is_active boolean not null default true,
  starts_at timestamptz,
  ends_at timestamptz,
  impressions integer not null default 0,
  clicks integer not null default 0
);

-- Table: media
create table if not exists public.media (
  id uuid primary key default gen_random_uuid(),
  uploaded_by uuid references public.profiles(id) on delete set null,
  object_key text not null unique,
  public_url text not null,
  file_name text not null,
  mime_type text not null,
  size_bytes bigint not null default 0,
  alt_text text default '',
  created_at timestamptz not null default now()
);

-- Table: cv_sections
create table if not exists public.cv_sections (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  title text not null,
  icon text default '',
  position integer not null default 0,
  is_visible boolean not null default true
);

-- Table: cv_items
create table if not exists public.cv_items (
  id uuid primary key default gen_random_uuid(),
  section_id uuid not null references public.cv_sections(id) on delete cascade,
  label text not null,
  value text not null default '',
  subtitle text default '',
  url text default '',
  position integer not null default 0
);

-- Table: site_settings
create table if not exists public.site_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- Table: subscribers
create table if not exists public.subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Table: contact_messages
create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  subject text not null default '',
  message text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

-- ==============================================================================
-- 2. INDEXES FOR PERFORMANCE
-- ==============================================================================

create index if not exists idx_posts_status_published on public.posts (status, published_at desc);
create index if not exists idx_posts_slug on public.posts (slug);
create index if not exists idx_posts_category on public.posts (category_id);
create index if not exists idx_comments_post_approved on public.comments (post_id, is_approved, created_at asc);
create index if not exists idx_ads_slot_active on public.ads (slot, is_active);
create index if not exists idx_cv_items_section on public.cv_items (section_id, position asc);

-- ==============================================================================
-- 3. HELPER FUNCTIONS & TRIGGERS
-- ==============================================================================

-- Function: public.is_admin()
-- Checks if currently authenticated user has is_admin = true in profiles table
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select coalesce(
    (select is_admin from public.profiles where id = auth.uid()),
    false
  );
$$;

-- Trigger to sync auth.users to public.profiles upon signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url, is_admin)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'avatar_url', ''),
    false
  )
  on conflict (id) do update
  set email = excluded.email;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Trigger to auto-update posts.updated_at
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trigger_posts_updated_at on public.posts;
create trigger trigger_posts_updated_at
  before update on public.posts
  for each row execute function public.set_updated_at();

-- Increment post views safely without giving public full update rights
create or replace function public.increment_post_views(p_post_id uuid)
returns void
language sql
security definer
as $$
  update public.posts
  set views = views + 1
  where id = p_post_id and status = 'published';
$$;

-- Record ad impression safely
create or replace function public.record_ad_impression(p_ad_id uuid)
returns void
language sql
security definer
as $$
  update public.ads
  set impressions = impressions + 1
  where id = p_ad_id and is_active = true;
$$;

-- Record ad click safely
create or replace function public.record_ad_click(p_ad_id uuid)
returns void
language sql
security definer
as $$
  update public.ads
  set clicks = clicks + 1
  where id = p_ad_id and is_active = true;
$$;

-- ==============================================================================
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- Enable RLS on EVERY table
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.tags enable row level security;
alter table public.posts enable row level security;
alter table public.post_tags enable row level security;
alter table public.comments enable row level security;
alter table public.ads enable row level security;
alter table public.media enable row level security;
alter table public.cv_sections enable row level security;
alter table public.cv_items enable row level security;
alter table public.site_settings enable row level security;
alter table public.subscribers enable row level security;
alter table public.contact_messages enable row level security;

-- Drop existing policies if re-running
drop policy if exists "profiles_select" on public.profiles;
drop policy if exists "profiles_admin_all" on public.profiles;

drop policy if exists "categories_select_public" on public.categories;
drop policy if exists "categories_admin_all" on public.categories;

drop policy if exists "tags_select_public" on public.tags;
drop policy if exists "tags_admin_all" on public.tags;

drop policy if exists "posts_select" on public.posts;
drop policy if exists "posts_admin_all" on public.posts;

drop policy if exists "post_tags_select" on public.post_tags;
drop policy if exists "post_tags_admin_all" on public.post_tags;

drop policy if exists "comments_select" on public.comments;
drop policy if exists "comments_insert_public" on public.comments;
drop policy if exists "comments_admin_all" on public.comments;

drop policy if exists "ads_select" on public.ads;
drop policy if exists "ads_admin_all" on public.ads;

drop policy if exists "media_select_admin" on public.media;
drop policy if exists "media_admin_all" on public.media;

drop policy if exists "cv_sections_select" on public.cv_sections;
drop policy if exists "cv_sections_admin_all" on public.cv_sections;

drop policy if exists "cv_items_select" on public.cv_items;
drop policy if exists "cv_items_admin_all" on public.cv_items;

drop policy if exists "site_settings_select_public" on public.site_settings;
drop policy if exists "site_settings_admin_all" on public.site_settings;

drop policy if exists "subscribers_insert_public" on public.subscribers;
drop policy if exists "subscribers_admin_all" on public.subscribers;

drop policy if exists "contact_messages_insert_public" on public.contact_messages;
drop policy if exists "contact_messages_admin_all" on public.contact_messages;

-- --- profiles ---
create policy "profiles_select" on public.profiles
  for select using (true);

create policy "profiles_admin_all" on public.profiles
  for all using (public.is_admin() or auth.uid() = id);

-- --- categories ---
create policy "categories_select_public" on public.categories
  for select using (true);

create policy "categories_admin_all" on public.categories
  for all using (public.is_admin()) with check (public.is_admin());

-- --- tags ---
create policy "tags_select_public" on public.tags
  for select using (true);

create policy "tags_admin_all" on public.tags
  for all using (public.is_admin()) with check (public.is_admin());

-- --- posts ---
-- Public can read only published posts; Admin can read all
create policy "posts_select" on public.posts
  for select using (status = 'published' or public.is_admin());

create policy "posts_admin_all" on public.posts
  for all using (public.is_admin()) with check (public.is_admin());

-- --- post_tags ---
create policy "post_tags_select" on public.post_tags
  for select using (
    exists (
      select 1 from public.posts
      where posts.id = post_tags.post_id
      and (posts.status = 'published' or public.is_admin())
    )
  );

create policy "post_tags_admin_all" on public.post_tags
  for all using (public.is_admin()) with check (public.is_admin());

-- --- comments ---
-- Public sees only approved comments; Admin sees all
create policy "comments_select" on public.comments
  for select using (is_approved = true or public.is_admin());

-- Public can INSERT comments, but is_approved MUST be false
create policy "comments_insert_public" on public.comments
  for insert with check (is_approved = false);

create policy "comments_admin_all" on public.comments
  for all using (public.is_admin()) with check (public.is_admin());

-- --- ads ---
-- Public can read active ads within date range; Admin can read all
create policy "ads_select" on public.ads
  for select using (
    (
      is_active = true
      and (starts_at is null or starts_at <= now())
      and (ends_at is null or ends_at >= now())
    )
    or public.is_admin()
  );

create policy "ads_admin_all" on public.ads
  for all using (public.is_admin()) with check (public.is_admin());

-- --- media ---
-- Admin manages media, public can read referenced media
create policy "media_select_admin" on public.media
  for select using (true);

create policy "media_admin_all" on public.media
  for all using (public.is_admin()) with check (public.is_admin());

-- --- cv_sections ---
-- Public can read only visible sections; Admin can read all
create policy "cv_sections_select" on public.cv_sections
  for select using (is_visible = true or public.is_admin());

create policy "cv_sections_admin_all" on public.cv_sections
  for all using (public.is_admin()) with check (public.is_admin());

-- --- cv_items ---
create policy "cv_items_select" on public.cv_items
  for select using (
    exists (
      select 1 from public.cv_sections
      where cv_sections.id = cv_items.section_id
      and (cv_sections.is_visible = true or public.is_admin())
    )
  );

create policy "cv_items_admin_all" on public.cv_items
  for all using (public.is_admin()) with check (public.is_admin());

-- --- site_settings ---
create policy "site_settings_select_public" on public.site_settings
  for select using (true);

create policy "site_settings_admin_all" on public.site_settings
  for all using (public.is_admin()) with check (public.is_admin());

-- --- subscribers ---
-- Public can insert new subscriptions
create policy "subscribers_insert_public" on public.subscribers
  for insert with check (true);

-- Only Admin can view, edit or delete subscribers
create policy "subscribers_admin_all" on public.subscribers
  for all using (public.is_admin()) with check (public.is_admin());

-- --- contact_messages ---
-- Public can submit messages
create policy "contact_messages_insert_public" on public.contact_messages
  for insert with check (true);

-- Only Admin can view or manage messages
create policy "contact_messages_admin_all" on public.contact_messages
  for all using (public.is_admin()) with check (public.is_admin());

-- ==============================================================================
-- 5. SEED DATA (Categories & Default Settings)
-- ==============================================================================

-- Seed Categories
insert into public.categories (name, slug, description)
values
  ('Web Development', 'web-development', 'Modern front-end, frameworks, responsive architecture, and web standards.'),
  ('JavaScript & TypeScript', 'javascript-typescript', 'Deep dives into JS runtime, TS type systems, async patterns, and tips.'),
  ('Backend & Databases', 'backend-databases', 'APIs, relational databases, performance tuning, and scalable architecture.'),
  ('DevOps & Cloud', 'devops-cloud', 'Deployment pipelines, serverless workers, edge computing, and containers.'),
  ('Problem Solving & Real Cases', 'problem-solving-real-cases', 'Post-mortems, bug hunting adventures, and real production engineering challenges.')
on conflict (slug) do update
set name = excluded.name, description = excluded.description;

-- Seed Common Tags
insert into public.tags (name, slug)
values
  ('React', 'react'),
  ('Vite', 'vite'),
  ('Tailwind CSS', 'tailwind-css'),
  ('Node.js', 'nodejs'),
  ('PostgreSQL', 'postgresql'),
  ('Cloudflare', 'cloudflare'),
  ('Architecture', 'architecture'),
  ('Performance', 'performance'),
  ('Debugging', 'debugging')
on conflict (slug) do nothing;

-- Seed Default Site Settings
insert into public.site_settings (key, value)
values
  ('general', '{
    "site_title": "Theara Blog",
    "tagline": "Software engineering, modern web craft, and real-world production stories",
    "author_name": "Theara",
    "author_bio": "Full-stack engineer passionate about JavaScript, modern web architecture, and clean user experiences.",
    "avatar_url": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80",
    "cv_pdf_url": "",
    "social_github": "https://github.com",
    "social_linkedin": "https://linkedin.com",
    "social_twitter": "https://twitter.com"
  }'::jsonb),
  ('seo', '{
    "meta_description": "Personal technology blog by Theara. Articles on web development, coding, and production problem-solving.",
    "og_image": ""
  }'::jsonb)
on conflict (key) do nothing;

-- Seed Initial CV Sections
insert into public.cv_sections (key, title, icon, position, is_visible)
values
  ('experience', 'Professional Experience', 'briefcase', 1, true),
  ('education', 'Education & Certifications', 'graduation-cap', 2, true),
  ('skills', 'Core Technical Skills', 'code', 3, true),
  ('projects', 'Key Projects & Open Source', 'folder-git-2', 4, true)
on conflict (key) do nothing;
