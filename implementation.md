# bishOS — Implementation Plan

> **Second Brain + Life OS** — a lifelong, single-user personal operating system that remembers everything, organizes life across areas, and acts like an AI companion that thinks like you.

This document is a **high-level, all-phases roadmap**. It defines the architecture, data model, module map, AI design, and a phased delivery plan. It is paired with a runnable Next.js + Convex scaffold in this repository.

---

## 1. Vision & Summary

bishOS is built for one person — **Bish** (senior UI/UX designer, entrepreneur, AI automation specialist, aspiring polymath). It is **personal-first**, not a SaaS. It captures everything Bish adds — notes, tasks, projects, goals, habits, focus time, daily check-ins, weekly reviews — and exposes it through an AI chat that has memory of all of it, can be given specific context via `/add`, learns his tone and thinking, and runs daily check-ins, weekly reviews, and "what's going on in my life?" summaries.

The promise: *"This is my lifelong second brain that acts like me, remembers all my notes, and helps me learn, build, and live better across all life areas."*

---

## 2. Architecture Overview

```
┌──────────────────────┐     useQuery / useMutation      ┌──────────────────────┐
│   Next.js (App Router│  ◀──────realtime subscriptions──▶│       Convex         │
│   React 19 + TS)     │                                  │  • Database          │
│  • Server Components  │     useAction (AI calls)         │  • Realtime          │
│  • Client Components  │  ───────────────────────────────▶│  • Queries/Mutations │
│  • Tailwind + shadcn  │                                  │  • Actions           │
└──────────────────────┘                                  │  • File Storage      │
                                                           │  • Auth (single user)│
                                                           └───────────┬──────────┘
                                                                       │ fetch (action)
                                                                       ▼
                                                           ┌──────────────────────┐
                                                           │     OpenRouter       │
                                                           │  free LLM model      │
                                                           └──────────────────────┘
```

