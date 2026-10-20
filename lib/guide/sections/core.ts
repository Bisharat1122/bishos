import type { GuideSection } from "../types";

/**
 * Core manual: the daily loop (Today, rituals, Inbox, capture, palette,
 * journal, XP) and the system-wide features (navigation, Topbar, search,
 * notifications, settings, profile, AI, guide, onboarding).
 * Pure data — every number and label here matches the real code.
 */

// ─────────────────────────────────────────────────────────────────────────
// START HERE
// ─────────────────────────────────────────────────────────────────────────

const howItWorks: GuideSection = {
  id: "how-bishos-works",
  group: "Start here",
  title: "How bishOS works",
  summary:
    "bishOS is one place for your whole life and your company. Everything hangs from a few Life Areas. You run it with one daily loop (start-up, capture, work, shutdown) and one weekly review.",
  why:
    "You stop holding plans in your head. Every morning you know the few things that matter. Every idea is captured in two seconds. Every evening ends with a clear mind. XP, levels and forgiving streaks make the habit stick, and caps stop you from taking on too much.",
  when: {
    daily:
      "Morning: open Today and run the 5-minute start-up. During the day: press C to capture anything, work your Top priorities, tick habits. Evening: run the 5-minute shutdown.",
    weekly:
      "On your weekly review day (Friday by default): do the weekly review, score the week, empty the inbox, and set next week's Big 3 on the Week page.",
    monthly: "On the 1st of the month: the monthly review (Today shows a banner). Re-rate your Life Areas and tune habits.",
    quarterly: "When your 12-week cycle ends: the quarterly review. Grade your goals and pick the next 3.",
    oneTime:
      "Day one: set up your Life Areas (Today → Start setup), fill in your Profile, check the numbers in Settings, and turn on desktop notifications. Then work through the 'What next?' setup steps (purpose, 12-week cycle, Ideal Week, routines, habits, scorecard, content pillars, learning area) over a few days.",
  },
  pages: [],
  frameworks: [
    {
      term: "The spine",
      definition:
        "The order everything in bishOS follows: Life Areas → 12-week goals → projects → tasks → week → day. Big things at the top, today's actions at the bottom. Every task belongs to a Life Area, so you always know which part of life it serves.",
      example:
        "Area 'Company Sales & Marketing' → goal 'Sign 5 new clients this cycle' → project 'Outbound campaign' → task 'Send 20 LinkedIn messages' → this week's Big 3 'Book 4 discovery calls' → today's Top 3 'Send 20 messages'.",
      source: "bishOS (built on PARA areas + the 12 Week Year)",
    },
    {
      term: "Life Area",
      definition:
        "A part of your life you must keep healthy forever, like company operations, sales, learning or fitness. Each area has a standard (what 'maintained' looks like) and a weekly hour budget. Areas never finish; goals and projects do.",
      example: "Fitness — standard: 'Move 4× a week, 7+ hours of sleep'. Budget: 4 hours a week.",
      source: "Tiago Forte, PARA method",
    },
    {
      term: "12-week goal",
      definition:
        "A goal you commit to for one 12-week cycle. You keep 3 or fewer active at once. Each goal has a key result (the outcome) and weekly tactics (the actions you control).",
      example: "Goal: 'Reach $10k monthly revenue by week 12'. Weekly tactic: '20 outreach messages every weekday'.",
      source: "Brian Moran, The 12 Week Year",
    },
    {
      term: "Project",
      definition: "A piece of work with a clear finish line that takes more than one step. Projects contain tasks. You keep 5 or fewer active (Settings → Caps).",
      example: "'Launch the new agency website' — done when the site is live.",
      source: "GTD / PARA",
    },
    {
      term: "Task",
      definition:
        "One concrete action. A task has a Life Area, a priority, an optional 'when' day (the day you plan to do it), an optional deadline, and an optional time estimate.",
      example: "'Call Sara about the proposal' — when: tomorrow, estimate 15 min, area Sales.",
      source: "GTD (next actions)",
    },
    {
      term: "Week",
      definition:
        "The week layer: your Weekly Big 3 outcomes, your Ideal Week template of time blocks, and one protected Free Day. You plan it on the Week page and close it with the weekly review.",
      example: "Big 3 this week: 'Send 2 proposals', 'Record 3 videos', 'Close the books for March'.",
      source: "Michael Hyatt, Full Focus (Weekly Big 3)",
    },
    {
      term: "Day",
      definition:
        "Each date has one day record: your check-in, day type, Top priorities, intention, if–then plan, resume note, progress line, lesson, journal and day score. The start-up fills the morning part; the shutdown fills the evening part.",
      example: "Tuesday: energy 4/5, Focus day, Top 3 picked, shutdown done, day score 90.",
      source: "bishOS",
    },
    {
      term: "Daily loop",
      definition:
        "Start-up (plan) → capture (C) → work the Top priorities in focus blocks → shutdown (close every loop). About 10 minutes of planning a day buys a calm, focused day.",
      example: "8:30 start-up, 9:00–12:00 deep work on Top 1 and 2, 14:00 sales block, 17:30 shutdown.",
      source: "Full Focus + Cal Newport, Deep Work",
    },
    {
      term: "Weekly loop",
      definition:
        "Once a week you review: celebrate wins, score execution, empty inboxes, check each project has a next step and each deal a dated next step, then set next week's Big 3.",
      example: "Friday 16:00: weekly review (60 min, or 20 min in minimum mode) for +120 XP.",
      source: "David Allen, GTD (weekly review)",
    },
    {
      term: "Capture, then process",
      definition:
        "Two separate moments. When a thought appears, you only capture it (press C, type, Enter). Later, in the Inbox or the shutdown, you decide what it is and where it goes. Mixing the two breaks your focus.",
      example: "In a meeting you press C and type 'ask Ali for logo files'. At 17:30 you turn it into a task.",
      source: "David Allen, GTD",
    },
    {
      term: "Defaults, not laws",
      definition:
        "Numbers like 5.5 hours of daily capacity, 3 goals, 85% execution or 20 outreach touches are starting points. You change them in Settings.",
      example: "You work 4 focused hours on school-run days, so you lower Daily capacity to 4.",
      source: "bishOS",
    },
  ],
  testing: [
    "Open bishOS. The address / redirects you to /today.",
    "Click 'Start my day' on Today. A full-screen ritual opens. Go through every step and click 'Lock in my day'. Confetti shows and a toast says 'Day locked in. Go win it.' with +25 XP.",
    "Press C anywhere (not inside a text box). Quick capture opens. Type a thought and press Enter. Toast: 'Captured to Inbox'.",
    "Open Inbox from the sidebar. Your thought is in the 'To process' tab. Press T, check the fields, press Enter. Toast: 'Task created' with +2 XP.",
    "Back on Today, tick a Top priority. Toast 'Top priority done' with +20 XP. The day score ring goes up.",
    "Click 'Shutdown' on Today (or the Day button in the Topbar). Finish all steps. The last screen shows 'Shutdown complete.' with your day score.",
    "Open Journal. Today's square is coloured and shows the sun and moon marks.",
  ],
  tips: [
    "Live in Today. Most other pages feed it.",
    "If you miss a few days, don't fix the past. Click 'Fresh start' and decide what still matters.",
    "Keep the two shortcuts in your fingers: C to capture, Ctrl+K to go anywhere.",
  ],
};

// ─────────────────────────────────────────────────────────────────────────
// TODAY
// ─────────────────────────────────────────────────────────────────────────

