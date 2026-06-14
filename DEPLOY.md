# Deploying bishOS

Two halves: **Convex** (backend/DB/auth) and the **Next.js frontend** (Vercel).
The recommended flow lets Vercel deploy Convex prod automatically on every push.

---

## Step 1 — Push the repo to GitHub  *(you)*

The project is already a git repo with an initial commit. Create an **empty**
private repo on github.com (no README), then:

```bash
git remote add origin https://github.com/<your-username>/bishos.git
git push -u origin main
```

> `.env.local` is git-ignored, so your secrets are NOT pushed. Good.

---

## Step 2 — Get a Convex production deploy key  *(you)*

Convex dashboard → project **bishos** → **Settings → Deploy Keys** →
**Generate Production Deploy Key** → copy it.

---

## Step 3 — Create the Vercel project  *(you)*

[vercel.com](https://vercel.com) → **Add New… → Project** → import the GitHub repo.

- **Framework preset:** Next.js (auto-detected)
- **Build Command (override):**
  ```
  npx convex deploy --cmd 'npm run build'
  ```
- **Environment Variable:**
  - `CONVEX_DEPLOY_KEY` = *(the production deploy key from Step 2)*

Click **Deploy**. This first build will:
1. Provision the Convex **production** deployment + push schema & functions.
2. Build the Next.js frontend with `NEXT_PUBLIC_CONVEX_URL` auto-pointed at prod.

Note the production URL Vercel gives you, e.g. `https://bishos.vercel.app`.

---

## Step 4 — Set the Convex PRODUCTION env vars

Everything the backend needs at runtime. Set on the **Production** deployment
(dashboard → Settings → Environment Variables → switch to *Production*), or via CLI:

```bash
npx convex env set OPENROUTER_API_KEY  <key>           --prod
npx convex env set PERPLEXITY_API_KEY  <key>           --prod
npx convex env set AI_PROVIDER         openrouter      --prod
npx convex env set OPENROUTER_MODEL    nvidia/nemotron-3-ultra-550b-a55b:free --prod
npx convex env set PERPLEXITY_MODEL    sonar           --prod
```

### Auth (required) — JWT keys + SITE_URL

Convex Auth needs `JWT_PRIVATE_KEY`, `JWKS`, and `SITE_URL` on prod. Easiest:

```bash
npx @convex-dev/auth --prod
```

…and when asked, set `SITE_URL` to your Vercel URL (from Step 3).
Then set it explicitly too if needed:

```bash
npx convex env set SITE_URL https://<your-app>.vercel.app --prod
```

---

## Step 5 — Verify

Open the Vercel URL → `/signin` → sign in. Create a life area → task → note;
confirm realtime updates and that AI chat responds.

Every future `git push` to `main` auto-deploys both halves.

---

## Alternative: deploy frontend via Vercel CLI (no GitHub)

```bash
npm i -g vercel
vercel login
vercel            # follow prompts; set CONVEX_DEPLOY_KEY + build command when asked
vercel --prod
```
