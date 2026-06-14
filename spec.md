

## Claude Prompt: Build My Personal Second Brain + Life OS (Next.js + Convex or Neon + OpenRouter)

You are an expert full-stack engineer, product architect, and UI/UX designer.  
Your job is to design and plan a **personal web application** that acts as the user’s **lifelong second brain and life operating system**.

### 1. Core Vision

**Core promise (one sentence):**

> “This is my lifelong second brain that acts like me, remembers all my notes, and helps me learn, build, and live better across all life areas.”

Key principles:

- **100% personal-first**: built for one user (the founder), not as a SaaS initially.
- **Second Brain**: remembers everything the user adds (notes, tasks, projects, goals, habits, focus time, check-ins).
- **Life OS**: organizes the user’s entire life across multiple **life areas** and **sections**.
- **AI-powered**: an AI chat that:
  - Has memory of all the user’s data.
  - Can be given **specific context** (project, note, folder) via `/add` in chat.
  - Acts like the user (learns their style, tone, thinking).
  - Provides daily check-ins, weekly reviews, and “What’s going on in my life?” summaries.

### 2. Target User

- One person: **Bish**, a senior UI/UX designer, entrepreneur, and AI automation specialist.
- He is building a software company (DevZelo) with a friend.
- He wants to be a **polymath**, learning across many domains:
  - Marketing, business, finance, self-improvement, writing, copywriting, sales, spoken English, critical thinking, emotional intelligence, Quran/Deen, money, etc.
- He already uses:
  - Figma (design)
  - Next.js, NestJS, React, Node.js
  - PostgreSQL, MongoDB, Supabase
  - Docker, Git/GitHub, Netlify, Hostinger
  - Notion, TickTick
- He wants this app to be his **personal live operating system** for:
  - Tasks
  - Life sections (life areas)
  - Notes
  - Projects
  - Goals
  - Focus time (Pomodoro-style)
  - Habits
  - AI chat & reflection

### 3. Core Features Overview

The app must have these main modules:

1. **Dashboard** (today view)
2. **Life Areas** (domains of life)
3. **Tasks**
4. **Projects**
5. **Notes** (with rich media & file previews)
6. **Goals & Milestones**
7. **Focus Time** (timer + analytics)
8. **Habits**
9. **AI Chat** (Second Brain companion)
10. **Daily Check-in** (hybrid: fixed + adaptive questions)
11. **Weekly Review** (comprehensive system audit + planning)

All data is private and for one user only.

***

### 4. Dashboard

The main morning dashboard must show **three core things**:

1. **“What do I need to do today?”**  
   - Today’s tasks, prioritized.
   - Grouped by life area or shown as a single prioritized list.
   - Highlight top 1–3 priorities.

2. **“What’s my current focus for each life area?”**  
   - For each life area:
     - Active projects.
     - Current goals.
     - Any blocked or delayed items.
   - Short summary per life area.

3. **“What did I learn recently?”**  
   - Recent notes added.
   - Recent learning activity (e.g., new notes in Copywriting, Quran, etc.).
   - Optional: AI-generated short summary of recent learning.

Additional dashboard elements (optional but recommended):

- Quick actions:
  - “Add note”
  - “Add task”
  - “Start focus timer”
  - “Open AI chat”
- Today’s habits and streaks.
- Upcoming deadlines (next 3–7 days).
- AI-suggested focus for the day.

***

### 5. Life Areas & Sections

**Life Areas** are the top-level domains of the user’s life. Example list (must be editable):

- Business & Ventures
- Learning
- Health & Fitness
- Finance & Money
- Family & Relationships
- Spirituality (Quran, Deen)
- Content Creation
- Self-Improvement
- Community & Service
- Hobbies & Curiosity
- Work
- Travel & Experiences

Features:

- User can **add, rename, delete** life areas inside the app.
- Each life area has **simple sections** (folders/categories) under it.
  - Example: `Learning / Copywriting`, `Learning / Quran`, `Learning / Sales`.
- Sections are **not full mini-hubs** by default (simple folders), but:
  - They can contain:
    - Notes
    - Tasks
    - Projects
    - Goals
  - They are used for filtering and organizing.

**Tasks**:

- Each task belongs to:
  - **One life area**
  - **One section** under that life area
- No multi-life-area tasks in the initial design.
- Tasks have:
  - Title
  - Description
  - Status (not started, in progress, done)
  - Priority (low, medium, high)
  - Due date (optional)
  - Linked project (optional)
  - Linked notes (optional)

**Projects**:

- Projects can be:
  - Under a life area (e.g., `Business & Ventures / Launch Coaching App`).
  - Or loosely tied to a life area but not necessarily under a section.
