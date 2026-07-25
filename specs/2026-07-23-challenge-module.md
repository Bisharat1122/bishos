# Spec: Challenge / Sprint Module

| | |
|---|---|
| **Status** | Draft — blueprint for implementation |
| **Created** | 2026-07-23 |
| **Author** | Bish / Claude Code |
| **Area** | New `convex/challenges*.ts`, `convex/schema.ts` (+FKs on tasks/goals/habits/projects/focus/notes/checkins), `app/(app)/challenges/**`, `components/challenges/**`, Sidebar |
| **Supersedes** | [Sprint Command Center](2026-06-16-sprint-command-center.md) — the `projects.kind="sprint"` model is promoted to a first-class `challenges` entity |

---

## 0. TL;DR for the coding agent

- **Today** a "sprint" is a `projects` document with `kind:"sprint"` (fields: `outcome`, `startDate`, `endDate`, `durationDays`, `milestones[]`, `areaIds[]`, `planGrid[]`, `aiPlan`). Habits/goals/tasks link to it via `projectId`; the whole UI is [components/projects/SprintCommandCenter.tsx](../components/projects/SprintCommandCenter.tsx) driven by the `projects.commandCenter` rollup query.
- **Problem:** a project cannot *contain* projects, has no execution **blocks**, no per-block **tracking types**, no challenge-scoped **metrics** or **reviews**, and only one sprint reads as first-class. The product vision needs **many parallel/past challenges**, each a container that links the whole OS.
- **Decision:** introduce a first-class **`challenges`** entity. **Reuse** existing `tasks`, `goals`, `habits`, `focusSessions`, `notes`, `dailyCheckIns` by adding an optional `challengeId` FK — do **not** duplicate them. Add genuinely-new tables: `challengeBlocks`, `challengeDays`, `challengeBlockLogs`, `challengeMetrics`, `challengeMetricEntries`, `challengeReviews`, `challengeTemplates`, `milestones` (promoted from inline arrays), `proofItems`.
- **All changes additive.** Existing `kind:"sprint"` projects keep working; a one-shot **"Convert to Challenge"** action wraps them.

---

## 1. Module concept summary

A **Challenge** is a time-boxed operating system for a single ambition — "38-day AI Agency Sprint", "30-day Sales Sprint", "21-day Health Reset". It is not a habit tracker; it is a **container that binds execution to structure**:

- **Structure layer** — goals, milestones, projects: *what winning looks like*.
- **Execution layer** — daily blocks (Learn / Build / Automate / Share / Sell / Health / Reading / Outreach…), each with its own tracking method: *what you do every day*.
- **Measurement layer** — scoreboards (KPIs), streaks, day/week scores, health status: *whether it's working*.
- **Reflection layer** — daily check-in + end-of-day, weekly review, final retrospective: *what you learn and carry forward*.