const today: GuideSection = {
  id: "today",
  group: "Today",
  title: "Today (your home screen)",
  summary:
    "Today is the cockpit you open every morning. One screen shows your day score, level and streak, your Top priorities, habits, today's task list with a capacity check, your time blocks, and a right rail with the week, sales, promises, content and routines.",
  why:
    "You never wonder 'what should I do now?'. Everything that needs you today is in one place, ranked. The capacity bar warns you before you over-plan, and every tick gives instant feedback (XP, confetti).",
  when: {
    daily:
      "Open it first thing and click 'Start my day'. Keep it open while you work: tick tasks, tick habits, glance at the timeline. In the evening click 'Shutdown'.",
    weekly: "The 'This week' card shows your Weekly Big 3 and execution score every day. On review day a banner links to the weekly review.",
    oneTime: "First visit: the 'Set up your Life OS' banner. Click 'Start setup' to create your Life Areas.",
  },
  pages: [
    {
      route: "/today",
      title: "Today",
      purpose: "The home screen. It shows what matters today and lets you act on it without leaving the page.",
      elements: [
        { name: "Topbar", what: "The bar across the top of every page: search, Day button, focus timer, full screen, bell and profile.", how: "See the 'Topbar' section of this manual." },
        { name: "Date line", what: "Today's date in words, for example 'Tuesday, October 20'." },
        {
          name: "Greeting",
          what: "'Good morning', 'Good afternoon' (from 12:00), 'Good evening' (from 17:00) or 'Late night' (before 5:00), followed by your first name from Profile.",
          how: "Add your name on the Profile page to see it here.",
        },
        { name: "Week N/12 chip", what: "Shows which week of your current 12-week cycle you are in, plus the cycle theme if you set one. Only shows when a cycle is running.", how: "Click it to open Goals." },
        { name: "Day type chip", what: "'Focus day', 'Buffer day' or 'Free day' — the day type you chose in the start-up ritual (or the Free Day you picked on the Week page)." },
        { name: "Low-energy mode chip", what: "Shows when today is a low-energy day. Today then asks for only one Top priority and the habit minimum counts fully." },
        { name: "Energy N/5 chip", what: "Your energy score from this morning's check-in." },
        { name: "Intention line", what: "Your one-line intention for the day, in quotes. Set in the start-up ritual (Day shape step)." },
        { name: "If–then line", what: "Your if–then plan: 'If [obstacle], then [response].' Set in the start-up ritual." },
        {
          name: "Start my day · 5 min",
          what: "The main button before you have done the morning start-up. It glows to get your attention.",
          how: "Click it to open the Morning start-up ritual.",
        },
        {
          name: "Shutdown · 5 min",
          what: "Replaces 'Start my day' once the start-up is done. From 16:00 it becomes the highlighted (glowing) button.",
          how: "Click it to open the Evening shutdown ritual.",
        },
        { name: "Day complete — enjoy your evening", what: "A green badge that replaces the ritual buttons when both start-up and shutdown are done today." },
        { name: "Brain dump", what: "Opens Quick capture in Brain dump mode, where you can type or speak everything in your head and let AI sort it.", how: "Click it, ramble, then click 'Sort with AI' or 'All to Inbox'." },
        { name: "Re-plan", what: "Appears after the start-up is done. Re-opens the start-up ritual with today's answers filled in, so you can change your plan.", how: "Use it when the day changes (a client emergency, a cancelled meeting). You don't earn the start-up XP twice." },
        {
          name: "Day score ring",
          what: "A live score from 0 to 100 for today. Start-up done = 20, Top priorities done share = up to 30, habits done share = up to 20, shutdown done = 20, a progress line or win written = 10. The ring turns green at 80 or more.",
          how: "Raise it by doing the rituals, finishing Top priorities and ticking habits.",
        },
        { name: "Score checklist (Start-up · Top x/y · Shutdown)", what: "Three small lines under the ring. A dot turns green when that part is done. 'Top x/y' shows how many Top priorities are finished (shows /3 when none are picked)." },
        { name: "Level card — Level N and title", what: "Your current level and its title (Starter, Builder, Operator…). Levels come from your total XP.", how: "See 'XP, levels, streaks & achievements'." },
        { name: "Trophy button", what: "The trophy icon on the level card.", how: "Click it to open the Achievements window (all 19 badges and your progress)." },
        { name: "XP bar (into/span XP)", what: "How far you are into the current level. Example: '120/250 XP' means 120 XP earned since this level started, 250 XP needed for the next level." },
        { name: "+N today", what: "XP you earned today." },
        { name: "N day streak", what: "Your ritual streak: days in a row where you did the start-up or the shutdown. Free days don't break it." },
        { name: "Reserve shields", what: "Two shield icons. A blue shield is still available this week; a faded shield was used. Each shield covers one missed day so your streak survives. They refill every Monday.", how: "Hover to read 'Reserve shields: missed days that won't break your streak this week'." },
        { name: "XP this week chart", what: "Seven small bars, one per day (the last 7 days). Today's bar is solid. Taller bar = more XP.", how: "Hover a bar to see the date and its XP." },
        {
          name: "Welcome back banner",
          what: "Blue banner: 'Welcome back. N days away is normal…'. Shows when your last ritual was 3 or more days ago and you haven't done today's start-up.",
          how: "Click 'Fresh start' to open the start-up ritual and decide what still matters, without guilt.",
        },
        {
          name: "Set up your Life OS banner",
          what: "Setup checklist with a ring (for example 3/9), the text 'Nine small steps. Each one makes the daily check-in smarter.', and one chip per step (green with a tick when done). Shows until you save your Life Areas in the setup window.",
          how: "Click 'Start setup' (or 'Continue setup') to open the Life Areas setup. Click any chip to jump to that step's page.",
        },
        {
          name: "Review banners",
          what: "A purple banner that links to a review. 'It's weekly review day' (on your review weekday, if this week isn't reviewed yet, +120 XP). 'New month, fresh start' (on the 1st, monthly review, +150 XP). 'Your 12-week cycle is ending' (cycle week 12 or later, quarterly review, +300 XP). Only one shows at a time.",
          how: "Click the banner to open that review.",
        },
        {
          name: "Leftovers banner",
          what: "Yellow banner: 'N tasks from earlier days still need a decision.' These are open tasks planned for a past day (not Someday). Shows only after today's start-up.",
          how: "Click 'All to today' to plan them all for today, or 'All to backlog' to remove their day. Or decide one by one in tomorrow's start-up.",
        },
        {
          name: "Top priorities",
          what: "Card with your Top priorities for today, ranked 1, 2, 3… The title becomes 'Your one thing' on a low-energy day. The hint says 'x of y done · +15 XP each'. A small ring on the right counts how many are done.",
          how: "Pick them in the start-up ritual, or use the '…' menu on any task → 'Make it a Top'.",
        },
        { name: "No priorities picked yet", what: "Empty state of the Top priorities card.", how: "Click 'Start my day' to pick your Top 3 and check the day fits." },
        { name: "Rank number", what: "The number (1, 2, 3…) in front of each Top priority. It turns green when that task is done." },
        {
          name: "Task checkbox (circle)",
          what: "The circle in front of every task.",
          how: "Click to mark done (+5 XP; a Top priority gives +20 XP in total). Finishing all Top priorities fires confetti and 'All Top priorities done. That's a winning day'. Click again to un-tick; the XP is taken back.",
        },
        { name: "Task title", what: "The task name. Under it: the Life Area (coloured dot + name), the time estimate (clock) and 'deep' when the task needs high energy.", how: "Click the title to open the task drawer." },
        { name: "overdue chip", what: "Red chip: the task's deadline was before today." },
        { name: "due today chip", what: "Yellow chip: the task's deadline is today." },
        { name: "Goal chip (target icon)", what: "Purple target: this task moves a 12-week goal ('Moves a 12-week goal' on hover)." },
        { name: "Play button (timer)", what: "Starts a focus timer on this task. Appears on hover (always on phones).", how: "Click → choose 'Pomodoro' or 'Stopwatch'. While it runs the button shows the time. Click again for 'Stop & log' or 'Open Focus'." },
        {
          name: "'…' More menu",
          what: "The three-dots button on open tasks (on hover; always on phones).",
          how: "'Make it a Top' / 'Remove from Top' adds or removes the task from Top priorities. 'Move to tomorrow' plans it for tomorrow. 'Remove from today' clears its day (back to the backlog). Top priority rows only show 'Remove from Top'.",
        },
        { name: "Habits", what: "Card with today's active habits as pills, and a counter 'done/total' (planned skips don't count). See the next elements." },
        {
          name: "Habit pill",
          what: "One habit. Shows the name, 'min' or 'stretch' if you logged that version, a flame with the habit streak, and the consistency % (last 30 days).",
          how: "Tap to tick (+5 XP). On a low-energy day a tap logs the minimum version (+3 XP) if the habit has one. Tap again to clear. Hover the flame to see reserve skips left this week.",
        },
        {
          name: "Habit menu (small arrow)",
          what: "Options for one habit. Shows the anchor ('After coffee') if set.",
          how: "'Done' (+5 XP), 'Minimum' (+3 XP, shows the minimum version text), 'Stretch' (+5 XP), 'Planned skip' (no XP, your streak is safe; limited to the habit's reserve skips per week), 'Clear'.",
        },
        { name: "No habits yet", what: "Empty state: 'No habits yet. Start with one keystone habit.'", how: "Click 'Add habit' to open the Habits page." },
        {
          name: "Today",
          what: "The task list for today. Header hint: 'Xh planned of Yh', plus 'Zh over capacity' in yellow when too full. On the right: 'N done' today. The list holds tasks planned for today, tasks that start today, and tasks due today (Top priorities are shown above, not here).",
        },
        { name: "Capacity bar", what: "Fills with planned time (open tasks + meetings) against your daily capacity. It turns yellow above 100%. Tasks without an estimate count as 30 minutes. Meetings = 'manager' time blocks today." },
        {
          name: "Quick add field",
          what: "Placeholder: 'Add to today… try: Follow up Sara fri #sales ~15m'. Adds a task to today in one line.",
          how: "Type and press Enter (or the Enter button that appears). It understands dates (tomorrow, fri, next week), #area, !high and ~30m. Without a date it goes to today; with 'someday' it goes to Someday. Default priority: Medium. Toast: 'Added to today' or 'Added for [day]'.",
        },
        { name: "Nothing else planned", what: "Empty state: 'Nothing else planned. Protect the space — or pull something in from Tasks.'" },
        { name: "N completed", what: "A folded list of tasks you finished today.", how: "Click to open it. Un-tick a task to reopen it." },
        { name: "Overdue deadlines strip", what: "Red box under the list: 'N overdue deadlines:' followed by up to 3 task names.", how: "Click a name to open that task and fix it (do it, move the deadline, or delete it)." },
        { name: "Timeline", what: "Today's time blocks from your calendar, in time order. 'Calendar ↗' opens the Calendar page." },
        {
          name: "Time block row",
          what: "Start–end time, a coloured bar for the block type (maker, manager, free), the title, and the type label. The block happening now has a 'now' chip and a highlighted border. Past or finished blocks fade.",
        },
        { name: "No time blocks today", what: "Empty state: 'Maker mornings, calls in the afternoon.'", how: "'Apply Ideal Week' opens the Week page to load your template. '+ Block time' opens the Calendar to add a block." },
        { name: "This week", what: "Right-rail card for the week. 'Week ↗' opens the Week page." },
        {
          name: "Execution score",
          what: "A ring and 'Execution score — x/y lead actions this week · aim for 85%'. It counts the weekly tactics of your active 12-week goals. Green at 85+, normal at 60+, yellow below. Shows only while a cycle is running.",
          how: "Click to open Goals and log tactics.",
        },
        {
          name: "Weekly Big 3 list",
          what: "This week's Big 3 outcomes with a circle each.",
          how: "Click a circle to mark the outcome done (+30 XP). All three done fires confetti and 'Weekly Big 3 complete. Huge week'.",
        },
        { name: "No Weekly Big 3 yet", what: "Empty state of the week card.", how: "Click 'Set them →' to open the Week page." },
        { name: "Inbox tile", what: "Number of items waiting in your Inbox. Sub-line: 'to process', 'zero' when empty, or 'N older than 48h' in yellow when items are getting old.", how: "Click to open the Inbox." },
        { name: "Recall tile", what: "Number of recall (flashcard) cards due now, or 'all caught up'.", how: "Click to open Recall." },
        { name: "Focus tile", what: "Focus time logged today (from focus sessions).", how: "Click to open Focus." },
        {
          name: "Content tile",
          what: "Hub content pieces published this week / your weekly target ('hub pieces this week'). An extra line 'Lab: x/y reps this week' shows your content lab practice; it turns green when you hit the target.",
          how: "Click to open Content Studio.",
        },
        { name: "Sales today", what: "Right-rail sales card. 'Pipeline ↗' opens the Pipeline." },
        { name: "Outreach ring", what: "Outreach touches logged today (outreach and follow-up interactions) against your daily quota, for example '7/20 outreach touches'. Green when you hit the quota." },
        { name: "Conversations line", what: "'x/y conversations today' (meetings and calls logged). When you hit the goal it says 'Meetings goal hit — you can stop prospecting today.'" },
        { name: "Deal next steps", what: "Up to 8 open deals whose next step is due today or overdue, or that have no next step. Shows the next step and when. 'No next step — set one' in red when a deal has none.", how: "Click a deal to open the Pipeline." },
        { name: "Due to reconnect", what: "Up to 5 people you haven't contacted within their reconnect cadence, as chips.", how: "Click a name to open that person." },
        { name: "Promises", what: "Right-rail card of promises. 'All ↗' opens Commitments." },
        {
          name: "Promise row",
          what: "A promise you made (I owe) due by tomorrow: title, the person and the date. Red when overdue.",
          how: "Click the circle when you deliver. Toast 'Promise kept' (+10 XP if on time).",
        },
        { name: "Check on (waiting for)", what: "Things others owe you whose check date has arrived, with the person's name." },
        { name: "No promises due", what: "Empty state: 'No promises due. Keep it that way.'" },
        { name: "Content due", what: "Shows only when content pieces are scheduled for today or earlier and not yet published. Each row: brand chip (personal/company), title, current stage (red when late).", how: "Click a row to open that piece." },
        { name: "Routines", what: "Shows your active routines with a done circle and 'done steps/total steps'. 'Run ↗' opens Routines.", how: "Click a routine to run it on the Routines page." },
        { name: "Keyboard hint", what: "Footer reminder: 'C capture · Ctrl K anything'." },
      ],
      howTo: [
        "Open Today in the morning. Read the banners first (fresh start, setup, review day, leftovers).",
        "Click 'Start my day' and finish the ritual (5 minutes).",
        "Work your Top priorities from 1 down. Use the play button to time each one.",
        "Tick habits in the Habits card as you do them.",
        "Add surprise tasks with the quick add field. Watch the capacity bar; if it turns yellow, move something to tomorrow with the '…' menu.",
        "Check the right rail between blocks: promises, deals, inbox count.",
        "In the evening click 'Shutdown' and finish it.",
      ],
    },
    {
      route: "/today → click a task title",
      title: "Task drawer",
      purpose: "Edit any task without leaving Today. It slides in from the right over a dark backdrop. The same panel is used on the Tasks pages.",
      elements: [
        { name: "Backdrop", what: "The dark area outside the drawer.", how: "Click it to close the drawer. Your typing is saved." },
        { name: "Side peek", what: "View button (panel icon): the drawer sits on the right side.", how: "Click to switch to side view." },
        { name: "Center peek", what: "View button (square icon): the task opens as a large centred window.", how: "Click to switch to centre view." },
        { name: "Open as full page", what: "View button (expand icon): opens the task on its own page (/tasks/[id]).", how: "Click it. '← Back' on that page returns you to where you came from." },
        { name: "Close (X)", what: "Closes the drawer." },
        { name: "Title", what: "The task name, editable in place.", how: "Click, type, then click outside to save." },
        { name: "Play button (timer)", what: "Starts a focus timer for this task.", how: "Choose 'Pomodoro' or 'Stopwatch'. While running: 'Stop & log' or 'Open Focus'." },
        {
          name: "Momentum",
          what: "Logs this task as something that 'moved the needle'. Shows a counter if already logged.",
          how: "Click → choose Impact 1–5 → optionally write 'Why did it move the needle?' → 'Add to Momentum'. The button shows 'Added' for a moment.",
        },
        { name: "Status", what: "'Not started', 'In progress' or 'Done'.", how: "Click one to set it." },
        { name: "Priority", what: "'Low', 'Medium' or 'High'.", how: "Click one to set it." },
        { name: "Life area", what: "The Life Area this task belongs to.", how: "Pick from the list. Changing it clears the section." },
        { name: "Section", what: "An optional section inside the Life Area.", how: "Pick one, or 'None'." },
        {
          name: "When (plan to work on it)",
          what: "The day you plan to do the task. This is not the deadline.",
          how: "Click 'Today', 'Tomorrow', 'Someday' or 'Backlog' (no day), or pick any date in the date box.",
        },
        { name: "Estimate", what: "How long the task will take: 5, 15, 30, 45 min, 1, 1.5, 2, 3 or 4 h. Used by the capacity check.", how: "Pick from the list, or '—' for none (counts as 30 min)." },
        { name: "Energy needed", what: "'High (deep work)', 'Medium' or 'Low (admin)'. High shows 'deep' on Today." },
        { name: "Moves goal", what: "Link the task to an active 12-week goal, or '— none (maintenance)'. Linked tasks show the target chip and rank higher in start-up suggestions." },
        { name: "Should not be me", what: "Checkbox: 'Should not be me — record it next time (Delegation)'. Flags work you want to hand off." },
        { name: "Moved N× warning", what: "Yellow note when the task was pushed to tomorrow 3 or more times: 'keep, schedule for real, or drop it?'" },
        { name: "Start", what: "Optional start date and time (default 09:00). A task that starts today shows in Today's list." },
        { name: "Due / end", what: "The deadline: date and time (default 23:59). Drives the 'due today' and 'overdue' chips and notifications." },
        { name: "Tags", what: "Free labels on the task.", how: "Type in 'Add tag…' and press Enter. Click the x on a tag to remove it." },
        { name: "Description", what: "Notes for the task, with a rich editor.", how: "Click 'Edit' and write; press / for commands. Click 'Preview' to read. It autosaves." },
        { name: "Attachments", what: "Files attached to the task. Click a file name to open it; x removes it.", how: "Click '+ Add to task' → 'Upload PDF / doc / image' or 'Add description block (/)'." },
        { name: "Time tracked", what: "Total focus time on this task and the number of sessions.", how: "'Focus on this' opens the Focus page with this task selected." },
        { name: "Log time", what: "Manual time entry: a minutes box (default 25) and 'Log time'.", how: "Type minutes and click 'Log time' to add a session you forgot to time." },
        { name: "Session list", what: "Each logged session: minutes and when it ended.", how: "Hover a session and click x to delete it." },
        { name: "Duplicate task", what: "Opens 'Duplicate task': copies the task (priority, area, tags, description, attachments) to another day. Times of day stay the same.", how: "Pick a date in 'Move to date' and click 'Duplicate task'." },
        { name: "Delete task", what: "Deletes the task for good and closes the drawer." },
      ],
      howTo: [
        "Click a task title on Today.",
        "Set 'When' to the day you will really do it, and 'Due / end' only if there is a real deadline.",
        "Pick an estimate so the capacity check is honest.",
        "Close with the X or by clicking the dark backdrop.",
      ],
    },
  ],
  frameworks: [
    {
      term: "Day score",
      definition:
        "A 0–100 score for one day. Start-up done 20 + share of Top priorities done × 30 + share of habits done × 20 + shutdown done 20 + a progress line or win written 10. Today shows it live; the shutdown saves the final score to the Journal.",
      example: "Start-up (20) + 2 of 3 Top done (20) + all habits (20) + shutdown (20) + progress line (10) = 90.",
      source: "bishOS",
    },
    {
      term: "Top priorities (Top 3)",
      definition:
        "The few tasks that make today a win if they get done, ranked 1, 2, 3. Do them first, in order, before anything else. Each finished Top priority gives +15 XP on top of the normal +5.",
      example: "1. Send Acme proposal. 2. Record onboarding video. 3. 20 outreach messages.",
      source: "Michael Hyatt, Full Focus (Daily Big 3)",
    },
    {
      term: "Capacity check",
      definition:
        "Before the day starts, add up the time of everything planned (open tasks + meetings) and compare it with the hours you really have. Default capacity is 5.5 hours of planned work on a normal day. Over capacity = something must move.",
      example: "You planned 7h of tasks plus 1h of calls but have 5.5h. The bar is yellow: move 2.5h to tomorrow.",
      source: "Sunsama (daily planning workload)",
    },
    {
      term: "Today list",
      definition: "Tasks planned for today (their 'when' is today), tasks that start today, and tasks due today. Top priorities sit above it.",
      example: "'Pay VAT' is due today, so it appears even though you never planned it.",
      source: "bishOS",
    },
    {
      term: "'When' vs deadline",
      definition:
        "Two different dates. 'When' is the day you plan to work on a task — it puts the task on that day's list. The deadline ('Due / end') is when it must be finished — it drives overdue warnings. Many tasks have a 'when' but no deadline.",
      example: "Proposal deadline: Friday. You plan to write it ('when') on Wednesday, so Friday stays calm.",
      source: "Things / Sunsama style planning",
    },
    {
      term: "Backlog",
      definition: "Open tasks with no 'when' day and not Someday. They wait on the Tasks page until you plan them.",
      example: "'Redesign invoice template' sits in the backlog until a quiet Buffer day.",
      source: "Agile / GTD next-actions list",
    },
    {
      term: "Leftover",
      definition:
        "An open task whose planned day is in the past. bishOS never moves leftovers forward silently: you decide each one (today, tomorrow, backlog, someday, drop) in the start-up, the shutdown, or with the banner buttons.",
      example: "Yesterday's 'Call the bank' wasn't done. This morning you choose 'Today'.",
      source: "Sunsama / Full Focus (no silent rollover)",
    },
    {
      term: "Overdue",
      definition: "A task whose deadline was before today and is still not done. It shows a red chip and a notification.",
      example: "'Send contract' was due Monday; on Tuesday it shows 'overdue'.",
      source: "bishOS",
    },
    {
      term: "Maker vs manager time",
      definition:
        "Maker time is long, quiet blocks for deep work (writing, designing, coding). Manager time is calls and meetings. Mix them and both suffer. bishOS suggests maker mornings and calls in the afternoon; time blocks are coloured by type.",
      example: "9:00–12:00 maker block for the website; 14:00–16:00 manager block for client calls.",
      source: "Paul Graham, 'Maker's Schedule, Manager's Schedule'",
    },
    {
      term: "Weekly Big 3",
      definition: "The three outcomes that would make this week a success. Set on the Week page; tick them on Today (+30 XP each).",
      example: "'Send 2 proposals', 'Publish the case study', 'Hire a VA'.",
      source: "Michael Hyatt, Full Focus",
    },
    {
      term: "Execution score",
      definition:
        "The share of this week's planned lead actions (weekly tactics of your 12-week goals) that you actually did. Aim for 85% or more; that level of execution usually reaches the goal.",
      example: "You planned 20 tactics and did 17 → 85%.",
      source: "Brian Moran, The 12 Week Year",
    },
    {
      term: "Lead action (tactic)",
      definition: "An action you control that drives a result, like 'send 20 messages'. The result (revenue) is the lag measure. You score yourself on lead actions.",
      example: "Lead: 5 discovery calls a week. Lag: 2 new clients a month.",
      source: "The 12 Week Year / 4 Disciplines of Execution",
    },
    {
      term: "Outreach touch",
      definition: "One logged outreach or follow-up message to a prospect. Today counts them against your daily quota (20 by default).",
      example: "10 LinkedIn DMs + 5 follow-up emails = 15 touches.",
      source: "Alex Hormozi, $100M Leads (Rule of 100)",
    },
    {
      term: "Meetings goal ('open to goal')",
      definition: "A daily number of real conversations (calls or meetings). Once you hit it you may stop prospecting for the day. Default: 2.",
      example: "You booked 2 calls by 11:00, so you switch to delivery work.",
      source: "Sales prospecting practice",
    },
    {
      term: "Next step (deal)",
      definition: "Every open deal should have one concrete next action with a date. A deal without a next step is a deal you are slowly losing.",
      example: "Deal 'Acme website' — next step 'Send revised quote' — Thursday.",
      source: "Sales pipeline practice",
    },
    {
      term: "Reconnect cadence",
      definition: "How often you want to contact a person (every N days). When the time passes, they appear in 'Due to reconnect'.",
      example: "Mentor every 30 days; the chip appears on day 30.",
      source: "Personal CRM practice",
    },
    {
      term: "Promise (I owe) and Waiting for",
      definition:
        "A promise is something you told someone you would do, with a date. 'Waiting for' is something someone owes you, with a date to check in. Both live in Commitments.",
      example: "I owe: 'Send Sara the deck by Thursday'. Waiting for: 'Ali sends logo files — check Monday'.",
      source: "David Allen, GTD (Waiting For list)",
    },
    {
      term: "Routine",
      definition: "A fixed checklist you run the same way each time, like a morning routine. Today shows your active routines and how many steps are done.",
      example: "Morning routine: water, 10 push-ups, review Top 3 — 3/3 done.",
      source: "Full Focus (rituals)",
    },
  ],
  testing: [
    "Open /today. Check the greeting matches the time of day and shows your first name (set it in Profile if missing).",
    "Before the start-up: the 'Start my day · 5 min' button glows and the day score ring shows 0.",
    "In the quick add field type 'Test call Sara tomorrow #sales ~15m' and press Enter. Expected: toast 'Added for Tomorrow' (or similar). The task does not appear in today's list. Open Tasks to confirm it is planned for tomorrow, area Sales, 15 min.",
    "Type 'Write test note ~45m' and press Enter. Expected: toast 'Added to today', the task appears in the Today list with '45m', and the 'planned of' hint grows by 45 minutes.",
    "Add tasks until planned time is more than your capacity. Expected: the capacity bar turns yellow and the hint says 'over capacity'.",
    "Open the '…' menu on a task and click 'Make it a Top'. Expected: it moves up into Top priorities with a rank number.",
    "Tick that Top priority. Expected: toast 'Top priority done' with +20 XP; '+N today' on the level card rises; the score ring rises. Tick all Top priorities: confetti and 'All Top priorities done'.",
    "Un-tick it. Expected: the XP is taken back (the '+N today' number drops).",
    "Tap a habit pill. Expected: it turns green, toast shows +5 XP, the counter goes up. Open its menu and choose 'Minimum'. Expected: 'min' label and 'Minimum counts. Streak safe.' with +3 XP.",
    "Click a task title. Expected: the task drawer opens. Change 'Estimate' to 1 h and close. Expected: the task row shows '1h'.",
    "Click a circle in 'This week' (needs Big 3 set on the Week page). Expected: toast 'Weekly outcome done' with +30 XP.",
    "Click the Inbox tile. Expected: the Inbox page opens and the number matches the tile.",
    "Click the trophy button. Expected: the Achievements window opens with 'Achievements · x/19'.",
    "Plan a task for yesterday (task drawer → When → yesterday's date), do the start-up, and return. Expected: the yellow leftovers banner appears. Click 'All to backlog'. Expected: the banner disappears.",
  ],
  tips: [
    "If the Today list is long, the plan is wrong, not you. Move things to tomorrow before you start.",
    "Give every task an estimate. The capacity check is only as honest as your estimates.",
    "Use 'Re-plan' instead of fighting a broken plan.",
  ],
};