- Each project has:
  - Title
  - Description
  - Status (planning, active, blocked, completed)
  - Life area
  - Goals
  - Tasks
  - Notes
  - Progress (manual or automatic based on tasks/goals)

**Goals & Milestones**:

- Goals can exist:
  - At the **life area** level.
  - At the **section** level.
  - At the **project** level.
- Each goal has:
  - Title
  - Description
  - Timeframe (weekly, monthly, yearly, custom)
  - Tags
  - Deadline
  - Milestones (checklist)
  - Progress (% or count)

***

### 6. Notes (Second Brain Core)

Notes are the core of the **Second Brain**:

- User can create **multiple documents/notes** inside any section.
- Notes can contain:
  - Text (rich text or markdown)
  - Images
  - PDFs
  - Word documents (.doc, .docx)
  - Excel/spreadsheets (.xls, .xlsx)
  - Presentations (.ppt, .pptx)
  - Video links (embedded)
  - Web links
- Notes must support **file previews inside the app**:
  - PDFs: viewable in-app.
  - Docs: previewed (or converted to HTML/text).
  - Excel: previewed as a table.
  - Presentations: previewed (or converted to slides/images).
- Notes have:
  - Title
  - Content (text + embedded media)
  - Attachments (files)
  - Life area + section
  - Tags
  - Linked notes (optional)
  - Linked projects (optional)
  - Linked goals (optional)

Note features:

- Full-text search across all notes.
- Tag-based filtering.
- Ability to link notes to each other (like a knowledge graph).
- AI can:
  - Summarize notes.
  - Find connections between notes.
  - Suggest related notes when viewing a note.

***

### 7. Goals & Milestones (Detailed)

Goals track **progress over time**:

- Each goal has:
  - Title
  - Description
  - Life area
  - Section (optional)
  - Project (optional)
  - Timeframe: weekly, monthly, yearly, custom
  - Tags
  - Deadline
  - Milestones (checklist of sub-goals)
  - Progress (count or %)
- Goals can be:
  - Learning goals (e.g., “Master copywriting fundamentals”).
  - Business goals (e.g., “Launch coaching app by X date”).
  - Personal goals (e.g., “Read 10 Quran chapters this month”).
- AI can:
  - Break goals into milestones.
  - Suggest next actions.
  - Track progress and warn about delays.

***

### 8. Focus Time (Pomodoro + Analytics)

Focus time is tied to **tasks and projects**:

Features:

- **Start timer from a task**:
  - Click a task → start timer.
  - Timer automatically logged to that task.
- **Start timer from a project**:
  - Open a project → start timer.
  - Timer logged to that project.
- **Manual entry**:
  - User can later add focus time manually (e.g., “I studied 45 min in Copywriting but didn’t timer”).
- **Pomodoro mode**:
  - Default: 25 min work + 5 min break.
  - Custom durations allowed.
- **Break reminders**:
  - App reminds user to take breaks.
- **Focus analytics**:
  - Charts/tables:
    - Focus time per day, week.
    - Focus time per life area.
    - Focus time per section.
    - Trends and comparisons.
- **AI insights on focus**:
  - AI suggests:
    - “You’re spending too little time on Copywriting.”
    - “Your best focus is in the morning.”
    - “You need more focus time on Business & Ventures.”

Focus time data:

- Each session has:
  - Start time
  - End time
  - Duration
  - Linked task (optional)
  - Linked project (optional)
  - Life area + section (derived from task/project or manually set)

***

### 9. Habits

Habits track **consistency**:

- Habits can be:
  - Daily (e.g., “Study 30 min in Copywriting”).
  - Weekly (e.g., “Write 2 sales emails”).
  - Custom frequency.
- Each habit has:
  - Title
  - Description
  - Frequency (daily, weekly, custom)
  - Target (e.g., 30 min, 2 times)
  - Life area + section
  - Streak count
  - Last completed date
- Habits are tracked in:
  - Dashboard (today’s habits).
  - Weekly review (habits & streaks).
- AI can:
  - Suggest new habits.
  - Analyze patterns (e.g., “You’re more consistent in the morning”).
  - Remind about broken streaks.

***

### 10. AI Chat (Second Brain Companion)

AI chat is the **core intelligence** of the system:

**Capabilities**:

1. **Memory-based chat**:
   - AI remembers everything the user has added:
     - Notes
     - Tasks
     - Projects
     - Goals
     - Habits
     - Focus time
     - Daily check-ins
     - Weekly reviews
   - When user asks general questions like:
     - “What’s going on in my life?”
     - “Summarize my week.”
     - “What should I focus on today?”
   - AI uses the **full context** of the user’s data.