- **Frontend:** Next.js (App Router) + TypeScript + Tailwind + shadcn/ui, dark-mode-first. Realtime data via Convex `useQuery` (auto-subscribing); writes via `useMutation`.
- **Backend:** **Convex** is the single all-in-one backend — database, realtime, serverless functions, file storage, and auth. (The spec's "Convex on Neon" is not a real architecture; Convex uses its own storage engine. We use Convex end-to-end.)
- **AI:** A Convex **action** (`convex/ai.ts`) assembles the user's data into a context payload and calls **OpenRouter** with a configurable free model. Actions can call queries to gather memory, then `fetch` OpenRouter.
- **Hosting:** Next.js frontend on **Vercel**; Convex on **Convex Cloud**.

### Why Convex
Single-user realtime app with file attachments and AI memory. Convex removes the need for a separate ORM, realtime layer (sockets/polling), file host (S3), and auth provider — fastest path to a working second brain with live updates.

---

## 3. Data Model (Convex tables)

Refines spec §15. All tables carry `createdAt`/`updatedAt` (ms) and a `userId` (single user, but kept for structure). Key indexes noted.

| Table | Key fields | Indexes |
|---|---|---|
| `users` | name, email, settings | by email |
| `lifeAreas` | name, icon, color, order | by user |
| `sections` | lifeAreaId, name, order | by lifeArea |
| `tasks` | title, description, status (`not_started`/`in_progress`/`done`), priority (`low`/`med`/`high`), dueDate?, lifeAreaId, sectionId, projectId?, linkedNoteIds[] | by lifeArea, by section, by project, by status, by dueDate |
| `projects` | title, description, status (`planning`/`active`/`blocked`/`completed`), lifeAreaId, progress | by lifeArea, by status |
| `notes` | title, content (markdown), lifeAreaId, sectionId, tags[], attachments[] (storageId + meta), linkedNoteIds[], linkedProjectIds[], linkedGoalIds[] | by lifeArea, by section, search index on title/content |
| `goals` | title, description, lifeAreaId, sectionId?, projectId?, timeframe (`weekly`/`monthly`/`yearly`/`custom`), tags[], deadline?, milestones[] (text + done), progress | by lifeArea, by project, by timeframe |
| `focusSessions` | startTime, endTime, duration, taskId?, projectId?, lifeAreaId?, sectionId? | by lifeArea, by date, by task |
| `habits` | title, description, frequency (`daily`/`weekly`/`custom`), target, lifeAreaId, sectionId?, streak, lastCompletedAt? | by lifeArea |
| `habitCompletions` | habitId, date | by habit, by date |
| `dailyCheckIns` | date, energyMood, priorities[], blockers[], adaptiveAnswers (object) | by date |
| `weeklyReviews` | weekStart, weekEnd, tasksCompleted, goalsProgress, projectsStatus, focusTimeSummary, habitsStreaks, notesLearning, energyMoodTrends, aiInsights, userNotes | by weekStart |
| `aiThreads` | title, contextRefs[] (`/add` targets) | by user |
| `aiMessages` | threadId, role (`user`/`assistant`), content, createdAt | by thread |
| `aiMemories` | type, content, relatedIds[] | by type |

Relationship spine: **lifeArea → section → {tasks, notes, projects, goals}**; projects own tasks/goals/notes; focus sessions and habits roll up to life areas for analytics.

---

## 4. Module Map

| Module | Route | Convex functions |
|---|---|---|
| Dashboard (today view) | `/dashboard` | `dashboard.today` (aggregates tasks/focus/notes/habits/deadlines) |
| Life Areas + Sections | `/life-areas` | `lifeAreas.{list,create,rename,remove}`, `sections.{list,create,rename,remove}` |
| Tasks | `/tasks` | `tasks.{list,create,update,setStatus,remove}` |
| Projects | `/projects` | `projects.{list,create,update,remove}` |
| Notes | `/notes` | `notes.{list,get,create,update,remove,search}`, `files.generateUploadUrl` |
| Goals & Milestones | `/goals` | `goals.{list,create,update,toggleMilestone,remove}` |
| Focus Time | `/focus` | `focus.{start,stop,logManual,analytics}` |
| Habits | `/habits` | `habits.{list,create,complete,analytics}` |
| AI Chat | `/chat` | `ai.chat` (action), `aiThreads/aiMessages` |
| Daily Check-in | `/check-in` | `checkins.{today,submit}`, `ai.adaptiveQuestions` |
| Weekly Review | `/review` | `reviews.{generate,get,update}` (action) |

Navigation is **hybrid**: by module (sidebar) and by life area (Life Areas → area → sections → its tasks/notes/projects/goals).

---

## 5. AI Layer

All AI runs through Convex **actions** that call OpenRouter (`https://openrouter.ai/api/v1/chat/completions`) with `OPENROUTER_API_KEY` and a free model from `OPENROUTER_MODEL` (default `meta-llama/llama-3.3-70b-instruct:free`; swappable).

- **Memory-based chat:** Before each completion, the action runs queries to gather recent tasks, active projects, goals, recent notes, focus summary, habits, and latest check-in, then builds a system prompt ("You are Bish's second brain… here is the current state of his life…"). User-style adaptation lives in this system prompt and grows from `aiMemories`.
- **`/add` context:** The chat input lets the user attach a specific project, note, or section. Those refs are stored on the thread and their full content is injected as high-priority context, with global memory as background.
- **"What's going on in my life?"** assembles sections A–H (today's tasks, projects, goals, recent learning, focus, habits, deadlines, AI suggestions).
- **Summarization / connections / insights:** Same action pattern with task-specific prompts — note summaries, related-note suggestions, focus/habit insights, weekly-review generation.
- **Automatic learning:** Every note/task/project/check-in/review is queryable, so memory updates without manual teaching; optional `aiMemories` distills durable facts about the user.

---

## 6. Phased Roadmap

### Phase 1 — Core MVP
Auth (single-user password) · Life Areas + Sections CRUD · Tasks CRUD with filters · Notes (markdown + image/PDF attachments with in-app preview) · Dashboard today view · basic AI Chat with global memory. **Goal:** capture and retrieve life data with a working AI companion.

### Phase 2 — Productivity
Projects (with linked tasks/goals/notes + progress) · Goals & Milestones · Focus Time (Pomodoro timer, start-from-task/project, manual entry, basic per-area analytics) · Habits (tracking, streaks, completion).

### Phase 3 — Intelligence & Reflection
Daily Check-in (fixed + AI-adaptive questions) · Weekly Review (auto-generated from the week's data, editable) · `/add` specific-context chat · AI insights (focus/habit patterns, delay warnings) · note connection suggestions.

### Phase 4 — Polish
Advanced analytics & charts · office-doc previews (docx/xlsx/pptx) · note knowledge-graph links · mobile refinements · performance & UX pass · richer AI personalization via `aiMemories`.

---

## 7. Tech Stack & Environment

- **Framework:** Next.js 15 (App Router), React 19, TypeScript.
- **Backend:** Convex + `@convex-dev/auth`.
- **UI:** Tailwind CSS, shadcn/ui, `lucide-react`, dark-mode-first.
- **AI:** OpenRouter (free model).
- **Hosting:** Vercel (frontend) + Convex Cloud (backend).

**Env vars** (`.env.local`):
```
CONVEX_DEPLOYMENT=...            # set by `npx convex dev`
NEXT_PUBLIC_CONVEX_URL=...       # set by `npx convex dev`
OPENROUTER_API_KEY=sk-or-...     # set in Convex dashboard env for actions
OPENROUTER_MODEL=meta-llama/llama-3.3-70b-instruct:free
```

---

## 8. UI/UX Notes

- **Layout:** Left sidebar (Dashboard, Life Areas, Tasks, Projects, Notes, Goals, Focus Time, Habits, AI Chat) + main content area. Top bar with quick actions (Add note, Add task, Start focus, Open chat).
- **Components:** Cards, lists, tabs, filters; reusable form primitives via shadcn/ui.
- **Dark mode:** default; toggle persisted.
- **Responsive:** desktop-first, collapses to a mobile drawer nav.
- **AI Chat:** classic chat interface — message bubbles, input with an `/add` button, and context chips showing the attached project/note/section.
- **Realtime:** all lists update live via Convex subscriptions; no manual refresh.

---

## 9. Non-Goals (initial)
No multi-user, no billing, no public templates. Office-doc in-app preview deferred to Phase 4 (MVP previews images + PDFs). Everything is single-user, private, personal-first.