const startup: GuideSection = {
  id: "morning-startup",
  group: "Today",
  title: "Morning start-up ritual",
  summary:
    "A calm, full-screen, 5-minute ritual that plans your day one step at a time: a check-in, closing old loops, choosing the day type, picking your Top priorities, checking they fit, and writing one if–then plan.",
  why:
    "Five minutes of thinking before you start saves hours of drifting. You start with a realistic plan, matched to your real energy, and you've already decided what to do when distraction hits.",
  when: {
    daily: "Every working morning, before email and chat. Also use 'Re-plan' later in the day if the plan breaks.",
    oneTime: "Nothing to set up. Life Areas must exist so new tasks have an area.",
  },
  pages: [
    {
      route: "Start my day (overlay, any page)",
      title: "Ritual frame (top bar and footer)",
      purpose: "The frame around every step of the start-up. It shows where you are and moves you forward.",
      elements: [
        { name: "Morning start-up label", what: "Sun badge at the top left that names the ritual." },
        { name: "Progress bars", what: "One short bar per step (on wider screens). Done steps are solid, the current step is lighter. On phones a single thin bar fills up instead.", how: "Hover a bar to see the step name." },
        { name: "Step counter", what: "For example '3/8 · Day shape'. The 'Close yesterday' step only appears when you have leftovers, so the total is 7 or 8." },
        { name: "Close (X)", what: "Closes the ritual without locking in the day.", how: "Click X or press Esc. Your check-in and any estimate changes are already saved; the rest is not." },
        { name: "Back", what: "Goes to the previous step. Disabled on the first step." },
        { name: "Next button", what: "Moves forward. It says 'Let's go' on the first step, 'Continue' in the middle, and 'Lock in my day' on the last step. On the Top priorities step it is disabled until you pick at least one task (unless it is a Free day)." },
      ],
      howTo: ["Open it with 'Start my day' on Today, the Day button in the Topbar, the command palette ('Start my day'), or the Journal day page.", "Move with the Next button; go back with Back.", "Close with X or Esc if you need to stop."],
    },
    {
      route: "Start my day — step 1",
      title: "Good morning",
      purpose: "A gentle welcome that reminds you where you left off and what this week is about.",
      elements: [
        { name: "Date and greeting", what: "Today's date and 'Good morning, [name].'" },
        { name: "Intro line", what: "'Five calm minutes now buy you a focused day. Let's set it up.'" },
        { name: "Fresh start card", what: "Shows when you've been away 3 or more days: 'You've been away N days — that's normal. No guilt: we'll decide what still matters and start clean today.'" },
        { name: "Where you stopped", what: "Yesterday's resume note (from last night's shutdown), so you restart in seconds." },
        { name: "Yesterday's progress", what: "Yesterday's progress line from the shutdown." },
        { name: "12-week cycle", what: "'Week N of 12 · [cycle name]' with a progress bar. Only when a cycle is running." },
        { name: "This week's Big 3", what: "Your three weekly outcomes, crossed out when done." },
        { name: "Streak line", what: "'Ritual streak N days · N shields left this week'." },
      ],
    },
    {
      route: "Start my day — step 2",
      title: "Check-in",
      purpose: "Ten seconds to measure sleep, energy and mood, so today's plan matches the real you.",
      elements: [
        { name: "How are you, really?", what: "Step title. Hint: 'Ten seconds. Your energy decides how ambitious today should be.'" },
        { name: "Sleep last night", what: "Slider from 3 to 11 hours in half-hour steps (starts at 7h). The number shows on the right.", how: "Drag to your real sleep." },
        { name: "Sleep quality", what: "Five faces: Awful, Poor, OK, Good, Great.", how: "Tap one." },
        { name: "Energy", what: "Five faces: Empty, Low, OK, Good, Charged (1–5).", how: "Tap one." },
        { name: "Mood", what: "Five faces: Rough, Meh, Fine, Good, Great.", how: "Tap one." },
        {
          name: "Low-energy day",
          what: "Checkbox: 'Top 1 only, habits at their minimum version.'",
          how: "Tick it yourself, or let bishOS suggest it: when you click Continue with energy 2 or lower, or less than 6 hours of sleep, it switches on and shows 'Low-energy day mode on'.",
        },
      ],
      howTo: ["Answer honestly — nobody else sees it.", "Click Continue. The check-in is saved right away (+10 XP, once per day)."],
    },
    {
      route: "Start my day — step 3 (only with leftovers)",
      title: "Close yesterday",
      purpose: "Decide every open task that was planned for an earlier day, so nothing rolls forward silently.",
      elements: [
        { name: "Close the loops from before", what: "Step title. Hint: 'Nothing rolls forward silently. If it isn't worth deciding, it probably isn't worth doing.'" },
        { name: "All → today", what: "Sets every leftover to 'Today' in one click." },
        { name: "All → backlog", what: "Sets every leftover to 'Backlog' in one click." },
        { name: "Leftover card", what: "Area colour dot, task title and 'Planned [date]'. If the task was already moved 2 or more times: 'moved N× — keep or drop?' in yellow." },
        {
          name: "Decision buttons",
          what: "'Today' (plan for today), 'Tomorrow' (plan for tomorrow and count one more deferral), 'Backlog' (remove the day), 'Someday' (park it in Someday), 'Drop' (delete the task, red).",
          how: "Click one per task. Decisions are applied when you lock in the day.",
        },
        { name: "Decided counter", what: "'x/y decided · undecided items stay where they are.'" },
      ],
    },
    {
      route: "Start my day — step 4",
      title: "Day shape",
      purpose: "Choose what kind of day it is and how many priorities fit it.",
      elements: [
        { name: "What kind of day is it?", what: "Step title. Hint: 'Protect maker time on Focus days. Buffer days are for admin and prep. Free days are fully off.'" },
        { name: "Focus day", what: "Card: 'Revenue + deep work'. The default.", how: "Click to choose." },
        { name: "Buffer day", what: "Card: 'Admin, prep, catch-up'.", how: "Click to choose." },
        { name: "Free day", what: "Card: 'No work. Recharge.' Pre-selected when today is the Free Day you picked on the Week page. Free days never break your streak.", how: "Click to choose." },
        {
          name: "Daily shape",
          what: "Switch between 'Big 3' ('Three things that make today a win.'), 'Ivy Lee 6' ('Six ranked items, worked strictly in order.') and '1 · 3 · 5' ('One big, three medium, five small.'). Hidden on Free days and low-energy days.",
          how: "Click one. It sets how many tasks you can pick: 3, 6 or 9.",
        },
        { name: "One-line intention (optional)", what: "Text field, for example 'Close the Acme deal and ship the onboarding video'. Shown on Today in quotes." },
      ],
    },
    {
      route: "Start my day — step 5",
      title: "Top priorities (or Top 1)",
      purpose: "Pick the tasks that will make today a win.",
      elements: [
        { name: "Pick your Big 3 / Ivy Lee 6 / 1 · 3 · 5", what: "Step title (on a low-energy day: 'Your one thing'). Hint: 'Aim for at least one delivery item and one revenue item (sales or marketing).' On a Free day: 'pick nothing, or one tiny thing that recharges you.'" },
        {
          name: "Add a new one…",
          what: "Field to create a new task right here. Example: 'Call Sara about the proposal #sales ~30m'.",
          how: "Type and click '+ Add' (or Enter). It creates a High-priority task for today and adds it to your picks (if there is room).",
        },
        { name: "Picked list", what: "Your chosen tasks, numbered in order. In '1 · 3 · 5' each one is labelled Big, Medium or Small.", how: "Click 'Remove' to un-pick. The order you pick is the order you work." },
        { name: "Suggestions · x/y picked", what: "Up to 40 open tasks, best first: planned for today, due today or earlier, linked to a goal, then by priority. Chips show 'goal', 'due', 'today' and 'high'.", how: "Click a task to pick it. When you reach the limit the rest are greyed out." },
        { name: "No open tasks yet", what: "Shown when there are no candidates: 'No open tasks yet — add your first above.'" },
      ],
    },
    {
      route: "Start my day — step 6",
      title: "Capacity",
      purpose: "Check that the plan fits the hours you really have.",
      elements: [
        { name: "Will it fit?", what: "Step title. Hint: 'Plan about 5–6 focused hours on a normal day. Over-planning is the #1 reason daily plans collapse.'" },
        { name: "Capacity ring", what: "Percent of your available time already planned. Green when it fits, yellow when over." },
        { name: "Planned of", what: "'Xh planned of Yh', plus 'incl. Xh of calls/meetings' when you have manager blocks today." },
        { name: "Fit message", what: "'Realistic. You've left room for the unexpected.' or 'Xh over — defer something below.'" },
        { name: "Available today", what: "Slider from 1 to 10 hours in half-hour steps. Starts at your Settings capacity (5.5h by default).", how: "Drag it to the hours you truly have today (fewer on a day full of errands)." },
        {
          name: "Today's task rows",
          what: "Every open task for today (Top picks marked 'Top'), with estimate buttons 15m, 30m, 1h, 1.5h, 2h. A task without an estimate counts as 30m.",
          how: "Click an estimate to save it on the task immediately. Click '→ tomorrow' on a non-Top task to move it to tomorrow.",
        },
      ],
    },
    {
      route: "Start my day — step 7",
      title: "If–then plan",
      purpose: "Name the most likely distraction and decide your response now.",
      elements: [
        { name: "What will try to derail you?", what: "Step title. Hint: 'If–then plans are one of the best-proven tools in behaviour science. Name the obstacle, decide the response now.'" },
        { name: "If…", what: "Field for the trigger, for example 'I feel the urge to check messages before my Top 1 is done'." },
        { name: "…then I will", what: "Field for the response, for example 'write it in the Inbox and go back for 10 more minutes'." },
        {
          name: "Ideas",
          what: "Four ready-made plans: phone during focus → another room + 5 more minutes; client message before noon → note it, reply in afternoon office hours; stuck on Top 1 → write the next physical step; 4 pm without outreach → send 10 messages first.",
          how: "Click one to fill both fields, then edit it.",
        },
      ],
      howTo: ["Leave both fields empty to skip; the plan is saved only when both are filled."],
    },
    {
      route: "Start my day — step 8",
      title: "Lock it in",
      purpose: "Read your day once, then start.",
      elements: [
        { name: "Here's your day", what: "Step title. Hint: 'Read it once. Then close everything else and start with #1.'" },
        { name: "Summary chips", what: "Day type, 'Low-energy mode' (if on), capacity (for example '5h 30m capacity') and 'Energy N/5'." },
        { name: "Intention", what: "Your intention in large text." },
        { name: "Numbered priorities", what: "Your picks in order (only as many as the shape allows)." },
        { name: "If–then box", what: "'If [trigger], then [response].'" },
        { name: "XP line", what: "'+25 XP for the start-up · +15 XP for each Top item you finish'." },
        { name: "Tonight line", what: "'Tonight: a 5-minute shutdown closes the loop.'" },
        { name: "Lock in my day", what: "The final button.", how: "Click it. bishOS applies your leftover decisions, plans your picks for today, saves everything, fires confetti and shows 'Day locked in. Go win it.' (+25 XP the first time today)." },
      ],
    },
  ],
  frameworks: [
    {
      term: "Start-up ritual",
      definition: "A short, fixed routine at the start of the workday to decide what matters before the world decides for you.",
      example: "8:30, coffee, 5 minutes in bishOS, then straight into Top 1.",
      source: "Michael Hyatt, Full Focus (workday start-up ritual)",
    },
    {
      term: "Check-in",
      definition: "A quick self-rating of sleep, sleep quality, energy (1–5) and mood (1–5). It is saved to the day and shown in Journal, and it can switch on low-energy mode.",
      example: "6h sleep, energy 2 → bishOS suggests a low-energy day.",
      source: "bishOS (energy management)",
    },
    {
      term: "Low-energy mode",
      definition:
        "A kinder version of the day for bad days. You pick only one Top priority ('Your one thing') and the minimum version of each habit counts fully. Suggested automatically when energy is 2 or lower or sleep is under 6 hours.",
      example: "Your child was sick all night. You pick only 'Reply to the client' and do 2-minute habit versions.",
      source: "bishOS, inspired by James Clear's 2-minute rule",
    },
    {
      term: "Focus day / Buffer day / Free day",
      definition:
        "Three day types. Focus day: revenue and deep work. Buffer day: admin, prep and catch-up. Free day: no work at all, midnight to midnight. Free days are neutral for your ritual streak.",
      example: "Mon–Wed Focus, Thursday Buffer for invoices and email, Sunday Free.",
      source: "Dan Sullivan, Strategic Coach (Free, Focus, Buffer days)",
    },
    {
      term: "Daily shape",
      definition: "How you structure your priority list: Big 3, Ivy Lee 6 or 1 · 3 · 5. It sets how many tasks you may pick.",
      example: "Heavy delivery day: Big 3. Many small client requests: 1 · 3 · 5.",
      source: "bishOS",
    },
    {
      term: "Big 3",
      definition: "Pick three things that make today a win. Fewer goals, more finishing.",
      example: "Proposal, video, outreach.",
      source: "Michael Hyatt, Full Focus (Daily Big 3)",
    },
    {
      term: "Ivy Lee 6",
      definition: "Write the six most important tasks, rank them, and work strictly in order. Don't start #2 until #1 is done. Unfinished items move to tomorrow's list.",
      example: "1 Contract, 2 Invoice, 3 Hiring post, 4 Two calls, 5 Blog draft, 6 Inbox.",
      source: "Ivy Lee (1918), popularised by James Clear",
    },
    {
      term: "1-3-5 rule",
      definition: "Plan one big task, three medium tasks and five small tasks — nine in total. Good for days with many small requests.",
      example: "Big: website launch. Medium: 3 client calls. Small: 5 quick emails.",
      source: "The Muse (Alex Cavoulacos)",
    },
    {
      term: "Intention",
      definition: "One sentence that says what today is about. It keeps you pointed when small things pull at you.",
      example: "'Close the Acme deal and ship the onboarding video.'",
      source: "Full Focus",
    },
    {
      term: "If–then plan",
      definition:
        "A plan in the form 'If X happens, then I will do Y'. Deciding the response in advance makes you far more likely to follow through when the moment comes.",
      example: "'If a client messages before noon, then I note it in the Inbox and reply at 14:00.'",
      source: "Peter Gollwitzer (implementation intentions)",
    },
    {
      term: "Leftover decisions",
      definition:
        "Today: plan it for today. Tomorrow: plan it for tomorrow (counts as one deferral). Backlog: no day. Someday: park it for later, out of sight. Drop: delete it. Done (shutdown only): you actually did it.",
      example: "'Update LinkedIn banner' moved 3 times → Someday.",
      source: "Sunsama / GTD",
    },
    {
      term: "Deferral count",
      definition: "How many times a task was pushed to tomorrow. From 2 deferrals the start-up asks 'keep or drop?'; from 3 the task drawer warns you. A task moved again and again is usually not important or not clear.",
      example: "'Write ebook' moved 4× → you break it into 'Outline chapter 1 (30 min)'.",
      source: "bishOS",
    },
    {
      term: "Fresh start",
      definition:
        "After 3 or more days without a ritual, bishOS greets you with 'Welcome back' instead of a wall of red. People restart more easily at a clean 'new beginning'. You decide what still matters and move on.",
      example: "Back from a 5-day trip: 'Fresh start' → all leftovers to backlog → pick today's Top 3.",
      source: "Hengchen Dai & Katy Milkman (the fresh start effect)",
    },
  ],
  testing: [
    "On Today click 'Start my day'. Expected: a full-screen overlay with 'Morning start-up' at the top and '1/7' or '1/8'.",
    "Click 'Let's go'. On Check-in set sleep to 5h and energy to 'Low', then click Continue. Expected: toast 'Low-energy day mode on' and the next step titles say 'Top 1'.",
    "Go back, untick 'Low-energy day', continue. On Day shape choose 'Ivy Lee 6'. Expected: the hint changes to 'Six ranked items, worked strictly in order.'",
    "On Top priorities type 'Test start-up task ~30m' and click Add. Expected: it appears as #1 in the picked list. The counter reads '1/6 picked'.",
    "Try clicking Continue with nothing picked (remove all). Expected: the button is disabled (unless Free day).",
    "On Capacity drag 'Available today' to 1h. Expected: the ring turns yellow with 'over — defer something below'. Click an estimate button on a task; expected: it highlights and stays after you go back and forward.",
    "On If–then click an idea. Expected: both fields fill.",
    "Click 'Lock in my day'. Expected: confetti, toast 'Day locked in. Go win it.' with +25 XP, Today shows your picks under Top priorities, and the 'Start-up' dot is green.",
    "Click 'Re-plan' on Today and lock in again. Expected: your answers are pre-filled and no second +25 XP is shown.",
    "With a leftover task (planned for yesterday, not done), open the ritual. Expected: a 'Close yesterday' step appears; choosing 'Drop' and locking in deletes that task.",
  ],
  tips: [
    "Pick at least one revenue task (sales or marketing) every Focus day.",
    "If you can't decide a leftover, choose Someday. You can always bring it back.",
    "Lower 'Available today' honestly on days with errands or school runs.",
  ],
};