2. **Specific context via `/add`**:
   - In the AI chat, user can click `/add` and:
     - Mention a specific **project**.
     - Mention a specific **note**.
     - Mention a specific **folder/section**.
   - AI then focuses on that **specific context** while still using global memory as background.
   - Example:
     - User: “Help me write a pitch for my content business.”
     - User: `/add` → select “Business & Ventures / Content Creation / Content Business Project”.
     - AI uses:
       - Global memory: tone, past notes on marketing, sales, copywriting.
       - Specific context: that project’s details, goals, notes.

3. **Act like the user**:
   - AI learns the user’s:
     - Writing style
     - Tone
     - Thinking patterns
   - When helping with:
     - Emails
     - Posts
     - Copy
     - Messages
   - It sounds like **the user**, not a generic AI.

4. **Coach & reflection partner**:
   - AI acts as a coach:
     - Daily check-ins.
     - Weekly reviews.
     - Critical thinking partner.
     - Emotional intelligence helper.
   - It asks reflective questions and summarizes progress.

5. **Knowledge connector**:
   - AI finds connections between notes across life areas.
   - It suggests:
     - “This note on copywriting relates to your Content Creation project.”
     - “This Quran note connects to your Self-Improvement goal.”

**“What’s going on in my life right now?” summary**:

When the user asks this, AI must include:

- A. Today’s tasks (prioritized).
- B. Current projects (active, with progress).
- C. Goals status (on track, delayed, completed).
- D. Recent notes & learning (what was added/studied).
- E. Focus time (by life area/section, this week).
- F. Habits & streaks.
- G. Upcoming deadlines.
- H. AI insights & suggestions (what to focus on, drop, start).

**Learning style**:

- **Automatic learning**:
  - Every note, task, project, chat, check-in, review automatically updates the AI’s memory of the user.
  - No manual “teach me this” needed.
  - The AI gets better over time without extra work.

**AI layer**:

- Use **OpenRouter** with:
  - OpenRouter API key.
  - A **free model** (e.g., a free LLM via OpenRouter).
- AI calls:
  - Chat completions.
  - Summarization.
  - Connection suggestions.
  - Insights.

***

### 11. Daily Check-in (Hybrid)

**Hybrid daily check-in**:

- **Fixed questions**:
  - “How’s your energy/mood today?” (scale 1–10 or emoji).
  - “What are your top 1–3 priorities today?”
  - “Any blockers or concerns?”
- **AI-driven adaptive questions**:
  - Based on user’s data:
    - “You have 8 tasks today; which 2 are most critical?”
    - “You haven’t done any focus time in Copywriting this week; want to schedule 30 min?”
    - “Your goal ‘Master copywriting fundamentals’ is delayed; want to adjust the plan?”
- Check-in data:
  - Stored per day.
  - Used in:
    - Weekly review (energy & mood trends).
    - AI insights.
    - Dashboard suggestions.

***

### 12. Weekly Review (Comprehensive)

Weekly review must include **all of these sections**:

- A. Tasks completed (by life area).
- B. Goals progress (on track, stuck, completed).
- C. Projects status (active, delayed, completed).
- D. Focus time summary (per life area/section, trends).
- E. Habits & streaks (kept, broken, streak lengths).
- F. Notes & learning (count, highlights).
- G. Energy & mood trends (from daily check-ins).
- H. AI insights & next week plan:
  - Focus areas.
  - What to start/stop/continue.
  - Draft plan for next week.

Weekly review:

- Generated automatically by AI from the week’s data.
- User can edit and add notes.
- Stored as a “Review” document tied to a week.

***

### 13. Navigation (Hybrid)

**Main navigation (menu)**:

Top-level:

- Dashboard
- Life Areas
- Tasks
- Projects
- Notes
- Goals
- Focus Time
- Habits
- AI Chat

This allows:

- Navigation by **life area**:
  - Life Areas → Business & Ventures → sections → tasks, notes, projects.
- Navigation by **module**:
  - Tasks → all tasks (filtered by life area, section, status).
  - Notes → all notes (filtered by life area, section, tags).
  - Projects → all projects.
  - Goals → all goals.
  - Focus Time → all sessions + analytics.
  - Habits → all habits + streaks.
  - AI Chat → open chat.

***

### 14. Tech Stack

The app must be built with:

- **Frontend**:
  - **Next.js** (React) with:
    - App Router.
    - Server Components + Client Components.
    - TypeScript.
- **Backend / Realtime / Database**:
  - **Convex**:
    - Use Convex for:
      - Database (PostgreSQL-based).
      - Realtime subscriptions.
      - Server functions (queries, mutations, actions).
      - Authentication (single user, simple).
  - Use **Neon Postgres** as the underlying PostgreSQL database (Convex-compatible).
- **AI Layer**:
  - **OpenRouter**:
    - Use OpenRouter API key.
    - Use a **free model** available via OpenRouter.
    - Implement:
      - Chat completions.
      - Summarization.
      - Insight generation.
      - Connection suggestions.
