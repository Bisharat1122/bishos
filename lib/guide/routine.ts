/**
 * The bishOS operating rhythm — one-time setup, daily, weekly, monthly,
 * quarterly, yearly, first week, and a quick test plan. Pure data (used by
 * the Guide page and the PDF manual).
 */

export type RoutineStep = { title: string; minutes?: number; where: string; detail: string };
export type RoutineBlock = { id: string; title: string; when: string; summary: string; steps: RoutineStep[] };

export const ONE_TIME_SETUP: RoutineBlock = {
  id: "setup",
  title: "One-time setup",
  when: "Once, over your first 2–3 days (about 90 minutes in total)",
  summary:
    "Set up the spine of the system once. After this, the daily check-in, reviews and dashboards fill themselves. Do the steps in order — each one makes the next smarter.",
  steps: [
    { title: "Profile", minutes: 5, where: "/profile", detail: "Add your name, city, business and current situation. The AI assistant reads this so it can talk to you as you." },
    { title: "Life Areas", minutes: 10, where: "/today?setup=1", detail: "Run the setup wizard. Keep Company Operations, Company Sales & Marketing, Personal Learning & Content and Fitness. Give each a standard (what 'good' looks like) and weekly hour budget." },
    { title: "Settings", minutes: 5, where: "/settings", detail: "Set your daily capacity (≈5.5h), outreach quota, meetings goal, hub content per week, currency, Free Day and review day. These numbers drive Today and Founder HQ." },
    { title: "Compass", minutes: 15, where: "/compass", detail: "Write your purpose, 3–5 values, a 3-year vision, a not-to-do list and a theme for the year. Rate each Life Area 1–10 (Wheel of Life)." },
    { title: "First 12-week cycle", minutes: 20, where: "/goals", detail: "Start a cycle (next Monday). Pick at most 3 goals. For each: a key result (the outcome number) and 1–3 weekly tactics (actions you control)." },
    { title: "Ideal Week", minutes: 10, where: "/week", detail: "Design your template week: maker mornings for delivery, manager afternoons for calls, a content block, a Friday buffer + review, a Free Day. Apply it to this week." },
    { title: "Routines", minutes: 5, where: "/routines", detail: "Turn on the default start-up, shutdown, morning and evening routines (edit the steps to fit you)." },
    { title: "Keystone habits", minutes: 5, where: "/habits", detail: "Add 1–3 habits with an if–then anchor ('After I… I will…'), a 2-minute minimum version and 2 planned skips per week." },
    { title: "Founder scorecard", minutes: 5, where: "/scorecard", detail: "Click 'Start with the founder scorecard' to get 5–7 weekly numbers (outreach, conversations, deals, revenue, content, deep work)." },
    { title: "Pipeline + people", minutes: 10, where: "/pipeline", detail: "Add your current deals, each with a dated next step. Add key people with a reconnect cadence." },
    { title: "Finance", minutes: 10, where: "/finance", detail: "Run 'Set up finance', add your accounts with opening balances, your recurring bills/subscriptions and any unpaid invoices." },
    { title: "Content positioning", minutes: 20, where: "/content?tab=playbook", detail: "Playbook → Positioning for Personal and Company: content game, KPI, authority statement, audience of one, bullseye, 3-2-1 buckets, contrarian takes, lead magnet." },
    { title: "Learning area", minutes: 5, where: "/learning", detail: "Create one learning area with a target performance and a weekly minutes target." },
    { title: "Export once", minutes: 1, where: "/settings", detail: "Download a full JSON export so you know your data is yours." },
  ],
};