const shutdown: GuideSection = {
  id: "evening-shutdown",
  group: "Today",
  title: "Evening shutdown ritual",
  summary:
    "A 5-minute, step-by-step ritual that ends your workday: empty the inbox, decide every leftover, tick habits, glance at tomorrow, leave a note for tomorrow-you, and write what moved forward.",
  why:
    "Unfinished work keeps running in your head all evening. The shutdown closes every open loop, so your brain can rest and tomorrow starts in seconds instead of minutes.",
  when: {
    daily: "At the end of every workday, before you close the laptop. From 16:00 the Shutdown button glows on Today and in the Topbar.",
  },
  pages: [
    {
      route: "Shutdown (overlay, any page)",
      title: "Shutdown frame",
      purpose: "Same frame as the start-up, with 'Evening shutdown' (moon) at the top and 7 steps.",
      elements: [
        { name: "Evening shutdown label", what: "Moon badge naming the ritual." },
        { name: "Progress bars and step counter", what: "For example '2/7 · Decide leftovers'." },
        { name: "Close (X)", what: "Closes without finishing. Esc does the same. Inbox actions and habit ticks you already made stay saved." },
        { name: "Back", what: "Previous step. Hidden on the final screen." },
        { name: "Next button", what: "'Continue' on most steps, 'Shutdown complete' on the Reflect step (this saves everything), and 'Close' on the final screen." },
      ],
      howTo: ["Open it with 'Shutdown' on Today, the Day button in the Topbar, the command palette ('Shutdown'), or the Journal day page."],
    },
    {
      route: "Shutdown — step 1",
      title: "Inbox zero",
      purpose: "Give every capture a home so your brain can let go.",
      elements: [
        { name: "Empty the inbox", what: "Step title. Hint: 'Give every capture a home so your brain can let go. Two-minute items: just do them.'" },
        { name: "Inbox item row", what: "The text of one open inbox item. Up to 12 are shown." },
        { name: "Task", what: "Makes the item a backlog task in your first Life Area (no day). Only shows when you have at least one Life Area. +2 XP." },
        { name: "Note", what: "Saves the item as a fleeting note. +2 XP." },
        { name: "Done (tick icon)", what: "Marks the item done — you did it in under 2 minutes. +2 XP." },
        { name: "Discard (bin icon)", what: "Throws the item away. No XP. You can restore it from Inbox → History." },
        { name: "+N more", what: "When more than 12 items wait: 'finish them on the Inbox page tomorrow.'" },
        { name: "Inbox zero", what: "Empty state: 'Nothing waiting. Beautiful.'" },
      ],
    },
    {
      route: "Shutdown — step 2",
      title: "Decide leftovers",
      purpose: "Every task planned for today that isn't done gets a clear decision.",
      elements: [
        { name: "Decide every leftover", what: "Step title. Hint: 'Nothing rolls forward silently. Tomorrow, backlog, someday — or drop it with a clear conscience.'" },
        { name: "All → tomorrow", what: "Sets every leftover to 'Tomorrow'." },
        { name: "Leftover card", what: "Area dot, title, and a 'Top' chip if it was a Top priority. Covers today's open Top priorities, planned tasks and tasks that started today." },
        {
          name: "Decision buttons",
          what: "'Actually done' (green: marks it done, +5 XP, +15 more if it was a Top priority), 'Tomorrow', 'Backlog', 'Someday', 'Drop' (red: deletes it).",
          how: "Click one per task. Applied when you finish the shutdown.",
        },
        { name: "Undecided warning", what: "'N still undecided — they'll show up tomorrow morning.' (They become leftovers in tomorrow's start-up.)" },
        { name: "Everything planned today is done", what: "Empty state: 'That's what a good day looks like.'" },
      ],
    },
    {
      route: "Shutdown — step 3",
      title: "Habits",
      purpose: "Tick today's habits before the day ends.",
      elements: [
        { name: "Tick today's habits", what: "Step title. Hint: 'Did the 2-minute version? That counts. Planned skip? Your streak is safe.'" },
        { name: "Habit row", what: "Habit name and 'Minimum: [text]' if it has a minimum version." },
        { name: "Done / Minimum / Planned skip", what: "Log the habit as done (+5 XP), minimum (+3 XP) or a planned skip (no XP, streak safe, limited by the habit's weekly reserve skips).", how: "Click to log right away. Click the same button again to clear it." },
        { name: "No habits yet", what: "Empty state: 'Add 1–3 keystone habits on the Habits page.'" },
      ],
    },
    {
      route: "Shutdown — step 4",
      title: "Look ahead",
      purpose: "See tomorrow so nothing ambushes you, and optionally pre-pick tomorrow's Top 3.",
      elements: [
        { name: "Glance at tomorrow", what: "Step title. Hint: 'See what's coming so nothing ambushes you. Optionally pre-pick tomorrow's Top 3.'" },
        { name: "Tomorrow card", what: "Tomorrow's date and its time blocks with start times, or 'No blocks yet.'" },
        { name: "Deadlines · next 2 weeks", what: "Up to 10 open tasks with deadlines in the next 15 days and how far away they are, or 'Clear runway.'" },
        {
          name: "Tomorrow's Top 3 (optional) · x/3",
          what: "A list of tasks you can pre-pick for tomorrow: first the leftovers you just set to 'Tomorrow', then the best candidates (up to 20). Pre-filled if tomorrow already has a Top 3.",
          how: "Click up to 3 tasks; each shows its rank number. Click again to un-pick. They become tomorrow's Top priorities and are planned for tomorrow.",
        },
      ],
    },
    {
      route: "Shutdown — step 5",
      title: "Ready to resume",
      purpose: "Leave a note for tomorrow-you.",
      elements: [
        {
          name: "Leave a note for tomorrow-you",
          what: "Big text box. Hint: 'Where exactly did you stop, and what's the very next step? This kills attention residue — tomorrow you start in seconds.' Example: 'Stopped at the pricing section of the Acme proposal. Next: add the 3 package options and send to Sara before 11.'",
          how: "Write 1–3 sentences. Tomorrow's start-up shows it as 'Where you stopped'.",
        },
      ],
    },
    {
      route: "Shutdown — step 6",
      title: "Reflect",
      purpose: "Notice what moved forward. One line each.",
      elements: [
        { name: "What moved forward?", what: "Step title. Hint: 'Noticing progress is the #1 driver of good workdays. One line each — it takes a minute.'" },
        { name: "Progress today", what: "One line, for example 'Sent the proposal; recorded 2 shorts'. Writing this (or a win) adds 10 to the day score. Tomorrow's start-up shows it." },
        { name: "Win of the day", what: "One line, for example 'Client said yes to the call'." },
        { name: "Lesson learned", what: "One line, for example 'Booking the next call before hanging up works'." },
        { name: "Grateful for (optional)", what: "One line." },
        { name: "Shutdown complete (button)", what: "Saves leftover decisions, notes, reflection and tomorrow's Top 3, and records the shutdown. +25 XP (once per day). Writing a win or gratitude of more than 3 characters also gives +5 XP for the journal." },
      ],
    },
    {
      route: "Shutdown — step 7",
      title: "Shutdown complete",
      purpose: "Celebrate and switch off.",
      elements: [
        { name: "Day score ring", what: "Your final day score for today, also saved to the Journal." },
        { name: "Shutdown complete.", what: "'Everything is captured, decided and planned. Your brain is allowed to rest now — work can wait until tomorrow.'" },
        { name: "Result chips", what: "'+25 XP' (if earned now), 'N day streak', 'N shields left', 'Level N · [title]'." },
        { name: "Close", what: "Closes the ritual. Today now shows 'Day complete — enjoy your evening'." },
      ],
    },
  ],
  frameworks: [
    {
      term: "Shutdown ritual",
      definition:
        "A fixed routine that ends work: review open loops, make a plan for them, then say the day is over. After it, you don't check work. Your brain can only rest when it trusts that nothing is forgotten.",
      example: "17:30: shutdown in bishOS, close the laptop, say 'shutdown complete', go to the gym.",
      source: "Cal Newport, Deep Work",
    },
    {
      term: "Inbox zero",
      definition: "Processing your inbox until it is empty: every item gets a decision and a home. Empty does not mean done — it means decided.",
      example: "8 captures at 17:30 → 3 tasks, 2 notes, 1 done, 2 discarded → zero.",
      source: "Merlin Mann (Inbox Zero), based on GTD",
    },
    {
      term: "Resume note (ready-to-resume plan)",
      definition:
        "A short note about exactly where you stopped and the very next step. It removes 'attention residue' — the part of your mind still stuck on unfinished work — and makes restarting fast.",
      example: "'Stopped at slide 7 of the investor deck. Next: add the revenue chart from the March sheet.'",
      source: "Sophie Leroy (attention residue research)",
    },
    {
      term: "Attention residue",
      definition: "When you switch from an unfinished task, part of your attention stays on it. That leftover attention makes your next work worse and keeps you thinking about work at night.",
      example: "You leave a half-written proposal and keep thinking about it during dinner.",
      source: "Sophie Leroy",
    },
    {
      term: "Progress line",
      definition: "One sentence about what moved forward today. Seeing progress, even small, is the strongest booster of motivation at work.",
      example: "'Sent the proposal; recorded 2 shorts.'",
      source: "Teresa Amabile, The Progress Principle",
    },
    {
      term: "Win, lesson, gratitude",
      definition: "Three short reflection prompts. Win: the best thing that happened. Lesson: what you learned to repeat or avoid. Gratitude: one thing you are thankful for. They fill your Journal.",
      example: "Win: 'Client renewed'. Lesson: 'Send the agenda the day before'. Grateful: 'My team covered for me'.",
      source: "Positive psychology (daily reflection)",
    },
    {
      term: "Tomorrow's Top 3 (pre-pick)",
      definition: "Choosing tomorrow's priorities tonight, while today's context is fresh. Tomorrow's start-up then only needs to confirm them.",
      example: "You pick 'Finish Acme deck' as #1 for tomorrow before leaving.",
      source: "Full Focus / Ivy Lee",
    },
  ],
  testing: [
    "Capture two items with C first. Then click 'Shutdown' on Today. Expected: a full-screen overlay with 'Evening shutdown' and '1/7 · Inbox zero', listing your two items.",
    "Click 'Task' on one item and the tick on the other. Expected: both disappear; the list shows 'Inbox zero'.",
    "Continue. On Decide leftovers click 'All → tomorrow'. Expected: every card shows 'Tomorrow' selected and no undecided warning.",
    "Continue. On Habits click 'Done' on a habit. Expected: it highlights; clicking it again clears it.",
    "Continue. On Look ahead pick one task. Expected: it shows '1' and the counter reads '1/3'.",
    "Continue. Write a resume note. Continue. Write a progress line and a win.",
    "Click 'Shutdown complete'. Expected: confetti, toast 'Shutdown complete. You're done for today.' with +25 XP, and the final screen with the day score ring and chips.",
    "Click 'Close'. Expected: Today shows 'Day complete — enjoy your evening' and the 'Shutdown' dot is green.",
    "Tomorrow, open the start-up. Expected: 'Where you stopped' shows your resume note, 'Yesterday's progress' shows the progress line, and the pre-picked task is already #1.",
    "Open Journal → today. Expected: the reflection fields show what you wrote and the day score is saved.",
  ],
  tips: [
    "Do the shutdown even on bad days. A 3-minute shutdown beats none.",
    "Write the resume note as an instruction to a stranger: specific file, specific next action.",
    "After 'Shutdown complete', don't open work chat again. That is the whole point.",
  ],
};

const inbox: GuideSection = {
  id: "inbox",
  group: "Today",
  title: "Inbox",
  summary:
    "The one place where everything you capture lands. You process it later, one item at a time, giving each a home: task, note, promise, waiting-for, person, content idea, something to learn, done, snooze or discard. Keyboard keys make it fast, and AI can suggest a home for each item.",
  why:
    "Capturing without filing keeps your focus. Processing in one batch keeps your system clean. Inbox zero means nothing is lost and nothing is nagging you.",
  when: {
    daily: "Process it once or twice a day (the evening shutdown does a quick pass). Try not to let items get older than 48 hours.",
    weekly: "In the weekly review, empty it fully.",
  },
  pages: [
    {
      route: "/inbox",
      title: "Inbox",
      purpose: "Turn raw captures into the right kind of item, fast.",
      elements: [
        { name: "Inbox (title)", what: "Page title with the subtitle 'Everything you capture lands here. Give each item a home — the 2-minute rule decides what to just do.'" },
        { name: "Capture (C)", what: "Opens Quick capture in Inbox mode.", how: "Click it, or press C anywhere." },
        {
          name: "Sort with AI",
          what: "Asks the AI to suggest a home for up to 30 open items: a type (task, note, commitment, idea, person, resource or trash), a clean title, a Life Area, and whether it takes under 2 minutes. Nothing is saved as a task yet.",
          how: "Click it on the 'To process' tab. A spinner shows while it works, then a toast: 'AI suggested a home for N items — Tap a suggestion to accept it.'",
        },
        {
          name: "Tabs: To process · Snoozed · History",
          what: "'To process' shows open items (plus snoozed items whose time has come) with a count. 'Snoozed' shows items waiting for their snooze time. 'History' shows the last 60 processed or discarded items.",
          how: "Click a tab. Processing buttons only work on 'To process'.",
        },
        { name: "Older than 48h chip", what: "Yellow chip: 'N older than 48h — process or discard'." },
        {
          name: "Item list",
          what: "Each row: a dot (yellow when older than 48 hours), the text (2 lines), its age ('just now', '5h', '3d'), its source ('quick' or 'brain-dump'), the AI's suggested type in blue if any, and '→ task' (etc.) in History.",
          how: "Click a row to select it, or use J/K or the arrow keys.",
        },
        { name: "Back to inbox (↺)", what: "On Snoozed and History rows: puts the item back into 'To process'. If it had earned XP, that XP is removed (so you can earn it again when you re-process it)." },
        { name: "Give it a home", what: "The processor panel for the selected item. Hint: 'Shortcut keys shown on each button · J/K to move'." },
        { name: "Item text box", what: "The full text of the item.", how: "Edit it; it saves when you click outside the box." },
        {
          name: "AI suggests bar",
          what: "Blue bar after 'Sort with AI': 'AI suggests: [type] in [area] · under 2 minutes — just do it', with the matching key.",
          how: "Click it to accept the suggestion (uses the AI's title). For types that need details, the form opens first.",
        },
        { name: "Task (T)", what: "Makes a task. Opens a form: Title, Area, Priority, When.", how: "Press T (or click), check the form, press T again, Enter, or 'Save'. +2 XP." },
        { name: "Note (N)", what: "Saves the item as a fleeting note in Notes (with the chosen area). One step, +2 XP." },
        { name: "I owe (O)", what: "Logs a promise you made. Opens Title + 'Promised by' date.", how: "Press O, set the date, then O/Enter/Save. Toast 'Commitment logged'. +2 XP." },
        { name: "Waiting for (W)", what: "Logs something someone owes you. Opens Title + 'Check again on' date.", how: "Press W, set the date, save. Toast 'Added to Waiting for'. +2 XP." },
        { name: "Person (P)", what: "Creates a person in People (relation: lead) with the item text as notes. One step, +2 XP." },
        { name: "Content idea (I)", what: "Creates a content piece at the 'idea' stage. Opens Title + 'Personal brand' / 'Company'.", how: "Press I, choose the brand, save. +2 XP." },
        { name: "To learn (L)", what: "Saves a resource to your Library (queued). Opens Title + 'Why are you saving it? (required — fights the collector's fallacy)'. A link in the text is picked up automatically.", how: "Press L, write one line of why, save. Without a reason you see 'Why are you saving it? One line.'. +2 XP." },
        { name: "Done (2 min) (D)", what: "Marks the item done because you just did it (it took under 2 minutes). Toast 'Done in under 2 minutes'. +2 XP." },
        { name: "Snooze (S)", what: "Hides the item until tomorrow at 9:00, then it returns to 'To process'. Toast 'Snoozed until tomorrow 9am'. No XP." },
        { name: "Discard (X)", what: "Throws the item away (it stays in History, where you can restore it). No XP." },
        { name: "Title (form)", what: "The title of the new item, pre-filled with the first line (or the AI's title).", how: "Edit it. Enter saves, Esc cancels." },
        { name: "Area (task form)", what: "The Life Area for the task (pre-selected from the AI's suggestion when it matches)." },
        { name: "Priority (task form)", what: "'High', 'Medium' (default) or 'Low'." },
        {
          name: "When (task form)",
          what: "'Today', 'Tomorrow', 'This week' (this Friday, or today if Friday has passed), 'Backlog' (no day, default) or 'Someday'.",
        },
        { name: "Promised by / Check again on (date)", what: "The date field for I owe and Waiting for." },
        { name: "Personal brand / Company", what: "Brand switch for content ideas." },
        { name: "Cancel / Save", what: "Close the form, or save the item. Save shows the action's key." },
        { name: "Inbox zero (empty state)", what: "'Your head is clear. Press C anywhere to capture the next thought in two seconds.' When you process the last item you get confetti and 'Inbox zero. Mind like water.'", how: "Click 'Brain dump' to empty your head into Quick capture." },
        { name: "Nothing snoozed / No history yet", what: "Empty states of the other two tabs." },
      ],
      howTo: [
        "Open Inbox. Optional: click 'Sort with AI' first.",
        "For the selected item, decide: can I do it in under 2 minutes? Then do it and press D.",
        "Otherwise press the key for its home (T, N, O, W, P, I, L), fill the short form if one opens, and press Enter.",
        "Not ready to decide? Press S (snooze to tomorrow 9:00). Not needed? Press X.",
        "The next item is selected automatically. Repeat until 'Inbox zero'.",
      ],
    },
  ],
  frameworks: [
    {
      term: "Inbox (capture bucket)",
      definition: "One trusted place where every loose thought, request and idea goes first, without deciding anything. You empty it on a schedule.",
      example: "'Idea: reel about pricing', 'Ali logo files?', 'Book dentist' — all go to the Inbox.",
      source: "David Allen, GTD",
    },
    {
      term: "Processing",
      definition: "Taking each inbox item, one at a time, from the top, and deciding what it is and what the next action is. You never put an item back unprocessed.",
      example: "'Book dentist' → Task, Personal area, This week.",
      source: "David Allen, GTD",
    },
    {
      term: "2-minute rule",
      definition: "If an item takes less than two minutes, do it now instead of tracking it. Tracking it would cost more time than doing it.",
      example: "'Reply yes to Sara' → reply now → press D.",
      source: "David Allen, GTD",
    },
    {
      term: "Someday",
      definition: "A parking place for things you might do later but not now. They don't appear in daily lists, so they don't nag you. Review them in the weekly or monthly review.",
      example: "'Learn Spanish', 'Write a book' → Someday.",
      source: "David Allen, GTD (Someday/Maybe list)",
    },
    {
      term: "Snooze",
      definition: "Hide an item until a set time (here: tomorrow 9:00) when you can't decide yet. It comes back on its own.",
      example: "'Ask about the event invite' — snooze until you hear back tomorrow.",
      source: "Email clients (Superhuman, Gmail)",
    },
    {
      term: "Stale item (48h)",
      definition: "An open inbox item older than 48 hours. Old items lose context and become guilt. bishOS marks them yellow, adds a chip, and sends a notification.",
      example: "A capture from Monday morning is stale on Wednesday morning.",
      source: "bishOS",
    },
    {
      term: "Collector's fallacy",
      definition: "The feeling that saving something is the same as learning it. Saving a link costs nothing and teaches nothing. That's why 'To learn' asks why you are saving it.",
      example: "Instead of saving 40 sales articles, you save one 'to improve my cold-call opener'.",
      source: "Christian Tietze (zettelkasten.de)",
    },
    {
      term: "Mind like water",
      definition: "A calm state where your mind responds to what happens without being full of open loops — possible because everything is captured and decided.",
      example: "After inbox zero you can think about one thing at a time.",
      source: "David Allen, GTD",
    },
    {
      term: "Fleeting note",
      definition: "A quick, rough note to keep a thought. Later you turn the good ones into proper notes or throw them away.",
      example: "'Clients buy outcomes, not hours — blog idea?'",
      source: "Sönke Ahrens, How to Take Smart Notes",
    },
  ],
  testing: [
    "Press C, type 'Test reply to Sara', press Enter. Press C again, type 'Test idea: reel about pricing', Enter. Open /inbox. Expected: 'To process' shows 2 more items, newest first, with 'just now · quick'.",
    "Select 'Test reply to Sara' and press D. Expected: toast 'Done in under 2 minutes' with +2 XP; the item disappears; the next one is selected.",
    "Select the idea and press I. Expected: a form with Title and 'Personal brand / Company'. Press Enter. Expected: 'Content idea saved'.",
    "Capture 'Test book dentist', select it, press T. Choose When = 'Tomorrow', press Enter. Expected: 'Task created'. Open Tasks: the task exists, planned for tomorrow.",
    "Capture 'Test link https://example.com', press L, then Enter with an empty 'Why'. Expected: a warning 'Why are you saving it? One line.'. Type a reason and save. Expected: 'Added to your Library'.",
    "Capture one item and press S. Expected: 'Snoozed until tomorrow 9am'; it is now in the 'Snoozed' tab.",
    "In 'History' click ↺ on a processed item. Expected: it returns to 'To process' and its XP is removed.",
    "Capture 3 items and click 'Sort with AI'. Expected: toast 'AI suggested a home for 3 items'; each row shows a blue type; selecting one shows the 'AI suggests' bar; clicking the bar processes it.",
    "Process the last item. Expected: confetti and 'Inbox zero. Mind like water.'",
    "Click inside the text box and press X. Expected: nothing is discarded (keys are ignored while typing).",
  ],
  tips: [
    "Don't process while capturing. Capture all day; process once or twice.",
    "Use D generously — many items are 2-minute items.",
    "If the AI is wrong, ignore the suggestion and press your own key.",
  ],
};

