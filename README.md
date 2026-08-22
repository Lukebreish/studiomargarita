# The Long Room — Virtual Gallery

## Backend setup (Supabase) — do this once

The site reads all artists/artworks from Supabase, and enquiries/newsletter
signups write there too (that's your CRM). To set it up:

1. Create a free project at [supabase.com](https://supabase.com).
2. Open **SQL Editor** in your project, paste the contents of
   `supabase/migrations/001_initial_schema.sql`, and run it. Then do the same
   with `002_seed_existing_content.sql` to load the site's current artists
   and artwork.
3. Open **Project Settings → API**, copy the **Project URL** and the
   **anon/public key**.
4. Copy `.env.example` to `.env` in this folder and paste those two values in.
5. Also add the same two variables in your Vercel project (**Settings →
   Environment Variables**) so production builds can reach Supabase too.

The anon key is meant to be public — it ships inside the site's JS bundle for
every visitor. Row Level Security (defined in the migration) is what actually
controls what it's allowed to do: read artists/artworks, insert enquiries and
signups, nothing else. Never put the database password or the `service_role`
key in `.env` or anywhere client-side.

## Run locally
npm install
npm run dev

## Build for hosting
npm install
npm run build
→ output goes to /dist — this is the folder you deploy.

## Deploy (recommended: Vercel)
1. Push this folder to a GitHub repo (or use `npx vercel` from inside it).
2. Go to vercel.com → New Project → import the repo.
3. It auto-detects Vite. Click Deploy. Done — you get a live URL and a free
   custom domain slot, plus auto-redeploy on every git push.

## Fastest zero-setup option: Netlify Drop
1. Run `npm run build` locally.
2. Go to app.netlify.com/drop and drag the /dist folder in.
3. Live URL in seconds. No account required to try it, free account to keep it.

## Adding artists and artwork

Everything lives in Supabase now — no code, no git, no deploy needed. Open
your project's **Table Editor** at supabase.com and:

### Add a new artist

Add a row to the `artists` table:
- `id` — a slug, lowercase, no spaces (e.g. `sofia`) — this is the shared key
  used everywhere, so pick it once and don't change it later.
- `name`, `country`
- `image_url` — either `/artists/sofia.jpg` if you've added that file to
  `public/artists/` in the repo, or a Supabase Storage URL if you uploaded
  the portrait there (Storage tab → `artwork-images` bucket → upload → copy
  the public URL).
- `bio_note` — Margarita's one or two sentence take on their work, in her
  voice.

Sofia now appears in the community carousel and the Artists directory
immediately — no rebuild needed, the site fetches this on every visit.

### Add a new piece of artwork

Add a row to the `artworks` table:
- `artist_id` — must match an existing `artists.id` exactly.
- `title`, `image_url` (same options as above — a repo file path, or a
  Storage URL), `medium`, `size`, `price` (leave blank for "on enquiry").
- `status` — `available` or `sold`.
- `buy_now_enabled` — leave off (`false`) until Phase 2 (Stripe checkout)
  ships; the site currently treats every piece as enquire-to-purchase
  regardless of this flag.

It shows up on that artist's profile page and in the Art catalog immediately.

### The 5 pieces used in the 3D virtual tour

These are regular rows in `artworks`, just with `tour_room` (0/1/2),
`tour_wall` (`left`/`right`/`back`), and `aspect` (image width ÷ height) also
filled in. Leave those three columns blank for every other piece — they're
what makes a piece appear in the 3D room walkthrough and the homepage hero
reasons, on top of its artist's profile.

See `supabase/migrations/001_initial_schema.sql` for the full schema and
`002_seed_existing_content.sql` for a worked example of every field.