Design principles:
1. **Personal-first, single-user** — matches bishOS. No sharing/permissions in scope.
2. **Reuse the spine.** Everything hangs off `lifeAreas → sections`. A challenge *spans* areas (like today's `areaIds`) and *links* existing goals/tasks/habits/focus rather than owning parallel copies.
3. **Parallel by default.** Multiple active challenges coexist; a task/focus session may belong to at most one challenge but the Today view aggregates across all active challenges.
4. **Low-friction daily loop, dense weekly/analytics.** The Today cockpit must be ≤ 60 seconds to log a full day.
5. **Premium OS feel** — cards, progress rails, heatmaps, streak rings, timeline. Reuse the existing design system (`components/ui.tsx`, the `--sprint` theme token, Sora font, HSL CSS-var theming, light+dark).

---

## 2. Information architecture

```
Challenge (container, spans life areas)
├── Overview / meta ........ title, outcome, category, dates, theme, health, status
├── Blocks .................. ChallengeBlock[]  (Learn/Build/Sell…) each w/ trackingType
│     └── daily entries ..... ChallengeBlockLog[]  (value per block per day + proof + links)
├── Days .................... ChallengeDay[]  (check-in + EOD review + dayScore, one/day)
├── Structure
│     ├── Goals ............. goals.challengeId        (reuse existing goals)
│     │     └── Milestones .. milestones.goalId/challengeId  (NEW table: due, links, %)
│     └── Projects .......... projects.challengeId     (reuse existing projects)
├── Linked practice
│     ├── Habits ............ habits.challengeId        (reuse; today uses projectId)
│     ├── Focus sessions .... focusSessions.challengeId (reuse; drives focus KPIs)
│     └── Tasks ............. tasks.challengeId (+challengeBlockId, +milestoneId)
├── Metrics / scoreboard .... ChallengeMetric[] (manual | derived) + ChallengeMetricEntry[]
├── Reviews ................. ChallengeReview[] (weekly | final)   (daily EOD lives on ChallengeDay)
├── Proof ................... ProofItem[] (link/file/image/text)
└── Notes / reflections ..... notes.linkedChallengeIds[] (reuse notes)
```

**Navigation.** Add `Challenges` to `components/Sidebar.tsx` NAV (icon `Rocket` or `Flag`, placed under Projects). Route tree:

```
/challenges                        Challenge list (active + past + templates entry)
/challenges/new                    Creation wizard
/challenges/[id]                   Challenge dashboard (default tab)
/challenges/[id]/today             Today cockpit  (also reachable from global Today)
/challenges/[id]/goals             Goals & milestones
/challenges/[id]/projects          Projects
/challenges/[id]/blocks            Blocks / tracker
/challenges/[id]/calendar          Calendar / timeline
/challenges/[id]/reviews           Reviews (daily/weekly/final)
/challenges/[id]/analytics         Analytics
/challenges/[id]/settings          Edit meta / blocks / metrics / archive / duplicate
```

Use a persistent sub-tab bar inside `/challenges/[id]` (Dashboard · Today · Goals · Projects · Blocks · Calendar · Reviews · Analytics) rather than full page reloads.

---

## 3. User flows

**F1 — Create from template (primary).** Challenges → "New" → pick template ("38-day AI Agency") → wizard prefills blocks/goals/metrics/duration → adjust dates & outcome → tweak blocks → Create → land on Dashboard with an empty Day 1 ready.

**F2 — Create blank.** Challenges → New → blank → Basics → add blocks (choose tracking type each) → optionally add goals/milestones, link/create projects, link habits → pick KPIs → Create.

**F3 — Daily loop (the core habit).** Open Today (global Today aggregates all active challenges, or per-challenge Today) → check-in (energy, mood, 1–3 priorities) → for each block, log its value by its tracking type; attach proof; start focus timer on a block; link a log to a project/milestone/goal → mark blocks complete → write EOD (wins, blockers, lessons, improve-tomorrow) → see dayScore + streak update.

**F4 — Weekly review.** Reviews → "Start weekly review" → system assembles progress-by-goal/project, habit consistency, focus + output summaries (reusing the [reviews.ts](../convex/reviews.ts) assembly pattern) → user writes insights + next-week priorities → optional AI draft → save.

**F5 — Close a challenge.** Settings/Dashboard → "Complete challenge" → generates Final Retrospective (final score, completed/failed/worked, carry-forward list) → status→`completed`. Carry-forward items can seed a new challenge (F6).

**F6 — Duplicate / carry forward.** Challenge → "Duplicate" (clone blocks/metrics/structure, reset dates & logs) OR "Save as template". Final review carry-forward → "Start next challenge" pre-links chosen items.

---

## 4. Screen-by-screen breakdown

### 4.1 Challenge list — `/challenges`
- Header: title + "New Challenge"; filter chips (Active · Completed · Archived · All) + category filter; sort (start date / health / progress).
- **Active grid**: challenge cards — icon/color rail, title, category tag, days-left, **progress ring** (completion %), **streak flame**, **health badge** (On track / At risk / Off track), 3 top KPIs. Multiple actives shown together.
- **Past** section (completed/archived) as compact cards with final score.
- Empty state → template gallery (system templates + "Blank").
- Row/card actions: Open · Duplicate · Archive · Delete (confirm).

### 4.2 Creation wizard — `/challenges/new`
Stepper (progress rail). Steps:
1. **Basics** — title, description, category (select), target outcome, theme (color+icon), start date + (end date **or** duration days; each derives the other), timezone (default profile).
2. **Start point** — Template gallery or Blank. Selecting a template prefills steps 3–5.
3. **Blocks** — add/reorder execution blocks; per block choose **tracking type** (see §5.5) + unit + daily target + optional life-area link. Quick-add chips for common blocks (Learn, Build, Automate, Share, Sell, Health, Spiritual, Reading, Outreach, Content, Communication, English).
4. **Structure (optional)** — add goals (title + optional metric target); add milestones (title + due); link existing projects or create new; link existing habits.
5. **Metrics** — pick KPIs from a catalog (§8); mark each manual or derived; set targets.
6. **Review & create** — summary; Create.

Each step after Basics is skippable → challenge is created "draft-lean" and completed later from Settings. Persist wizard state so refresh doesn't lose it.

### 4.3 Challenge dashboard — `/challenges/[id]`
Hero: title, outcome, **health badge**, **completion ring**, days-left + `timeElapsed%`, **streak**. Below:
- **Scoreboard row** — StatCards for the pinned KPIs (reuse `StatCard`).
- **Block adherence** — blocks × last-14-days **heatmap**; today's blocks with quick "Log" buttons.
- **Structure rails** — Goals (progress bars), Milestones (next 3 by due), Projects strip (status + next action).
- **Momentum / recent activity** — latest logs, proof, wins (ties into existing `momentum` table).
- Primary CTA: **Open Today**.

### 4.4 Today cockpit — `/challenges/[id]/today` (and aggregated global Today)
The lowest-friction, highest-frequency screen. Sections:
1. **Check-in** — energy (1–5), mood (1–5), pick **1–3 priorities** (link tasks or free text), one-line intention.
2. **Blocks** — one row per active block; input rendered by tracking type (checkbox / stepper / minutes / rating stars / text / link / file / yes-no). Each row: complete toggle, **focus-timer button** (starts a `focusSession` tagged with challengeId+blockId), "attach proof", and a link picker (project / milestone / goal / task).
3. **Blockers** — quick add.
4. **EOD review** — wins, blockers recap, lessons, "improve tomorrow", satisfaction (1–5). Collapsible until evening.
5. **Day footer** — live **dayScore**, streak, "complete day". 
Reuse the `dailyFlow` morning/evening ritual affordance where natural; a challenge day is a superset.

### 4.5 Goals & milestones — `/challenges/[id]/goals`
Goals list (progress, metric current/target). **Milestones timeline** ordered by due date with status pills; each milestone shows linked tasks (done/total drives %) and linked project. Inline add/edit; drag to reorder. Progress rollups computed per §7.

### 4.6 Projects — `/challenges/[id]/projects`
Project cards: status, progress, **next actions** (top open linked tasks), linked milestones, **recent activity** (logs + focus in challenge window). "Add project" links existing or creates one pre-tagged `challengeId`. Buttons to attach today's log / focus to a project.

### 4.7 Blocks / tracker — `/challenges/[id]/blocks`
- Block manager (add / edit tracking type / target / archive / reorder).
- **Tracker matrix**: blocks (rows) × days (columns) heatmap of completion; click a cell to view/edit that day's log.
- Per-block panel: streak, 30-day adherence, trend sparkline, total (sum of counts/minutes).

### 4.8 Calendar / timeline — `/challenges/[id]/calendar`
Challenge window as a **timeline**: Day 1…N with dayScore heat; milestone markers on their due dates; weekly review markers; today indicator. Month grid ↔ linear timeline toggle. Click a day → that day's log/review.

### 4.9 Reviews — `/challenges/[id]/reviews`
Tabs: **Daily** (history of EOD entries), **Weekly** (assembled sections + user insights + AI draft), **Final** (retrospective). "Start review" assembles data; AI draft via existing OpenRouter action pattern.

### 4.10 Analytics — `/challenges/[id]/analytics`
Execution-score trend (line), focus hours (bars, reuse `WeeklyBars`/`Chart`), KPI cards vs target, block-completion breakdown, streak history, output summary (content published / leads / emails…), pace projection (§7). Export as note/markdown.

---

## 5. Database schema / entity design

> Convex (`convex/schema.ts`). All new FKs on existing tables are `v.optional(...)` → additive, no migration required for existing rows. Enums use `v.union(v.literal(...))` to match house style. Timestamps are ms numbers; day keys are `YYYY-MM-DD` strings (matches `dailyCheckIns`, `habitCompletions`).

### 5.1 `challenges`
```ts
challenges: defineTable({
  userId: v.id("users"),
  title: v.string(),
  description: v.optional(v.string()),
  category: v.union(
    v.literal("business"), v.literal("skill"), v.literal("health"),
    v.literal("spiritual"), v.literal("content"), v.literal("sales"),
    v.literal("discipline"), v.literal("custom"),
  ),
  status: v.union(
    v.literal("draft"), v.literal("active"), v.literal("paused"),
    v.literal("completed"), v.literal("archived"),
  ),
  targetOutcome: v.optional(v.string()),
  color: v.optional(v.string()),
  icon: v.optional(v.string()),            // lucide name or emoji
  startDate: v.number(),
  endDate: v.number(),                     // derived from duration if only duration given
  durationDays: v.number(),
  timezone: v.optional(v.string()),
  primaryLifeAreaId: v.optional(v.id("lifeAreas")),
  areaIds: v.optional(v.array(v.id("lifeAreas"))),   // spans areas (mirrors sprint)
  templateId: v.optional(v.id("challengeTemplates")),
  settings: v.optional(v.object({
    minDayScore: v.optional(v.number()),   // streak qualifies at ≥ this (default 60)
    restDays: v.optional(v.array(v.number())), // 0-6 weekdays excused from streak
    weights: v.optional(v.object({         // dayScore weights (sum≈1)
      blocks: v.optional(v.number()),
      priorities: v.optional(v.number()),
      checkIn: v.optional(v.number()),
    })),
  })),
  pinned: v.optional(v.boolean()),
  order: v.optional(v.number()),
  completedAt: v.optional(v.number()),
  finalScore: v.optional(v.number()),      // snapshot at close
})
  .index("by_user", ["userId"])
  .index("by_user_status", ["userId", "status"]),
```

### 5.2 `challengeTemplates`
```ts
challengeTemplates: defineTable({
  userId: v.optional(v.id("users")),       // null/absent = system template
  isSystem: v.boolean(),
  title: v.string(),
  description: v.optional(v.string()),
  category: v.string(),
  durationDays: v.number(),
  icon: v.optional(v.string()),
  color: v.optional(v.string()),
  blocks: v.array(v.object({               // block defs (no ids yet)
    name: v.string(), icon: v.optional(v.string()), color: v.optional(v.string()),
    trackingType: v.string(), unit: v.optional(v.string()),
    target: v.optional(v.number()), targetPeriod: v.optional(v.string()),
  })),
  suggestedGoals: v.optional(v.array(v.object({ title: v.string(), metricTarget: v.optional(v.number()), unit: v.optional(v.string()) }))),
  suggestedMilestones: v.optional(v.array(v.object({ title: v.string(), dayOffset: v.number() }))),
  suggestedHabits: v.optional(v.array(v.object({ title: v.string(), frequency: v.string() }))),
  metrics: v.optional(v.array(v.object({ key: v.string(), label: v.string(), unit: v.optional(v.string()), kind: v.string(), source: v.optional(v.any()), target: v.optional(v.number()) }))),
  settings: v.optional(v.any()),
}).index("by_user", ["userId"]).index("by_system", ["isSystem"]),
```

### 5.3 `challengeBlocks`
```ts
challengeBlocks: defineTable({
  userId: v.id("users"),
  challengeId: v.id("challenges"),
  name: v.string(),
  icon: v.optional(v.string()),
  color: v.optional(v.string()),
  order: v.number(),
  trackingType: v.union(
    v.literal("checkbox"), v.literal("count"), v.literal("duration"),
    v.literal("text"), v.literal("rating"), v.literal("link"),
    v.literal("file"), v.literal("yesno"), v.literal("streak"), v.literal("milestone"),
  ),
  unit: v.optional(v.string()),            // "reps", "pages", "emails", "min"
  target: v.optional(v.number()),          // daily/period target
  targetPeriod: v.optional(v.union(v.literal("day"), v.literal("week"), v.literal("challenge"))),
  lifeAreaId: v.optional(v.id("lifeAreas")),
  active: v.boolean(),
})
  .index("by_challenge", ["challengeId"]),
```

### 5.4 `challengeDays`
```ts
challengeDays: defineTable({
  userId: v.id("users"),
  challengeId: v.id("challenges"),
  date: v.string(),                        // YYYY-MM-DD (client-local)
  dayNumber: v.number(),                   // 1-based within challenge
  checkIn: v.optional(v.object({
    energy: v.optional(v.number()),        // 1-5
    mood: v.optional(v.number()),          // 1-5
    intention: v.optional(v.string()),
    priorities: v.optional(v.array(v.string())),
    priorityTaskIds: v.optional(v.array(v.id("tasks"))),
  })),
  eod: v.optional(v.object({
    wins: v.optional(v.array(v.string())),
    blockers: v.optional(v.array(v.string())),
    lessons: v.optional(v.string()),
    improveTomorrow: v.optional(v.string()),
    satisfaction: v.optional(v.number()),  // 1-5
  })),
  dayScore: v.optional(v.number()),        // 0-100 derived, cached on write
  status: v.union(
    v.literal("pending"), v.literal("checked_in"),
    v.literal("logged"), v.literal("complete"), v.literal("missed"),
  ),
})
  .index("by_challenge", ["challengeId"])
  .index("by_challenge_date", ["challengeId", "date"]),
```

### 5.5 `challengeBlockLogs`  (per block, per day)
```ts
challengeBlockLogs: defineTable({
  userId: v.id("users"),
  challengeId: v.id("challenges"),
  blockId: v.id("challengeBlocks"),
  date: v.string(),                        // YYYY-MM-DD
  dayNumber: v.number(),
  done: v.optional(v.boolean()),           // checkbox / yesno / streak
  count: v.optional(v.number()),           // count
  minutes: v.optional(v.number()),         // duration
  rating: v.optional(v.number()),          // rating 1-5
  text: v.optional(v.string()),            // text entry
  link: v.optional(v.string()),            // link proof
  proofItemIds: v.optional(v.array(v.id("proofItems"))),
  // structural connections (all optional)
  projectId: v.optional(v.id("projects")),
  milestoneId: v.optional(v.id("milestones")),
  goalId: v.optional(v.id("goals")),
  taskId: v.optional(v.id("tasks")),
  focusSessionId: v.optional(v.id("focusSessions")),
  notes: v.optional(v.string()),
})
  .index("by_challenge_date", ["challengeId", "date"])
  .index("by_block", ["blockId"])
  .index("by_block_date", ["blockId", "date"]),
```

### 5.6 `milestones`  (promoted from inline arrays)
```ts
milestones: defineTable({
  userId: v.id("users"),
  challengeId: v.optional(v.id("challenges")),
  goalId: v.optional(v.id("goals")),
  title: v.string(),
  description: v.optional(v.string()),
  dueDate: v.optional(v.number()),
  status: v.union(v.literal("todo"), v.literal("in_progress"), v.literal("done"), v.literal("missed")),
  progress: v.optional(v.number()),        // 0-100; derived from linked tasks if any
  manualProgress: v.optional(v.boolean()), // true → progress is user-set, not derived
  linkedTaskIds: v.optional(v.array(v.id("tasks"))),
  linkedProjectId: v.optional(v.id("projects")),
  order: v.number(),
})
  .index("by_challenge", ["challengeId"])
  .index("by_goal", ["goalId"]),
```
> Keep the existing inline `milestones: {text,done}[]` on `goals`/`projects` for back-compat; new module reads the table. A migration helper can lift inline milestones into rows on convert.

### 5.7 `challengeMetrics` + `challengeMetricEntries`
```ts
challengeMetrics: defineTable({
  userId: v.id("users"),
  challengeId: v.id("challenges"),
  key: v.string(),                         // "cold_emails", "gym_days", "leads"
  label: v.string(),
  icon: v.optional(v.string()),
  unit: v.optional(v.string()),
  kind: v.union(v.literal("manual"), v.literal("derived")),
  // derived source: aggregate over blockLogs / focus / days / tasks
  source: v.optional(v.object({
    from: v.union(v.literal("blockLog"), v.literal("focus"), v.literal("days"), v.literal("tasks"), v.literal("builtin")),
    blockId: v.optional(v.id("challengeBlocks")),
    field: v.optional(v.string()),         // "count" | "minutes" | "done"
    agg: v.optional(v.union(v.literal("sum"), v.literal("count"), v.literal("max"), v.literal("streak"), v.literal("avg"))),
    builtin: v.optional(v.string()),       // "daysCompleted" | "currentStreak" | "executionScore" | "focusHours"
  })),
  target: v.optional(v.number()),
  direction: v.optional(v.union(v.literal("up"), v.literal("down"))),
  order: v.number(),
  pinned: v.optional(v.boolean()),
}).index("by_challenge", ["challengeId"]),

challengeMetricEntries: defineTable({       // manual metric time-series
  userId: v.id("users"),
  challengeId: v.id("challenges"),
  metricId: v.id("challengeMetrics"),
  date: v.string(),
  value: v.number(),
  note: v.optional(v.string()),
}).index("by_metric", ["metricId"]).index("by_challenge_date", ["challengeId", "date"]),
```

### 5.8 `challengeReviews`  (weekly + final; daily EOD lives on `challengeDays`)
```ts
challengeReviews: defineTable({
  userId: v.id("users"),
  challengeId: v.id("challenges"),
  type: v.union(v.literal("weekly"), v.literal("final")),
  weekIndex: v.optional(v.number()),       // 1-based for weekly
  periodStart: v.string(),
  periodEnd: v.string(),
  content: v.any(),                        // assembled structured sections (see §9)
  aiInsights: v.optional(v.string()),
  userNotes: v.optional(v.string()),
  finalScore: v.optional(v.number()),      // final type only
})
  .index("by_challenge", ["challengeId"])
  .index("by_challenge_type", ["challengeId", "type"]),
```

### 5.9 `proofItems`
```ts
proofItems: defineTable({
  userId: v.id("users"),
  challengeId: v.id("challenges"),
  dayNumber: v.optional(v.number()),
  blockId: v.optional(v.id("challengeBlocks")),
  kind: v.union(v.literal("link"), v.literal("file"), v.literal("image"), v.literal("text")),
  url: v.optional(v.string()),
  storageId: v.optional(v.id("_storage")),
  caption: v.optional(v.string()),
  createdAt: v.number(),
}).index("by_challenge", ["challengeId"]),
```

### 5.10 FKs added to existing tables (additive, all optional)
```ts
// tasks:          challengeId?, challengeBlockId?, milestoneId?
// goals:          challengeId?
// projects:       challengeId?           // a challenge CONTAINS projects
// habits:         challengeId?           // (keep existing projectId for back-compat)
// focusSessions:  challengeId?, challengeBlockId?
// notes:          linkedChallengeIds?: v.array(v.id("challenges"))
// dailyCheckIns:  challengeId?           // optional scope; global check-in still works
```
Add matching indexes: `tasks.by_challenge`, `goals.by_challenge`, `projects.by_challenge`, `habits.by_challenge`, `focusSessions.by_challenge`.

**Status enum summary:** challenge `draft|active|paused|completed|archived` · day `pending|checked_in|logged|complete|missed` · milestone `todo|in_progress|done|missed` · review `weekly|final` · metric `manual|derived`.

---

## 6. Key components list

**Backend (Convex)** — one file per concern, mirroring the codebase's per-domain split:
- `convex/challenges.ts` — CRUD, `dashboard` rollup query, `today` aggregate query, lifecycle (activate/pause/complete/archive), `duplicate`, `convertFromProject`.
- `convex/challengeBlocks.ts` — CRUD, reorder.
- `convex/challengeDays.ts` — `getOrCreateDay`, `checkIn`, `saveEod`, `logBlock` (upsert block log), `completeDay`, `computeDayScore` helper.
- `convex/challengeMetrics.ts` — CRUD, `values` (resolve manual + derived), `logMetric`.
- `convex/challengeReviews.ts` — `assembleWeekly`, `assembleFinal`, `save`, `generate` (AI, via OpenRouter action pattern).
- `convex/challengeTemplates.ts` — list, `instantiate`, `saveAsTemplate`, seed system templates.
- `convex/milestones.ts` — CRUD, progress recompute.
- `convex/challengeLogic.ts` — pure helpers: `dayScore`, `streak` (reuse `computeStreak`/`computeBestStreak` from [habits.ts](../convex/habits.ts)), `completionPct`, `healthStatus`, derived-metric resolver.

**Frontend (React / App Router)**
- Pages per §2 route tree.
- `components/challenges/ChallengeCard.tsx`, `ChallengeHealthBadge.tsx`, `ProgressRing.tsx`, `StreakFlame.tsx`.
- `components/challenges/CreateWizard/*` (Basics, Blocks, Structure, Metrics, Review steps).
- `components/challenges/today/CheckInPanel.tsx`, `BlockLogRow.tsx` (renders input per tracking type), `EodPanel.tsx`, `DayScoreFooter.tsx`.
- `components/challenges/BlockTrackerMatrix.tsx` (blocks × days heatmap), `Heatmap.tsx`.
- `components/challenges/MilestoneTimeline.tsx`, `Scoreboard.tsx` (KPI StatCards), `ChallengeTimeline.tsx`, `ReviewComposer.tsx`.
- Reuse: `Card`, `StatCard`, `Modal`, `WeeklyBars`, `EmptyState`, `Topbar` from [components/ui.tsx](../components/ui.tsx); `Chart` from `components/Chart.tsx`; `AddToMomentum`; the `ModuleDock` AI window with a new `moduleKey:"challenge"`.

---

## 7. Business logic / formulas

Let a challenge have days `1..N`, elapsed non-rest days `E`, and `settings.minDayScore = M` (default 60). Weights `w_b/w_p/w_c` default `0.7 / 0.2 / 0.1`.

**Block completion (per day).** For each active block, `met = value ≥ target` (or `done` for checkbox/yesno; any entry for text/link/file; `rating ≥ target||3`). `blockRatio = metCount / activeBlockCount`.

**Priorities ratio (per day).** `prioritiesDone = completed priority tasks / declared priorities` (0 if none declared).

**Check-in factor.** `1` if check-in submitted, else `0`.

**Day score.**
```
dayScore = round(100 * ( w_b*blockRatio + w_p*prioritiesDone + w_c*checkInFactor ))
```
Cache on `challengeDays.dayScore` whenever a log/check-in/eod is written.

**Streak.** Consecutive days ending today (or yesterday) with `dayScore ≥ M`, skipping configured `restDays`. Reuse `computeStreak(dateSet)` / `computeBestStreak` from habits.ts by feeding the set of qualifying dates.

**Execution score (challenge).** `mean(dayScore)` over elapsed non-rest days `E`. This is the "how hard am I actually executing" number.

**Completion %.** Outcome-weighted, blends structure and execution so it can't be gamed by logging alone:
```
completionPct = round( 0.5*milestoneProgress + 0.3*goalProgress + 0.2*executionScore )
```
(Weights configurable; if a challenge has no milestones/goals, fall back to `executionScore`.)

**Milestone progress.** If `linkedTaskIds` present and not `manualProgress`: `doneTasks/totalTasks*100`. Else `manualProgress` value. `status`: `done` at 100; `missed` if `now > dueDate && progress < 100`; else `in_progress` if `>0` else `todo`.

**Goal progress.** Reuse existing `goals.progress` (already supports `metric.current/target` or milestone-derived). Challenge goal rollup = `mean(goal.progress)`.

**Time elapsed %.** `clamp(0,100, round((now - startDate)/(endDate - startDate)*100))` (same as current `commandCenter`).

**Challenge health.** Compare execution vs expected pace:
```
gap = completionPct - timeElapsedPct
onTrack  : gap ≥ -10
atRisk   : -25 ≤ gap < -10   (also atRisk if current streak == 0 for ≥2 days)
offTrack : gap < -25
```

**Derived metrics.** Resolve `challengeMetrics.source` over the challenge window `[startDate, endDate]`:
- `blockLog`: aggregate `field` (`count|minutes|done`) across `challengeBlockLogs` for `blockId` using `agg` (`sum|count|max|avg|streak`).
- `focus`: `sum(focusSessions.duration where challengeId=… )/3600` → focus hours (also matches existing `commandCenter` focus rollup; include area/task-linked sessions in-window as it already does).
- `days`: `daysCompleted = count(challengeDays.status="complete")`.
- `builtin`: `currentStreak`, `executionScore`, `completionPct`, `focusHours`, `daysCompleted`.

**Weekly score.** `mean(dayScore)` over the 7 days of the week window (mirror `reviews.ts` week boundaries) + habit consistency (`habitCompletions` in week / expected).

**Final score.** Snapshot of `completionPct` at close, stored on `challenges.finalScore` and the final review.

---

## 8. Suggested API routes / server actions (Convex)

> All guarded by `requireUser` (see [convex/helpers.ts](../convex/helpers.ts)); single-user ownership checks like existing code.

**challenges.ts**
- `list()` → challenges + derived {health, completionPct, streak, daysLeft, pinnedKPIs}.
- `dashboard({ id })` → the big rollup (blocks+adherence, goals, milestones, projects, focus, KPIs, health) — the Challenge-scoped analogue of today's `projects.commandCenter`.
- `today({ id })` / `todayAll()` → active blocks + today's logs + check-in + eod + dayScore (single or across all active).
- `create({...})`, `update({ id, ...})`, `setStatus({ id, status })`, `remove({ id })`.
- `duplicate({ id })`, `convertFromProject({ projectId })`, `pin({ id, pinned })`.

**challengeBlocks.ts** — `list({ challengeId })`, `create`, `update`, `reorder`, `archive`.

**challengeDays.ts** — `get({ challengeId, date })`, `checkIn({ challengeId, date, energy, mood, priorities, priorityTaskIds, intention })`, `logBlock({ challengeId, blockId, date, value fields, links, proofItemIds })`, `saveEod({...})`, `completeDay({ challengeId, date })`. Each recomputes+caches `dayScore` and day `status`.

**milestones.ts** — `list({ challengeId })`, `create`, `update`, `remove`, `setLinkedTasks`, `recompute`.

**challengeMetrics.ts** — `list({ challengeId })`, `values({ challengeId })` (resolves manual+derived), `create`, `update`, `remove`, `logEntry({ metricId, date, value })`.

**challengeReviews.ts** — `assembleWeekly({ challengeId, weekIndex|offset })` (query), `assembleFinal({ challengeId })`, `save({...})`, `generate({...})` (action → OpenRouter, mirrors `reviews.generate`).

**challengeTemplates.ts** — `list()`, `instantiate({ templateId, startDate })` (creates challenge + blocks + suggested goals/milestones/metrics), `saveAsTemplate({ challengeId })`.

**proofItems.ts** — `add`, `list({ challengeId })`, `remove` (+ reuse `files.ts` for upload URLs / storage).

Frontend calls these via `useQuery`/`useMutation`/`useAction` (Convex reactive) — no REST layer; matches the rest of bishOS.

---

## 9. Review content shapes (`content` payloads)

**Weekly** (`challengeReviews.content`): `{ progressByGoal:[{goalId,title,progress,delta}], progressByProject:[...], habitConsistency:[{habitId,title,rate}], focus:{hours,sessions,byBlock}, output:{metricKey:value}, dayScores:[...], insights:string, nextPriorities:string[] }`.

**Final**: `{ finalScore, daysCompleted, totalDays, executionScore, completed:[...], failed:[...], whatWorked:string, whatToImprove:string, carryForward:[{type,id,title}], kpiSummary:[{label,value,target}] }`.

Assemble live from the DB (don't precompute) exactly like [reviews.ts](../convex/reviews.ts) does for weekly reviews; snapshot into `content` only on save.

---

## 10. Implementation phases

**Phase 0 — Foundation & migration (ship the container).**
- Schema: `challenges` + FKs on tasks/goals/projects/habits/focus/notes/checkins + indexes.
- `challenges.ts` CRUD + `list` + `dashboard` (port `commandCenter` rollup, add challenge scoping).
- Sidebar "Challenges" entry; `/challenges` list; `/challenges/[id]` dashboard; minimal create form.
- `convertFromProject` for existing `kind:"sprint"` projects. **Exit:** can create a challenge, link existing projects/goals/habits, see a live dashboard.

**Phase 1 — Daily execution loop (the MVP heart).**
- `challengeBlocks` + `challengeDays` + `challengeBlockLogs`; `challengeLogic` (dayScore, streak).
- Today cockpit: check-in, per-tracking-type block logging, EOD, dayScore, streak. Focus-timer integration on blocks (`focusSessions.challengeId/challengeBlockId`).
- Blocks/tracker view with the blocks×days heatmap. **Exit:** full ≤60s daily log; streak + dayScore live.

**Phase 2 — Structure & scoreboards.**
- `milestones` table + Goals & Milestones view + rollups; Projects view.
- `challengeMetrics` (+entries): manual KPIs + core derived (focusHours, daysCompleted, executionStreak). Scoreboard on dashboard. **Exit:** milestone/goal progress rolls into completion% and health.

**Phase 3 — Reviews, calendar, analytics.**
- `challengeReviews` weekly + final (assemble + AI draft); Reviews view.
- Calendar/timeline view; Analytics view (trends, KPI charts, streak history, pace projection). **Exit:** can run a full weekly review and close with a final retrospective.

**Phase 4 — Templates, AI coach, polish.**
- `challengeTemplates` (system seeds incl. "38-day AI Agency", "30-day Sales", "21-day Health") + save-as-template + duplicate.
- Challenge AI coach via `ModuleDock` (`moduleKey:"challenge"`), confirm-before-write actions (log block, add milestone, draft review).
- Proof gallery, notifications/cron reminders (reuse `push`/`crons`), momentum auto-logging, cross-challenge compare.

---

## 11. Smart product suggestions (consistency & accountability)

1. **Streak insurance / rest days** — configurable `restDays` so a planned off-day doesn't break the streak; one "grace day" per week to prevent all-or-nothing collapse.
2. **Proof-to-close** — optionally require a proof item to mark a "Share/Build/Sell" block complete; turns logging into evidence (great for content/agency work).
3. **Pace projection** — "At your current execution score you'll finish at 74%. Hit 3 blocks/day to reach 90%." Shown on dashboard + analytics from §7 numbers.
4. **AI accountability nudges** — evening push (reuse `pushSend`/`crons`) if today isn't logged; morning nudge surfacing yesterday's "improve tomorrow" as today's focus.
5. **Momentum tie-in** — EOD wins auto-offer "add to Momentum" (existing `momentum` table), so a challenge feeds the global win log.
6. **Carry-forward loop** — final retrospective's carry-forward list seeds the next challenge's goals/blocks in one click; challenges become a compounding chain, not one-offs.
7. **Commitment contract** — optional stake/why statement shown on the dashboard header and in nudges ("You said this matters because…").
8. **Block focus timer** — every block row starts a `focusSession` tagged to the block, so focus KPIs are a byproduct of doing the work, not separate bookkeeping.
9. **Weekly "one number"** — surface a single north-star KPI per challenge (e.g. cold emails, content pieces) big on the dashboard to fight metric overload.
10. **Cross-challenge dashboard** — a global "Command" strip on the main Dashboard aggregating all active challenges' health + today's unlogged blocks, so parallel challenges stay visible.
11. **Adaptive daily questions** — reuse the existing `checkins.aiQuestions` action to vary EOD prompts by block category (sales vs. health), keeping reflection fresh.
12. **Template marketplace (personal)** — save any finished challenge as a reusable template; over time Bish builds his own library of proven sprint formats.

---

## 12. Non-goals (v1)
- Multi-user / sharing / accountability partners (single-user OS).
- Auto-pulling every item in a linked area (explicit links only, matching current sprint decision).
- Gantt dependencies / drag-scheduling inside the timeline.
- Native mobile app (responsive web only; desktop-first).
- Replacing the global Daily Check-in / Weekly Review — challenge reviews are *scoped additions*, the global ritual stays.
```