const quickCapture: GuideSection = {
  id: "quick-capture",
  group: "Today",
  title: "Quick capture",
  summary:
    "A small window that opens anywhere with the C key. Three modes: Inbox (dump a thought), Task (create a task in one line with natural language), and Brain dump (type or speak everything; AI splits it into items you review before saving).",
  why: "A thought you don't capture in seconds is lost, or it keeps nagging you. Quick capture is always one key away, so your head stays free for real work.",
  when: {
    daily: "All day, whenever something pops into your head: press C, type, Enter.",
    weekly: "Before the weekly review, do a Brain dump to empty your head.",
  },
  pages: [
    {
      route: "Press C (overlay, any page)",
      title: "Quick capture window",
      purpose: "Capture in two seconds without leaving what you are doing.",
      elements: [
        { name: "Mode switch: Inbox · Task · Brain dump", what: "Three tabs at the top. The C key always opens Inbox mode.", how: "Click a tab to switch." },
        { name: "N captured", what: "Green chip that counts how many things you captured since opening. The window stays open so you can capture several in a row." },
        { name: "Close (X)", what: "Closes the window. Esc or a click outside does the same." },
        {
          name: "Text box (Inbox mode)",
          what: "Placeholder: 'What's on your mind? Dump it — decide later.'",
          how: "Type and press Enter (or 'Capture'). Shift+Enter makes a new line. Toast: 'Captured to Inbox — Process it later — no filing now.'",
        },
        {
          name: "Text box (Task mode)",
          what: "Placeholder: 'Send proposal to Ali tomorrow #sales !high ~45m'. Creates a task directly.",
          how: "Type a sentence with tokens and press Enter (or 'Add task'). Without a date token the task goes to the backlog. Toast: 'Task added · [day]'.",
        },
        { name: "Parsed chips (Task mode)", what: "Live chips that show what bishOS understood: date (calendar), area (#), priority (flag), estimate (clock)." },
        { name: "Area select (Task mode)", what: "Shown when you didn't type a #area. Remembers the last area you used.", how: "Pick the Life Area for the task." },
        { name: "Token hint", what: "'today · tmr · fri · #area · !high · ~30m' — a reminder of the main tokens." },
        {
          name: "Text box (Brain dump mode)",
          what: "Large box. Placeholder: 'Everything in your head — calls to make, promises, ideas, people, links to study… one per line or just ramble.'",
        },
        { name: "Speak / Stop", what: "Dictation using your browser's speech recognition (Chrome and Edge). A red 'listening…' shows while it records; spoken text is added to the box.", how: "Click 'Speak', talk, click 'Stop'. The button only appears in browsers that support it." },
        { name: "All to Inbox (Brain dump)", what: "Saves each line as its own Inbox item, without AI. Toast 'N items in your Inbox'." },
        { name: "Sort with AI (Brain dump)", what: "Sends the text to the AI, which splits it into separate items and guesses each type, area, day and priority. Nothing is saved yet.", how: "Click it or press Ctrl+Enter." },
        { name: "Review tray", what: "'Review before saving — untick anything wrong, change the type with one tap.' One card per item the AI found." },
        { name: "Include checkbox", what: "Untick an item to leave it out." },
        { name: "Item title", what: "Editable title of the item." },
        { name: "Type buttons", what: "'Task', 'Note', 'Commitment', 'Content idea', 'Person', 'To learn'.", how: "Tap to change the type." },
        { name: "Area select (task items)", what: "The Life Area for a task item." },
        { name: "I owe / Owed to me (commitment items)", what: "The direction of a commitment item." },
        { name: "Date chip", what: "The day the AI found in your text (for example 'Friday' → its date)." },
        { name: "Back", what: "Returns to the text box to edit your dump." },
        { name: "Save N items", what: "Saves every included item to its home (tasks, notes, commitments, content ideas, people, Library). Toast: 'N items filed from your brain-dump' with +2 XP per item." },
        { name: "Nothing found", what: "'Nothing found — try writing a bit more.'" },
        { name: "Footer hints", what: "'C capture anywhere · Ctrl K command' and 'Enter to save · Shift+Enter new line' (or 'Ctrl+Enter to sort' in Brain dump)." },
      ],
      howTo: [
        "Press C anywhere (not inside a text box, and not while another window like a ritual is open).",
        "Type the thought and press Enter. Done — go back to work.",
        "For a ready task, switch to Task and type, for example, 'Call Ali fri #sales ~15m'.",
        "For a full head, switch to Brain dump, type or speak everything, click 'Sort with AI', review, then 'Save N items'.",
        "Other ways to open it: the Capture button in the sidebar, the big + on the phone bar, the + in the Topbar on phones, 'Brain dump' on Today, 'Capture' on Inbox, or the command palette.",
      ],
    },
  ],
  frameworks: [
    {
      term: "Capture habit",
      definition: "Writing every open loop down the moment it appears, in one trusted place. Your brain is for having ideas, not holding them.",
      example: "Walking to a meeting you remember the VAT form: C → 'VAT form' → Enter.",
      source: "David Allen, GTD",
    },
    {
      term: "Brain dump (mind sweep)",
      definition: "Writing down everything on your mind in one go — tasks, worries, ideas, promises — so nothing is left in your head.",
      example: "Sunday evening: 10 minutes of rambling → 14 items sorted by AI.",
      source: "David Allen, GTD (mind sweep)",
    },
    {
      term: "Natural-language tokens",
      definition:
        "Short words bishOS reads inside a task sentence and removes from the title. Dates: 'today', 'tonight', 'tdy'; 'tomorrow', 'tmrw', 'tmr'; 'next week' (next Monday); 'in 3 days' (1–99); a weekday 'mon'…'sun' or 'monday'…'sunday', also 'on fri' (always the next one — today's weekday means one week later). Someday: 'someday', 'later', 'sometime' (only if no date). Area: '#' + the start of an area name or any word in it ('#sales' → Company Sales & Marketing); if no area matches, the # text stays in the title. Priority: '!high' '!h' '!!!', '!med' '!m' '!!', '!low' '!l'. Estimate: '~30m', '~1h', '~1.5h', or '~45' (minutes).",
      example: "'Send proposal to Ali tomorrow #sales !high ~45m' → title 'Send proposal to Ali', tomorrow, Sales, High, 45 min.",
      source: "Todoist (Quick Add)",
    },
    {
      term: "Review tray",
      definition: "A check step where you see what the AI understood before anything is saved. The AI may split or label things wrongly; you stay in control.",
      example: "The AI marked 'Ali owes me the logo' as I owe; you switch it to 'Owed to me'.",
      source: "Todoist Ramble",
    },
    {
      term: "Dictation",
      definition: "Speaking instead of typing. bishOS uses the speech recognition built into Chrome and Edge, in your browser's language.",
      example: "Driving home (parked), you speak a brain dump of tomorrow's calls.",
      source: "Web Speech API",
    },
  ],
  testing: [
    "On any page (click on empty space first) press C. Expected: the window opens in Inbox mode with the cursor in the box.",
    "Type 'Test capture 1', Enter. Expected: toast 'Captured to Inbox', the box clears, chip '1 captured'. Type 'Test capture 2', Enter. Expected: '2 captured'.",
    "Switch to Task. Type 'Test call Ali fri #sal !high ~15m'. Expected chips: 'Friday', your Sales area, 'High', '15m'. Press Enter. Open Tasks: title 'Test call Ali', planned for the next Friday, High, 15 min.",
    "Type 'Fix bug #123' in Task mode. Expected: no area chip; the title keeps '#123'.",
    "Type 'Call Tom' in Task mode. Expected: no date chip — 'Tom' is not read as tomorrow.",
    "Switch to Brain dump. Type 'Call Sara Friday about the deck. I promised Ali the invoice by Monday. Idea: reel about pricing.' Click 'Sort with AI'. Expected: the review tray shows about 3 items (task, commitment, content idea) with a date chip on the first ones.",
    "Untick one item, change another's type, click 'Save N items'. Expected: toast 'N items filed from your brain-dump' with +2 XP per item; the unticked one is not saved.",
    "In Chrome click 'Speak', say a sentence, click 'Stop'. Expected: the text appears in the box.",
    "Open the start-up ritual and press C. Expected: Quick capture does not open on top of the ritual.",
  ],
  tips: [
    "Inbox mode is the default for a reason: capture first, think later.",
    "Brain dump before big planning moments (weekly review, after a trip).",
  ],
};

const commandPalette: GuideSection = {
  id: "command-palette",
  group: "Today",
  title: "Command palette",
  summary: "A search box that opens with Ctrl+K (⌘K on Mac). Type to run an action (start my day, capture, shutdown…), jump to any page, or find any item (tasks, people, deals, notes…).",
  why: "You reach anything in bishOS in two seconds, without the mouse and without remembering where things live.",
  when: { daily: "Whenever you want to go somewhere or start something: Ctrl+K, type 2–3 letters, Enter." },
  pages: [
    {
      route: "Ctrl+K (overlay, any page)",
      title: "Command palette",
      purpose: "One box to run actions, open pages and search your data.",
      elements: [
        { name: "Search box", what: "Placeholder: 'Type a command, page or search…'. An 'Esc' key hint sits on the right.", how: "Type to filter. Esc closes. Ctrl+K again also closes it." },
        {
          name: "Actions",
          what: "13 quick actions: 'Start my day', 'Shutdown', 'Capture to Inbox', 'New task' (Task mode), 'Brain dump', 'Weekly review', 'Plan this week', 'Start focus session', '12-week goals', 'Open pipeline', 'Content Studio', 'Commitments', 'Recall session'. With an empty box the first 6 show.",
        },
        { name: "Go to", what: "Every page in the sidebar. Matches the page name and hidden keywords (for example 'crm' finds Pipeline and People, 'pomodoro' finds Focus)." },
        { name: "Search results", what: "From 2 typed characters, matching items from your data appear in groups (Tasks, Notes, Projects, Goals, People, Deals, Content, Inbox and more)." },
        { name: "Result row", what: "Icon, name and a grey hint (page path, shortcut or item detail). The selected row is highlighted with an Enter icon." },
        { name: "No matches.", what: "Shown when nothing matches." },
      ],
      howTo: [
        "Press Ctrl+K (or click the search button next to 'Capture' in the sidebar).",
        "Type a few letters, for example 'shut'.",
        "Move with ↑ and ↓ (or hover with the mouse) and press Enter (or click).",
      ],
    },
  ],
  frameworks: [
    {
      term: "Command palette",
      definition: "A keyboard-first launcher: one shortcut opens a box where you type what you want instead of clicking through menus.",
      example: "Ctrl+K → 'pipe' → Enter opens the Pipeline.",
      source: "Software pattern (Sublime Text, Superhuman, Linear)",
    },
  ],
  testing: [
    "Press Ctrl+K. Expected: the palette opens with 'Actions' (6 items) and 'Go to' (all pages).",
    "Type 'shut' and press Enter. Expected: the Evening shutdown ritual opens.",
    "Press Ctrl+K, type 'pomodoro'. Expected: 'Focus' appears under 'Go to'.",
    "Type the first word of one of your task titles (2+ letters). Expected: a 'Tasks' group with that task; clicking it opens the Tasks page.",
    "Type 'zzzzqq'. Expected: 'No matches.'",
    "Press Esc. Expected: the palette closes.",
  ],
};

const journal: GuideSection = {
  id: "journal",
  group: "Today",
  title: "Journal",
  summary:
    "Every day becomes a page. The Journal shows a month calendar coloured by day score with ritual marks, monthly stats, and a feed of your progress lines, wins and lessons. Each day page shows that day's reflection (editable), priorities, completed tasks, habits, time blocks, business activity and captures.",
  why: "Patterns show up here first: which days go well, how your energy moves, what you learned. Looking back at progress keeps motivation high, and it gives you material for weekly and monthly reviews.",
  when: {
    daily: "Usually filled by the shutdown. Open today's page if you want to write more (what was hard, free writing).",
    weekly: "Scan the last 7 days during the weekly review.",
    monthly: "Check the month's colours, ritual days and average energy in the monthly review.",
  },
  pages: [
    {
      route: "/journal",
      title: "Journal",
      purpose: "See your days at a glance and read your recent reflections.",
      elements: [
        { name: "Journal (title)", what: "Subtitle: 'Every day is a page: check-in, priorities, progress, lessons. Patterns show up here first.'" },
        { name: "Today's page", what: "Button that opens today's day page." },
        { name: "Month name with ‹ ›", what: "The month shown, with previous and next buttons. You can't go past the current month." },
        { name: "Weekday header", what: "M T W T F S S — weeks start on Monday." },
        {
          name: "Day square",
          what: "One square per day. Green colour = day score (stronger = higher). Days without a saved score get a light colour if a ritual was done. A small sun = start-up done, a small moon = shutdown done. Dashed border = Free day. A ring marks today. Future days are greyed out.",
          how: "Click a past day to open its page. Hover to see the date and score.",
        },
        { name: "ritual days", what: "Number of days this month with a start-up or shutdown." },
        { name: "avg day score", what: "Average saved day score this month ('—' if none)." },
        { name: "avg energy /5", what: "Average check-in energy this month ('—' if none)." },
        { name: "Legend", what: "'Colour = day score. ☀ start-up done · ☾ shutdown done · dashed = free day.'" },
        {
          name: "Day cards (feed)",
          what: "Recent days that have content, newest first (up to 40): the date, the day score chip (green at 80+), the energy chip, a 'Free day' chip, then the progress line (sparkle), win (trophy) and lesson (bulb).",
          how: "Click a card to open that day.",
        },
        { name: "Your journal starts tonight", what: "Empty state: 'Finish today's shutdown — your progress line, win and lesson appear here.'" },
      ],
    },
    {
      route: "/journal/[date]",
      title: "Day page",
      purpose: "Everything about one day, plus a full reflection you can edit.",
      elements: [
        { name: "Date title", what: "The full date, for example 'Tuesday, October 20, 2026'. Subtitle: 'Today's page — fills itself as you live it.' or 'A page from your journal.'" },
        { name: "‹ Journal ›", what: "Previous day, back to Journal, next day. 'Next' is disabled on today." },
        { name: "Day score / Energy / Sleep / Focus", what: "Four stat boxes: saved day score (after the shutdown), check-in energy, sleep hours, and focus time logged that day." },
        { name: "Reflection", what: "Card with the hint 'Autosaves as you type.' Every field saves itself about half a second after you stop typing." },
        { name: "Progress — what moved forward?", what: "The progress line (same as the shutdown's 'Progress today')." },
        { name: "Win of the day", what: "Your best moment of the day." },
        { name: "Lesson learned", what: "What you learned." },
        { name: "Grateful for", what: "One thing you are thankful for." },
        { name: "What was hard?", what: "Only on this page: what was difficult today." },
        { name: "Do differently tomorrow", what: "Only on this page: one change for tomorrow." },
        { name: "Free writing", what: "A big box for anything: 'Anything on your mind…'." },
        { name: "Ready-to-resume note", what: "The resume note (same as the shutdown's note for tomorrow-you)." },
        { name: "Priorities", what: "That day's Top priorities, with a tick for done ones, plus the intention and if–then plan. 'No Top priorities were set' if none." },
        { name: "Start-up / Re-plan and Shutdown buttons", what: "Only on today's page: open the start-up (or 'Re-plan' if done) or the shutdown ritual." },
        { name: "Completed (N)", what: "Tasks finished that day, or 'Nothing ticked off.'" },
        { name: "Habits", what: "Habits logged that day as chips, with 'min', 'stretch' or 'skip' when not a normal done." },
        { name: "Time blocks", what: "That day's calendar blocks with start times (done blocks in normal colour)." },
        { name: "Business", what: "Sales interactions logged that day ('outreach: …', 'call: …') and content published that day." },
        { name: "Captured", what: "Notes created that day (click to open) and inbox captures from that day." },
        { name: "Rituals", what: "'Start-up done' or '—', 'Shutdown done' or '—'." },
      ],
      howTo: [
        "Open Journal and click a day (or 'Today's page').",
        "Write in any reflection field; it saves on its own.",
        "Use ‹ and › to walk through the week.",
      ],
    },
  ],
  frameworks: [
    {
      term: "Journal (daily log)",
      definition: "A short written record of each day: what moved, what you learned, how you felt. Over weeks it shows patterns you can't see day to day.",
      example: "You notice your best day scores come after 7+ hours of sleep.",
      source: "Reflective practice / Bullet Journal",
    },
    {
      term: "Ritual day",
      definition: "A day where you did the start-up or the shutdown (or both). This is what the ritual streak counts.",
      example: "Start-up only on Saturday still counts as a ritual day.",
      source: "bishOS",
    },
    {
      term: "Heatmap",
      definition: "A calendar where colour strength shows a number — here, the day score. Gaps and pale weeks jump out.",
      example: "Three pale squares in a row = the week you were sick.",
      source: "GitHub contribution graph",
    },
  ],
  testing: [
    "After a shutdown with a progress line, open /journal. Expected: today's square is green with sun and moon marks, and a card at the top shows today's progress line and win.",
    "Click ‹ to go to last month and › to return. Expected: › is disabled on the current month.",
    "Click today's square. Expected: the day page opens with your reflection filled in.",
    "Type in 'What was hard?', wait 1 second, reload the page. Expected: the text is still there.",
    "Write more than 3 characters in 'Win of the day' on a day that had no journal yet. Expected: +5 XP is added for that day (check '+N today' on Today when it is today).",
    "Click › on today's page. Expected: it is disabled.",
    "Open /journal/abc. Expected: 'Not a valid day'.",
  ],
  tips: ["Use 'What was hard?' and 'Do differently tomorrow' on bad days. They turn a bad day into a lesson."],
};

