# Design System — Studio Margarita

## Product Context
- **What this is:** A personal, advisory-led online art gallery. Margarita finds
  the right original painting for the right collector — browsing here feels
  like being walked through a gallery by someone who knows you, not shopping
  a catalog.
- **Who it's for:** Collectors and first-time buyers who want guidance, not a
  self-serve marketplace.
- **Space/industry:** Online art sales / gallery advisory — adjacent to Saatchi
  Art, Artsy, and boutique gallery sites, but deliberately more personal and
  less e-commerce.
- **Project type:** Marketing/sales site (React + Vite SPA, no backend).

## Aesthetic Direction
- **Direction:** Luxury/Refined, with an Editorial layout discipline.
- **Decoration level:** Intentional — one recurring motif (the crop-mark
  bracket), used with restraint, not decoration for its own sake.
- **Mood:** Curated, unhurried, personal. Reads like gallery wall labels and
  print mats, not software. Nothing about it should feel like e-commerce.
- **Memorable thing:** "I want something from this specific person" — the work
  leads, the artist behind it is the signature, not the headline.

## Logo
- **Construction:** a two-line wordmark inside a diagonal crop — "Studio"
  above "Margarita" at identical size, differentiated by colour alone (burgundy
  vs. ink). Two corner ticks, upper-left and lower-right, frame the block the
  way crop marks frame a print — the ticks are never completed into a full
  box. Implemented as pure CSS (`.sm-logo` in App.jsx) — no image asset above
  16px.
- **Construction values:** tick length 0.42em, tick weight 0.08em (min 2px),
  clear space one tick length on all sides, line-height 0.9, tracking
  Studio -0.04em / Margarita -0.05em.
- **Colourways:** burgundy-on-white (default), on ink (`.sm-logo--reverse` —
  "Studio" and the ticks switch to `--accent-light`), on burgundy.
- **Compact mark:** below ~90px wide, swap to the bracketed "M" alone
  (`.sm-mark` + `.sm-logo-mark`) — same ticks, same padding ratios. At 16px
  and below (favicon/app-icon scale) the ticks drop entirely and the M sits
  on a solid burgundy ground.
- **Misuse:** never close the ticks into a full rectangle or add the other
  two corners; never set the two words at different sizes or on one line;
  no drop shadow, gradient, outline, or rotation; never place on a photo
  without a solid panel behind it; never substitute the typeface or adjust
  tracking.

## Typography
- **Display/Hero & Body:** Space Grotesk (single family, used throughout —
  this is an established brand choice, not a fresh recommendation).
- **UI/Labels:** Space Grotesk, uppercase, letter-spacing 0.12–0.24em for
  eyebrows, tags, and nav.
- **Loading:** Google Fonts (`@import` in the global `<style>` block in `App.jsx`).
- **Scale (approximate, in px):** display/h1 32–60 (clamp), h2 24–34 (clamp),
  h3 19–22, body 13–16, label 10.5–12, all letter-spacing -0.03 to -0.045em
  on headings, +0.12 to +0.24em on uppercase labels.

## Color
- **Approach:** Restrained — one accent, used with intent.
- **Ink (text):** `#1a1416`
- **Ink-soft (secondary text):** `#6f6266`
- **Background:** `#f6f4f4`
- **Surface (cards, panels):** `#ffffff`
- **Rule (hairlines, borders):** `#d6cfd0`
- **Accent (burgundy):** `#6b1f30`
- **Accent-deep (hover/active):** `#4a1420`
- **Accent-tint (light burgundy fill):** `#f2e7ea`
- **Rose (accent on dark grounds, e.g. footer links):** `#e0c3ca`
- **Accent-light (logo ticks/"Studio" reversed on ink):** `#d9a7b3`
- **Dark mode:** not implemented — the site is light-only by design (gallery
  wall / print reference doesn't have an obvious dark equivalent). Revisit only
  if a real user need appears.

## Spacing
- **Base unit:** roughly 8px, expressed as literal px values inline rather
  than a formal token scale.
- **Density:** comfortable — generous whitespace around framed images and
  section breaks (48–96px between major sections).

## Layout
- **Approach:** Grid-disciplined. `section-narrow` (640px max) for text-heavy
  content, `section-wide` (1120px max) for grids and galleries.
- **Border radius:** 0, everywhere, always. This is a hard rule, not a
  default — it's what makes the site read as print/gallery rather than app.
- **Signature motifs:**
  - **Crop-mark bracket** (`.crop` / `.crop-b`): burgundy corner brackets on
    framed rectangular images (nav logo, hero panel, Margarita's portrait).
  - **Burgundy ring** (`.community-photo`, `.artist-directory-photo`,
    `.artist-profile-ring`): a solid 3px burgundy circle border on portrait
    photos. Introduced for the Artists feature — the circular counterpart to
    the crop-mark bracket, used specifically for *people* rather than *artwork*.

## Motion
- **Approach:** Minimal-functional. The only real animation on the site is the
  Artists carousel auto-scroll (linear, 32s loop, pauses on hover, respects
  `prefers-reduced-motion`). Everything else is instant state changes or CSS
  hover transitions under 200ms.

## Information Architecture — Artists
- **Studio / Artists / Margarita** stays the primary nav — unchanged.
- **Our Artists** (directory + individual profiles) is deliberately *not* a
  4th nav tab. It's reached through "Meet the artist" on the home page
  carousel (and by clicking any portrait in that carousel directly). You find
  the person because you wanted the work, not the other way around.
- **Routing:** extends the site's existing lightweight hash-based routing
  (`#studio`, `#artists`, `#margarita`) rather than adding a router library.
  `#our-artists` is the directory, `#our-artists/<id>` is a profile.
- **Data-driven, not hand-authored:** artist artwork is auto-discovered from
  `src/assets/artist-works/<artist-id>/` at build time (Vite `import.meta.glob`)
  — dropping a file in is the entire workflow for adding a piece. See
  README.md → "Adding artists and artwork" for the full process. This was a
  deliberate choice to keep the content workflow non-technical as the roster
  and piece count grow, rather than requiring JS edits per painting.
- **No sub-navigation, no per-artist URL.** Originally built as a directory
  page + separate profile-per-artist route; changed to a single page where
  clicking a face expands their story and work in place below the grid. Never
  leaves `#our-artists`. (An earlier version also showed a work thumbnail on
  each directory card, so visitors could click toward art they liked rather
  than a name they didn't recognize — removed on user feedback; cards are
  photo + name + country only.)
- **Forward-compatible with the planned "ART" catalog page.** A future page
  will list all paintings with filters (price, size, artist, etc.) as a
  headless-commerce-style catalog. Artwork metadata already supports optional
  `price`, `size`, and `medium` fields via a sidecar JSON per image (see
  README.md), so pieces entered now don't need to be revisited when that page
  is built.

## Decisions Log
| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-08-21 | Documented the existing (already-shipped) design system as DESIGN.md | Formalizing what was already live, not inventing a new system |
| 2026-08-21 | Added Artists directory + profile pages, burgundy-ring portrait motif | New feature via /design-consultation — see IA section above |
| 2026-08-21 | Artist artwork sourced via `src/assets/artist-works/` auto-discovery instead of a hardcoded array | User wants adding pieces to not require manual code edits, and to scale to "a lot of pieces" without a CMS/backend |
