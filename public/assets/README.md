# Studio Margarita — logo assets (Crop marks)

Colors: ink #1a1416 · burgundy #6b1f30 · rose #e0c3ca
Type: Space Grotesk, weight 500. Load it or the SVG text falls back to a system sans:

    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500&display=swap">

## Files
- logo-lockup.svg / logo-lockup-reversed.svg — horizontal primary
- logo-stacked.svg — stacked with descriptor
- symbol.svg / -reversed / -mono / -white — bracketed M
- favicon.svg, app-icon.svg, avatar.svg — icons (favicon is 32px-tuned)
- watermark.svg — brackets only, for artwork images
- og-card.svg — 1200x630 social card

## Head snippet
    <link rel="icon" href="/assets/favicon.svg" type="image/svg+xml">
    <link rel="apple-touch-icon" href="/assets/app-icon.svg">
    <meta property="og:image" content="/assets/og-card.svg">

## Rules
- Clear space: one bracket arm on every side.
- Minimum: 24px for the symbol, 140px wide for the lockup.
- Bracket stroke stays 3px at 64px and scales with the mark; never below 2px.
- Don't recolor the brackets outside burgundy / rose / white, and don't close them into a full rectangle.