const xpGame: GuideSection = {
  id: "xp-levels-streaks",
  group: "Today",
  title: "XP, levels, streaks & achievements",
  summary:
    "bishOS rewards good actions with XP (experience points). XP builds levels with titles. A forgiving ritual streak counts the days you do the start-up or shutdown, with two reserve shields per week. 19 achievements mark milestones.",
  why: "Small, instant rewards make good habits feel good now, not only later. Rewards are positive only (you never lose XP for a bad day), and undoing an action takes its XP back, so the numbers stay honest.",
  when: {
    daily: "You earn XP automatically while you work. Watch '+N today' on Today and the XP pill in each toast.",
    weekly: "Shields refill every Monday. Weekly reviews give the biggest regular reward (+120 XP).",
  },
  pages: [
    {
      route: "/today → Trophy button",
      title: "Achievements window",
      purpose: "See every badge, which ones you unlocked, and how close you are to the rest.",
      elements: [
        { name: "Achievements · x/19", what: "Window title with your unlocked count." },
        { name: "Badge card (unlocked)", what: "Coloured icon, badge name and how you earned it." },
        { name: "Badge card (locked)", what: "Grey lock icon, dashed border, the badge name and what to do." },
        { name: "Progress bar", what: "On locked badges with a goal above 1: a thin bar and 'progress/goal', for example '12/50'." },
        { name: "Close", what: "Closes the window (X, Esc or click outside)." },
      ],
    },
    {
      route: "Any page (automatic)",
      title: "XP toasts, confetti and unlock alerts",
      purpose: "Instant feedback when you do something good.",
      elements: [
        { name: "Toast", what: "A small message at the bottom of the screen (above the phone bar on phones) for about 3 seconds. Green tick = success, yellow = warning, blue = info. Up to 4 show at once." },
        { name: "+N XP pill", what: "The blue pill on the right of a toast showing the XP you just earned." },
        { name: "Confetti", what: "A burst of confetti for big wins: start-up and shutdown done, all Top priorities done, all habits done, Weekly Big 3 complete, inbox zero, an achievement unlocked.", how: "Turn it off in Settings → Celebrations. It also stays off if your device asks for reduced motion." },
        { name: "Achievement unlocked", what: "Toast 'Achievement unlocked: [name]' with confetti the moment a new badge unlocks. The first time you open bishOS on a device, already-unlocked badges are recorded silently." },
      ],
    },
  ],
  frameworks: [
    {
      term: "XP (experience points)",
      definition:
        "Points for good actions. Start-up ritual 25. Shutdown 25. Morning check-in 10. Task done 5. Top priority done +15 extra (20 in total). Weekly Big 3 outcome 30. Habit done or stretch 5, minimum version 3. Routine 10. Inbox item processed 2. Promise kept on time 10. Outreach touch 2. Deal advanced 10. Deal won 100. Content published 40. Recall card 1. Practice session 10. Journal entry 5. Goal tactic 8. Weekly review 120. Monthly review 150. Quarterly review 300. Annual review 500. Each reward can be earned only once per action (no farming), and undoing the action removes it.",
      example: "Start-up 25 + check-in 10 + 3 Top priorities 60 + 3 habits 15 + shutdown 25 = 135 XP in a good day.",
      source: "bishOS (gamification)",
    },
    {
      term: "Level",
      definition:
        "Your level grows with total XP. Level n starts at 50 × (n − 1)² XP: level 2 at 50, level 3 at 200, level 4 at 450, level 5 at 800, level 6 at 1,250, level 7 at 1,800, level 8 at 2,450, level 9 at 3,200, level 10 at 4,050. Each level needs a bit more XP than the last.",
      example: "With 900 XP you are level 5, 100 XP into it, needing 450 XP more for level 6.",
      source: "bishOS",
    },
    {
      term: "Level titles",
      definition:
        "Each title covers two levels: Starter (1–2), Builder (3–4), Operator (5–6), Closer (7–8), Creator (9–10), Strategist (11–12), Founder (13–14), Architect (15–16), Visionary (17–18), Legend (19 and up).",
      example: "Level 7 shows 'Closer'.",
      source: "bishOS",
    },
    {
      term: "Ritual streak",
      definition:
        "The number of days in a row you did the start-up or the shutdown. Free days are neutral (they don't count and don't break it). Today not done yet doesn't break it. Missed days use a reserve shield; when a week's shields are used up, the next miss ends the streak.",
      example: "Mon–Fri rituals, Saturday missed (shield used), Sunday Free day, Monday ritual → streak 6.",
      source: "bishOS (forgiving streaks, inspired by Duolingo's streak freeze)",
    },
    {
      term: "Reserve shields",
      definition:
        "Two per Monday-to-Sunday week. Each one absorbs one missed day so your streak survives. They refill every Monday. Research shows that missing one day doesn't hurt a habit, but a broken streak hurts motivation — shields protect you from that.",
      example: "You were travelling Wednesday: one shield used, 1 left this week.",
      source: "Phillippa Lally (habit research, 2009) + Duolingo",
    },
    {
      term: "Best streak",
      definition: "Your longest ritual streak ever, using the same shield rules. It drives the 'Week Warrior' (7) and 'Unbreakable' (30) badges.",
      example: "Current streak 4, best 22.",
      source: "bishOS",
    },
    {
      term: "Achievements (19 badges)",
      definition:
        "Day One (first start-up), Loop Closer (first shutdown), Week Warrior (7-day ritual streak), Unbreakable (30-day streak), Mind Like Water (process 50 inbox items), Top Performer (finish 25 Top priorities), Promise Keeper (keep 10 promises on time), First Close (win your first deal), Rainmaker (win 10 deals), Dialer (log 100 outreach touches), Publisher (first content published), Content Machine (publish 25 pieces), Deliberate Student (10 practice sessions), Memory Palace (review 500 recall cards), The Reviewer (4 weekly reviews), Quarter Master (a quarterly review), Habit Hero (100 habit check-ins), Strategist (reach level 5), Visionary (reach level 10).",
      example: "After your 50th processed inbox item you see 'Achievement unlocked: Mind Like Water'.",
      source: "bishOS",
    },
    {
      term: "Positive-only rewards",
      definition: "bishOS never takes XP away as a punishment. XP is only removed when you undo the action that earned it (for example un-ticking a task).",
      example: "A bad day earns little XP, but your level never drops.",
      source: "bishOS (behaviour design)",
    },
  ],
  testing: [
    "Note '+N today' on Today's level card. Tick a normal task. Expected: toast 'Done' with +5 XP and '+N today' rises by 5. Un-tick it: it drops by 5.",
    "Tick a habit (+5 XP), then choose 'Minimum' from its menu. Expected: toast 'Minimum counts. Streak safe.' and '+N today' ends 3 XP above where it started — the habit is now worth 3, not 5 (no double reward).",
    "Process one inbox item with D. Expected: +2 XP. Restore it from History and process it again: +2 XP again (not 4 in total).",
    "Do today's start-up. Expected: the streak on the level card counts today, and the Topbar Day button shows the flame number.",
    "Check the shield icons: with no missed days this week both are blue.",
    "Click the trophy. Expected: 'Day One' is unlocked after your first start-up; 'Mind Like Water' shows a progress bar like '3/50'.",
    "Turn off Settings → Celebrations, then finish all Top priorities. Expected: the toast shows but no confetti.",
  ],
  tips: ["Chase the streak with the minimum: on a hard day a 2-minute shutdown keeps it alive.", "XP is a mirror, not the goal. A day with few XP but one big deal moved is still a great day."],
};

// ─────────────────────────────────────────────────────────────────────────
// SYSTEM
// ─────────────────────────────────────────────────────────────────────────

const navigation: GuideSection = {
  id: "navigation",
  group: "System",
  title: "Sidebar & mobile navigation",
  summary:
    "The sidebar on the left lists every page in six groups (Today, Direction, Founder, Mind, Work, System) with Capture and command buttons on top and Profile and Sign out at the bottom. On phones a bottom bar gives one-tap access to Today, Inbox, Capture, Week and the full menu.",
  why: "You always know where you are and reach any module in one click. Badges tell you when the Inbox or Recall needs you, without opening them.",
  when: { daily: "Use it to move between modules. On a phone, the bottom bar is your main navigation." },
  pages: [
    {
      route: "Left side (desktop, every page)",
      title: "Sidebar",
      purpose: "Main navigation for the whole app.",
      elements: [
        { name: "bishOS logo", what: "The sparkle mark and the name 'bishOS'." },
        { name: "Collapse sidebar", what: "Panel icon next to the logo (desktop).", how: "Click to shrink the sidebar to icons only. Click 'Expand sidebar' to open it again." },
        { name: "Capture (C)", what: "Big button that opens Quick capture in Inbox mode. Shows the 'C' shortcut." },
        { name: "Command button (⌘K)", what: "Search icon next to Capture.", how: "Click to open the command palette (same as Ctrl+K)." },
        { name: "Group headers", what: "TODAY, DIRECTION, FOUNDER, MIND, WORK, SYSTEM, each with a small arrow.", how: "Click a header to fold or unfold the group. bishOS remembers this in your browser. A folded group still shows the page you are on." },
        { name: "Today group", what: "Today, Inbox, Week, Calendar, Journal." },
        { name: "Direction group", what: "Compass, Goals · 12 weeks, Habits, Routines, Reviews." },
        { name: "Founder group", what: "Founder HQ, Pipeline, People, Customers, Commitments, Finance, Offers, Campaigns, Content Studio, Inspiration, Scorecard, Decisions & Issues." },
        { name: "Mind group", what: "Notes, Learning, Library, Recall." },
        { name: "Work group", what: "Projects, Tasks, Challenges, Focus, Life Areas, Momentum." },
        { name: "System group", what: "Delegation, Energy & Wellbeing, Analytics, AI, Settings, Guide." },
        { name: "Page link", what: "Icon and name of a page. The current page is highlighted.", how: "Click to open. When collapsed, hover to see the name." },
        { name: "Inbox badge", what: "Number of open inbox items (including snoozed items whose time has come). Shows '99+' above 99." },
        { name: "Recall badge", what: "Number of recall cards due now." },
        { name: "Profile", what: "Link to your Profile page (bottom)." },
        { name: "Sign out", what: "Bottom button.", how: "Click → 'Sign out?' window ('You'll need to sign back in with your email and password…') → 'Sign out' or 'Cancel'." },
      ],
    },
    {
      route: "Bottom of the screen (phones and small tablets)",
      title: "Mobile bottom bar",
      purpose: "Capture-first navigation for your phone. Hidden on large screens.",
      elements: [
        { name: "Today", what: "Opens Today." },
        { name: "Inbox", what: "Opens Inbox, with a count badge." },
        { name: "Capture (big + button)", what: "The round button in the middle. Opens Quick capture." },
        { name: "Week", what: "Opens the Week page." },
        { name: "Menu", what: "Opens the full sidebar as a drawer." },
      ],
    },
    {
      route: "Top of the screen (phones)",
      title: "Mobile top bar and drawer",
      purpose: "Open the full menu on small screens.",
      elements: [
        { name: "Menu button (three lines)", what: "Opens the sidebar as a drawer from the left." },
        { name: "Logo", what: "bishOS mark and name." },
        { name: "Drawer", what: "The full sidebar over a dark backdrop. It closes when you pick a page, tap the backdrop, or tap the X ('Close navigation') at the top right." },
      ],
    },
  ],
  frameworks: [
    {
      term: "Module groups",
      definition:
        "Today = the daily loop. Direction = where you are going (purpose, goals, habits, routines, reviews). Founder = running the company (sales, people, money, content, numbers, decisions). Mind = learning and knowledge. Work = projects, tasks and execution tools. System = support (delegation, wellbeing, analytics, AI, settings, guide).",
      example: "Looking for a deal? Founder → Pipeline. Looking for a book note? Mind → Library.",
      source: "bishOS",
    },
  ],
  testing: [
    "Click 'Collapse sidebar'. Expected: only icons show; hover an icon to see its name. Click 'Expand sidebar' to restore.",
    "Click the FOUNDER header. Expected: the group folds. Reload the page. Expected: it stays folded.",
    "Capture one item with the sidebar 'Capture' button. Expected: the Inbox badge goes up by 1.",
    "Click the search button next to Capture. Expected: the command palette opens.",
    "Click 'Sign out', then 'Cancel'. Expected: you stay signed in.",
    "On a phone (or a narrow browser window): the bottom bar shows Today, Inbox, +, Week, Menu. Tap + → Quick capture opens. Tap Menu → the drawer opens; tap a page → the drawer closes and the page opens.",
  ],
};

const topbar: GuideSection = {
  id: "topbar",
  group: "System",
  title: "Topbar",
  summary:
    "The bar at the top of every page: global search on the left; on the right the Day button (rituals, level, streak), a capture button on phones, the running focus timer, full screen, the notification bell, and your profile menu with the theme switch.",
  why: "Your day's status, the timer and your alerts follow you on every page, so you never have to go back to Today to check them.",
  when: { daily: "Glance at the Day button ring and the bell between tasks. Use the timer pill to pause or stop focus sessions from anywhere." },
  pages: [
    {
      route: "Top of every page",
      title: "Topbar",
      purpose: "Always-visible status and quick controls.",
      elements: [
        { name: "Search box", what: "'Search everything — tasks, people, deals, content…'.", how: "See 'Global search'." },
        {
          name: "Day button",
          what: "A small ring with your day's progress (0, 33, 67 or 100%: start-up done, all Top priorities done, shutdown done), a label ('Start day' before the start-up, 'Shutdown' after 16:00 if not done, otherwise 'My day') and a flame with your streak. It glows when the start-up is missing, or in the evening when the shutdown is missing. Shows a green tick when all three are done. On phones only the ring shows.",
          how: "Click to open the Day popover.",
        },
        { name: "Capture (+)", what: "Only on phones: opens Quick capture (same as C)." },
        { name: "Page action", what: "Some pages put their own main button here (for example an 'Add' button)." },
        {
          name: "Focus timer pill",
          what: "Only while a focus timer runs: a timer icon, the time, the task name (on wide screens), a pause/resume button and a stop button. Green background during a Pomodoro break. It pulses gently while running.",
          how: "Click the time to open Focus. Pause/Resume to pause. Stop ('Stop & log focused time') ends the session and logs the time.",
        },
        { name: "Full screen", what: "Expand icon ('Full screen') / shrink icon ('Exit full screen').", how: "Click to hide the browser's bars for distraction-free work. Click again or press Esc to exit." },
        { name: "Notification bell", what: "Bell with a count badge.", how: "See 'Notifications'." },
        { name: "Profile avatar", what: "Your photo or your first initial in a circle.", how: "Click to open the profile menu." },
      ],
    },
    {
      route: "Topbar → Day button",
      title: "Day popover",
      purpose: "Your day at a glance and one-click access to both rituals.",
      elements: [
        { name: "Level and title", what: "'Level N' and your title." },
        { name: "Streak and shields", what: "Flame with your ritual streak and a shield with shields left this week." },
        { name: "XP bar", what: "Progress in the current level, 'into/span XP', and '+N today'." },
        { name: "Morning start-up", what: "Row with a sun. Sub-line: 'Check-in · Top 3 · capacity · if–then', or 'Done — day locked in' with a green tick.", how: "Click to open the start-up ritual (also works to re-plan)." },
        { name: "Top priorities", what: "'done/total' and a green progress bar." },
        { name: "Evening shutdown", what: "Row with a moon. Sub-line: 'Inbox zero · leftovers · resume note', or 'Shutdown complete'.", how: "Click to open the shutdown ritual." },
        { name: "Open Today", what: "Link to the Today page." },
      ],
    },
    {
      route: "Topbar → avatar",
      title: "Profile menu",
      purpose: "Reach your profile and change the colour theme.",
      elements: [
        { name: "Your name", what: "Shown at the top when set in Profile." },
        { name: "Profile", what: "Opens the Profile page." },
        { name: "Theme: Light / Dark / System", what: "Colour theme. 'System' (default) follows your computer's light/dark setting live. A tick marks the current choice. Saved in this browser.", how: "Click one." },
      ],
    },
  ],
  frameworks: [
    {
      term: "Day progress ring",
      definition: "A three-part check of today: start-up done, all Top priorities done, shutdown done. Each part is one third of the ring.",
      example: "Start-up done and 2 of 3 Top priorities done → 33%.",
      source: "bishOS",
    },
  ],
  testing: [
    "Before the start-up: the Day button says 'Start day', glows, and the ring shows 0. Click it. Expected: the popover with 'Morning start-up' and 'Evening shutdown' rows.",
    "Click 'Morning start-up' in the popover. Expected: the start-up ritual opens.",
    "After the start-up and all Top priorities are done, check the ring. Expected: 67.",
    "Start a Pomodoro from a task's play button. Expected: the timer pill appears in the Topbar on every page. Click pause: the time stops. Click stop: the pill disappears and the time is logged on the task.",
    "Click the full-screen icon. Expected: the browser goes full screen; click again to exit.",
    "Open the avatar menu, choose 'Dark'. Expected: the app turns dark at once and stays dark after reload. Choose 'System' to follow your computer again.",
  ],
};