export const DAILY: RoutineBlock = {
  id: "daily",
  title: "Every day",
  when: "Workdays (Free Days are fully off)",
  summary: "Two 5-minute rituals bracket the day. In between: capture everything, work your Top 3 in maker blocks, run one sales block, tick habits.",
  steps: [
    { title: "Morning start-up", minutes: 5, where: "/today → Start my day", detail: "Check in (sleep, energy, mood), decide every leftover, choose the day type, pick your Top 3, check it fits your capacity, write one if–then plan, lock it in. +25 XP." },
    { title: "Capture all day", minutes: 0, where: "Press C anywhere", detail: "Every idea, promise, task or link goes to the Inbox in 2 seconds — no filing. Use Brain dump when your head is full." },
    { title: "Maker block (morning)", minutes: 120, where: "/today → Top priorities", detail: "Work Top 1 first. Start the focus timer on the task so the hours count for its Life Area." },
    { title: "Sales block", minutes: 60, where: "/pipeline", detail: "Do every deal's next step due today, then outreach until your quota or meetings goal is hit. Log each touch (+2 XP)." },
    { title: "Content rep", minutes: 45, where: "/content", detail: "During the 60-day lab: one short video a day, built with the 8-step workflow on the piece. Log yesterday's numbers." },
    { title: "Habits + recall", minutes: 10, where: "/today habits strip · /recall", detail: "Tick habits (the minimum version counts). Clear due recall cards in ~10 minutes." },
    { title: "Evening shutdown", minutes: 5, where: "/today → Shutdown", detail: "Inbox zero, decide every leftover, tick habits, glance at tomorrow (optionally pre-pick its Top 3), write a resume note, a progress line and a lesson. +25 XP." },
  ],
};

export const WEEKLY: RoutineBlock = {
  id: "weekly",
  title: "Every week",
  when: "Monday plan · midweek content · Friday review",
  summary: "Plan outcomes (not a full schedule) on Monday, build content midweek, and close the loop with the weekly review on Friday.",
  steps: [
    { title: "Plan the week (Monday)", minutes: 20, where: "/week", detail: "Set the Weekly Big 3, check this week's tactics, apply the Ideal Week, protect the Free Day." },
    { title: "Hub content piece (Wednesday)", minutes: 150, where: "/content", detail: "Write one long 'hub' piece (or a YouTube video on the weekly track). Packaging first: title + thumbnail before the script." },
    { title: "Repurpose (Thursday)", minutes: 75, where: "/content → piece → Repurpose", detail: "Cut the hub into 5–10 short pieces for each platform." },
    { title: "Pipeline review", minutes: 60, where: "/pipeline", detail: "Every open deal must have a dated next step. Look at idle (7d), stuck (14d) and proposal-open (9d) flags." },
    { title: "Weekly review (Friday)", minutes: 60, where: "/reviews/weekly", detail: "Celebrate wins, score the week (execution %), empty inboxes, check projects/deals/promises, fill the scorecard, work the top issues, set next week's Big 3. 20-minute minimum mode exists. +120 XP." },
    { title: "Money check", minutes: 10, where: "/finance", detail: "Log missing transactions, mark paid bills and invoices, look at runway and budget bars." },
    { title: "Content review", minutes: 20, where: "/content?tab=analytics", detail: "Top and bottom 3 pieces, one lesson each, save winning hooks. Mark the weak brick on each rep." },
    { title: "Free Day", minutes: 0, where: "—", detail: "One full day with no work. It never breaks your streak." },
  ],
};

export const MONTHLY: RoutineBlock = {
  id: "monthly",
  title: "Every month (the 1st)",
  when: "First day of the month — a natural fresh start",
  summary: "Tune direction, not tasks: re-rate Life Areas, check goals, adjust habits and hours, prune stale tasks.",
  steps: [
    { title: "Monthly review", minutes: 40, where: "/reviews/monthly", detail: "Re-rate every Life Area 1–10, mark goals on track / at risk, graduate or shrink habits, compare hours by area with budgets, migrate stale tasks, answer the 3-question burnout pulse. +150 XP." },
    { title: "Budgets", minutes: 10, where: "/finance?tab=budgets", detail: "Check last month's budget vs actual, adjust amounts." },
    { title: "Own-channel content audit (every 2 weeks)", minutes: 20, where: "/content?tab=playbook", detail: "Find your own winners and remake them." },
  ],
};

export const QUARTERLY: RoutineBlock = {
  id: "quarterly",
  title: "Every 12 weeks",
  when: "End of each 12-week cycle",
  summary: "Grade the cycle honestly, check for burnout, prune the system, and set the next three goals.",
  steps: [
    { title: "Quarterly review", minutes: 150, where: "/reviews/quarterly", detail: "Grade each key result 0–1, look at average execution, list successes and mistakes, burnout check, set ≤3 new goals with tactics and a WOOP, prune areas/habits/projects. +300 XP." },
    { title: "Start the next cycle", minutes: 20, where: "/goals", detail: "Launch the next 12-week cycle from the review." },
    { title: "Niche scan (every 3–4 weeks)", minutes: 30, where: "/swipes?tab=watchlist", detail: "Check your watchlist creators for new 5×+ outliers and save them with the 7 bricks." },
  ],
};

