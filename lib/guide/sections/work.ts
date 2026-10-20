import type { GuideSection } from "../types";

/**
 * Work group — Tasks, Projects, Focus, Life Areas, Wins, Challenges, Calendar —
 * plus Analytics (System group). Pure data (no runtime imports). Text matches
 * the real UI labels, numbers and rules in the code.
 */
export const sections: GuideSection[] = [
  // ───────────────────────────────────────────────────────────────────────
  // TASKS
  // ───────────────────────────────────────────────────────────────────────
  {
    id: "tasks",
    group: "Work",
    title: "Tasks",
    summary:
      "Your list of next actions. Every task has a “when” day (the day you plan to work on it) that is separate from its deadline. Six GTD lists — Today, Upcoming, Anytime, Someday, Overdue, Done — sit next to four layouts: Board, Calendar, Split and Table.",
    why:
      "Your head is for having ideas, not for holding them. When every next action lives here with a life area, an estimate and an energy level, you can plan a realistic day in two minutes. The “when” day stops a deadline from pretending to be a plan. The stale prompt stops the same task from rolling forward forever. Tasks feed Today, Focus, Projects, Life Areas, Wins and Analytics.",
    when: {
      daily:
        "Morning: open the Today list, check the planned time, star your Top 3 and decide on everything in “From earlier days”. During the day: tick tasks done and start a timer with the ▶ button. Capture new tasks with the C key or New task.",
      weekly:
        "Weekly review: open Upcoming and give every task in “Deadlines ahead — no “when” yet” a real day. Scan Anytime and Someday. Clear Overdue. Click Decide now on the stale banner.",
      monthly: "Open Someday. Delete old ideas or plan the ones that matter now. Open Done and enjoy the proof of progress.",
      oneTime:
        "Create your life areas first — every task lives in one. Optional: choose your day shape on Today (Top 3, Ivy Lee or 1-3-5). It decides how many tasks fit in “Top 3” (3, 6 or 9).",
    },
    pages: [
      {
        route: "/tasks",
        title: "Tasks",
        purpose:
          "See, filter, plan and finish all your next actions. Pick a GTD list for planning, or a layout (board, calendar, split, table) for a different view of the same tasks.",
        elements: [
          {
            name: "Tasks (page header)",
            what: "Page title with the line “Next actions with a “when” day — separate from the deadline. Plan today, park the rest; nothing rolls over silently.”",
          },
          {
            name: "Today (button)",
            what: "Outline button with a sun at the top right. It opens the Today page, your daily cockpit.",
            how: "Click it when you want to pick your Top 3 or run the start-up ritual.",
          },
          {
            name: "New task (button)",
            what: "Opens the New task window (see the next page of this guide).",
            how: "Click it. You can also press C anywhere in the app for quick capture.",
          },
          {
            name: "List switcher (Today · Upcoming · Anytime · Someday · Overdue · Done)",
            what: "The six GTD lists, each with a small count. Today = open Top 3 + planned for today + deadline today + from earlier days. Upcoming = open tasks with a “when” day after today. Anytime = open tasks with no “when” day that are not Someday (your backlog). Someday = parked ideas. Overdue = open tasks whose deadline has passed. Done has no count.",
            how: "Click a list. The app remembers your last view in this browser. A link like /tasks?view=upcoming opens a list directly.",
          },
          {
            name: "Layout switcher (Board · Calendar · Split · Table)",
            what: "Four classic layouts over the same filtered tasks.",
            how: "Click one. Switching view clears any rows you had selected.",
          },
          {
            name: "All life areas (filter)",
            what: "Shows only the tasks of one life area. Archived areas are not in the list.",
            how: "Pick an area. The “Tasks →” link on an area hub opens this page already filtered (?area=…).",
          },
          {
            name: "Any goal (filter)",
            what: "Options: Any goal, No goal (maintenance), then your active goals. 12-week goals start with “12w ·”, annual goals with “Year ·”. Dropped and achieved goals are hidden.",
            how: "Pick “No goal (maintenance)” to see the work that keeps your areas healthy but does not move a goal.",
          },
          {
            name: "Any project (filter)",
            what: "Options: Any project, No project, then your open projects.",
            how: "Pick a project to see only its tasks.",
          },
          {
            name: "Any energy (filter)",
            what: "Options: Any energy, Deep (high), Medium, Light (low), Not set. This works like a GTD context.",
            how: "Tired after calls? Pick Light (low) and do the easy admin tasks. Fresh in the morning? Pick Deep (high).",
          },
          {
            name: "Clear filters",
            what: "Ghost button with ×. It appears only when at least one filter is on.",
            how: "Click it to reset all four filters at once.",
          },
          {
            name: "Stale banner",
            what: "Amber bar: “N tasks have been moved 3+ times. Worth keeping?” It shows in the six lists (not in Done and not in the layouts). It counts open tasks whose “when” day was pushed to a later day 3 or more times.",
            how: "Click Decide now. A window opens where you keep, schedule or drop each one.",
          },
          {
            name: "Today summary line",
            what: "Only in the Today list, e.g. “2h 30m planned today (tasks without an estimate count as 30m) · 1/3 of your Top 3 done · open Today”. The time adds the estimates of your open Top 3 and your planned-for-today tasks.",
            how: "If the planned time is bigger than your real free time, move some tasks to Tomorrow. Click “open Today” to go to the cockpit.",
          },
          {
            name: "Bulk bar",
            what: "A sticky bar that appears when you tick one or more rows: “N selected”, Today, Tomorrow, Someday, Backlog, Add to Top 3 and ×.",
            how: "Tick rows (or a group's select-all box), then click an action. Today / Tomorrow set the “when” day. Someday parks the tasks. Backlog clears the day and moves them to Anytime. Add to Top 3 adds as many as fit; if the Top 3 is full you get a warning. × clears the selection.",
          },
          {
            name: "Today list",
            what: "Five groups: Top 3 (“Your most important outcomes today. Star tasks to add them.”), Planned for today, Deadline today (“Not planned yet — do it today or plan it for later.”), From earlier days (“Nothing rolls over silently — decide: today, tomorrow or someday.”) and Done today (closed by default).",
            how: "In “From earlier days” click All today to plan every late task for today in one click. Remember: each move to a later day counts toward the stale limit.",
          },
          {
            name: "Upcoming list",
            what: "One group per future day, e.g. “Tomorrow · Wed, Oct 21 · 1h 30m” (the time is the sum of estimates). At the end: “Deadlines ahead — no “when” yet” with the hint “A deadline is not a plan. Pick the day you will work on each.”",
            how: "Use it in the weekly review to spread work across the week and to give deadline tasks a real day.",
          },
          {
            name: "Anytime list",
            what: "Your backlog: open tasks with no “when” day, grouped by life area in your area order. The area name is a link to its hub.",
            how: "Pick tasks from here when you plan a day.",
          },
          {
            name: "Someday list",
            what: "Parked ideas, grouped by life area. They stay out of Today until you plan them.",
            how: "Review it monthly. Plan what matters, delete what does not.",
          },
          {
            name: "Overdue list",
            what: "One group, “Deadlines that passed”, with the hint “No guilt — reschedule, renegotiate the date, or drop what no longer matters.” Oldest deadline first.",
            how: "For each task: change the deadline in the task panel, tell the person, or delete it.",
          },
          {
            name: "Done list",
            what: "Finished tasks grouped by the day you finished them (Today, Yesterday, 3 days ago…), newest first. It shows 60 tasks at a time.",
            how: "Click Show more (N left) at the bottom for the next 60.",
          },
          {
            name: "Group header",
            what: "Every group card has a select-all checkbox, a collapse arrow, the title, a count and sometimes an action button (like All today). The hint line shows only while the group is open.",
            how: "Click the arrow to fold a group away. Tick the box to select every task in it.",
          },
          {
            name: "Task row",
            what: "Select checkbox · done circle · title · chips · quick buttons · ▶ timer.",
            how: "Click the circle to finish a task (+5 XP). Finishing a Top 3 task here gives a Top 3 reward; finishing all of them gives a celebration. Click the title or the chips to open the task panel.",
          },
          {
            name: "Quick buttons (sun · arrow · star)",
            what: "Desktop only, visible when you hover a row. Sun = “Do it today” (hidden if the task is already planned today). Arrow = “Tomorrow”. Star = add to / remove from today's Top 3 (filled when it is in).",
            how: "Hover a row and click. On a phone, use the checkbox and the bulk bar instead.",
          },
          {
            name: "▶ Timer button",
            what: "A small play button on every open task. It opens “Start timer” with Pomodoro and Stopwatch. While this task's timer runs, the button shows the live time, and the menu also offers Stop & log and Open Focus.",
            how: "Pick Pomodoro or Stopwatch. The timer then runs at the top of every page. A High-energy task is logged as Deep work; a Low-energy task as Shallow work.",
          },
          {
            name: "Task chips",
            what: "Small labels under the title: Top 3 (filled star) · When (blue “Today”, “Tomorrow”, a weekday or a date; amber “From yesterday” or “From 3 days ago” when the day passed; “Someday” with a moon) · Deadline (amber “Was due Oct 3”, “Due today”, “Due tomorrow”; grey “Due Fri” or “Due Oct 30”) · Estimate (clock, e.g. 45m) · Energy (Deep / Medium / Light) · Goal · Project · Deal · Person · Delegate · “Moved 3×” (amber stale flag). Deadlines are never red — amber at most.",
            how: "Goal, Project, Deal, Person and Delegate chips are links: click to jump to the goal, project, deal (Pipeline), person (People) or the Delegation page.",
          },
          {
            name: "Board layout",
            what: "Three columns — Not started, In progress, Done — each with a count. Cards are sorted high priority first, then by the nearest deadline.",
            how: "Drag a card to another column to change its status (moving to Done gives XP). Drag inside a column to fine-tune the order within the same priority. An empty column says “Drop tasks here”.",
          },
          {
            name: "Board card",
            what: "The left border shows priority (amber = high, blue = medium, grey = low). The card shows the title, the chips, the priority word, the area (when there is no project), focus hours spent on the task (e.g. 1.2h), the number of files, up to 4 #tags, the ▶ timer and a trash icon on hover.",
            how: "Click the card to open the task. The trash deletes the task at once — there is no undo.",
          },
          {
            name: "Calendar layout",
            what: "A week view of tasks placed by their start time, or by their deadline if there is no start. Toolbar: ‹ ›, Today, the date range and Day / 3-Day / Week / Month. An “all-day” row holds tasks with a date but no start time. The hour grid opens at 7 AM. A timed task spans from its start to its deadline (or 30 minutes). Weeks start on Sunday here.",
            how: "Drag a task to another day. With a start time, the time stays the same and the deadline moves by the same amount. Without one, the deadline moves to 12:00 that day. Click a task to open it. Note: the “when” day does not put a task on this calendar — only start and deadline do.",
          },
          {
            name: "Month view",
            what: "A month grid inside the Calendar layout. Each day shows up to 3 tasks and “+N more”. Today has a coloured border; days of other months are faded.",
            how: "Drag tasks between days the same way as in the week view.",
          },
          {
            name: "Split layout",
            what: "Board (small cards) and Calendar side by side on wide screens, one above the other on small screens.",
            how: "Use it to see status and dates together.",
          },
          {
            name: "Table layout",
            what: "A table with the columns Done, Title (a paperclip if it has files), When (a star if it is in Top 3), Life area, Goal, Section, Priority, Deadline and Tags.",
            how: "Tick Done to finish a task. Click a title to open it. Scroll sideways on a phone.",
          },
          {
            name: "Table filters (All · Remaining · Completed · date · Clear date · count)",
            what: "Only in Table. All / Remaining / Completed narrows by status. The date box shows the tasks whose start-to-deadline span touches that day. “N tasks” on the right counts what you see.",
            how: "Pick a status, pick a date, click Clear date to remove the date.",
          },
          {
            name: "Empty states",
            what: "When a list is empty you see a friendly message, e.g. Today: “Nothing planned for today”, Anytime: “Backlog is clear”, Overdue: “No passed deadlines — Every deadline is still ahead of you. Nice.” With filters on: “No tasks match these filters — Clear a filter to see more.” Most empty lists also show a New task button.",
          },
          {
            name: "Loading skeleton",
            what: "Grey blocks that show for a moment while your tasks load.",
          },
        ],
        howTo: [
          "Open Tasks → Today. Read the summary line: is the planned time realistic?",
          "Decide on every task in “From earlier days”: All today, or use the row buttons for Tomorrow, or tick them and click Someday.",
          "Star up to 3 tasks (the star appears when you hover a row). They become your Top 3.",
          "Click ▶ on your first Top 3 task and pick Pomodoro. Work until the timer rings.",
          "Tick the circle when a task is finished.",
          "Once a week open Upcoming, then Anytime and Someday, and finish with Overdue. Answer the stale banner.",
        ],
      },
      {
        route: "/tasks (New task window)",
        title: "New task window",
        purpose: "Capture one next action with everything the planner needs: when, area, project, goal, estimate, energy, priority and (optional) deadline and start time.",
        elements: [
          {
            name: "What's the next action?",
            what: "The title box. Write a visible, physical step: “Email Sara the kickoff agenda”, not “Sara project”.",
            how: "Type the title. The Add task button stays disabled until there is a title and an area.",
          },
          {
            name: "When will you work on it?",
            what: "Chips Today, Tomorrow, Someday, Anytime, plus a date picker for any other day. The default follows your current list: Today list → Today, Upcoming → Tomorrow, Someday → Someday, else Anytime.",
            how: "Click a chip or pick a date. Anytime means “no day yet” (backlog).",
          },
          {
            name: "Project",
            what: "“No project — area task” or one of your open projects.",
            how: "Pick a project and the area is taken from the project automatically.",
          },
          {
            name: "Life area",
            what: "A list “Life area…” of your active areas. When you picked a project it turns into a grey box “Area <name>” that you cannot change. The default is the area filter, else your first area.",
            how: "Pick the area this task belongs to.",
          },
          {
            name: "Goal",
            what: "“No goal (maintenance)” (or “Project's goal” when the project has one), then your active goals with “12w ·” and “Year ·” prefixes.",
            how: "Leave it empty for maintenance work. If the project serves a goal and you leave this empty, the task gets the project's goal.",
          },
          {
            name: "Estimate",
            what: "5 min, 15 min, 30 min, 45 min, 1 h, 1.5 h, 2 h, 3 h or 4 h.",
            how: "Pick your honest guess. It powers the planned-time line and the day groups in Upcoming.",
          },
          {
            name: "Energy",
            what: "Deep, Medium or Light.",
            how: "Deep = needs a fresh brain (build, write, sell). Light = admin you can do when tired.",
          },
          {
            name: "Priority",
            what: "Low, Medium (default) or High.",
            how: "High tasks sort to the top of every list and board column.",
          },
          {
            name: "Add deadline & time block (link)",
            what: "Shows or hides the deadline and start fields. The link text changes to “Hide deadline & time block”.",
            how: "Click it only when the task has a real deadline or needs a fixed time slot.",
          },
          {
            name: "Deadline (real consequence)",
            what: "A date and a time. With no time, it uses 23:59.",
            how: "Set it only when missing the date has a real cost (a client, a bank, a launch).",
          },
          {
            name: "Start (shows on Calendar between start and deadline)",
            what: "A date and a time. With no time, it uses 09:00. A task with a start appears on the Calendar page and the Tasks calendar.",
            how: "Use it to block time for this task.",
          },
          {
            name: "Add task (button)",
            what: "Creates the task (status Not started, newest first) and shows “Task added”.",
          },
          {
            name: "Create a Life Area first",
            what: "A note shown when you have no areas, with a link to Life Areas.",
          },
        ],
      },
      {
        route: "/tasks/[id]",
        title: "Task panel (side peek, center peek, full page)",
        purpose:
          "Everything about one task in one place: plan it, link it, describe it, attach files, track time, duplicate or delete it. It opens from any task list in the app.",
        elements: [
          {
            name: "View switcher (Side peek · Center peek · Open as full page)",
            what: "Three icons at the top left. Side peek = panel on the right (default). Center peek = a large window in the middle. Full page = /tasks/<id> as its own page.",
            how: "Click an icon. Full page remembers where you came from.",
          },
          {
            name: "× (close) and the dark backdrop",
            what: "Closes the panel. Clicking the darkened page behind it also closes it.",
          },
          {
            name: "← Back (full page only)",
            what: "Returns to exactly the page and tab you opened the task from. The side-peek icon next to it does the same.",
          },
          {
            name: "Title",
            what: "The task title as a big text field.",
            how: "Click and type. It saves when you click away.",
          },
          {
            name: "▶ Timer",
            what: "The same Pomodoro / Stopwatch menu as in the lists.",
          },
          {
            name: "Win",
            what: "The Log a win button (trophy). It logs this task on the Wins page with an impact and a why. A number shows how often you logged it.",
          },
          {
            name: "Top 3 / In Top 3",
            what: "A star button, hidden when the task is done. Filled “In Top 3” means it is in today's Top 3. If your Top 3 is full you get “Top 3 is full — swap one on Today.”",
            how: "Click to add or remove. Adding also plans the task for today.",
          },
          {
            name: "Status",
            what: "Not started · In progress · Done.",
            how: "Click one. Done gives +5 XP and records the finish time.",
          },
          {
            name: "Priority",
            what: "Low · Medium · High (High is amber).",
          },
          {
            name: "Life area",
            what: "The area of this task.",
            how: "Changing the area clears the section, because sections belong to one area.",
          },
          {
            name: "Section",
            what: "“None” or one of the sections (sub-areas) of this task's area.",
          },
          {
            name: "When (plan to work on it)",
            what: "Inside the grey planning box: Today, Tomorrow, Someday, Backlog and a date picker. Backlog = no day (Anytime list).",
            how: "Click a chip. Moving to a later day than before counts as one move toward the stale limit.",
          },
          {
            name: "Estimate",
            what: "— (none) or 5 min to 4 h.",
          },
          {
            name: "Energy needed",
            what: "— , High (deep work), Medium, Low (admin).",
          },
          {
            name: "Moves goal",
            what: "“— none (maintenance)” or one of your active goals.",
            how: "Link a goal only if finishing this task really moves it.",
          },
          {
            name: "Should not be me — record it next time (Delegation)",
            what: "A checkbox. When ticked, the task shows a blue Delegate chip that links to the Delegation page.",
            how: "Tick it for work someone else should do. Next time, record a short how-to so you can hand it off.",
          },
          {
            name: "Stale warning",
            what: "Amber line “Moved N× — keep, schedule for real, or drop it?” when the task was moved 3 or more times.",
          },
          {
            name: "Linked",
            what: "Shows only if the task is linked to a project, deal, person, content piece or learning area. Each chip opens the linked page.",
          },
          {
            name: "Start",
            what: "A date and a time (09:00 if you give no time). Clearing the date removes the start.",
          },
          {
            name: "Due / end",
            what: "The deadline: a date and a time (23:59 if you give no time).",
          },
          {
            name: "Tags",
            what: "Tag chips with × and an “Add tag…” box.",
            how: "Type a tag and press Enter. Click × to remove one.",
          },
          {
            name: "Description",
            what: "A rich text area. Edit / Preview toggle on the right. In Edit mode it says “Write, or press / for commands…”.",
            how: "Type / for commands: Text, Heading 1, Heading 2, Bullet list, Numbered list, To-do, Divider, Upload PDF / doc / image. It saves half a second after you stop typing and again when you close. Preview shows bold, italic, code and [[links]].",
          },
          {
            name: "Attachments",
            what: "Your files (click to open in a new tab, × to remove) and an “Add to task” button.",
            how: "Click Add to task → Upload PDF / doc / image, or Add description block (/).",
          },
          {
            name: "Time tracked",
            what: "Total time on this task, e.g. “1h 20m · 3 sessions”, a Focus on this button, a manual log row and the list of sessions.",
            how: "Focus on this opens the Focus page with this task already chosen. To log time you forgot: type minutes (default 25) and click Log time — it counts for the task, its area and its project. Hover a session and click × to delete it.",
          },
          {
            name: "Duplicate task",
            what: "Opens the Duplicate task window: “Move to date” and a Duplicate task button. It copies the title, priority, area, section, project, tags, description, files, estimate, energy, goal, deal, person and learning area. The copy starts as Not started.",
            how: "Pick the day it should land on. Start and deadline move to that day and keep their times and the gap between them. A task without dates gets a deadline at 23:59 on that day. The “when” day is not copied.",
          },
          {
            name: "Delete task",
            what: "Deletes the task at once (no confirmation) and closes the panel.",
          },
          {
            name: "Task not found",
            what: "Shown when the task was deleted or the link is wrong.",
          },
        ],
      },
    ],
    frameworks: [
      {
        term: "Next action (GTD)",
        definition: "The very next physical, visible step that moves something forward. If you can picture yourself doing it, it is a next action.",
        example: "Not “Acme website”. Yes: “Email Sara at Acme the kickoff agenda.”",
        source: "Getting Things Done (David Allen)",
      },
      {
        term: "Contexts (GTD)",
        definition: "Tags that tell you where or how you can do a task, so you only see what you can do right now. In bishOS your contexts are the Energy level (Deep / Medium / Light) and the life area; filter by them.",
        example: "After three sales calls your brain is tired: filter Energy → Light (low) and clear five admin tasks.",
        source: "Getting Things Done (David Allen)",
      },
      {
        term: "Someday / maybe",
        definition: "A parking place for ideas you might do later. They are out of your daily lists, so they do not distract you, but they are not lost.",
        example: "“Start a podcast” goes to Someday. In the monthly review you decide if now is the time.",
        source: "Getting Things Done (David Allen)",
      },
      {
        term: "“When” vs deadline",
        definition: "The “when” day is the day you plan to work on a task. The deadline is the day it must be finished. They are different: a deadline is not a plan. Only real consequences deserve a deadline.",
        example: "Proposal due Friday (deadline). You plan to write it on Wednesday (when). Upcoming shows it on Wednesday; the Friday deadline chip turns amber the day before.",
        source: "GTD “hard landscape” (David Allen); the When/Deadline split in Things 3",
      },
      {
        term: "Backlog (Anytime)",
        definition: "Open tasks without a “when” day. They are ready to do any time, but not planned yet.",
        example: "“Update LinkedIn banner” waits in Anytime until a light afternoon.",
      },
      {
        term: "Top 3 and day shape",
        definition: "The few most important outcomes for today. Your day shape on Today sets the size: Top 3 (3 tasks), Ivy Lee (6) or 1-3-5 (9). Adding a task to Top 3 also plans it for today.",
        example: "Top 3 for Tuesday: send the Acme proposal, record one short video, follow up 10 leads.",
        source: "Most Important Tasks (Leo Babauta); Ivy Lee method; the 1-3-5 rule",
      },
      {
        term: "Stale task",
        definition: "An open task whose “when” day was moved to a later day 3 or more times. Moving from no day to a day, or to Someday, does not count. Stale tasks get an amber “Moved N×” chip and appear in the stale window.",
        example: "“Write blog post” was planned Monday, then Tuesday, then Thursday, then Friday: it is now stale.",
        source: "Bullet Journal migration (Ryder Carroll)",
      },
      {
        term: "Migration (Bullet Journal)",
        definition: "Instead of copying an old task forward without thinking, you decide again: is it worth doing? In bishOS the stale window gives four choices. Do today = plan it for today. Keep = stay where it is. Someday = park it. Drop = delete it (and its XP). Each choice resets the move counter.",
        example: "“Redesign invoice template” moved 4×. You click Drop — one less thing.",
        source: "The Bullet Journal Method (Ryder Carroll)",
      },
      {
        term: "Estimate and planned time",
        definition: "Your guess of how long a task takes. The Today list adds the estimates of your open Top 3 and planned tasks; tasks without an estimate count as 30 minutes. Compare it with your real free time.",
        example: "Planned 7h 30m but you have 3 calls: move two tasks to Tomorrow.",
        source: "Daily planning with time estimates (Sunsama-style capacity check)",
      },
      {
        term: "Energy level (Deep / Medium / Light)",
        definition: "How much mental energy a task needs. Match the task to your energy: deep tasks when you are fresh, light tasks when you are tired. High energy tasks are logged as deep work in Focus; low energy tasks as shallow work.",
        example: "Coding a feature = Deep. Booking a flight = Light.",
        source: "Deep Work (Cal Newport); The Power of Full Engagement (Loehr & Schwartz)",
      },
      {
        term: "Maintenance task vs goal task",
        definition: "Most tasks keep an area healthy (maintenance). A goal task moves a goal. Link a goal only when finishing the task really moves it.",
        example: "“Send monthly invoices” = maintenance. “Launch the referral offer” = moves the goal “10 new clients this cycle”.",
      },
      {
        term: "Delegate flag",
        definition: "A mark that says “this should not be me”. It reminds you to record how you do it, so you can hand it off and buy back your time.",
        example: "“Format the weekly report” gets the Delegate chip. Next time you record a 3-minute screen video for an assistant.",
        source: "Buy Back Your Time (Dan Martell)",
      },
      {
        term: "Priority and sort order",
        definition: "Every list and board column sorts by priority (High, Medium, Low), then by the nearest deadline, then by your manual order.",
        example: "A High task with no deadline sits above a Medium task due tomorrow.",
      },
      {
        term: "Overdue without guilt",
        definition: "A passed deadline is information, not a failure. Reschedule it, renegotiate the date with the person, or drop it if it no longer matters.",
        example: "The client moved the launch. You change the deadline to next month.",
      },
      {
        term: "Task XP",
        definition: "Finishing a task gives 5 XP. Finishing a Top 3 task from the Today list or the Tasks lists gives 15 extra XP. Un-ticking takes the XP back.",
        source: "bishOS XP system",
      },
      {
        term: "Weekly review (for tasks)",
        definition: "Once a week you clear your lists: empty “From earlier days”, give deadline tasks a day, check Someday and Overdue, and answer the stale prompt.",
        source: "Getting Things Done (David Allen)",
      },
    ],
    testing: [
      "Open Tasks from the sidebar (Work → Tasks). Expected: the list switcher, the layout switcher, four filters and the Today list.",
      "Click New task. Type “Test task”, click Today, pick an area, Estimate 30 min, Energy Light, click Add task. Expected: toast “Task added”; the task appears in Planned for today with chips Today, 30m and Light.",
      "Hover the row and click the star. Expected: toast “Added to today's Top 3”; the task moves to the Top 3 group with a filled Top 3 chip.",
      "Tick the done circle of the Top 3 task. Expected: a Top 3 reward toast; the task moves to Done today (closed group) and the Today count drops by one.",
      "Create another task with When = Tomorrow. Click Upcoming. Expected: a group “Tomorrow · <date> · 30m” with the task.",
      "Open a task that already has a “when” day (e.g. Today). In the When date box pick a later day, then a day after that, then one even later (three moves to a later day). Expected: the amber “Moved 3×” chip and the stale banner “1 task has been moved 3+ times”. Click Decide now → Keep. Expected: toast “Decided”, the banner disappears.",
      "Tick two tasks. Expected: the bulk bar “2 selected”. Click Someday. Expected: toast “2 tasks → Someday”; they appear in the Someday list grouped by area.",
      "Set the Energy filter to Deep (high). Expected: only Deep tasks remain; Clear filters appears and resets the view.",
      "Click Board. Drag a card from Not started to Done. Expected: the card moves, the counts change and you earn XP.",
      "Click Calendar. Create a task with a Start time today at 10:00. Expected: it sits at 10 AM; drag it to tomorrow — it keeps 10:00.",
      "Click Table → Completed. Expected: only finished tasks. Pick a date. Expected: only tasks whose start–deadline span touches that day; “N tasks” updates.",
      "Open a task → Duplicate task → pick a date next week → Duplicate task. Expected: a new copy with the same details, status Not started, dates moved to that day.",
      "In the task panel, type minutes 15 and click Log time. Expected: Time tracked increases by 15m and the session appears in the list and on the Focus page.",
      "Click the full-page icon, then ← Back. Expected: you return to the same Tasks list you came from.",
    ],
    tips: [
      "Write titles as verbs: “Call”, “Email”, “Draft”, “Ship”.",
      "Give only real deadlines. Use the “when” day for planning.",
      "If Today shows more than 6 hours planned, it is a wish list, not a plan.",
      "Press C anywhere to capture a thought in two seconds; plan it later.",
      "The Delete task button and the board trash have no undo. Use Someday if you are unsure.",
    ],
  },

  // ───────────────────────────────────────────────────────────────────────
  // PROJECTS
  // ───────────────────────────────────────────────────────────────────────
  {
    id: "projects",
    group: "Work",
    title: "Projects",
    summary:
      "Outcomes that need more than one step, on a Personal Kanban (Active · Planning · Blocked · Done). Each project lives in one life area, serves at most one goal, links to a client deal or company, and should always have a next action. Sprints are time-boxed projects with a countdown, milestones, documents, an AI plan and a Command Center.",
    why:
      "A project without a next action is a wish. bishOS shows the next action on every card and warns you when an active project has none. The WIP cap stops you from starting too much at once, so things actually finish. Focus hours per project show where your time really goes.",
    when: {
      daily: "Glance at the cards of your active projects. Do the next action of the most important one first (Focus button on the project page).",
      weekly:
        "Weekly review: fix every “No next action — add one” warning. Drag finished projects to Done and stuck ones to Blocked. Keep Active under your cap.",
      monthly: "Look at the Done column (your shipped wins). Check that each active project still serves a goal or a real need.",
      quarterly: "When you plan a new 12-week cycle, link each project to at most one of the new goals, or mark it maintenance.",
      oneTime:
        "Set your WIP cap in Settings → Caps (anti-overload) → Active projects (default 5). Create one project per real outcome and give each a next action.",
    },
    pages: [
      {
        route: "/projects",
        title: "Projects",
        purpose: "See all projects by status, keep the active count under your cap, and make sure every active project has a next action.",
        elements: [
          {
            name: "Projects (page header)",
            what: "Title with “Multi-step outcomes. Each lives in one Life Area, serves at most one goal, and always has a next action.”",
          },
          {
            name: "New project (button)",
            what: "Opens “Create new…”, where you choose Project or Sprint.",
          },
          {
            name: "All · Projects · Sprints",
            what: "A switch that shows all, only standard projects, or only sprints.",
          },
          {
            name: "All life areas (filter)",
            what: "Shows only the projects of one area.",
          },
          {
            name: "Active counter (“3 / 5 active”)",
            what: "How many projects are Active, against your cap. It turns amber when you are over.",
          },
          {
            name: "WIP cap warning",
            what: "Amber bar when Active is over the cap: “N active projects — your cap is X. Finish or move one to Planning before starting another; parallel work is slow work.”",
            how: "Drag one active project back to Planning, or finish one.",
          },
          {
            name: "No next action card",
            what: "“N active projects have no next action” with the line “A project without a next action is a wish. Add the very next physical step.” It counts Active and Blocked projects without an open task. One button per project.",
            how: "Click a project button. The Add the next action window opens.",
          },
          {
            name: "Kanban board",
            what: "Four columns with a hint each. “Active · 3/5” — “Doing now — capped so finishing beats starting.” Planning — “Shaping the outcome and first steps.” Blocked — “Waiting on someone or something.” Done — “Shipped. Archive of wins.”",
            how: "Drag a card to another column to change its status. Moving to Done shows “Project shipped: …” with a celebration. Moving to Active when you are already at the cap shows a warning toast. On a phone, change the status on the project page.",
          },
          {
            name: "Add project (Planning column)",
            what: "A link at the bottom of Planning that opens the New project form directly.",
          },
          {
            name: "Show all N / Show recent only (Done column)",
            what: "The Done column shows the last 8 projects. This link shows all of them, or only the recent ones again.",
          },
          {
            name: "Project card",
            what: "Title · Sprint chip with days left (sprints) · area (with its colour dot, link to the area hub) · goal chip (“12w ·” for 12-week goals, link) · deal chip or company chip (links) · progress bar · “2/7 tasks · 40%” · focus time this week (“1h 30m this week”) · the next action line or a warning · “Shipped” for done projects.",
            how: "Click the card to open the project. The area, goal, deal and company chips open their own pages.",
          },
          {
            name: "Next action line on a card",
            what: "“Next: Email Sara the agenda · today”. If there is none: an amber button “No next action — add one” (Active or Blocked) or a quiet “+ Add next action” (Planning).",
            how: "Click the button to add a next action without leaving the board.",
          },
          {
            name: "Drag hint",
            what: "Small text under the board: “Drag a card between columns to change its status.”",
          },
          {
            name: "Add the next action (window)",
            what: "“For <project> — the very next physical, visible step.”, a title box (“e.g. Email Sara the kickoff agenda”), When: Today / Tomorrow / Anytime, and Add next action.",
            how: "Type the step, pick when, click Add next action. It creates a Medium-priority task in the project's area, linked to the project and its goal.",
          },
          {
            name: "Create new… (window)",
            what: "Two choices. Project — “An outcome in one Life Area — tasks, notes, an optional goal.” Sprint — “Time-boxed push (15–90 days) with countdown, docs & AI plan.”",
          },
          {
            name: "New project / New sprint (form)",
            what: "Name (“Project outcome (e.g. Acme website delivered)” or “Sprint name (e.g. Sales Mastery — 30 days)”), Outcome (sprints only: “what does success look like by the end?”), Life area (one), Serves goal (optional) — goals of the chosen area first, then “Other areas” — and for sprints Duration (15 / 30 / 60 / 90 days or a custom number) and Start date. Button Create project or Launch sprint. Tip: “Next: add a next action so it shows up in your plan.”",
            how: "Fill it in and click the button. A new project starts in Planning; a new sprint starts Active. The project page opens.",
          },
          {
            name: "Empty state",
            what: "“No projects yet — A project is any outcome that takes more than one step — a client delivery, a launch, a sprint. Give it an area, a goal and a next action.” with a New project button.",
          },
        ],
        howTo: [
          "Click New project → Project. Name it as an outcome (“Acme website delivered”).",
          "Pick the life area and, only if it moves a goal, the goal. Click Create project.",
          "On the project page, click + Add in the Next action card and write the very next step.",
          "Back on the board, drag the card from Planning to Active when you start.",
          "Every week: fix all “No next action” warnings and keep Active under the cap.",
        ],
      },
      {
        route: "/projects/[id]",
        title: "Project page",
        purpose: "Run one project: its direction (area, status, goal), the next action, focus time, the client link, tasks, and goals or milestones.",
        elements: [
          {
            name: "Breadcrumb (Projects › name)",
            what: "Click Projects to go back to the board.",
          },
          {
            name: "SPRINT chip and area link",
            what: "Above the title. SPRINT appears for sprints. The area name with ↗ opens the area hub.",
          },
          {
            name: "Title",
            what: "The project name as a big text field.",
            how: "Click, type, click away to save.",
          },
          {
            name: "Log win",
            what: "Logs this project on the Wins page (impact 1–5 and why).",
          },
          {
            name: "Trash (delete project)",
            what: "Deletes the project at once, with no confirmation. Its tasks, goals and habits are kept but lose the link.",
          },
          {
            name: "Direction card",
            what: "Hint “One Life Area, at most one goal.” Life area list, Status list (Planning / Active / Blocked / Done) and Serves goal list (“None — maintenance project”, then 12-week goals, Annual goals and Other goals). Below: the goal card with its progress bar (“12-week goal · 40%”), or the line “Most projects are maintenance — that's fine. Link one only if finishing it moves a goal.” with “See goals”.",
            how: "Change any list; you see “Saved”. Choosing Done shows “Project shipped: …”.",
          },
          {
            name: "Next action card",
            what: "Hint “N open tasks” and a + Add button. It shows the chosen next action: a circle, the title, chips (In progress, the “when” day or “No “when” yet”, the estimate), a Focus button and a Do today button. Footer: This week (focus time, and “Xh deep”) and All time with an Open Focus link.",
            how: "Click the circle when it is done (“Next action done — what's next?”). Focus starts the timer on it. Do today plans it for today (hidden if already today). With no open task you see an amber “Active but no next action — add the very next step” or “Add the first next action”.",
          },
          {
            name: "Client card",
            what: "Hint “For delivery projects — link the won deal or customer.” Deal list (open and won deals, “· won” or “· stage”) and Company list (customers first, “· customer”). Buttons Open deal and the company name; or a See customers link.",
            how: "Pick the deal. If the project has no company yet, the deal's company is filled in for you.",
          },
          {
            name: "Sprint hero (sprints only)",
            what: "Big “days left” number, “30-day sprint”, start → end dates, a Time elapsed bar (%) and a Milestone progress bar (%), and an Outcome box (“What does success look like by the end?”).",
            how: "Edit the outcome and click away to save.",
          },
          {
            name: "Sprint Command Center (sprints only)",
            what: "Areas, stat tiles, the 90-day plan matrix and the Track table. See the next page of this guide.",
          },
          {
            name: "Progress slider (standard projects)",
            what: "A slider from 0 to 100% that you set by hand. This is the % on the project card.",
            how: "Drag it when you finish a big chunk.",
          },
          {
            name: "Tasks (N) — synced to Tasks module",
            what: "An “Add a task…” box with Add, and the list of this project's tasks: a circle, the title, the “when” chip (amber when late) or a Someday chip. “No tasks yet.” when empty.",
            how: "Type and press Add (Medium priority, project's area, no day). Click the circle to finish, the title to open the task panel.",
          },
          {
            name: "Milestones (sprints)",
            what: "“Milestones (2/5)”: checkboxes with text, × on hover, and “Add milestone…”. Milestones drive the sprint progress %.",
            how: "Add the big checkpoints. Tick them as you hit them.",
          },
          {
            name: "Goals filed under this project (standard projects)",
            what: "Goals whose project link points to this project, each with its %. “Nothing linked.” when empty.",
          },
          {
            name: "Documents & notes (sprints)",
            what: "An Upload button and your files and linked notes. PDFs are read on upload and get an “AI-readable” badge. Hint: “Upload course PDFs/docs, or link notes to this sprint.”",
            how: "Upload the course or reference material you want the AI to plan from.",
          },
          {
            name: "AI learning plan (sprints)",
            what: "Button Analyze & plan (Regenerate after the first time; “Analyzing…” while it works). The AI reads the outcome, the AI-readable PDFs and the linked notes and writes a week-by-week plan with daily to-dos and 3–5 milestones.",
            how: "Set the outcome, upload material, click Analyze & plan. Copy the useful steps into tasks or milestones.",
          },
          {
            name: "Notes (standard projects)",
            what: "Notes linked to this project, each opening the note. “Nothing linked.” when empty.",
          },
        ],
      },
      {
        route: "/projects/[id] (sprint)",
        title: "Sprint Command Center",
        purpose: "Run a sprint that spans several life areas: link areas, goals, habits and tasks, plan a 90-day arc, and track everything in one table.",
        elements: [
          {
            name: "Areas row",
            what: "Chips for each linked area (links to the hub), a + Link area button and a Link goals / habits / tasks button.",
            how: "Click + Link area to open “Link life areas”: tick areas and click Save areas. The project's own area is marked “primary” and cannot be removed.",
          },
          {
            name: "Stat tiles",
            what: "Days left (“x% elapsed”) · Milestones (% sprint progress) · Goals (average % of linked goals, “N linked”) · Habits (average 30-day adherence of linked habits) · Focus (hours this sprint) · Tasks (done / total).",
            how: "Focus counts sessions in the sprint dates that are on this project, its tasks, or any linked area.",
          },
          {
            name: "Plan — the 90-day arc",
            what: "A table with one row per linked area and the columns Now / this week, Day 30, Day 60, Day 90. A small dot before each area shows its status.",
            how: "Click a cell, type the milestone for that phase, click away to save. Click the dot to cycle: empty → todo → doing (amber) → done.",
          },
          {
            name: "Track — everything linked",
            what: "Filters All / Goal / Habit / Task / Milestone and an area list. Columns Item, Type, Area, Progress, Due, Status (click a header to sort; click again to reverse). Habits show a flame streak and 30-day %. An × on hover unlinks an item. Empty: “Nothing linked yet. Use “Link goals / habits / tasks” to populate your sprint.”",
            how: "Watch the Status chips: On track (blue), At risk (amber), Behind (red), Done (green), Todo (grey).",
          },
          {
            name: "Link to this sprint (window)",
            what: "Tabs Goals / Habits / Tasks, a “New goal, linked…” box with +, a search box and the list of unlinked items with Link buttons.",
            how: "Create a new item (it goes into the first linked area) or search and click Link on an existing one.",
          },
        ],
      },
    ],
    frameworks: [
      {
        term: "Project (GTD / PARA)",
        definition: "Any outcome that needs more than one step and has an end. It lives in one life area.",
        example: "“Acme website delivered”, “Referral offer launched”, “Hire first designer”.",
        source: "Getting Things Done (David Allen); PARA method (Tiago Forte)",
      },
      {
        term: "Next-action rule",
        definition: "Every active or blocked project must always have at least one open task — the very next step. bishOS picks it like this: a task In progress first, then the earliest “when” day (tasks with no day after), non-Someday before Someday, then priority, then the newest.",
        example: "Project “Acme website”: next action “Send Sara the wireframes” (planned today).",
        source: "Getting Things Done (David Allen)",
      },
      {
        term: "Personal Kanban",
        definition: "Visualize your work on a board with columns for each stage, and limit how much is in progress.",
        example: "Active, Planning, Blocked, Done — you see at a glance what is moving and what is stuck.",
        source: "Personal Kanban (Jim Benson & Tonianne DeMaria Barry)",
      },
      {
        term: "WIP limit (work in progress)",
        definition: "A cap on how many projects can be Active at once (default 5, set in Settings). Fewer parallel projects finish faster. bishOS warns you when you go over.",
        example: "You have 6 active projects with a cap of 5: move “Podcast idea” back to Planning.",
        source: "Personal Kanban; Lean / Kanban",
      },
      {
        term: "Project status",
        definition: "Planning = shaping the outcome and first steps. Active = doing now. Blocked = waiting on someone or something. Done = shipped.",
      },
      {
        term: "Maintenance project vs goal project",
        definition: "Most projects keep an area running (maintenance). A goal project moves one goal. A project serves at most one goal.",
        example: "“Monthly bookkeeping cleanup” = maintenance. “Launch online course” = serves the goal “€10k new revenue this cycle”.",
      },
      {
        term: "Client delivery project",
        definition: "A project you do for a paying client, linked to the won deal and the company, so sales and delivery stay connected.",
        example: "Deal “Acme website · won” → project “Acme website delivered” → company “Acme”.",
      },
      {
        term: "Sprint",
        definition: "A time-boxed project (15–90 days) with a start, an end, a countdown, milestones, documents and an AI plan. It starts Active.",
        example: "“Sales Mastery — 30 days”: read two books, practise 20 calls, close 2 deals.",
        source: "Scrum sprints; 30/60/90-day plans",
      },
      {
        term: "Milestone",
        definition: "A big checkpoint inside a sprint. Sprint progress = done milestones ÷ all milestones.",
        example: "4 of 5 milestones done = 80%.",
      },
      {
        term: "90-day arc (30-60-90 plan)",
        definition: "Write what each area should reach now, at day 30, day 60 and day 90. It turns a long push into clear phases.",
        example: "Sales: Now — list 100 leads; Day 30 — 10 calls booked; Day 60 — 3 proposals; Day 90 — 2 clients.",
        source: "30-60-90 day plan",
      },
      {
        term: "Track status rules",
        definition: "Goal: Done at 100%; On track if progress ≥ time elapsed; At risk if behind by 15 points or less; Behind otherwise. Habit: On track at 80%+ in the last 30 days, At risk at 50%+, Behind below 50%. Task: Done; no due date = On track; overdue = Behind; due within 3 days = At risk. Task progress: done 100%, in progress 50%, else 0%.",
        example: "Sprint 40% elapsed, goal at 30% → At risk. Goal at 20% → Behind.",
      },
      {
        term: "Focus this week (project)",
        definition: "Focus time logged Monday–Sunday on the project or on its tasks. “Deep” counts only sessions marked deep (maker).",
        example: "“3h 20m this week · 2h deep” — most of it was real build time.",
      },
    ],
    testing: [
      "Open Projects (Work → Projects). Expected: the board with Active · n/cap, Planning, Blocked and Done.",
      "Click New project → Project. Type “Test project”, pick an area, click Create project. Expected: the project page opens; on the board the card is in Planning.",
      "On the project page, the Next action card shows “Add the first next action”. Click it, type “Write outline”, pick Today, click Add next action. Expected: toast “Next action added”; the card shows the task with a Today chip.",
      "Change Status to Active. Expected: “Saved”. Back on the board the card is in Active and shows “Next: Write outline · today”.",
      "Tick the circle in the Next action card. Expected: “Next action done — what's next?”; the card now shows the amber “Active but no next action” warning, and the board shows the No next action card.",
      "In Settings set Active projects to 1, then drag a second project to Active. Expected: a warning toast and the amber WIP banner on the board.",
      "Drag a project to Done. Expected: “Project shipped: …” with a celebration; the card shows “Shipped”.",
      "Create a Sprint (30 days). Expected: the sprint hero with days left, Time elapsed and Milestone progress; the Command Center below.",
      "Add 2 milestones and tick one. Expected: Milestones (1/2) and Milestone progress 50%.",
      "Click Link goals / habits / tasks → Tasks → type a title → +. Expected: the task appears in the Track table with Type Task and Status On track.",
      "Type “Book 10 calls” in a Day 30 cell and click away. Reload. Expected: the text is still there.",
    ],
    tips: [
      "Name projects as finished outcomes: “… delivered”, “… launched”, “… hired”.",
      "If a project has been Blocked for two weeks, write the follow-up as its next action (“Chase Sara for the logo files”).",
      "Deleting a project has no undo; drag it to Done instead.",
    ],
  },

  // ───────────────────────────────────────────────────────────────────────
  // FOCUS
  // ───────────────────────────────────────────────────────────────────────
  {
    id: "focus",
    group: "Work",
    title: "Focus",
    summary:
      "The execution engine: a Pomodoro or stopwatch timer that runs on every page, deep vs shallow marking, start-from-plan buttons for your Top 3, focus music, and hours by life area against each area's weekly target.",
    why:
      "What gets measured gets protected. Every session lands in a life area, a project and a task, so you see whether your hours match your priorities. Marking sessions deep or shallow shows how much real maker time you get. Starting from your Top 3 means the most important work gets the first, freshest hours.",
    when: {
      daily:
        "Start your first Top 3 task from “Start from today's plan”. Mark each session Deep or Shallow. If you forgot the timer, use Log time manually before the shutdown.",
      weekly: "Check Deep share (aim for 50%+) and the Hours by Life Area bars against the targets. Tag untagged sessions in Activity history.",
      monthly: "Look at Time per task: are your biggest time sinks the right tasks?",
      oneTime:
        "Set a weekly hour target for every life area (Life Areas page or Compass). Choose your Pomodoro lengths (default 25 min focus / 5 min break).",
    },
    pages: [
      {
        route: "/focus",
        title: "Focus",
        purpose: "Run the timer, start deep work on today's plan, and see where your hours went this week.",
        elements: [
          {
            name: "Focus (page header)",
            what: "Title with “Deep work on what matters. Start from today's plan — every session counts toward your Life Area hours.”",
          },
          {
            name: "Week and Analytics (buttons)",
            what: "Shortcuts to the Week page and the Analytics page.",
          },
          {
            name: "Pomodoro · Stopwatch (switch)",
            what: "Pomodoro counts down (focus, then break). Stopwatch counts up with no limit.",
            how: "Pick one before you start. Warning: switching while a timer runs resets it and the unsaved time is lost — click Stop & log first.",
          },
          {
            name: "Focus · Break (Pomodoro only)",
            what: "Shows which part of the Pomodoro you are in.",
            how: "Clicking one jumps to it and resets the countdown (unsaved time is lost).",
          },
          {
            name: "Timer dial",
            what: "A ring that fills as time passes (blue for focus, green for break; in stopwatch mode it loops every minute). In the middle: mm:ss and “focus”, “break” or “elapsed”. The task name shows below.",
          },
          {
            name: "Start / Pause",
            what: "The big button. Starting from zero counts as a fresh session and offers focus music.",
          },
          {
            name: "Stop & log (↺ icon)",
            what: "Stops the timer and saves the focused time as a session. Sessions shorter than 30 seconds are not saved. Break time is never saved.",
            how: "Click it when you finish early or want to switch tasks.",
          },
          {
            name: "Skip break (⏭, during a break)",
            what: "Ends the break and gets the timer ready for the next focus block.",
          },
          {
            name: "This session is… (Deep · Shallow · Unmarked)",
            what: "Marks the running session. Line under it: “Deep = maker work (build, write, deliver). Shallow = manager work (calls, email, admin).”",
            how: "Pick before or during the session. Starting from a High-energy task sets Deep, from a Low-energy task sets Shallow; Medium or no energy keeps your last choice.",
          },
          {
            name: "Focus / Break minutes (Pomodoro only)",
            what: "Two number boxes: focus length (default 25) and break length (default 5).",
          },
          {
            name: "Attribute to a task…",
            what: "A list of your open tasks (high priority first).",
            how: "Pick a task: its area and project are filled in, and Deep/Shallow follows its energy.",
          },
          {
            name: "Project",
            what: "“No project” or an open project.",
            how: "Picking a project also sets its life area.",
          },
          {
            name: "Life area…",
            what: "The area this time counts for.",
          },
          {
            name: "Numbers (Today · This week · Deep share)",
            what: "Today = hours focused today. This week = hours Monday–Sunday. Deep share = % of this week's focus marked Deep (green at 50%+), with “Xh deep · Yh shallow”, or “Mark sessions deep or shallow”.",
          },
          {
            name: "Start from today's plan",
            what: "Hint “Your Top 3 first, then everything planned for today.” Your Top 3 (star) come first, then open tasks planned for today and tasks with a start time today. Each row shows the area, the estimate and a Deep or Light chip, and a Focus button (filled for Top 3). A “Plan →” link opens the Tasks Today list.",
            how: "Click Focus on a row. The timer starts in the current mode on that task with the right area, project and deep/shallow mark; a toast says “Focusing on …”. While it runs the button shows the time and pauses it. Empty: “Nothing planned for today” with Choose Top 3.",
          },
          {
            name: "Hours by Life Area — this week",
            what: "Hint “Focus sessions + finished calendar blocks, against each area's weekly target.” One row per area: the name (link), “actual h / target h · planned h planned”, and a bullet bar. Legend: “Bar = done · light = planned · tick = target.” An “Unassigned” row shows time with no area. “Targets →” opens Life Areas.",
            how: "If an area's bar is far from its tick on Thursday, plan a block for it.",
          },
          {
            name: "This week — deep vs shallow",
            what: "A bar per day (Mon–Sun) stacked Deep, Shallow and Unmarked hours. Hover a bar to see what you worked on that day.",
          },
          {
            name: "Time per task",
            what: "Hint “All time, top 8.” Each row: the task, a bar and “Xh · N×” (hours and number of sessions).",
          },
          {
            name: "Log time manually",
            what: "Hint “Forgot the timer? Add it here — it counts toward area hours.” Minutes (default 30), Life area, Unmarked / Deep / Shallow, a date and a Log button.",
            how: "Fill in and click Log. The session is saved at 12:00 on that date; you see “Time logged”.",
          },
          {
            name: "Activity history",
            what: "Hint “Tap the tag to mark a session deep or shallow.” Your last 25 sessions: minutes, what it was for (task, else project, else area, else “Focus”), a tag button, the date and time, and a trash icon.",
            how: "Click the tag to cycle Deep → Shallow → Tag (unmarked). Click the trash to delete a session.",
          },
        ],
        howTo: [
          "Pick Pomodoro and keep 25 / 5 minutes.",
          "In “Start from today's plan” click Focus on your first Top 3 task.",
          "Choose music or No music in the window that opens.",
          "Work until the bell. The focus block is saved by itself and the break starts.",
          "After the break, click Start again for the next block.",
          "Friday: check Deep share and the Hours by Life Area bars.",
        ],
      },
      {
        route: "(every page)",
        title: "Focus timer pill, music and the ▶ task button",
        purpose: "Keep the timer visible and controllable everywhere, and start it from any task.",
        elements: [
          {
            name: "Timer pill (top bar)",
            what: "Appears on every page while a timer is active: a timer icon, the time, the task name (on wider screens), a Pause / Resume button and a Stop & log button. It pulses while running and turns green during a break.",
            how: "Click the time to open Focus. The timer survives page changes and even a reload.",
          },
          {
            name: "Focus music (window)",
            what: "Opens when a fresh session starts: “Play something while you focus?”, a track list (Calm Humming Nasheed · Rain Sounds), a volume slider with %, No music and Play.",
            how: "Pick a track and click Play. The music loops while the timer runs, pauses when you pause, and stops when you stop the timer. The app remembers your track and volume.",
          },
          {
            name: "Music volume bar",
            what: "A small floating bar at the bottom left while music plays: a mute button and a volume slider.",
          },
          {
            name: "▶ task button",
            what: "On task rows, board cards and the task panel. Menu “Start timer”: Pomodoro, Stopwatch; while this task runs also Stop & log and Open Focus.",
            how: "Starting a timer on a new task first saves the running session under the old task, then starts the new one.",
          },
        ],
      },
    ],
    frameworks: [
      {
        term: "Deep work vs shallow work",
        definition: "Deep work is focused, hard thinking without distraction; it creates most of your value. Shallow work is easy, often interrupted work like email and admin. In bishOS: Deep = maker, Shallow = manager.",
        example: "Writing the sales page for 90 minutes with the phone away = deep. Answering 30 emails = shallow.",
        source: "Deep Work (Cal Newport)",
      },
      {
        term: "Maker vs manager schedule",
        definition: "Makers need long, unbroken blocks (half days). Managers work in 30–60 minute slots of calls and meetings. Mixing them kills maker time, so group them: maker mornings, manager afternoons.",
        example: "Mon–Thu 9:00–12:30 delivery deep work; 13:30–17:00 calls and outreach.",
        source: "“Maker's Schedule, Manager's Schedule” (Paul Graham, 2009)",
      },
      {
        term: "Pomodoro",
        definition: "Work in short, fixed blocks (default 25 minutes) followed by a short break (default 5 minutes). The timer makes starting easy and protects focus. In bishOS a completed focus block is saved automatically and the break starts; after the break the timer waits for you.",
        example: "Four Pomodoros on the proposal before lunch = 100 minutes of focus.",
        source: "The Pomodoro Technique (Francesco Cirillo)",
      },
      {
        term: "Stopwatch session",
        definition: "An open-ended timer for flow work, when you do not want a bell to stop you. Save it with Stop & log.",
        example: "Coding a feature for 2h 10m in one go.",
      },
      {
        term: "Deep share",
        definition: "Deep hours ÷ all focus hours this week × 100. Unmarked time counts in the total, so tag your sessions. 50% or more turns green.",
        example: "12h focus, 7h tagged Deep → 58% deep share.",
      },
      {
        term: "Hours attribution",
        definition: "Every session counts for one life area: the area set on the session, else its task's area, else its project's area, else “Unassigned”. Area hours = focus sessions + calendar blocks marked done that have no linked session (so nothing counts twice). Planned = calendar blocks not skipped.",
        example: "A session on the task “Draft proposal” (area Sales) with no area set still counts for Sales.",
      },
      {
        term: "Area weekly target (hour budget)",
        definition: "How many hours a week an area deserves, set on Life Areas or Compass. The tick on each bar is this target.",
        example: "Sales 10h, Delivery 20h, Content 5h, Fitness 4h.",
      },
      {
        term: "Bullet bar",
        definition: "A compact bar that shows actual (filled, area colour), planned (light) and target (a tick) on one line.",
        source: "Bullet graph (Stephen Few)",
      },
      {
        term: "Start from plan",
        definition: "Begin each focus session from your Top 3 and today's plan, not from whatever is loud. The most important work gets the best hours.",
        source: "Eat That Frog (Brian Tracy)",
      },
    ],
    testing: [
      "Open Focus (Work → Focus). Expected: the timer card on the left; numbers, Start from today's plan, Hours by Life Area, the deep vs shallow chart and Time per task on the right.",
      "Set Focus minutes to 1 and Break to 1. Click Start. Expected: the music window opens; click No music. The dial counts down from 01:00 and the timer pill appears in the top bar.",
      "Go to another page. Expected: the pill keeps counting. Click the time. Expected: you are back on Focus.",
      "Wait until 00:00. Expected: the timer switches to Break (green) and a 1-minute session appears at the top of Activity history.",
      "Click Stopwatch, pick a task in “Attribute to a task…”, click Start, wait 40 seconds, click Stop & log. Expected: a new session for that task appears; Time per task shows the task.",
      "Click the tag on that session twice. Expected: Deep, then Shallow. The chart and Deep share update.",
      "In Log time manually type 30, pick an area, Deep, today's date, click Log. Expected: “Time logged”; Today goes up by 0.5h and the area's bar grows.",
      "In Start from today's plan click Focus on a Top 3 task. Expected: toast “Focusing on …”; the button shows the running time.",
      "Start a timer, wait 10 seconds, click Stop & log. Expected: no new session (under 30 seconds is ignored).",
    ],
    tips: [
      "Put the phone in another room for deep blocks.",
      "Do not switch Pomodoro/Stopwatch while running — use Stop & log first so you keep the time.",
      "Tag sessions daily; untagged time makes Deep share look worse than it is.",
    ],
  },

  // ───────────────────────────────────────────────────────────────────────
  // LIFE AREAS
  // ───────────────────────────────────────────────────────────────────────
  {
    id: "life-areas",
    group: "Work",
    title: "Life Areas",
    summary:
      "The spine of the Life OS. Every goal, project, habit, task, note and hour belongs to one area. Each area has a standard (what “maintained” looks like), a weekly hour budget, optional sections, and a hub page that shows everything inside it.",
    why:
      "Areas never end — they need care forever. When each one has a clear standard and an hour budget, you know when it is healthy without making goals for everything. The area hub gives you one place to check an area: rating, hours, goals, projects, habits, tasks, notes and wins.",
    when: {
      daily: "Nothing to do daily. Open an area hub when you want to work on that part of life.",
      weekly: "Check the “This week” hours on the Life Areas page against each budget. Open the hub of any area that looks neglected.",
      monthly: "Rate each area 1–10 in its hub (“This month”) or on Compass. Read the standard: still true?",
      quarterly: "Update standards and hour budgets before the new 12-week cycle. Archive areas you no longer run.",
      oneTime:
        "Run the Setup wizard (it creates Company Operations, Sales & Marketing, Learning & Content and Fitness with sensible standards) or add your own areas. Give each a standard and a weekly hour budget. Add sections only where an area needs sub-areas.",
    },
    pages: [
      {
        route: "/life-areas",
        title: "Life Areas",
        purpose: "Create, edit, archive and budget your areas, and see this week's hours across all of them.",
        elements: [
          {
            name: "Life Areas (page header)",
            what: "Title with “The spine of your Life OS. Every goal, project, habit and hour belongs to one area. Each area has a standard — what 'maintained' looks like.”",
          },
          {
            name: "Setup wizard (button)",
            what: "Opens the area setup on Today (standards and weekly hour budgets).",
          },
          {
            name: "New area (button)",
            what: "Opens “New life area”: a name box (“e.g. Fitness”) and Add life area.",
          },
          {
            name: "Week summary bar",
            what: "“32.5h this week across areas · budget 40h” (the budget shows when you set targets) and a Show archived / Hide archived button.",
          },
          {
            name: "Area card",
            what: "One card per area: its colour dot and name (link to the hub), a kind chip (business or personal) if set, an Archive / Restore icon and a Delete icon. Archived areas look faded.",
            how: "Click the name to open the hub. Archive hides an area from lists but keeps its history.",
          },
          {
            name: "Standard",
            what: "A text field: “What does 'maintained' look like? e.g. Clients delivered on time; invoices sent every Friday.”",
            how: "Click it, type, click away to save.",
          },
          {
            name: "This week · budget",
            what: "“6.5h of [8] h”: hours this week (focus sessions with this area + calendar blocks marked done) and a number box for the weekly budget (0–80). A bar fills toward the budget: green at 85%+, blue at 60%+, amber at 35%+, red below.",
            how: "Type the budget and click away. You see “Budget saved”.",
          },
          {
            name: "Sections list",
            what: "The sections (sub-areas) of this area, each a link to its section page, with a trash icon on hover (deletes at once).",
          },
          {
            name: "Add section…",
            what: "A small box with an Add button at the bottom of each card.",
            how: "Type a name and press Add.",
          },
          {
            name: "Delete “<area>”? (window)",
            what: "“This removes the area and its sections. Tasks, goals and notes inside it stay but lose their area. Archiving is usually better.” Buttons Archive instead and Delete.",
          },
          {
            name: "Empty state",
            what: "“No life areas yet” with a Run setup button.",
          },
        ],
      },
      {
        route: "/life-areas/[id]",
        title: "Area hub",
        purpose: "Everything that lives in one area on one page: standard, monthly rating, hours vs target, goals, projects with next actions, habits, learning, tasks, wins, notes and sections.",
        elements: [
          {
            name: "Header",
            what: "The area's colour dot and name, a kind chip, an “archived” chip if archived, and a one-line description you can edit (“Add a one-line description…”).",
          },
          {
            name: "All areas and Log win (buttons)",
            what: "← All areas goes back to the list. Log win logs a win for this area (it shows in Recent wins and on Wins).",
          },
          {
            name: "Standard (card)",
            what: "Hint “What “maintained” looks like here.” The editable standard.",
            how: "Click, type, click away. You see “Standard saved”.",
          },
          {
            name: "This month (card)",
            what: "Hint “Wheel of Life — rate 1–10, re-rate monthly.” A ring with this month's rating, a line like “Last rated 6/10 (2026-09). How is it really going?” when not rated, six small bars for the last 6 months, ten buttons 1–10 and a Compass → link.",
            how: "Click a number. You see “<Area>: 7/10 this month”. The same rating shows on Compass.",
          },
          {
            name: "Hours this week (card)",
            what: "Hint “Focus sessions + done calendar blocks.” Big “6.5h of [8] h target” with an editable target, a bar coloured by % of target, “Xh planned on the calendar · Start a focus session” and a Week → link.",
          },
          {
            name: "At a glance",
            what: "Open tasks (“+N someday”) · Planned today · Done this week (green when above 0) · Active goals (“N active projects”).",
          },
          {
            name: "Goals",
            what: "Hint “Most areas are maintenance. Goals are for change you want this cycle.” Lists 12-week goals and Annual goals (title, %, coloured bar, “status · N projects”), a Show other goals (N) toggle and “N achieved”. A Goals → link.",
            how: "Click a goal to open it. Empty: “No goals in this area — That's fine — the standard keeps it healthy.” with Plan a goal.",
          },
          {
            name: "Projects",
            what: "Hint shows “N active without a next action” or “Every active project has a next action.” Up to 10 projects (Active, Blocked, Planning, Done order), a rocket for sprints, a status chip, and the next action line. A Projects → link.",
            how: "Click “No next action — add one” (amber) or “Add next action” to add the step right here.",
          },
          {
            name: "Habits",
            what: "Hint “Consistency first, streak second.” Habit cards with a consistency ring (%), the title and “N-day streak · done today” or “Queued”. A Habits → link.",
          },
          {
            name: "Learning & content",
            what: "Learning areas linked to this area (name, content pillar, status, weekly minutes target), the content Pillars they feed, and active Challenges whose life area is this one.",
            how: "Empty: “Nothing linked yet” with Open Learning.",
          },
          {
            name: "Next up",
            what: "Hint “N open in this area”. An “Add a task to <Area>…” box and up to 8 open tasks (not Someday), ordered by “when” day, deadline and priority. Each shows a circle, the title and a “when” chip (amber when late, blue for today) or the estimate. A Tasks → link opens Tasks filtered to this area.",
            how: "Type and Add to create a task in this area. Click the circle to finish. Click the title to open the task panel.",
          },
          {
            name: "Recent wins",
            what: "Hint “Progress you made in this area.” Wins you logged for this area in the last 30 days (up to 6, with the why and the date) and tasks done this week (up to 5). A Wins → link.",
          },
          {
            name: "Notes (N)",
            what: "The 8 newest notes filed under this area, with their type chip, and a Notes → link.",
          },
          {
            name: "Sections",
            what: "Hint “Sub-areas — add them from the Life Areas list.” Cards with “N tasks · N notes · N goals”.",
          },
          {
            name: "Add the next action (window)",
            what: "The same next-action form as on Projects (title, When: Today / Tomorrow / Anytime).",
          },
          {
            name: "Life area not found",
            what: "Shown if the area was deleted, with an All life areas button.",
          },
        ],
      },
      {
        route: "/life-areas/[id]/sections/[sectionId]",
        title: "Section page",
        purpose: "Work inside one sub-area: its tasks, notes and goals.",
        elements: [
          {
            name: "Header",
            what: "The section name, “Section of <Area>” (link) and a ← <Area> button.",
          },
          {
            name: "Quick add",
            what: "“New task in <Section>…”, a When list (Anytime / Today), a Priority list (Low / Medium / High) and + Add.",
            how: "Type and click Add. The task gets this area and section.",
          },
          {
            name: "Tasks (N open)",
            what: "Open tasks first, then done ones. Each: a circle (toggle done), the title (opens the task panel), and a “when” chip — or a sun button “Do it today” (on desktop it shows on hover).",
          },
          {
            name: "Notes (N)",
            what: "Notes filed in this section, each a link.",
          },
          {
            name: "Goals (N)",
            what: "Goals filed in this section with their %.",
          },
        ],
      },
    ],
    frameworks: [
      {
        term: "Life area (area of responsibility)",
        definition: "A part of your life you keep up forever, with no end date. Projects end; areas do not.",
        example: "Company Operations, Sales & Marketing, Learning & Content, Fitness, Family.",
        source: "PARA method (Tiago Forte); GTD areas of focus (David Allen)",
      },
      {
        term: "Area standard",
        definition: "One or two lines that say what “maintained” looks like for an area. If the standard is met, the area is healthy — no goal needed.",
        example: "Sales: “10 outreach touches every workday; every lead answered within 24 hours.”",
        source: "PARA “standard to maintain” (Tiago Forte)",
      },
      {
        term: "Area hub",
        definition: "One page per area that pulls in everything linked to it: rating, hours, goals, projects, habits, learning, tasks, wins, notes and sections.",
        example: "Open Fitness → see the 6/10 rating, 2h of 4h this week, the habit “Lift 3× a week” at 70% and next task “Book a physio check”.",
      },
      {
        term: "Weekly hour budget",
        definition: "The hours per week an area should get. It is the target tick on the Focus page, the area hub and Analytics.",
        example: "Delivery 20h, Sales 10h, Content 5h, Fitness 4h = 39h.",
      },
      {
        term: "Wheel of Life rating",
        definition: "Rate each area 1–10 once a month. Low spokes show where the next goal should go.",
        example: "Fitness dropped from 7 to 4 → next cycle's goal: “Train 3× a week”.",
        source: "Wheel of Life (Paul J. Meyer)",
      },
      {
        term: "Section (sub-area)",
        definition: "An optional smaller part inside an area for grouping tasks, notes and goals.",
        example: "Company Operations → sections Finance, Legal, Hiring.",
      },
      {
        term: "Archive vs delete",
        definition: "Archive hides an area but keeps its history and links. Delete removes the area and its sections; its tasks, goals and notes stay but lose their area. Archive is usually better.",
      },
    ],
    testing: [
      "Open Life Areas (Work → Life Areas). Expected: one card per area and the week summary bar.",
      "Click New area, type “Test area”, click Add life area. Expected: a new card appears.",
      "Click the Standard text, type “Weekly check done”, click away. Reload. Expected: the text stays.",
      "Type 5 in the budget box and click away. Expected: “Budget saved”; the summary bar shows the budget.",
      "Type “Admin” in Add section… and click Add. Expected: the section appears; click it to open the section page.",
      "On the section page add a task with When = Today. Expected: “Task added”; it shows with a Today chip.",
      "Open the area hub (click the area name). Click 7 under This month. Expected: “Test area: 7/10 this month”; the ring shows 7.",
      "In Next up add a task. Expected: it appears; Open tasks in At a glance goes up by one.",
      "Start a 1-minute focus session on a task in this area and let it finish. Expected: Hours this week goes up on the hub and on the Life Areas card.",
      "On the Life Areas page click the Delete icon → Archive instead. Expected: the card disappears; Show archived brings it back faded.",
    ],
    tips: [
      "Five to seven areas are enough. Too many areas means nothing gets enough hours.",
      "Write standards you can check with yes or no.",
      "Keep the total weekly budget under 55 hours.",
    ],
  },

  // ───────────────────────────────────────────────────────────────────────
  // WINS
  // ───────────────────────────────────────────────────────────────────────
  {
    id: "wins",
    group: "Work",
    title: "Wins",
    summary:
      "One feed of all your progress (formerly called Momentum). It merges the wins you log by hand with the wins the system already knows: progress lines and journal wins, Top 3 and Big 3 done, deals won, content published, promises kept and offers launched. Plus a win streak, a best streak and a 12-week heat strip.",
    why:
      "Small, visible progress is the strongest daily motivator. Founders forget their wins and only see what is left. This page makes progress impossible to miss, so you start tomorrow with energy instead of guilt.",
    when: {
      daily: "Log one win (Log a win, or the Win button on a task or project). At shutdown, write a progress line — it shows here automatically.",
      weekly: "Read the 7-day feed in your weekly review. Copy the best ones into the review's wins.",
      monthly: "Switch the range to 90 days and look at the heat strip: which weeks were light, and why?",
      oneTime: "Nothing to set up. Wins appear as soon as you use Today, Week, Pipeline, Content and Commitments.",
    },
    pages: [
      {
        route: "/momentum",
        title: "Wins",
        purpose: "See and log your progress, keep a daily win streak, and spot quiet weeks.",
        elements: [
          {
            name: "Wins (page header)",
            what: "Title with “Progress you made — the fuel for tomorrow. Automatic wins from your day, plus the moments you log.”",
          },
          {
            name: "Today's journal (button)",
            what: "Opens today's journal page.",
          },
          {
            name: "Log a win (button)",
            what: "Opens the Log a win window.",
          },
          {
            name: "Wins this week",
            what: "Number of wins Monday–today (green when above 0). Sub-line “N last week” or “Mon – today”.",
          },
          {
            name: "Win streak",
            what: "Days in a row with at least one win, with a flame. Sub-line: “days in a row · today counted”, or “days — log one today to keep it” when today has no win yet.",
          },
          {
            name: "Best streak",
            what: "Your longest win streak in the last 12 months.",
          },
          {
            name: "Win days this week",
            what: "How many days this week had at least one win (“days with progress”).",
          },
          {
            name: "Last 12 weeks (heat strip)",
            what: "Hint “Each square is a day; darker = more wins.” Columns are weeks (oldest left), rows Monday to Sunday. Light = 1 win, medium = 2–3, dark = 4+. Today has a ring. Legend Less … More.",
            how: "Hover a square to read “<date> — N wins”. Click it to open that day's journal.",
          },
          {
            name: "Feed filter (All · Logged · Day wins · Top 3 · Big 3 · Business)",
            what: "Each with a count for the chosen range. Logged = wins you entered. Day wins = progress lines and journal wins. Top 3 · Big 3 = plan items done. Business = deals won, content published, promises kept, offers live.",
          },
          {
            name: "Range (7 days · 30 days · 90 days)",
            what: "How far back the feed goes (default 30 days). The numbers and heat strip at the top do not change with it.",
          },
          {
            name: "Day card",
            what: "One card per day: “Today · Tue, Oct 20” and an Open day ↗ link to the journal. Each win row has an icon, the title, the source (Logged, Progress line, Journal win, Top 3 done, Weekly Big 3, Deal won, Published, Promise kept, Offer live), impact dots (logged wins) and the why.",
            how: "Click a row to open its source (the task, project, goal, deal, content piece, commitments, offer, week or journal). Logged wins have a trash icon to remove them.",
          },
          {
            name: "Log a win (window)",
            what: "“What went well? e.g. Closed the Acme proposal”, Impact 1–5 (default 3), Life area (optional), “Why did it matter? (optional)” and Save win.",
            how: "Fill it in and save. Impact 4 or 5 gives a bigger celebration. A win with a life area also shows on that area's hub.",
          },
          {
            name: "Empty state",
            what: "“No wins in this range yet — Finish a Top 3 task, write a progress line at shutdown, or log a win — small progress counts.” with Log a win.",
          },
        ],
      },
      {
        route: "(tasks, projects, goals, habits, notes, area hubs)",
        title: "Log win button",
        purpose: "Log a specific item as a win right where you are.",
        elements: [
          {
            name: "Log win / Win (button)",
            what: "A trophy button (“Win” in the task panel, “Log win” elsewhere). A small number shows how many times this item was logged. After saving it shows “✓ Logged” for about two seconds.",
          },
          {
            name: "Log a win (popover)",
            what: "The item's title, Impact 1–5, “Why did it move the needle? (optional)” and Save win.",
            how: "Pick the impact, add one line why, click Save win. You can log the same item many times (each is a new moment).",
          },
        ],
      },
    ],
    frameworks: [
      {
        term: "Progress principle",
        definition: "Of everything that boosts motivation at work, making progress in meaningful work is the strongest — even small steps. Seeing your progress keeps it going.",
        example: "You did not close the deal, but you booked the demo. Log it: impact 3, “first real meeting with a decision maker”.",
        source: "The Progress Principle (Teresa Amabile & Steven Kramer)",
      },
      {
        term: "Win",
        definition: "Any step forward that mattered: logged by hand, or recorded by the system (progress line, journal win, Top 3 done, Weekly Big 3 done, deal won, content published, promise kept, offer live).",
      },
      {
        term: "Win streak",
        definition: "The number of days in a row with at least one win of any kind. If today has no win yet, the streak counts up to yesterday, so it is not broken until the day ends.",
        example: "Wins on Mon, Tue, Wed and today Thu → streak 4.",
      },
      {
        term: "Impact (1–5)",
        definition: "How much a win moved the needle: 1 = small step, 5 = big breakthrough.",
        example: "Fixed a typo on the site = 1. Signed a €20k client = 5.",
      },
      {
        term: "Progress line",
        definition: "One sentence at the evening shutdown about what moved forward today. It appears on Wins as a “Progress line” win.",
        example: "“Sent the proposal and recorded two shorts.”",
      },
      {
        term: "Done list",
        definition: "A list of what you finished, instead of only what is left. It shows that you are moving.",
        source: "“Done list” / “ta-da list” practice",
      },
    ],
    testing: [
      "Open Wins (Work → Wins). Expected: four numbers, the heat strip, the filter row and the feed.",
      "Click Log a win. Type “Test win”, impact 4, pick an area, click Save win. Expected: a celebration; the win appears in Today's card with 4 impact dots; Wins this week goes up.",
      "Click the Logged filter. Expected: only logged wins.",
      "Open the area hub of the area you picked. Expected: “Test win” is in Recent wins.",
      "Open a task panel and click Win → Save win. Expected: the button shows “✓ Logged”, then a count of 1; the win appears on Wins with a link to the task.",
      "Finish a Top 3 task on the Tasks Today list. Expected: a “Top 3 done” win appears in today's card.",
      "If today had no win before your test, check Win streak. Expected: the sub-line changes to “days in a row · today counted”.",
      "Hover today's square in the heat strip. Expected: “<date> — N wins”. Click it. Expected: today's journal opens.",
      "Click the trash on “Test win”. Expected: “Removed”; the win disappears.",
    ],
    tips: [
      "Log wins the moment they happen; a 5-second log beats a perfect memory.",
      "On hard days, log the smallest real step. It keeps the streak and your mood alive.",
    ],
  },

  // ───────────────────────────────────────────────────────────────────────
  // CHALLENGES
  // ───────────────────────────────────────────────────────────────────────
  {
    id: "challenges",
    group: "Work",
    title: "Challenges",
    summary:
      "A workspace for an intense personal push (for example a 38-day agency sprint). You split it into sections (Learning, Sales, Build…), each with a syllabus, goals and KPIs. Then you log the challenge day by day: tasks per section, KPI values, habits, health and an evening journal. A days table and a health tracker show the whole run.",
    why:
      "Big pushes fail when the daily work is vague. Sections make the work clear, KPIs make it measurable, and the day journal makes you show up and reflect every day. Everything is real data: tasks are normal tasks, habits are your normal habits, and focus time counts in your life area and Analytics.",
    when: {
      daily:
        "Click + in the side panel to create today's day. In each section tab add and finish tasks and fill the KPIs. On the Overview tab tick habits, fill Health and write Today's journaling with your energy.",
      weekly: "Open the Days table and look for gaps (low KPIs, missing habits, bad sleep). Adjust sections, goals or KPIs in Overview.",
      monthly: "Open the Health tracker and read your average sleep and the sleep line.",
      oneTime:
        "Click New Challenge. Add an icon, a name, the target outcome, the sections with their KPIs, and pick habits. Then, in Overview, open each section and add its goals and syllabus. Link the challenge to a 12-week goal (Serves goal).",
    },
    pages: [
      {
        route: "/challenges",
        title: "Challenges",
        purpose: "See your challenges and create a new one.",
        elements: [
          {
            name: "New Challenge (button)",
            what: "In the top bar. Opens the New challenge window.",
          },
          {
            name: "Challenges (page header)",
            what: "Title with “A workspace per goal — split into sections, logged day by day.”",
          },
          {
            name: "Active (grid)",
            what: "One card per active challenge: its icon (or a rocket), the name, the outcome (2 lines), “N sections”, “N days” and the goal it serves (target icon). A coloured left border if the challenge has a colour.",
            how: "Click a card to open the workspace.",
          },
          {
            name: "Past (grid)",
            what: "Challenges that are completed or archived, slightly faded.",
          },
          {
            name: "Empty state",
            what: "“No challenges yet — Create your first — e.g. a 38-Day AI Agency Sprint.”",
          },
          {
            name: "New challenge (window)",
            what: "An icon box (an emoji, placeholder 🚀), the name (“Challenge name (e.g. 38-Day AI Agency Sprint)”), “Target outcome — what does winning look like?”, Sections, Habits and Create challenge. Note: “A Life Area named after this challenge is created automatically — all its tasks live there.”",
          },
          {
            name: "Sections (in the window)",
            what: "One box per section: a name (“Section 1 (e.g. Learning)”), × to remove (when there is more than one), its KPI rows and “+ Add KPI”. Under the boxes: “+ Add section”.",
            how: "A KPI row has a name (“KPI name (e.g. Pages read)”), a type (number, yes/no, text), and for numbers a unit and a target. × removes the KPI.",
          },
          {
            name: "Habits (ticked each day)",
            what: "Chips of your existing habits (only if you have some).",
            how: "Click a chip to include it (it turns blue). Included habits show as a strip on every day.",
          },
          {
            name: "Create challenge (button)",
            what: "Creates the challenge, its sections and KPIs, its own life area, links the habits, and opens the workspace.",
            how: "You need a name and at least one section with a name.",
          },
        ],
      },
      {
        route: "/challenges/[id]",
        title: "Challenge workspace — side panel and Overview & sections",
        purpose: "Set up the challenge structure (sections, goals, KPIs, syllabus, habits) and see the totals.",
        elements: [
          {
            name: "Side panel",
            what: "Left column: “← Challenges”, the icon and name, then Overview & sections, Days table, Health tracker, a DAYS header with +, and the list of days (newest first). The open view is kept in the address bar, so you come back to the same place.",
            how: "Click + to create today's day; it is named like “Wednesday - 21/10/2026” with today's date. Hover a day and click the trash to delete it (it asks first). Deleting a day keeps its tasks but removes its KPI values.",
          },
          {
            name: "Challenge header",
            what: "The icon and name, the description and “Outcome: …”.",
          },
          {
            name: "Serves goal",
            what: "A list with None and your active 12-week (“12w ·”) and annual (“Year ·”) goals, an “Open goal →” link, and a “Life Area: <name>” chip that opens the challenge's area hub.",
            how: "Pick the goal this challenge serves. It then shows on the challenge card.",
          },
          {
            name: "Stats (Total focus · Tasks done · Habit checks · Avg energy · Days)",
            what: "Total focus = hours on this challenge's tasks. Tasks done = done / all challenge tasks. Habit checks = ticks of the challenge's habits on challenge days. Avg energy = average evening energy (1–5) from the day journals. Days = number of days.",
          },
          {
            name: "Sections (list)",
            what: "Hint “Define each section's syllabus, goals and KPIs here. Daily tasks & KPI values are logged inside each day.” Each row: an arrow, the icon and name, “· N goals · N KPIs”, focus hours and tasks done/total, up and down arrows (reorder) and a trash icon (asks first).",
            how: "Click the row to open it.",
          },
          {
            name: "Goals (inside a section)",
            what: "Checkboxes with a title and ×, and an “Add goal…” box.",
            how: "Type and press Enter. Tick a goal when you reach it.",
          },
          {
            name: "KPIs (inside a section)",
            what: "Each KPI with a chip like “number · pages · target 30”, and × (removing a KPI also deletes all its logged values). An add row: KPI name, type (number / yes/no / text), unit, target and Add.",
          },
          {
            name: "Syllabus (inside a section)",
            what: "The section's curriculum or reference in markdown. Pencil icon to edit; a big text box and Save. “No syllabus yet — click the pencil to add one.”",
          },
          {
            name: "Add a section…",
            what: "A box and Add button under the list.",
            how: "Type a name and press Enter or Add.",
          },
          {
            name: "Habits (manager)",
            what: "Hint “These show as a strip on every day, ticked per day.” Linked habits (blue chips with × to unlink), “Add an existing habit” (dashed chips) and “New habit (e.g. Gym, Quran, Journal)…” with Create.",
            how: "Create makes a new daily habit in the challenge's life area, already linked. It also appears in your Habits module.",
          },
          {
            name: "Footer hint",
            what: "“Create a day from the side panel to start logging.”",
          },
        ],
      },
      {
        route: "/challenges/[id] (a day)",
        title: "Challenge day",
        purpose: "Log one day of the challenge: tasks and KPIs per section, habits, health and the evening journal.",
        elements: [
          {
            name: "Breadcrumb and day name",
            what: "“Challenges › Day”, the day name as a big editable field, and the date under it.",
            how: "Click the name, change it, click away to save.",
          },
          {
            name: "Tabs (Overview · one per section)",
            what: "Overview first, then each section. The open tab is kept in the address bar.",
          },
          {
            name: "Day stats (Focus today · Tasks done · Habits done · Energy)",
            what: "Focus on today's challenge tasks, done/total tasks, habits ticked/total, and the energy you gave in the journal.",
          },
          {
            name: "Habits strip",
            what: "One chip per challenge habit; blue with a ✓ when done.",
            how: "Click to tick or untick. It writes to your real Habits module for that date (streaks and +5 XP).",
          },
          {
            name: "By section",
            what: "Each section with today's focus time and tasks done/total.",
          },
          {
            name: "KPIs — today",
            what: "A table of every KPI: section, name and value (Yes / —, the text, or the number with its unit). “No KPIs defined. Add them per section in Overview.”",
          },
          {
            name: "Health — today",
            what: "Sleep duration (h) (decimal), Time awake, Time in bed, and Cheat meal (bad) as a No / ✕ Yes toggle.",
            how: "Type a value and click away to save. Click the cheat meal button to switch it.",
          },
          {
            name: "Today's journaling",
            what: "Four boxes — What I did well today · What wasn't good · How I'll improve tomorrow · Key lessons / notes — and Energy 1–5 circles.",
            how: "Each box saves when you click away. Click an energy number; click it again to clear.",
          },
          {
            name: "Tasks (section tab)",
            what: "Today's tasks for this section: a circle (done), the title, focus time, a timer button and ×. “No tasks yet for this section today.” An “Add a task…” box with +.",
            how: "Type and press Enter. The timer button starts a stopwatch on the task. Click the title to open the full task panel. × deletes the task for good.",
          },
          {
            name: "KPIs — today (section tab)",
            what: "Number boxes (with “/ target”), yes/no circles, or text boxes.",
            how: "Numbers and text save when you click away; yes/no saves on click.",
          },
          {
            name: "Section reference",
            what: "A fold-out card with the section's goals (read only) and syllabus. “Goals & syllabus for this section — managed in Overview.”",
          },
        ],
      },
      {
        route: "/challenges/[id] (Days table · Health tracker)",
        title: "Days table and Health tracker",
        purpose: "See the whole challenge at once: every day's metrics side by side, and your sleep over time.",
        elements: [
          {
            name: "Days table",
            what: "“Every day and all its key metrics, side by side.” Columns Day, Date, Focus, Tasks, Habits, Energy, Sleep, Wake, Bedtime, Cheat, then one column per habit (✓ / —) and one per KPI (e.g. “24 / 30 pages”, Yes, or text). The header row and the Day column stay in place when you scroll.",
          },
          {
            name: "Average Sleep Duration",
            what: "A big number: the mean sleep hours of all logged days.",
          },
          {
            name: "Sleep Duration chart",
            what: "A line chart of sleep hours per day with the value on each point and dd/mm dates. It shows 14 days at a time.",
            how: "When there are more than 14 days, drag the slider under the chart to move through time.",
          },
          {
            name: "Health table",
            what: "Date (day name), Sleep Duration, Time Awake, Time In Bed and Cheat Meal (red ✕ Yes).",
          },
        ],
      },
    ],
    frameworks: [
      {
        term: "Challenge",
        definition: "A time-boxed, intense personal push with a clear outcome, logged every day.",
        example: "“38-Day AI Agency Sprint — outcome: 3 paying clients and a working delivery system.”",
      },
      {
        term: "Challenge section",
        definition: "One stream of work inside a challenge. Each section has its own tasks, goals, KPIs and syllabus.",
        example: "Sections: Learning, Sales, Build, Content.",
      },
      {
        term: "Section syllabus",
        definition: "The curriculum or reference for a section, written in markdown. You read it inside each day under Section reference.",
        example: "Learning: “Week 1 — prompt engineering course modules 1–4; Week 2 — build 2 demo agents.”",
      },
      {
        term: "Section goals",
        definition: "Checkpoints for a section that you tick when reached. They are separate from your 12-week goals.",
        example: "Sales: “50 personalised DMs sent”, “5 discovery calls held”.",
      },
      {
        term: "Challenge KPI",
        definition: "A number you log every day for a section. Types: number (with unit and target), yes/no, or text. Good KPIs are lead measures — things you control daily.",
        example: "Learning: Pages read (number, pages, target 30). Sales: Follow-ups done (yes/no).",
        source: "Lead measures (The 4 Disciplines of Execution)",
      },
      {
        term: "Challenge day",
        definition: "One logged day of the challenge with its tasks, KPI values, habits, health and journal. You create it with + in the side panel.",
      },
      {
        term: "Habit strip",
        definition: "The challenge's habits shown on every day. Ticking one writes to your real Habits module for that date.",
        example: "Gym ✓, Quran ✓, Journal — .",
      },
      {
        term: "Health tracker",
        definition: "Sleep duration, wake time, bed time and cheat meals per day, with an average and a sleep chart.",
        example: "Average sleep 6.4h over 20 days → the next push starts with a fixed bedtime.",
      },
      {
        term: "Day journaling",
        definition: "Four short reflections every evening — what went well, what wasn't good, how to improve tomorrow, key lessons — plus energy 1–5.",
        source: "After Action Review (US Army); Start / Stop / Continue",
      },
      {
        term: "Challenge life area",
        definition: "Creating a challenge also creates a life area with the same name. All challenge tasks and new challenge habits live there, so their focus hours show on that area and in Analytics.",
      },
      {
        term: "Goal link (Serves goal)",
        definition: "Link the challenge to one 12-week or annual goal, so the push clearly serves your direction.",
        example: "Challenge “38-Day AI Agency Sprint” serves the 12-week goal “3 paying AI clients”.",
      },
    ],
    testing: [
      "Open Challenges (Work → Challenges). Click New Challenge.",
      "Type an icon 🚀, name “Test challenge”, an outcome; Section 1 “Learning”; + Add KPI → “Pages read”, number, unit “pages”, target 30; + Add section → “Sales”. Click Create challenge. Expected: the workspace opens on Overview with 2 sections; a life area “Test challenge” now exists.",
      "Open the Learning row. Add a goal “Finish module 1” and a syllabus, click Save. Expected: “· 1 goals · 1 KPIs” and the rendered syllabus.",
      "In Habits, type “Gym” and click Create. Expected: a blue chip “Gym”.",
      "Click + next to DAYS. Expected: a day named with today's weekday and date opens on the Overview tab.",
      "Click the Gym chip. Expected: it turns blue with ✓; Habits done shows 1/1. Open the Habits page: Gym is done today.",
      "Click the Learning tab. Add a task “Read chapter 1”. Type 24 in Pages read and click away. Expected: the task appears; the KPI shows 24 / 30.",
      "Click the timer button on the task, wait 40 seconds, then use the top-bar pill to Stop & log. Expected: the task shows its focus time and Focus today goes up.",
      "Back on Overview fill Sleep duration 7.5 and the journal, click energy 4. Expected: Energy shows 4/5.",
      "Open Days table. Expected: one row with Focus, Tasks 0/1, Habits 1/1, Energy 4/5, Sleep 7.5, Gym ✓ and “24 / 30 pages”.",
      "Open Health tracker. Expected: Average Sleep Duration 7.5 and one point on the chart.",
      "Pick a goal in Serves goal. Go back to Challenges. Expected: the card shows the goal title.",
    ],
    tips: [
      "Keep 3–5 sections and 1–3 KPIs per section. More than that becomes admin.",
      "Create the day first thing in the morning; it makes the plan real.",
      "The × on a challenge task deletes the task everywhere.",
    ],
  },

  // ───────────────────────────────────────────────────────────────────────
  // CALENDAR
  // ───────────────────────────────────────────────────────────────────────
  {
    id: "calendar",
    group: "Work",
    title: "Calendar",
    summary:
      "Time-block your days (sidebar: Calendar, page title: Schedule). Blocks link to a task, project, goal and life area, can repeat daily or weekly, and are marked planned, done or skipped. Marking a block done logs it as focus time. Stat cards and a schedule-vs-focus gap card show how well you plan.",
    why:
      "A task list says what; a calendar says when. Time blocks protect deep work from meetings and make the day realistic. The gap card shows whether you plan too much or too little for each task, so your planning gets more accurate every week.",
    when: {
      daily: "Morning: check today's blocks and add one for each Top 3 task. Evening: open each block and mark it done or skipped.",
      weekly:
        "Plan next week's key blocks (deep work first). Read Adherence and the gap card: over-scheduled tasks need smaller blocks or more focus.",
      monthly: "Switch to Month and check the balance of your Top area.",
      oneTime:
        "Build your Ideal Week on the Week page and apply it — it fills the calendar with typed blocks (maker, manager, admin, routine, free). Create repeating blocks for fixed habits (workout, weekly review).",
    },
    pages: [
      {
        route: "/schedule",
        title: "Calendar (Schedule)",
        purpose: "Plan your time in blocks, mark what really happened, and compare planned time with real focus.",
        elements: [
          {
            name: "New block (button)",
            what: "In the top bar. Opens the New schedule block window for the day in view at 9:00–10:00.",
          },
          {
            name: "Schedule (page header)",
            what: "Title with “Time-block your day and link it to tasks, projects, goals & life areas.”",
          },
          {
            name: "Day · Week · Month (switch)",
            what: "Changes the view. Weeks run Sunday to Saturday here.",
          },
          {
            name: "Scheduled (stat card)",
            what: "Hours of blocks in the window you see (sub-line “day plan”, “week plan” or “month plan”). In Month view it counts the calendar month.",
          },
          {
            name: "Actually focused (stat card)",
            what: "All focus hours logged in the window (timer, manual logs and done blocks). Sub-line “Logged this window”.",
          },
          {
            name: "Adherence (stat card)",
            what: "Done blocks ÷ all blocks × 100, with “3/5 done”.",
          },
          {
            name: "Top area (stat card)",
            what: "The life area with the most scheduled hours, with “Xh scheduled”.",
          },
          {
            name: "Schedule vs. focus gap (card)",
            what: "“— planning accuracy per task”. For every task linked to a block in this window: scheduled minutes vs real focus minutes. Three boxes: Avg gap / task (signed, with a verdict: Over-scheduled, Under-scheduled or Well calibrated), Scheduled (“across N tasks”) and Real focus (“N tracked”). Then up to 8 task rows: title, area · blocks · sessions (or “no focus tracked”), a signed gap chip, and two bars Plan vs Focus. A Show less / Show all link.",
            how: "Amber + gap = you blocked more than you focused: make the block smaller or protect it better. Blue − gap = you out-worked the plan: give it more time. Empty card: link tasks to blocks and track focus on them.",
          },
          {
            name: "Navigation (‹ · Today · › · title)",
            what: "Move one day, week or month back or forward; Today jumps to today. The title shows the date or range.",
          },
          {
            name: "Timeline (Day and Week views)",
            what: "One column per day with a 24-hour grid. Blocks sit at their times: purple tint = planned, green = done, grey and struck through = skipped. The left border has the life area colour. Tasks that have a start time show as dashed boxes with “· task”.",
            how: "Click an empty hour to create a block at that hour. Click a block to edit it. Click a dashed task to go to the Tasks page. Scroll down for the morning and evening hours.",
          },
          {
            name: "Month view",
            what: "A month grid. Each day shows its number (today in a filled circle), up to 3 blocks with start times, up to 2 tasks with start times, and “+N more”.",
            how: "Click the day number or a block to open that day. Hover a day and click + to add a block.",
          },
        ],
      },
      {
        route: "/schedule (block window)",
        title: "New schedule block / Edit block",
        purpose: "Create or change one time block, link it, repeat it, and mark what happened.",
        elements: [
          {
            name: "What are you doing?",
            what: "The block title. Empty titles become “Untitled block”.",
          },
          {
            name: "Date, start time, end time",
            what: "Three fields in one row. If the end is before the start, the block is saved as 5 minutes long.",
          },
          {
            name: "Life area… · Task… · Project… · Goal…",
            what: "Four link lists. Task lists only open tasks.",
            how: "Pick a task: if the title, area or project are empty they are filled from the task. Link a task to see it in the gap card.",
          },
          {
            name: "Notes (optional)",
            what: "A small text box for details.",
          },
          {
            name: "Repeat (new blocks only)",
            what: "Doesn't repeat / Daily / Weekly. Weekly shows day circles Su Mo Tu We Th Fr Sa. “Until (optional)” date.",
            how: "Without an end date, Daily creates the next 60 days and Weekly the next 8 weeks (at most 120 blocks). Weekly with no day picked repeats on the start date's weekday.",
          },
          {
            name: "planned · done · skipped (edit only)",
            what: "Status buttons that save at once. “✓ logged as focus time” appears when a block is done.",
            how: "Done creates a focus session for the block's time, linked to its task, project and area (deep or shallow if the block type is maker or manager). Setting it back to planned or skipped deletes that session. The highlight may only update after you close and reopen the window.",
          },
          {
            name: "Add to schedule / Save changes",
            what: "Saves the block (disabled without a date).",
          },
          {
            name: "Trash (edit only)",
            what: "Deletes this block (and its auto-logged focus session) at once.",
          },
          {
            name: "Delete this & all future occurrences in the series",
            what: "Shown for repeating blocks. Deletes this block and every later one in the same series.",
          },
        ],
      },
    ],
    frameworks: [
      {
        term: "Time blocking",
        definition: "Give every important piece of work a fixed slot in your calendar, instead of working from a list all day.",
        example: "Tue 9:00–12:30 “Acme delivery deep work”, 13:30–15:00 “Outreach & follow-ups”.",
        source: "Deep Work (Cal Newport)",
      },
      {
        term: "Maker vs manager schedule",
        definition: "Protect long maker blocks for building and creating; group short manager slots for calls and admin.",
        source: "“Maker's Schedule, Manager's Schedule” (Paul Graham, 2009)",
      },
      {
        term: "Block types",
        definition: "Maker = deep, half-day build work. Manager = calls, office hours, outreach. Admin = processes, finance, pipeline review. Routine = rituals and workouts. Free = protected rest. Types come from your Ideal Week when you apply it; the block window has no type picker. Free blocks do not count as planned work in Analytics.",
        example: "Monday: Workout (routine), Start-up ritual (routine), Delivery deep work (maker), Client calls (manager), Shutdown ritual (routine).",
      },
      {
        term: "Ideal Week",
        definition: "A template of your perfect week (day types and typed blocks). Applying it fills the calendar without overlaps or duplicates and skips your Free Day.",
        source: "Ideal Week (Michael Hyatt); Founder OS default week",
      },
      {
        term: "Recurring block (series)",
        definition: "A block that repeats daily or weekly until a date. All copies share a series, so you can delete the future ones in one click.",
        example: "Weekly review every Friday 14:00–15:30 until the end of the year.",
      },
      {
        term: "Block status",
        definition: "Planned = still to come. Done = it happened (auto-logged as focus). Skipped = it did not happen (no focus logged).",
      },
      {
        term: "Adherence",
        definition: "Done blocks ÷ all blocks in the window × 100. It shows how much of your plan you really did.",
        example: "8 of 10 blocks done this week = 80% adherence.",
      },
      {
        term: "Schedule vs. focus gap",
        definition: "Per task: scheduled minutes − real focus minutes (timer and manual logs only; block completions are not counted as focus). Positive = over-scheduled, negative = under-scheduled. The average gap across tasks gives the verdict (more than +4 min = Over-scheduled, less than −4 min = Under-scheduled).",
        example: "Blocked 3h for “Write proposal”, focused 1h 50m → gap +1h 10m (over-scheduled).",
        source: "Planning fallacy (Kahneman & Tversky)",
      },
    ],
    testing: [
      "Open Calendar (Today group → Calendar). Expected: “Schedule”, the Day/Week/Month switch, four stat cards, the gap card and the week timeline.",
      "Click an empty slot at 10 AM today. Expected: the window opens with today, 10:00–11:00.",
      "Type “Test block”, pick a task and an area, click Add to schedule. Expected: a purple block at 10 AM with the area colour on its left; Scheduled goes up by 1h.",
      "Click the block → done. Close and reopen it. Expected: “done” is highlighted with “✓ logged as focus time”; the block turns green; Adherence and Actually focused go up; the Focus page shows a 60-minute session.",
      "Set the block back to planned. Expected: the focus session is removed.",
      "Create a block with Repeat = Weekly, Mo and We, Until in 3 weeks. Expected: blocks appear on those days only, up to that date.",
      "Open one of them → Delete this & all future occurrences in the series. Expected: that block and the later ones disappear; earlier ones stay.",
      "Run a 1-minute timer on the task you linked, then check the gap card. Expected: the task row shows Plan vs Focus bars and a signed gap.",
      "Switch to Month. Hover a day and click +. Expected: a new block window for that day at 9:00.",
    ],
    tips: [
      "Block your deep work first, then let meetings fill around it.",
      "Mark blocks done or skipped at the shutdown — honest data makes the gap card useful.",
      "Leave 20% of the day unblocked for surprises.",
    ],
  },

  // ───────────────────────────────────────────────────────────────────────
  // ANALYTICS
  // ───────────────────────────────────────────────────────────────────────
  {
    id: "analytics",
    group: "System",
    title: "Analytics",
    summary:
      "Analytics · Progress & Growth: one page that shows your growth across the whole Life OS for 4 weeks, 12 weeks, 26 weeks or a year, compared with the same span before. Six headline numbers, ranked insights, and eight sections: Growth, Consistency, Execution, Founder flywheel, Content, Time, and Mind & body.",
    why:
      "You cannot improve what you never look at. This page turns your daily clicks into trends: are you executing at 85%, is the pipeline growing, which day is best for deep work, does sleep change your energy? Every chart links to the module where you fix it, and every chart has a table view.",
    when: {
      daily: "Nothing to do daily. Today is your daily home.",
      weekly: "In the weekly review open Analytics on 4w. Read the headline insights and the Execution score.",
      monthly: "Switch to 12w. Check Consistency, the Founder flywheel and Time vs targets.",
      quarterly: "Switch to 26w or 1y before planning a new 12-week cycle. Look for the trend, not the single week.",
      oneTime:
        "Set your currency, outreach quota (per day), content weekly target and area hour targets in Settings and Life Areas — the charts use them as target lines.",
    },
    pages: [
      {
        route: "/dashboard",
        title: "Analytics — header, KPI row and insights",
        purpose: "Choose the time range and read the six headline numbers and the top insights.",
        elements: [
          {
            name: "Analytics · Progress & Growth (page header)",
            what: "Title and a line like “Your growth across the Life OS for the last 12 weeks, compared with the 12 weeks before. Your daily home is Today.”",
          },
          {
            name: "Range switch (4w · 12w · 26w · 1y)",
            what: "Scopes every number and chart. The period is that many Monday-weeks ending with this week (this week is partial). “vs prev” compares with the same number of days just before. Your choice is remembered in this browser.",
            how: "Click a range. While the new range loads, the old charts stay visible but faded.",
          },
          {
            name: "KPI card (common parts)",
            what: "Each of the six cards shows a label and icon, the big value, a sub-line, a change line (green ↑ up, amber ↓ down, “No change” or “No earlier data”) with “vs prev”, and a weekly sparkline. The whole card is a link.",
          },
          {
            name: "Level",
            what: "“L5 Operator”. Change = XP this period vs the previous one. Footer: total XP, XP left to the next level and a progress bar. Opens Today.",
          },
          {
            name: "Ritual streak",
            what: "“12d · best 20”. Change = ritual days this period vs before. Sparkline = ritual days per week. Opens Today.",
          },
          {
            name: "Avg day score",
            what: "Average day score “/ 100” of logged days. Change in points. Opens Journal.",
          },
          {
            name: "Execution",
            what: "Average weekly execution % with “bar 85%”, or “—” and “no cycle”. Change in points. Opens Goals.",
          },
          {
            name: "Revenue won",
            what: "Value of deals won in the period, with “N deals”. Opens Pipeline.",
          },
          {
            name: "Content shipped",
            what: "Pieces published in the period. Opens Content Studio.",
          },
          {
            name: "Headline insights",
            what: "Up to 6 automatic insights, most important first (execution trend, revenue, sleep vs energy, best deep-work day, best hook type, outreach quota, ritual streak, promises, habits, XP, content, recall retention). Each card has a tone icon (green = improving, amber = needs attention, grey = note) and links to the module.",
            how: "Click a card to go and act on it. Empty: “Insights appear as you log rituals, tasks, focus sessions, deals and content.”",
          },
          {
            name: "Ask AI for more",
            what: "A button that asks the AI for 3 extra insights about focus balance, habits and priorities (title + one action sentence), shown in blue-tinted cards. It says “Thinking…” while working and “Ask AI again” after.",
            how: "Click it. If the AI fails: “The AI couldn't answer right now. Try again in a moment.”",
          },
          {
            name: "Chart card controls (every chart)",
            what: "Title and hint, a Table icon (switch to a table of the numbers and back to the chart), an Open ↗ link to the module, sometimes a stat row of headline numbers, hover tooltips, and an empty state with a button when there is no data yet.",
            how: "Hover or tap a bar or point to read the exact value. Click the chart and use the arrow keys to move through weeks.",
          },
        ],
      },
      {
        route: "/dashboard (Growth)",
        title: "Growth",
        purpose: "“XP is the running score of everything you do in the OS. Levels mark the compounding.”",
        elements: [
          {
            name: "Cumulative XP",
            what: "Line (with filled area) of your total XP at the end of each week. Stat row: Total XP, This period (+XP), Levels gained (“now L5 Operator”).",
          },
          {
            name: "XP per week by source",
            what: "Stacked columns of XP per week in five groups: Rituals & habits, Tasks & tactics, Sales & promises, Content, Learning & reviews. Stat line “Period mix: Rituals 40% · Tasks 30% …”. The table shows all eight raw sources (Rituals, Tasks & tactics, Sales & promises, Content, Learning, Habits, Reviews, Other).",
          },
        ],
      },
      {
        route: "/dashboard (Consistency)",
        title: "Consistency",
        purpose: "“Show up daily. Free days and reserve shields never break the streak.”",
        elements: [
          {
            name: "Daily consistency (heatmap)",
            what: "Hint “Each square is a day, coloured by its day score”. Columns = Monday-weeks, rows Mon–Sun. Five shades: 0–19, 20–39, 40–59, 60–79, 80–100. Grey = not logged. Outlined = Free day. Stat row: Streak (“N shields left”), Best, Start-up %, Shutdown %, Avg score. A Journal ↗ link.",
            how: "Hover a square (or use arrow keys) to read the day: day score, “Ritual done” or “No ritual”, and “Free day”.",
          },
          {
            name: "Average day score",
            what: "Line of the mean day score of logged days per week (0–100).",
          },
          {
            name: "Rituals per week",
            what: "Grouped columns: Start-ups and Shutdowns completed per week (max 7). The tooltip adds routines completed.",
          },
          {
            name: "Inbox: captured vs processed",
            what: "Grouped columns per week: items captured (grey) and processed (colour). Hint “N items open right now”. Opens Inbox.",
          },
        ],
      },
      {
        route: "/dashboard (Execution)",
        title: "Execution",
        purpose: "“Lead measures done ÷ planned each week (tactics + goal habits). 85% is the 12-week bar.”",
        elements: [
          {
            name: "No cycle yet",
            what: "Without any 12-week cycle you see “Start your first 12-week cycle to see execution history” with Plan a 12-week cycle.",
          },
          {
            name: "Weekly execution score",
            what: "Line of the execution % per week with an 85% reference line. Hint: “<cycle> · week N of 12”. The tooltip shows the cycle week or “outside a cycle”. Stat row: Avg, full weeks (and prev) and Weekly reviews (“N of W weeks”).",
          },
          {
            name: "Weekly Big 3",
            what: "Stacked columns per week: Done and Not done of your weekly Big 3. Stat row: Completed % (“N of M”) and Previous.",
          },
          {
            name: "12-week goals · key results",
            what: "One card per goal of the current cycle: the title (link), an On pace (green) or Behind pace (amber) chip, “Key results 45% · 50% of cycle elapsed”, a bar with a marker at the time elapsed, and up to 4 key results “current / target unit (pct%)”. Hint shows the % elapsed and days left.",
          },
        ],
      },
      {
        route: "/dashboard (Founder flywheel)",
        title: "Founder flywheel",
        purpose: "“Content earns attention, attention becomes leads, leads become deals, deals become revenue.”",
        elements: [
          {
            name: "From content to revenue (flywheel)",
            what: "Seven stage cards left to right: 1 Content published, 2 Views, 3 Follows, 4 Leads, 5 Deals created, 6 Deals won, 7 Revenue won. Each shows the value and the change vs prev. Stage 1: “Where the flywheel starts”. Views: “avg per piece”. Follows to Deals won: “% of <previous stage>” with a bar. Revenue: “avg per deal”. The weakest step gets a “Biggest drop” badge. A Founder HQ ↗ link.",
          },
          {
            name: "Flywheel footnote",
            what: "“Deals count every channel (outreach, referrals, inbound); N came from content. Win rate X% · open pipeline $Y in N deals · N live offers · N live campaigns.”",
          },
          {
            name: "Outreach vs quota",
            what: "Columns of outreach + follow-up touches per week with a Weekly quota line (daily quota × 5 workdays). The tooltip adds meetings / calls. Stat row: Touches (prev), Weeks at quota.",
          },
          {
            name: "Pipeline value",
            what: "Line (filled) of the value of open deals at the end of each week. Stat: Open now (“N deals”).",
          },
          {
            name: "Won revenue",
            what: "Columns of revenue won per week; the tooltip adds deals won and deals created. Stat row: This period (prev), Win rate.",
          },
          {
            name: "Promise-keeping",
            what: "Line of the share of “I owe” promises kept on time, by the week they were due, with an 85% line. Stat row: Kept on time (“N due”), Previous.",
          },
          {
            name: "Scorecard on target",
            what: "Shown only if you log a scorecard: the share of this week's scorecard numbers that hit their target.",
          },
        ],
      },
      {
        route: "/dashboard (Content)",
        title: "Content",
        purpose: "“Reps build the brand. Volume first, then hooks and retention.”",
        elements: [
          {
            name: "Published per week",
            what: "Stacked columns Personal vs Company with a Weekly target line. Stat row: Shipped (prev), Personal, Company.",
          },
          {
            name: "60-day short-form lab",
            what: "Per brand: “week N of 8” (or finished / starts …), “total / 50 shorts shipped”, and 8 weekly bars with a target line at 3, 5, 7, 7, 7, 7, 7, 7 shorts. The current week says “now”.",
          },
          {
            name: "Performance per piece",
            what: "Stat row: Avg views (prev), Avg follows, Measured (“of N”). A 3-second hold bar: Under 50%: fix the hook (red), 50–69%: okay (amber), 70%+: banger (green). Then Swipes saved, Avg outlier, Workflow steps (avg) and In production.",
          },
          {
            name: "Best hook types",
            what: "Horizontal bars of average views per hook type (top 6), with “N pieces · X follows avg”.",
          },
        ],
      },
      {
        route: "/dashboard (Time)",
        title: "Time",
        purpose: "“Where the hours actually went, against what you planned and what each area deserves.”",
        elements: [
          {
            name: "Hours by life area",
            what: "Stacked columns of focus hours per week by area. The first five areas get colours; the rest and unattributed time fold into a grey “Other”. A target line = the sum of all areas' weekly targets. Stat row: Deep work (all focus hours in the period, with prev) and Per week.",
          },
          {
            name: "Deep work: planned vs actual",
            what: "Grouped columns per week: Planned (calendar blocks, not Free blocks) vs Actual (focus hours). Stat row: Planned, Focused, Blocks done. The table adds Maker hours.",
          },
          {
            name: "Area time vs target",
            what: "Horizontal bars of average focus hours per week for each area, with a marker at its weekly target. If you log a time audit, a line shows hours logged, % high-value, % energising and % draining.",
          },
          {
            name: "Focus by weekday",
            what: "Average focus per weekday (Mon–Sun). Your best day is highlighted; the hint names it.",
          },
        ],
      },
      {
        route: "/dashboard (Mind & body)",
        title: "Mind & body",
        purpose: "“Energy fuels everything else. Learning compounds when you recall and practise.”",
        elements: [
          {
            name: "Energy & mood",
            what: "Two lines (1–5): weekly averages of morning check-in energy and mood. Stat row: Check-ins (days), Avg energy.",
          },
          {
            name: "Sleep",
            what: "Line of average hours slept per night by week, with a 7h reference line.",
          },
          {
            name: "Recall reviews",
            what: "Columns of recall cards reviewed per week; the tooltip adds retention. Stat row: Reviews (prev), Retention (prev).",
          },
          {
            name: "Practice by learning area",
            what: "Horizontal bars of minutes practised per learning area, with a marker at weekly target × weeks. Stat row: Practice (hours), Notes created, Resources done.",
          },
          {
            name: "Habit consistency",
            what: "One bar per active habit: done (full, minimum or stretch) ÷ expected, capped at 100%, with “N of M · N minimum · N stretch · N planned skips”. Stat: Average and number of active habits.",
          },
        ],
      },
    ],
    frameworks: [
      {
        term: "Period and “vs prev”",
        definition: "The current period is the last 4, 12, 26 or 52 Monday-weeks up to today. The previous period is the same number of days just before it. Every change line compares the two.",
        example: "12w on Tue Oct 20: period = Jul 28 → Oct 20; previous = the 85 days before Jul 28.",
      },
      {
        term: "XP and levels",
        definition: "XP is points for every action in the OS. Level n starts at 50 × (n − 1)² XP: L2 at 50, L3 at 200, L5 at 800, L10 at 4,050. A new title every two levels: Starter, Builder, Operator, Closer, Creator, Strategist, Founder, Architect, Visionary, Legend.",
        example: "Start-up 25, shutdown 25, check-in 10, task 5 (+15 for a Top 3 task), habit 5 (minimum version 3), routine 10, journal 5, outreach touch 2, promise kept 10, deal advanced 10, deal won 100, content published 40, tactic 8, practice 10, recall card 1, inbox item processed 2, weekly review 120, monthly 150, quarterly 300, annual 500.",
        source: "bishOS XP system (gamification of the Life OS)",
      },
      {
        term: "Cumulative XP",
        definition: "Your total XP at the end of each week, including everything earned before the period. The line only goes up; a steeper slope = a better week.",
      },
      {
        term: "XP by source",
        definition: "Where XP came from. Rituals = start-up, shutdown, check-in, journal, routines, inbox and note processing. Reviews = periodic reviews, decision reviews, scorecard. Tasks & tactics = tasks, Top 3, Big 3, tactics, issues solved, decisions. Sales & promises = deals, outreach touches, promises, offers, campaigns. Content = published pieces. Learning = practice and recall. Habits = habit check-ins. Other = anything else.",
        example: "Period mix “Rituals 45% · Tasks 30% · Sales 10%” → lots of planning, not much selling.",
      },
      {
        term: "Day score",
        definition: "A 0–100 score for one day. If the shutdown saved a score, that one is used. Otherwise: start-up done = 20, Top 3 done share × 30, daily habits done share × 20 (skips are removed from the count), shutdown done = 20, a progress line or journal win = 10.",
        example: "Start-up ✓, 2 of 3 Top 3 done, 3 of 4 habits, no shutdown, progress line ✓ → 20 + 20 + 15 + 0 + 10 = 65.",
      },
      {
        term: "Heatmap score",
        definition: "Each square's colour is the day score in five shades (0–19, 20–39, 40–59, 60–79, 80–100). Grey means nothing was logged; an outline means a Free day.",
      },
      {
        term: "Ritual streak and reserve shields",
        definition: "A day counts when you did the start-up OR the shutdown. Free days are neutral. Up to 2 missed days per Monday–Sunday week are absorbed by reserve shields. Today not done yet does not break it. Best = the longest run with the same rules.",
        example: "Rituals Mon–Wed, missed Thu, rituals Fri → streak continues; 1 shield left this week.",
        source: "Forgiving streaks (habit research: repairable streaks keep motivation)",
      },
      {
        term: "Ritual % (Start-up % / Shutdown %)",
        definition: "Days with that ritual ÷ eligible days. Eligible days = days since your first logged day, not Free days, and in the past (today counts only after you did a ritual).",
        example: "20 eligible days, 17 start-ups → Start-up 85%.",
      },
      {
        term: "Inbox captured vs processed",
        definition: "How many items you captured and how many you processed (or discarded) each week. Processed should keep up with captured.",
        source: "Getting Things Done (David Allen)",
      },
      {
        term: "Execution score",
        definition: "For one week: the sum of min(done, target) over all tactics and goal-linked habits of the cycle's goals, ÷ the sum of their targets, × 100. A score frozen in your weekly review wins over the live one. The period average leaves out the current, unfinished week (unless it is the only one).",
        example: "Tactic “20 outreach” done 18/20, tactic “2 videos” 2/2, habit “gym 3×” 2/3 → (18 + 2 + 2) ÷ (20 + 2 + 3) = 88%.",
        source: "The 12 Week Year (Brian Moran & Michael Lennington)",
      },
      {
        term: "The 85% bar",
        definition: "If you execute 85% of your weekly plan, you will very likely reach your 12-week goals. It is the reference line on the execution and promise-keeping charts.",
        source: "The 12 Week Year",
      },
      {
        term: "Weekly Big 3 completion",
        definition: "Big 3 outcomes done ÷ Big 3 planned, over the period.",
        example: "12 weeks, 33 planned, 24 done → 73%.",
      },
      {
        term: "KR progress vs time elapsed (pace)",
        definition: "Goal progress = the average of its key results, each min(1, current ÷ target). Time elapsed = days passed ÷ 84 days of the cycle. A goal is On pace when progress ≥ time elapsed − 5 points.",
        example: "KRs at 40% and 60% → 50%. Cycle 52% elapsed → On pace (50 ≥ 47).",
        source: "OKRs (John Doerr); The 12 Week Year",
      },
      {
        term: "Founder flywheel",
        definition: "The chain that turns content into revenue: Content published → Views → Follows → Leads → Deals created → Deals won → Revenue won. Views, follows and leads come from each published piece's most mature performance snapshot (30d, else 7d, else 24h). Deals count every channel.",
        source: "Flywheel effect (Jim Collins); content-led growth",
      },
      {
        term: "Flywheel conversion %",
        definition: "A stage's value ÷ the previous stage's value × 100 (for Follows, Leads, Deals created and Deals won). Views show “avg per piece” instead, and Revenue shows “avg per deal”. “Biggest drop” marks the lowest conversion below 100%.",
        example: "2,000 follows → 20 leads = 1% of follows; 20 leads → 5 deals created = 25%.",
      },
      {
        term: "Win rate",
        definition: "Deals won ÷ (won + lost) in the period × 100.",
        example: "3 won, 9 lost → 25%.",
      },
      {
        term: "Pipeline value",
        definition: "The total value of deals that were open at the end of each week (stages target, contacted, booked, discovery, proposal, verbal). “Open now” is today's total.",
      },
      {
        term: "Outreach quota",
        definition: "Your daily target of outreach and follow-up touches (Settings, default 20). The weekly line is quota × 5 workdays. “Weeks at quota” counts weeks that reached it.",
      },
      {
        term: "Promise-keeping",
        definition: "Of your “I owe” promises due in a week (done, broken, or still open after the date), the share done on or before the promised date.",
        example: "5 promises due, 4 done on time → 80% (below the 85% line).",
      },
      {
        term: "Scorecard on target",
        definition: "Share of a week's scorecard entries that hit their target (at or above for “up” metrics, at or below for “down” metrics).",
        source: "EOS Scorecard (Gino Wickman, Traction)",
      },
      {
        term: "60-day short-form lab",
        definition: "An 8-week experiment to find your short-video format: ship 3, then 5, then 7 shorts a week (50 in total). Shorts and stories count.",
      },
      {
        term: "3-second hold",
        definition: "The share of viewers still watching after 3 seconds. 70%+ is a banger, 50–69% is okay, under 50% means fix the hook.",
        source: "Kallaway short-form framework",
      },
      {
        term: "Outlier score (swipes)",
        definition: "A saved video's views ÷ the creator's average views. 3× means it did three times better than normal — a format worth studying.",
      },
      {
        term: "Hours by area (attribution)",
        definition: "Each focus session counts for its own area, else its task's area, else its project's area, else Unattributed. The Time section counts focus sessions (a done calendar block counts through its auto-logged session).",
      },
      {
        term: "Deep work: planned vs actual",
        definition: "Planned = hours of calendar blocks (Free blocks excluded). Actual = focus hours logged. A big gap means the calendar is a wish, or you do not log your focus.",
      },
      {
        term: "Area time vs target",
        definition: "Total focus hours of an area ÷ weeks elapsed, against its weekly target.",
        example: "Sales: 30h over 12 weeks = 2.5h/week vs a 10h target → Sales is starving.",
      },
      {
        term: "Focus by weekday",
        definition: "Focus minutes on each weekday ÷ how many of that weekday fell in the period. The highest is your best day for deep work.",
      },
      {
        term: "Time audit split",
        definition: "From the time audit: % of logged minutes rated high-value (value 3+), % energising and % draining.",
        source: "Buy Back Your Time (Dan Martell)",
      },
      {
        term: "Energy trend",
        definition: "The weekly average of your morning energy and mood (1–5). Watch the direction, not one day. An insight compares energy after 7h+ sleep with shorter nights.",
      },
      {
        term: "Sleep (7h line)",
        definition: "Average hours slept per night by week, from morning check-ins. The 7h line is the healthy minimum for most adults.",
        source: "Why We Sleep (Matthew Walker)",
      },
      {
        term: "Recall retention",
        definition: "Of graded recall reviews (cards in review state), the share rated 2 or higher (remembered).",
        example: "50 graded reviews, 42 remembered → 84%.",
        source: "Spaced repetition (Ebbinghaus; SM-2)",
      },
      {
        term: "Practice by learning area",
        definition: "Minutes of deliberate practice per learning area in the period, against weekly target × weeks elapsed.",
        source: "Deliberate practice (Anders Ericsson)",
      },
      {
        term: "Habit consistency",
        definition: "For each active habit: check-ins (full, minimum or stretch) ÷ expected check-ins (weekly target × active days ÷ 7), capped at 100%. Active days start at the later of the period start, the habit's start date and its creation.",
        example: "Daily habit, 14 active days, 11 check-ins → 79%.",
        source: "Atomic Habits (James Clear)",
      },
      {
        term: "Headline insights",
        definition: "Short sentences the system writes from your data, ranked by importance; the top 6 show. Green = improving, amber = needs attention, grey = a note.",
      },
    ],
    testing: [
      "Open Analytics (System → Analytics). Expected: the title “Analytics · Progress & Growth”, the range switch on 12w, six KPI cards, Headline insights and the eight sections.",
      "Click 4w. Expected: the charts fade for a moment, then show 4 weeks; the subtitle says “last 4 weeks”. Reload. Expected: 4w is still selected.",
      "Do today's start-up ritual on Today, then come back. Expected: Level XP rises by 25; today's heatmap square gets a colour; Rituals per week goes up by one start-up.",
      "Click the Table icon on Cumulative XP. Expected: a table Week / XP earned / Cumulative, newest week first. Click it again to see the chart.",
      "Hover a column in XP per week by source. Expected: a tooltip with each group's XP and “XP that week”.",
      "Finish a 1-minute focus session on a task in an area. Expected: Hours by life area shows it in that area's colour; Focus by weekday updates.",
      "Mark a deal Won with a value in Pipeline. Expected: Revenue won KPI and the Won revenue chart include it; the flywheel's Deals won and Revenue won change.",
      "Click Ask AI for more. Expected: “Thinking…”, then 3 blue-tinted AI insight cards (or the friendly error line).",
      "Click any KPI card. Expected: it opens its module (e.g. Execution → Goals).",
      "With no 12-week cycle, check Execution. Expected: “Start your first 12-week cycle to see execution history” with a Plan a 12-week cycle button.",
    ],
    tips: [
      "Look at trends over at least 4 weeks; one week is noise.",
      "Open the table view when you want exact numbers for a review or an investor update.",
      "The “Deep work” number in the Time section counts all focus hours; use Focus → Deep share for deep-tagged time only.",
    ],
  },
];
