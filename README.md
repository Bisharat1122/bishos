# bishOS — Second Brain + Life OS

A personal, single-user "lifelong second brain" and life operating system.
Next.js (App Router) + Convex (DB, realtime, functions, file storage, auth) +
OpenRouter (free LLM). See [implementation.md](implementation.md) for the full
architecture and phased roadmap.

## Design system

Inspired by the reference dashboards: **near-black green-tinted surfaces, a
vibrant lime/emerald accent, orange as a secondary chart color, soft rounded
cards, pill-shaped sidebar nav, and the geometric `Sora` font.** Tokens live in
[app/globals.css](app/globals.css); dark mode is the default.

## Setup

1. **Install deps**
   ```bash
   npm install
   ```

2. **Start Convex** (creates the deployment, generates `convex/_generated`, and
   pushes the schema). On first run it walks you through login + project create:
   ```bash
   npx convex dev
   ```
   > Until this runs once, TypeScript will error on `@/convex/_generated/*`
   > imports — those files are codegen output.

3. **Set the OpenRouter key** in the Convex dashboard
   (Settings → Environment Variables) so actions can read it:
   ```
   OPENROUTER_API_KEY = sk-or-...
   OPENROUTER_MODEL   = meta-llama/llama-3.3-70b-instruct:free   # optional override
   ```

4. **Run the app** (in a second terminal):
   ```bash
   npm run dev
   ```
   Open http://localhost:3000 → you'll be redirected to `/signin`. Create your
   account once (single-user), then you're in.

## What's built (Phase 1 MVP)

- Auth (single-user password) · Life Areas + Sections CRUD · Tasks CRUD with
  status/priority · Notes with PDF/image attachments + preview · Dashboard today
  view · AI Chat with global memory + `/add` context chip.

Phase 2–4 modules (Projects, Goals, Focus Time, Habits, Daily Check-in, Weekly
Review, advanced AI insights) are navigable stubs — see implementation.md.

## Structure

```
app/
  (app)/            # authed shell (sidebar layout)
    dashboard/  life-areas/  tasks/  notes/  chat/
    projects/  goals/  focus/  habits/        # Phase 2+ stubs
  signin/           # single-user auth
convex/
  schema.ts         # all tables + indexes
  auth.ts http.ts   # Convex Auth
  lifeAreas.ts sections.ts tasks.ts notes.ts files.ts dashboard.ts
  ai.ts             # OpenRouter action + memory assembly
  aiThreads.ts
components/         # Sidebar, ui primitives, providers
```