const globalSearch: GuideSection = {
  id: "global-search",
  group: "System",
  title: "Global search",
  summary: "The search box in the Topbar finds anything you've saved: tasks, notes, projects, goals, habits, Life Areas, sections, people, companies, deals, commitments, content, inspiration, offers, campaigns, learning areas, Library items, decisions and inbox items.",
  why: "You find any item by a word you remember, instead of opening module after module.",
  when: { daily: "Whenever you need something you saved: type 2 or more letters." },
  pages: [
    {
      route: "Topbar (every page)",
      title: "Global search",
      purpose: "Find any saved item from any page.",
      elements: [
        { name: "Search field", what: "Placeholder: 'Search everything — tasks, people, deals, content…'.", how: "Click and type at least 2 characters. Esc clears and closes." },
        { name: "Clear (X)", what: "Appears when you type. Clears the box." },
        { name: "Searching…", what: "Shown while results load." },
        { name: "Result groups", what: "Results grouped by type, up to 6 per group: Tasks, Notes, Projects, Goals, Habits, Life Areas, Sections, People, Companies, Deals, Commitments, Content, Inspiration, Offers, Campaigns, Learning, Library, Decisions, Inbox." },
        { name: "Result row", what: "Type icon, the item's name and a grey detail (for example the Life Area of a task, a goal's progress %, a habit's streak, a deal's stage).", how: "Click to open the item (or its module page)." },
        { name: "No matches", what: "'No matches for \"[your words]\"'." },
      ],
    },
  ],
  frameworks: [],
  testing: [
    "Type one letter in the search box. Expected: no panel yet.",
    "Type the first 3 letters of a person's name. Expected: a 'People' group with that person; click → the person's page opens.",
    "Type a goal word. Expected: the 'Goals' group shows the goal with its progress %.",
    "Type 'zzzqqq'. Expected: 'No matches for \"zzzqqq\"'.",
    "Press Esc. Expected: the box clears and the panel closes.",
  ],
  tips: ["Ctrl+K searches the same data and also runs actions and opens pages."],
};

const notifications: GuideSection = {
  id: "notifications",
  group: "System",
  title: "Notifications",
  summary:
    "The bell in the Topbar lists what needs your attention today: deadlines, goals and sprints ending, habit streaks at risk, upcoming time blocks, the start-up reminder, deals without next steps, promises due, waiting-for check-ins, stale inbox items and recall cards due. Urgent items come first.",
  why: "Nothing slips. You see risks early (a promise due today, a deal with no next step) and can act or dismiss in one click.",
  when: { daily: "Check the bell a few times a day. A red badge means something urgent." },
  pages: [
    {
      route: "Topbar → bell",
      title: "Notification bell",
      purpose: "One list of today's alerts, computed live from your data.",
      elements: [
        { name: "Bell badge", what: "Number of notifications (shows '9+' above 9). Red when at least one is urgent, otherwise blue." },
        { name: "Notifications (N)", what: "Panel title with the count." },
        { name: "Clear all", what: "Dismisses every notification in the list." },
        { name: "Notification row", what: "Type icon (yellow for urgent), title and a detail line, for example 'Overdue by 2d' or 'Next step today: send quote'.", how: "Click to open the related page (Tasks, Goals, Project, Habits, Calendar, Today, Pipeline, Commitments, Inbox or Recall)." },
        { name: "Dismiss (X)", what: "Appears on hover. Hides that notification. Daily nudges (habits, start-up, inbox, recall) can come back on a later day." },
        { name: "You're all caught up", what: "Empty state with a green tick." },
      ],
    },
  ],
  frameworks: [
    {
      term: "Notification types",
      definition:
        "Urgent: task overdue ('Overdue by Nd'), task due today, goal deadline passed, sprint ended, open deal with no next step, deal next step overdue, promise due today or overdue ('Promise overdue — deliver or renegotiate'). Info: task due within 3 days, goal deadline within 7 days, sprint ending within 3 days, habit streak at risk (active habit, streak above 0, nothing logged today: 'the minimum version counts'), time block still ahead today ('At 2 PM'), 'Start your day' (no start-up in the last 16 hours and no check-in today), deal next step today, waiting-for check date reached, inbox items older than 48h, 5 or more recall cards due.",
      example: "Morning: 'Start your day — 5-minute start-up: check-in, Top 3, capacity' and 'Acme website — Open deal with no next step'.",
      source: "bishOS",
    },
    {
      term: "Desktop (push) notifications",
      definition: "Pop-ups from your browser even when bishOS isn't the open tab (the browser must be running). Turn them on in Profile → Desktop notifications.",
      example: "A pop-up when a scheduled task starts.",
      source: "Web Push",
    },
  ],
  testing: [
    "Create a task with a deadline today (task drawer → Due / end). Expected: the bell badge goes up and turns red; the panel shows the task with 'Due today'.",
    "Click the notification. Expected: the Tasks page opens and the panel closes.",
    "Hover a notification and click X. Expected: it disappears and the count drops. Reload: it stays hidden.",
    "Before doing the start-up on a new day, open the bell. Expected: 'Start your day'.",
    "Click 'Clear all'. Expected: 'You're all caught up'.",
  ],
};

const settings: GuideSection = {
  id: "settings",
  group: "System",
  title: "Settings",
  summary:
    "The numbers that shape your days: daily capacity, Free Day, review day and celebrations; your founder targets (outreach, meetings, content, currency, income); caps that stop overload; a work-hours warning; Life Area setup; a full data export; and the keyboard shortcuts.",
  why: "Every default is a sensible start, not a law. Tuning them makes Today's capacity bar, sales ring, caps and warnings fit your real life.",
  when: {
    oneTime: "On day one, check every number. Most fields save when you click out of them; each save shows a 'Saved' toast.",
    monthly: "Revisit in the monthly review if a number keeps feeling wrong (for example you're always over capacity).",
  },
  pages: [
    {
      route: "/settings",
      title: "Settings",
      purpose: "Tune bishOS to your life.",
      elements: [
        { name: "Settings (title)", what: "Subtitle: 'Defaults that shape your days. Every number here is a sensible starting point, not a law — tune it.'" },
        { name: "Daily rhythm", what: "Card for your daily defaults." },
        { name: "Daily capacity (hours)", what: "Hours of planned work a normal day can hold (default 5.5, from 1 to 14, half-hour steps). Hint: '~5.5h of planned work on a 9–5 day leaves room for the unexpected.' Used by Today's capacity bar and the start-up.", how: "Type a number and click outside. An empty or zero value is ignored." },
        { name: "Protected Free Day", what: "Your weekly no-work day (default Sunday). Hint: 'No work, midnight to midnight.'", how: "Pick a weekday." },
        { name: "Weekly review day", what: "The day Today shows 'It's weekly review day' (default Friday).", how: "Pick a weekday." },
        { name: "Celebrations", what: "'On' / 'Off'. Hint: 'Confetti + XP toasts on wins.' Turning it off stops the confetti; toasts still appear.", how: "Click to switch. Turning it on fires a small confetti burst." },
        { name: "Founder engines", what: "Card for your business targets." },
        { name: "Daily outreach quota", what: "Outreach touches per day for Today's sales ring (default 20). Hint: 'Rule of 100 is ~4h/day — pick what fits alongside delivery.'" },
        { name: "Daily meetings goal", what: "Conversations per day (default 2). Hint: ''Open to goal': stop prospecting once you've booked this many.'" },
        { name: "Hub content pieces / week", what: "Weekly content target for Today's Content tile (default 1)." },
        { name: "Currency", what: "Currency code used for money (default USD)." },
        { name: "Annual income (for your Buyback Rate)", what: "Your yearly income. Hint: 'Buyback Rate = income ÷ 2000 ÷ 4.'" },
        { name: "Caps (anti-overload)", what: "Card hint: 'Fewer, bigger bets. The system blocks you from going over.'" },
        { name: "Active 12-week goals", what: "Most goals active at once (default 3, from 1 to 8)." },
        { name: "Active projects", what: "Most active projects at once (default 5, from 1 to 20)." },
        { name: "New habits at once", what: "Most new habits you build at the same time (default 3, from 1 to 6)." },
        { name: "Wellbeing", what: "Card hint: 'Observations only — not a clinical tool.'" },
        { name: "Weekly work-hours warning", what: "Weekly hours above which bishOS warns you (default 55, from 20 to 90). Hint: '55h+ a week is linked to real health risk (WHO/ILO).'" },
        { name: "Life Areas & setup", what: "'Re-run the area setup (standards + weekly hour budgets) or manage areas in detail.'", how: "'Run setup' opens the Life Areas setup window on Today. 'Manage areas' opens the Life Areas page." },
        { name: "Your data", what: "Card hint: 'Full export, any time. No lock-in.'" },
        { name: "Export everything (JSON)", what: "Downloads all your data as a file named bishos-export-YYYY-MM-DD.json. Toast: 'Export downloaded — Your data is yours — always.'" },
        {
          name: "Keyboard",
          what: "Shortcut list: C = Quick capture (anywhere); Ctrl K = Command palette; J / K = Move in Inbox; T = Inbox → task; N = Inbox → note; D = Inbox → done (2-minute rule); X = Inbox → discard; Space = Recall: reveal card; 1–4 = Recall: rate.",
        },
      ],
    },
  ],
  frameworks: [
    {
      term: "Caps (work-in-progress limits)",
      definition: "Hard limits on how many big things you run at once. Fewer open goals and projects means more of them actually finish.",
      example: "With a cap of 5 active projects, starting a 6th forces you to finish or pause one first.",
      source: "The 12 Week Year + Kanban WIP limits",
    },
    {
      term: "Protected Free Day",
      definition: "One full day a week with no work at all. Rest makes the other days sharper. It never breaks your ritual streak.",
      example: "Sunday: no email, no Slack, family time.",
      source: "Dan Sullivan, Strategic Coach",
    },
    {
      term: "Rule of 100",
      definition: "Do 100 primary outreach actions every day (for example 100 messages or 4 hours of calls) until leads come in. bishOS lets you pick a smaller daily quota that fits around delivery.",
      example: "Quota 20: 20 personalised DMs a day while you still run client work.",
      source: "Alex Hormozi, $100M Leads",
    },
    {
      term: "Buyback Rate",
      definition: "What one hour of your time is worth to buy back: annual income ÷ 2000 working hours ÷ 4. Any task you can hand off for less than this rate is worth delegating.",
      example: "$120,000 ÷ 2000 ÷ 4 = $15/hour → hire help for tasks under $15/hour.",
      source: "Dan Martell, Buy Back Your Time",
    },
    {
      term: "Work-hours warning",
      definition: "A gentle alert when your logged work time goes above your weekly limit. Long hours (55+ a week) are linked to higher risk of stroke and heart disease.",
      example: "You logged 58 hours this week; bishOS flags it in Energy & Wellbeing.",
      source: "WHO/ILO study (2021)",
    },
  ],
  testing: [
    "Open /settings. Change 'Daily capacity (hours)' to 4 and click outside. Expected: toast 'Saved'. Open Today: the Today card hint says 'of 4h'.",
    "Clear the capacity field and click outside. Expected: nothing is saved (capacity stays 4).",
    "Set 'Weekly review day' to today's weekday (and don't do the review). Expected: Today shows 'It's weekly review day'.",
    "Set 'Daily outreach quota' to 5. Expected: Today's Sales card shows 'x/5 outreach touches'.",
    "Turn 'Celebrations' Off, tick a Top priority. Expected: a toast but no confetti. Turn it On: a small confetti burst plays.",
    "Click 'Run setup'. Expected: Today opens with the 'Set up your Life Areas' window.",
    "Click 'Export everything (JSON)'. Expected: a file bishos-export-[today].json downloads and a toast confirms.",
  ],
};

const profile: GuideSection = {
  id: "profile",
  group: "System",
  title: "Profile",
  summary: "Tell bishOS who you are: photo, name, city, what you do, your business, your current situation, a free 'About you' text and your preferences for the AI. Also where you turn desktop notifications on or off.",
  why: "Your first name appears in greetings, and the AI chat reads your profile to address you by name and tailor every answer to your life and business.",
  when: {
    oneTime: "Fill it in on day one (5 minutes) and turn on desktop notifications.",
    quarterly: "Update 'Current situation' and 'About you' when your focus changes.",
  },
  pages: [
    {
      route: "/profile",
      title: "Profile",
      purpose: "Your identity and AI context, plus desktop notifications.",
      elements: [
        { name: "Profile (title)", what: "'Tell bishOS who you are. Your AI chat reads this to address you by name and tailor every answer to your life and business.'" },
        { name: "Avatar", what: "Your photo, or your first initial." },
        { name: "Change photo (camera)", what: "Small camera button on the avatar.", how: "Click and choose an image. A spinner shows while it uploads. The new photo also shows in the Topbar." },
        { name: "Name and role summary", what: "Your name (or 'Your name') and 'what you do · city' (or 'Add your role and city below')." },
        { name: "Name", what: "Placeholder 'e.g. Bish'. The first word is used in greetings on Today and in the start-up." },
        { name: "City", what: "Placeholder 'e.g. Dubai'." },
        { name: "What you do", what: "Placeholder 'e.g. UI/UX designer & founder'." },
        { name: "Business", what: "Placeholder 'e.g. Devzelo Solutions'." },
        { name: "Current situation", what: "Placeholder 'e.g. Scaling my agency while learning to code'." },
        { name: "About you", what: "Hint: 'Write freely — multiple paragraphs. Background, goals, what drives you, context the AI should always know.'" },
        { name: "Preferences & needs", what: "Hint: 'How should the AI help you? Tone, what to focus on, what to avoid.' Example: 'Be direct and practical. Push me on deadlines…'" },
        { name: "Save profile", what: "Saves all fields. Shows 'Saving…' then 'Saved' with a tick. Note: 'Your AI chat updates instantly with this.'", how: "Click after editing. Fields are not saved until you click." },
        {
          name: "Desktop notifications",
          what: "A switch with a bell icon. Status text: 'Get a popup when a task starts or ends — even when bishOS is closed (browser running).', 'On — this browser (+N other).', 'Blocked in your browser settings — re-enable there to use.' or 'Not supported in this browser.'",
          how: "Click the switch and allow notifications when the browser asks. Click again to turn off. If blocked, change it in your browser's site settings.",
        },
      ],
    },
  ],
  frameworks: [
    {
      term: "AI context",
      definition: "The background information the AI reads before answering. The richer and more current your profile, the more personal and useful the answers.",
      example: "With 'Agency, 3 clients, goal $10k MRR' in About you, 'What should I focus on today?' gets sales-first advice.",
      source: "bishOS",
    },
  ],
  testing: [
    "Type your name, click 'Save profile'. Expected: the button shows 'Saved'. Open Today: the greeting includes your first name.",
    "Upload a photo. Expected: it shows on the Profile card and in the Topbar avatar.",
    "Write 'Be very short' in Preferences, save, then ask the AI chat a question. Expected: a short answer.",
    "Turn on Desktop notifications and allow the browser prompt. Expected: the switch turns on and the text says 'On — this browser.'",
    "Edit a field and leave the page without saving. Expected: the change is not kept.",
  ],
};

