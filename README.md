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