export const YEARLY: RoutineBlock = {
  id: "yearly",
  title: "Every year",
  when: "Late December / early January",
  summary: "Look back at the whole year, keep what gave energy, drop what drained it, set the year's theme and book Free Days first.",
  steps: [
    { title: "Annual review", minutes: 240, where: "/reviews/annual", detail: "Past Year Review (top positive and negative peaks), what went well/badly, goals per area (~80% hit rate is healthy), a theme for the year, Free Days and holidays first. +500 XP." },
    { title: "Update Compass", minutes: 30, where: "/compass", detail: "Refresh vision, values, not-to-do list and year theme." },
  ],
};

export const RHYTHM: RoutineBlock[] = [ONE_TIME_SETUP, DAILY, WEEKLY, MONTHLY, QUARTERLY, YEARLY];

export const FIRST_WEEK: { day: string; focus: string; tasks: string[] }[] = [
  { day: "Day 1", focus: "Spine", tasks: ["Profile + Life Areas setup", "Settings numbers", "Run your first start-up ritual", "Capture 10 things with C", "Evening shutdown"] },
  { day: "Day 2", focus: "Direction", tasks: ["Compass", "Start the first 12-week cycle (≤3 goals)", "Ideal Week + apply it", "Start-up and shutdown"] },
  { day: "Day 3", focus: "Habits + money", tasks: ["Routines + 1–3 habits", "Finance setup, accounts, recurring bills", "Scorecard defaults"] },
  { day: "Day 4", focus: "Sales", tasks: ["Add all deals with dated next steps", "Add key people + cadences", "Log today's outreach"] },
  { day: "Day 5", focus: "Content", tasks: ["Playbook → Positioning (Personal + Company)", "Watchlist: add 10 creators", "Save 3 outliers with the 7 bricks", "Start the 60-day lab"] },
  { day: "Day 6", focus: "Learning", tasks: ["Create a learning area", "Log a practice session", "Make 5 recall cards"] },
  { day: "Day 7", focus: "Review", tasks: ["First weekly review (minimum mode is fine)", "Set next week's Big 3", "Take your Free Day"] },
];

export const QUICK_TEST: string[] = [
  "Start the app: `npx convex dev` in one terminal, `npm run dev` in another, open http://localhost:3000 and sign in.",
  "Today → Start setup → keep your 4 areas → Save. The setup card shows progress.",
  "Today → Start my day → go through every step → Lock in. Top 3 appear; XP rises; the Day button ring moves.",
  "Press C → Task → type 'Call Sara tomorrow #sales ~30m'. Chips show Tomorrow, the Sales area and 30m. Press Enter.",
  "Press C → Inbox → capture two items → Inbox page → press T on one and N on the other.",
  "Tick all Top 3 on Today — confetti appears.",
  "Habits → add a habit → tick it on Today; try Minimum and Planned skip from the arrow menu.",
  "Goals → start a 12-week cycle with one goal and one tactic → press + on the tactic → the execution ring on Today updates.",
  "Pipeline → add a deal (saving without a next step is blocked) → log a touch → move to Won → create the delivery project.",
  "Commitments → add an 'I owe' promise for today → it shows on Today → tick it.",
  "Finance → Set up finance → add an expense and an invoice → mark the invoice paid → income appears.",
  "Content → Playbook → fill Positioning → New piece → walk the 8 workflow steps → publish (the checklist gate appears first).",
  "Inspiration → save a post (it won't save without 'Why it worked') → Remix it into a piece.",
  "Learning → create an area → log practice → Recall → review a card with Space and 1–4.",
  "Today → Shutdown → finish → the day appears in Journal with its score.",
  "Reviews → Weekly → complete it in minimum mode.",
  "Analytics → check the growth charts. Founder HQ → check the cards.",
  "Switch to dark mode (avatar menu) and open the app on your phone.",
];
