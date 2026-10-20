import type { GuideSection } from "../types";

/**
 * Founder group — Founder HQ, Pipeline, People, Customers, Commitments,
 * Offers, Campaigns, Scorecard, Decisions & Issues, Strategy AI.
 * (Finance is documented in its own file.)
 * Pure data (no runtime imports). Text matches the real UI labels and rules.
 */
export const sections: GuideSection[] = [
  // ───────────────────────────────────────────────────────────────────────
  // FOUNDER HQ
  // ───────────────────────────────────────────────────────────────────────
  {
    id: "founder-hq",
    group: "Founder",
    title: "Founder HQ",
    summary:
      "The CEO view of your company on one page: this week's Big 3, six key numbers, the revenue engine (pipeline and promises), the marketing engine (content, offers, campaigns), the scorecard, where your hours went, and what needs your attention.",
    why:
      "As a founder you do sales, marketing and delivery yourself. It is easy to lose the big picture. Founder HQ pulls every engine into one screen, so in two minutes you know: is money coming in, is marketing running, are you keeping promises, and are you burning out? Every number is a link to the page where you fix it.",
    when: {
      oneTime:
        "Nothing to set up on this page. It fills itself from other modules. To make every panel useful: set your Weekly Big 3 (Week page), click “Start with the founder scorecard”, add your open deals in Pipeline, set weekly hour targets per area in Compass, and set the hours cap in Settings → Wellbeing.",
      daily: "Open it first thing in the morning. Read the status line under the Big 3. Click any warning (deal steps due, promises overdue) and clear it.",
      weekly: "Use it as the first screen of your weekly review: check the scorecard, the won-this-week tile, hub cadence, hours by area and the top issues. Then click “Weekly review”.",
      monthly: "Look at the 8-week trend lines in the KPI row and the Scorecard panel. Flat or falling lines are a topic for your monthly review.",
    },
    pages: [
      {
        route: "/founder",
        title: "Founder HQ",
        purpose:
          "Read the whole business top to bottom: focus → key numbers → revenue and marketing engines → scorecard and time → attention items.",
        elements: [
          {
            name: "Founder HQ (page header)",
            what: "Title with a crown icon. The line under it greets you by time of day and names the week, e.g. “Good morning. The CEO view for the week of Oct 19 – Oct 25.” (Late night, Good morning, Good afternoon or Good evening.)",
          },
          {
            name: "Weekly review (button)",
            what: "Outline button at the top right. Opens the Reviews page.",
            how: "Click it at the end of the week to run your weekly review.",
          },
          {
            name: "Scorecard (button)",
            what: "Dark button at the top right. Opens the full Scorecard page with the 13-week grid.",
            how: "Click it to fill in manual numbers or see the full history.",
          },
          {
            name: "This week's founder focus (focus strip)",
            what: "A card under the header with your Weekly Big 3 from the Week page. On the right: “2/3 done” (green when all done) and a link “Edit in Week →” (or “Plan the week →” if empty).",
            how: "Click the link to change the Big 3 on the Week page. You tick them done there, not here.",
          },
          {
            name: "Big 1 / Big 2 / Big 3",
            what: "Three slots. Each shows an empty circle (not done) or a green check (done) and the outcome text. A done outcome is struck through.",
          },
          {
            name: "+ Add Big N",
            what: "Shown in an empty slot when you have fewer than 3 outcomes.",
            how: "Click it to go to the Week page and add the missing outcome.",
          },
          {
            name: "No Weekly Big 3 yet (empty state)",
            what: "Text “No Weekly Big 3 yet. Pick the three outcomes that would make this week a win.” with a “Set the Big 3” button.",
            how: "Click “Set the Big 3” to open the Week page.",
          },
          {
            name: "Status line",
            what: "A grey strip at the bottom of the focus card with short linked messages, each with a coloured dot: “5 of 7 scorecard numbers on track” (green when all on track and nothing blank, red when more are off than on), “3 deal steps due (1 overdue)” or “… due today”, “2 deals need a next step”, “1 promise overdue”, “1 decision to review”, “1 load signal worth a look”. With nothing urgent you see “Nothing urgent: steps, promises and reviews are clear”.",
            how: "Click a message to jump to Scorecard, Pipeline, Commitments, Decisions or Insights and fix it.",
          },
          {
            name: "KPI row (six tiles)",
            what: "Six equal tiles: Scorecard, Open pipeline, Won this week, Promises kept, Hub content, Hours this week. Each tile has a label and icon, a big number, a mini chart and a context line. The whole tile is a link.",
            how: "Click a tile to open the module behind it. Hover the mini bars to see each week's value.",
          },
          {
            name: "Scorecard (tile)",
            what: "Numbers on track this week out of all active numbers, e.g. “5/7”. Mini chart: the share of numbers on track for each of the last 8 weeks. Context line: “on track · 2 off · 1 blank”. Green when nothing is off or blank, red when more are off than on. Shows “—” and “Not set up yet” with no scorecard.",
          },
          {
            name: "Open pipeline (tile)",
            what: "Total value of all open deals (Target to Verbal yes). Mini chart: one strip split by stage, bigger segment = more deals, later stages darker. Context line: “8 deals · 33% win rate”. This win rate is all-time: won ÷ (won + lost).",
          },
          {
            name: "Won this week (tile)",
            what: "The value of deals won this week (or the number of deals if they have no value). Green when you won at least one. Mini chart: deals won per week for 8 weeks. Context line: “1 deal · avg $2.5K/wk” (average of the 7 earlier weeks).",
          },
          {
            name: "Promises kept (tile)",
            what: "Your promise-keeping rate for the last 28 days, e.g. “92%”. Mini chart: a bar with a marker at the 90% goal. Green at 90% or more, amber under 70%. Context line: “11/12 on time · 1 overdue”, or “None due in 28 days”.",
          },
          {
            name: "Hub content (tile)",
            what: "Hub pieces published this week out of your weekly target, e.g. “1/1”. Green when you hit the target. Mini chart: hub pieces per week for 8 weeks, dashed line = target. Context line: “3 published · 4-wk streak”.",
          },
          {
            name: "Hours this week (tile)",
            what: "Hours worked this week out of your cap, e.g. “41h/55h”. Amber at or above the cap. Mini chart: a bar against the cap (blue from 85% of the cap). Context line: “18h deep focus · cap 55h”. The tile links to Insights.",
          },
          {
            name: "Revenue engine (panel)",
            what: "Big panel on the left with a handshake icon. Hint: “Pipeline by stage, next steps and promises to clients”. Link “Pipeline ↗” at the top right.",
          },
          {
            name: "Cash & runway tile (Finance)",
            what: "The first row inside Revenue engine, a link to Finance. With Finance set up it shows four numbers: Business cash, Runway (months; amber under 6, red under 3, or “Not burning”), This month net (green or red) and Receivables (open invoices, with a red chip for overdue ones). Before setup: “Set up Finance to see cash, burn and runway here.”",
            how: "Click it to open Finance. The Finance chapter explains these numbers.",
          },
          {
            name: "Pipeline by stage",
            what: "One bar per open stage: Target, Contacted, Booked, Discovery, Proposal, Verbal yes. The bar length = number of deals (the number is printed inside). The value of each stage is on the right. Above it: the total, e.g. “$24K open”.",
            how: "Read it like a funnel. Many deals at Target and none at Proposal means you need more conversations, not more leads.",
          },
          {
            name: "No open deals (empty state)",
            what: "Text “No open deals. Every deal you add gets a dated next step, so nothing goes cold.” with the link “Add a deal →”.",
            how: "Click the link to open the Pipeline.",
          },
          {
            name: "Next steps due",
            what: "Up to 4 open deals whose next step is due today or overdue. Each row: the deal name, then the date (“Overdue · 3 days ago” in amber, or “Today”) and the step text. A count chip shows how many are due (amber when some are overdue). Link “Deals →”.",
            how: "Do the step, then update the deal in the Pipeline. If no steps are due you see “No steps due. All are in the future.”",
          },
          {
            name: "Promises due",
            what: "Up to 4 of your “I owe” promises: overdue ones first (amber “Overdue · …”), then ones due in the next 7 days (“Due · Friday”). Count chip and link “Commitments →”. Empty: “Nothing owed in the next 7 days.” or, if you never logged one, “Log what you promise clients and partners to track your follow-through. Log a promise →”.",
          },
          {
            name: "Pipeline health chips",
            what: "Small chips at the bottom of the panel: “2 without a dated next step” (amber) or “Every open deal has a next step” (green), “3 idle 7+ days” (hover to see which deals), “1 promised for today”, “2 waiting-for to check”.",
            how: "Hover the idle chip to read the deal names. Then open the Pipeline and touch those deals.",
          },
          {
            name: "Marketing engine (panel)",
            what: "Panel on the right with a megaphone icon. Hint: “Content cadence, work in production, offers and campaigns live”. Link “Studio ↗” opens the Content Studio.",
          },
          {
            name: "Hub cadence",
            what: "Bars for the last 8 weeks: hub pieces published per week. Green bars hit the target; the dashed line is the target. On the right: “1/1 this week”. Under the bars: “8 weeks ago”, a flame with “4-week streak” (weeks in a row that hit the target) and “dashed = 1/week target”.",
            how: "Hover a bar to see “Week of Oct 6: 1 hub · 3 published”.",
          },
          {
            name: "In production / Offers live / Campaigns live (stat cells)",
            what: "Three small linked boxes. In production: content pieces from Brief to Scheduled, with “12 ideas banked”. Offers live: live offers, with “1 testing” or “none testing”. Campaigns live: live campaigns, with “2 planned” or “none planned”. Green when at least one is live.",
            how: "Click a box to open Content Studio, Offers or Campaigns.",
          },
          {
            name: "In production (list)",
            what: "Up to 3 pieces in production with their stage (e.g. “Script”). A small purple dot marks a hub piece. Link “Studio →”. Empty: “Nothing in production. Move an idea to Brief to start this week's hub piece. Brief a piece →”.",
            how: "Click a piece to open it in the Content Studio.",
          },
          {
            name: "Live offers & campaigns",
            what: "Up to 3 live items: offers (package icon, price) and campaigns (megaphone icon, number of leads). Link “Campaigns →”. Empty: “Nothing live. One live offer plus one focused campaign is the engine. Build an offer →”.",
            how: "Click an item to open the offer or campaign.",
          },
          {
            name: "Scorecard (panel)",
            what: "Panel with a gauge icon. Hint: “5 of 7 on track this week · ⚡ = fills itself”. Link “Full grid ↗”.",
          },
          {
            name: "Scorecard table",
            what: "One row per active number. Columns: Number (name, with ⚡ if automatic), 8 weeks (a trend line with a dashed target line; hidden on phones), This week (value / target, green or red), vs last (arrow and change vs last week, “same” or “—”; wide screens only) and a status chip: On track, Off track or No entry.",
            how: "A manual number with no value shows “+ add”. Click it to open the Scorecard page and type the value.",
          },
          {
            name: "Start with the founder scorecard (button)",
            what: "Shown when you have no scorecard. Text: “Seven numbers that tell you if the business is on track. Six fill themselves in.”",
            how: "Click it once. Seven numbers are created, a toast says “Founder scorecard ready” and confetti plays.",
          },
          {
            name: "Time & operations (panel)",
            what: "Panel with a clock icon. Hint: “Where this week's hours went, and what's ready to hand off”. Link “Week ↗”.",
          },
          {
            name: "Hours by Life Area",
            what: "One row per life area: colour dot, name, a bar and “12/20h” (actual / weekly target). With a target the bar is a bullet bar with a marker at the target (green when reached). Without targets you see plain bars and the hint “Set weekly hour targets per area in Compass to see target vs actual.” A “No area” row shows hours not linked to any area. At the top right: total hours, focus hours and an 8-week trend line against your cap.",
            how: "Hours count focus sessions that ended this week plus schedule blocks marked done (without a focus session). The area comes from the session, its task or its project.",
          },
          {
            name: "Delegation readiness",
            what: "One row per rung of the Replacement Ladder: Admin, Delivery, Marketing, Sales, Leadership. Each shows a bar and “2/5” (processes documented or delegated / all processes in that rung) or “none”. At the top right: “4/10 ready · 40%”. Under it: “3 tasks marked “should not be me”: record the process next time.” Link “Delegation →”. Empty: “No processes yet. Start with the admin rung: what you repeat every week. Document a process →”.",
          },
          {
            name: "Needs your attention (panel)",
            what: "Full-width panel with a siren icon. Hint: “Issues to solve, decisions to review, and how you're holding up”. Three columns.",
          },
          {
            name: "Top issues (column)",
            what: "Your top 3 open issues, numbered 1–3, ranked by priority then age. Each shows a P1/P2/P3 chip and “Identified” or “Discussing”. Count chip and link “IDS →”. Empty: “No open issues. Log what's in the way before it grows. Add an issue →”.",
          },
          {
            name: "Decisions to review (column)",
            what: "Up to 4 decisions whose review date has arrived, with an hourglass: “Review due today · you were 70% sure”. A “Review now” button opens the Decisions page. Count chip and link “Journal →”. Empty: “No reviews due (2 awaiting an outcome later). Journal big calls to learn how good your judgement is.”",
          },
          {
            name: "Energy & load (column)",
            what: "A bar “Hours this week 41 / 55h cap”. Three small boxes: sleep 7d (average sleep from check-ins, amber under 6.5h), energy (average energy /5) and days since rest (amber at 14+, “28+” when longer). Then observations with icons, e.g. “41h this week, close to your 55h cap.”, “Sleep averaged 6.1h over the last 7 days (under 6.5h).”, “16 days since a day off.” or “No load warnings this week. Sustainable pace.” At the bottom: “Free Day protected: Saturday.” or “No Free Day protected this week yet.” with a “Plan the week” link.",
            how: "Click an observation to open Insights or the Week page. A rest day is a Free Day, or a day with no focus session.",
          },
        ],
        howTo: [
          "Open Founder HQ (Founder → Founder HQ) in the morning.",
          "Read the Big 3. If empty, click “Set the Big 3”.",
          "Read the status line. Click every amber item and clear it.",
          "Scan the six KPI tiles. Red or amber? Click the tile.",
          "In Revenue engine, do the next steps due today.",
          "Once a week, go through the Scorecard, Time & operations and Needs your attention panels, then click “Weekly review”.",
        ],
      },
    ],
    frameworks: [
      {
        term: "The CEO view",
        definition:
          "One screen that shows the health of every engine of the business at the same time: sales, marketing, delivery, money promises, time and energy. You look at it often, so problems show up early.",
        example: "Monday 9:00: Bish sees 0 deals won for 3 weeks and 2 deals without a next step. He blocks 2 hours for sales before any delivery work.",
        source: "Founder dashboards; EOS Scorecard (Gino Wickman, Traction)",
      },
      {
        term: "Weekly Big 3",
        definition: "The three outcomes that would make this week a win. You set them on the Week page. Fewer goals means more focus.",
        example: "1. Send 2 proposals. 2. Publish the hub video. 3. Close the Acme deal.",
        source: "The Rule of 3 (Chris Bailey, The Productivity Project)",
      },
      {
        term: "Revenue engine",
        definition: "Everything that turns strangers into paying clients: open deals, their next steps, and the promises you made to clients.",
        example: "8 open deals worth $24K, 3 steps due today, 1 promise overdue.",
        source: "bishOS",
      },
      {
        term: "Marketing engine",
        definition: "Everything that makes people know and want your offer: the weekly hub content, pieces in production, live offers and live campaigns.",
        example: "1 hub video a week, 1 live offer, 1 live LinkedIn campaign.",
        source: "bishOS",
      },
      {
        term: "Hub content and hub cadence",
        definition:
          "A hub piece is one big piece of content (a long video, a long article) that you cut into many small posts. Hub cadence is how many hub pieces you publish per week compared with your target (Settings → Founder engines → Hub content pieces / week).",
        example: "Target 1. You published one podcast episode this week → 1/1, green bar, streak +1.",
        source: "Pillar / hub-and-spoke content (Gary Vaynerchuk content model)",
      },
      {
        term: "Hours by area vs budget",
        definition:
          "Each life area has a weekly hour budget in Compass. Founder HQ compares it with the hours you really worked (focus sessions + done schedule blocks). It shows if your time matches your priorities.",
        example: "Sales budget 10h, actual 3h. Delivery budget 20h, actual 31h. Delivery is eating your sales time.",
        source: "Time budgeting (bishOS); Calendar audit (Dan Martell, Buy Back Your Time)",
      },
      {
        term: "Delegation readiness",
        definition:
          "How many of your repeated processes are written down (documented) or already handed off (delegated). A process that is documented can be given to a freelancer or hire tomorrow.",
        example: "Admin rung: 4 of 5 processes documented → 80% ready. You could hire a VA next month.",
        source: "Buy Back Your Time (Dan Martell)",
      },
      {
        term: "Replacement Ladder",
        definition:
          "The order in which a founder hands off work: first Admin, then Delivery, then Marketing, then Sales, and last Leadership. The rungs in Delegation readiness follow this order.",
        example: "Bish first hands off invoicing and scheduling (Admin), then project delivery to a developer (Delivery).",
        source: "Buy Back Your Time (Dan Martell)",
      },
      {
        term: "“Should not be me” tasks",
        definition: "Tasks you marked for delegation. Founder HQ counts them and reminds you to record the process the next time you do one.",
        example: "“Send monthly invoices” is marked. Next time, record your screen while you do it and save it as a process.",
        source: "Buy Back Your Time (Dan Martell)",
      },
      {
        term: "Hours cap",
        definition:
          "The weekly work hours you don't want to cross (Settings → Wellbeing → Weekly work-hours warning, default 55). The Hours tile turns blue near it (85%) and amber at or above it.",
        example: "Cap 55h. You logged 48h by Thursday → blue. 56h on Saturday → amber and a warning in Energy & load.",
        source: "WHO/ILO study on long working hours (2021)",
      },
      {
        term: "Free Day",
        definition: "A full day with no work at all, protected in advance on the Week page. Rest days keep your judgement sharp.",
        example: "Saturday is your Free Day: no email, no client calls.",
        source: "The Entrepreneurial Time System (Dan Sullivan, Strategic Coach)",
      },
      {
        term: "Days since rest",
        definition: "Days since your last Free Day or your last day with no focus session (looking back up to 28 days). At 14 or more it turns amber and an observation appears.",
        example: "You worked 16 days in a row → “16 days since a day off.”",
        source: "bishOS wellbeing observations",
      },
      {
        term: "Win rate (all-time, on Founder HQ)",
        definition: "Deals won ÷ (deals won + deals lost), over all time. Unqualified deals are left out. Note: the Pipeline page shows a 90-day win rate instead.",
        example: "6 won, 12 lost → 33% win rate.",
        source: "Standard sales metric",
      },
    ],
    testing: [
      "Open Founder → Founder HQ. Expected: the greeting line with this week's dates, the focus strip, six KPI tiles, Revenue engine, Marketing engine, Scorecard, Time & operations and Needs your attention. While loading, grey skeletons keep the same size (nothing jumps).",
      "With no Big 3 set, check the focus strip. Expected: “No Weekly Big 3 yet…” and a “Set the Big 3” button. Click it. Expected: the Week page opens. Add 2 outcomes and come back. Expected: Big 1 and Big 2 are filled, slot 3 shows “+ Add Big 3”, and “0/2 done” shows on the right.",
      "In the Scorecard panel click “Start with the founder scorecard”. Expected: toast “Founder scorecard ready”, confetti, and 7 rows (6 with ⚡). The Scorecard tile shows a number like “3/7”.",
      "In Pipeline, add a deal with a next step dated yesterday (or move a deal's step to yesterday). Return to Founder HQ. Expected: the status line says “1 deal step due (1 overdue)”, Next steps due lists it with amber “Overdue · Yesterday”, and the Open pipeline tile shows the new total.",
      "Mark a deal as won in Pipeline with a value of 1000. Expected on Founder HQ: the Won this week tile shows the value in green and this week's bar grows.",
      "In Commitments, add an “I owe” promise due yesterday. Expected: status line “1 promise overdue”, Promises due shows it with amber “Overdue”, the Promises kept tile drops.",
      "Start and finish a short focus session linked to a task in a life area. Expected: Hours by Life Area adds the time to that area and Hours this week goes up.",
      "Click each KPI tile. Expected: Scorecard → /scorecard, Open pipeline and Won this week → /pipeline, Promises kept → /commitments, Hub content → /content, Hours this week → /insights.",
      "Click “Weekly review” and “Scorecard” in the header. Expected: they open /reviews and /scorecard.",
    ],
    tips: [
      "Read the page top to bottom. The order is on purpose: focus first, then numbers, then engines, then problems.",
      "An amber number is a task, not a feeling. Click it and do one action.",
      "If Hours by Life Area shows a big “No area” row, link your tasks and projects to areas so the picture is true.",
      "Founder HQ never changes data. It only reads. Fix things on the linked pages.",
    ],
  },

  // ───────────────────────────────────────────────────────────────────────
  // PIPELINE
  // ───────────────────────────────────────────────────────────────────────
  {
    id: "pipeline",
    group: "Founder",
    title: "Pipeline",
    summary:
      "Your founder-led sales board. Every deal moves through six open stages (Target → Contacted → Booked → Discovery → Proposal → Verbal yes) and closes as Won, Lost or Unqualified. Every open deal must have a dated next step. The page also has your daily outreach quota and meetings goal.",
    why:
      "Deals die in silence: you forget a follow-up and the lead goes cold. The pipeline makes that impossible. No deal can be open without a next step and a date, and flags warn you when a deal is idle, stuck or a proposal is waiting too long. The outreach meter keeps the top of the funnel full every day, even in busy delivery weeks. Winning a deal creates the customer account and the delivery project for you.",
    when: {
      oneTime:
        "Set your targets: Settings → Founder engines → Daily outreach quota (default 20) and Daily meetings goal (default 2), and your Currency. Then add every live opportunity as a deal with its real stage and next step (about 20 minutes).",
      daily:
        "Morning: click the “Next steps due” tile and do each step. Do your outreach until the ring is full (click “+1 touch” after each message). After every sales call, log it and move the deal. Stop prospecting when you see “Goal hit — you can stop prospecting today”.",
      weekly: "Filter “Needs attention” and clear every flag (idle, stuck, proposal open, no next step). Check the win rate and Closed deals: what did the lost reasons say?",
      monthly: "Look at “Won this month” and the 90-day win rate. Read your lost reasons and sharpen your qualification.",
    },
    pages: [
      {
        route: "/pipeline",
        title: "Pipeline",
        purpose: "See every open deal by stage, do today's next steps, track today's outreach and close deals.",
        elements: [
          {
            name: "Pipeline (page header)",
            what: "Title with a board icon and the line “Founder-led sales. No open deal without a dated next step.”",
          },
          {
            name: "Route a conversation (button)",
            what: "Outline button with a magic wand (“Route” on phones). Opens the AI dialog that turns call notes into promises, tasks, a deal update, new people and content ideas.",
            how: "Click it after a sales call and paste your notes. See Commitments → Route a conversation for every step.",
          },
          {
            name: "New deal (button)",
            what: "Dark button. Opens the New deal dialog with the stage set to Target.",
            how: "Click it, fill in the deal and its next step, click “Add deal”.",
          },
          {
            name: "Open pipeline (tile)",
            what: "Total value of open deals. Under it: “8 open deals · ~34d to close”. The days to close is the average time from creating a deal to winning it, for deals won in the last 90 days.",
          },
          {
            name: "Win rate · 90 days (tile)",
            what: "Won ÷ (won + lost) for deals closed in the last 90 days. Unqualified deals don't count. Green at 30% or more. Under it: “3 won · 6 lost”, or “Close a few deals to see it”.",
          },
          {
            name: "Next steps due (tile)",
            what: "How many open deals have a next step due today or overdue. Under it: “2 today · 1 overdue” or “All caught up”. Amber with overdue steps, blue with steps due today, green with none. The tile is a button.",
            how: "Click it to show only due deals (the tile gets a dark border). Click again to show all.",
          },
          {
            name: "Outreach today (meter)",
            what: "A ring with “12/20” (outreach touches today / your daily quota). Next to it: “8 to go · outreach + follow-ups”, or “Quota done. Anything more is a bonus.” when full. Only Outreach and Follow-up touches count toward the quota.",
          },
          {
            name: "Adjust sales targets (gear icon)",
            what: "Small gear on the meter. Opens a popover with “Daily outreach touches” (hint: “20–30 during heavy delivery weeks”) and “Meetings goal (open to goal)” (hint: “Stop prospecting once this many are booked”), plus Cancel and Save.",
            how: "Type new numbers and click Save. Toast: “Sales targets updated”. It changes the same values as Settings → Founder engines.",
          },
          {
            name: "+1 touch (button)",
            what: "Dark button with a lightning icon on the meter. One click logs one Outreach touch for today, with no person and no dialog. +2 XP.",
            how: "Click it every time you send a cold message or DM. Toast: “Touch logged · 13/20 today”. The touch that fills the quota shows “Outreach quota done: 20/20”.",
          },
          {
            name: "With person (button)",
            what: "Outline button on the meter. Opens the “Log a touch” dialog with Outreach selected, so you can link the person and deal.",
          },
          {
            name: "Meetings booked (bar)",
            what: "Under the meter: “Meetings booked 1/2” with a blue bar. Meetings today = deals moved to Booked today + calls and meetings you logged today. When you reach the goal the bar is replaced by a green box: “Goal hit — you can stop prospecting today”.",
          },
          {
            name: "Board / List (view switch)",
            what: "Switch between the stage board and a sortable table. The page remembers your choice in this browser.",
          },
          {
            name: "All / Needs attention / Due (filter)",
            what: "All shows every open deal. Needs attention (with a count) shows deals with any flag or a step due today. Due (with a count) shows deals with a step due today or overdue.",
          },
          {
            name: "Search deals, people…",
            what: "Search box. It matches the deal name, person, company and next step text.",
            how: "Type a few letters. The board or list filters as you type.",
          },
          {
            name: "Stage columns (board)",
            what: "Six columns: Target, Contacted, Booked, Discovery, Proposal, Verbal. Each header has a coloured dot, the name and a count. Under it: the column total and the stage meaning, e.g. “Σ $8K · Proposal is with them”.",
            how: "Drag a card to another column to move the deal. A dialog asks for what the rules need (next step, reason, or win details). Drag and drop needs a mouse; on a phone use the Stage field in the deal drawer.",
          },
          {
            name: "Deal card",
            what: "Shows the deal name, the value (e.g. “$4.5K”), the person and company with an avatar, the next step with a date chip (amber when overdue, blue when today) and up to 3 flag chips (+N for more).",
            how: "Click a card to open the deal drawer.",
          },
          {
            name: "Flag chips",
            what: "Warnings on a deal: “No next step” (no step or no date), “Overdue” (the step date passed), “Proposal 11d” (proposal out 9+ days), “Stuck 15d” (14+ days in the same stage), “Idle 8d” (no touch for 7+ days). Hover a chip to read its meaning.",
          },
          {
            name: "+ Add (column footer)",
            what: "Dashed button at the bottom of each column.",
            how: "Click it to open New deal with that column's stage already picked.",
          },
          {
            name: "List view table",
            what: "Top line: “8 open · $24,000” and a Sort menu: Next step date, Value, Stage (latest first), Longest idle. Columns: Deal (name + person · company), Stage, Value, Next step (with date chip), Last touch (e.g. “5d ago”), Flags (up to 2).",
            how: "Click a row to open the deal drawer.",
          },
          {
            name: "Your pipeline is empty (empty state)",
            what: "Text “Add the people you want to sell to as Targets. Every deal gets a dated next step, so nothing slips.” and the button “Add your first deal”.",
          },
          {
            name: "Nothing matches",
            what: "Shown in List view when the search or filter hides every deal: “Clear the search or filter to see every open deal.”",
          },
          {
            name: "Closed deals (strip)",
            what: "A collapsible card under the board: “Closed deals”, a green “Won this month: $6,000 (2)” and “5 won · 9 lost/unqualified”.",
            how: "Click the strip to open it. Switch between “Won” and “Lost & unqualified” (with counts). Each card shows the deal, the company and “won 3 days ago”, or “Lost: No budget”, plus the value. Click a card to open the deal (you can reopen it there).",
          },
          {
            name: "Flags legend",
            what: "Small grey line at the bottom: “Flags: idle = no touch 7+ days · stuck = 14+ days in a stage · proposal open 9+ days · overdue next step”.",
          },
        ],
        howTo: [
          "Click “New deal”. Pick or type the contact, name the deal, pick the stage, write the next step and its date. Click “Add deal”.",
          "Every morning click the “Next steps due” tile and do each step.",
          "After you do a step, open the deal and write the new next step and date. Never leave a deal without one.",
          "When a deal moves forward, drag its card to the next column and confirm the next step.",
          "Do your outreach. Click “+1 touch” after each message until the ring is full.",
          "When they say yes, click Won in the drawer, enter the value and keep “Create delivery project” ticked.",
          "When they say no, click Lost (or Unqualified) and pick a reason. The person stays in People as a nurture contact.",
        ],
      },
      {
        route: "/pipeline?deal=<id>",
        title: "Deal drawer",
        purpose: "Everything about one deal in a side panel: stage, value, next step, contact, qualification, source, offer, campaign, touches, promises, tasks, delivery and notes.",
        elements: [
          {
            name: "Drawer title",
            what: "The deal name. The drawer opens from the right. A link with ?deal=<id> opens it directly (Customers and other pages use this).",
          },
          {
            name: "Deal name (field)",
            what: "Big text field at the top.",
            how: "Click, type, then press Enter or click away. It saves on blur. Esc cancels.",
          },
          {
            name: "Stage (select)",
            what: "All nine stages: Target, Contacted, Conversation booked, Discovery done, Proposal sent, Verbal yes, Won, Lost, Unqualified.",
            how: "Pick a stage. The move dialog opens with the right questions.",
          },
          {
            name: "Value (currency)",
            what: "The deal value in your currency, e.g. “Value (USD)”. Empty or 0 means no value.",
            how: "Type the number and click away.",
          },
          {
            name: "Stage progress (stepper)",
            what: "Six thin segments for the open stages. Filled up to the current stage. Hover a segment to read the stage and its meaning. Only shown while the deal is open.",
            how: "Click a segment to move the deal to that stage.",
          },
          {
            name: "Status chips",
            what: "The stage chip, “12d in stage”, “Won Tuesday” (won deals), the value, and every flag chip.",
          },
          {
            name: "Why it didn't close",
            what: "Shown only for Lost and Unqualified deals: a short reason field.",
            how: "Edit the reason and click away.",
          },
          {
            name: "Next step (box)",
            what: "Shown while the deal is open. A text field (placeholder = the suggested step for the stage, e.g. “Follow up on the proposal”) and a date. The box turns amber when the step is overdue or missing. Overdue text: “This was due 3 days ago. Do it, or pick a new date.”",
            how: "Type the step and pick the date. The date saves as soon as you pick it. Clearing the step on an open deal is refused with “Open deals need a next step and a date. What happens next, and when?”",
          },
          {
            name: "Contact: Person",
            what: "A person picker. Search your People or add a new person.",
            how: "Type a name and pick it, or choose “Add “Sara @ Acme”” to create the person and company in one go. Click × to unlink.",
          },
          {
            name: "Contact: Company",
            what: "Company name with suggestions from your companies. A new name creates the company as a Prospect.",
            how: "Type or pick a name and click away.",
          },
          {
            name: "Person / company links",
            what: "Small buttons under the contact fields with the person's avatar or a building icon and ↗.",
            how: "Click to open the person profile or the company page.",
          },
          {
            name: "Qualification",
            what: "Four fields with a check mark when filled: Pain (“What hurts, in their words?”), Budget (“Range they confirmed”), Decision-maker (“Who signs? Who else weighs in?”), Timeline (“When do they need it live?”).",
            how: "Fill them during discovery. Pain and Timeline are copied into the delivery project description when you win.",
          },
          {
            name: "Source & offer",
            what: "Three selects: Source channel (Outbound, Inbound, Referral, Content, Network, Event, Ads, Other), Offer (your offers; retired ones are marked “(retired)”) and Campaign.",
            how: "Pick values. Linking an offer or campaign makes its results count this deal.",
          },
          {
            name: "Delivery (won deals only)",
            what: "Shows the linked delivery project with a progress bar, or a “Create delivery project” button.",
            how: "Click the button, check the project name and life area, click “Create project”.",
          },
          {
            name: "Touches (N)",
            what: "The timeline of every touch on this deal (newest first) with icon, kind, day, channel and summary. A “Log touch” button opens the dialog with Follow-up selected and the person locked.",
            how: "Hover a touch and use “…” → “Delete touch” to remove it (its XP is removed too).",
          },
          {
            name: "Commitments",
            what: "Promises linked to this deal, both directions, with an “Add” button. Empty: “No promises on this deal yet.”",
            how: "Click Add to log what you promised (or what they promised) on this deal.",
          },
          {
            name: "Linked tasks",
            what: "Shown only when tasks are linked to the deal: a status dot, the title and the planned day.",
          },
          {
            name: "Notes",
            what: "A free text box: “Context, objections, what they care about…”.",
            how: "Type and click away to save.",
          },
          {
            name: "Won / Lost / Unqualified (footer buttons)",
            what: "Shown while the deal is open. Each opens the matching close dialog.",
          },
          {
            name: "Reopen (footer button)",
            what: "Shown on closed deals. A won deal reopens to Verbal yes; a lost or unqualified deal reopens to Contacted. It asks for a new next step. Reopening a won deal removes its +100 XP.",
          },
          {
            name: "Delete (footer button)",
            what: "Grey button on the right. Asks “Delete “Acme”? Touches and commitments stay, unlinked.”",
            how: "Confirm to delete. Its stage XP is removed.",
          },
        ],
      },
      {
        route: "/pipeline",
        title: "New deal (dialog)",
        purpose: "Create a deal with its first next step. The next step and its date are required.",
        elements: [
          { name: "Contact", what: "Person picker.", how: "Pick a person. If the deal name or company is empty, they are filled from the person (company name, or the person's name)." },
          { name: "Company", what: "Company name with suggestions (placeholder “Acme Inc.”). New names create a Prospect company." },
          { name: "Deal name", what: "Required. Placeholder “Acme: website rebuild”." },
          { name: "Value", what: "Optional number. Placeholder shows your currency." },
          {
            name: "Stage",
            what: "One of the six open stages (Target, Contacted, Conversation booked, Discovery done, Proposal sent, Verbal yes).",
            how: "Changing it also changes the suggested next step (until you type your own).",
          },
          { name: "Source channel", what: "Default Outbound. Options: Outbound, Inbound, Referral, Content, Network, Event, Ads, Other." },
          { name: "Offer", what: "Pick one of your offers.", how: "If the value is empty, the offer price is copied into Value." },
          { name: "Campaign", what: "Shown only when you have at least one campaign that is not done." },
          {
            name: "Next step (required box)",
            what: "Label “Next step (required: no deal without a dated next step)”. A text field (pre-filled, e.g. “Send the first message”) and a date (today for Target, otherwise in 2 days).",
          },
          { name: "Date chips", what: "Today, Tomorrow, +3 days, Next week.", how: "Click one to set the date." },
          {
            name: "Add deal (button)",
            what: "Disabled until the deal has a name, a next step and a date.",
            how: "Click it. At Target you see “Deal added to the pipeline”. At a later stage you get +10 XP (“Deal added · Contacted”).",
          },
          { name: "Cancel", what: "Closes without saving." },
        ],
      },
      {
        route: "/pipeline",
        title: "Move a deal (dialogs)",
        purpose: "The rules of the pipeline, built into every stage change (drag, Stage select, stepper or footer buttons).",
        elements: [
          {
            name: "Move to <stage> (open stages)",
            what: "Title like “Move to Proposal sent”. Line: “Proposal sent: Proposal is with them. Every open deal needs a dated next step.”",
          },
          {
            name: "Discovery warning",
            what: "When moving to Discovery done with missing qualification: “Discovery is done when pain, budget and the decision-maker are confirmed. Still missing: budget, decision-maker. You can fill them in the deal.” It warns but does not block.",
          },
          {
            name: "Next step / Keep current",
            what: "The suggested step for the new stage. If the deal had another step, a link “Keep current: “…”” puts the old text back.",
          },
          {
            name: "When",
            what: "Date with Today / Tomorrow / +3 days / Next week chips. It keeps the current date if it is still in the future, otherwise in 2 days (today for Target).",
          },
          {
            name: "Move to <short stage> (button)",
            what: "Saves the move. A forward move gives +10 XP once per stage per deal (“Acme → Proposal”). Moving backwards removes the XP of the stages you left. Moving to Booked counts as a meeting for today; if it reaches your goal you see “Goal hit — you can stop prospecting today”.",
          },
          {
            name: "Won dialog",
            what: "Title with a party icon and the deal name. Green box: “Close it as won · +100 XP, and the company moves to Customers.” Fields: Deal value, Customer account (only if the deal has no company, “Files it under Customers”), and a “Create delivery project” checkbox (ticked when no project exists) with Project name (“Acme: delivery”) and Life area (an area named like Operations / Delivery / Client is picked first).",
            how: "Check the value, keep the box ticked and click “Mark as won”. Confetti, +100 XP, and “Delivery project created · In Company Operations”.",
          },
          {
            name: "Lost / Unqualified dialog",
            what: "“Not this time.” (Lost) or “Not a fit.” (Unqualified), then “A one-line reason makes your qualification sharper.” and “Sara stays in People as a nurture contact.” A Reason box and quick chips: No budget, Bad timing, Chose a competitor, No decision, Not a fit, Went quiet.",
            how: "Write or click a reason (required) and click “Close as lost” / “Close as unqualified”. Toast: “Closed as lost. Kept as a nurture contact · Sara stays in People with a 90-day cadence”.",
          },
        ],
      },
      {
        route: "/pipeline",
        title: "Log a touch (dialog)",
        purpose: "Record any contact with a person: outreach, follow-up, call, meeting, email, DM or a private note. Used on Pipeline, People, person and company pages and Customers.",
        elements: [
          {
            name: "Kind buttons",
            what: "Seven buttons: Outreach (first touch / cold message), Follow-up (nudge after no reply), Call (phone or video call), Meeting (a held meeting), Email (email exchange), DM (LinkedIn / X / WhatsApp chat), Note (private note, not a touch). Hover for the hint.",
            how: "Click one. Outreach and Follow-up count toward the quota. Call and Meeting count toward the meetings goal. Note never counts as contact.",
          },
          { name: "Who (optional)", what: "Person picker. Hidden when the dialog was opened from a person's page (the person is locked)." },
          {
            name: "What happened? / Note",
            what: "Text box. Placeholder depends on the kind (“Sent a personalised DM about…”, “Talked about… They need… Next…”). If you leave it empty, bishOS writes e.g. “Outreach with Sara”.",
            how: "Press Ctrl+Enter (Cmd+Enter on Mac) to save quickly.",
          },
          {
            name: "Deal",
            what: "“No deal” or the person's open deals. If the person has exactly one open deal, it is linked for you.",
          },
          { name: "Channel", what: "LinkedIn, Email, Phone, WhatsApp, X, Instagram, In person, Other." },
          { name: "Day", what: "The date of the touch (today by default, no future dates). You can backdate a touch you forgot." },
          { name: "Outreach counter", what: "Bottom left: “12/20 outreach today”." },
          {
            name: "Log touch / Save note (button)",
            what: "Saves the touch. Every touch except a note gives +2 XP and updates the person's last contact and the deal's last touch (which clears the idle flag).",
          },
        ],
      },
    ],
    frameworks: [
      {
        term: "Founder-led sales",
        definition:
          "In the early days the founder sells, not a sales team. You learn what customers really want, and later you can teach it to a salesperson. It needs a simple, honest process and a daily habit.",
        example: "Bish runs every discovery call himself for the first 20 clients, writing down their exact words about their pain.",
        source: "Founding Sales (Pete Kazanjy)",
      },
      {
        term: "Pipeline",
        definition: "The list of every possible sale, sorted by how close it is to a yes. Each step is a stage.",
        example: "12 open deals: 5 Targets, 3 Contacted, 2 Booked, 1 Proposal, 1 Verbal yes.",
        source: "Standard sales practice",
      },
      {
        term: "Target (stage)",
        definition: "Researched, not contacted yet. You know who they are and why they might need you. Suggested next step: “Send the first message”.",
        example: "A clinic owner on LinkedIn who just posted about hiring a receptionist.",
        source: "bishOS stages, based on Founding Sales (Kazanjy)",
      },
      {
        term: "Contacted (stage)",
        definition: "You reached out and are waiting for a reply. Suggested next step: “Follow up”.",
        example: "You sent a personal DM on Monday. Next step: follow up on Thursday.",
        source: "bishOS stages",
      },
      {
        term: "Conversation booked (stage, “Booked”)",
        definition: "A call is on the calendar. Moving a deal here counts as a meeting for today's goal. Suggested next step: “Run the discovery call”.",
        example: "Sara accepted a 30-minute call for Wednesday 3 pm.",
        source: "bishOS stages",
      },
      {
        term: "Discovery done (stage)",
        definition: "Pain, budget and the decision-maker are confirmed. The app warns you if those fields are empty. Suggested next step: “Send the proposal”.",
        example: "Pain: 10 hours a week on manual reports. Budget: $5–8K. Decision-maker: the CFO.",
        source: "bishOS stages; BANT qualification (IBM)",
      },
      {
        term: "Proposal sent (stage)",
        definition: "Your proposal is with them. A 9-day clock starts. After 9 days the deal gets the “Proposal Nd” flag. Suggested next step: “Follow up on the proposal”.",
        example: "Proposal emailed on the 1st. On the 10th the flag appears: chase it or close it.",
        source: "bishOS stages; Founding Sales (Kazanjy)",
      },
      {
        term: "Verbal yes (stage)",
        definition: "They said yes but nothing is signed or paid. Suggested next step: “Send contract + invoice”.",
        example: "“Let's do it” on the call. You send the contract the same day.",
        source: "bishOS stages",
      },
      {
        term: "Won",
        definition: "Signed and paid. +100 XP. The company becomes a Customer (health Healthy), the person becomes a Customer, and you can create the delivery project in one click.",
        example: "Acme signs. Acme appears on the Customers page with “Acme: delivery” project at 0%.",
        source: "bishOS",
      },
      {
        term: "Lost",
        definition: "Not this time. You must write a short reason. The person gets a 90-day keep-in-touch cadence (if they had none) so they come back as a nurture contact.",
        example: "Lost: Bad timing. In 90 days Sara shows up in “Due to reconnect”.",
        source: "bishOS",
      },
      {
        term: "Unqualified",
        definition: "Not a fit (wrong size, no real pain, no budget ever). Also needs a reason and also becomes a nurture contact. It does not count in the win rate.",
        example: "A student wanted a free website: Unqualified, reason “Not a fit”.",
        source: "bishOS",
      },
      {
        term: "Next step (the next-step rule)",
        definition:
          "Every open deal must have a concrete next action and a date. bishOS refuses to create or move an open deal without both. This is the one rule that stops deals from going cold.",
        example: "Bad: “Follow up sometime.” Good: “Send case study + pricing” on Friday.",
        source: "Founding Sales (Pete Kazanjy); common sales discipline",
      },
      {
        term: "Idle flag (7 days)",
        definition: "No touch logged and no stage change for 7 days or more on an open deal.",
        example: "Last DM 8 days ago → “Idle 8d”. Log a follow-up to clear it.",
        source: "bishOS flags, based on Founding Sales",
      },
      {
        term: "Stuck flag (14 days)",
        definition: "The deal has been in the same stage for 14 days or more. Something is blocking it.",
        example: "In Discovery for 15 days → “Stuck 15d”. Ask: what is stopping the proposal?",
        source: "bishOS flags",
      },
      {
        term: "Proposal-open flag (9 days)",
        definition: "The proposal has been out for 9 days or more. Chase it, or close the deal as lost.",
        example: "“Proposal 11d” → call them: “Is this still a priority for this quarter?”",
        source: "bishOS flags",
      },
      {
        term: "Overdue flag",
        definition: "The next-step date is in the past. Do the step or pick a new date.",
        example: "Step date was yesterday → amber “Overdue” chip.",
        source: "bishOS",
      },
      {
        term: "Needs attention",
        definition: "A filter that shows open deals with any flag (no next step, overdue, proposal open, stuck, idle) or a step due today.",
        example: "Friday afternoon: filter Needs attention and clear every card.",
        source: "bishOS",
      },
      {
        term: "Qualification (Pain, Budget, Decision-maker, Timeline)",
        definition: "Four facts that tell you if a deal can close: what hurts, how much they can pay, who signs, and when they need it.",
        example: "Pain: losing leads at night. Budget: $3K. Decision-maker: owner. Timeline: before January.",
        source: "BANT (IBM); Founding Sales (Kazanjy)",
      },
      {
        term: "Win rate (90 days, on Pipeline)",
        definition: "Of the deals closed in the last 90 days, the share you won: won ÷ (won + lost). Unqualified deals are left out. Green at 30% or more.",
        example: "3 won, 6 lost in 90 days → 33%.",
        source: "Standard sales metric",
      },
      {
        term: "Days to close (sales cycle)",
        definition: "The average number of days from creating a deal to winning it, for deals won in the last 90 days.",
        example: "“~34d to close”: a lead you add today will likely close next month.",
        source: "Standard sales metric (sales velocity)",
      },
      {
        term: "Pipeline coverage",
        definition:
          "Open pipeline value divided by the revenue you still need in the period. A common rule is 3× coverage, because you won't win every deal. bishOS shows the open value; you do the division.",
        example: "You need $10K this quarter. Open pipeline is $24K → 2.4× coverage. Add more Targets.",
        source: "Common B2B sales rule of thumb",
      },
      {
        term: "Rule of 100",
        definition:
          "Do 100 primary actions to get customers every day (for example 100 outreach messages) for 100 days. That is about 4 hours a day.",
        example: "Hormozi's advice: 100 cold DMs a day until leads come in.",
        source: "$100M Leads (Alex Hormozi)",
      },
      {
        term: "Outreach quota (and why it is lower than 100)",
        definition:
          "Your daily number of outreach + follow-up touches. Default 20. You also run delivery and marketing, so 100 a day is not realistic. The quota editor suggests 20–30 in heavy delivery weeks. The founder scorecard target of 100 touches a week equals 20 a day over 5 days.",
        example: "Quota 20: 12 new DMs + 8 follow-ups before lunch, then delivery work.",
        source: "Adapted from the Rule of 100 ($100M Leads, Alex Hormozi)",
      },
      {
        term: "Open to goal",
        definition:
          "Prospect until you book your daily meetings goal (default 2), then stop and switch to other work. Meetings = deals moved to Booked today + calls and meetings logged today.",
        example: "Goal 2. By 11 am you booked 2 calls → “Goal hit — you can stop prospecting today”. You spend the afternoon on delivery.",
        source: "bishOS daily sales block",
      },
      {
        term: "Touch",
        definition: "Any logged contact with a person: Outreach, Follow-up, Call, Meeting, Email or DM (+2 XP each). A Note is not a touch. Touches update “last contact” and clear the idle flag.",
        example: "You replied to Sara's email → log an Email touch on her deal.",
        source: "bishOS",
      },
      {
        term: "Won → delivery project",
        definition:
          "When you win, bishOS can create the delivery project in your operations area. It links the project to the deal and the customer, copies the pain, timeline and notes into the description, and moves open promises on the deal into the project.",
        example: "Win “Acme: website rebuild” → project “Acme: delivery” in Company Operations, with your promise “Send kickoff agenda” attached.",
        source: "bishOS",
      },
      {
        term: "Source channel",
        definition: "Where the deal came from: Outbound, Inbound, Referral, Content, Network, Event, Ads or Other. Over time it shows which channel brings real clients.",
        example: "4 of 5 won deals came from Referral → ask every happy client for an intro.",
        source: "Lead source attribution",
      },
    ],
    testing: [
      "Open Founder → Pipeline. Expected: the header, four tiles (Open pipeline, Win rate · 90 days, Next steps due, Outreach today) and the board or the empty state “Your pipeline is empty”.",
      "Click “New deal”. Clear the next step text. Expected: “Add deal” is disabled. Type a name, a next step and pick “Tomorrow”. Click “Add deal”. Expected: toast “Deal added to the pipeline” and a card in the Target column with the step and a “Tomorrow” chip.",
      "Click “+ Add” under Contacted and create a deal there. Expected: toast with +10 XP (“Deal added · Contacted”).",
      "Drag the Target card to Contacted. Expected: the “Move to Contacted” dialog with the step “Follow up” and a date in 2 days. Click “Move to Contacted”. Expected: +10 XP toast and the card moves.",
      "Drag a card to Discovery while Pain, Budget and Decision-maker are empty. Expected: the amber warning “Discovery is done when pain, budget and the decision-maker are confirmed…”. Move anyway. Expected: the move works.",
      "Open a deal and delete the next step text, then click away. Expected: an amber toast “Open deals need a next step and a date…” and the old text comes back.",
      "Set a deal's next-step date to yesterday. Expected: amber “Overdue” chip on the card, the box in the drawer turns amber with “This was due yesterday. Do it, or pick a new date.”, and the Next steps due tile counts it as overdue.",
      "Click “+1 touch” on the meter. Expected: the ring goes from 0/20 to 1/20, toast “Touch logged · 1/20 today” with +2 XP.",
      "Click the gear, set Daily outreach touches to 2, Save. Click “+1 touch” again. Expected: “Outreach quota done: 2/2” celebration and “Quota done. Anything more is a bonus.” Set it back to 20.",
      "Click “With person”, pick a person with one open deal. Expected: the Deal field selects that deal by itself. Choose Meeting, write a summary, click “Log touch”. Expected: toast “Touch logged” with “Meetings today: 1/2”, the Meetings booked bar moves to 1/2.",
      "Move a deal to Booked when you are at 1/2 meetings. Expected: “Goal hit — you can stop prospecting today” celebration and a green box on the meter.",
      "Open a deal, click Won. Enter 1000 as value, keep “Create delivery project” ticked, click “Mark as won”. Expected: confetti, +100 XP, toast “Delivery project created”, the company shows on the Customers page, and the drawer shows the project in Delivery.",
      "Open another deal, click Lost, click the chip “No budget”, click “Close as lost”. Expected: toast “Closed as lost. Kept as a nurture contact” and, if the deal has a person without a cadence, that person now has “Quarterly” (90 days) on the People page.",
      "Open Closed deals. Expected: “Won this month” shows the won value. Switch to “Lost & unqualified”. Expected: the lost deal with “Lost: No budget”. Click it, click Reopen. Expected: the move dialog to Contacted.",
      "Switch to List, choose Sort “Longest idle”. Reload the page. Expected: the page stays in List view (remembered). Click the “Due” filter. Expected: only due or overdue deals.",
      "Delete a touch from a deal's Touches list (… → Delete touch). Expected: a confirm, then “Touch deleted”, the XP is removed and Last touch updates.",
    ],
    tips: [
      "Write next steps as verbs with an object: “Send pricing PDF”, not “pricing”.",
      "If a deal has been idle twice, ask a direct question: “Should I close your file for now?” People often reply to that.",
      "Use Lost reasons honestly. After 10 losses, read them: they tell you what to fix in your offer or your targeting.",
      "On a phone, open a card and use the Stage field instead of dragging.",
      "Moving a deal back and forth does not farm XP: each forward stage pays once, and moving back removes it.",
    ],
  },

  // ───────────────────────────────────────────────────────────────────────
  // PEOPLE
  // ───────────────────────────────────────────────────────────────────────
  {
    id: "people",
    group: "Founder",
    title: "People",
    summary:
      "Your personal CRM. One record per person (leads, customers, partners, investors, mentors, friends, family, team) and per company. Give the important people a keep-in-touch cadence and bishOS tells you when it is time to reconnect.",
    why:
      "Relationships are a founder's real asset: referrals, partners, investors and repeat clients all come from people who remember you. A cadence turns “I should call Ali sometime” into a reminder on the right day. The same person record is used by the Pipeline, Commitments and meetings, so their whole history is in one place.",
    when: {
      oneTime:
        "Add your 20–50 most important people (about 30 minutes). Give each a relation, a tier (A/B/C) and a cadence: Tier A weekly or every 2 weeks, Tier B monthly or quarterly, Tier C twice a year or yearly.",
      daily: "Check the “Due to reconnect” rail and send one message to the top person. Log every touch (the small + button on each row).",
      weekly: "Click “Due to reconnect” and clear the list. Add anyone new you met this week, with “How we met”.",
      monthly: "Review tiers and cadences. Move people up or down as relationships change. Check the Companies tab for accounts with no recent contact.",
    },
    pages: [
      {
        route: "/people",
        title: "People (list)",
        purpose: "Find anyone fast, see who you have not talked to in a while, and reconnect on time.",
        elements: [
          {
            name: "People (page header)",
            what: "Title with a people icon and the line “One record per person, shared by the pipeline, commitments and your personal CRM.”",
          },
          {
            name: "Route a conversation (button)",
            what: "Outline button with a magic wand (“Route” on phones). Opens the AI dialog for call notes. See Commitments → Route a conversation.",
          },
          {
            name: "Add person / Add company (button)",
            what: "Dark button. It says “Add person” on the People tab and “Add company” on the Companies tab.",
            how: "Click it to open the matching dialog.",
          },
          {
            name: "People / Companies (tabs)",
            what: "Switch between the people list and the company list. Each tab shows its count. A link with ?tab=companies opens the Companies tab.",
          },
          {
            name: "Search",
            what: "On People: “Search name, company, email, tag…” (also matches job title and “How we met”). On Companies: “Search companies…” (name, industry, website).",
          },
          {
            name: "All relations (select)",
            what: "Filter by relation: Lead, Customer, Partner, Investor, Mentor, Peer, Friend, Family, Team, Other.",
          },
          {
            name: "All tiers / A / B / C",
            what: "Filter by tier. A = closest or most valuable relationships.",
          },
          {
            name: "Due to reconnect (toggle)",
            what: "A button with a count. When on, the list shows only people whose cadence is due today or overdue.",
          },
          {
            name: "Sort",
            what: "Name, Most overdue, Longest since contact, Recently contacted.",
          },
          {
            name: "People table",
            what: "Columns: Name (avatar, name, and job title or “2 open deals”), Relation (coloured chip), Tier, Company, Last contact (Today, Yesterday, 5d ago, 3w ago, 2mo ago, 1.5y ago or Never), Cadence (chip) and a + button. Some columns hide on small screens.",
            how: "Click a row to open the person's profile.",
          },
          {
            name: "Cadence chip",
            what: "“On track” (green), “In 3d” (due soon), “Reconnect today” (blue), “Reconnect · 5d over” (amber) or “—” (no cadence). Hover to see the cadence name, e.g. “Monthly”.",
          },
          {
            name: "Log touch (+ button on a row)",
            what: "Small icon button at the end of each row. Opens the “Log a touch” dialog with this person locked.",
          },
          {
            name: "No people yet (empty state)",
            what: "Text “Add leads, customers, mentors and friends. Give the important ones a cadence and they'll surface when it's time to reconnect.” and the button “Add a person”.",
          },
          {
            name: "No one matches these filters",
            what: "Shown when filters hide everyone.",
          },
          {
            name: "Due to reconnect (side rail)",
            what: "A card on the right (sticky on large screens). Hint: “Cadence elapsed since your last touch”. Up to 12 people, most overdue first (Tier A before B before C on a tie). Each row: avatar, name and “6d over · monthly · last 5w ago” or “Due today …”, plus a log-touch button that opens the dialog with DM selected. Empty: “Nobody is due. Give the people who matter a cadence (weekly → yearly) and they'll show up here on time.”",
            how: "Click a name to open the profile. Click the button, write a line, log it. The person leaves the list.",
          },
          {
            name: "Companies table",
            what: "Columns: Company (avatar, name, industry), Relationship (Prospect, Customer, Partner, Past, Other), Health (only for customers: Healthy / Watch / At risk buttons), People (count), Open pipeline (“$8K · 2”), Revenue (won value) and Last contact (latest touch of anyone at the company).",
            how: "Click a health button to change it right in the table. Click a row to open the company page.",
          },
          {
            name: "No companies yet (empty state)",
            what: "Text “Companies are created automatically when you add a person with a company, or add one here.” and the button “Add a company”.",
          },
        ],
        howTo: [
          "Click “Add person”. Type the name and company, pick the relation, a cadence and a tier. Click “Add person”.",
          "Every day open the Due to reconnect rail. Send a message to the first person and log it with the button on the right.",
          "After any meeting or call, log it from the person's row (+) or from their profile.",
          "Use the Companies tab to see every account with its pipeline and revenue.",
        ],
      },
      {
        route: "/people",
        title: "Add a person / Add a company (dialogs)",
        purpose: "Create a person or a company quickly.",
        elements: [
          { name: "Name (person)", what: "Required. Placeholder “Sara Khan”." },
          { name: "Company (person)", what: "Company name with suggestions. A new name creates the company as a Prospect." },
          { name: "Relation", what: "Default Lead. Options: Lead, Customer, Partner, Investor, Mentor, Peer, Friend, Family, Team, Other." },
          {
            name: "Keep in touch",
            what: "The cadence: No cadence, Weekly (7 days), Every 2 weeks (14), Monthly (30), Quarterly (90), Twice a year (182), Yearly (365).",
          },
          { name: "Tier", what: "—, A, B or C. Hint: “A = closest / most valuable relationships”." },
          {
            name: "+ Title, email, social, source…",
            what: "Link that reveals more fields: Job title, Email, LinkedIn / social, Source (Outbound, Inbound, Referral, Content, Network, Event, Ads, Other) and How we met.",
          },
          { name: "Add person (button)", what: "Disabled until there is a name. Toast “Added Sara Khan”." },
          { name: "Name (company)", what: "Required. Placeholder “Acme Inc.”. A name that already exists is refused: ““Acme” already exists.”" },
          { name: "Relationship (company)", what: "Prospect (default), Customer, Partner, Past, Other." },
          { name: "Website / Industry", what: "Optional text fields (“acme.com”, “Logistics”)." },
          { name: "Health (company)", what: "Shown only when Relationship is Customer: Healthy, Watch, At risk. Default Healthy." },
          { name: "Add company (button)", what: "Disabled until there is a name." },
        ],
      },
      {
        route: "/people/<id>",
        title: "Person profile",
        purpose: "Everything about one person: profile, notes, deals, promises in both directions, the full touch timeline and linked tasks.",
        elements: [
          {
            name: "Header",
            what: "Big avatar and name. Under it: “Head of Ops @ Acme” (or “No title yet”), the relation chip and “Tier A”.",
          },
          { name: "← People (link)", what: "Back to the list (hidden on phones)." },
          {
            name: "Log touch (button)",
            what: "Dark button. Opens the “Log a touch” dialog with DM selected and this person locked.",
          },
          {
            name: "Route notes (button)",
            what: "Opens the Route a conversation dialog with this person already chosen. Title: “Paste call notes for this person”.",
          },
          {
            name: "… menu",
            what: "New deal, Add commitment, Delete person. Delete asks “Delete Sara? Their deals, touches and commitments stay, unlinked.”",
          },
          {
            name: "Header chips",
            what: "“Last contact: 5d ago”, the cadence name with its chip (e.g. “Monthly · On track”), “2 open deals”, a green “$6,000 won”, and “1 open promise”. Chips only show when they have something to say.",
          },
          {
            name: "Profile (section)",
            what: "Fields that save when you click away: Name, Company (suggestions; a new name creates the company), Job title, Relation, Keep in touch, Tier (—/A/B/C), Email, Phone, LinkedIn / social (with an open-link icon once filled), Source, Tags (comma separated) and How we met. With a company you also get “Open Acme”.",
          },
          {
            name: "Notes (section)",
            what: "Big text box: “Family, interests, what they care about, what you promised to remember…”. Saves on blur.",
          },
          {
            name: "Deals (section)",
            what: "Every deal with this person: name, next step and date (or the lost reason), stage dot and value. “+ New deal” opens the New deal dialog with this person and company pre-filled. Empty: “No deals with Sara yet.”",
            how: "Click a deal to open the deal drawer here.",
          },
          {
            name: "Commitments (section)",
            what: "Hint: “What you owe them, and what they owe you”. Open promises in both directions (with an I owe / Owed to me chip) and “+ Add”. Closed ones hide under “3 closed” (click to expand). Empty: “No open promises either way.”",
          },
          {
            name: "Timeline (section)",
            what: "Every touch with this person, newest first: icon, kind, day, channel, deal name and summary. “+ Log touch” at the top. Empty: “No touches with Sara yet. Log the first one.”",
          },
          {
            name: "Linked tasks (section)",
            what: "Shown only when tasks are linked to this person: status dot, title and planned day.",
          },
          {
            name: "Person not found",
            what: "If the person was deleted: “This person doesn't exist anymore” and “Back to People”.",
          },
        ],
      },
    ],
    frameworks: [
      {
        term: "Personal CRM",
        definition: "A simple system to remember the people in your life and work: who they are, what you talked about, and when to reach out again.",
        example: "Before a coffee with Ali you open his profile: his daughter started school, and you promised him an intro to a designer.",
        source: "Never Eat Alone (Keith Ferrazzi)",
      },
      {
        term: "Keep-in-touch cadence",
        definition:
          "How often you want to contact a person: weekly, every 2 weeks, monthly, quarterly, twice a year or yearly. bishOS counts days since your last touch (or since you added them). When the days pass the cadence, they appear in Due to reconnect.",
        example: "Mentor on Monthly. Last call 33 days ago → “Reconnect · 3d over”.",
        source: "Never Eat Alone (Ferrazzi); personal CRM practice",
      },
      {
        term: "Cadence states",
        definition:
          "On track = plenty of time left. Due soon (“In 3d”) = inside the last 15% of the cadence (at least 2 days). Reconnect today = due today. Reconnect · Nd over = overdue. “—” = no cadence.",
        example: "Monthly (30 days): from day 26 you see “In 4d”, on day 30 “Reconnect today”, on day 33 “Reconnect · 3d over”.",
        source: "bishOS",
      },
      {
        term: "Tiers (A / B / C)",
        definition: "How important a relationship is. A = closest or most valuable, B = important, C = keep warm. Use tiers to choose cadences and to break ties in Due to reconnect.",
        example: "A: your co-founder's mentor and your top 3 clients. B: past clients. C: people from events.",
        source: "Relationship tiers (Ferrazzi; Dunbar's layers)",
      },
      {
        term: "Relation",
        definition: "What the person is to you: Lead, Customer, Partner, Investor, Mentor, Peer, Friend, Family, Team or Other. Winning a deal turns a Lead (or Other, Peer, Partner) into a Customer automatically.",
        example: "Sara is a Lead. You win her deal → she becomes a Customer.",
        source: "bishOS",
      },
      {
        term: "Nurture contact",
        definition:
          "A lead who said no or was not ready. bishOS keeps them warm: when you close their deal as Lost or Unqualified, they get a 90-day cadence (if they had none). They come back in Due to reconnect in a quarter.",
        example: "Lost on “Bad timing” in March. In June Sara is due; you send a useful article and ask how things are.",
        source: "Lead nurturing; Founding Sales (Kazanjy)",
      },
      {
        term: "Touch and last contact",
        definition: "A touch is any logged outreach, follow-up, call, meeting, email or DM. Notes don't count. Last contact is the day of the latest touch and resets the cadence clock.",
        example: "You log a DM today → Last contact “Today”, cadence back to “On track”.",
        source: "bishOS",
      },
      {
        term: "Company relationship",
        definition: "What a company is to you: Prospect (default), Customer, Partner, Past or Other. Winning a deal makes the company a Customer.",
        example: "Acme is a Prospect until you win; then it moves to Customers with health Healthy.",
        source: "bishOS",
      },
    ],
    testing: [
      "Open Founder → People. Expected: the header, People / Companies tabs with counts, filters, and the Due to reconnect rail.",
      "Click “Add person”. Type “Test Lead”, company “Test Co”, relation Lead, Keep in touch Weekly, tier A. Click “Add person”. Expected: toast “Added Test Lead”, the row shows company Test Co, Last contact “Never”, cadence “On track”.",
      "Open the Companies tab. Expected: “Test Co” exists as a Prospect (created automatically).",
      "Back on People, click the + on the Test Lead row. Choose DM, write “Hi”, click “Log touch”. Expected: toast with +2 XP and Last contact “Today”.",
      "Add a second person “Old Friend” with Keep in touch Weekly. Click the + on that row, choose DM, set Day to 10 days ago, click “Log touch”. Expected: Last contact “10d ago”, the cadence chip “Reconnect · 3d over”, and Old Friend appears in the Due to reconnect rail.",
      "Click Old Friend's button in the rail and log a DM for today. Expected: the person leaves the rail and the chip shows “On track”.",
      "Click the “Due to reconnect” toggle on the list. Expected: only due/overdue people. Sort by “Most overdue”. Expected: the most overdue person first.",
      "On the profile, type tags “founder, saas” and click away. Back on the list, search “saas”. Expected: the person is found.",
      "On the profile use … → New deal. Expected: the New deal dialog with the person and company filled in.",
      "On the Companies tab, try “Add company” with the name “Test Co”. Expected: an error toast ““Test Co” already exists.”",
      "On the profile use … → Delete person and confirm. Expected: toast “Test Lead deleted” and you are back on /people.",
    ],
    tips: [
      "Write “How we met” on day one. In a year you will not remember.",
      "Notes are for the human details: kids, hobbies, what they hate. People feel remembered.",
      "Don't give everyone a cadence. 30 people with a cadence you keep beats 300 you ignore.",
      "Type “Name @ Company” in any person picker to create both in one go.",
    ],
  },

  // ───────────────────────────────────────────────────────────────────────
  // CUSTOMERS
  // ───────────────────────────────────────────────────────────────────────
  {
    id: "customers",
    group: "Founder",
    title: "Customers",
    summary:
      "Every paying account on one page: health (Healthy / Watch / At risk), revenue, last contact, delivery progress, open promises, expansion deals and a suggested next move. Each company also has its own page with people, deals, projects, promises and the full timeline.",
    why:
      "Keeping a client is cheaper than finding a new one, and happy clients bring referrals. This page makes sure no account goes quiet: red and yellow accounts are listed first, accounts with 30+ days of silence turn amber, and every card tells you the next small action (deliver the open promise, book a save call, ask for a referral).",
    when: {
      oneTime: "Add your existing customers (Add customer) and link their people. Set each account's health honestly. Deals you win later appear here by themselves.",
      daily: "Deliver any open promise shown on a customer card. Log a check-in when you talk to a client.",
      weekly: "Open the “Needs attention” filter. Do the “Next:” action for each card. Update health after every important conversation.",
      monthly: "Every account should get one useful touch per month. Look for accounts near their one-year mark (renewal window) and finished projects (ask for a testimonial or referral).",
    },
    pages: [
      {
        route: "/customers",
        title: "Customers",
        purpose: "Keep every account healthy: deliver, check in, ask for the referral.",
        elements: [
          {
            name: "Customers (page header)",
            what: "Title with a heart-handshake icon and the line “Deliver, check in, ask for the referral. Keep every account green.”",
          },
          {
            name: "Add customer (button)",
            what: "Opens the “Add a company” dialog with Relationship already set to Customer and the Health choice shown.",
          },
          { name: "Customers (tile)", what: "How many companies have the relationship Customer." },
          { name: "Revenue won (tile)", what: "The total value of won deals across all customers. Green when above zero." },
          {
            name: "Need attention (tile)",
            what: "How many customers have yellow (Watch) or red (At risk) health. Sub-line “Yellow or red health”, or “All green” in green.",
          },
          { name: "Promises I owe (tile)", what: "Open “I owe” promises across all customers. Sub-line “Open, across customers”." },
          {
            name: "All / Needs attention / Healthy (filter)",
            what: "All shows every customer (with a count). Needs attention shows red or yellow health, or 30+ days since contact (customers never contacted count too). Healthy shows green or no health set.",
          },
          {
            name: "Customer card: header",
            what: "Company avatar and name (a link to the company page), and “Customer since Mar 2026” (date of the first won deal) or the industry.",
            how: "Click the name to open the company page.",
          },
          {
            name: "Health picker",
            what: "Three buttons on each card: Healthy (green), Watch (yellow), At risk (red).",
            how: "Click one to change the health. It saves at once and the sort order updates.",
          },
          {
            name: "Numbers row",
            what: "Revenue (won value), Last contact (amber at 30+ days) and Deals won.",
          },
          {
            name: "Next: (suggested action)",
            what: "A coloured line with a light bulb. bishOS picks the first rule that fits: open promises → “Deliver the open promise first”; red → “Book a save call: what would make this a 10/10?”; never contacted → “Send a first check-in: how is it going so far?”; 300–400 days as a customer → “Renewal window: book a one-year review”; project done or at 90%+ → “Delivery wrapped: ask for a testimonial or a referral”; 30+ days silent → “It's been 34 days: send a value check-in”; yellow → “Ask one question: what's one thing we could do better?”; otherwise → “Share a quick win or a useful idea this month”.",
          },
          {
            name: "Delivery",
            what: "Linked delivery projects with a progress bar and %. Green when completed, amber when blocked. Empty: “No delivery project linked. Create one from the won deal in the pipeline.”",
            how: "Click a project to open it.",
          },
          {
            name: "Open promises",
            what: "Up to 3 open promises with this account (both directions), with a count. “+2 more” links to the company page. You can tick them done right here.",
          },
          {
            name: "Expansion deals",
            what: "Chips for open deals with this customer, each with its stage.",
            how: "Click a chip to open that deal in the Pipeline.",
          },
          {
            name: "People avatars",
            what: "Up to 5 contacts at the company (+N for more), or “No contacts linked”.",
            how: "Click an avatar to open that person.",
          },
          {
            name: "Log check-in (button)",
            what: "Opens “Log a touch” with Call selected and the company linked (and the person, if the company has only one).",
          },
          {
            name: "Red and yellow accounts are listed first",
            what: "Small note under the cards (All filter, when some accounts are at risk). Sort order: red, yellow, then green; higher revenue first inside each group.",
          },
          {
            name: "No customers yet (empty state)",
            what: "Text “When you win a deal its company lands here with its delivery project, promises and health. You can also add an existing customer.” with “Open the pipeline” and “Add customer”.",
          },
          { name: "Nothing here. Nice.", what: "Shown when a filter has no accounts." },
        ],
        howTo: [
          "Open Customers once a week and click “Needs attention”.",
          "For each card, read the “Next:” line and do it.",
          "After you talk to the client, click “Log check-in” and update the health.",
          "When delivery is done, ask for a testimonial or a referral, and add any new opportunity as a deal.",
        ],
      },
      {
        route: "/companies/<id>",
        title: "Company page",
        purpose: "One account in full: details, people, deals, delivery projects, promises and every touch with anyone there.",
        elements: [
          {
            name: "Header",
            what: "Company avatar and name. Under it: the relationship chip, the industry and a green “$6,000 won”.",
          },
          {
            name: "← Customers / ← Companies (link)",
            what: "Back to Customers if the company is a customer, otherwise to People → Companies.",
          },
          { name: "Log touch (button)", what: "Opens “Log a touch” with Email selected and the company linked." },
          {
            name: "… menu",
            what: "New deal, Add person, Add commitment, Delete company. Delete asks “Delete Acme? People, deals and projects stay, unlinked.”",
          },
          {
            name: "Account (section)",
            what: "Fields that save when you click away: Name, Relationship (select), Health (customers only: Healthy / Watch / At risk), Website (with an open-link icon), Industry.",
          },
          { name: "Notes (section)", what: "“How they buy, who decides, what success looks like…”." },
          {
            name: "People (N)",
            what: "Everyone linked to the company with their job title (or relation), cadence chip and a log-touch button. “+ Add” opens Add a person with the company filled in (relation Customer for customers, otherwise Lead). Empty: “Nobody linked yet. Multi-thread the account: add the champion, the decision-maker and the user.”",
          },
          {
            name: "Deals",
            what: "Every deal with the company or its people: name, next step or lost reason, stage, value. “+ New deal” pre-fills the company. Empty: “No deals yet.”",
            how: "Click a deal to open the deal drawer.",
          },
          {
            name: "Delivery projects",
            what: "Shown when projects are linked: name, “4/10 tasks · 40%” and a progress bar.",
          },
          {
            name: "Commitments",
            what: "Open promises with this account and “+ Add”. Empty: “No open promises.”",
          },
          {
            name: "Timeline",
            what: "Up to 100 latest touches with anyone at the company, with the person's name. “+ Log touch” at the top. Empty: “No touches with this account yet.”",
          },
          {
            name: "Company not found",
            what: "If deleted: “This company doesn't exist anymore” and “Back to companies”.",
          },
        ],
      },
    ],
    frameworks: [
      {
        term: "Customer health",
        definition:
          "A simple traffic light for each account: Healthy (green) = happy and on track, Watch (yellow) = small warning signs, At risk (red) = they might leave. You set it by judgement after each conversation.",
        example: "The client stopped replying to updates and asked about the contract end date → set At risk and book a save call.",
        source: "Customer success health scores (common SaaS practice)",
      },
      {
        term: "Save call",
        definition: "A call with an at-risk client to find out what is wrong and fix it, before they leave.",
        example: "“On a scale of 1 to 10, how is it going? What would make it a 10?”",
        source: "Customer success practice",
      },
      {
        term: "Value check-in",
        definition: "A short message with something useful for the client (an idea, a result, an article), not a sales pitch. It keeps the relationship warm.",
        example: "“Saw this case study on cutting no-shows by 30%. Thought of your clinic.”",
        source: "Customer success practice",
      },
      {
        term: "Renewal window",
        definition: "Around the one-year mark (300–400 days after the first win). The best time for a one-year review and to propose the next year or a bigger scope.",
        example: "Customer since November last year → in October book a “one year together” review.",
        source: "Account management practice",
      },
      {
        term: "Testimonial and referral ask",
        definition: "When delivery is done (or at 90%+), ask a happy client for a quote you can use and for an introduction to someone like them.",
        example: "“Would you write two lines about the result? And who else do you know with the same problem?”",
        source: "Referral marketing; $100M Leads (Alex Hormozi)",
      },
      {
        term: "Expansion deal",
        definition: "A new deal with an existing customer: more work, a new service or a renewal. It shows as a chip on the customer card.",
        example: "Acme loved the website; now an “Acme: SEO retainer” deal at Proposal.",
        source: "Land and expand (B2B sales)",
      },
      {
        term: "Multi-threading",
        definition: "Knowing several people at an account (the champion, the decision-maker, the daily user), not just one. If your one contact leaves, you don't lose the client.",
        example: "At Acme you know Sara (ops, champion), the CFO (signs) and Ali (uses the tool).",
        source: "Enterprise sales practice",
      },
      {
        term: "Customer since",
        definition: "The date of the first won deal with this company.",
        example: "“Customer since Mar 2026”.",
        source: "bishOS",
      },
    ],
    testing: [
      "Open Founder → Customers with no customers. Expected: “No customers yet” with “Open the pipeline” and “Add customer”.",
      "Click “Add customer”. Expected: the “Add a company” dialog with Relationship = Customer and a Health choice. Add “Test Client”, health Healthy. Expected: a card appears with “Next: Send a first check-in: how is it going so far?”.",
      "On the card click Watch. Expected: the health changes, the Need attention tile becomes 1 (amber), and the card appears under the “Needs attention” filter.",
      "Click At risk. Expected: the Next line changes to “Book a save call: what would make this a 10/10?” and the card moves to the top.",
      "Click “Log check-in”, write a note, log it. Expected: Last contact shows “Today”.",
      "From the company page (click the name), use … → Add commitment and add an “I owe” promise. Back on Customers. Expected: “Open promises 1” on the card, “Promises I owe” tile = 1, and Next says “Deliver the open promise first”.",
      "Win a deal in the Pipeline for a new company with “Create delivery project” ticked. Expected: the company appears here as a customer with its project in Delivery at 0%.",
      "On the company page change Relationship to Prospect. Expected: it disappears from Customers and the back link now says “Companies”.",
    ],
    tips: [
      "Update health right after a call while the feeling is fresh.",
      "Treat “Watch” as an early warning, not an insult. Most churn starts as quiet yellow.",
      "Add the people around your champion. A single-threaded account is a risky account.",
    ],
  },

  // ───────────────────────────────────────────────────────────────────────
  // COMMITMENTS (+ ROUTE A CONVERSATION)
  // ───────────────────────────────────────────────────────────────────────
  {
    id: "commitments",
    group: "Founder",
    title: "Commitments",
    summary:
      "A ledger of promises in both directions: what you owe others (“I owe”) and what others promised you (“Owed to me”, your waiting-for list). It measures your promise-keeping rate over 4 weeks. The AI “Route a conversation” tool turns call notes into promises, tasks, a deal update, new contacts and content ideas.",
    why:
      "Trust is built one kept promise at a time. Founders make many small promises a day (“I'll send it Friday”) and break some by accident. Logging them takes 5 seconds; keeping them on time earns XP and a visible rate. When you can't make it, renegotiating early keeps trust. The waiting-for side stops other people's promises from slipping without a follow-up.",
    when: {
      oneTime: "Log every open promise you remember, in both directions (about 10 minutes).",
      daily:
        "During calls, log each promise the moment you make it (quick-add bar). Morning: open “Due & overdue” and keep or renegotiate each one. Check “Check in today” items and chase them. After a sales call, use “Route a conversation”.",
      weekly: "Look at the 4-week rate and the weekly bars. Under 90%? Promise less, or give yourself more time. Clear old items: done, cancelled or renegotiated.",
      monthly: "Read History: who keeps their promises to you? Who do you often let down?",
    },
    pages: [
      {
        route: "/commitments",
        title: "Commitments",
        purpose: "See every open promise, keep them on time, chase what others owe you, and track your promise-keeping rate.",
        elements: [
          {
            name: "Commitments (page header)",
            what: "Title with a handshake icon and the line “Promises are the currency of trust. Keep them, or renegotiate early.”",
          },
          { name: "Route a conversation (button)", what: "Opens the AI routing dialog (see the second page of this chapter)." },
          {
            name: "New (button)",
            what: "Opens the “New commitment” dialog. The direction follows the quick-add switch (I owe or Owed to me).",
          },
          {
            name: "Promise-keeping · 4 weeks (ring card)",
            what: "A ring with your rate, e.g. “92%”. Text: “11 of 12 “I owe” kept on time”, or “Nothing came due yet. Make a promise, keep it.” Under it: four small bars, one per week (green at 85%+, dark at 60%+, amber under 60%), labelled with the Monday date.",
            how: "Hover a bar to see “Week of Oct 13: 100%” or “nothing due”.",
          },
          {
            name: "I owe · open (tile)",
            what: "Open promises you made. Amber with “2 overdue”, otherwise “None overdue”.",
          },
          {
            name: "Owed to me (tile)",
            what: "Open promises others made to you. “3 to check on” (blue) when check dates have arrived, otherwise “Nothing to chase”.",
          },
          {
            name: "Due today (tile)",
            what: "Open promises (both directions) due today. Green at 0. Sub-line: “27 kept all-time”.",
          },
          {
            name: "Quick-add bar",
            what: "One line: an I owe / Owed to me switch, a text box (“I promised to… (send the deck)” or “They'll… (send the signed SOW)”), a person picker, a date (empty = tomorrow) and an Add button.",
            how: "Type the promise, pick the person, press Enter or click Add. Toast “Promise logged” or “Added to Waiting for”.",
          },
          {
            name: "All open / Due & overdue / History (view)",
            what: "All open: every open promise in groups. Due & overdue: only overdue, due today and check-ins due. History: closed ones (done, broken, renegotiated, cancelled), newest first.",
          },
          {
            name: "I owe (column)",
            what: "Hint “What I promised others” and a count.",
          },
          {
            name: "Owed to me (column)",
            what: "Hint ““Waiting for”: what others promised me” and a count.",
          },
          {
            name: "Groups inside each column",
            what: "Overdue (amber), Today (blue), Check in today (blue; waiting-for items whose check date arrived), Next 7 days, Later, No date. The last three show only in All open.",
          },
          {
            name: "Commitment row",
            what: "A round tick button, the promise text, then chips: a date chip (“Due 2 days ago” amber, “Today” blue, or the day), “Check in today”, “Broken”, “Renegotiated”, “Cancelled”, “to Sara” / “from Sara” (a link to the person) and “· deal name”. Closed items are greyed and done items struck through.",
            how: "Click the tick to mark it kept (I owe) or received (Owed to me). Keeping an “I owe” on or before its date gives +10 XP (“Promise kept”). Late: “Done. Late, but closed the loop” and no XP. Click the tick on a done item to reopen it (the XP is removed).",
          },
          {
            name: "Row … menu",
            what: "Edit, Renegotiate date (open only), Mark broken (open “I owe” only), Cancel (open only), Reopen (closed, not done) and Delete (asks to confirm).",
            how: "Mark broken shows “Marked broken. Repair it with a quick note to them”.",
          },
          {
            name: "No commitments yet (empty state)",
            what: "Text “Log every “I'll send it Friday” and every “they'll get back to me”. Keep promises on time for XP, and see your promise-keeping rate.” and “Log a promise”.",
          },
          {
            name: "Column empty texts",
            what: "I owe: “No open promises.”, “Nothing due. You're square.” or “No history yet.” Owed to me: “Nobody owes you anything right now.”, “Nothing to chase today.” or “No history yet.”",
          },
        ],
        howTo: [
          "In a call you say “I'll send the case study Friday”. Type it in the quick-add bar, pick the person and Friday, press Enter.",
          "They say “I'll send the signed contract Monday”. Switch to “Owed to me”, type it, pick Monday, Add.",
          "Every morning click “Due & overdue”. Tick what you did. For what you can't make, use … → Renegotiate date and tell them.",
          "For items in “Check in today”, send a friendly nudge, then tick when it arrives or move the date.",
        ],
      },
      {
        route: "/commitments",
        title: "New / Edit commitment and Renegotiate (dialogs)",
        purpose: "Create or change one promise, or move its date honestly.",
        elements: [
          { name: "I owe / Owed to me", what: "Direction switch at the top." },
          {
            name: "What did I promise? / What are they going to do?",
            what: "The promise text. Placeholder “Send the case study” or “Send the signed contract”.",
          },
          { name: "To whom / From whom", what: "Person picker (hidden when opened from a person's page)." },
          {
            name: "Promised by / Expected by",
            what: "The date, with Today / Tomorrow / +3 days / Next week chips. New promises default to tomorrow.",
          },
          {
            name: "Check again on (Owed to me only)",
            what: "The day you want to check if it arrived. Hint: “Defaults to the expected day”.",
          },
          { name: "Source (I owe only)", what: "Where you made it: Call, Meeting, Email, Message, Other." },
          { name: "Deal (optional)", what: "Link the promise to an open or won deal (filtered to the chosen person's deals)." },
          { name: "Notes (edit only)", what: "Free notes. Renegotiations add a line like “Renegotiated from 2026-10-17: agreed on a call”." },
          { name: "Add commitment / Save", what: "Saves. Disabled without text." },
          {
            name: "Renegotiate the date (dialog)",
            what: "Text: “Telling them early beats breaking it. The old promise is closed as renegotiated and a new one opens.” Fields: New date (not in the past; default 3 days after today or after the old date, whichever is later; with date chips) and Note (optional, “Agreed with them on a call”). Button “Move the date”.",
            how: "Toast: “Renegotiated. That's how trust stays intact”. The old promise is left out of your rate.",
          },
        ],
      },
      {
        route: "/commitments",
        title: "Route a conversation (AI dialog)",
        purpose:
          "Paste call notes or a transcript. AI proposes promises, tasks, a deal update or new deal, new contacts and content ideas. You tick what to keep. Nothing is saved until you click Apply. Also on Pipeline, People and the person page (“Route notes”).",
        elements: [
          {
            name: "Intro line",
            what: "“Paste call notes or a transcript. AI proposes the promises, tasks, deal update, new contacts and content ideas. You pick what to keep.”",
          },
          { name: "Who was it with? (optional)", what: "Person picker. Pre-filled when opened from a person's page." },
          {
            name: "Notes or transcript",
            what: "A big text box with an example placeholder (“Call with Sara (Acme), Tue — They're losing ~10h/week on manual reports…”). A character count is shown under it.",
            how: "Paste at least 15 characters. Press Ctrl+Enter (Cmd+Enter) or click Analyze.",
          },
          {
            name: "Analyze (button)",
            what: "Sends the text to the AI with your people and open deals as context. Shows “Reading…” while it works.",
          },
          { name: "Summary", what: "One sentence: what happened." },
          {
            name: "Log this conversation as a meeting touch",
            what: "A checkbox, shown only when you chose a person. Ticked by default. Logs a Meeting touch with the summary (+2 XP, counts toward today's meetings).",
          },
          {
            name: "Commitments (group)",
            what: "Each proposed promise: editable text, date, an I owe / Owed to me switch and a person picker (“Match “Sara”…” when the name was not found).",
          },
          {
            name: "Deal update / New deal (group)",
            what: "Either “Update Acme: website (now Discovery)” or “Create a new deal” with a name field. A stage select and, for open stages, next step and date (required).",
          },
          {
            name: "Tasks (group)",
            what: "Proposed tasks with title and date. “Into area” lets you choose the life area when you have more than one (an area named like Sales or Marketing is picked first).",
          },
          { name: "New people (group)", what: "People mentioned who are not in People yet: name, company, title." },
          {
            name: "Content ideas (their objections & questions)",
            what: "Post ideas from what the other side worried about or asked, with “Because they said: …”. Saved as company-brand text-post ideas in the Content Studio.",
          },
          {
            name: "Checkboxes",
            what: "Every proposal has a checkbox, ticked by default. Unticked rows turn faded and dashed.",
          },
          { name: "Back to text (button)", what: "Returns to the text box to edit and analyze again." },
          {
            name: "Apply N selected (button)",
            what: "Creates everything you ticked in this order: new people, the deal, promises, tasks (medium priority, context “calls”), content ideas, then the meeting touch. Toast: “Conversation routed: 6 items” with XP. If something fails, only the failed rows stay ticked, so “Apply” again retries just those.",
          },
          {
            name: "Nothing actionable found",
            what: "Shown when the AI found nothing: “Nothing actionable found. Try adding more detail.”",
          },
        ],
      },
    ],
    frameworks: [
      {
        term: "Promise-keeping rate",
        definition:
          "Of your “I owe” promises that came due in the last 28 days, the share you kept on or before the promised day. Broken ones count as missed. Open ones count only once they are late. Renegotiated and cancelled ones are left out.",
        example: "12 promises came due; 11 kept on time; 1 still open and late → 92%.",
        source: "bishOS; The Speed of Trust (Stephen M. R. Covey)",
      },
      {
        term: "90% goal",
        definition: "The target for your promise-keeping rate. The Founder HQ tile turns green at 90% and amber under 70%.",
        example: "88% this month: promise “end of week” instead of “tomorrow”.",
        source: "EOS To-Do rule of 90% (Gino Wickman, Traction)",
      },
      {
        term: "I owe",
        definition: "A promise you made to someone. Keeping it on time gives +10 XP.",
        example: "“Send Sara the pricing PDF by Friday.”",
        source: "bishOS",
      },
      {
        term: "Owed to me (Waiting for)",
        definition: "Something another person promised you. You track it so you can follow up, instead of keeping it in your head.",
        example: "“Ali will intro me to his CFO by Wednesday.”",
        source: "Getting Things Done — the Waiting For list (David Allen)",
      },
      {
        term: "Check date",
        definition: "For “Owed to me” items: the day to check if it arrived. It defaults to the expected day. On that day the item shows under “Check in today”.",
        example: "Contract expected Monday, check date Tuesday → Tuesday you send a nudge.",
        source: "Getting Things Done (David Allen)",
      },
      {
        term: "Renegotiate",
        definition:
          "Move a promise to a new date, ideally before it is late and after telling the other person. The old one closes as “Renegotiated” (not counted against you) and a new one opens with the new date.",
        example: "Thursday you see you can't finish by Friday. You message the client, agree on Tuesday, and renegotiate.",
        source: "Managing agreements (David Allen); The Speed of Trust (Covey)",
      },
      {
        term: "Broken promise",
        definition: "A promise you did not keep and will not keep. Marking it broken is honest and counts as missed in your rate. Repair it with a note.",
        example: "You forgot the intro and the moment passed → Mark broken, then apologise.",
        source: "bishOS",
      },
      {
        term: "EOS To-Dos",
        definition: "In EOS, to-dos are 7-day action items from the weekly meeting; the goal is to finish 90% of them every week. Commitments play this role for a solo founder.",
        example: "Weekly review: 10 promises due this week, 9 done = 90%.",
        source: "EOS (Gino Wickman, Traction)",
      },
      {
        term: "Route a conversation",
        definition:
          "An AI step after a call: it reads your notes and proposes the follow-ups (promises, tasks, a deal update, new people and content ideas from objections). You review and apply. It never writes anything without your click.",
        example: "Paste notes from a 30-minute call. Apply: 2 promises, 1 task, deal moved to Discovery with next step “Send proposal” on Friday, 1 content idea “How long does migration really take?”.",
        source: "bishOS",
      },
      {
        term: "Objections as content",
        definition: "Every worry or question a prospect raises is likely shared by others. Answer it in public as a post.",
        example: "Prospect: “Isn't migration risky?” → post “How we migrate clinics in one weekend with zero downtime”.",
        source: "They Ask, You Answer (Marcus Sheridan)",
      },
    ],
    testing: [
      "Open Founder → Commitments. Expected: the ring card, three tiles, the quick-add bar, the view switch and two columns (or the empty state).",
      "In the quick-add bar type “Send deck”, leave the date empty, press Enter. Expected: toast “Promise logged” and the item in I owe under “Next 7 days” with a “Tomorrow” chip.",
      "Switch to “Owed to me”, type “Signed contract”, set the date to today, click Add. Expected: “Added to Waiting for” and the item under Owed to me → Today.",
      "Click the tick on “Send deck”. Expected: “Promise kept” with +10 XP, the row is struck through and moves to History.",
      "Click the tick again in History. Expected: the item reopens and the XP is removed.",
      "Create an “I owe” promise dated yesterday (New → pick a past date). Expected: it shows under Overdue with an amber “Due yesterday” chip, the I owe tile shows “1 overdue”, and the rate counts it as missed.",
      "Use … → Renegotiate date on it, pick “+3 days”, click “Move the date”. Expected: toast “Renegotiated…”, the old item is in History with “Renegotiated”, a new open item has the new date, and the rate no longer counts the old one.",
      "Use … → Mark broken on another “I owe”. Expected: amber toast “Marked broken…” and the item in History with “Broken”.",
      "Click “Route a conversation”. Paste: “Call with Sara at Acme. I'll send pricing by Friday. She will intro me to their CFO next week. They worry about migration time.” Click Analyze. Expected: a summary, a commitment (I owe), a commitment (owed to me), maybe a deal proposal and a content idea about migration. Untick one row. Click “Apply N selected”. Expected: “Conversation routed: N items”, and only the ticked items exist (check Commitments and Content Studio ideas).",
      "Open Route a conversation and type fewer than 15 characters. Expected: Analyze is disabled.",
    ],
    tips: [
      "Log the promise in the call, not after. After, you will forget half.",
      "Promise a day later than you think. Delivering early feels great; delivering late costs trust.",
      "Renegotiate before the date, never after.",
      "Route a conversation works best with raw bullet notes. Don't clean them up first.",
    ],
  },

  // ───────────────────────────────────────────────────────────────────────
  // OFFERS
  // ───────────────────────────────────────────────────────────────────────
  {
    id: "offers",
    group: "Founder",
    title: "Offers",
    summary:
      "Build offers that people find hard to refuse. Each offer has a builder with five steps: who it is for and the problem, the value equation (scored 1–10 on four levers, with a live 0–100 gauge), the stack (deliverables, bonuses, guarantee), price with urgency and scarcity, and a MAGIC name. Linked deals show what each offer really sells.",
    why:
      "Most small businesses compete on price because their offer is vague. A clear, strong offer sells itself: a big result, proof it works, fast, with little effort for the client. The value score shows your weakest lever so you know exactly what to improve. Linking deals to offers tells you which offer makes the money.",
    when: {
      oneTime: "Build your main offer in the builder (about 45 minutes): fill every section, score the four levers honestly, add bonuses and a guarantee, then pick a MAGIC name. Set it to Live.",
      daily: "Nothing daily. When you create a deal, pick the offer in the deal's Offer field.",
      weekly: "Read the objections you heard this week. Add a bonus or proof that answers each one. Re-score the levers.",
      monthly: "Compare offers on the list: won / deals and revenue. Retire offers that don't sell. Duplicate your best one to test a variation (Testing status).",
    },
    pages: [
      {
        route: "/offers",
        title: "Offers (list)",
        purpose: "See all your offers with their value score, status and results.",
        elements: [
          {
            name: "Offers (page header)",
            what: "Title with a package icon and the line “Make offers so good people feel stupid saying no: dream outcome × likelihood ÷ (time × effort).”",
          },
          { name: "New offer (button)", what: "Opens the New offer dialog." },
          { name: "Live offers (tile)", what: "How many offers are Live (green when at least one). Sub-line: “1 in testing”." },
          { name: "Revenue from offers (tile)", what: "Total value of won deals linked to any offer. Sub-line: “Won deals linked to an offer”." },
          { name: "Deals linked (tile)", what: "All deals linked to an offer. Sub-line: “3 still open”." },
          { name: "Strongest offer (tile)", what: "The highest value score among offers that are not retired, with its name. “—” and “Score an offer” if none." },
          {
            name: "All / Live / Testing / Draft / Retired (filter)",
            what: "Filter the cards by status. Each option shows a count. Live offers are listed first, then Testing, Draft and Retired.",
          },
          {
            name: "Offer card",
            what: "A ring with the value score (0–100, coloured), the offer name, a status chip (Draft, Testing, Live, Retired) and the score label (Weak, Average, Promising, Strong, Irresistible). Under it: who it is for (ICP) and the dream outcome. At the bottom: price (with the pricing model as the label), Won / deals, and Revenue (green when above zero). Retired offers look faded.",
            how: "Click the card to open the builder.",
          },
          {
            name: "Card … menu",
            what: "Duplicate (creates “Name (copy)” as a Draft and opens it) and Delete (asks “Delete “Name”? Linked deals keep their data.”).",
          },
          {
            name: "No <status> offers",
            what: "Dashed box when a filter has nothing, e.g. “No retired offers.”",
          },
          {
            name: "Build your first offer (empty state)",
            what: "Text “Write who it's for, the dream outcome, proof, speed and effort removed. Score it on the value equation, stack bonuses and a guarantee, then name it with MAGIC.” and the button “Build an offer”.",
          },
          {
            name: "New offer (dialog)",
            what: "Fields: Working name (hint “You can craft a MAGIC name later.”, e.g. “30-day pipeline sprint”), Who is it for?, Dream outcome (“What do they get? In their words.”) and Price. Buttons Cancel and “Create and open builder”.",
            how: "A name is required (“Give the offer a working name”). The new offer starts as a Draft with all four levers at 5 (score 50) and the builder opens.",
          },
        ],
      },
      {
        route: "/offers/<id>",
        title: "Offer builder",
        purpose: "Design one offer step by step and watch its value score change live.",
        elements: [
          {
            name: "Offer name (title)",
            what: "The page title is the offer name and can be edited in place.",
            how: "Click the title, type, press Enter or click away. An empty name is ignored.",
          },
          { name: "← All offers (link)", what: "Back to the list." },
          {
            name: "Status switch",
            what: "Draft, Testing, Live, Retired at the top right.",
            how: "Click Live the first time: “Offer is live. Go sell it!” with +30 XP and confetti. Moving back to Draft or Testing removes that XP; Retired keeps it (the offer did ship). Other changes show “Status: Testing” etc.",
          },
          {
            name: "… menu",
            what: "Duplicate (“Duplicated as a draft”, opens the copy) and Delete offer (asks to confirm; linked deals and campaigns are kept but unlinked).",
          },
          {
            name: "1 · Who it's for & the problem",
            what: "Two text boxes: Ideal customer (ICP) — hint “Who has the problem worst and can pay?”, e.g. “B2B agency owners, 5–20 staff, referrals drying up”; and The painful problem — hint “What keeps them up at night, in their words”.",
            how: "Type and click away. All builder text saves when you leave the field.",
          },
          {
            name: "2 · Value equation",
            what: "Hint “Score each lever honestly from 1–10. The gauge updates live.” Four rows. Each row has a 1–10 slider and a text box. The weakest lever's row is highlighted amber.",
          },
          {
            name: "Dream outcome (slider + text)",
            what: "Slider hint “Higher = a bigger, more desirable result”. Text: e.g. “Book 10 qualified sales calls a month without hiring an SDR”. The number turns green at 7+ and red at 3 or less.",
          },
          {
            name: "Perceived likelihood (slider) + Proof & perceived likelihood (text)",
            what: "Slider hint “Higher = they believe it will work for them”. Text: e.g. “3 case studies, 40+ calls booked for X, money-back pilot”.",
          },
          {
            name: "Time delay (slider) + Time to result (text)",
            what: "Slider hint “Higher = slower (bad)”. Text: e.g. “First booked call within 14 days”. This slider is reversed: the number turns green at 4 or less and red at 8+.",
          },
          {
            name: "Effort & sacrifice (slider) + Effort & sacrifice removed (text)",
            what: "Slider hint “Higher = more work for them (bad)”. Text: e.g. “We write the scripts, build the list and run the sequences”. Reversed like Time delay.",
            how: "Drag any slider; the gauge moves at once. The score saves when you let go.",
          },
          {
            name: "3 · The stack",
            what: "Hint “What they get, the bonuses that kill objections, and the risk reversal.” A numbered Deliverables list, a Bonuses list (“Add a bonus (one per objection)”) and a Guarantee box with a shield icon (hint “Unconditional, conditional, or performance-based”, e.g. “5 booked calls in 30 days or we work free until you get them”).",
            how: "Type an item and press Enter to add it to a list. Click an item to edit; clear it to delete.",
          },
          {
            name: "4 · Price, urgency & scarcity",
            what: "Price (in your currency), Pricing model (One-time, Per project, Monthly retainer, Subscription, Per seat, Performance-based, Payment plan, Custom) and Urgency & scarcity (hint “Real limits only: cohorts, capacity, deadlines, price rises”, e.g. “Only 3 founding clients this quarter; founding price ends Nov 30”).",
          },
          {
            name: "5 · MAGIC name",
            what: "Hint “Magnet · Avatar · Goal · Interval · Container”. Five fields: Magnet (“A reason to act now”), Avatar (“Who it's for, in their words”), Goal (“The result they want”), Interval (“How fast”), Container (“What it's called”). Some fields have quick chips: Magnet — Free, Done-for-you, Founding-client, Guaranteed; Interval — 7-day, 14-day, 30-day, 6-week; Container — Sprint, Challenge, Blueprint, Accelerator.",
            how: "Fill the fields (or click chips). They save when you click away.",
          },
          {
            name: "Suggested names",
            what: "Up to 4 name ideas built from your MAGIC parts, e.g. “Done-for-you Agency owner 10 qualified calls 30-day Sprint” or “The 30-day 10 qualified calls Sprint for Agency owner”. Each has a “Use” button; the current name shows “In use” in green. Until you fill enough: “Fill in at least an avatar, goal and container to get name ideas.”",
            how: "Click Use to rename the offer (toast “Offer renamed”). Edit the title after to make it read well.",
          },
          {
            name: "Improve this offer (AI panel)",
            what: "Hint “AI suggestions per lever. Nothing changes until you apply it.” Button “Suggest improvements”. The answer has sections: Biggest lever, Dream outcome, Likelihood & proof, Time to result, Effort removed, Bonuses to add, Guarantee, Urgency & scarcity, Price & packaging, Name ideas (MAGIC), and a “Next test” line.",
            how: "Click it and wait (“Thinking…”). Then “Add to notes” (appends with a dated header), “Copy”, or “Again” to regenerate.",
          },
          {
            name: "Notes",
            what: "Free text: “Objections heard, positioning ideas, test results…”.",
          },
          {
            name: "Value score (card)",
            what: "Right column (top of the page on phones). A half-circle gauge 0–100 with the label (e.g. “STRONG”) and “raw value 2.40×”. Hint: “(dream × likelihood) ÷ (time × effort), log-scaled”.",
          },
          {
            name: "Biggest lever (box)",
            what: "Under the gauge: the lever that is furthest from its best value, with a fix. Dream outcome: “Make the result bigger and more specific: in their words, with a number.” Perceived likelihood: “Add proof: case studies, testimonials, a guarantee, a pilot.” Time delay: “Deliver a first win faster: a day-1 quick win or a kickoff deliverable.” Effort & sacrifice: “Do more for them: done-for-you, templates, fewer steps on their side.”",
          },
          {
            name: "Results (card)",
            what: "Deals, Won and Revenue linked to this offer, then “2 open · $9,000 in pipeline · 40% win rate”, a list of up to 25 linked deals with value and stage, and “Campaigns promoting it” (links). Link “Pipeline →”. Empty: “Link deals to this offer from the pipeline to see what it sells.”",
          },
          {
            name: "Offer not found",
            what: "If deleted: “This offer doesn't exist (or was deleted).” and “Back to offers”.",
          },
        ],
        howTo: [
          "Click “New offer”, give it a working name, the ICP, the dream outcome and a price. Click “Create and open builder”.",
          "Section 1: write the ICP and the problem in the client's words.",
          "Section 2: write the four texts, then score each lever honestly. Look at the Biggest lever box.",
          "Fix the biggest lever: add proof, a faster first win or more done-for-you work. Re-score.",
          "Section 3: list deliverables, add one bonus per objection, write a guarantee.",
          "Section 4: set price, model and a real urgency or scarcity.",
          "Section 5: fill MAGIC and click Use on the best name. Edit it until it sounds natural.",
          "Set the status to Testing while you pitch it, then Live when it sells.",
        ],
      },
    ],
    frameworks: [
      {
        term: "Value equation",
        definition:
          "Value = (Dream outcome × Perceived likelihood) ÷ (Time delay × Effort & sacrifice). Push the top up and the bottom down, and people see more value than the price.",
        example: "Same website service: “Live in 7 days, we write all the copy, 3 case studies” beats “Website in 6–8 weeks, send us your content”.",
        source: "$100M Offers (Alex Hormozi)",
      },
      {
        term: "Dream outcome",
        definition: "The result the client really wants, in their words, ideally with a number. Higher = better.",
        example: "Not “a CRM setup” but “never lose a lead again: every inquiry answered in 5 minutes”.",
        source: "$100M Offers (Alex Hormozi)",
      },
      {
        term: "Perceived likelihood of achievement",
        definition: "How much the client believes it will work for them. Proof raises it: case studies, testimonials, a guarantee, a pilot. Higher = better.",
        example: "“We did this for 12 clinics like yours; here are three on video.”",
        source: "$100M Offers (Alex Hormozi)",
      },
      {
        term: "Time delay",
        definition: "How long until the client sees the result. Higher = slower = worse. A quick first win lowers it.",
        example: "“First booked call in 14 days” instead of “results in 3 months”.",
        source: "$100M Offers (Alex Hormozi)",
      },
      {
        term: "Effort & sacrifice",
        definition: "How much work, pain or change the client must do. Higher = more work = worse. Done-for-you lowers it.",
        example: "“We build the list, write the messages and send them” vs “we give you a course”.",
        source: "$100M Offers (Alex Hormozi)",
      },
      {
        term: "Value score (0–100)",
        definition:
          "bishOS turns the four 1–10 scores into one number. Raw value = (dream × likelihood) ÷ (time × effort), from 0.01 to 100. The score puts this on a log scale: (log10(raw) + 2) ÷ 4 × 100. All levers at 5 → 50. Labels: 80+ Irresistible, 70+ Strong, 55+ Promising, 40+ Average, under 40 Weak. Colours: 70+ green, 50+ neutral, 35+ amber, under 35 red.",
        example: "Dream 9, likelihood 8, time 3, effort 3 → raw 8.00× → score 73 “Strong”.",
        source: "bishOS, based on $100M Offers (Alex Hormozi)",
      },
      {
        term: "Biggest lever",
        definition: "The lever with the most room to improve: for dream and likelihood, how far below 10; for time and effort, how far above 1. Fix this one first.",
        example: "Scores 8 / 4 / 5 / 3 → likelihood is 6 below 10, the most → add proof.",
        source: "bishOS",
      },
      {
        term: "Grand Slam Offer and the stack",
        definition: "An offer so good people feel stupid saying no. You build it by stacking deliverables and bonuses so the total value is far above the price.",
        example: "Website + 30 days of support + copywriting + a booking system bonus + a lead-response guarantee.",
        source: "$100M Offers (Alex Hormozi)",
      },
      {
        term: "Bonus (one per objection)",
        definition: "An extra item that removes a specific worry. Each objection you hear becomes a bonus.",
        example: "Objection “my team won't use it” → bonus “2 live training sessions for your staff”.",
        source: "$100M Offers (Alex Hormozi)",
      },
      {
        term: "Guarantee (risk reversal)",
        definition:
          "A promise that moves the risk from the client to you. Unconditional: money back, no questions. Conditional: money back if they did their part. Performance-based: you keep working (or pay) until the result happens.",
        example: "“5 booked calls in 30 days or we work free until you get them.”",
        source: "$100M Offers (Alex Hormozi)",
      },
      {
        term: "Urgency",
        definition: "A real reason to decide now: a deadline, a price rise, a start date.",
        example: "“Founding price ends November 30.”",
        source: "$100M Offers (Alex Hormozi)",
      },
      {
        term: "Scarcity",
        definition: "A real limit on how many can buy: capacity, seats, cohorts. Only use true limits; fake scarcity destroys trust.",
        example: "“We take 3 new clients per month because we build every site ourselves.”",
        source: "$100M Offers (Alex Hormozi)",
      },
      {
        term: "MAGIC naming",
        definition:
          "A formula to name an offer: Magnet (a reason to act now), Avatar (who it is for), Goal (the result), Interval (how fast), Container (what it is called). You rarely use all five; pick the ones that sound good.",
        example: "Magnet “Free”, Avatar “Clinic”, Goal “Patient booking”, Interval “14-day”, Container “Sprint” → “The 14-Day Clinic Booking Sprint”.",
        source: "$100M Offers (Alex Hormozi)",
      },
      {
        term: "ICP (ideal customer profile)",
        definition: "The kind of client who has the problem worst and can pay for the solution. A narrow ICP makes the offer stronger.",
        example: "Not “small businesses” but “dental clinics with 2–5 chairs in Lahore”.",
        source: "B2B marketing practice",
      },
      {
        term: "Offer status",
        definition: "Draft = being built. Testing = you are pitching it to see if it sells. Live = your active offer (+30 XP the first time). Retired = no longer sold (keeps its history and XP).",
        example: "You test “Booking Sprint” with 5 prospects (Testing), 2 buy, you set it Live.",
        source: "bishOS",
      },
    ],
    testing: [
      "Open Founder → Offers with no offers. Expected: “Build your first offer” and the “Build an offer” button.",
      "Click it. Leave the name empty and click “Create and open builder”. Expected: a warning “Give the offer a working name”. Type “Test Sprint”, price 2500, create. Expected: the builder opens, status Draft, the gauge shows 50 “AVERAGE” and “raw value 1.00×”.",
      "Drag Dream outcome to 9 and Perceived likelihood to 8, Time delay to 3, Effort to 3. Expected: the gauge shows 73 “STRONG” and “raw value 8.00×”, the numbers 9 and 8 are green, 3 and 3 are green (reversed sliders).",
      "Set Perceived likelihood to 2. Expected: the Biggest lever box says “Perceived likelihood · Add proof…” and that row turns amber. Reload. Expected: the scores are saved.",
      "In The stack, type a deliverable and press Enter. Expected: it appears as item 1.",
      "In MAGIC name, click the chips “Done-for-you”, “30-day” and “Sprint”, type Avatar “Agency owner” and Goal “10 calls”, click away. Expected: Suggested names list appears. Click Use on one. Expected: toast “Offer renamed” and the title changes; that row shows “In use”.",
      "Click the status Live. Expected: “Offer is live. Go sell it!” with +30 XP. Click Draft. Expected: the XP is removed. Click Live again. Expected: +30 XP again.",
      "In Pipeline, create a deal and pick this offer. Expected: the deal value is filled with 2500. Win the deal. Back on the builder, Results shows Deals 1, Won 1, Revenue $2,500, and the Offers list shows Revenue on the card.",
      "Click “Suggest improvements”. Expected: “Thinking…”, then sections like “Biggest lever” and a “Next test” line. Click “Add to notes”. Expected: “Added”, and Notes contains “--- AI suggestions (date) ---”.",
      "Use … → Duplicate. Expected: “Duplicated as a draft” and a page for “Test Sprint (copy)” in Draft.",
    ],
    tips: [
      "Score like a skeptical client, not a proud founder. A 50 you can improve beats a fake 90.",
      "The cheapest way to raise the score is usually proof: one strong case study can move likelihood from 4 to 7.",
      "Write the dream outcome in the client's words from your discovery calls (copy them from the deal's Pain field).",
      "Always link deals to offers. After a month the Results card tells you which offer is worth your time.",
    ],
  },

  // ───────────────────────────────────────────────────────────────────────
  // CAMPAIGNS
  // ───────────────────────────────────────────────────────────────────────
  {
    id: "campaigns",
    group: "Founder",
    title: "Campaigns",
    summary:
      "Plan and track focused marketing pushes: one objective, a few channels, one offer, dates and a budget. Results (leads, conversations, deals won, revenue, content published) roll up automatically from the deals and content you link. A board and a timeline show all campaigns; AI can suggest campaign ideas and plays.",
    why:
      "Random posting and random outreach don't build a business. A campaign gives every action a goal and a deadline, and the rollup shows what each push really produced in leads and money. Writing learnings at the end makes the next campaign smarter.",
    when: {
      oneTime: "Create your first campaign around your live offer: objective, 2–3 channels, start and end dates, targets for leads and revenue.",
      daily: "When a new lead comes from the campaign, pick the campaign in the deal's Campaign field (or link it on the campaign page). Link each post you publish for it.",
      weekly: "Open each live campaign. Check Targets vs results and the Scoreboard. Enter spend. Ask AI for plays if results are slow.",
      monthly: "Close finished campaigns (status Done) and write 2–3 learnings. Plan the next one using “AI ideas”.",
    },
    pages: [
      {
        route: "/campaigns",
        title: "Campaigns (list)",
        purpose: "See every campaign by status or on a timeline, with total leads, revenue and spend.",
        elements: [
          {
            name: "Campaigns (page header)",
            what: "Title with a megaphone icon and the line “Objective → channels → offer → results. Every campaign earns its learnings.”",
          },
          { name: "AI ideas (button)", what: "Outline button with sparkles. Opens the Campaign ideas dialog." },
          { name: "New campaign (button)", what: "Opens the New campaign dialog." },
          { name: "Live now (tile)", what: "Live campaigns (green when any). Sub-line: “2 planned”." },
          { name: "Leads generated (tile)", what: "Total leads across campaigns. Sub-line: “Deals linked to campaigns”." },
          { name: "Revenue attributed (tile)", what: "Total revenue across campaigns. Sub-line: “Won deals from campaigns”." },
          {
            name: "Spend (tile)",
            what: "Total spend. Sub-line: “40% of $2,000 budget” or “No budgets set”. Amber when spend is over budget.",
          },
          { name: "Board / Timeline (switch)", what: "Switch between the status board and the Gantt timeline." },
          {
            name: "Status board",
            what: "Columns Idea, Planned, Live, Paused (only shown when a campaign is paused) and Done, each with a coloured dot and a count.",
            how: "Drag a card to another column to change its status. Going Live gives +20 XP (“Name is live”); Done gives +25 XP (“Name wrapped. Capture the learnings!”). To pause, open the campaign and click Paused.",
          },
          {
            name: "Campaign card",
            what: "Name, a Company or Personal chip, the objective, up to 3 channels (+N), dates (“Oct 1 → Oct 31” or “No dates”), the offer name, “4 leads / 10 · 1 won”, revenue in green, and a bar of leads vs the lead target.",
            how: "Click a card to open the campaign.",
          },
          {
            name: "Timeline",
            what: "A Gantt chart by month with a red “Today” marker. Each dated campaign is a coloured bar (colour = status) showing its first 2 channels. A campaign without an end date is drawn 14 days long with a dashed border. Undated campaigns are listed under “Not scheduled” with their status. Empty: “No dated campaigns yet. Give a campaign a start and end date to see it on the timeline.”",
            how: "Hover a bar to see “Name: Oct 1 → Oct 31”. Click a bar or name to open the campaign. Scroll sideways for more months.",
          },
          {
            name: "Plan your first campaign (empty state)",
            what: "Text “A campaign is a focused push: one objective, a few channels, one offer and a deadline. Results roll up from the deals and content you link.” with “New campaign” and “Get AI ideas”.",
          },
          {
            name: "New campaign (dialog)",
            what: "Fields: Name (e.g. “November LinkedIn + cold email push”), Objective (hint “One measurable goal”), Brand (Company / Personal), Offer (“None yet” or a non-retired offer), Channels (chips: LinkedIn, Instagram, TikTok, YouTube, X, Email, Ads, Events, Partnerships, Cold outreach), Start, End (not before Start) and Budget. Buttons Cancel and “Create campaign”.",
            how: "A name is required. With a start date the campaign starts as Planned, without one as Idea. The campaign page opens.",
          },
          {
            name: "Campaign ideas (AI dialog)",
            what: "Fields: “What should this campaign achieve?”, Brand (Company / Personal / Either), Offer to promote, Preferred channels (optional chips). Button “Generate ideas” (“Thinking…” while working, then “Generate again”). Results: up to 5 idea cards with name, objective, channels, angle and numbered first steps, each with “Add to board”.",
            how: "Click “Add to board” on an idea you like. It is created as an Idea with the angle and first steps in its notes (button changes to “Added”). If the AI reply can't be read as cards, the raw text is shown instead.",
          },
        ],
      },
      {
        route: "/campaigns/<id>",
        title: "Campaign page",
        purpose: "Plan one campaign, set targets, link deals and content, watch results roll up, and capture learnings.",
        elements: [
          { name: "Campaign name (title)", what: "Editable in place. Click, type, press Enter." },
          { name: "← All campaigns (link)", what: "Back to the list." },
          {
            name: "Status switch",
            what: "Idea, Planned, Live, Paused, Done.",
            how: "Live: +20 XP the first time (“Campaign is live. Make some noise!”). Done: +25 XP (“Campaign wrapped. Write down what you learned.”). Leaving Done removes the Done XP; going back to Idea or Planned removes the Live XP.",
          },
          { name: "… menu", what: "Delete campaign (asks to confirm; linked deals and content are kept but unlinked)." },
          {
            name: "Learnings reminder (banner)",
            what: "Amber banner when the status is Done and Learnings is empty: “This campaign is done. Write 2–3 learnings below so the next one starts smarter.”",
          },
          {
            name: "Plan (section)",
            what: "Objective (“One measurable goal, e.g. 10 discovery calls with agency owners”), Brand (Company / Personal / —), Offer (with “Open offer →” when set), Channels (chips; custom channels you used before also show), Start, End, Budget and Spend.",
            how: "Text and numbers save when you click away; dates and chips save at once. An end date before the start date is refused.",
          },
          {
            name: "Targets vs results (section)",
            what: "Hint “Results roll up from linked deals and content (⚡). Override any number if you track it elsewhere.” Five rows: Leads (deals linked to this campaign), Conversations (linked deals that reached a booked call), Deals won (linked deals won), Revenue (value of linked deals won), Content published (pieces linked / published). Each row: a Target box, a progress bar (green at 100%) and the result, e.g. “4 / 10”.",
            how: "Type a target and click away. The ⚡ means automatic.",
          },
          {
            name: "Override a result",
            what: "Click a result number (not Content) to type your own value. It then shows a “Manual” chip (hover to see the automatic value) and a ↺ button.",
            how: "Type the number and click away. Click ↺ (“Back to automatic”) to return to the calculated value.",
          },
          {
            name: "Deals (N)",
            what: "Linked deals with next step and date, value and stage chip, plus “Pipeline →”. Hover a row and click × to unlink. Under it: “+ Link a deal…” lists up to 60 newest deals not in any campaign. Empty: “No deals yet. Link the deals this campaign creates so leads and revenue roll up.”",
            how: "Pick a deal in the select to link it. Results update at once.",
          },
          {
            name: "Content (N)",
            what: "Linked content pieces with a Hub chip and stage chip (green when published), plus “Content Studio →”. × unlinks. “+ Link a content piece…” lists up to 60 newest unlinked pieces (not archived). Empty: “Link the posts and videos that belong to this push.”",
          },
          {
            name: "Learnings (section)",
            what: "Hint “What worked, what didn't, and what you'd do differently next time.” Placeholder with example bullets.",
            how: "Write and click away. The first time: “Learning captured”.",
          },
          { name: "Notes (section)", what: "“Messaging, assets, links, the angle…”." },
          {
            name: "Scoreboard (card)",
            what: "A ring with leads (filled to % of the lead target), “3 conversations · 1 won”, revenue in green, and “Day 5 of 30” (or “Starts Monday” / “Ended Oct 2”). Under it: Spend, Per lead (cost per lead) and ROI (green when 0% or more, red when negative). With a budget: “Budget used $400 / $1,000” bar (red when over).",
          },
          {
            name: "Plays for this campaign (AI panel)",
            what: "Hint “Concrete moves for your channels and offer.” Button “Suggest 5 plays”. Each play has a name, channels, angle and steps.",
            how: "Click it, then “Add to notes” (appends “--- AI plays (Oct 20) ---”), “Copy” or “Again”.",
          },
          {
            name: "Campaign not found",
            what: "If deleted: “This campaign doesn't exist (or was deleted).” and “Back to campaigns”.",
          },
        ],
        howTo: [
          "Click “New campaign”. Write one measurable objective, pick the offer, 2–3 channels, dates and budget. Create it.",
          "On the campaign page, set targets: leads, conversations, deals, revenue, content.",
          "Click Live when it starts.",
          "Every time a lead comes in, pick this campaign in the deal (or use “+ Link a deal…”). Link each published post.",
          "Each week enter Spend and read the Scoreboard.",
          "At the end click Done and write 2–3 learnings.",
        ],
      },
    ],
    frameworks: [
      {
        term: "Campaign",
        definition: "A focused marketing push with one objective, a few channels, one offer, a start and an end. It is a mini project for growth.",
        example: "“November LinkedIn + cold email push”: book 10 discovery calls with agency owners, Nov 1–30, offer “30-Day Pipeline Sprint”.",
        source: "Marketing campaign practice",
      },
      {
        term: "Campaign objective",
        definition: "One measurable goal for the campaign. If you can't count it, it is not an objective.",
        example: "Good: “10 discovery calls with agency owners by Nov 30”. Bad: “more brand awareness”.",
        source: "SMART goals (George T. Doran)",
      },
      {
        term: "Channels",
        definition: "Where the campaign reaches people: LinkedIn, Instagram, TikTok, YouTube, X, Email, Ads, Events, Partnerships, Cold outreach. Fewer channels done well beat many done badly.",
        example: "LinkedIn posts + cold email to people who engaged.",
        source: "Traction (Gabriel Weinberg) — the Bullseye framework",
      },
      {
        term: "Results rollup",
        definition:
          "bishOS counts results from linked data: Leads = deals linked to the campaign; Conversations = linked deals at Booked or later (Booked, Discovery, Proposal, Verbal, Won); Deals won = linked deals won; Revenue = value of those won deals; Content published = linked pieces that are published. You can override any of the first four by hand.",
        example: "6 linked deals: 2 Target, 1 Booked, 1 Proposal, 2 Won ($5K) → Leads 6, Conversations 4, Deals won 2, Revenue $5K.",
        source: "bishOS",
      },
      {
        term: "Manual override",
        definition: "Your own number for a result, for when you track it somewhere else (for example ad leads that never became deals). ↺ returns to the automatic value.",
        example: "The ad platform shows 40 leads but only 6 became deals → override Leads to 40.",
        source: "bishOS",
      },
      {
        term: "Cost per lead (CPL)",
        definition: "Spend ÷ leads. Shown as “Per lead” when you have spend and at least one lead.",
        example: "$300 spend, 6 leads → $50 per lead.",
        source: "Marketing metric",
      },
      {
        term: "ROI (return on investment)",
        definition: "(Revenue − spend) ÷ spend, in percent. Shown when spend is above 0. Green at 0% or more, red when you lost money.",
        example: "$5,000 revenue, $500 spend → 900% ROI.",
        source: "Finance metric",
      },
      {
        term: "Learnings (retrospective)",
        definition: "2–3 short notes at the end: what worked, what didn't, what to change. AI ideas also read your last campaigns' learnings.",
        example: "“DMs after a post converted 3× better than cold. Next time start follow-ups on day 3.”",
        source: "Retrospectives (Agile practice)",
      },
      {
        term: "Campaign status",
        definition: "Idea (not planned yet), Planned (has dates), Live (running, +20 XP), Paused (on hold), Done (finished, +25 XP).",
        example: "AI idea → Idea; you set dates → Planned; Nov 1 → Live; Dec 1 → Done.",
        source: "bishOS",
      },
      {
        term: "Play",
        definition: "One concrete move inside a campaign, with steps. The AI panel suggests 5 plays based on your channels, offer and results so far.",
        example: "Play “Comment-to-DM”: post a checklist, DM everyone who comments, offer a 15-minute audit.",
        source: "bishOS",
      },
    ],
    testing: [
      "Open Founder → Campaigns with no campaigns. Expected: “Plan your first campaign” with two buttons.",
      "Click “New campaign”. Name “Test Push”, objective “5 calls”, pick 2 channels, a start date today and an end date in 30 days. Click “Create campaign”. Expected: the campaign page opens with status Planned.",
      "Create another campaign without dates. Expected: it starts as Idea and shows under “Not scheduled” on the Timeline.",
      "On “Test Push” click Live. Expected: “Campaign is live. Make some noise!” with +20 XP. The Scoreboard shows “Day 1 of 30”.",
      "In Targets vs results type 10 in the Leads target. Use “+ Link a deal…” to link an open deal. Expected: Leads shows “1 / 10” with a ⚡ and the ring moves to 10%.",
      "Win that deal in the Pipeline with value 1000. Expected: Deals won 1, Revenue $1,000, Conversations 1.",
      "Enter Spend 200. Expected: Per lead $200 and ROI 400% in green.",
      "Click the Leads result and type 25, click away. Expected: “Manual” chip with the auto value on hover. Click ↺. Expected: back to 1 with ⚡.",
      "Click Done with empty Learnings. Expected: +25 XP and the amber banner. Write a learning and click away. Expected: “Learning captured” and the banner disappears.",
      "On the list, switch to Timeline. Expected: a bar for Test Push across the right dates and a red Today marker.",
      "Click “AI ideas”, write an objective, click “Generate ideas”. Expected: idea cards. Click “Add to board” on one. Expected: “Added to the board as an idea” and the button shows “Added”; the board has it in Idea.",
      "On the board drag the Idea card to Live. Expected: “<name> is live” with +20 XP.",
    ],
    tips: [
      "One campaign, one offer, one objective. Two objectives means two campaigns.",
      "Link deals the day they come in. Linking later is easy to forget and your ROI will look worse than it is.",
      "Even a “failed” campaign is worth it if you write the learnings.",
      "Keep the board small: 1 Live and 1 Planned is plenty for a solo founder.",
    ],
  },

  // ───────────────────────────────────────────────────────────────────────
  // SCORECARD
  // ───────────────────────────────────────────────────────────────────────
  {
    id: "scorecard",
    group: "Founder",
    title: "Scorecard",
    summary:
      "5–10 weekly numbers that tell you in 60 seconds if the business is on track. Each number has a weekly target and a direction (at or above / at or below). Most numbers fill themselves from your data (⚡); the rest you type once a week. A 13-week grid shows green and red weeks.",
    why:
      "Feelings lie, numbers don't. A busy week can feel productive while sales activity is zero. The scorecard shows the few activity numbers (lead) that cause the results (lag), so you can fix a problem the week it starts, not three months later. Because six of the seven starter numbers are automatic, it costs you almost no time.",
    when: {
      oneTime:
        "Click “Start with the founder scorecard” (7 numbers, 6 automatic). Adjust targets to your reality (Edit). Set Settings → Founder engines → Annual income so the Revenue target is right (income ÷ 52). Add 1–3 numbers of your own if needed.",
      daily: "Nothing daily. The automatic numbers update by themselves as you log touches, win deals, publish, focus and review cards.",
      weekly: "In your weekly review: type the manual numbers for this week, then read every red cell. Each red number becomes an issue (Decisions & Issues → Issues) or a change to next week's plan.",
      quarterly: "Look at the 13-week hit rate per number. Raise targets you always hit, archive numbers that never change your decisions.",
    },
    pages: [
      {
        route: "/scorecard",
        title: "Scorecard",
        purpose: "See this week's numbers against their targets and the last 13 weeks at a glance; type in manual numbers.",
        elements: [
          {
            name: "Scorecard (page header)",
            what: "Title with a gauge icon and the line “5–10 weekly numbers that tell you in 60 seconds whether the business is on track.”",
          },
          {
            name: "Archived (N) / Hide archived (button)",
            what: "Shown only when you have archived numbers.",
            how: "Click to show archived numbers in the grid (faded). Click “Hide archived” to hide them again.",
          },
          { name: "Add metric (button)", what: "Opens the “Add a scorecard metric” dialog." },
          {
            name: "Start with the founder scorecard (empty state)",
            what: "Text: “Seven numbers a solo founder should watch every week: outreach, sales conversations, deals won, revenue, content, deep work and recall. Six fill themselves in from your data.” Buttons “Start with the founder scorecard” and “Add my own metric”.",
            how: "Click the first button. Toast “Founder scorecard ready · 7 numbers, 6 of them automatic” and confetti. It only works when you have no metrics yet.",
          },
          {
            name: "On track this week (ring card)",
            what: "A ring with “5/7” (numbers on track / active numbers) and this week's dates (Monday to Sunday). The ring fills by on ÷ (on + off).",
          },
          {
            name: "Off track (tile)",
            what: "How many numbers are off track this week. Red with “Discuss in your weekly review”, or green with “Nothing off track”.",
          },
          {
            name: "Numbers to fill (tile)",
            what: "Manual numbers with no value this week. Amber with “Manual numbers missing this week”, or green with “All numbers in”.",
          },
          {
            name: "13-week hit rate (tile)",
            what: "Across all active numbers: weeks on track ÷ weeks with a value, over the 13 weeks. Sub-line: “Weeks on track ÷ weeks measured”.",
          },
          {
            name: "Metric column",
            what: "Each row starts with ⚡ (automatic; hover to read where it comes from) and the metric name. Under it: an up or down arrow (direction), the target with its unit, and “75% hit” (this number's 13-week hit rate, wide screens).",
            how: "Click the name to edit the metric.",
          },
          {
            name: "Trend",
            what: "A small line of the 13 weeks with a dashed target line. Green when the latest value is on track, red when off.",
          },
          {
            name: "Week columns",
            what: "13 columns, newest first: “This week” (highlighted), then the Monday date of each earlier week. Cells are green (on track) or red (off track).",
          },
          {
            name: "Automatic cell (⚡ rows)",
            what: "Read-only value, calculated from your data. Hover: “Calculated automatically”.",
          },
          {
            name: "Manual cell",
            what: "A button with the value, “+ Add” (empty, this week) or “—” (empty, past week, dashed border).",
            how: "Click it, type a number, press Enter (or click away). Esc cancels. Empty clears the value. Commas are allowed (1,200). The first manual entry of a week gives +10 XP (“Scorecard updated”).",
          },
          {
            name: "Row … menu",
            what: "Edit, Move up, Move down (change the row order), Archive (hide but keep history) or Restore (for archived rows), Delete (asks “Delete “Revenue” and its history?”).",
          },
          {
            name: "Legend",
            what: "A card under the grid: green square = On track, red square = Off track, ⚡ = “Calculated from your pipeline, content, focus and recall data”, and “Click a manual cell to edit. Empty clears it.”",
          },
        ],
        howTo: [
          "Click “Start with the founder scorecard”.",
          "Click each metric name and set a target that is hard but possible for you.",
          "Every Friday or in your weekly review, type the manual numbers for this week.",
          "Read the This week column. For every red number ask: why? Log the answer as an issue.",
          "Each quarter look at the hit rates and adjust targets.",
        ],
      },
      {
        route: "/scorecard",
        title: "Add / Edit metric (dialog)",
        purpose: "Create a weekly number or change an existing one.",
        elements: [
          {
            name: "Where does the number come from?",
            what: "“Manual: I type it in each week”, or one automatic source: ⚡ Auto: Outreach touches, Sales conversations, Deals won, Won revenue, Content published, Deep work hours, Tasks completed, Recall reviews, Cash collected.",
            how: "Picking a source fills a suggested name, target and unit (only if you have not typed your own).",
          },
          {
            name: "Source hint",
            what: "A blue line explaining the source, e.g. “Interactions logged as outreach or follow-up. Calculated for you every week.”",
          },
          { name: "Name", what: "Required. Placeholder “e.g. Qualified leads”." },
          { name: "Weekly target", what: "Required number. Placeholder 10." },
          { name: "Unit", what: "Hint “h, %, calls, or a currency code”. “h” shows hours, “%” shows percent, a currency code (e.g. USD, PKR) shows money." },
          {
            name: "On track when the number is…",
            what: "“At or above target” (more is better) or “At or below target” (less is better).",
          },
          { name: "Life Area (optional)", what: "Link the number to a life area." },
          { name: "Add metric / Save", what: "Saves and shows “Metric added” or “Metric updated”." },
        ],
      },
    ],
    frameworks: [
      {
        term: "EOS Scorecard",
        definition:
          "A short list (5–15) of weekly numbers with a target and an owner, reviewed every week over a rolling 13 weeks. If a number is off track, it goes on the issues list.",
        example: "Every Monday a team looks at 10 numbers in 5 minutes and only discusses the red ones.",
        source: "EOS — Traction (Gino Wickman)",
      },
      {
        term: "Lead vs lag numbers",
        definition:
          "Lag numbers are results (revenue, deals won): they come late and you can't change them directly. Lead numbers are activities that cause the results (outreach, sales conversations, content): you control them this week. Watch both, act on the lead numbers.",
        example: "Revenue (lag) was low in October because outreach (lead) dropped to 30 a week in September.",
        source: "The 4 Disciplines of Execution (McChesney, Covey, Huling)",
      },
      {
        term: "On track / off track",
        definition: "A number is on track when it is at or above its target (direction “up”), or at or below it (direction “down”). No value = no status.",
        example: "Deep work target 15h, you did 12h → off track. Hours over a cap of 50, target down, you did 47 → on track.",
        source: "EOS (Traction)",
      },
      {
        term: "13-week grid",
        definition: "The last 13 weeks (one quarter) side by side. One red week is noise; three red weeks in a row is a trend.",
        example: "Sales conversations: red, red, red in the last three columns → time to fix your outreach.",
        source: "EOS (Traction); 12 Week Year (Brian Moran)",
      },
      {
        term: "Hit rate",
        definition: "Weeks on track ÷ weeks with a value, over the 13 weeks. Per number and in total.",
        example: "On track 9 of 12 measured weeks → 75% hit.",
        source: "bishOS",
      },
      {
        term: "Automatic metrics (⚡)",
        definition:
          "Numbers bishOS calculates for each week from your data: Outreach touches (outreach + follow-up touches), Sales conversations (call + meeting touches), Deals won (deals won, by close date), Won revenue (value of deals won that week), Content published (pieces published that week), Deep work hours (focus sessions that ended that week), Tasks completed (tasks done that week), Recall reviews (recall cards reviewed that week), Cash collected (business income logged in Finance that week).",
        example: "You log 23 outreach touches this week → Outreach touches shows 23 without typing.",
        source: "bishOS",
      },
      {
        term: "The founder scorecard (starter set)",
        definition:
          "Seven numbers: Outreach touches (target 100/week, auto), Sales conversations (5, auto), Deals won (1, auto), Revenue (manual; target = annual income ÷ 52, or 1,000 if not set), Content published (5, auto), Deep work hours (15h, auto), Recall reviews (50, auto).",
        example: "100 outreach touches a week = your daily quota of 20 × 5 working days.",
        source: "bishOS",
      },
      {
        term: "Manual metric",
        definition: "A number you type each week because bishOS can't see it (for example cash received in a bank, ad leads, NPS).",
        example: "“Qualified leads from ads”, target 10, typed every Friday from the ad dashboard.",
        source: "bishOS",
      },
      {
        term: "Archive vs delete",
        definition: "Archive hides a number but keeps its history (you can restore it). Delete removes the number and all its weekly values.",
        example: "You stop recording podcasts → archive “Podcast episodes”, don't delete it.",
        source: "bishOS",
      },
      {
        term: "EOS-lite",
        definition:
          "bishOS uses the parts of EOS that help a solo founder: a weekly Scorecard, an Issues list solved with IDS, and promises tracked like EOS To-Dos — without the team meetings and org charts.",
        example: "Friday: scorecard → red numbers become issues → solve the top 3 → each solution becomes a task or promise.",
        source: "Based on EOS — Traction (Gino Wickman)",
      },
    ],
    testing: [
      "Open Founder → Scorecard with no metrics. Expected: the “Start with the founder scorecard” empty state.",
      "Click “Start with the founder scorecard”. Expected: toast “Founder scorecard ready · 7 numbers, 6 of them automatic”, confetti, four summary cards, and a grid with 7 rows (6 with ⚡) and 13 week columns starting with “This week”.",
      "Check “Numbers to fill”. Expected: 1 (Revenue is manual and empty), amber.",
      "Click the Revenue cell under “This week” (+ Add), type 500, press Enter. Expected: +10 XP “Scorecard updated” the first time this week, the cell turns red or green against the target, and Numbers to fill becomes 0.",
      "Click the same cell, clear it, press Enter. Expected: the value is removed and “+ Add” comes back.",
      "Click an automatic cell. Expected: nothing to edit (read-only).",
      "Log 3 outreach touches on the Pipeline (+1 touch). Return. Expected: Outreach touches this week went up by 3.",
      "Click “Add metric”. Pick “⚡ Auto: Tasks completed”. Expected: Name “Tasks completed”, target 25, unit “tasks” are filled. Click “Add metric”. Expected: “Metric added” and a new row at the bottom.",
      "Use the row … → Move up on the new row. Expected: it moves up one place.",
      "Use … → Archive. Expected: the row disappears and an “Archived (1)” button appears. Click it. Expected: the row is shown faded with a Restore option.",
      "Edit a metric and switch to “At or below target”. Expected: the arrow under the name points down and the colours flip where needed.",
    ],
    tips: [
      "Fewer numbers, read every week, beats many numbers nobody reads.",
      "Put mostly lead numbers on the scorecard. You can change them this week.",
      "A target you hit every week is too easy. A target you never hit is just discouraging. Aim for 60–80% hit rate.",
      "Turn every red number into an issue. A number nobody acts on is decoration.",
    ],
  },

  // ───────────────────────────────────────────────────────────────────────
  // DECISIONS & ISSUES
  // ───────────────────────────────────────────────────────────────────────
  {
    id: "decisions-issues",
    group: "Founder",
    title: "Decisions & Issues",
    summary:
      "Two tools on one page. The Decision journal: write down big decisions before you know the outcome (options, choice, expected result, confidence, your state), then review them later to measure your judgement (calibration). The Issues list: every problem, obstacle or opportunity, ranked P1–P3 and worked with IDS (Identify, Discuss, Solve); solving can create a follow-up task.",
    why:
      "Founders make big calls with little information, and hindsight rewrites the memory of why. A journal keeps your real reasoning, so you learn if you are overconfident or too careful. The issues list stops problems from circling in your head: you name them, rank them and solve the top 3, one by one, with a clear action.",
    when: {
      oneTime: "Journal one recent big decision you are still waiting on. Dump every open problem into the Issues list and set priorities (P1 = urgent and important).",
      daily: "When a problem appears, add it to Issues in one line. Before any important call (a hire, a price, a big client, a pivot), journal it.",
      weekly: "In your weekly review: open the Issues tab and solve the top 3 with IDS. Review any decision whose review date has come.",
      monthly: "Look at the Calibration card: are you overconfident? Drop issues that no longer matter.",
    },
    pages: [
      {
        route: "/decisions",
        title: "Decisions & Issues — Decisions tab",
        purpose: "Journal big decisions, review them when the outcome is known, and see how well calibrated your judgement is.",
        elements: [
          {
            name: "Decisions & Issues (page header)",
            what: "Title with a gavel icon and the line “Judge your judgement: journal big calls before the outcome, and work the issues list with IDS.”",
          },
          {
            name: "Journal a decision (button)",
            what: "Shown on the Decisions tab. Opens the “Journal a decision” dialog.",
          },
          {
            name: "Decisions / Issues (tabs)",
            what: "Decisions shows a count of reviews due; Issues shows a count of open issues. The tab is saved in the address (?tab=issues), so links from Founder HQ open the right tab.",
          },
          {
            name: "Review due (banner)",
            what: "Amber banner when reviews are due: “Review due: 2 decisions. Compare what you expected with what actually happened. It takes two minutes.” with a “Review now” button.",
            how: "Click “Review now” to review the first due decision.",
          },
          {
            name: "All / Review due / Awaiting outcome / Reviewed (filter)",
            what: "Filter the decision cards. Each option shows a count. Due decisions are listed first, then newest first.",
          },
          {
            name: "Decision card",
            what: "Title, your confidence (e.g. “70%”; hover for the word, like “Fairly confident”), “Chose: …” (or “No choice recorded yet”), the outcome for reviewed ones, a chip (“As expected”, “Surprised”, “Reviewed”, “Review due”, or “Review” + the day, e.g. “Review friday” or “Review nov 3”), and the decision date. Due cards have an amber border and a “Review now” button.",
            how: "Click a card to open the decision drawer.",
          },
          {
            name: "Start your decision journal (empty state)",
            what: "Text: “For any call that matters (a hire, a price, a pivot, a big client) write the options, your choice, what you expect and how sure you are. Review it in 6 weeks.” and “Journal a decision”.",
          },
          { name: "Awaiting outcome (tile)", what: "Decisions not reviewed yet." },
          { name: "Reviewed (tile)", what: "Decisions you have reviewed." },
          {
            name: "Calibration (card)",
            what: "Hint “How often your expectations come true vs how sure you were”. Two bars: Average confidence and Turned out as expected. A verdict line. Four small columns for confidence bands 0–49%, 50–69%, 70–89%, 90–100%: the green fill is how often those decisions came true, the black line is your average confidence in that band, and “3×” is how many decisions. A last line gives the Brier score (“0 is perfect, 0.25 is a coin flip”).",
          },
          {
            name: "Calibration verdicts",
            what: "Under 3 scored decisions: “Review a few more decisions to see a trend.” Confidence more than 10 points above the hit rate: “Overconfident: outcomes match less often than you expect. Widen your options.” More than 10 points below: “Underconfident: you're right more often than you think. Decide faster.” Otherwise: “Well calibrated: your confidence matches reality.”",
          },
          {
            name: "Calibration empty texts",
            what: "“Review your first decision to start measuring your judgement.” or, if you reviewed but never answered the yes/no question, “Mark whether reviewed decisions matched your expectation to see calibration.”",
          },
        ],
        howTo: [
          "Before a big call, click “Journal a decision”.",
          "Write what you are deciding, the context, the options, your choice and what you expect to happen.",
          "Set your confidence honestly and tick your state (tired? rushed?).",
          "Keep the review date (6 weeks) or pick another preset. Save.",
          "When the review is due, click “Review now”, write what happened, answer yes or no, and write the lesson.",
        ],
      },
      {
        route: "/decisions",
        title: "Journal a decision, Review, and Decision drawer",
        purpose: "Write a decision before the outcome, review it after, and edit any detail.",
        elements: [
          {
            name: "Before-you-know note",
            what: "Blue line at the top of the dialog: “Write this before you know the outcome, so hindsight can't rewrite your reasoning.”",
          },
          { name: "What are you deciding?", what: "Required. E.g. “Hire a part-time SDR or keep doing outreach myself?”." },
          { name: "Context", what: "Hint “The situation, what you know, the constraints”." },
          {
            name: "Options you considered",
            what: "A list.",
            how: "Type an option and press Enter. Click an option to edit it.",
          },
          {
            name: "Your choice",
            what: "What you are going with. When you listed options, they appear as chips under the field.",
            how: "Type, or click an option chip to copy it in.",
          },
          { name: "Expected outcome", what: "Hint “What you think will happen, and by when”." },
          {
            name: "How confident are you?",
            what: "A slider 0–100% in steps of 5 (default 70%) with a word: Long shot (under 25), Doubtful (25+), Coin flip (45+), Fairly confident (60+), Confident (75+), Near certain (90+).",
          },
          {
            name: "Physical & mental state right now",
            what: "Chips: Rested, Tired, Calm, Stressed, Excited, Rushed, Anxious, Focused, plus a free note (“slept 5h, after a tough call…”).",
          },
          {
            name: "Review on",
            what: "Date (default in 6 weeks) with presets 2 weeks, 6 weeks, 3 months, 6 months.",
          },
          { name: "Life Area (optional)", what: "Link the decision to a life area." },
          {
            name: "Save to journal (button)",
            what: "Saves the entry: +10 XP (“Decision journaled”). Status is Decided when you wrote a choice, otherwise Open.",
          },
          {
            name: "Review a decision (dialog)",
            what: "A recap box: the title, “Written Oct 1, 2026 · state: Tired, Rushed”, “You chose…”, “You expected…”, “Confidence: 70%”. Then: “What actually happened?” (required), “Did it turn out the way you expected?” with two big buttons “Yes, as expected” / “No, it surprised me” (required), and Lessons (hint “Was it a good decision with a bad outcome, or the reverse? What would you do differently?”).",
            how: "Fill it and click “Complete review”: +20 XP and “Decision reviewed. Calibration updated”.",
          },
          {
            name: "Too early, remind me in 2 weeks",
            what: "Button in the review dialog. Moves the review date to 14 days from today (“Review moved 2 weeks out”).",
          },
          {
            name: "Decision drawer",
            what: "Opens when you click a card. Chips: Open / Decided / Reviewed, “70% confident”, “Review nov 3” (amber when due), As expected / Surprised. Editable fields (save on blur): Title, Context, Options, Choice (“Not decided yet”), Expected outcome, State when deciding, Review date, and for reviewed decisions What happened and Lessons. Writing a choice on an Open decision makes it Decided.",
          },
          {
            name: "Drawer footer",
            what: "Delete (asks to confirm; removes its XP) and “Review now” (not reviewed) or “Reopen review” (reviewed; removes the review XP and the yes/no answer).",
          },
        ],
      },
      {
        route: "/decisions?tab=issues",
        title: "Decisions & Issues — Issues tab",
        purpose: "Capture every problem, rank it, and solve the top 3 with Identify → Discuss → Solve.",
        elements: [
          {
            name: "Quick add",
            what: "A text box “Name an issue: a problem, obstacle, idea or opportunity…”, a P1 / P2 / P3 switch (default P2) and an Add button.",
            how: "Type one line, pick a priority, press Enter or click Add. Toast “Issue added”.",
          },
          {
            name: "Top 3: solve these first",
            what: "Up to 3 cards with a star header. Each card: a big number (1–3), a priority chip (P1 red, P2 amber, P3 grey), a status chip (Identify or Discuss), the title, the root cause (if written), and buttons “Discuss” (only in Identify) and “Solve”. Ranking: P1 first, then P2, then P3; older first within a priority.",
            how: "Click the title to open the issue drawer.",
          },
          {
            name: "Counts line",
            what: "“4 open · 9 solved all-time”, and a “Dropped (2)” / “Hide dropped” button when you have dropped issues.",
          },
          {
            name: "Issues board",
            what: "Columns: Identify (“Name the real issue in one line”), Discuss (“Dig for the root cause”), Solved (“Recently solved”, the last 12), and Dropped (only when shown).",
            how: "Drag a card between columns. Dropping on Solved opens the Solve dialog.",
          },
          {
            name: "Issue card",
            what: "Priority chip, a star when it is in the top 3, a “Task” chip when a follow-up task exists, the title (struck through when solved), and “✓ solution” (solved) or “Root cause: …”.",
          },
          {
            name: "No issues on the list (empty state)",
            what: "“Anything blocking the business goes here: a client problem, a broken process, an opportunity. Work the top 3 each week: Identify, Discuss, Solve.”",
          },
          {
            name: "Issue drawer",
            what: "Title = the status (Identify, Discuss, Solved, Dropped). An editable title, the priority switch, “Solved Oct 20” chip, a “Follow-up task created →” link, and three boxes: “Identify: what's really going on?”, “Discuss: root cause” (hint “Ask “why?” until you hit something you can change.”), “Solve: the solution”. Footer: Delete, and Drop / Discuss / Solve (active issues) or Reopen (solved or dropped).",
            how: "Reopening a solved issue removes its XP.",
          },
          {
            name: "Solve this issue (dialog)",
            what: "The issue title, Root cause, Solution, and “Create a follow-up task” (ticked). With the task: Task (placeholder = first line of the solution, or “Fix: <issue>”), Life Area and When (today). Button “Mark solved”.",
            how: "Click “Mark solved”: +25 XP and “Issue solved · follow-up task created”. The task priority follows the issue: P1 → high, P2 → medium, P3 → low.",
          },
        ],
        howTo: [
          "Whenever something bothers you, add it in one line with a priority.",
          "Weekly, look at the Top 3. Click Discuss on the first one.",
          "Open it and ask “why?” until you find a root cause you can change. Write it.",
          "Click Solve, write the solution, keep “Create a follow-up task” ticked, pick a day. Mark solved.",
          "Repeat for the next issue. Drop issues that no longer matter.",
        ],
      },
    ],
    frameworks: [
      {
        term: "Decision journal",
        definition:
          "A notebook of important decisions written at the moment you decide: the situation, options, your choice, what you expect, how sure you are and how you feel. Later you compare it with what happened.",
        example: "“Raise price from $3K to $4.5K. Expect: lose 1 in 5 leads, revenue up 20% in 8 weeks. 65% sure. State: rested, calm.”",
        source: "Farnam Street (Shane Parrish); Daniel Kahneman",
      },
      {
        term: "Hindsight bias",
        definition: "After you know the outcome, you remember that you “knew it all along”. Writing first protects your real reasoning.",
        example: "The hire failed; without the journal you'd think you had doubts. The journal says you were 85% sure.",
        source: "Thinking, Fast and Slow (Daniel Kahneman)",
      },
      {
        term: "Confidence",
        definition: "How sure you are that your expected outcome will happen, from 0 to 100%.",
        example: "70% = you expect it to come true about 7 times out of 10 for decisions like this.",
        source: "Superforecasting (Philip Tetlock)",
      },
      {
        term: "Review date",
        definition: "The day you look back to see what happened. Default 6 weeks. If it is too early to judge, push it 2 weeks.",
        example: "Pricing change on Oct 1 → review on Nov 12.",
        source: "Farnam Street decision journal",
      },
      {
        term: "Good decision vs good outcome",
        definition: "A good decision can have a bad outcome (bad luck), and a bad decision can turn out well. Judge the reasoning, not only the result.",
        example: "You picked the safer client and they went bankrupt. Was the information available? If not, the decision was still good.",
        source: "Thinking in Bets (Annie Duke)",
      },
      {
        term: "Calibration",
        definition:
          "Whether your confidence matches reality. If your 70%-sure decisions come true about 70% of the time, you are well calibrated. bishOS compares your average confidence with your hit rate (decisions that turned out as expected).",
        example: "Average confidence 80%, hit rate 55% → overconfident by 25 points: consider more options and slow down.",
        source: "Superforecasting (Philip Tetlock)",
      },
      {
        term: "Brier score",
        definition: "One number for how good your predictions are: the average of (confidence − result)², where result is 1 if it came true and 0 if not. 0 is perfect; 0.25 is like always saying 50%.",
        example: "90% sure and it happened → (0.9 − 1)² = 0.01. 90% sure and it didn't → 0.81.",
        source: "Glenn W. Brier (1950); Superforecasting (Tetlock)",
      },
      {
        term: "Issues list",
        definition: "One place for every problem, obstacle, idea or opportunity. Writing them down clears your head and lets you choose the most important ones.",
        example: "“Client X pays late”, “Proposal template is slow”, “Partnership offer from agency Y”.",
        source: "EOS — Traction (Gino Wickman)",
      },
      {
        term: "IDS (Identify, Discuss, Solve)",
        definition:
          "A three-step way to solve an issue. Identify: name the real issue (often not the first thing you said). Discuss: find the root cause, briefly. Solve: decide one action that makes it go away, with an owner and a date.",
        example: "Identify: “Leads go cold after the proposal.” Discuss: you send proposals by email and wait. Solve: present every proposal on a call. Task: update the proposal process by Friday.",
        source: "EOS — Traction (Gino Wickman)",
      },
      {
        term: "Root cause (5 whys)",
        definition: "The deepest cause you can change. Ask “why?” again and again until you reach it.",
        example: "Why late delivery? Scope creep. Why? No change process. Why? Contract has no clause → fix the contract.",
        source: "5 Whys (Toyota Production System, Taiichi Ohno)",
      },
      {
        term: "Priority P1 / P2 / P3",
        definition: "P1 = urgent and important, solve this week. P2 = important. P3 = nice to fix. The top 3 are ranked by priority, then by age.",
        example: "P1: “Biggest client threatening to leave”. P3: “Rename Google Drive folders”.",
        source: "bishOS",
      },
      {
        term: "Top 3",
        definition: "Only the three highest-ranked open issues get your attention this week. Solving three issues fully beats discussing ten.",
        example: "Weekly review: you solve 2 of the top 3; the third moves to Discuss.",
        source: "EOS (Traction)",
      },
      {
        term: "Dropped issue",
        definition: "An issue that no longer matters or that you decided not to solve. Dropping is a decision, not a failure.",
        example: "“Build a mobile app” dropped: customers don't ask for it.",
        source: "bishOS",
      },
    ],
    testing: [
      "Open Founder → Decisions & Issues. Expected: the Decisions tab, the empty state “Start your decision journal”, two tiles and the Calibration card saying “Review your first decision…”.",
      "Click “Journal a decision”. Type a title, add two options (press Enter after each), click an option chip under “Your choice”. Expected: the choice field is filled. Move the confidence slider to 80. Expected: “80% · Confident”.",
      "Pick the “2 weeks” preset and click “Save to journal”. Expected: +10 XP “Decision journaled” and a card with “80%”, “Chose: …” and a chip “Review” + the date two weeks from today (e.g. “Review nov 3”).",
      "Open the card. In the drawer change the Review date to today. Expected: the card shows “Review due” with an amber border, the banner “Review due: 1 decision” appears and the tab shows a count.",
      "Click “Review now”. Click “Complete review” without filling anything. Expected: warning “Write what actually happened”. Write an outcome and click Complete again. Expected: warning “Did it turn out as you expected?”. Click “No, it surprised me” and complete. Expected: +20 XP and the card shows “Surprised”.",
      "Check Calibration. Expected: average confidence 80%, turned out as expected 0%, verdict “Review a few more decisions to see a trend.” (under 3 decisions) and a Brier score of 0.64.",
      "Open the reviewed card and click “Reopen review”. Expected: it goes back to awaiting outcome and the review XP is removed.",
      "Open a review and click “Too early, remind me in 2 weeks”. Expected: “Review moved 2 weeks out” and the due banner disappears.",
      "Switch to the Issues tab. Type “Leads go cold after proposal”, click P1, click Add. Expected: “Issue added”, a Top 3 card numbered 1 with a red P1 chip and “Identify”.",
      "Click Discuss on it. Expected: the chip changes to Discuss and the card moves to the Discuss column.",
      "Click Solve. Write a solution, keep the task box ticked, click “Mark solved”. Expected: +25 XP “Issue solved · follow-up task created”, the issue appears in Solved with “✓ …” and a Task chip; the task exists in Tasks with high priority.",
      "Open the solved issue and click Reopen. Expected: it returns to Identify and the XP is removed.",
      "Add an issue, open it and click Drop. Expected: it leaves the board and a “Dropped (1)” button appears. Click it. Expected: a Dropped column shows the issue.",
    ],
    tips: [
      "Journal only decisions that matter: if you would not remember it in 3 months, skip it.",
      "Always tick your state. Many bad decisions are made tired or rushed, and the journal will show it.",
      "In IDS, most time should go to Identify. A well-named issue is half solved.",
      "If an issue stays in Discuss for weeks, it is too big. Split it.",
    ],
  },

  // ───────────────────────────────────────────────────────────────────────
  // STRATEGY AI
  // ───────────────────────────────────────────────────────────────────────
  {
    id: "strategy-ai",
    group: "Founder",
    title: "Strategy AI",
    summary:
      "The AI helpers inside the Founder pages: “Improve this offer” (Offers), “AI ideas” for new campaigns and “Plays for this campaign” (Campaigns), and “Route a conversation” (Pipeline, People, Commitments). They read your business context and suggest; they never change anything until you click.",
    why:
      "You are one person doing the work of a sales team, a marketer and a strategist. The AI gives you a fast second opinion grounded in proven frameworks (Hormozi's value equation, MAGIC naming, low-budget founder marketing) and in your own data, so you spend your time choosing, not starting from a blank page.",
    when: {
      oneTime:
        "Fill your Profile (top-right avatar → Profile): “What you do”, “Business” and “Current situation”. Set your currency in Settings. Have at least one offer. The AI reads these every time.",
      weekly: "Run “Plays for this campaign” on each live campaign. When an offer stops selling, run “Improve this offer”.",
      monthly: "Use “AI ideas” to plan next month's campaign.",
    },
    pages: [
      {
        route: "/offers/<id>",
        title: "Improve this offer (AI panel)",
        purpose: "Get concrete suggestions to make one offer more irresistible.",
        elements: [
          {
            name: "Improve this offer (card)",
            what: "Card with sparkles in the offer builder. Hint: “AI suggestions per lever. Nothing changes until you apply it.”",
          },
          {
            name: "Suggest improvements (button)",
            what: "Sends the whole offer (texts, scores, stack, price, urgency and results so far) plus your business context to the AI.",
            how: "Click it. While it works you see “Thinking…” with animated dots.",
          },
          {
            name: "Answer",
            what: "Markdown with sections: Biggest lever, Dream outcome, Likelihood & proof, Time to result, Effort removed, Bonuses to add, Guarantee, Urgency & scarcity, Price & packaging, Name ideas (MAGIC), and “Next test:” one experiment for this week. Scrollable when long.",
          },
          { name: "Add to notes", what: "Appends the answer to the offer's Notes under “--- AI suggestions (date) ---”. The button then shows “Added”." },
          { name: "Copy", what: "Copies the answer to the clipboard (“Copied”)." },
          { name: "Again", what: "Top-right button after an answer. Runs the AI again for a fresh answer." },
        ],
      },
      {
        route: "/campaigns",
        title: "AI ideas and Plays for this campaign",
        purpose: "Get new campaign concepts, or concrete plays inside a campaign.",
        elements: [
          {
            name: "AI ideas → Campaign ideas (dialog)",
            what: "On the Campaigns list. You give an objective, brand, offer and preferred channels. The AI returns up to 5 concepts (name, measurable objective, channels, angle, first steps), favouring founder-led, low-cost plays that create sales conversations in 2–4 weeks.",
            how: "Click “Add to board” on any idea to create it as an Idea campaign with the angle and steps in its notes.",
          },
          {
            name: "Plays for this campaign (panel)",
            what: "On a campaign page. Reads the campaign's objective, brand, channels, offer, dates, budget and results so far, and returns 5 plays (name, channels, angle, steps).",
            how: "Click “Suggest 5 plays”, then “Add to notes”, “Copy” or “Again”.",
          },
        ],
      },
      {
        route: "/pipeline",
        title: "Route a conversation",
        purpose: "Turn call notes into follow-ups. Full details are in Commitments → Route a conversation.",
        elements: [
          {
            name: "Route a conversation (button)",
            what: "On Pipeline, People and Commitments; “Route notes” on a person's page. The AI also sees your people list and open deals, so it can match names and the right deal.",
          },
        ],
      },
    ],
    frameworks: [
      {
        term: "Business context",
        definition:
          "What the AI reads about you before every answer: your Profile (Business, What you do, Current situation), your currency, up to 6 offers that are not retired (name, status, who it is for, price), your 6 most recent campaigns (name, status, channels and the start of their learnings) and your content pillars.",
        example: "Profile says “Devzelo Solutions, UI/UX agency”. Campaign ideas then suggest plays for agencies, not for e-commerce.",
        source: "bishOS",
      },
      {
        term: "Suggest, never write",
        definition: "Strategy AI only proposes. Your data changes only when you click a button like “Add to notes”, “Add to board” or “Apply”.",
        example: "You run “Improve this offer” three times and keep only the third answer.",
        source: "bishOS",
      },
      {
        term: "Founder-led, low-budget marketing",
        definition: "Campaign ideas favour plays a solo founder can run with no team and little money: content, cold outreach, partnerships and email, aiming for sales conversations within 2–4 weeks.",
        example: "“Partner webinar with a complementary agency, invite both email lists, offer a free audit.”",
        source: "bishOS AI instructions; Traction (Gabriel Weinberg)",
      },
      {
        term: "Next test",
        definition: "The last line of every offer suggestion: one small experiment to run this week, so advice turns into action.",
        example: "“Next test: pitch the 14-day guarantee version to 5 prospects and count yeses.”",
        source: "bishOS",
      },
    ],
    testing: [
      "Fill Profile → Business and What you do. Open an offer and click “Suggest improvements”. Expected: “Thinking…”, then an answer with the sections listed above and a “Next test” line.",
      "Click “Copy”. Expected: “Copied”. Click “Add to notes”. Expected: “Added” and the Notes field contains the dated AI block.",
      "Click “Again”. Expected: a new answer replaces the old one; your notes are unchanged until you click “Add to notes” again.",
      "On Campaigns click “AI ideas”, pick Brand “Either”, click “Generate ideas”. Expected: up to 5 idea cards. Nothing new appears on the board until you click “Add to board”.",
      "Open a live campaign and click “Suggest 5 plays”. Expected: 5 plays with headings, channels and bullet steps.",
      "If the AI service fails (e.g. no API key), click a button. Expected: an amber toast with the error message and no data changed.",
    ],
    tips: [
      "The better your Profile and offer texts, the better the AI. Garbage in, garbage out.",
      "Treat AI answers as a first draft. Keep the 20% that fits your business.",
      "Run “Improve this offer” after a lost deal and paste the lost reason into the offer notes first.",
    ],
  },
];
