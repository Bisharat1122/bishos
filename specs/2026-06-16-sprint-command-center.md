# Spec: Sprint Command Center

| | |
|---|---|
| **Status** | Draft |
| **Created** | 2026-06-16 |
| **Author** | Bish / Claude Code |
| **Area** | `app/(app)/projects/[id]` (sprint view), `convex/projects.ts`, `convex/schema.ts`, goals/habits/tasks link points |

## 1. Problem & context
A Sprint today is tied to **one** life area and only surfaces its own tasks + milestones ([app/(app)/projects/[id]/page.tsx](../app/(app)/projects/[id]/page.tsx)). For a 90‑day, life‑wide push, Bish wants the sprint page to be a **single command center** that spans **multiple life areas** and shows **everything he links to it** — goals, habits, milestones, tasks — with a **planning table** (the 90‑day arc) and a **tracking table** (live progress). One page to run the whole sprint.

## 2. Goals
- A sprint can be linked to **multiple life areas** and to **specific goals, habits, and tasks**.
- The sprint page aggregates all linked items into **summary stats**, a **Plan matrix** (Area × Phase), and a **Track table** (live roll‑up).
- Linking/unlinking is doable from the sprint page (and from the item's own page), including "create new, already linked."
- No regression to existing sprints/standard projects (all changes additive).

## 3. Non-goals (out of scope)
- Changing standard (non‑sprint) projects' behavior.
- Cross‑sprint analytics or comparing multiple sprints.
- Auto‑including every item in a linked area (we use **explicit** links, not area‑wide auto‑pull) — areas are shown as context + matrix rows, but goals/habits/tasks appear only when explicitly linked.
- Gantt charts, dependencies, drag‑scheduling.
- Notes/projects‑as‑subprojects nesting.

## 4. User stories
- As **Bish**, I want to **attach several life areas** to my 90‑day sprint so it reflects my whole life, not one area.
- As **Bish**, I want to **link specific goals, habits, and tasks** to the sprint so the page shows exactly what this sprint is about.
- As **Bish**, I want a **Plan table** (Now / Day 30 / Day 60 / Day 90 per area) to lay out the arc.
- As **Bish**, I want a **Track table** that pulls **live progress and streaks** so I can see status at a glance.
- As **Bish**, I want **roll‑up stats** (days left, goals progress, habit adherence, focus hours, task completion) at the top.

## 4a. End-to-end user journey (the accepted flow)

The single happy path that defines "this feature works." Each step lists the **trigger → system response → observable result**.

**Stage 1 — Create the sprint (start point)**
1. Bish opens **Projects → New → Sprint**, names it "90‑Day Ascent", sets duration 90 days and a start date, picks a **primary** life area, and launches.
   → System creates the sprint and routes to its page.
   → He lands on the **Sprint Command Center** showing the hero (countdown, time‑elapsed bar) and **empty** Plan matrix + Track table with guiding empty states.

**Stage 2 — Link the life areas (define the scope)**
2. He clicks **[+ Link area]** and multi‑selects Business, Sales, Communication, Engineering, AI, Health, Relationships.
   → System saves `areaIds` (primary area auto‑included).
   → Area **chips** appear under the hero, and the **Plan matrix gains one row per area**.

**Stage 3 — Plan the arc (the Plan matrix)**
3. For each area row he types short targets into **Now / Day 30 / Day 60 / Day 90** and sets each cell's status dot.
   → Each cell saves on blur (`planGrid`).
   → Reloading the page shows the saved grid (persistence proven).

**Stage 4 — Populate the sprint (link or create items)**
4. He opens **Link** and either picks existing **goals / habits / tasks** or uses **"Create new, already linked"** (e.g., goal "Land 3 clients", habit "Daily outreach", task "Ship portfolio v1").
   → System sets each item's `projectId` to this sprint.
   → Items appear in the **Track table** with live **progress bars / 🔥 streaks**, due dates, and a derived **status chip**.
   → Stat tiles update (goals avg progress, habit adherence, tasks done/total, focus hours, days left).

**Stage 5 — Daily/weekly operation (the payoff)**
5. Each day Bish completes habits, advances tasks, logs focus elsewhere in bishOS.
   → The Command Center reflects all of it **live** (streaks tick up, progress bars move, status chips re‑derive from progress vs. time elapsed) without manual updates here.
6. He **sorts** the Track table by status and **filters** by area to find what's "Behind."
   → Table reorders/narrows instantly.

**Stage 6 — Adjust & curate**
7. He **unlinks** an item that no longer belongs (or re‑points it to another sprint).
   → It disappears from this sprint's roll‑up but **still exists** in its own module; stats recompute.

**Stage 7 — End point (sprint close)**
8. At day 90 he reviews the page: milestones/goals at their final %, habit best‑streaks, total focus hours.
   → If he deletes the sprint, its goals/habits/tasks **survive** with `projectId` cleared (nothing is lost).
   → **End state:** one page told the whole 90‑day story start‑to‑finish, and dismantling it left all underlying data intact.

### Accepted flow (acceptance gate)
The feature is **accepted** when a user can, in one sitting and without leaving the sprint page, do **all** of:
`create sprint → link multiple areas → fill & persist the Plan matrix → link/create goals + habits + tasks → see them in the Track table with live progress/streaks + correct stat tiles → sort/filter the table → unlink an item (it survives) → reopen later and see everything intact`, **and** a pre‑existing single‑area sprint still opens and works unchanged. Each leg of this chain maps to a checkbox in §8.

## 5. Functional requirements
1. A sprint MUST support **multiple linked life areas** via a new `areaIds[]`, while keeping the existing single `lifeAreaId` as the "primary" area (back‑compat).
2. A **habit** MUST be linkable to a sprint via a new optional `projectId` (goals and tasks already have `projectId`).
3. The sprint page MUST show **linked Life Areas** as chips with an **add/remove** control.
4. The sprint page MUST show a **Plan matrix**: one row per linked area, columns **Now · Day 30 · Day 60 · Day 90**, each cell an editable short text target + a status marker.
5. The sprint page MUST show a **Track table**: one row per linked **goal / habit / milestone / task**, columns **Item · Type · Area · Progress‑or‑Streak · Due · Status**, sortable by column and filterable by type/area.
6. The sprint page MUST show **summary stat tiles**: days left, overall milestone %, linked‑goals avg progress, linked‑habits 30‑day adherence, focus hours (sprint window, across linked areas/projects), tasks done/total.
7. Bish MUST be able to **link/unlink** goals, habits, and tasks to the sprint from the sprint page (picker of existing + "create new linked").
8. Goals/Habits/Tasks pages SHOULD show a small "Part of sprint: {name}" indicator when linked, with an unlink affordance.
9. Removing a sprint MUST **unlink** (not delete) its goals/habits/tasks (clear `projectId`) — consistent with current `projects.remove` behavior for tasks/goals; habits get the same treatment.
10. All new fields MUST be optional so existing sprints/standard projects keep working.

## 6. UI / UX decisions
- Extends the existing sprint layout in [app/(app)/projects/[id]/page.tsx](../app/(app)/projects/[id]/page.tsx); reuse `Card`, `StatCard`, sprint hero, lime/`--sprint` violet tokens, dark‑first.
- **Areas chips row** under the sprint hero: each links to the life area; a `[+ Link area]` opens a multi‑select.
- **Plan matrix** (`Card`): sticky first column (Area), 4 phase columns. Cells are inline‑editable text (blur‑to‑save) with a status dot cycling Todo→Doing→Done. Stored on the sprint (see §7). Horizontal scroll on mobile.
- **Track table** (`Card`): compact rows; Progress shown as a mini bar (goals/tasks) or 🔥 streak (habits); Status chip (On track / At risk / Behind / Done) derived from progress vs. time elapsed. Column header click = sort; small type/area filter chips above. Empty state explains how to link.
- **Stat tiles**: a `StatCard` grid identical in style to the Schedule/Habits analytics rows.
- **Link picker**: a modal/portal list of the user's goals/habits/tasks not yet linked, with search + a "Create new…" inline that creates the item already carrying this `projectId` (and a sensible area).
- Light/dark: tokens only, no hardcoded colors except the existing sprint violet/lime. Responsive: tables scroll horizontally; tiles wrap.

## 7. Data & technical considerations
- **[convex/schema.ts](../convex/schema.ts)**:
  - `projects`: add `areaIds: v.optional(v.array(v.id("lifeAreas")))` and `planGrid: v.optional(v.array(v.object({ areaId: v.id("lifeAreas"), now: v.string(), d30: v.string(), d60: v.string(), d90: v.string(), status: v.optional(v.string()) })))` for the Plan matrix.
  - `habits`: add `projectId: v.optional(v.id("projects"))` + index `by_project`.
- **[convex/projects.ts](../convex/projects.ts)**:
  - New `commandCenter({ id })` query → `{ project, areas, goals, habits (+streak/adherence), tasks, focusHours, stats }`, aggregating linked items (goals/tasks via `by_project`, habits via new `by_project`, areas via `areaIds`).
  - Mutations: `setAreas({ id, areaIds })`, `setPlanCell({ id, areaId, field, value })`, and link/unlink helpers (or reuse `tasks.update`/`goals.update`/`habits.update` to set/clear `projectId`).
  - `remove`: also clear `projectId` on linked habits (extend existing loop that clears tasks/goals).
- **Habits** ([convex/habits.ts](../convex/habits.ts)): `create`/`update` accept optional `projectId`; streak/adherence reuse existing `computeStreak`/`computeBestStreak` + 30‑day rate.
- Reuse: focus roll‑up via existing `focusSessions` (filter by sprint window + linked areas/projects); status derivation reuses progress fields already present.
- Codegen: run `npx convex dev --once` after schema/query changes; then `tsc --noEmit` + full `npm run build` before pushing (project rule).

## 8. Acceptance criteria
- [ ] Given a sprint, when Bish links 3 life areas, then 3 area chips appear and the Plan matrix has 3 rows.
- [ ] Given a goal/habit/task linked to the sprint, when Bish opens the sprint, then it appears in the Track table with live progress/streak and a status chip.
- [ ] Given Bish edits a Plan‑matrix cell and blurs, then the value persists (reload‑safe) on the sprint.
- [ ] Given linked items, when the page loads, then stat tiles show correct days‑left, avg goal progress, habit adherence, focus hours, and tasks done/total.
- [ ] Given Bish clicks a Track‑table column header, then rows sort by it; type/area filters narrow the list.
- [ ] Given Bish unlinks an item, then it disappears from the sprint but still exists in its own module.
- [ ] Given an existing pre‑feature sprint, when opened, then it works unchanged (single area still shown, no errors).
- [ ] Given Bish deletes the sprint, then its goals/habits/tasks survive with `projectId` cleared.

## 9. Edge cases & error handling
- **No links yet** → friendly empty states in matrix ("Link areas to plan") and track table ("Link goals, habits, or tasks").
- **Primary `lifeAreaId` not in `areaIds`** → always include the primary area in the matrix/areas list (union).
- **Linked item deleted elsewhere** → it simply drops from the roll‑up (queries resolve live).
- **Habit/goal/task linked to a different project already** → linking re‑points `projectId` (one project per item); show its current sprint before reassigning.
- **Plan grid for an unlinked/removed area** → ignore stale rows; render only current `areaIds` (+ primary).
- **Large numbers of linked items** → table virtualization not required for single‑user scale; cap initial sort cost; lazy‑filter client‑side.
- **Status math when no time elapsed / no due date** → fall back to "On track"/neutral rather than "Behind".

## 10. Assumptions
- One item belongs to at most **one** sprint at a time (single `projectId`) — acceptable for now.
- "Phase" columns are fixed at **Now / 30 / 60 / 90**; not user‑configurable in v1.
- Focus roll‑up uses the **sprint date window** and linked **areas + the sprint's own project** attribution.
- Status chips are derived (progress vs. % time elapsed), not manually set, except the Plan‑matrix cell dot.

## 11. Open questions (resolve during planning/implementation)
- [ ] Should the Track table also include **schedule blocks** linked to the sprint, or keep it to goals/habits/milestones/tasks for v1?
- [ ] Do milestones in the Track table come **only** from the sprint's own `milestones[]`, or also from linked **goals' milestones**?
- [ ] Are the four phase columns enough, or do you want a configurable cadence later (e.g., weekly)?
- [ ] Should "Focus hours" count area‑attributed sessions even when the task isn't explicitly linked to the sprint (area‑wide), or only sprint‑linked items?
