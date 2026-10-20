import type { GuideSection } from "../types";

/**
 * Direction group — Compass, Goals · 12 weeks, Week, Reviews, Habits, Routines.
 * Pure data (no runtime imports). Text matches the real UI labels and rules.
 */
export const sections: GuideSection[] = [
  // ───────────────────────────────────────────────────────────────────────
  // COMPASS
  // ───────────────────────────────────────────────────────────────────────
  {
    id: "compass",
    group: "Direction",
    title: "Compass",
    summary:
      "Your north star on one page: purpose, values, vision (overall and per life area), a not-to-do list, the year theme, a standard and an hour budget for each life area, and the Wheel of Life rating.",
    why:
      "When you know why you work and what “good” looks like, choices get easy. Goals, the Ideal Week, the Week page and the reviews all read from here. The Wheel of Life shows which part of your life needs the next goal before it turns into a crisis.",
    when: {
      oneTime:
        "First setup, about 15 minutes: write your purpose, 3–5 values, a 3–5 year vision, the not-to-do list and a year theme. Give every life area a standard and weekly hours. Once a year (annual review) rewrite the purpose and pick a new theme.",
      daily: "Nothing to do daily. Open it when you feel lost, or when you must choose between two good options.",
      monthly: "Rate every life area 1–10 on the Wheel of Life. The monthly review does this step for you and saves into the same chart.",
      quarterly: "Read your vision before you plan the next 12-week cycle. Change area standards or weekly hours if your life changed.",
    },
    pages: [
      {
        route: "/compass",
        title: "Compass",
        purpose:
          "Write down why you work, what you stand for and where you are going, then check every month how each life area is really doing.",
        elements: [
          {
            name: "Compass (page header)",
            what: "Page title with the line “Why you work, what you stand for, where you're headed — and how each area of life is really doing.”",
          },
          {
            name: "Year theme · … (chip)",
            what: "Small chip at the top right. It shows your year theme once you have one.",
            how: "Set it in the Year theme field below, or from the annual review (“Save as year theme”).",
          },
          {
            name: "Purpose",
            what: "A text box for why you do this work. Placeholder: “I build ___ so that ___. My work matters because…”. Hint: read it when you feel lost, rewrite it yearly.",
            how: "Just type. It saves by itself after a short pause or when you click away. A small “Saving” then “Saved” label confirms it.",
          },
          {
            name: "Year theme",
            what: "One word or one line for the whole year, for example “Leverage”.",
            how: "Type it. It autosaves and the header chip updates.",
          },
          {
            name: "Values",
            what: "A numbered list of your standards, in rank order. Hint: “Your standards, ranked. Use them to break ties.” If empty you see “Start with 3–5. Fewer values are easier to live by.”",
            how: "Type a value in “Add a value (e.g. Ship small, ship often)…” and press Enter. Click a value to edit it; clear the text to delete it, or hover and click ×. Number 1 wins every tie.",
          },
          {
            name: "Not-to-do list",
            what: "Things you decided to stop doing. Hint: “What you've decided to stop doing. Protects the yes.”",
            how: "Type an item (e.g. “No calls before noon…”) and press Enter. Click to edit, × to remove.",
          },
          {
            name: "Vision · 3–5 years",
            what: "A large text box for a vivid picture of success, written in the present tense. Placeholder: “It's 2030. The company… My days look like… I'm known for…”",
            how: "Write freely. It autosaves.",
          },
          {
            name: "Vision by area",
            what: "One small text box per life area: “In 3 years this area looks like…”. Each box has the area's colour dot and name. With no life areas you see “Add life areas first — they're the spine of everything else.”",
            how: "Write one or two lines per area. Leave a box empty to remove that area's vision.",
          },
          {
            name: "Area standards & weekly hours",
            what: "For every life area: a standard field (what “maintained” means) and an “h / week” number box. A chip on the right shows the total, e.g. “37h / week”.",
            how: "Type the standard (e.g. “Every client gets a weekly update; inbox zero by Friday”). Type hours (0–100, half hours allowed) and press Enter or click away. Above 55 hours a warning says: “That's more than 55 hours a week. Consider what you could buy back or drop.”",
          },
          {
            name: "Wheel of Life (card)",
            what: "Monthly 1–10 rating of every life area. Hint: “Re-rate each area 1–10 once a month. Low spokes are where the next goal lives.”",
          },
          {
            name: "Previous month / Next month arrows",
            what: "‹ and › next to the month name. They change which month you see and rate.",
            how: "Click ‹ to go back. › is disabled on the current month (you can't rate the future).",
          },
          {
            name: "Radar chart",
            what: "One spoke per life area. The solid filled shape is the month you are viewing. The dashed shape is the previous month, or the last month you rated if last month is empty. The legend names both. With fewer than 3 areas you get simple bars instead.",
            how: "Hover an area name to read “Sales: 7 (was 6)” under the chart.",
          },
          {
            name: "Average",
            what: "The average rating of the rated areas, e.g. “6.5 / 10 · 4/5 rated”.",
          },
          {
            name: "Rating rows (1–10)",
            what: "One row per area with ten buttons. Filled buttons show your score in the area's colour. The big number on the right is the score; a green “+2” shows the change versus the comparison month. A thin ring marks last month's score.",
            how: "Click a number. It saves about half a second later. Click another number to change it.",
          },
          {
            name: "12-month average",
            what: "A mini bar chart: one bar per month for the last 12 months (letters below). The viewed month is darker. Months with no ratings show a flat grey line.",
            how: "Hover a bar to see “October 2026: 6.4”.",
          },
        ],
        howTo: [
          "Write your purpose in one or two sentences: “I build ___ so that ___.”",
          "Add 3–5 values in rank order. Use number 1 to break ties.",
          "Add the things you will stop doing to the Not-to-do list.",
          "Write the 3–5 year vision in the present tense, as if it is already true. Add one or two lines per area.",
          "Give each area a standard and weekly hours. Keep the total under 55 hours.",
          "Rate every area 1–10 for this month. The lowest spoke is a good place for your next 12-week goal.",
        ],
      },
    ],
    frameworks: [
      {
        term: "Purpose",
        definition: "One or two sentences about why you do your work and who it helps. It is the reason behind every goal.",
        example: "“I build simple software for small clinics so that doctors spend their time with patients, not paperwork.”",
        source: "Start With Why (Simon Sinek)",
      },
      {
        term: "Values",
        definition: "Your ranked standards of behaviour. When two good options conflict, the higher value wins.",
        example: "1. Tell clients the truth early. 2. Ship small, ship often. A feature will be late: value 1 says tell the client today, not on the deadline.",
        source: "Personal values practice (Brené Brown, Dare to Lead)",
      },
      {
        term: "Vision (3–5 years)",
        definition: "A vivid picture of success, written in the present tense as if it is already true. It makes long-term choices concrete.",
        example: "“It's 2030. We serve 400 clinics with a team of 12. I work four days a week and take every August off.”",
        source: "Vivid Vision (Cameron Herold)",
      },
      {
        term: "Vision by area",
        definition: "One or two lines per life area that say what “great” looks like in about three years.",
        example: "Fitness: “I run a half marathon each spring and sleep 7+ hours.”",
      },
      {
        term: "Not-to-do list",
        definition: "Things you have decided to stop doing. Every no protects time and energy for your real yes.",
        example: "No calls before noon. No custom work under $5k. No email before the Top 3 is done.",
        source: "Stop-doing list (Jim Collins, Tim Ferriss)",
      },
      {
        term: "Year theme",
        definition: "One word or a short line that guides the whole year. You choose it last in the annual review, after looking back.",
        example: "“Leverage” — every decision asks: does this let the team or the product do more without me?",
        source: "Yearly themes (CGP Grey); Past Year Review (Tim Ferriss)",
      },
      {
        term: "Wheel of Life",
        definition: "Rate each life area from 1 to 10 once a month and see them as a radar. A lopsided wheel shows where life is out of balance and where the next goal should go.",
        example: "Sales 4, Operations 8, Fitness 3, Learning 7 → the next 12-week goal belongs in Sales or Fitness.",
        source: "Wheel of Life (Paul J. Meyer; classic coaching tool)",
      },
      {
        term: "Area standard",
        definition: "What “maintained” means for a life area: the level you keep, not a goal you chase. Rate the Wheel of Life against this standard, not against perfection.",
        example: "Operations: “Every client gets a weekly update; inbox zero by Friday.”",
        source: "Areas of responsibility (Tiago Forte, PARA)",
      },
      {
        term: "Weekly hours target",
        definition: "The hours per week you budget for one area. The Week page and the monthly review compare it with planned blocks and actual focus time.",
        example: "Operations 20h + Sales 8h + Content 5h + Fitness 4h = 37h a week.",
        source: "Time budgeting (bishOS)",
      },
    ],
    testing: [
      "Open Compass from the sidebar (Direction → Compass). Expected: Purpose, Values, Not-to-do list, Vision · 3–5 years, Vision by area, Area standards & weekly hours, and the Wheel of Life card on the right.",
      "Type a sentence in Purpose and wait one second. Expected: “Saving” then “Saved”. Reload the page. Expected: the text is still there.",
      "Type “Leverage” in Year theme. Expected: the chip “Year theme · Leverage” appears at the top right.",
      "In Values type “Ship small” and press Enter. Expected: it shows as item 1. Click it, delete all the text, press Enter. Expected: it disappears.",
      "Add a not-to-do item the same way. Expected: it appears in the list.",
      "In Area standards type 30 in the hours box of two areas. Expected: the chip shows “60h / week” and the 55-hour warning appears.",
      "In Wheel of Life click 7 for one area. Expected: the row fills to 7, the radar point moves, Average updates (e.g. “7 / 10 · 1/5 rated”) and this month's bar appears in 12-month average.",
      "Click ‹ (Previous month), rate the same area 5, then click › to come back. Expected: the row shows a green “+2”, the dashed shape shows last month and the legend names it.",
      "On the current month, try ›. Expected: the button is disabled.",
    ],
    tips: [
      "Rewrite the purpose once a year, not every week. Stability is the point.",
      "Rate the Wheel against each area's standard. A 6 can be fine.",
      "The annual review can copy your negative peaks into the Not-to-do list and save the year theme here with one click.",
    ],
  },

  // ───────────────────────────────────────────────────────────────────────
  // GOALS · 12 WEEKS
  // ───────────────────────────────────────────────────────────────────────
  {
    id: "goals-12-weeks",
    group: "Direction",
    title: "Goals · 12 weeks",
    summary:
      "Plan in 12-week cycles instead of years. Pick up to 3 goals, give each a key result (the outcome number) and 1–3 weekly tactics (actions you control). Every week you get one number: the execution score. Annual goals, a someday backlog and your older goals live on the same page.",
    why:
      "A year is too long to feel urgent; 12 weeks is not. You stop judging yourself by results you can't control and start scoring the actions you can. Hit 85% of your tactics and the results usually follow. The cap of 3 goals stops you from spreading thin.",
    when: {
      oneTime:
        "Start your first cycle (about 20 minutes): Goals → Start a cycle. Add up to 8 annual goals. Convert old goals you still care about.",
      daily: "Click + on a tactic every time you do it (on Goals, Week or Today). Update a key result when its number changes.",
      weekly: "Check the execution ring. Under 85%? Find out why in the weekly review. Finishing the weekly review freezes that week's score.",
      monthly: "Mark each goal On track, At risk or Off track in the monthly review.",
      quarterly: "In week 13 run the quarterly review: grade each goal 0–1, close the cycle and launch the next one.",
    },
    pages: [
      {
        route: "/goals",
        title: "Goals · 12 weeks (cockpit)",
        purpose:
          "The cockpit of your current cycle: which week it is, this week's execution score, your active goals with their tactics, plus annual goals, the someday backlog, older goals and past cycles.",
        elements: [
          {
            name: "Goals · 12 weeks (page header)",
            what: "Title. The line under it shows the cycle theme in quotes, or “Three goals. Twelve weeks. Score the actions you control, grade the results at the end.”",
          },
          {
            name: "12-week goal (button)",
            what: "Opens the “New 12-week goal” dialog. Shown while a cycle exists and has not ended (planned, running or week 13) and you are under the goal cap.",
            how: "Click it, fill in the goal, click “Add goal”.",
          },
          {
            name: "Start a cycle / Start next cycle (button)",
            what: "Opens the “Start a 12-week cycle” wizard. Shown when you have no cycle, during week 13, or after the cycle ended.",
            how: "Click it and follow the 4 steps.",
          },
          {
            name: "Start your first 12-week cycle (hero, no cycle only)",
            what: "Intro card with the chip “12 Week Year”, a short explanation, a big “Start a cycle” button, the note “You can bring in goals you already have.” and four tiles: “≤ 3 goals”, “Key result = lag”, “Tactics = lead”, “≥ 85% execution”.",
            how: "Read the four tiles, then click “Start a cycle”.",
          },
          {
            name: "Cycle name · dates",
            what: "Small line at the top of the cycle header, e.g. “Q4 sprint · Oct 27 – Jan 18”.",
          },
          {
            name: "Week label",
            what: "The big text: “Week 4 of 12”, “Starts in 5 days”, “Week 13 · buffer” or “Cycle ended”.",
          },
          {
            name: "Days left",
            what: "Days until the end of week 12. Shows 84 before the cycle starts.",
          },
          {
            name: "Active goals",
            what: "Active 12-week goals versus the cap, e.g. “2/3”.",
          },
          {
            name: "Avg execution",
            what: "Average execution score of the finished weeks (the current week is left out). Green at 85% or more.",
          },
          {
            name: "13-week progress strip",
            what: "13 small segments, one per week. Filled = past weeks, shining = this week, grey = future. The short 13th segment is the review-and-recharge week.",
            how: "Hover a segment to see “Week 5” or “Week 13 · review & recharge”.",
          },
          {
            name: "Week 13 banner",
            what: "Green box during week 13: “Week 13: review, celebrate and recharge. Grade your key results and plan the next cycle.” with a “Quarterly review” button.",
            how: "Click “Quarterly review” to grade and close the cycle.",
          },
          {
            name: "Cycle ended banner",
            what: "Orange box after week 13: “This cycle has ended. Close it with a quarterly review, then start the next one.” with a “Close the cycle” button.",
          },
          {
            name: "Starts … note",
            what: "Before the start: “Starts Monday, Oct 27. Use the days before to set up tactics and your Ideal Week.” Goal cards are read-only until then.",
          },
          {
            name: "Next: … starts … note",
            what: "Shown when another cycle is already planned after the current one.",
          },
          {
            name: "Execution score (card)",
            what: "Hint: “Tactics done ÷ planned. 85% is the bar.”",
          },
          {
            name: "Execution ring",
            what: "This week's score in %, labelled “this week” (or “week 12” during week 13). Below it: “X of Y reps done”, or “Add tactics to your goals to get a score”. The ring turns green at 85%+.",
          },
          {
            name: "On the bar — keep the streak of weeks going (chip)",
            what: "Green chip that appears when this week is at 85% or more.",
          },
          {
            name: "12-week bars",
            what: "One bar per cycle week with a dashed 85% line. Green bars reached 85%. The current week has an outline. Empty weeks show a dashed stub.",
            how: "Hover a bar: “Week 5: 78%”, “upcoming”, “no tactics”, or “· frozen at review” when the weekly review saved it.",
          },
          {
            name: "Goal card",
            what: "One card per active goal: life-area dot and name, an “outcome” or “learning” chip, the goal title (click to open the goal page), this week's score badge (green at 85%+) and a small trend line with a dashed 85% line.",
          },
          {
            name: "Key result rows (on the card)",
            what: "Each key result with a flag, its name, − and + buttons, “current/target unit” and a progress bar (green at 100%). With no key result you see “+ Add a key result — the number that proves it worked”.",
            how: "Click + or − to change the current value by 1. Crossing the target shows “Key result reached”.",
          },
          {
            name: "This week (tactic counters)",
            what: "Each active tactic: name, small pips (one per rep, up to 14), − (undo one), “done/target”, + (log one).",
            how: "Click + each time you do the tactic. Each rep up to the target gives 8 XP. Reaching the target shows “Tactic target hit”. − removes the rep and its XP. Buttons are hidden before the cycle starts.",
          },
          {
            name: "Habit lead rows (dashed)",
            what: "Habits linked to this goal, with “done/target” for this week. They count in the score.",
            how: "Click to open Habits. Log habits there or on Today, not here.",
          },
          {
            name: "+ Add 1–3 tactics (weekly actions)",
            what: "Link on a goal with no tactics. Opens the goal page.",
          },
          {
            name: "Add a 12-week goal (dashed tile)",
            what: "Big dashed tile after the goal cards: “N of 3 active — a key result to aim at, tactics to do weekly.” Hidden when the cycle is full or ended.",
            how: "Click it to open the “New 12-week goal” dialog.",
          },
          {
            name: "Annual goals (card)",
            what: "Hint: “Up to 8 for the year. Each 12-week cycle pulls from here.” A chip shows “n/8” (orange above 8). Empty text: “Where do you want to be by December? Add the few that matter most.”",
          },
          {
            name: "Annual goal row",
            what: "Area dot, title (struck through when achieved), a “N cycle goals” chip when 12-week goals sit under it, and buttons that appear on hover: “This cycle” (rocket), trophy, archive.",
            how: "“This cycle” opens the 12-week goal dialog pre-filled and linked to this annual goal (only when a cycle runs and you're under the cap). Trophy = “Mark achieved” / “Mark not achieved”. Archive = “Drop”.",
          },
          {
            name: "Add an annual goal… (form)",
            what: "Text field, Life area picker and “Add” button.",
            how: "Type, pick an area, click Add. Above 8 you get the tip “More than 8 annual goals — consider trimming the list.”",
          },
          {
            name: "Someday backlog (card)",
            what: "Hint: “12-week goals waiting their turn. Activating one respects the cap.” Empty text: “Nothing waiting. When a new idea shows up mid-cycle, park it here instead of starting it.”",
          },
          {
            name: "Backlog row",
            what: "Area dot, title, a “from a past cycle” chip for goals still active in an older cycle, an “Activate” button, archive (“Drop”) and trash (“Delete”).",
            how: "“Activate” moves it into the current cycle (only shown when there is room). Delete asks you to confirm. When full you see “The cycle is full (3 active). Finish or drop one to activate another.”",
          },
          {
            name: "Other goals (card)",
            what: "Only shown if you have goals from before the 12-week system. Hint: “Goals from before the 12-week system. Convert the ones still alive.” Each card: title, area · “x/y milestones”, progress % and a bar.",
          },
          {
            name: "Convert to 12-week goal / Make annual",
            what: "Buttons on each old goal.",
            how: "“Convert to 12-week goal” puts it in the current cycle if there is room, otherwise in the backlog. “Make annual” makes it an annual goal. Its metric or milestones become a starting key result.",
          },
          {
            name: "Finished & past cycles (card)",
            what: "Collapsed text: “N finished this cycle · N past cycles”. Open it to see this cycle's achieved/dropped goals and up to 6 closed cycles with dates, “avg grade 0.72” and each goal's grade (green at 0.7+).",
            how: "Click “Show” / “Hide”. Click a goal to open it.",
          },
        ],
        howTo: [
          "Click “Start a cycle” and complete the 4 wizard steps.",
          "Every time you do a tactic, click its + button. Made a mistake? Click −.",
          "When a key result changes (a new client, more revenue), click + or − on the card, or type the exact value on the goal page.",
          "Glance at the execution ring. Aim for 85% or more every week.",
          "New idea in the middle of a cycle? Add it as an annual goal or park it in the backlog. Don't start it now.",
          "In week 13 click “Quarterly review” to grade the goals and close the cycle.",
        ],
      },
      {
        route: "/goals (wizard)",
        title: "Start a 12-week cycle (wizard)",
        purpose: "A 4-step dialog that creates the cycle with its goals, key results and tactics in one go.",
        elements: [
          {
            name: "Stepper: 1 Cycle · 2 Goals · 3 Plan · 4 Launch",
            what: "Shows where you are. Finished steps turn green with a check.",
            how: "Click a finished step to go back to it.",
          },
          {
            name: "Step 1 intro",
            what: "Explains: you score your actions every week (lead) and grade the results at the end (lag). Week 13 is a buffer to review and recharge.",
          },
          {
            name: "Name",
            what: "Required. Pre-filled like “Cycle · Oct 27”. Placeholder “Q4 sprint”.",
          },
          {
            name: "Theme (optional)",
            what: "One word or line for the 12 weeks, e.g. “Pipeline before polish”. It shows under the Goals title.",
          },
          {
            name: "Start on a Monday",
            what: "Three choices: “This Monday”, “Next Monday” and “Another week” (a date picker). Every date snaps to its Monday. The app pre-selects This Monday on a Monday or Tuesday, otherwise Next Monday.",
            how: "Click a box, or pick a date under Another week.",
          },
          {
            name: "Date range line",
            what: "Shows the 12 weeks and the buffer, e.g. “Oct 27 – Jan 18 · week 13 buffer Jan 19 – 25”.",
          },
          {
            name: "Close-previous warning",
            what: "Orange note when your current cycle is in week 13 or ended: it will be closed. Ungraded goals get a grade from their key results (0.7+ counts as achieved; the rest move to the backlog). For a proper close, run the quarterly review first.",
          },
          {
            name: "Step 2: Pick up to 3 + “x/3 chosen” chip",
            what: "Explains that more than three active goals splits your attention. The chip turns orange at the cap.",
          },
          {
            name: "Chosen goal pills",
            what: "Round pills with the chosen goal titles (or “New goal 1”).",
            how: "Click × on a pill to remove it.",
          },
          {
            name: "Candidate cards",
            what: "Goals you already have, each with its area and a source label: “Carried over” (still-active goals from the ending cycle, or from an older cycle — those older ones are pre-selected), “Backlog”, “Annual goal” or “Existing goal” (old-style goals).",
            how: "Click a card to select or unselect it. Past the cap you get “3 goals max — focus is the point.”",
          },
          {
            name: "New goal (button)",
            what: "Adds an empty goal to plan from scratch. Disabled at the cap.",
          },
          {
            name: "Step 3: goal tabs",
            what: "One tab per goal. A green check means it is ready; an orange dot means something is missing.",
            how: "Click a tab to plan that goal.",
          },
          {
            name: "Goal plan editor",
            what: "Goal, Life area, Type, ranked reasons, key results and tactics. It is the same editor as the “New 12-week goal” dialog (see that page).",
          },
          {
            name: "Still needs … (warning)",
            what: "Lists what blocks the goal: a title, a life area, at least one tactic. Existing goals that already have tactics don't need new ones.",
          },
          {
            name: "Step 4: summary card",
            what: "Name, theme and “Oct 27 – Jan 18 · 12 weeks · aim for ≥85% execution each week”.",
          },
          {
            name: "Goal summary cards",
            what: "For each goal: area · type, title, “KR: New MRR → 10000 $” and the tactics with “20×/wk”.",
          },
          {
            name: "Cancel / Back",
            what: "Bottom left. Cancel on step 1, Back on later steps.",
          },
          {
            name: "Next",
            what: "Bottom right. Disabled until the step is complete (step 1 needs a name and start date; step 2 at least one goal; step 3 no missing fields).",
          },
          {
            name: "Launch cycle",
            what: "Last step button. Creates everything and celebrates: “Q4 sprint launched — 12 weeks, 3 goals 🚀”.",
          },
        ],
        howTo: [
          "Step 1 — name the cycle, add a theme if you like, choose the start Monday.",
          "Step 2 — tick up to 3 existing goals, or click “New goal”.",
          "Step 3 — for each goal set the type, ranked reasons, one key result and 1–3 tactics. Try “Suggest tactics”.",
          "Step 4 — check the summary and click “Launch cycle”.",
          "A start date of today or earlier makes the cycle active at once. A future date shows “Starts in N days”. Cycles cannot overlap: you get an error naming the cycle in the way.",
          "An annual goal you bring in stays annual. A new 12-week goal is created under it and linked back.",
        ],
      },
      {
        route: "/goals (new goal dialog)",
        title: "New 12-week goal (goal plan editor)",
        purpose: "Add one more goal to the current cycle with its key result and tactics. The same editor is step 3 of the cycle wizard.",
        elements: [
          {
            name: "Goal",
            what: "The goal title. Placeholder “Reach $10k MRR” (outcome) or “Run 10 pricing experiments” (learning).",
          },
          {
            name: "Life area",
            what: "Picker with your life areas (“Pick an area…”). Required.",
          },
          {
            name: "Type: Outcome / Learning",
            what: "Switch with a one-line hint. Outcome: “A result you want (revenue, clients, launches). Best when you know how to get there.” Learning: “A capability to build (“find 5 strategies”). Beats outcome goals on new, complex work.”",
          },
          {
            name: "Why it matters — ranked reasons",
            what: "Numbered list of reasons. Number 1 is the strongest.",
            how: "Type a reason in “Add a reason and press Enter…” and press Enter.",
          },
          {
            name: "Key result (lag) — how you'll know it worked",
            what: "Rows with a name (“New monthly recurring revenue”), a Target number, a unit and a trash button.",
            how: "Fill name, target and unit. “+ Key result” adds a row (up to 3 here; up to 5 on the goal page).",
          },
          {
            name: "Tactics (lead) — what you do every week",
            what: "Section for 1–3 weekly actions under your control.",
          },
          {
            name: "Suggest tactics (AI)",
            what: "Asks the AI for 3 lead-measure tactics with weekly targets and if-then plans, based on the goal, key result and area.",
            how: "Write the goal title first (otherwise: “Write the goal first, then ask for tactics.”), then click.",
          },
          {
            name: "Kept: …",
            what: "Shown when an existing goal already has active tactics, e.g. “Kept: Outreach (20×/wk)”. They count toward the 3.",
          },
          {
            name: "Tactic row",
            what: "Tactic name (“Send 20 outreach messages”), times per week (1–50, default 3) “/wk”, a trash button, and an “If-then: If it's 9:00 and I open my laptop, then I…” field.",
          },
          {
            name: "+ Tactic",
            what: "Adds another tactic row while you have fewer than 3.",
          },
          {
            name: "AI suggestions — click to use",
            what: "Dashed box with the AI ideas: title, “×/wk” and the if-then line.",
            how: "Click an idea to add it. When full: “Three tactics max — remove one first.”",
          },
          {
            name: "Needs … (footer warning)",
            what: "Orange text listing what is missing: a title, a life area, at least one tactic.",
          },
          {
            name: "Cancel / Add goal",
            what: "Add goal stays disabled until the goal is complete. It celebrates “New 12-week goal · …”.",
            how: "If the cap is reached you see “Goal cap reached: this cycle already has 3 of 3 active 12-week goals. Finish, drop or move one to the backlog first (or raise the cap in Settings).”",
          },
        ],
        howTo: [
          "Write a clear goal title and pick the life area.",
          "Choose Outcome if you know the path, Learning if the work is new.",
          "Add 1–3 ranked reasons.",
          "Add one key result with a target number and unit.",
          "Add 1–3 tactics with a weekly count and an if-then plan. Use “Suggest tactics” if you're stuck.",
          "Click “Add goal”.",
        ],
      },
      {
        route: "/goals/[id]",
        title: "Goal page",
        purpose:
          "Everything about one goal: progress, level and status, deadline, reasons, key results and the final grade, tactics with 12-week history, the WOOP coach, linked work, SMART, a measurable target, milestones and tags.",
        elements: [
          { name: "Goals › title (breadcrumb)", what: "Path back to the Goals page.", how: "Click “Goals” to go back." },
          {
            name: "Goal title",
            what: "Large editable title.",
            how: "Click, type, then click away to save.",
          },
          { name: "Life area link", what: "The goal's area with ↗.", how: "Click to open the life area." },
          { name: "Cycle chip", what: "“Cycle name · dates” when the goal belongs to a cycle.", how: "Click to open Goals." },
          { name: "Parent chip", what: "With a link icon: the annual goal this 12-week goal serves.", how: "Click to open the annual goal." },
          { name: "Grade chip", what: "“Grade 0.70” once graded. Green at 0.7 or more." },
          {
            name: "Momentum (button)",
            what: "Logs this goal as something that moved the needle, with a 1–5 impact and a why.",
            how: "Click, choose impact, optionally write why, save. The button shows “Added”.",
          },
          {
            name: "Delete goal (trash)",
            what: "Deletes the goal with its tactics and their weekly logs.",
            how: "Click and confirm “Delete “…” and its tactics?”.",
          },
          {
            name: "Progress (card)",
            what: "Progress in % and where it comes from: “from metric” (when a measurable target is set), “from key results”, or “from milestones”.",
          },
          {
            name: "Level: 12-week / Annual / Plain",
            what: "Switch for the goal's level. Plain = an old-style goal outside the 12-week system.",
            how: "Switching a plain goal to 12-week puts it in the current cycle if there is room, otherwise the backlog. Switching an annual goal to 12-week puts it in the backlog.",
          },
          {
            name: "Status picker",
            what: "Active / Backlog / Achieved / Dropped (not shown for Plain).",
            how: "Active joins the current cycle and respects the cap. Achieved celebrates “Goal achieved · …”.",
          },
          { name: "Type: Outcome / Learning", what: "Switch to change the goal type (not shown for Plain)." },
          {
            name: "Deadline (card)",
            what: "A date picker and a Timeframe picker (Weekly, Monthly, Yearly, Custom). A 12-week goal gets the cycle's end date automatically.",
          },
          {
            name: "Why it matters (card)",
            what: "Ranked reasons. Hint: “Ranked reasons — read them when motivation dips.”",
            how: "Type and press Enter to add; click to edit; × to remove.",
          },
          {
            name: "Key results (lag) (card)",
            what: "Hint: “The numbers that prove it worked. Graded 0–1 at the end of the cycle.” Empty text: “No key result yet. What number would make this a clear win?”",
          },
          {
            name: "Key result row",
            what: "Name (click to edit; clear it to delete), −, current value box, “/”, target box, +, and a bar with “% · unit”.",
            how: "Use − and + for steps of 1, or type the exact current value and click away. Crossing the target celebrates “Key result reached · …”.",
          },
          {
            name: "Add a key result… (form)",
            what: "Name, Target, unit and “Add”. Up to 5 key results.",
          },
          {
            name: "Final grade",
            what: "Appears after the cycle ends (or once a grade exists): the grade, a slider from 0 to 1 in steps of 0.05, and “0.6–0.7 is a success for a stretch goal. Suggested from key results: 0.80.”",
            how: "Drag the slider and release to save.",
          },
          {
            name: "Tactics (lead) (card)",
            what: "Shown for 12-week goals or any goal with tactics. Hint: “1–3 weekly actions you fully control. Each one you log counts toward the execution score.” Chip: “This week · Oct 20”.",
          },
          {
            name: "Tactic box",
            what: "Name (click to edit), “Target … /wk” box, Pause/Resume button, trash, an if-then line (“Add an if-then plan…”), the “This week” counter (−, done/target, +) and 12 small history bars.",
            how: "Changing the target also updates this week's target. Paused tactics fade and stop counting. Delete asks “Delete tactic “…” and its history?”. Counters are read-only when the goal is not Active.",
          },
          {
            name: "12-week tactic history",
            what: "One mini bar per cycle week: green = target hit, blue = partly done, grey = nothing, faint = upcoming. This week has an outline.",
            how: "Hover a bar: “Week 3: 2/3”.",
          },
          {
            name: "New tactic (form)",
            what: "“New tactic, e.g. 5 discovery calls”, a “/wk” number, “Add”, and “If-then (optional): If it's 9:00 Monday, then I…”. At 3 active tactics it is replaced by “Three active tactics is plenty. Pause one to add another.”",
          },
          {
            name: "WOOP coach (card)",
            what: "Hint: “Wish · Outcome · Obstacle · Plan — name the obstacle before it shows up.”",
          },
          {
            name: "W O O P badges",
            what: "Four letter badges and “x/4 — mental contrasting + an if-then plan”. A badge turns dark when its step has text.",
          },
          {
            name: "WOOP step boxes",
            what: "Four boxes — Wish, Outcome, Obstacle, Plan — each with an autosaving text field and a hint (e.g. Obstacle: “The main INNER obstacle: a habit, feeling or belief of yours.”).",
            how: "Type your own answer, or click “Coach me”.",
          },
          {
            name: "Coach me",
            what: "The AI coach asks one probing question and offers a draft answer in your voice.",
            how: "Click “Use this” to save the draft, or type in “Answer the coach…” and click “Reply” for a better suggestion.",
          },
          {
            name: "Linked work (card)",
            what: "Projects (n) with status, “12-week goals (n)” under an annual goal, Tasks (done/total — up to 40, done ones struck through) and Habits (n) with “×/wk”. Empty text explains how to link from a project, task or habit.",
            how: "Click any item to open it.",
          },
          {
            name: "SMART goal (card)",
            what: "Badge “x/5 defined” (green at 5/5) and five boxes: S Specific, M Measurable, A Achievable, R Relevant, T Time-bound. A letter turns dark when filled.",
            how: "Type in a box; it saves when you click away.",
          },
          {
            name: "Measurable target (card)",
            what: "Current / target / unit (“unit (e.g. pages, $, reps)”). When the target is above 0 a bar appears and this number drives Progress.",
            how: "Type the numbers; each saves when you click away.",
          },
          {
            name: "Milestones (x/y) (card)",
            what: "A list of action steps with checkboxes and × to remove.",
            how: "Type in “Add a milestone / action step…” and click Add. Click a box to tick it.",
          },
          {
            name: "AI milestones",
            what: "The AI breaks the goal into 4–6 sequenced milestones and adds them to the list.",
            how: "Click it; the button shows “Thinking…” while it works.",
          },
          {
            name: "Tags",
            what: "Small chips under the milestones with ×, plus an “Add tag…” field.",
            how: "Type a tag and press Enter.",
          },
        ],
        howTo: [
          "Read “Why it matters” when motivation dips.",
          "Update key results as numbers change.",
          "Keep 1–3 active tactics; pause one before adding another.",
          "Fill the WOOP coach, especially Obstacle and Plan, for the riskiest goal.",
          "At the end of the cycle set the Final grade (or do it in the quarterly review).",
        ],
      },
    ],
    frameworks: [
      {
        term: "12 Week Year",
        definition: "Treat 12 weeks as a full “year”. You plan, execute and review on this short cycle, so every week matters and deadlines feel close.",
        example: "“Q4 sprint”, Oct 27 – Jan 18: goal “Close 5 new clients”; tactics: 20 outreach messages and 5 discovery calls every week.",
        source: "The 12 Week Year (Brian Moran & Michael Lennington)",
      },
      {
        term: "Cycle week",
        definition: "A cycle always starts on a Monday and lasts 84 days. Week N = full weeks since the start + 1, shown from 1 to 12 (“Week 4 of 12”).",
        example: "Start Monday Oct 27. On Wednesday Nov 19 you are in week 4.",
        source: "12 Week Year",
      },
      {
        term: "Week 13",
        definition: "The 7 days after week 12. No new work goals: review, celebrate, rest and plan. The cockpit keeps showing week 12's tactics. The quarterly review closes the cycle.",
        example: "Jan 19–25: quarterly review on Monday, two Free Days, launch the next cycle for Monday Jan 26.",
        source: "12 Week Year",
      },
      {
        term: "Outcome vs learning goal",
        definition: "An outcome goal names a result (revenue, clients, a launch) and works best when you know the path. A learning goal names a capability to build (find what works) and works better on new, complex work.",
        example: "Outcome: “Reach $10k MRR.” Learning: “Run 10 pricing experiments and find one that lifts conversion.”",
        source: "Goal-setting research (Locke & Latham; Seijts & Latham)",
      },
      {
        term: "Ranked reasons",
        definition: "Your reasons why the goal matters, strongest first. Strong reasons carry you through the boring middle weeks.",
        example: "1. Runway is 4 months. 2. Prove the model before the investor call. 3. Afford a developer hire.",
        source: "12 Week Year (compelling vision)",
      },
      {
        term: "Key result (lag measure)",
        definition: "The number that proves the goal worked. It moves late, after the work. You update it as it changes and grade it 0–1 at the end of the cycle.",
        example: "“New MRR: 3,500 / 10,000 $”.",
        source: "OKRs (Andy Grove, John Doerr); lag measures (The 4 Disciplines of Execution)",
      },
      {
        term: "Tactic (lead measure)",
        definition: "An action fully in your control that you repeat every week, with a target count. Log each rep with +. Keep 1–3 per goal.",
        example: "“Send 20 outreach messages” (20/wk), “Book 5 discovery calls” (5/wk).",
        source: "12 Week Year; lead measures (The 4 Disciplines of Execution)",
      },
      {
        term: "Execution score",
        definition: "Tactics done ÷ tactics planned for a week, in %. Each tactic counts at most its target, so extra reps can't hide a miss. Habits linked to an active goal count too (done days that week vs the habit's weekly target; skips don't count). Formula: Σ min(done, target) ÷ Σ target.",
        example: "Outreach 15/20 + calls 5/5 + gym habit 3/3 → (15 + 5 + 3) ÷ (20 + 5 + 3) = 23/28 = 82%.",
        source: "12 Week Year",
      },
      {
        term: "The 85% bar",
        definition: "If you execute 85% or more of your tactics, you usually reach the goal. Under 85%, fix execution before you change the plan. The app colours everything green at 85%+.",
        example: "82% this week: find the one tactic that slipped and give it an if-then plan.",
        source: "12 Week Year",
      },
      {
        term: "Goal cap",
        definition: "At most 3 active 12-week goals per cycle (change it in Settings → Caps → “Active 12-week goals”, 1–8). The app blocks one more: finish, drop or move one to the backlog first.",
        example: "You run a Sales, a Product and a Fitness goal. A podcast idea goes to the Someday backlog.",
        source: "The 4 Disciplines of Execution (few wildly important goals); Essentialism (Greg McKeown)",
      },
      {
        term: "Someday backlog",
        definition: "12-week goals waiting for a future cycle. Parking an idea here stops it from stealing focus now. Carried goals from a closed cycle land here too.",
        source: "bishOS",
      },
      {
        term: "Annual vs cycle goals",
        definition: "Annual goals (up to 8) say where you want to be by December. Each cycle picks a few and turns them into 12-week goals with key results and tactics. One annual goal can have several cycle goals under it.",
        example: "Annual: “Reach $30k MRR”. Cycle 1: “Reach $10k MRR”. Cycle 2: “Reach $20k MRR”.",
        source: "12 Week Year + annual planning",
      },
      {
        term: "Final grade (0–1)",
        definition: "At the end of the cycle each goal gets a grade from 0 to 1. The app suggests one: the average of the key results' completion (each capped at 1). 0.7 or more counts as achieved.",
        example: "New MRR 8,000/10,000 = 0.8 → achieved.",
        source: "OKR grading (Google)",
      },
      {
        term: "WOOP",
        definition: "Wish (what you want), Outcome (the best result, imagined vividly), Obstacle (your main INNER obstacle), Plan (one if-then plan for that obstacle). Thinking about the obstacle, not only the dream, makes you act more.",
        example: "Wish: 5 new clients. Outcome: a calm runway. Obstacle: I avoid sales calls when tired. Plan: If it's 2pm and I want to skip calls, then I dial the first number before I open email.",
        source: "Gabriele Oettingen (Rethinking Positive Thinking)",
      },
      {
        term: "If-then plan",
        definition: "A plan that names a trigger and an action: “If <situation>, then I will <action>.” It turns intention into an automatic response.",
        example: "“If it's 9:00 and I open my laptop, then I send 5 outreach messages before email.”",
        source: "Implementation intentions (Peter Gollwitzer)",
      },
      {
        term: "SMART goal",
        definition: "Five checks for a clear goal: Specific, Measurable, Achievable, Relevant, Time-bound.",
        example: "“Sign 5 new clinic clients at $500/month by Jan 18” passes all five.",
        source: "George T. Doran (1981)",
      },
      {
        term: "Goal progress %",
        definition: "Comes from the measurable target when one is set; otherwise the average of the key results (each capped at 100%); otherwise milestones done ÷ total.",
        source: "bishOS",
      },
      {
        term: "Plain (legacy) goal",
        definition: "A goal from before the 12-week system. Convert it: as a 12-week goal it joins the cycle if there is room, otherwise the backlog. Its metric or milestones become a starting key result.",
        source: "bishOS",
      },
    ],
    testing: [
      "Open Goals with no cycle. Expected: the “Start your first 12-week cycle” hero with four tiles.",
      "Click “Start a cycle”. Step 1: keep the name, choose “This Monday” (to test scoring today). Expected: the range line shows 12 weeks and the week 13 buffer. Click Next.",
      "Step 2: click “New goal” four times. Expected: the fourth is blocked with “3 goals max — focus is the point.” Keep one. Click Next.",
      "Step 3: leave the title empty. Expected: “Still needs a title, at least one tactic.” and Next is disabled. Fill “Reach $10k MRR”, an area, key result “New MRR” target 10000 unit $, tactic “Send 20 outreach messages” 20/wk. Click “Suggest tactics” and click one idea. Expected: the idea is added and the tab gets a green check.",
      "Step 4: click “Launch cycle”. Expected: a celebration toast and the cockpit shows “Week 1 of 12” with your goal card. (With “Next Monday” you would see “Starts in N days” and read-only cards.)",
      "On the goal card click + on the tactic three times. Expected: pips fill, “3/20”, +8 XP toasts, the execution ring and this week's bar go up. Click − once. Expected: “2/20” and the XP for that rep is removed.",
      "On the goal page set the tactic target to 2 and click + until 2/2. Expected: “Tactic target hit” celebration; if it is the only tactic the ring shows 100% and turns green with the “On the bar” chip.",
      "Click + on a key result until it passes the target. Expected: “Key result reached” celebration and a green bar.",
      "Add goals until 3/3. Expected: the dashed “Add a 12-week goal” tile and the “12-week goal” button disappear; backlog rows no longer show “Activate” and the full note appears.",
      "Add an annual goal “Reach $30k MRR”. With room in the cycle, click “This cycle” on it. Expected: the dialog opens pre-filled; after saving, the annual row shows “1 cycle goal” and the new goal page shows the parent chip.",
      "On a goal page change Status to Backlog. Expected: the card leaves the cockpit and the goal appears in Someday backlog with “Activate”.",
      "On the goal page click “Coach me” on Obstacle. Expected: a question and a suggestion. Click “Use this”. Expected: the text is saved and the O badge turns dark (x/4 goes up).",
      "Click “AI milestones”. Expected: 4–6 milestones appear. On a goal without key results or a metric, tick one and Progress changes.",
      "Pause a tactic. Expected: it fades, its counter disappears and the execution score no longer counts it.",
    ],
    tips: [
      "Three goals is a maximum, not a target. One finished goal beats three half-done ones.",
      "If you are under 85% for two weeks, shrink a tactic's weekly count instead of adding more tactics.",
      "There is no button to rename or delete a cycle yet, so pick the start Monday with care.",
      "Habits linked to a 12-week goal count in the execution score — use that for things like “gym 3×/week” under a health goal.",
    ],
  },

  // ───────────────────────────────────────────────────────────────────────
  // WEEK
  // ───────────────────────────────────────────────────────────────────────
  {
    id: "week",
    group: "Direction",
    title: "Week",
    summary:
      "Your week plan on one page: three outcomes (Weekly Big 3), this week's tactics and score, a 7-day overview, hours by life area, a protected Free Day, notes, and your Ideal Week template. In the sidebar it sits under Today → Week.",
    why:
      "A week is the right size to plan: big enough for real outcomes, small enough to see at once. The Big 3 keeps you on results, not busywork. The Free Day and the Ideal Week protect deep work and rest before meetings fill the calendar.",
    when: {
      oneTime:
        "Design your Ideal Week (about 10 minutes): start from the founder default, set day types and themes, add or edit blocks, then click “Apply to this week”.",
      daily: "Tick a Big 3 outcome when it lands. Log tactics with +. Glance at the 7-day strip for Top 3, blocks and rituals.",
      weekly:
        "In the weekly review (or on Sunday/Monday): set next week's Big 3, protect the Free Day, apply the Ideal Week to next week and write notes.",
      monthly: "Compare hours by area with your targets. The monthly review shows the same chart for the whole month.",
    },
    pages: [
      {
        route: "/week",
        title: "Week",
        purpose: "Plan objectives, not a schedule: three outcomes, your tactics, and a week shape that protects deep work and rest.",
        elements: [
          {
            name: "Week (page header)",
            what: "Title with “Objectives, not a schedule: three outcomes, your tactics, and a week shape that protects deep work and rest.”",
          },
          {
            name: "Week switcher",
            what: "‹ (Previous week) and › (Next week) with a label in the middle: “This week”, “Next week”, “Last week” or the date range, plus the dates.",
            how: "Click the arrows to move. Click the middle label to jump back to this week.",
          },
          {
            name: "Weekly review (button)",
            what: "Opens the weekly review for the week you are looking at.",
          },
          {
            name: "Reviewed · execution frozen at X% (banner)",
            what: "Green banner after that week's weekly review is complete. The score is saved and will not change.",
          },
          {
            name: "Weekly Big 3 (card)",
            what: "Hint: “Three outcomes that would make this week a win. Check them off as they land.”",
          },
          {
            name: "Big 3 row",
            what: "Number, a round check button, the outcome text, an optional goal tag (target icon + goal title) and a trash button on hover (“Remove outcome”).",
            how: "Click the circle to mark done or not done: +30 XP each, removed if you undo. Click the text to edit; clear it to delete. When all are done: “Weekly Big 3 complete 🎉” with confetti.",
          },
          {
            name: "Add outcome (form)",
            what: "Field “Outcome #1 — what must be true by Sunday?”, a goal picker (“No goal” or one of the cycle's active goals) and “Add”. Shown while you have fewer than 3.",
          },
          {
            name: "Tip line",
            what: "When the Big 3 is empty: “Tip: tie at least one outcome to a 12-week goal and one to revenue.”",
          },
          {
            name: "Tactics this week (card)",
            what: "Hint “Cycle name · week N” and a “Goals” link. Without a cycle: “Tactics come from your 12-week goals — the weekly actions you score.” and a “Start a 12-week cycle” button.",
          },
          {
            name: "Execution ring (week)",
            what: "The week's score labelled “so far” (this week) or “score” (other weeks), with “x/y reps” and “85% is the bar — partial weeks still count.”",
          },
          {
            name: "Tactic counters (week)",
            what: "Every active tactic with its goal name below, pips, −, done/target and +. Habit lead rows (dashed) show linked habits. “Add tactics to your goals to score this week.” when there are none.",
            how: "Click + / − to log. Counters are read-only for future weeks. Editing a past week after its review does not change the frozen score.",
          },
          {
            name: "7-day strip",
            what: "Seven day cards, Monday to Sunday (scroll sideways on a small screen). Today has a blue outline, the Free Day is tinted green, past days are faded.",
          },
          {
            name: "Day header (weekday + date)",
            what: "Top of each day card.",
            how: "Click: today opens the Today page; other days open that day's Journal.",
          },
          {
            name: "Day-type chip",
            what: "Focus (blue), Buffer (orange) or Free (green). Faded = still the Ideal Week default for that weekday. A palm icon marks the protected Free Day.",
            how: "Click to cycle Focus → Buffer → Free. Choosing Free also makes it the week's Free Day if none is set; leaving Free clears it.",
          },
          {
            name: "Day theme",
            what: "The day's intention, or the Ideal Week theme for that weekday (e.g. “Delivery + sales”).",
          },
          {
            name: "Top 3 (dots)",
            what: "One dot per Top 3 task of that day; green = done. “—” when none were picked.",
          },
          {
            name: "Blocks",
            what: "Done block time / planned block time, e.g. “2h/5h 30m”. Skipped blocks don't count.",
          },
          {
            name: "Tasks done",
            what: "Tasks completed that day.",
          },
          {
            name: "Sun / Moon icons + day score",
            what: "Sun turns green when the start-up ritual was done, Moon when the shutdown was done. The number on the right is the day score from the shutdown.",
          },
          {
            name: "Hours by life area (card)",
            what: "Hint: “Target (from the Compass) vs planned blocks vs actual focus + done blocks.” Legend: Planned (light bar), Actual (dark bar in the area colour), Target (thin line).",
          },
          {
            name: "Area hours row",
            what: "Area name and “Xh actual · Yh planned · Zh target”. Actual is green when it reaches the target and orange when under 60% of it. An “Unassigned” row collects time with no area. A Total line sits at the bottom.",
            how: "Hover the bar for exact numbers. With no data: “No hours yet. Set weekly targets on the Compass, plan blocks, or run a focus session.”",
          },
          {
            name: "Protected Free Day (card)",
            what: "Seven day buttons (letter + date). Hint: “Plan rest first. No work, midnight to midnight.”",
            how: "Click a day to protect it (toast “Free Day protected · Sunday”, palm icon, “Protected” chip and “… — no work, midnight to midnight.”). Click it again to clear. Without one: “Plan the Free Day first — rest you schedule is rest you get.”",
          },
          {
            name: "Notes (card)",
            what: "Autosaving text: “Context for the week: travel, launches, constraints, who to follow up with…”. Each week keeps its own note.",
          },
          {
            name: "Ideal Week (card)",
            what: "Hint: “Your template week. Apply it and the calendar fills with blocks — no overlaps, no duplicates.” Holds the Ideal Week editor (next page).",
          },
        ],
        howTo: [
          "Write three outcomes for the week — results, not tasks. Link at least one to a goal.",
          "Pick the Free Day first.",
          "Check the tactics card daily and log reps with +.",
          "Use the 7-day strip to see which days had a start-up, a shutdown and a finished Top 3.",
          "Compare actual hours with targets at the end of the week.",
        ],
      },
      {
        route: "/week (Ideal Week editor)",
        title: "Ideal Week editor",
        purpose: "Design your template week once, then pour it into any real week with one click.",
        elements: [
          {
            name: "Block-type legend",
            what: "Maker, Manager, Admin, Routine, Free — each with its colour and the total hours of that type in your template. Hover for the meaning.",
          },
          {
            name: "Apply to this week",
            what: "Creates real calendar blocks for this week from the template.",
            how: "Click. Rules: no blocks in the past, no duplicates (same title and times), anything that overlaps an existing block is skipped, and only Free blocks go on a Free Day. It also fills empty day types and the Free Day. Toasts: “Ideal Week applied to this week · N blocks” or “Nothing new to add to this week”, plus “Skipped N overlapping · N already there · N in the past · N on the Free Day”.",
          },
          {
            name: "Next week",
            what: "Same as above, for next week.",
          },
          {
            name: "Undo apply",
            what: "Removes this week's blocks that came from the template and are still only planned, from today on.",
            how: "Click. Toast: “Removed N untouched template blocks from this week”. Blocks you marked done stay.",
          },
          {
            name: "Reset",
            what: "Restores the founder default template.",
            how: "Click and confirm “Reset your Ideal Week to the founder default?”.",
          },
          {
            name: "Founder default note",
            what: "Blue note shown until you change anything: maker mornings, manager afternoons, a daily sales block, Wednesday content, Friday buffer + review and a protected Free Day.",
          },
          {
            name: "Day header (Mon … Sun)",
            what: "Weekday name, a day-type chip and a “Theme…” line.",
            how: "Click the chip to cycle Focus → Buffer → Free. Click the theme to edit it.",
          },
          {
            name: "Time grid",
            what: "06:00 to 22:00, hour lines, times on the left. Free days are tinted green; an empty Free day shows “Free Day”.",
            how: "Click an empty spot to create a 1-hour block at that half hour.",
          },
          {
            name: "Template block",
            what: "Coloured by type, with title, time and area dot. Overlapping blocks sit side by side.",
            how: "Hover for details. Click to edit.",
          },
          {
            name: "New template block / Edit block (dialog)",
            what: "Fields: Title (“Delivery deep work”), Type, Day, Start, End (5-minute steps), Life area (optional — “Tags the hours so target vs actual adds up by area.”).",
            how: "Fill and click Save. “End must be after start.” blocks saving. In edit mode, “Delete” removes the block. “Cancel” closes.",
          },
          {
            name: "Type switch (in the dialog)",
            what: "Maker “Deep work in half-day units”, Manager “Calls, meetings, office hours”, Admin “Buffer: email, finance, processes”, Routine “Rituals, workouts, reviews”, Free “Protected rest — no work”.",
          },
        ],
        howTo: [
          "Start from the founder default. Change titles and times to match your real week.",
          "Put maker blocks in the mornings and batch calls into the afternoons.",
          "Set day types: Focus for delivery and sales, Buffer for prep and admin, Free for one full rest day.",
          "Tag blocks with a life area so the hours add up.",
          "Click “Next week” during the weekly review. Then adjust single days in the Calendar.",
        ],
      },
    ],
    frameworks: [
      {
        term: "Weekly Big 3",
        definition: "Three outcomes that would make the week a win — results, not a task list. Tie at least one to a 12-week goal and one to revenue. Each done outcome gives 30 XP.",
        example: "1. Proposal sent to Acme. 2. Pricing page live. 3. Three discovery calls held.",
        source: "Rule of 3 (J.D. Meier, Getting Results the Agile Way)",
      },
      {
        term: "Free Day",
        definition: "A full day, midnight to midnight, with zero work: no email, no calls, no “quick check”. You plan it first so rest is not leftovers. The default weekday is set in Settings → Protected Free Day.",
        example: "Sunday: family, sport, no laptop. The Ideal Week never puts work blocks on it.",
        source: "Free Days (Dan Sullivan, Strategic Coach)",
      },
      {
        term: "Ideal Week",
        definition: "A template of what a good week looks like, block by block. You apply it to a real week and adjust, instead of planning from zero every time.",
        example: "Apply it on Friday for next week, then move Tuesday's calls because of a client trip.",
        source: "Ideal Week (Michael Hyatt; Dan Sullivan)",
      },
      {
        term: "Maker block",
        definition: "Deep, creative work in large uninterrupted chunks, ideally half a day.",
        example: "Mon–Thu 9:00–12:30 “Delivery deep work”.",
        source: "Maker's Schedule, Manager's Schedule (Paul Graham)",
      },
      {
        term: "Manager block",
        definition: "Calls, meetings and office hours, batched together so they don't break maker time.",
        example: "14:30–17:00 “Client calls · office hours”.",
        source: "Paul Graham",
      },
      {
        term: "Admin block",
        definition: "Buffer work: email, finance, processes, recordings, pipeline review.",
        example: "Friday 9:00–12:00 “Buffer: processes, recordings, finance”.",
      },
      {
        term: "Routine block",
        definition: "Rituals, workouts and reviews: start-up, shutdown, weekly review, gym.",
        example: "8:30–9:00 “Start-up ritual”, Friday 14:00 “Weekly review”.",
      },
      {
        term: "Free block",
        definition: "Protected rest with no work. The only kind of block allowed on a Free Day.",
      },
      {
        term: "Focus / Buffer / Free day types",
        definition: "Every day gets a type. Focus = revenue and delivery work. Buffer = prep, admin and catch-up. Free = no work, midnight to midnight. Set defaults in the Ideal Week; change single days on the 7-day strip.",
        example: "Mon–Thu Focus, Fri–Sat Buffer, Sun Free.",
        source: "Entrepreneurial Time System (Dan Sullivan)",
      },
      {
        term: "Founder default week",
        definition: "The starting template: start-up 8:30 on weekdays; Mon/Tue/Thu delivery deep work 9:00–12:30; outreach & follow-ups every weekday after lunch; client and sales calls in the afternoons; Wednesday content hub writing and pipeline review; Thursday “Cut hub into short posts”; Friday buffer, weekly review 14:00 and co-founder sync; shutdown ritual each workday; workouts Mon/Wed/Fri 7:00 and Saturday 17:00; a Saturday learning session; and a protected Free Day (Sunday by default). Blocks are tagged with matching life areas when the names fit.",
        source: "bishOS Founder OS",
      },
      {
        term: "Hours by area: target vs planned vs actual",
        definition: "Target = the area's weekly hours from the Compass × number of weeks. Planned = calendar blocks (not skipped). Actual = focus sessions + blocks marked done that have no focus session (so nothing counts twice).",
        example: "Sales: 8h target, 6h planned, 4.5h actual → orange (under 60%).",
        source: "bishOS",
      },
    ],
    testing: [
      "Open Week (sidebar: Today → Week). Expected: “This week” and its dates in the switcher.",
      "In Weekly Big 3 type “Proposal sent to Acme”, pick a goal, click Add. Expected: row 1 with the goal tag. Add two more. Expected: the add form disappears at 3.",
      "Click the circle on outcome 1. Expected: +30 XP and the row turns green. Click again. Expected: undone and XP removed. Tick all three. Expected: “Weekly Big 3 complete 🎉” and confetti.",
      "In Protected Free Day click Sunday. Expected: “Free Day protected · Sunday”, a palm icon, and Sunday's chip in the 7-day strip says Free.",
      "Click a day-type chip in the 7-day strip. Expected: Focus → Buffer → Free in turn.",
      "Type in Notes, go to next week and back. Expected: each week keeps its own note.",
      "In the Ideal Week click an empty spot on Tuesday at 9:00. Expected: “New template block” 09:00–10:00. Title “Delivery deep work”, type Maker, an area, Save. Expected: the block appears and Maker hours in the legend go up.",
      "Click “Next week”. Expected: “Ideal Week applied to next week · N blocks” (and a “Skipped …” toast if anything clashed). Open the Calendar for next week to see the blocks.",
      "Click “Next week” again. Expected: “Nothing new to add to next week” — no duplicates.",
      "Click “Apply to this week”, then “Undo apply”. Expected: “Removed N untouched template blocks from this week”. Nothing was created on past days.",
      "Set a weekly hours target for an area on the Compass and run a focus session on a task in that area. Expected: Hours by life area shows the target and the actual hours.",
      "Click “Weekly review”. Expected: the weekly review for the week shown opens.",
    ],
    tips: [
      "Plan the Free Day before anything else; it is the first thing to disappear otherwise.",
      "The Big 3 is outcomes. “Work on proposal” is a task; “Proposal sent to Acme” is an outcome.",
      "Apply the Ideal Week during the weekly review so next week starts already shaped.",
    ],
  },

  // ───────────────────────────────────────────────────────────────────────
  // REVIEWS
  // ───────────────────────────────────────────────────────────────────────
  {
    id: "reviews",
    group: "Direction",
    title: "Reviews",
    summary:
      "Guided, pre-filled reviews: weekly, monthly, quarterly and annual. Each one is a step-by-step wizard that saves as you go, has a short minimum mode, freezes your scores and gives XP once.",
    why:
      "Reviews keep the system true. Without them, lists go stale and goals drift. bishOS fills in the numbers for you — tasks, focus hours, execution, habits, pipeline, inbox, ratings — so you spend the time thinking, not collecting. The weekly review is the most important ritual in the whole app.",
    when: {
      weekly: "Weekly review every week: 60–90 min, or 20 min in minimum mode. The founder default Ideal Week has it on Friday 14:00. +120 XP.",
      monthly: "Monthly review in the first days of each month: 30–45 min, minimum 15 min. +150 XP.",
      quarterly: "Quarterly review in week 13 of each 12-week cycle: 2–3 h, minimum 45 min. It closes the cycle and launches the next one. +300 XP.",
      oneTime: "Annual review once a year, late December or in January: half a day, minimum 1 h. +500 XP. Nothing to set up — just open Reviews.",
    },
    pages: [
      {
        route: "/reviews",
        title: "Reviews (hub)",
        purpose: "Shows the review each kind should cover right now, its status and progress, and the history of finished reviews.",
        elements: [
          {
            name: "Reviews (page header)",
            what: "Title with “Look back, get current, score, commit. The weekly review is the product — everything else feeds it.”",
          },
          {
            name: "N-week review streak (chip)",
            what: "Flame chip at the top right: how many weeks in a row you finished the weekly review, counting back from this week or last week.",
          },
          {
            name: "Review card (Weekly, Monthly, Quarterly, Annual)",
            what: "Icon, status chip, title, period, short description, steps progress, time, last done, XP and the main button. The weekly card has a highlighted border; done cards a green border.",
          },
          {
            name: "Status chip",
            what: "“Done” (green), “In progress” (blue) or “Not started”.",
          },
          {
            name: "Period label",
            what: "“Week of Oct 20 – 26”, “October 2026”, “Q4 sprint · Oct 27 – Jan 18” (or “2026-Q4 · …” without a cycle), “2026”.",
            how: "The card picks the period for you. Weekly: this week, but on Monday or Tuesday last week if its review is unfinished or not started (and last week had a plan). Monthly: this month, but in the first 7 days the previous month (same rule). Quarterly: the running cycle; else a cycle closed in the last 45 days that isn't reviewed; else the calendar quarter. Annual: this year, but in January the previous year.",
          },
          {
            name: "x/y steps + time + progress bar",
            what: "Finished steps, the usual time and the minimum time (e.g. “60–90 min · min 20 min”) and a bar.",
          },
          {
            name: "Last done … · +XP",
            what: "When you last finished this kind (e.g. “3 days ago”, “never”) and the XP it gives.",
          },
          {
            name: "Start / Resume / View (button)",
            what: "Opens the wizard for that period.",
          },
          {
            name: "Unfinished: … (links)",
            what: "Up to two older drafts of the same kind.",
            how: "Click to finish an old review.",
          },
          {
            name: "History (card)",
            what: "The last 40 finished reviews: kind chip, period, key numbers (e.g. “execution 82% · Big 3 2/3”, “areas avg 6.4”, “avg grade 0.68 · avg execution 79%”, “80% goals achieved”, “minimum mode”) and the date.",
            how: "Click a row to open that review. With none: “No reviews yet” and a “Start the weekly review” button.",
          },
        ],
        howTo: [
          "Open Reviews every week and click the weekly card's button.",
          "Use the other cards when their time comes; the hub tells you which period is due.",
          "Use “Unfinished” links to close old drafts.",
        ],
      },
      {
        route: "/reviews/[kind]",
        title: "Review wizard (all kinds)",
        purpose: "The wizard frame used by all four reviews. You can stop anytime: answers autosave and finished steps are remembered.",
        elements: [
          { name: "Review title + period", what: "E.g. “Weekly review” and “Week of Oct 20 – 26”." },
          {
            name: "Previous period / Next period arrows",
            what: "‹ › to open the previous or next week, month or year. Not shown for the quarterly review.",
          },
          { name: "All reviews (button)", what: "Back to the hub." },
          {
            name: "Intro screen (before you start)",
            what: "Description, chips (e.g. “60–90 min”, “Minimum 20 min”, “+120 XP”) and the numbered list of all steps, each with its one-line prompt; essential steps say “ESSENTIAL”.",
          },
          {
            name: "Minimum mode — only the essential steps (checkbox)",
            what: "Non-essential steps fade in the list.",
            how: "Tick it before you click Start review.",
          },
          {
            name: "Start review",
            what: "Creates the review draft and opens the first step. Note below: “Everything is pre-filled from your data and saves as you go — stop anytime and resume later.”",
          },
          {
            name: "Minimum … (toggle button)",
            what: "Top right after you start, e.g. “Minimum 20 min”. Dark when on.",
            how: "Click to switch minimum mode on or off at any time.",
          },
          {
            name: "Done banner",
            what: "Green banner after completing: “Done · date” and, for weekly, “· execution frozen at 82%”. A “Reopen” button lets you edit again (XP is not given twice).",
          },
          {
            name: "Step rail",
            what: "Left column (a sideways list on phones): “% done”, “x/y”, a bar and the numbered steps. Green check = finished, filled = current.",
            how: "Click any step to jump to it.",
          },
          {
            name: "Step panel",
            what: "“STEP 2 OF 8 · ESSENTIAL”, the step title, its prompt and the step's content.",
          },
          { name: "Back", what: "Goes to the previous step." },
          {
            name: "Done · next",
            what: "Marks the step finished and opens the next one. Says “Next” if the step was already finished.",
          },
          {
            name: "Essential left: …",
            what: "Hint on the last step listing essential steps you haven't finished.",
          },
          {
            name: "Complete review · +XP",
            what: "On the last step. Marks it done, freezes the scores, gives XP once and throws confetti. Afterwards it becomes “Back to reviews”.",
          },
          {
            name: "AI draft box",
            what: "Appears in several steps: “AI draft — from your numbers; edit before saving” with “Draft with AI” (or a special label like “Suggest a Big 3”), then “Redraft”.",
            how: "Click, edit the text, then “Save” (stored with the review and still editable) or “Discard”. The AI only uses your data and answers.",
          },
          {
            name: "Resume behaviour",
            what: "Opening a started review jumps to the first unfinished step.",
          },
          {
            name: "What “Complete” saves",
            what: "All kinds: tasks done, focus hours, minimum mode. Weekly: the execution score is frozen into the week plan (tactics with no log get a 0 entry so history stays honest), Big 3, habit %, open inbox. Monthly: average rating, every area's rating, habit %, hours. Quarterly: average execution, average grade, burnout answers. Annual: % goals achieved, deals won, content published.",
          },
        ],
        howTo: [
          "Open a review from the hub. Read the steps on the intro screen.",
          "Short on time? Tick Minimum mode.",
          "Work through each step and click “Done · next”.",
          "On the last step click “Complete review”.",
          "Need to fix something later? Click “Reopen”, change it, complete again.",
        ],
      },
      {
        route: "/reviews/weekly",
        title: "Weekly review (8 steps)",
        purpose: "Look back, get current, score the week, then commit to next week's Big 3. Essential steps: 1, 2, 4 and 7 (minimum 20 min).",
        elements: [
          { name: "Step 1 · Celebrate wins (essential)", what: "Prompt: “Progress you made — big or small. Name the three you're proudest of.”" },
          { name: "Celebrate · stat tiles", what: "Tasks done, Focus hours, Big 3 (done/total), Progress lines (from your daily shutdowns)." },
          {
            name: "Celebrate · Done this week",
            what: "Tasks you finished this week with their area.",
            how: "Shows 10; click “+N more” / “Show less”.",
          },
          { name: "Celebrate · From your days", what: "Your daily progress lines and journal wins, with the weekday." },
          { name: "Celebrate · quiet week message", what: "If nothing is recorded: “Quiet week on the record — progress still happened. What moved, even a little?”" },
          { name: "My three proudest wins", what: "Text box: “1. Closed … 2. Shipped … 3. Finally …”. Used later in the Share update." },
          { name: "Step 2 · Score the week (essential)", what: "Prompt: “Big 3, execution and habits. No judgement — just the numbers.”" },
          {
            name: "Score · execution ring + bars",
            what: "Ring with the week's execution and “x/y reps” (or “No tactics scored” / “No 12-week cycle yet”), the 12-week bars, and each tactic or linked habit with its goal and done/target (green when hit).",
          },
          { name: "Score · Big 3 · N%", what: "Last week's outcomes with done marks. Empty: “No Big 3 was set for this week — you'll set next week's at the end.”" },
          {
            name: "Score · Habits · N%",
            what: "Up to 8 active habits with done/target for the week, skips, and a bar (green at 85%+). Below: “Rituals: x/7 start-ups · y/7 shutdowns”.",
          },
          { name: "What drove the score?", what: "Text box: what helped, what got in the way." },
          { name: "Step 3 · Reflect", what: "Prompt: “Keep · Improve · Start · Stop.”" },
          {
            name: "Keep / Improve / Start / Stop",
            what: "Four boxes: what worked and should stay; what worked but could be better; what to try next week; what to stop.",
          },
          { name: "Reflect · AI draft", what: "Drafts Keep / Improve / Start / Stop from your numbers." },
          { name: "Step 4 · Get clear (essential)", what: "Prompt: “Empty every inbox so nothing is living in your head.”" },
          {
            name: "Inbox card",
            what: "Number of open items “open in the bishOS inbox · N older than 48h”, with “Process inbox ↗” or an “Inbox zero” chip.",
          },
          {
            name: "Get clear checklist",
            what: "“bishOS inbox at zero”, “Email inbox processed”, “Messages & DMs answered or captured”, “Notes, voice memos & screenshots captured”, “Desktop & downloads cleared”, “Head emptied — brain dump below”.",
            how: "Click the circles to tick.",
          },
          { name: "Brain dump", what: "Text box for anything still on your mind. Hint: capture items into the Inbox when you're done; this note stays with the review." },
          { name: "Step 5 · Get current", what: "Prompt: “Calendar, projects, pipeline and promises — every loose end gets a next step.”" },
          {
            name: "Calendar checklist",
            what: "“Last 2 weeks: loose ends captured”, “Next 4 weeks: prep and travel planned”, “Waiting-for list checked”, plus “Open calendar ↗”.",
          },
          { name: "Projects without a next action · N", what: "Open projects with no open task. Click one to open it and add a next action." },
          {
            name: "Untouched 30+ days · N",
            what: "Tasks not done, not someday, older than 30 days and not planned or due in the last 30 days. Each shows its age. Note: “No silent rollover: each one gets a decision.”",
            how: "Click “Next week” (plans it for next Monday), “Someday”, or “Drop” (deletes after you confirm).",
          },
          {
            name: "Pipeline",
            what: "Open deals with “no next step”, deals “idle Nd” (no touch for 7+ days), and “N next steps are past their date.” Link “Pipeline ↗”.",
          },
          {
            name: "Commitments",
            what: "“I owe (N) — handle these first” and “Waiting for (N)”, up to 6 each with person and date (highlighted when overdue). Link “Ledger ↗”.",
          },
          { name: "Get current · Notes", what: "Text box for follow-ups to send and things to prep." },
          { name: "Step 6 · Scorecard & issues", what: "Prompt: “Your weekly numbers on or off track, the top issues and someday ideas.”" },
          {
            name: "Scorecard",
            what: "Each active weekly number: “value/target unit” and a chip “on track”, “off track”, “no entry” or “auto”. Link “Scorecard ↗”. Empty: set up 5–7 founder numbers on the Scorecard.",
          },
          {
            name: "Top issues · IDS",
            what: "Up to 8 open or discussing issues, top 3 highlighted, link “Issues ↗”, and a box “Identify the real issue → discuss → decide the solution and the to-do.”",
          },
          { name: "Someday / maybe · N", what: "Your someday tasks and a box: “Anything ready to become active? Anything to delete?”" },
          {
            name: "Step 7 · Plan next week (essential)",
            what: "Prompt: “Three outcomes, your tactics, a protected Free Day and one if-then for the riskiest item.”",
          },
          { name: "Next week's Big 3 · dates", what: "Big 3 editor for next week (add, edit, link to a goal; no ticking yet)." },
          { name: "Tactics to place first", what: "Your tactics with “×/wk”, so you book time for them first." },
          { name: "Protect next week's Free Day", what: "The Free Day picker for next week." },
          {
            name: "Shape the week · Apply Ideal Week to next week",
            what: "Text: “Place maker blocks first, then calls. Your Ideal Week does it in one click — overlaps are skipped.”",
            how: "Click the button. Toast: “Added N blocks to next week” or “Next week already has these blocks”.",
          },
          {
            name: "WOOP the riskiest item",
            what: "Two fields: “Riskiest item & its obstacle” and “If-then plan”.",
          },
          { name: "Suggest a Big 3 (AI draft)", what: "Suggests three outcomes from your goals, tactics and loose ends." },
          { name: "Step 8 · Share", what: "Prompt: “Optional: send the score to your co-founder. Public reporting strengthens follow-through.”" },
          {
            name: "Update to share",
            what: "Text box pre-written from your numbers: week, execution, Big 3, tasks done, focus hours, your wins and next week's Big 3.",
          },
          { name: "Copy", what: "Copies the update. Toast: “Copied — paste it to your co-founder”." },
          { name: "Rebuild from numbers", what: "Throws away your edits and rebuilds the update from the latest numbers." },
          { name: "Share · AI draft", what: "Drafts a 4–6 line co-founder update." },
        ],
        howTo: [
          "Block 60–90 minutes (or 20 in minimum mode). Open Reviews → Weekly → Start.",
          "Celebrate, then look at the score without judging.",
          "Empty every inbox, then make every loose end current.",
          "Plan next week: Big 3, Free Day, Ideal Week, one if-then.",
          "Copy the update to your co-founder. Click “Complete review”.",
        ],
      },
      {
        route: "/reviews/monthly",
        title: "Monthly review (7 steps)",
        purpose: "Re-rate your life areas, check goals, tune habits and compare hours with targets. Essential steps: 1, 2 and 7 (minimum 15 min).",
        elements: [
          { name: "Step 1 · Re-rate life areas (essential)", what: "Prompt: “Wheel of Life: 1–10 for each area. Be honest, not harsh.”" },
          {
            name: "Rate · radar + rating rows",
            what: "Radar (this month solid, last month dashed) and a 1–10 row per area with the change versus last month. Ratings save straight into the Compass Wheel of Life for that month. If areas have standards: “Rate against each area's standard (set on the Compass), not against perfection.”",
          },
          { name: "What stands out?", what: "Box: the lowest spoke and one small move for it." },
          { name: "Step 2 · Goal status (essential)", what: "Prompt: “On track, at risk or off track? One line on why.”" },
          {
            name: "Goal rows",
            what: "Active 12-week goals and active annual goals: title (link), “On track / At risk / Off track” switch (default On track), a level chip (12-week / Annual) and a progress bar with %.",
          },
          { name: "Why — and what changes", what: "Box for the reason and the change you'll make. With no goals: “No active goals” and a “Goals” button." },
          { name: "Step 3 · Habits", what: "Prompt: “Graduate the automatic ones, shrink the hard ones, drop what no longer serves.”" },
          {
            name: "Habit rows",
            what: "Hint: “Last 30 days, skips excluded. Suggestions: ≥85% for 60+ days → graduate · under 30% → shrink or drop.” Each habit: title, “% · day N”, bar and a Graduate / Keep / Shrink / Drop switch with the suggestion pre-selected.",
            how: "Pick a decision. For Graduate or Drop click “Apply” (Drop archives the habit). For Shrink use the “Edit the minimum version (now: …)” link.",
          },
          { name: "Step 4 · Time by area", what: "Prompt: “Where did the hours actually go versus your targets?” Hours by life area for the whole month." },
          { name: "Re-weight next month", what: "Box: “More sales, less admin? Adjust targets on the Compass.”" },
          {
            name: "Step 5 · Migrate stale tasks",
            what: "Prompt: “Anything waiting 30+ days gets a decision: schedule, someday or drop.” Same list as in the weekly review, with Next week / Someday / Drop. Empty: “No tasks have waited 30+ days. Nice and fresh.”",
          },
          { name: "Step 6 · Energy pulse", what: "Prompt: “Three quick questions to catch burnout early.”" },
          {
            name: "Pulse questions (1–5)",
            what: "“How drained do you feel at the end of a typical day?” (Fresh–Empty), “How cynical or detached do you feel about your work?” (Engaged–Detached), “How often do you feel ineffective, even when busy?” (Rarely–Constantly).",
            how: "Click 1–5 for each. After all three: average 3.5+ shows an orange warning with concrete advice; 2.5+ “Some strain. Keep the Free Day sacred and watch sleep this month.”; lower “You're in a good place. Keep the rhythm that got you here.”",
          },
          { name: "Step 7 · Next month (essential)", what: "Prompt: “One focus for the month ahead and the adjustments you'll make.”" },
          { name: "Next month · stat tiles", what: "Tasks done, Focus hours, Deals won, Published (content) for the month." },
          { name: "One focus for next month", what: "Field, e.g. “Fill the pipeline: 3 discovery calls a week”." },
          { name: "Adjustments", what: "Box: what you'll change in your week, habits or targets." },
          { name: "Next month · AI draft", what: "Suggests one focus and 2–3 concrete adjustments." },
        ],
        howTo: [
          "In the first days of the month open Reviews → Monthly.",
          "Rate every area, then mark each goal.",
          "Decide each habit's fate and apply graduations.",
          "Check hours, clear stale tasks, answer the pulse.",
          "Write one focus for next month and complete.",
        ],
      },
      {
        route: "/reviews/quarterly",
        title: "Quarterly review (5 steps)",
        purpose: "Close the 12-week cycle: grade key results, read your execution, check for burnout, prune, then plan the next three goals. Essential steps: 1, 2, 3 and 5 (minimum 45 min).",
        elements: [
          { name: "Step 1 · Grade key results (essential)", what: "Prompt: “Score each goal 0–1. 0.6–0.7 on a stretch goal is a win.”" },
          {
            name: "Goal grade box",
            what: "Per cycle goal: title, the grade (green at 0.7+), each key result with current/target and a bar, a slider 0–1 (steps of 0.05), and “Suggested from key results: 0.80” (or “No key results — grade by judgement.”).",
            how: "Drag and release the slider — the grade saves to the goal at once.",
          },
          {
            name: "Outcome switch",
            what: "“Achieved”, “Carry to backlog”, “Drop”. Pre-selected: Achieved when the grade is 0.7+, otherwise Carry to backlog. Used when you close the cycle.",
          },
          {
            name: "Grade notes",
            what: "“0.6–0.7 on a stretch goal counts as success. 1.0 every time means the goals were too easy.” With no cycle: “No 12-week cycle in this period” — use the review for the scan and pruning.",
          },
          { name: "Step 2 · Execution & lessons (essential)", what: "Prompt: “Average execution, key successes and key mistakes.”" },
          { name: "Average execution ring + bars", what: "The cycle's average execution, “N weeks at ≥85%”, and the 12-week bars." },
          { name: "Key successes / Key mistakes & lessons", what: "Two lists. Type and press Enter to add items." },
          { name: "Execution · AI draft", what: "Lists 3 key successes and 3 mistakes/lessons." },
          { name: "Step 3 · Life scan & burnout check (essential)", what: "Prompt: “How are you, really? Three questions.”" },
          { name: "Wheel of Life link", what: "“Scan each life area on the Wheel of Life — which spoke needs the next goal?” with a “Wheel of Life ↗” button to the Compass." },
          { name: "Burnout questions", what: "The same three 1–5 questions as the monthly pulse, with the same feedback. Saved in the review's scores." },
          { name: "Scan · Notes", what: "Box: energy, health, relationships, money…" },
          { name: "Step 4 · Prune", what: "Prompt: “Archive projects, habits and areas that no longer serve you.”" },
          {
            name: "Prune lists",
            what: "Three columns: Projects (not completed) with “Close” (marks it completed), Habits (active) with “Archive”, Life areas with “Archive” (asks: “Archive the area “…”? It disappears from the Wheel and pickers.”). Handled rows fade.",
          },
          { name: "What else to prune?", what: "Box: tools, subscriptions, meetings, commitments…" },
          { name: "Step 5 · Next cycle (essential)", what: "Prompt: “Close this cycle and launch the next: ≤3 goals with tactics and a WOOP.”" },
          {
            name: "Close “cycle name” box + Close cycle",
            what: "“Saves each goal's grade and outcome. Carried goals move to the backlog.”",
            how: "Click “Close cycle”. Toast: “… closed — well played”. Goals without a grade get the suggested grade.",
          },
          {
            name: "Launch the next cycle",
            what: "Green box after closing (or “Ready for a fresh cycle.” with no cycle): “Pick ≤3 goals with tactics. Give the riskiest one a WOOP on its goal page.”",
            how: "Click to open the cycle wizard with your backlog and annual goals as candidates.",
          },
          { name: "Intentions for the next 12 weeks", what: "Box: theme, what to protect, what to say no to." },
        ],
        howTo: [
          "In week 13 click “Quarterly review” on the Goals page (or open it from Reviews).",
          "Grade every goal and choose Achieved, Carry or Drop.",
          "Read your execution, write lessons, answer the burnout check.",
          "Prune what no longer serves you.",
          "Close the cycle, launch the next one, then complete the review.",
        ],
      },
      {
        route: "/reviews/annual",
        title: "Annual review (5 steps)",
        purpose: "Past Year Review: peaks and valleys, what went well and badly, the goal hit-rate, next year's theme — and Free Days first. Essential steps: 1, 2, 4 and 5 (minimum 1 h).",
        elements: [
          {
            name: "Step 1 · Past year peaks (essential)",
            what: "Prompt: “Top positive and negative peaks. Book more of the good; put the bad on your Not-To-Do list.”",
          },
          { name: "Peaks · stat tiles", what: "Tasks done, Focus hours, Deals won, Published for the year." },
          { name: "Your momentum log — biggest moments", what: "Up to 15 Momentum entries from the year, sorted by impact (stars) with the why." },
          { name: "Life-area average by month", what: "Mini bar chart of your Wheel of Life average for each month. Hover a bar for the value." },
          { name: "Positive peaks — book more of these", what: "List: people, projects, trips that lit you up." },
          {
            name: "Negative peaks — avoid + Not-To-Do",
            what: "List of what drained you, with a “+ Not-To-Do” button.",
            how: "Click “+ Not-To-Do” to copy the negative peaks into the Compass Not-to-do list (“Added to your Not-To-Do list”).",
          },
          { name: "Peaks · AI draft", what: "Picks the top positive and negative peaks and what to repeat or avoid." },
          { name: "Step 2 · Went well / went badly (essential)", what: "Prompt: “6–8 of each. Specific beats general.”" },
          { name: "Went well · n/6–8 / Went badly · n/6–8", what: "Two numbered lists with a counter." },
          { name: "Lists · AI draft", what: "Drafts 6 “went well” and 6 “went badly” items from your data." },
          { name: "Step 3 · Goals for next year", what: "Prompt: “About 80% achieved is healthy. Set up to 8 annual goals across your areas.”" },
          {
            name: "Achieved ring + verdict",
            what: "% of this year's decided cycle goals that were achieved (achieved or graded 0.7+), “x/y graded goals”, and a verdict: 95%+ “your goals may have been too safe”, 70%+ “Healthy”, below 70% “aim for fewer goals, or smaller ones”. Below: each cycle of the year with goal count and average grade.",
          },
          {
            name: "Annual goals · n/8",
            what: "Your annual goals (achieved ones marked) and a form “A measurable goal for next year…” with a Life area picker and Add.",
          },
          { name: "Step 4 · Year theme (essential)", what: "Prompt: “Pick the theme last — one word or line that ties it together.”" },
          {
            name: "Theme for the year ahead + Save as year theme",
            what: "Field (e.g. “Year of leverage”), a button, and “Current: “…”” if one is set.",
            how: "Click “Save as year theme” to store it on the Compass (“Year theme set · …”).",
          },
          {
            name: "Step 5 · Free Days first (essential)",
            what: "Prompt: “Put holidays and Free Days on next year's calendar before anything else.”",
          },
          {
            name: "Free day form",
            what: "Date picker (starts at 1 January of next year), a label field (“Family trip”) and Add. Added dates show as a list with × to remove. Duplicate dates are ignored.",
          },
          {
            name: "Put N on the calendar",
            what: "Creates a Free block 08:00–20:00 (titled with your label, or “Free Day — no work”) on each date and sets the day type to Free. Dates that already have a Free block are skipped.",
            how: "Click. Toast: “N Free Days protected on the calendar”.",
          },
        ],
        howTo: [
          "Block half a day in late December or January. Open Reviews → Annual.",
          "Collect peaks from the momentum log, push negatives to the Not-to-do list.",
          "Write 6–8 things that went well and badly.",
          "Check your hit-rate and set up to 8 annual goals.",
          "Choose the theme last, then put next year's Free Days on the calendar and complete.",
        ],
      },
    ],
    frameworks: [
      {
        term: "Weekly review steps",
        definition: "1 Celebrate wins, 2 Score the week, 3 Reflect, 4 Get clear, 5 Get current, 6 Scorecard & issues, 7 Plan next week, 8 Share. Essential (minimum mode): 1, 2, 4, 7.",
        source: "Getting Things Done (David Allen) + 12 Week Year + EOS",
      },
      {
        term: "Monthly review steps",
        definition: "1 Re-rate life areas, 2 Goal status, 3 Habits, 4 Time by area, 5 Migrate stale tasks, 6 Energy pulse, 7 Next month. Essential: 1, 2, 7.",
        source: "bishOS",
      },
      {
        term: "Quarterly review steps",
        definition: "1 Grade key results, 2 Execution & lessons, 3 Life scan & burnout check, 4 Prune, 5 Next cycle. Essential: 1, 2, 3, 5.",
        source: "12 Week Year (week 13)",
      },
      {
        term: "Annual review steps",
        definition: "1 Past year peaks, 2 Went well / went badly, 3 Goals for next year, 4 Year theme, 5 Free Days first. Essential: 1, 2, 4, 5.",
        source: "Past Year Review (Tim Ferriss)",
      },
      {
        term: "Get clear / Get current",
        definition: "Get clear = empty every inbox (email, messages, notes, your head) so nothing lives only in memory. Get current = check the calendar, projects, pipeline and promises so every loose end has a next step.",
        example: "Process 14 inbox items, then give the 2 projects without a next action a task each.",
        source: "Getting Things Done (David Allen)",
      },
      {
        term: "Keep · Improve · Start · Stop",
        definition: "A quick reflection: what to keep doing, what to do better, what to try, and what to stop.",
        example: "Keep: maker mornings. Improve: shorter calls. Start: send proposals within 24h. Stop: checking Slack during deep work.",
        source: "Team retrospective format (Agile)",
      },
      {
        term: "IDS (Identify · Discuss · Solve)",
        definition: "For each top issue: find the real root issue, discuss it briefly, then decide a solution and a to-do with an owner.",
        example: "Issue “Leads go cold” → real issue: no follow-up rule → decide: follow up within 48h → to-do: add a pipeline reminder.",
        source: "EOS / Traction (Gino Wickman)",
      },
      {
        term: "Weekly scorecard",
        definition: "5–7 numbers you check every week, each with a target. On track or off track, no story.",
        example: "Outreach 50, conversations 8, proposals 2, revenue $3k, deep-work hours 15.",
        source: "EOS / Traction (Gino Wickman)",
      },
      {
        term: "Minimum mode",
        definition: "A short version of a review with only the essential steps. A finished minimum review beats a perfect one you skip. It still gives full XP and is marked “minimum mode” in History.",
        example: "Busy launch week: 20-minute weekly review — celebrate, score, clear the inbox, plan next week.",
        source: "bishOS",
      },
      {
        term: "Frozen score",
        definition: "Completing the weekly review saves that week's execution score in the week plan. It no longer changes, even if you log more later. The bars show “· frozen at review” and the Week page shows the banner.",
        source: "bishOS",
      },
      {
        term: "Stale task (no silent rollover)",
        definition: "A task older than 30 days that is not done, not someday and not planned or due in the last 30 days. Each one gets a decision: next week, someday, or drop.",
        source: "bishOS; Bullet Journal migration (Ryder Carroll)",
      },
      {
        term: "KR grading 0–1",
        definition: "At the end of a cycle each goal gets a grade from 0 to 1. The app suggests the average completion of its key results. 0.6–0.7 on a stretch goal is a success; 0.7+ counts as achieved; 1.0 every time means the goals were too easy.",
        example: "New MRR 6,500 / 10,000 → 0.65: a good result for a stretch goal.",
        source: "OKR grading (Google)",
      },
      {
        term: "Carry to backlog",
        definition: "A quarterly outcome: the goal is not finished but still matters. Closing the cycle moves it to the Someday backlog with its grade, ready for the next cycle.",
        source: "bishOS",
      },
      {
        term: "Burnout pulse",
        definition: "Three 1–5 questions on the three signs of burnout: exhaustion, detachment (cynicism) and low efficacy. Average 3.5+ means “running hot” and gives concrete advice. It is an observation, not a diagnosis.",
        example: "Answers 4, 4, 3 → protect two Free Days next week, pause one goal, hand off one recurring task.",
        source: "Maslach Burnout Inventory (three dimensions)",
      },
      {
        term: "Pruning",
        definition: "Every quarter, close projects, archive habits and retire life areas that no longer serve you, so your system only holds what is alive.",
        source: "bishOS",
      },
      {
        term: "Past Year Review",
        definition: "Go through last year's calendar and notes, list the positive and negative peaks, then book more of the positives and avoid the negatives next year.",
        example: "Positive: the offsite with the co-founder. Negative: weekend client calls → Not-to-do list.",
        source: "Tim Ferriss",
      },
      {
        term: "Goal hit-rate (~80%)",
        definition: "The share of your decided goals that were achieved. About 80% is healthy. Near 100% means the goals were too safe; below 70% means too many or too big.",
        source: "bishOS; OKR practice",
      },
      {
        term: "Free Days first",
        definition: "Put holidays and Free Days on next year's calendar before any work, so rest is protected, not squeezed in.",
        source: "Dan Sullivan (Strategic Coach)",
      },
      {
        term: "Review streak",
        definition: "Weeks in a row with a finished weekly review, counted back from this week or last week.",
        source: "bishOS",
      },
    ],
    testing: [
      "Open Reviews. Expected: four cards with status chips; the weekly card has a highlighted border.",
      "Click Start on the weekly card. Expected: the intro with 8 steps, 4 marked ESSENTIAL, and chips 60–90 min / Minimum 20 min / +120 XP.",
      "Tick “Minimum mode” and click “Start review”. Expected: the rail shows 4 steps: Celebrate wins, Score the week, Get clear, Plan next week.",
      "Type three wins and click “Done · next”. Expected: step 1 gets a green check and the rail says 25% done.",
      "Go back to Reviews. Expected: the weekly card says “In progress” with “Resume”. Click it. Expected: it opens at the first unfinished step.",
      "In Plan next week add a Big 3 outcome and protect a Free Day. Expected: both appear on next week's Week page.",
      "Click “Complete review · +120 XP”. Expected: +120 XP toast, confetti, a green “Done · … · execution frozen at X%” banner. The Week page shows “Reviewed · execution frozen at X%”.",
      "Click Reopen, then complete again. Expected: no second +120 XP.",
      "Back on the hub: History lists the weekly review with its numbers and “minimum mode”; the chip shows “1-week review streak”.",
      "Open the monthly review and rate an area 8 in step 1. Expected: the Compass Wheel of Life shows 8 for that month.",
      "Monthly step Habits: choose Graduate on a habit and click Apply. Expected: “Graduated · …” celebration; the habit moves to the Graduated tab on Habits.",
      "Monthly step Energy pulse: answer 4, 4, 4. Expected: the orange “running hot” advice. Change to 1, 1, 1. Expected: “You're in a good place. Keep the rhythm that got you here.”",
      "Quarterly (with a cycle): drag a goal's grade to 0.65 and pick “Carry to backlog”. In Next cycle click “Close cycle”. Expected: “… closed — well played”, the goal sits in the Goals backlog with grade 0.65, and “Launch the next cycle” opens the wizard.",
      "Annual: add a negative peak and click “+ Not-To-Do”. Expected: “Added to your Not-To-Do list” and it shows on the Compass.",
      "Annual Year theme: type “Leverage”, click “Save as year theme”. Expected: the Compass header chip shows it.",
      "Annual Free Days first: add two dates next year with the label “Family trip”, click “Put 2 on the calendar”. Expected: “2 Free Days protected on the calendar”; the Calendar shows a Free block 08:00–20:00 on those days.",
      "In Reflect click “Draft with AI”. Expected: an editable draft. Save stores it (still editable); Discard removes it.",
    ],
    tips: [
      "Never skip a week — do the 20-minute minimum instead. The streak and the frozen scores depend on it.",
      "Do the weekly review before you apply the Ideal Week to next week; step 7 has the button.",
      "The quarterly review is the proper way to close a cycle. The wizard can close it too, but it grades goals automatically.",
    ],
  },

  // ───────────────────────────────────────────────────────────────────────
  // HABITS
  // ───────────────────────────────────────────────────────────────────────
  {
    id: "habits",
    group: "Direction",
    title: "Habits",
    summary:
      "Small, anchored, forgiving habits. Each habit has an if-then cue, a 2-minute minimum version, an optional stretch version, a weekly target and reserve skips. Consistency comes first, a forgiving streak second. You build 1–3 new habits at a time; the rest wait in a queue.",
    why:
      "Most habit apps punish one missed day and you quit. bishOS counts the tiny version as a full rep, lets you plan skips, gives you 48 hours to repair a miss, and shows consistency % before streaks. Habits linked to a 12-week goal count in your execution score.",
    when: {
      oneTime:
        "Design 1–3 keystone habits (about 5 minutes): New habit → cue, habit, 2-minute version, weekly target, 2 reserve skips, life area, optional 12-week goal.",
      daily:
        "Tap each habit when you do it (Habits → Today, or the Today page). Bad day? Long-press → 2-minute version. Planned rest? Use a reserve skip. Missed yesterday? Fix it in the Repair window.",
      weekly: "Shields (reserve skips) refill every Monday. The weekly review shows each habit's done/target for the week.",
      monthly:
        "Answer the day 30/60/90 automaticity checks when they appear. In the monthly review graduate, keep, shrink or drop each habit. When one sticks, start the next one from the Queue.",
      quarterly: "Archive habits that no longer serve you in the quarterly Prune step.",
    },
    pages: [
      {
        route: "/habits",
        title: "Habits",
        purpose: "Log today's habits, repair misses, see consistency and streaks, and manage the queue and graduates.",
        elements: [
          { name: "Habits (page header)", what: "Title with “Small, anchored and forgiving. Consistency beats perfection.”" },
          { name: "New habit (button)", what: "Opens the “Design a new habit” dialog." },
          {
            name: "Today (header stat)",
            what: "A ring and “done/active” for today, e.g. “3/5”. Green when every habit is settled.",
          },
          {
            name: "Consistency · 30d (header stat)",
            what: "Average consistency of your active habits that have data. Sub-line “before streaks”.",
          },
          { name: "Best active streak (header stat)", what: "The longest current forgiving streak among active habits (flame)." },
          {
            name: "Shields left (header stat)",
            what: "Reserve skips left this week across all active habits, e.g. “4/6”. Sub-line “refill every Monday”.",
          },
          {
            name: "Tabs: Today · All habits · Queue · Graduated",
            what: "Each tab shows a count. Today = active habits; All habits = active + graduated; Queue = waiting habits; Graduated = habits on lighter tracking.",
          },
          {
            name: "Day N check-in (automaticity prompt)",
            what: "Card on the Today tab when a habit reaches day 30, 60 or 90: “How automatic does “…” feel now?” with buttons 1–5 (“I have to remind myself” … “I do it without thinking”).",
            how: "Click a number. 1–3 saves at once with an encouraging message. 4–5 offers “Graduate” or “Keep tracking”. × = “Ask me later” (hides it for now).",
          },
          {
            name: "All of today's habits are done (banner)",
            what: "Green banner when every active habit is logged (done or skipped) and at least one is done. The first time each day you also get confetti and “Every habit done today 🎉”.",
          },
          {
            name: "Repair window",
            what: "Card listing up to 6 habits not logged yesterday or the day before (after their start). Hint: “Missed a day? Log it within 48 hours — repairs keep your streak. A missed day is normal.”",
            how: "Each chip: habit, “· Yesterday”, and buttons “Done”, “2-min” (if the habit has a minimum version) and a shield (count it as a planned rest day).",
          },
          {
            name: "Time-of-day groups",
            what: "Habits grouped as Morning, Afternoon, Evening, Anytime, each with “done/total”. The current part of the day shows a “Now” chip.",
          },
          {
            name: "Habit card · big square button",
            what: "The main log button. Empty = not logged; green with a check = done; lighter green with a feather = 2-minute version; green with a rocket = stretch; dashed blue with a shield = reserve skip.",
            how: "Tap = done (+5 XP); tap again = undo. Long-press (about half a second), right-click or the ⋯ button opens the log menu.",
          },
          { name: "Habit card · title", what: "The habit name.", how: "Click to open the habit's page." },
          { name: "Habit card · ⋯ (More log options)", what: "Opens the log menu." },
          { name: "Habit card · anchor line", what: "“After I pour my morning coffee” — the cue." },
          {
            name: "Habit card · consistency",
            what: "Mini ring and %, or “New” before there is data. Green at 80%+, never red.",
          },
          { name: "Habit card · streak pill", what: "Flame with the forgiving streak in days. Orange when above 0." },
          { name: "Habit card · shields", what: "One shield icon per reserve skip; filled = still available this week." },
          {
            name: "Habit card · status chips",
            what: "“2-min counts”, “Stretch”, “Shield used” or “Repaired”. When not done: “Bad day? <minimum version>”.",
          },
          {
            name: "Log menu",
            what: "Heading with the habit name, then: “Done — The standard version”, “2-minute version” (your minimum text), “Stretch” (your stretch text), “Use a reserve skip — N shields left this week · keeps the streak”, and “Clear this day” if something is logged.",
            how: "Click an option. With no shields left the skip option is disabled: “No shields left this week — try the 2-min version”. Toasts: “Shield used — streak protected”, “2-minute version counts · …” (+3 XP), “Stretch! …” (+5 XP), “Streak repaired · …”.",
          },
          {
            name: "Tap to log · long-press or ⋯ … (hint)",
            what: "Line under the list: “Tap to log · long-press or ⋯ for the 2-minute version, stretch or a reserve skip.”",
          },
          {
            name: "Start with one tiny habit (empty state)",
            what: "Shown with no active habits, with “New habit” and, if you have queued habits, “Open queue (N)”.",
          },
          {
            name: "All habits · heatmap legend",
            what: "Done (solid), 2-min (light), Stretch (dot), Skip (outlined circle), Repaired (blue ring), Not logged (grey).",
          },
          {
            name: "Overview card (All habits / Graduated)",
            what: "Big consistency ring, title (click to open), “X of the last Y days · day N” (or “Consistency starts with your first log”), streak pill, “best N”, shields, the if-then sentence, a 12-week heatmap, and chips: life area, linked goal (“Counts toward your 12-week execution score”), target (“Daily” or “3× / week”), “Graduated”.",
          },
          { name: "Momentum (small button)", what: "On All habits cards: log the habit as something that moved the needle." },
          {
            name: "⋯ actions menu",
            what: "“Edit habit”, “Start now” (queued; “Start now (at your limit)” is disabled when full), “Graduate (lighter tracking)”, “Pause → queue”, “Resume daily tracking” (graduated), “Delete”.",
          },
          {
            name: "Queue · capacity card",
            what: "“Building X of 3 new habits this month” and “One to three new habits at a time is the sweet spot. Habits take ~66 days on average — when one feels automatic, start the next from here.”",
          },
          {
            name: "Queue card",
            what: "“#1 in queue”, title, ⋯ menu, the if-then sentence, chips (2-min, target, area, goal) and a “Start now” button.",
            how: "Click “Start now” to make it active with today as its start. When full the button reads “At your limit — graduate one first” and is disabled.",
          },
          {
            name: "Queue · Nothing waiting (empty state)",
            what: "“When you're at your new-habit limit, extra ideas wait here instead of overloading your week.” with “Add an idea”.",
          },
          {
            name: "Graduated tab",
            what: "Overview cards of graduated habits with a “Resume” button. Empty: “No graduates yet” and an explanation of the day 30/60/90 checks.",
          },
          {
            name: "Delete this habit? (dialog)",
            what: "Warns that the habit and its full history will be removed. Buttons: “Move to queue” (active habits only) and “Delete”.",
          },
        ],
        howTo: [
          "Click “New habit” and fill the if-then sentence, minimum version, target and reserves.",
          "Each day tap the big square when you do the habit.",
          "Bad day: long-press → “2-minute version”. Planned rest: “Use a reserve skip”.",
          "Missed yesterday? Use the Repair window within 48 hours.",
          "When a day 30/60/90 check appears, answer it honestly. Graduate at 4–5.",
          "When you are at your limit, add new ideas to the Queue.",
        ],
      },
      {
        route: "/habits (habit dialog)",
        title: "Design a new habit / Edit habit (dialog)",
        purpose: "Create or edit a habit. Each field teaches the method in one line.",
        elements: [
          {
            name: "Your if-then plan",
            what: "Live sentence that updates as you type: “After I pour my morning coffee, I will journal for 5 minutes.”",
          },
          {
            name: "After I… (the cue)",
            what: "The anchor. Hint: “Anchor it to something you already do daily — “pour my coffee”, not “in the morning”.” A leading “After I” or “When I” is removed for you.",
          },
          { name: "I will… (the habit)", what: "Required. “One specific behaviour you can see yourself doing.” Placeholder “Journal for 5 minutes”." },
          {
            name: "Minimum version (≈2 minutes)",
            what: "“On bad days the tiny version counts fully — it protects the streak.” Placeholder “Write one sentence”.",
          },
          { name: "Stretch version (optional)", what: "“For great days. Never required.” Placeholder “Write a full page”." },
          {
            name: "Weekly target · every day / N× a week",
            what: "Buttons 1–7. Hint: “Pick what you can sustain in a bad week, not your best week.”",
          },
          {
            name: "Reserve skips · N a week",
            what: "Buttons 0–3 (default 2). Hint: “Planned skips keep your streak — people with reserves hit goals up to 40% more often.”",
          },
          {
            name: "Time of day",
            what: "Morning / Afternoon / Evening / Anytime. “Groups it on Today so it shows up when the cue does.”",
          },
          { name: "Life Area (required)", what: "“Every habit lives in one area of your life.”" },
          {
            name: "12-week goal (optional)",
            what: "Picker grouped as “12-week goals” and “Other goals”. “Habits linked to a goal count as lead measures in your execution score.”",
          },
          {
            name: "More: why it matters · amount",
            what: "Fold-out with “Why it matters” (“Read it on the days motivation is low.”) and “Amount (optional)” (e.g. 30 min, 10 pages).",
            how: "Click the line to open it.",
          },
          {
            name: "Capacity note",
            what: "Blue box when you are at your limit: “You're already building N new habits (your limit is N). Habits take about 66 days to stick — add this one to the queue and it'll get its turn.”",
          },
          { name: "Error box", what: "Orange box with a friendly message if saving fails." },
          {
            name: "Cancel / Add to queue / Start habit / Save changes",
            what: "“Add to queue” saves it as waiting (shown when you are under the limit). The main button is “Start habit”, or “Add to queue” when you are full, or “Save changes” when editing. Needs a habit name and a life area.",
          },
        ],
        howTo: [
          "Write the cue as an action you already do every day.",
          "Make the minimum version tiny (about 2 minutes).",
          "Pick a weekly target you can keep in a bad week, and 2 reserve skips.",
          "Choose the time of day, the life area and, if it serves a 12-week goal, link it.",
          "Click “Start habit” (or “Add to queue”).",
        ],
      },
      {
        route: "/habits/[id]",
        title: "Habit page",
        purpose: "Log or repair any day, read the full stats, and see the habit's design and automaticity checks.",
        elements: [
          { name: "Habit title + links", what: "Title, a “← Habits” link and the life area (· section) link with ↗." },
          { name: "Status chip", what: "“queued”, “graduated” or “archived” when the habit is not active." },
          { name: "Momentum / Edit / Delete", what: "Log as momentum, open the edit dialog, or delete (with a “Pause instead” option for active habits)." },
          {
            name: "Log today (card)",
            what: "Big button “Mark done for today” (or “Done today — nice.”, “2-min version today — nice.”, “Reserve skip today”), with the anchor below.",
            how: "Click to mark done or undo. “2-min: …” logs the minimum version. “More” opens the log menu for today.",
          },
          {
            name: "Consistency (stat)",
            what: "Ring and “x of last y days”.",
          },
          { name: "Forgiving streak (stat)", what: "Days, with the shields left this week." },
          { name: "Best streak (stat)", what: "Lifetime record in days." },
          { name: "Total done (stat)", what: "All done days, plus “day N · x/y this week”." },
          {
            name: "Last 6 months (heatmap)",
            what: "26 weeks, one column per Mon–Sun week, legend below and “All-time: N%” (done days ÷ days tracked).",
            how: "Tap a past day to open the log menu for that date (log, change or clear it). Future days can't be logged.",
          },
          { name: "Completions per month", what: "Bar chart of done days for the last 6 months." },
          {
            name: "Habit design (card)",
            what: "The if-then plan (or “Add a cue — habits anchored to an existing routine stick far better.”), 2-min, Stretch, Target (“Every day · 2 reserve skips · 5 min”), When, Goal (link), Started (date · day N, “(median habit: ~66 days)” before day 66) and the why text.",
            how: "Buttons at the bottom: “Graduate” and “Pause → queue” (active), “Start now” (queued), “Resume daily tracking” (graduated or archived). “Edit” opens the dialog.",
          },
          {
            name: "Automaticity checks (card)",
            what: "Hint: “Day 30 · 60 · 90 — how automatic does it feel (1–5)?” A due check shows as a prompt. Rows Day 30 / 60 / 90 show a 5-segment bar and “4/5” when answered, “Answer now” when reached, or “in N days”. Off-schedule check-ins are listed too.",
            how: "Click “Answer now” or, after day 7, “Check in early”.",
          },
        ],
        howTo: [
          "Use the heatmap to fix a wrong day or back-fill a missed one.",
          "Read the design card when you want to adjust the habit; click Edit.",
          "Answer automaticity checks; graduate when it feels automatic.",
        ],
      },
    ],
    frameworks: [
      {
        term: "If–then anchor",
        definition: "Tie the habit to something you already do every day: “After I <cue>, I will <habit>.” A clear cue beats a vague time like “in the morning”.",
        example: "“After I pour my morning coffee, I will journal for 5 minutes.”",
        source: "Implementation intentions (Peter Gollwitzer); Tiny Habits (BJ Fogg); habit stacking (James Clear)",
      },
      {
        term: "Minimum / standard / stretch versions",
        definition: "Three sizes of the same habit. Standard = the normal version (“Done”, 5 XP). Minimum = the ≈2-minute version for bad days; it fully counts for streak and consistency (3 XP). Stretch = for great days, never required (5 XP).",
        example: "Standard: 30-minute run. Minimum: shoes on, walk 2 minutes. Stretch: 10 km.",
        source: "Two-minute rule (James Clear); Tiny Habits (BJ Fogg); Elastic Habits (Stephen Guise)",
      },
      {
        term: "Weekly target",
        definition: "How many days per week the habit is due, from 1 to 7. Pick what you can keep in a bad week. Days off inside the target are built-in rest days (7 − target).",
        example: "Gym 3× a week = 4 built-in rest days. Missing Tuesday breaks nothing.",
        source: "bishOS",
      },
      {
        term: "Reserve skips (shields)",
        definition: "Planned skips per week, 0–3 (default 2). Using one keeps the streak and removes that day from consistency. They refill every Monday. With no shields left, the app suggests the 2-minute version instead.",
        example: "Flu on Thursday: long-press → “Use a reserve skip”. The streak stays alive.",
        source: "Emergency reserves research (Marissa Sharif & Suzanne Shu)",
      },
      {
        term: "Forgiving streak",
        definition: "Counts days you did the habit (done, 2-minute or stretch). Skips and misses don't break it while each Mon–Sun week stays within its allowance: rest days (7 − target) + reserve skips. A full week with nothing logged always breaks it. Today doesn't break it before the day ends.",
        example: "Daily habit with 2 reserves: you can miss or skip 2 days a week and keep the streak.",
        source: "bishOS; “Never miss twice” (James Clear)",
      },
      {
        term: "Consistency %",
        definition: "The main score. Over the last 30 days (since the habit started): days done ÷ days expected by your weekly target. Skip days are removed. Today counts only once logged. Capped at 100%. Shows “New” until there is data.",
        example: "3×/week habit, 28 counted days → 12 expected; you did 9 → 75%.",
        source: "bishOS",
      },
      {
        term: "Streak repair",
        definition: "Missed yesterday or the day before? Log it within 48 hours and it counts as a repair: the streak is kept and the heatmap cell gets a blue ring.",
        example: "Monday morning the Repair window shows “Journal · Yesterday”. Click Done → “Streak repaired”.",
        source: "bishOS",
      },
      {
        term: "Automaticity",
        definition: "How automatic a habit feels, from 1 (“I have to remind myself”) to 5 (“I do it without thinking”). The app asks at day 30, 60 and 90. A 4 or 5 offers graduation. Habits take about 66 days on average to become automatic.",
        example: "Day 60: you rate journaling 4 → “Graduate” moves it to lighter tracking.",
        source: "Lally et al. (2010); Self-Report Behavioural Automaticity Index (Gardner)",
      },
      {
        term: "Graduate",
        definition: "Move an automatic habit to lighter tracking. It leaves the Today list and no longer counts in the execution score, but keeps its history. Resume anytime.",
        source: "bishOS",
      },
      {
        term: "Queue (new-habit limit)",
        definition: "You build at most N new habits at once (default 3; Settings → Caps → “New habits at once”). “New” = active and started in the last 30 days. When you are full, new habits wait in the queue. Start one when another sticks or graduates; it gets a fresh start date.",
        example: "Journaling, gym and reading started this month → a fourth idea, “Meditate”, waits as #1 in queue.",
        source: "bishOS; habit research (one change at a time)",
      },
      {
        term: "Habit as a lead measure",
        definition: "A habit linked to a 12-week goal counts in the execution score: done days this week versus its weekly target (skips don't count).",
        example: "“Gym 3×/week” linked to the health goal: 2 of 3 done adds 2/3 to the week's score.",
        source: "12 Week Year; 4DX lead measures",
      },
      {
        term: "Time of day",
        definition: "Morning (before noon), Afternoon (noon–6pm), Evening (after 6pm) or Anytime. It groups habits on Today so each shows up when its cue happens.",
        source: "bishOS",
      },
    ],
    testing: [
      "Open Habits → click “New habit”. Type cue “pour my morning coffee” and habit “Journal for 5 minutes”. Expected: “After I pour my morning coffee, I will journal for 5 minutes.” at the top.",
      "Set minimum “Write one sentence”, weekly target 7, reserve skips 2, time Morning, a life area. Click “Start habit”. Expected: a “New habit: …” toast and the habit under Morning on the Today tab with “New” consistency.",
      "Tap the big square. Expected: green with a check and +5 XP. Tap again. Expected: undone and the XP removed.",
      "Long-press the square (or right-click, or ⋯) → “2-minute version”. Expected: light green with a feather, chip “2-min counts”, +3 XP.",
      "⋯ → “Use a reserve skip”. Expected: dashed blue shield, “Shield used — streak protected”, header “Shields left” drops by 1. Use skips until none are left. Expected: the option is disabled with “No shields left this week — try the 2-min version”.",
      "Leave a habit (started before yesterday) unlogged for yesterday. Expected: the Repair window lists it with “· Yesterday”. Click Done. Expected: “Streak repaired · …” and a blue ring on that heatmap cell.",
      "Log every active habit today. Expected: confetti, “Every habit done today 🎉” and the green “All of today's habits are done.” banner (only once per day).",
      "Create habits until you reach the limit (3 started in the last 30 days). Expected: the dialog shows the blue capacity note and the main button says “Add to queue”. The Queue tab shows “#1 in queue” with a disabled “At your limit — graduate one first”.",
      "On an active habit ⋯ → “Graduate (lighter tracking)”. Expected: “… graduated 🎓”, it moves to Graduated, and “Start now” in the Queue becomes available.",
      "Open a habit page. Tap a past day in the heatmap → “2-minute version”. Expected: the cell turns light green and consistency updates. Future days are not clickable.",
      "Edit a habit and link it to a 12-week goal. Expected: on Goals the goal card shows it as a dashed habit row and the execution score includes it.",
      "⋯ → Delete. Expected: a dialog with “Move to queue” and “Delete”.",
      "On a habit older than 30 days, the “Day 30 check-in” appears. Click 5. Expected: “Graduate” / “Keep tracking”. On another habit click 3. Expected: saved at once with a kind message.",
    ],
    tips: [
      "If you keep using the 2-minute version, that's fine — it still counts. Shrink the standard version in the monthly review.",
      "Two reserve skips a week is a good default. Zero reserves makes the habit fragile.",
      "Start one habit at a time when life is busy; the limit is a maximum.",
    ],
  },

  // ───────────────────────────────────────────────────────────────────────
  // ROUTINES
  // ───────────────────────────────────────────────────────────────────────
  {
    id: "routines",
    group: "Direction",
    title: "Routines",
    summary:
      "Short checklists set off by one cue — like a work start-up or a shutdown — tracked as one unit. Each step can be part of the minimum version for bad days. A run mode with a timer walks you through the steps.",
    why:
      "Rituals at the start and end of the workday make the day begin and end on purpose: you plan before you react, and you close every loop before you stop. A routine bundles 3–8 tiny steps behind one trigger, so you don't need willpower for each step.",
    when: {
      oneTime:
        "Your first visit adds 4 starter routines: Start-up, Shutdown, Morning and Evening. Edit their steps to fit your day (about 5 minutes).",
      daily:
        "Morning routine after you get up, Start-up when you sit down to work, Shutdown after your last work block, Evening after dinner. Bad day? Click “Minimum”.",
      weekly: "Use a routine of kind Weekly for a weekly reset; it is counted in weeks, not days.",
      monthly: "Check each routine's 30-day dots and consistency. Remove steps you never do; keep 3–8.",
    },
    pages: [
      {
        route: "/routines",
        title: "Routines",
        purpose: "See all routines, tick steps for today, complete the full or minimum version, and track consistency and streaks.",
        elements: [
          { name: "Routines (page header)", what: "Title with “Short checklists set off by one cue. Each has a minimum version for bad days.”" },
          { name: "New routine (button)", what: "Opens the routine editor." },
          { name: "Done today (header stat)", what: "Ring and “done/active”. Green when all active routines are done." },
          { name: "Consistency · 30d (header stat)", what: "Average consistency of active routines. Sub-line “minimum versions count”." },
          {
            name: "Planned time (header stat)",
            what: "Total planned minutes of active routines. Sub-line “start-up ≤15 · shutdown ≤10”.",
          },
          {
            name: "Starter routines toast",
            what: "On your first visit: “Added 4 starter routines — Start-up, Shutdown, Morning and Evening — edit them to fit your day.”",
          },
          {
            name: "No routines yet (empty state)",
            what: "If you deleted everything: explains routines, with “Add starter routines” and “Build your own”.",
          },
          {
            name: "Routine card · ring",
            what: "Shows how many steps you ticked today. A green check when complete; otherwise the kind icon.",
          },
          {
            name: "Routine card · name and kind line",
            what: "Name and “Kind · ≤N min” (or “N steps”) and “· min N steps” when there is a minimum version. Paused routines are faded.",
          },
          { name: "Routine card · anchor", what: "The trigger, e.g. “When I sit down at my desk to start work”." },
          {
            name: "Routine card · ⋯ menu",
            what: "“Edit routine”, “Move up”, “Move down”, “Pause routine” / “Activate routine”, “Reset today” (only when some steps are ticked and it is not complete — clears today's ticks and XP), “Delete”.",
          },
          {
            name: "Step list",
            what: "A round tick per step, the text, a “min” chip for minimum-version steps, and minutes. Empty: “No steps yet — edit to add 3–8 short steps.”",
            how: "Click a step to tick or untick it. Ticks are saved per day.",
          },
          { name: "Run now", what: "Opens the full-screen run mode with a timer." },
          {
            name: "Complete",
            what: "Marks the whole routine done for today (all steps ticked).",
            how: "Click. +10 XP once per routine per day: “… complete”.",
          },
          {
            name: "Minimum",
            what: "Shown when the routine has minimum steps. Completes the minimum version (ticks those steps). Counts as done for consistency and streak.",
            how: "Click. +10 XP: “… · minimum version done”.",
          },
          {
            name: "Done today / Minimum done (chip) + Undo",
            what: "After completing: the chip (with the time if you used run mode, e.g. “· 8:42”) and an “Undo” button.",
            how: "Undo removes the completion and its XP; ticked steps stay.",
          },
          {
            name: "30-day dots",
            what: "One dot per day: green = complete, light green = minimum, ring = started but not finished, grey = nothing, faint = before the routine existed.",
            how: "Hover a dot for the date and status.",
          },
          {
            name: "Consistency %",
            what: "Last 30 days: completed days ÷ days since the routine started (today counts once it's done). Weekly routines: weeks done over the last 8 weeks.",
          },
          {
            name: "Streak (flame)",
            what: "Days in a row (weeks for Weekly routines). Up to 2 missed days a week are reserve days and keep it alive.",
          },
          {
            name: "Delete this routine? (dialog)",
            what: "“… and its history will be removed. To take a break, pause it instead — it keeps its history.” Buttons: “Pause instead” and “Delete”.",
          },
        ],
        howTo: [
          "Read the four starter routines and edit them to fit your day.",
          "Each day, tick steps as you go, or click “Run now”.",
          "Finish with “Complete” — or “Minimum” on a bad day.",
          "Pause routines you don't need now instead of deleting them.",
        ],
      },
      {
        route: "/routines (run mode)",
        title: "Run mode",
        purpose: "A focused full-screen checklist with a timer, so you do the routine step by step without distractions.",
        elements: [
          {
            name: "Top bar",
            what: "Routine name, “Kind · date”, and × “Close run mode”.",
            how: "Click × or press Esc to close. Ticks are kept.",
          },
          {
            name: "Timer ring",
            what: "Elapsed time “m:ss” and “of N min” (planned minutes). Over time it shows “+m:ss · that's fine”. The timer keeps running if you close and reopen within 6 hours on the same day in the same browser tab.",
          },
          { name: "Anchor", what: "The routine's trigger, under the timer." },
          {
            name: "Step buttons",
            what: "Big buttons with a number (or a check when done), the text, a “min” chip and minutes. The next step to do has an outline.",
            how: "Tap a step to tick or untick it.",
          },
          {
            name: "Complete minimum (N steps)",
            what: "Shown when the routine has minimum steps; shows ✓ when all minimum steps are ticked.",
            how: "Click to finish the minimum version and save the time.",
          },
          {
            name: "Complete",
            what: "Finishes the full routine, saves the duration and closes run mode. It shines when every step is ticked.",
          },
        ],
        howTo: [
          "Click “Run now” on a routine card.",
          "Tap each step as you finish it; follow the outlined next step.",
          "Click “Complete” (or “Complete minimum”). The card then shows “Done today · m:ss”.",
        ],
      },
      {
        route: "/routines (routine editor)",
        title: "New routine / Edit routine (dialog)",
        purpose: "Create or change a routine: its name, kind, trigger and steps with minutes and the minimum version.",
        elements: [
          { name: "Name", what: "Required, up to 60 characters. Placeholder “Gym prep”." },
          {
            name: "Kind",
            what: "Morning, Work start-up, Shutdown, Evening, Weekly or Custom. Start-up aims for ≤15 minutes and Shutdown for ≤10. Weekly is counted in weeks.",
          },
          {
            name: "Anchor (one trigger)",
            what: "The cue, e.g. “When I sit down at my desk”. Hint: “A routine is a short checklist set off by one cue, tracked as one unit.”",
          },
          {
            name: "Steps header + total",
            what: "“Steps · keep it to 3–8 · mark the minimum version” and the total, e.g. “12 min · aim ≤10” (orange when over the kind's cap).",
          },
          {
            name: "Step row",
            what: "Number, step text, minutes box (“min”, 0–240), a “min” toggle (green = part of the minimum version), ↑ ↓ to reorder (on wider screens) and × to remove.",
          },
          {
            name: "Add a step… + Add",
            what: "Adds a step at the end (Enter works too). Text left in this field is also saved when you save the routine.",
          },
          {
            name: "Delete (edit only)",
            what: "Deletes the routine and its history.",
            how: "Click once to arm (“Tap again to delete”), click again to delete.",
          },
          { name: "Cancel / Create routine / Save routine", what: "Saving needs a name. Empty steps are dropped." },
        ],
        howTo: [
          "Name the routine and choose its kind.",
          "Write one clear trigger in Anchor.",
          "Add 3–8 short steps with minutes.",
          "Mark the 1–3 most important steps as “min” — that is your bad-day version.",
          "Click Create (or Save) routine.",
        ],
      },
    ],
    frameworks: [
      {
        term: "Routine vs habit",
        definition: "A habit is one behaviour with its own streak and consistency. A routine is a short checklist of several steps behind ONE cue, tracked as one unit: complete, minimum or started. Use habits for single behaviours you want on autopilot; use routines for sequences.",
        example: "Habit: “After coffee, journal 5 minutes.” Routine: Shutdown = empty inbox → review lists → check calendar → decide leftovers → resume note → progress line → “shutdown complete”.",
        source: "bishOS",
      },
      {
        term: "Minimum steps",
        definition: "Steps marked “min” form the routine's minimum version. On a bad day click “Minimum”: it counts as done for consistency and streak, and gives the same XP.",
        example: "Start-up minimum: “Pick today's Top 3” + “Set one if-then plan” — about 6 minutes.",
        source: "bishOS; Tiny Habits (BJ Fogg)",
      },
      {
        term: "Anchor (one trigger)",
        definition: "The one moment that starts the routine. A routine has exactly one cue, so you never wonder when to do it.",
        example: "“When I finish my last work block.”",
        source: "Implementation intentions (Peter Gollwitzer)",
      },
      {
        term: "Start-up ritual",
        definition: "A short ritual (≤15 minutes) before work: review the calendar and week plan, process the inbox, pick today's Top 3 (one delivery, one revenue), and set one if-then plan for the biggest distraction.",
        source: "Daily planning ritual (Sunsama-style)",
      },
      {
        term: "Shutdown ritual",
        definition: "A short ritual (≤10 minutes) after the last work block: empty the inbox, review and date open lists, check the next 2 weeks, decide every leftover, write a ready-to-resume note and a progress line, then say “shutdown complete” and close the laptop.",
        source: "Cal Newport (Deep Work)",
      },
      {
        term: "Starter routines",
        definition: "The four routines added on your first visit. Start-up (4 steps), Shutdown (7 steps), Morning (water, move 5 minutes, no phone for 30 minutes) and Evening (lay out tomorrow, screens off, read 10 minutes). Each has minimum steps marked.",
        source: "bishOS (Newport shutdown, Sunsama start-up)",
      },
      {
        term: "Routine streak and reserve days",
        definition: "Consecutive days (or weeks for Weekly routines) with the routine complete. Up to 2 missed days per Mon–Sun week are absorbed as reserve days. A minimum completion counts as complete.",
        example: "You skip the evening routine on Friday and Saturday; the streak survives. A third miss that week breaks it.",
        source: "bishOS",
      },
      {
        term: "Routine kinds",
        definition: "Morning, Work start-up (aim ≤15 min), Shutdown (aim ≤10 min), Evening, Weekly (tracked in weeks) and Custom.",
        source: "bishOS",
      },
    ],
    testing: [
      "Open Routines for the first time. Expected: the toast “Added 4 starter routines” and four cards: Start-up, Shutdown, Morning, Evening.",
      "On Start-up tick the first step. Expected: the ring fills a little. Reload. Expected: the tick is still there for today.",
      "Click “Minimum”. Expected: “Start-up · minimum version done” with +10 XP, the chip “Minimum done”, and today's dot is light green.",
      "Click “Undo”. Expected: the chip goes away and the XP is removed; ticked steps stay.",
      "Click “Run now”. Expected: full-screen run mode with a running timer. Tick steps — the next step is outlined. Click “Complete”. Expected: +10 XP and the card shows “Done today · m:ss”.",
      "⋯ → “Edit routine”. Change Kind to Shutdown and add minutes until the total is over 10. Expected: the total turns orange with “aim ≤10”.",
      "Add a step, mark it “min”, click Save routine. Expected: the card shows “· min N steps” and the step has a “min” chip.",
      "⋯ → “Pause routine”. Expected: the card fades and the header “Done today” no longer counts it.",
      "⋯ → “Move up”. Expected: the order changes and stays after reload.",
      "Tick a step on an unfinished routine, then ⋯ → “Reset today”. Expected: today's ticks are cleared.",
      "⋯ → Delete. Expected: a dialog with “Pause instead” and “Delete”.",
    ],
    tips: [
      "Keep start-up under 15 minutes and shutdown under 10. Long rituals get skipped.",
      "The minimum version is not cheating; it keeps the chain alive on hard days.",
      "Routines are tracked separately from the Today page's start-up and shutdown. The Sun/Moon icons on the Week page come from the Today rituals, not from these checklists.",
    ],
  },
];
