# The Long Room — Virtual Gallery

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

The Artists page (directory + individual profiles, reached via "Meet the artist")
is split into two pieces that get updated differently — adding a new **artist**
is a quick text edit, adding a new **piece of artwork** is drag-and-drop, no
code required.

### Add a new artist

1. Add their portrait photo to `public/artists/<artist-id>.jpg`
   (`<artist-id>` = their name, lowercase, no spaces — e.g. `sofia.jpg`).
2. Open `src/App.jsx`, find the `ARTISTS` array near the top, and add a line:
   ```js
   { id: 'sofia', name: 'Sofia', country: 'Portugal', image: '/artists/sofia.jpg', note: "Margarita's one or two sentence take on Sofia's work, in her own voice." },
   ```
3. Create their (empty, for now) artwork folder:
   ```
   mkdir -p src/assets/artist-works/sofia
   ```
4. Rebuild/redeploy. Sofia now appears in the community carousel and the
   Artists directory, with a working profile page.

That `id` is the shared key everywhere — the folder name in step 3 must match
it exactly.

### Add a new piece of artwork for an existing artist

Just drop the image file into that artist's folder:

```
src/assets/artist-works/<artist-id>/your-file-name.jpg
```

That's it — no code edit, no manifest to update. On the next build, it
automatically appears on that artist's profile page with:
- **Title**: generated from the filename (`midnight-study.jpg` → "Midnight
  Study"). Use hyphens or underscores between words; capitalization is
  handled for you.
- **Enquire button**: wired automatically to the same contact flow as
  everywhere else on the site.

This is why artwork lives under `src/assets/` instead of `public/` like the
rest of the site's images — Vite can scan that folder at build time
(`import.meta.glob`) and auto-discover whatever's inside it. Files dropped
into `public/` require a manual code reference to ever appear anywhere; files
dropped into `src/assets/artist-works/<artist-id>/` do not. If an artist has
no artwork in their folder yet, their profile page shows an honest "enquire
directly" message instead of an empty gallery grid.

**Scaling to a lot of pieces:** this pattern holds regardless of volume —
whether an artist has 1 piece or 100, dropping files in the folder is the
entire workflow.

**Optional per-piece details (price, size, medium):** drop a JSON file next
to the image with the same name — `your-file-name.json` next to
`your-file-name.jpg` — with any of these fields:

```json
{ "title": "Midnight Study", "price": 1200, "size": "60 x 80 cm", "medium": "Oil on canvas" }
```

None of these are required, and none are displayed on the artist profile page
yet — they exist now so that when the planned "ART" catalog page (the
headless-commerce page with price/size/artist filters) gets built, the pieces
that already have this data won't need to be touched again. `title` overrides
the filename-generated one if you want something the filename can't express.