const aiChat: GuideSection = {
  id: "ai-chat",
  group: "System",
  title: "AI chat",
  summary:
    "A full chat with an AI that knows your Life Areas, tasks, projects, goals, recent notes, habits, focus sessions, check-ins and Profile. Keep many conversations, choose a free model per conversation, attach documents, attach a project/note/area as context with '/', and save good answers into Notes.",
  why: "You get advice based on your real data, not generic tips: what to focus on, how your week went, links between your notes, analysis of a document.",
  when: {
    daily: "Ask 'What should I focus on today?' when you feel scattered.",
    weekly: "Ask 'Summarize my week' before the weekly review.",
  },
  pages: [
    {
      route: "/chat",
      title: "AI chat",
      purpose: "Talk to an AI that knows your life and business.",
      elements: [
        { name: "New chat", what: "Starts a fresh conversation." },
        { name: "Conversation list", what: "Your past chats, newest first. The open one is highlighted. A new chat is named after your first message. 'No conversations yet.' when empty.", how: "Click a chat to open it." },
        { name: "Rename (pencil)", what: "Appears on hover.", how: "Click, type a new name, press Enter (Esc cancels)." },
        { name: "Delete (bin)", what: "Appears on hover. Deletes that conversation." },
        { name: "History button (phones)", what: "Panel icon at the top left on phones. Opens the conversation list as a drawer." },
        { name: "AI Chat (header)", what: "Page title." },
        {
          name: "Model switch",
          what: "Four free models: 'Nemotron' (NVIDIA Nemotron 3 Ultra 550B — deep reasoning, slower), 'gpt-oss' (OpenAI gpt-oss 120B — fast), 'Owl' (Owl Alpha — 1M context, generalist), 'Hunyuan' (Tencent Hunyuan HY3 — generalist, the default). Each shows a 'FREE' tag.",
          how: "Click one. The choice is saved for this conversation. Hover to read its description.",
        },
        { name: "~N tokens", what: "Rough size of this conversation that the AI keeps in mind (large screens only). Very long chats can make answers slower or less sharp — start a new chat then." },
        {
          name: "Empty state",
          what: "'Ask me anything about your life. I know your tasks, projects, goals, focus, habits, notes and check-ins.' with four quick prompts: 'What's going on in my life right now?', 'What should I focus on today?', 'Summarize my week', 'Find connections across my notes'.",
          how: "Click a prompt to send it.",
        },
        { name: "Your message", what: "Your messages on the right, with any attached files below (click a file to download it)." },
        { name: "AI answer", what: "The AI's reply on the left, formatted (lists, bold, headings). It streams in word by word with a blinking cursor; three dots show while it is thinking." },
        { name: "Copy", what: "Under an answer: copies it. The icon turns into a tick for a moment." },
        { name: "Save to notes", what: "Under an answer: opens the 'Save to notes' window." },
        { name: "Regenerate", what: "Under the last answer only: asks the AI to answer again." },
        { name: "Attach file (+)", what: "Upload a document for the AI to read: PDF, Word (.docx), PowerPoint (.pptx), Excel (.xlsx, .xls), .csv, .txt, .md, .json, .yaml, .yml, .log.", how: "Click +, pick a file. 'Reading file…' shows, then a chip with the file name and its size in tokens ('couldn't read' if no text was found). Click x on the chip to remove it before sending." },
        { name: "Context chip", what: "The project, note or Life Area you attached with '/'. Click x to remove it." },
        {
          name: "Attach context ('/')",
          what: "Typing '/' at the start of the message opens a list of your projects, notes and Life Areas.",
          how: "Type '/' and a few letters, then click an item (or press Enter for the first one). The AI will read that item in detail with your next message.",
        },
        { name: "Message box", what: "Placeholder: 'Ask anything…  ( / to attach context · + to upload a file )'. Grows as you type.", how: "Enter sends. Shift+Enter makes a new line." },
        { name: "Send", what: "Sends your message." },
        { name: "Stop", what: "Red square that replaces Send while the AI is answering.", how: "Click to stop the answer early." },
      ],
      howTo: [
        "Open AI from the sidebar (System → AI).",
        "Pick a model (Hunyuan is fine for most questions).",
        "Ask your question. Add '/' context or a file if it is about something specific.",
        "Save useful answers with 'Save to notes'.",
      ],
    },
    {
      route: "/chat → Save to notes",
      title: "Save to notes window",
      purpose: "Keep a good AI answer in your Notes.",
      elements: [
        { name: "New note / Existing note", what: "Switch between creating a new note and adding to an existing one." },
        { name: "Preview", what: "The first 400 characters of the answer you are saving." },
        { name: "Note title…", what: "Title of the new note (default 'From AI chat' if empty)." },
        { name: "Life area", what: "'No life area' or one of your areas." },
        { name: "Section", what: "'No section' or a section of the chosen area (disabled until you pick an area)." },
        { name: "Choose a note…", what: "In 'Existing note' mode: the note to add the answer to." },
        { name: "Create note / Append to note", what: "Saves and closes the window. Shows 'Saving…' while working." },
      ],
    },
  ],
  frameworks: [
    {
      term: "Context window (tokens)",
      definition: "AI models read text in small pieces called tokens (about 4 characters each). Everything in a conversation — your messages, answers and files — uses tokens. Too many tokens slows the model down or makes it forget early details.",
      example: "A 20-page PDF is about 10,000 tokens.",
      source: "Large language models",
    },
    {
      term: "Attached context",
      definition: "A specific project, note or Life Area you hand to the AI with '/', so it reads that item in full instead of only the general summary.",
      example: "'/Website launch' then 'What's the biggest risk in this project?'",
      source: "bishOS",
    },
  ],
  testing: [
    "Open /chat and click 'What should I focus on today?'. Expected: a new conversation named after the prompt appears in the list, and an answer streams in that mentions your real tasks or goals.",
    "While it answers, click Stop. Expected: the answer stops.",
    "Switch the model to 'gpt-oss' and ask a short question. Reload. Expected: this conversation still shows 'gpt-oss' selected.",
    "Type '/' plus the first letters of a project name. Expected: the 'Attach context' list shows it. Press Enter. Expected: a context chip appears.",
    "Click + and upload a small .txt file. Expected: a chip with the file name and '· N tok'. Ask 'Summarize this file'. Expected: the answer is about the file; the file shows under your message.",
    "Click 'Save to notes' under an answer, type a title, click 'Create note'. Expected: the note appears in Notes with the answer as its content.",
    "Hover a conversation, click the pencil, rename it, press Enter. Expected: the new name shows. Click the bin. Expected: it is deleted.",
  ],
  tips: ["Keep your Profile current — the AI reads it on every message.", "Start a new chat for each new topic; long chats get slower."],
};

const moduleDock: GuideSection = {
  id: "ai-module-dock",
  group: "System",
  title: "AI module assistant (floating ✦ button)",
  summary:
    "A small AI assistant that floats at the bottom right of the Goals, Tasks, Notes, Projects, Habits and Focus pages. You ask it in plain words to create or change things in that module. It proposes each change as a card, and nothing is saved until you click Confirm.",
  why: "You can say 'Add a high-priority task to finish the landing page by Friday' instead of filling forms, and still stay in control of every change.",
  when: { daily: "Whenever typing a request is faster than clicking through a form, on one of the six module pages." },
  pages: [
    {
      route: "/goals, /tasks, /notes, /projects, /habits, /focus",
      title: "Module assistant",
      purpose: "Create and change items in the current module by chatting.",
      elements: [
        { name: "Floating ✦ button", what: "Round sparkle button at the bottom right (above the phone bar on phones). Hover shows '[module] assistant'.", how: "Click to open the assistant panel." },
        { name: "[Module] assistant (header)", what: "For example 'Tasks assistant'. Each module keeps its own conversation." },
        { name: "Clear conversation (bin)", what: "Appears once there are messages. Clears this module's conversation." },
        { name: "Close (X)", what: "Closes the panel. The conversation is kept." },
        { name: "Model switch", what: "'gpt-oss', 'Owl', 'Nemotron', 'Hunyuan' (default). All are free and can take actions.", how: "Click one to use it for this module's chat." },
        {
          name: "Intro and example prompts",
          what: "'Ask me to create or change [module]. I'll show a confirm button before saving anything.' plus three example prompts for the module (for example on Tasks: 'Add a high-priority task to finish the landing page by Friday', 'Mark my design review task done', 'What should I tackle first today?').",
          how: "Click a prompt to send it.",
        },
        { name: "Messages", what: "Your messages (right) and the assistant's replies (left)." },
        {
          name: "Action card",
          what: "A proposed change, for example 'Create task: Finish landing page'. Pending cards have 'Confirm' and 'Cancel'. After you act, the card shows the result (green 'Done' or the result text), 'Failed' in red, or 'Cancelled'.",
          how: "Read the card. Click Confirm to save the change, or Cancel to skip it.",
        },
        { name: "thinking…", what: "Shown while the assistant works." },
        { name: "Message box", what: "Placeholder: 'Message the [module] assistant…'. Note under it: '↵ to send · actions need your confirm'.", how: "Enter sends, Shift+Enter makes a new line." },
        { name: "Send", what: "Sends the message (spinner while sending)." },
      ],
      howTo: [
        "Open one of the six module pages and click the ✦ button.",
        "Type a request in plain words.",
        "Check each action card and click Confirm (or Cancel).",
      ],
    },
  ],
  frameworks: [
    {
      term: "Agentic action with confirm",
      definition:
        "The AI can do things, not only talk — but it only proposes. You approve each change. What each assistant can do: Goals — create a goal (with SMART fields), add milestones, update a goal. Tasks — create, complete, update a task. Notes — create a note, append to a note, update a note. Projects — create a project or sprint, update it, add milestones. Habits — create a habit, check a habit for today. Focus — log focus time.",
      example: "On Habits: 'Create a daily habit to journal for 10 minutes' → card 'Create habit…' → Confirm.",
      source: "bishOS (human-in-the-loop AI)",
    },
  ],
  testing: [
    "Open /tasks. Expected: the ✦ button at the bottom right. Open /today. Expected: no ✦ button there.",
    "On /tasks click ✦, then the prompt 'Add a high-priority task to finish the landing page by Friday'. Expected: a reply with an action card and Confirm / Cancel.",
    "Click Cancel. Expected: the card shows 'Cancelled' and no task is created.",
    "Ask again and click Confirm. Expected: the card turns green with a result, and the task appears in your task list.",
    "Close the panel and reopen it. Expected: the conversation is still there. Click the bin. Expected: it clears.",
  ],
};

const guidePage: GuideSection = {
  id: "guide-page",
  group: "System",
  title: "Guide page",
  summary:
    "The Guide (System → Guide) is this whole manual inside the app: your rhythm (one-time setup, daily, weekly, monthly, 12-week, yearly, first week, a 30-minute test), every module with every page and element explained, all frameworks and terms, and how to test each feature. It is searchable and can be downloaded as a PDF.",
  why: "Whenever you don't understand a button, a step or a word (for example a Playbook step), search it here and get a plain-English explanation with an example.",
  when: { oneTime: "Read 'Your rhythm' and 'How bishOS works' once at the start.", weekly: "Search any term you're unsure about.", monthly: "Re-read the rhythm when your routine slips." },
  pages: [
    {
      route: "/guide",
      title: "Guide — how bishOS works",
      purpose: "The complete, searchable manual — the same content as the PDF.",
      howTo: [
        "Type any word in the search box (e.g. 'LEGO bricks', 'execution score', 'runway'). Matching explanations show; everything else hides.",
        "Use the rhythm tabs to see what to do once, daily, weekly, monthly, every 12 weeks and yearly.",
        "Click a module in the left index to jump to it. Open a page row to see every element on that page.",
        "Click 'Download PDF' to save the manual.",
      ],
      elements: [
        { name: "Download PDF", what: "Downloads the full manual as a PDF (bishOS-Guide.pdf).", how: "Click it; open the file or print it." },
        { name: "Search box", what: "Searches every element, term, step and test in the manual. Shows how many explanations match.", how: "Type at least one word; clear with the ✕." },
        { name: "Counters", what: "How many modules, pages, elements and terms the manual covers." },
        { name: "Your rhythm — tabs", what: "Setup, Daily, Weekly, Monthly, 12 weeks, Yearly, First week and 30-min test. Each tab lists steps with minutes, where to do them (a link) and what to do.", how: "Click a tab; click a link to open that page." },
        { name: "Index (left)", what: "All groups and modules in order, plus 'Glossary A–Z'.", how: "Click to jump." },
        { name: "Module card", what: "Group, title, summary, 'Why it helps' and when to use it (one-time / daily / weekly / monthly / every 12 weeks)." },
        { name: "Page rows", what: "Each page of the module with its route and number of elements. Open it to see its purpose, 'How to use it' steps and 'Every element' list (what each one is and how to use it).", how: "Click the row to open or close it." },
        { name: "Frameworks & terms", what: "Every method and term used in the module, with a simple definition, an example and its source.", how: "Click to open." },
        { name: "How to test it", what: "Click-by-click steps with the expected result.", how: "Click to open; follow the steps in the app." },
        { name: "Glossary A–Z", what: "Every term from every module in one alphabetical list, each linking back to its module." },
      ],
    },
  ],
  frameworks: [],
  testing: [
    "Open /guide. Expected: the rhythm tabs, the left index and module cards appear quickly.",
    "Type 'runway' in the search box. Expected: only matching explanations show, with a count.",
    "Open the Weekly tab. Expected: the weekly steps with links.",
    "Click 'Download PDF'. Expected: bishOS-Guide.pdf downloads.",
  ],
};

const onboarding: GuideSection = {
  id: "onboarding",
  group: "System",
  title: "Setup & onboarding",
  summary:
    "Your first steps: a banner on Today shows a 9-step setup checklist; its first step, a setup window, creates your Life Areas (the spine). After you save them, a 'What next?' list guides you through the other 8 steps over a few days — purpose, 12-week cycle, Ideal Week, routines, habits, scorecard, content pillars and a learning area.",
  why: "A Life OS only works when its foundation exists. Doing setup in small steps (5–15 minutes each) gets you running on day one without a weekend of configuration.",
  when: {
    oneTime: "Day one: set up Life Areas. Next days: one or two checklist steps per day until 9/9.",
    quarterly: "Re-run the area setup from Settings when your life changes (new business, new focus).",
  },
  pages: [
    {
      route: "/today (banner)",
      title: "Set up your Life OS banner",
      purpose:
        "Shows your setup progress on Today while you have no Life Areas or haven't saved the setup window yet. It disappears once you click 'Save my areas'; after that, Settings → 'Run setup' → 'Save my areas' shows the remaining steps again.",
      elements: [
        { name: "Progress ring", what: "Steps done out of 9, for example '3/9'." },
        { name: "Set up your Life OS", what: "Title with 'Nine small steps. Each one makes the daily check-in smarter.'" },
        { name: "Start setup / Continue setup", what: "Opens the Life Areas setup window." },
        {
          name: "Step chips",
          what: "One chip per step, green with a tick when done: 'Set up your Life Areas', 'Write your purpose & vision', 'Start a 12-week cycle (≤3 goals)', 'Design your Ideal Week', 'Turn on start-up & shutdown routines', 'Add 1–3 keystone habits', 'Pick your weekly founder numbers', 'Define content pillars', 'Create a learning area'.",
          how: "Click a chip to open that step's page (Compass, Goals, Week, Routines, Habits, Scorecard, Content, Learning). The first chip opens the setup window.",
        },
      ],
    },
    {
      route: "/today?setup=1",
      title: "Set up your Life Areas window",
      purpose: "Create or update your Life Areas, each with a standard and a weekly hour budget.",
      elements: [
        { name: "Intro", what: "'Areas are the spine of the system. Every goal, project, habit and hour hangs off one. Each gets a standard (what maintained looks like) and a weekly hour budget.'" },
        {
          name: "Preset area cards",
          what: "Four ready areas: Company Operations (business, 20 h/week), Company Sales & Marketing (business, 12 h), Personal Learning & Content (personal, 6 h), Fitness (personal, 4 h). Each has a suggested standard. If an area with the same name already exists, its standard and hours are filled in.",
        },
        { name: "Include checkbox", what: "Untick an area to skip it (the card fades)." },
        { name: "Area icon", what: "Coloured icon of the area." },
        { name: "Area name", what: "Editable name." },
        { name: "business / personal chip", what: "The kind of area." },
        { name: "Standard", what: "Text box: what 'maintained' looks like for this area." },
        { name: "Hours / week", what: "Weekly hour budget (0–80)." },
        { name: "Area hint", what: "What belongs in the area, for example 'Pipeline, offers, campaigns, outreach'." },
        { name: "Add another area", what: "Adds an empty personal area card (2 h/week) for your own area." },
        { name: "Other existing areas note", what: "'Your other existing areas stay as they are: … You can archive or edit them in Life Areas.'" },
        { name: "Later", what: "Closes the window without saving." },
        { name: "Save my areas", what: "Creates new areas and updates matching ones (by name), marks you as onboarded, and shows 'Your Life OS spine is ready' with confetti." },
        { name: "You're set. What next?", what: "Second screen: 'Do these in order over the next few days. Each one takes 5–15 minutes.' The other 8 steps, numbered, with a tick when done.", how: "Click a step to go to its page (the window closes)." },
      ],
    },
  ],
  frameworks: [
    {
      term: "Area standard",
      definition: "A short description of what 'maintained' looks like for a Life Area. It is your bar: if the standard is met, the area is healthy, even without a goal.",
      example: "Company Operations: 'Every client delivered on time with no surprises; admin, finance and invoices current every Friday.'",
      source: "Tiago Forte, PARA (areas have standards)",
    },
    {
      term: "Weekly hour budget",
      definition: "How many hours per week you intend to give each Life Area. The Week page compares real hours by area against this budget.",
      example: "Sales 12 h a week; you logged 5 → you are under-investing in sales.",
      source: "bishOS (time budgeting)",
    },
    {
      term: "Setup steps and when they count as done",
      definition:
        "Life Areas: at least one area has a standard or hours. Purpose & vision: written on Compass. 12-week cycle: one cycle exists. Ideal Week: a template is saved. Routines: at least one routine. Habits: at least one habit. Founder numbers: at least one scorecard metric. Content pillars: at least one pillar. Learning area: at least one.",
      example: "Add one habit on the Habits page → the 'Add 1–3 keystone habits' chip turns green.",
      source: "bishOS",
    },
    {
      term: "Keystone habit",
      definition: "A habit that pulls other good habits with it. Start with one to three, not ten.",
      example: "Daily exercise often leads to better sleep, food and focus.",
      source: "Charles Duhigg, The Power of Habit",
    },
  ],
  testing: [
    "With no Life Areas, open Today. Expected: the 'Set up your Life OS' banner with 'Start setup'.",
    "Click 'Start setup'. Expected: the 'Set up your Life Areas' window with 4 preset cards.",
    "Untick Fitness, change the Sales hours to 10, click 'Save my areas'. Expected: confetti, 'Your Life OS spine is ready', and the 'You're set. What next?' list.",
    "Open Life Areas. Expected: three areas exist (no Fitness), Sales has 10 hours.",
    "Back on Today. Expected: the 'Set up your Life OS' banner is gone (you are now onboarded).",
    "Add one habit on the Habits page. Then open Settings → 'Run setup' → 'Save my areas'. Expected: in 'You're set. What next?' the step 'Set up your Life Areas' is not listed and 'Add 1–3 keystone habits' shows a green tick.",
    "Open /today?setup=1 directly (or Settings → Run setup). Expected: the setup window opens with your saved standards and hours; clicking 'Later' closes it and the address returns to /today.",
    "Try quick add on Today with no areas at all. Expected: the setup window opens instead of creating a task.",
  ],
  tips: ["Write standards you can check on a Friday in 10 seconds.", "Don't do all 9 steps in one sitting. One a day is perfect."],
};

export const sections: GuideSection[] = [
  howItWorks,
  today,
  startup,
  shutdown,
  inbox,
  quickCapture,
  commandPalette,
  journal,
  xpGame,
  navigation,
  topbar,
  globalSearch,
  notifications,
  settings,
  profile,
  aiChat,
  moduleDock,
  guidePage,
  onboarding,
];
