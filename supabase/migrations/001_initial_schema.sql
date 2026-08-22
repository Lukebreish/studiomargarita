-- Studio Margarita — Phase 1 schema
-- Run this once in the Supabase SQL Editor: Project → SQL Editor → New query
-- → paste this whole file → Run. Safe to re-run (uses IF NOT EXISTS / ON CONFLICT
-- where it matters).

create extension if not exists "pgcrypto"; -- for gen_random_uuid()

-- ARTISTS ---------------------------------------------------------------------
create table if not exists artists (
  id text primary key,              -- slug, e.g. 'rayan' — matches the site's existing artist ids
  name text not null,
  country text not null,
  image_url text not null,          -- portrait photo
  bio_note text,                    -- "Margarita on [artist]" quote
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- ARTWORKS ----------------------------------------------------------------------
do $$ begin
  create type artwork_item_type as enum ('original', 'digital');
exception when duplicate_object then null; end $$;

do $$ begin
  create type artwork_status as enum ('available', 'sold');
exception when duplicate_object then null; end $$;

create table if not exists artworks (
  id uuid primary key default gen_random_uuid(),
  artist_id text not null references artists(id) on delete cascade,
  title text not null,
  image_url text not null,
  medium text,
  size text,
  price numeric(10,2),                              -- null = "on enquiry"
  item_type artwork_item_type not null default 'original',
  status artwork_status not null default 'available',
  buy_now_enabled boolean not null default false,     -- Stripe checkout toggle — wired up in Phase 2
  note text,                                          -- curator note / description
  featured boolean not null default false,            -- eligible for "A closer look" / hero
  tour_room int,                                      -- 3D virtual tour room index (only tour pieces use this)
  tour_wall text,                                     -- 'left' | 'right' | 'back' (only tour pieces use this)
  aspect numeric,                                     -- image aspect ratio, for the 3D tour
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- ENQUIRIES — this table is your CRM ---------------------------------------------
do $$ begin
  create type enquiry_status as enum ('new', 'contacted', 'won', 'lost');
exception when duplicate_object then null; end $$;

create table if not exists enquiries (
  id uuid primary key default gen_random_uuid(),
  artwork_id uuid references artworks(id) on delete set null,
  artwork_title text,               -- snapshot, so the record still reads fine if the artwork is later removed
  name text not null,
  email text not null,
  message text not null,
  status enquiry_status not null default 'new',
  created_at timestamptz not null default now()
);

-- NEWSLETTER SIGNUPS --------------------------------------------------------------
create table if not exists signups (
  id uuid primary key default gen_random_uuid(),
  name text,
  email text not null,
  style_preferences text[],         -- the "what styles catch your eye" checkboxes
  created_at timestamptz not null default now()
);

-- ROW LEVEL SECURITY ---------------------------------------------------------------
-- The anon key ships inside your site's JS bundle — anyone can read it in
-- devtools. That's expected; it's a public key, not a secret. RLS below is
-- what actually defines what that key is allowed to do.

alter table artists enable row level security;
alter table artworks enable row level security;
alter table enquiries enable row level security;
alter table signups enable row level security;

drop policy if exists "public read artists" on artists;
create policy "public read artists" on artists for select using (true);

drop policy if exists "public read artworks" on artworks;
create policy "public read artworks" on artworks for select using (true);

-- Anyone can submit an enquiry or sign up — but nobody (not even the anon
-- key) can read them back. Only you, logged into the Supabase dashboard as
-- the project owner, can see them. That's your private CRM inbox.
drop policy if exists "public can submit enquiries" on enquiries;
create policy "public can submit enquiries" on enquiries for insert with check (true);

drop policy if exists "public can sign up" on signups;
create policy "public can sign up" on signups for insert with check (true);

-- No update/delete policies exist for the public role on any table above,
-- so the anon key can never modify or delete data — content edits only
-- happen through the Supabase dashboard, logged in as you.

-- STORAGE — for new artwork photos going forward, no git required ------------------
insert into storage.buckets (id, name, public)
values ('artwork-images', 'artwork-images', true)
on conflict (id) do nothing;

drop policy if exists "public read artwork images" on storage.objects;
create policy "public read artwork images" on storage.objects
  for select using (bucket_id = 'artwork-images');
