-- "Join our team" — artist applications, a separate lead pipeline from
-- buyer enquiries. Run this in the SQL Editor the same way as the earlier
-- migrations.

do $$ begin
  create type application_status as enum ('new', 'reviewing', 'accepted', 'declined');
exception when duplicate_object then null; end $$;

create table if not exists artist_applications (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  country text,
  portfolio_url text,
  medium text,
  statement text,
  status application_status not null default 'new',
  created_at timestamptz not null default now()
);

alter table artist_applications enable row level security;

-- Same pattern as enquiries/signups: anyone can apply, nobody (not even the
-- anon key) can read applications back — only you, in the dashboard.
drop policy if exists "public can apply to join" on artist_applications;
create policy "public can apply to join" on artist_applications for insert with check (true);