- **Hosting**:
  - Frontend + API: **Vercel** or **Netlify** (Next.js).
  - Convex: hosted via Convex cloud.
- **Auth**:
  - Simple single-user auth:
    - Email + password.
    - Or even a simple hardcoded user for personal use (optional).
- **File Storage**:
  - Use Convex’s file storage or an external provider (e.g., S3) for:
    - PDFs
    - Docs
    - Excel
    - Presentations
    - Images
- **File Previews**:
  - Implement in-app previews for:
    - PDFs (using PDF.js or similar).
    - Docs (convert to HTML/text).
    - Excel (render as table).
    - Presentations (convert to slides/images or use a viewer).
  - Use client-side libraries where possible.

**No SaaS features yet**:

- No multi-user.
- No billing.
- No templates for public use.
- Everything is single-user, private.

***

### 15. Data Model (High-Level)

You should design a schema like this (in Convex):

- `users` (single user, but keep structure).
- `lifeAreas`:
  - id, name, createdAt, updatedAt.
- `sections`:
  - id, lifeAreaId, name, createdAt, updatedAt.
- `tasks`:
  - id, title, description, status, priority, dueDate, lifeAreaId, sectionId, projectId (optional), createdAt, updatedAt.
- `projects`:
  - id, title, description, status, lifeAreaId, createdAt, updatedAt.
- `notes`:
  - id, title, content, lifeAreaId, sectionId, tags[], attachments[], linkedNoteIds[], linkedProjectIds[], createdAt, updatedAt.
- `goals`:
  - id, title, description, lifeAreaId, sectionId (optional), projectId (optional), timeframe, tags[], deadline, milestones[], progress, createdAt, updatedAt.
- `focusSessions`:
  - id, startTime, endTime, duration, taskId (optional), projectId (optional), lifeAreaId, sectionId, createdAt.
- `habits`:
  - id, title, description, frequency, target, lifeAreaId, sectionId, streak, lastCompletedAt, createdAt, updatedAt.
- `habitCompletions`:
  - id, habitId, date, createdAt.
- `dailyCheckIns`:
  - id, date, energyMood, priorities[], blockers[], adaptiveQuestionsAnswers{}, createdAt.
- `weeklyReviews`:
  - id, weekStart, weekEnd, tasksCompleted{}, goalsProgress{}, projectsStatus{}, focusTimeSummary{}, habitsStreaks{}, notesLearning{}, energyMoodTrends{}, aiInsights{}, createdAt, updatedAt.
- `aiMemories` (optional, if you want explicit memory store):
  - id, type, content, relatedIds[], createdAt.

You can adjust and refine this schema.

***

### 16. UI/UX Requirements

- Clean, minimal, modern UI.
- Strong use of:
  - Cards
  - Lists
  - Tabs
  - Filters
- Dark mode support (preferred).
- Responsive:
  - Works well on desktop.
  - Works well on mobile.
- Fast and smooth:
  - Realtime updates via Convex.
  - No heavy latency.
- AI chat:
  - Classic chat interface.
  - Input with `/add` button.
  - Message bubbles.
  - Context indicators (show what project/note/folder is attached).

***

### 17. What You Must Produce

Given this entire specification, you must:

1. **Produce a complete product specification document**:
   - Clear feature descriptions.
   - User flows.
   - Data model.
2. **Produce a technical architecture plan**:
   - How Next.js, Convex, Neon, and OpenRouter connect.
   - API/design of server functions.
3. **Produce a step-by-step implementation plan**:
   - Phase 1: Core MVP (dashboard, life areas, sections, tasks, notes, basic AI chat).
   - Phase 2: Projects, goals, focus time, habits.
   - Phase 3: Daily check-in, weekly review, advanced AI insights.
   - Phase 4: Polish, analytics, refinements.
4. **Produce code scaffolding**:
   - Next.js project structure.
   - Convex schema and functions.
   - Basic pages for:
     - Dashboard
     - Life Areas
     - Tasks
     - Notes
     - AI Chat
5. **Produce UI/UX suggestions**:
   - Screen layouts.
   - Key components.
   - Navigation design.

You are allowed to make reasonable decisions where the spec is open, but always explain them.

***

### 18. Instructions for You (the AI)

- Think step by step.
- Be very detailed and concrete.
- Don’t skip implementation details.
- When proposing code, use TypeScript + Next.js + Convex.
- When proposing AI calls, show how to use OpenRouter with a free model.
- When proposing UI, describe components and layout clearly.
- Keep the entire system **single-user, private, and personal-first**.

Start by:

1. Confirming you understand the vision.
2. Summarizing the key features in your own words.
3. Then producing the full product spec, architecture, and implementation plan.

***

Use this entire document as your prompt.

***

