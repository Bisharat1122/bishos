/**
 * Guide content: everything about content. Content Studio (Board, Calendar,
 * Ideas, Pillars, Analytics, Playbook), the piece editor and its 8-step video
 * workflow, Inspiration (swipes, hooks, watchlist) and the AI content coach.
 * Pure data: only `import type`, so Node can load it with --experimental-strip-types.
 * Frameworks are paraphrased from Kane Kallaway's public material and Paddy
 * Galloway's YouTube masterclass (see lib/kallaway.ts, lib/youtube.ts and
 * research_notes/Kallaway content system/).
 */
import type { GuideSection } from "../types";

export const sections: GuideSection[] = [
  // ───────────────────────────────────────────────────────────────────────
  // 1. Content Studio: header, Board, Calendar, Ideas, Pillars, Analytics
  // ───────────────────────────────────────────────────────────────────────
  {
    id: "content-studio",
    group: "Content",
    title: "Content Studio",
    summary:
      "The Content Studio holds every post and video, from a raw idea to a published piece with numbers. The method is simple: one hub piece a week, cut into many small pieces.",
    why:
      "You make content for two brands (you and your company) with very little time. The Studio gives you one next move, keeps your idea bank full, blocks weak pieces with a publish checklist, and compares each piece with your own median so you repeat what works.",
    when: {
      daily:
        "Open the Studio and do the “Next move”. Capture ideas the moment you get them. Log numbers when a 24h, 7d or 30d snapshot is due.",
      weekly:
        "Run the Weekly content review in Analytics (20 minutes). Pick next week's hub. Check the Calendar for the week.",
      monthly: "Read Top 3 and Bottom 3 this month, Best hook types and Recycle due in Analytics.",
      oneTime:
        "Create 2–3 pillars per brand. Work through the Playbook (it opens by itself on your first visit). Set your weekly hub target in Settings.",
    },
    pages: [
      {
        route: "/content",
        title: "Content Studio: header and daily glance",
        purpose:
          "The top of the Studio. It shows this week's hub, four daily numbers and one next move, then the tab bar that switches between Playbook, Board, Calendar, Ideas, Pillars and Analytics.",
        elements: [
          { name: "Content Studio", what: "The page title. The subtitle says the method: “One hub a week, cut into many. Ideas → script → publish → measure → recycle.”" },
          {
            name: "Both / Personal / Company",
            what: "The brand filter. It filters every tab to your personal brand, your company, or both.",
            how: "Click one. The app remembers your choice in this browser. Inspiration uses the same filter.",
          },
          { name: "Inspiration", what: "A button that opens the Inspiration page (/swipes): your saved posts, hook library and creator watchlist.", how: "Click it." },
          {
            name: "New piece",
            what: "Opens the New piece dialog. The brand starts as the filtered brand (Personal when the filter is Both).",
            how: "Click it, type a working title, pick a format, then Create or Create & open.",
          },
          {
            name: "This week's hub (ring)",
            what: "The ring shows hub pieces published this week against your weekly target (Settings, default 1). The card shows your most advanced unpublished hub: its title, its stage chip and a button with the next stage name.",
            how: "Click the title to open the hub. Click the next-stage button (for example “Script →”) to move it one stage forward. When the target is met the card says “Shipped. Now cut it into shorts.”",
          },
          {
            name: "Start one",
            what: "Shown when no hub is in progress (“No hub in progress.”). It opens New piece with Hub piece on, format Long video and stage Brief.",
            how: "Click it and give the hub a title.",
          },
          {
            name: "scheduled today",
            what: "How many pieces have today as their publish date. If older scheduled pieces were not published, the label becomes “today · N slipped” in orange.",
            how: "Click it to open the Calendar tab.",
          },
          { name: "idea bank", what: "A small ring and “N/100”: ideas and seeds in your bank against the goal of 100.", how: "Click it to open the Ideas tab." },
          { name: "need numbers", what: "Published pieces whose 24h, 7d or 30d snapshot is due but not logged yet.", how: "Click it to open Analytics, where you log the numbers." },
          { name: "recycle due", what: "Published pieces whose recycle date (6 months after publishing) has passed.", how: "Click it to open Analytics and use the Recycle due card." },
          {
            name: "Next move",
            what: "One suggestion, chosen in this order: publish a piece scheduled for today (Open), log numbers (Log numbers), move your hub forward (Open hub), pick this week's hub (Ideas), bank 3 ideas while you are under 100 (Capture), or save one post that stopped your scroll (Inspiration).",
            how: "Read it and click the button at the right end of the line.",
          },
          {
            name: "Playbook · Board · Calendar · Ideas · Pillars · Analytics",
            what: "The tab bar. Ideas shows how many ideas and seeds you have. Pillars shows how many pillars you have. The web address changes to ?tab=… so you can bookmark a tab.",
            how: "Click a tab. On your very first visit (no strategy and no pieces yet) the Studio opens on Playbook. After that it opens on Board.",
          },
          {
            name: "Your content pipeline starts with ideas",
            what: "The empty Board, shown before you have any piece. It suggests: dump 10 ideas, set up 2–3 pillars per brand, pick one idea as this week's hub.",
            how: "Use the buttons Start the Playbook, Capture ideas or Set up pillars.",
          },
        ],
        howTo: [
          "Pick the brand filter (Both, Personal or Company).",
          "Read the Next move line and click its button.",
          "Check the four numbers: scheduled today, idea bank, need numbers, recycle due. Click any that is not zero.",
          "Move your hub one stage with the next-stage button on the This week's hub card.",
        ],
      },
      {
        route: "/content?tab=board",
        title: "Board",
        purpose: "A Kanban board of all pieces in six columns, from Ideas to Done. You drag pieces forward as they progress.",
        elements: [
          { name: "Search titles and hooks", what: "A search box. It filters cards by words in the title or the hook.", how: "Type a word." },
          { name: "All pillars", what: "A pillar filter. It also has “No pillar” for untagged pieces.", how: "Pick a pillar." },
          { name: "All formats", what: "A format filter (Short video, Long video, Carousel, Text post, Thread, Newsletter, Article, Podcast, Story).", how: "Pick a format." },
          { name: "Hubs", what: "A toggle that shows only hub pieces.", how: "Click it on or off." },
          { name: "Drag cards between columns · → advances one stage", what: "A reminder of the two ways to move a card." },
          { name: "Ideas column", what: "Stages Idea and Seed. Hint: “Raw ideas and tested seeds”." },
          { name: "Planning column", what: "Stages Brief and Script. Hint: “Angle, hook and script”." },
          { name: "Production column", what: "Stages Ready to record, Recorded and Editing. Hint: “Record and edit (video only)”." },
          { name: "Ready column", what: "Stages Ready to publish and Scheduled. Hint: “Checklist gate, then a date”." },
          { name: "Live column", what: "Stages Published and Repurposing. Hint: “Out there. Cut the hub into shorts.”" },
          { name: "Done column", what: "Stages Measured, Recycle due and Archived. Hint: “Measured, recycle or archive”." },
          {
            name: "Piece card",
            what: "One piece. A coloured stripe on the left shows its pillar colour. Top row: format, brand icon, Hub badge and the ratio chip (for example ×1.8). Then the title, the hook in quotes and the pillar name.",
            how: "Click the card to open the piece editor. Drag it to another column to change its stage.",
          },
          { name: "Stage chip", what: "The exact stage name with six small dots. The filled dots show which of the six columns the piece has reached." },
          { name: "Date chip", what: "The publish day, shown as a relative day (Today, Tomorrow, 3 days ago). Green with a tick when published. Orange when the date passed and the piece is not published." },
          { name: "Checklist count (for example 4/6)", what: "Shown in the Ready column only: publish checklist items done out of the total for this format." },
          { name: "Workflow ring (for example 3/8)", what: "How many of the 8 video workflow steps are done for this piece. Green at 8/8." },
          { name: "Fork icon + number", what: "How many repurposed children this piece has." },
          { name: "Sparkle icon + number", what: "How many saved inspirations (swipes) are linked to this piece." },
          { name: "N views", what: "Views from the most mature snapshot (30d, else 7d, else 24h)." },
          { name: "Platform icons", what: "The platforms this piece is for (up to 3, then +N)." },
          { name: "→ (advance button)", what: "Moves the piece one stage forward. Text formats skip the recording stages. Only hubs get Repurposing.", how: "Click it. If the move publishes the piece and checklist items are open, the Publish checklist dialog opens first." },
          { name: "+ Capture an idea", what: "A quick-add box at the bottom of the Ideas column.", how: "Type an idea and press Enter. It uses the current brand and the pillar you filtered by." },
          { name: "New brief", what: "A button at the bottom of the Planning column. It opens New piece starting at Brief.", how: "Click it." },
          { name: "Show all N / Show recent only", what: "At the bottom of Done when it holds more than 20 pieces. By default only the 20 most recent are shown.", how: "Click to switch." },
        ],
        howTo: [
          "Filter by pillar, format or Hubs if the board is busy.",
          "Drag a card to a column. The piece gets that column's first stage. Exceptions: a text format dropped on Production lands on Editing; an unpublished piece dropped on Done is archived.",
          "Or click → on a card to move it exactly one stage.",
          "When a move would publish the piece, finish the Publish checklist (or choose Publish anyway).",
        ],
      },
      {
        route: "/content?tab=calendar",
        title: "Calendar",
        purpose: "Plan when each piece goes out. Drag pieces between days, and schedule pieces that have no date yet.",
        elements: [
          { name: "Previous / Next arrows", what: "Move one month (Month view) or one week (Week view).", how: "Click." },
          { name: "Month and year label", what: "The month shown, or the date range of the week shown." },
          { name: "Today", what: "Jumps back to today and selects today.", how: "Click." },
          { name: "Month / Week", what: "Switches between a 6-week month grid and a 7-day week view.", how: "Click one." },
          {
            name: "Day cell (Month view)",
            what: "One day. Today's number sits in a filled circle. Up to 3 pieces show as chips, then “+N more”. On a phone you see coloured dots instead.",
            how: "Click a day to select it. Hover and click + to plan a new piece on that day.",
          },
          {
            name: "Calendar chip",
            what: "A piece on a day: pillar colour dot, format icon (a green tick when published), a layers icon and bold title when it is a hub.",
            how: "Click to open the piece. Drag an unpublished chip to another day to reschedule it. Published pieces stay on the day they went out.",
          },
          { name: "Day column (Week view)", what: "Each day shows compact piece cards, a “Today” label on today and a + button.", how: "Drag cards between days. Click + to plan a piece." },
          { name: "Drag a piece to another day to reschedule. Published pieces sit on the day they went out.", what: "A reminder under the grid." },
          {
            name: "Selected day panel",
            what: "Month view only. It shows the selected day (for example “Today · Monday, Oct 20”), its pieces as compact cards, or “Nothing on this day.”",
            how: "Click “Plan a piece here” to create a piece with that date.",
          },
          {
            name: "Ready to schedule (N)",
            what: "A tray of pieces from Brief onward that have no publish date. Each shows a chip and its stage. Empty state: “Nothing waiting”.",
            how: "Drag a piece from the tray onto a day to schedule it. Drag a piece from a day onto the tray to remove its date.",
          },
        ],
        howTo: [
          "Once a week, open Calendar in Week view.",
          "Drag pieces from Ready to schedule onto free days.",
          "Fix slipped pieces: drag them to a new day.",
          "Use + on a day to plan a new piece for that date (it starts at Brief).",
        ],
      },
      {
        route: "/content?tab=ideas",
        title: "Ideas",
        purpose: "Dump ideas fast, see how full your idea bank is, and promote the best idea to a hub or a brief.",
        elements: [
          { name: "Capture ideas", what: "The capture box. Hint: “One idea per line. Dump them now, judge them later.”" },
          {
            name: "Idea sparks",
            what: "Eight starter chips: A question a client asked this week; An objection from a sales call; A mistake I made and what it cost; Something I learned (TIL); A myth in my industry; Behind the scenes of what we're building; A result we got and how; An opinion most founders won't say out loud.",
            how: "Click a chip. Its words appear on a new line in the box. Finish the sentence.",
          },
          { name: "Idea text box", what: "A big box. Each line becomes one idea.", how: "Type or paste many lines." },
          { name: "Personal / Company", what: "The brand for the new ideas.", how: "Click one. The pillar list changes to that brand." },
          { name: "No pillar (select)", what: "The pillar for the new ideas. Only pillars of the chosen brand are listed.", how: "Pick one or leave No pillar." },
          { name: "Format (select)", what: "The format for the new ideas. Default: Text post.", how: "Pick one." },
          { name: "Ctrl + Enter", what: "Keyboard shortcut to add the ideas." },
          { name: "Add idea / Add N ideas", what: "Saves every line as an idea at stage Idea.", how: "Click it. A toast shows how many are in the bank. Reaching 100 shows a celebration: “Idea bank full”." },
          {
            name: "Idea bank (ring)",
            what: "A big ring with your total ideas and seeds out of 100. The text says how many are left, or “Full bank. Now pick the best one for this week's hub.”",
          },
          {
            name: "Ideas per pillar (bars)",
            what: "One bar per pillar with the idea count. “No pillar” appears if some ideas have no pillar.",
            how: "Click a bar to filter the list to that pillar. Click it again to show all.",
          },
          { name: "Ideas (N)", what: "The list of ideas and seeds, newest first, with an All pillars filter at the top right." },
          { name: "Idea title", what: "The idea text.", how: "Click it to edit it in place." },
          { name: "Seed chip", what: "Shown when the idea is a seed (tested as a short post)." },
          { name: "Format icon and age", what: "The idea's format and how long ago you captured it." },
          { name: "Pillar (row select)", what: "Change the idea's pillar.", how: "Pick a pillar." },
          { name: "Sprout button", what: "Tooltip: “Mark as seed (tested as a short post)”. Shown on ideas only.", how: "Click it after you tested the idea as a short post." },
          { name: "Layers button", what: "Tooltip: “Make it this week's hub”. It sets Hub on and moves the idea to Brief.", how: "Click it." },
          { name: "Arrow button", what: "Tooltip: “Move to Brief”.", how: "Click it when you are ready to plan the piece." },
          { name: "Open", what: "Opens the idea in the piece editor.", how: "Click it." },
          { name: "Delete idea (trash)", what: "Deletes the idea after a confirm.", how: "Hover the row, click the trash, confirm." },
          { name: "Seed = tested as a short post.", what: "A note shown when seeds exist: “Seeds that beat your median make great hubs.”" },
        ],
        howTo: [
          "Click a spark chip and finish the sentence. Repeat for 2 minutes.",
          "Pick the brand, pillar and format, then press Ctrl + Enter.",
          "Each week, pick the idea or seed with the most energy and click the layers button to make it the hub.",
        ],
      },
      {
        route: "/content?tab=pillars",
        title: "Pillars",
        purpose: "Define the 3–5 themes you want to be known for, per brand. Every piece belongs to one pillar so your feed stays coherent.",
        elements: [
          { name: "Pillars are the 3–5 themes you want to be known for…", what: "The intro text at the top." },
          { name: "New pillar", what: "Opens the pillar dialog.", how: "Click it." },
          {
            name: "Set up your content pillars (suggestions)",
            what: "Shown when the brand has no pillars. Suggestion chips: Founder lessons, Learning in public, Building in public (personal); Customer results, How-to & product, Industry myths (company).",
            how: "Click a chip to add that pillar, then edit it freely.",
          },
          { name: "Pillar card", what: "A colour bar, the pillar name and its brand. Pencil (edit) and trash (delete) appear on hover." },
          { name: "Description", what: "What the pillar is about, in one line." },
          { name: "Ideas / In progress / Published", what: "Three counters: ideas and seeds, pieces from Brief to Scheduled, and published pieces in this pillar." },
          { name: "N in 30 days", what: "How many pieces of this pillar had activity in the last 30 days (created, scheduled or published)." },
          { name: "Learning area chip (book icon)", what: "The learning area that feeds this pillar, if you linked one." },
          {
            name: "Quiet for 30 days. One idea keeps it alive.",
            what: "An orange warning when the pillar had no activity for 30 days. A grey version says “No pieces yet. Bank the first idea.” for a new pillar.",
            how: "Type an idea in the box “An idea for <pillar>…” and press Enter. It is banked in this pillar.",
          },
          { name: "Delete pillar", what: "Removes the pillar after a confirm. Pieces keep existing without a pillar.", how: "Hover the card, click the trash, confirm." },
          { name: "Name (dialog)", what: "The pillar name, for example “Founder lessons”.", how: "Type it." },
          { name: "Brand (dialog)", what: "Personal or Company.", how: "Click one." },
          { name: "What it's about (dialog)", what: "Hint: “One line you could say out loud: what you teach, for whom.”", how: "Type one line." },
          { name: "Colour (dialog)", what: "Five chart colours, plus the colours of your Life Areas (“Same as …”).", how: "Click a colour." },
          {
            name: "Fed by learning area (optional) (dialog)",
            what: "Links a learning area. Hint: “Learning in public: what you study becomes content here.”",
            how: "Pick an area or None.",
          },
          { name: "Cancel / Create pillar / Save", what: "Dialog buttons.", how: "Click Create pillar (new) or Save (edit)." },
        ],
        howTo: [
          "Click a suggestion chip or New pillar.",
          "Give it a name, a brand, one line on what it is about, and a colour.",
          "Link a learning area if you want to learn in public on this theme.",
          "Keep 3–5 pillars per brand. Revive a quiet pillar by banking one idea in it.",
        ],
      },
      {
        route: "/content?tab=analytics",
        title: "Analytics",
        purpose: "See what worked, against your own median. Log missing numbers, write one lesson per winner and loser, save winning hooks and recycle old winners.",
        elements: [
          { name: "Published this month", what: "Pieces published this month. Small text: all-time total." },
          { name: "Views this month", what: "Total views of this month's pieces. Small text: your median views per piece (or “log numbers to see”)." },
          { name: "Saves this month", what: "Total saves of this month's pieces." },
          { name: "Leads from content", what: "Leads (emails, DMs, sign-ups) logged on this month's pieces. Green when above zero." },
          { name: "In the pipeline", what: "Pieces from Brief to Scheduled. Small text: ideas banked." },
          { name: "Publishing streak", what: "Weeks in a row (ending this week or last week) with at least one published piece. A flame shows when above zero. “publish this week to start” when zero." },
          { name: "Weekly content review", what: "A guided 20-minute review card. See the next page for every step." },
          {
            name: "Needs numbers (N)",
            what: "Pieces waiting for a snapshot. Hint: “Snapshots at 24h, 7d and 30d.” Each row has the piece title and a button with the window that is due.",
            how: "Click the window button (24h, 7d or 30d). The Numbers dialog (“Numbers · <title>”) opens with Views, Likes, Comments, Shares, Saves, Follows, Leads, plus 3s hold %, Avg view and CTR %. Views are required. Empty state: “You're up to date. Nice.”",
          },
          {
            name: "Top 3 this month",
            what: "This month's 3 best pieces by ratio to your median. Hint: “Against your own median, not anyone else's.” Each shows rank, title, format, brand, views and window, and “×N your median”.",
            how: "Write one lesson in the box “Lesson: why did this one fly?” (it saves when you click away). Click “Save hook to library” to keep the hook.",
          },
          {
            name: "Bottom 3 this month",
            what: "This month's 3 weakest pieces. Hint: “No shame, just data. One lesson each.” Empty state: “Not enough numbers yet” (you need views on 2+ pieces this month).",
            how: "Write a lesson in “Lesson: what would you do differently?”.",
          },
          {
            name: "Cadence · published per week",
            what: "A bar chart of the last 12 weeks. Each bar splits Personal and Company. Hint: your hub target and this week's hubs (for example “this week 0/1”).",
            how: "Hover a bar to see the titles published that week.",
          },
          {
            name: "Personal vs company",
            what: "A split bar, then one card per brand: published total, this month, Median (ratio chip), Views, Leads, In pipeline. It always shows both brands, whatever the filter.",
          },
          {
            name: "Best hook types",
            what: "Each hook type you tagged, with the number of pieces and their median ratio. The bar is green at ×1.2 or more and orange at ×0.7 or less. Hint: “Median performance vs your median, by hook type.”",
          },
          {
            name: "Winning hooks",
            what: "Hooks of your pieces at ×1.2 your median or better. Hint: “Your outliers (×1.2+). Save them as templates.”",
            how: "Click “Save hook” to add it to your hook library. “In library” shows when it is already there.",
          },
          {
            name: "Recycle due (N)",
            what: "Published pieces whose recycle date passed. Hint: “Winners come back at +6 and +12 months.” Each shows title, ratio and “First out …”.",
            how: "Click Recycle (creates a fresh copy and opens it), +6 months (snooze), or Archive.",
          },
        ],
        howTo: [
          "Clear Needs numbers first: click each window button and type the views.",
          "Read Top 3 and Bottom 3. Write one lesson for each.",
          "Save winning hooks to your library.",
          "Handle Recycle due: recycle the winners, snooze or archive the rest.",
        ],
      },
      {
        route: "/content?tab=analytics (Weekly content review)",
        title: "Weekly content review",
        purpose: "A 20-minute guided loop: numbers in, ask why, keep the lesson, promote what worked, pick next week's hub.",
        elements: [
          { name: "Start 20 min", what: "A countdown timer from 20:00.", how: "Click to start. Click again to stop." },
          { name: "Step pills", what: "Five steps: 1 Log numbers, 2 Top 3 · why?, 3 Bottom 3 · why?, 4 Promote hooks, 5 Next hub. Done steps show a tick.", how: "Click a pill to jump to that step." },
          {
            name: "Step 1 · Log numbers",
            what: "Up to 8 pieces with a due snapshot, each with a chip like “7d due”. Empty state: “All numbers are in”.",
            how: "Click Add and type the numbers.",
          },
          {
            name: "Step 2 · Top 3 · why?",
            what: "Your best pieces of the last 30 days, with ratio and hook.",
            how: "Write “Why did this work? Hook, topic, format, timing…”. Click Save hook to keep the hook.",
          },
          { name: "Step 3 · Bottom 3 · why?", what: "Your weakest pieces of the last 30 days.", how: "Write “What would you change? Hook, length, topic…”." },
          { name: "Step 4 · Promote hooks", what: "Hooks at ×1.2 your median or better that are not in your library yet.", how: "Click Save on each." },
          {
            name: "Step 5 · Next hub",
            what: "Text: “One hub a week, cut into 5–10 short pieces.” A list “Choose next week's hub…” (★ marks pieces that are already hubs).",
            how: "Pick one and click “Make it the hub”. It becomes a hub, and an idea or seed moves to Brief.",
          },
          { name: "Step x of 5 · ~N min", what: "Where you are and the time this step should take (4, 5, 5, 3, 3 minutes)." },
          { name: "Back / Next / Finish review", what: "Navigation. Finish review marks this week done in this browser and shows a celebration.", how: "Click." },
          { name: "Done for this week", what: "Shown after you finish: “Lessons saved, hooks promoted. The loop is closed.”", how: "Click “Review again” to redo it." },
        ],
        howTo: ["Click Start 20 min.", "Do steps 1 to 5 in order. Use Next between steps.", "Click Finish review."],
      },
      {
        route: "/content (New piece dialog)",
        title: "New piece dialog",
        purpose: "Create a piece with the basics: title, brand, hub or not, format, pillar, start stage and date.",
        elements: [
          { name: "Working title", what: "Placeholder: “What's the one idea?”", how: "Type the idea in a few words." },
          { name: "Personal / Company", what: "The brand.", how: "Click one." },
          { name: "Hub piece", what: "A toggle. Tooltip: “The weekly long piece you cut into 5–10 short ones”.", how: "Click to turn on." },
          { name: "Format", what: "Nine buttons: Short video, Long video, Carousel, Text post, Thread, Newsletter, Article, Podcast, Story.", how: "Click one." },
          { name: "Pillar", what: "Pillars of the chosen brand.", how: "Pick one." },
          { name: "Start at", what: "Idea, Seed (tested), Brief or Script.", how: "Pick the stage the piece is really at." },
          { name: "Publish on (optional)", what: "A publish date.", how: "Pick a date. With a date, the start stage defaults to Brief." },
          { name: "Cancel / Create / Create & open", what: "Create saves and stays. Create & open saves and opens the piece editor. Enter does Create & open.", how: "Click." },
        ],
        howTo: ["Click New piece.", "Type the working title.", "Pick brand, format and pillar.", "Click Create & open."],
      },
      {
        route: "Publish checklist (gate dialog)",
        title: "Publish checklist gate",
        purpose: "A 30-second quality check that opens when a move would publish a piece while checklist items are still open.",
        elements: [
          { name: "<title> is moving to Published. A 30-second check before it goes out.", what: "The intro line (it names the target stage)." },
          { name: "Progress bar and count", what: "Items done out of the total for this format (11 for video, 6 for text and podcast)." },
          { name: "Checklist items", what: "Each item with its hint. Pillar and Repurpose plan tick themselves and say “Done automatically”.", how: "Click an item to tick or untick it. It saves at once." },
          { name: "Not yet", what: "Closes the dialog. The piece does not move.", how: "Click." },
          { name: "Publish anyway", what: "Shown while items are open. Publishes without the missing items.", how: "Click only when you made a conscious choice." },
          { name: "Publish", what: "Enabled when every item is ticked. Publishing sets the publish date, gives 40 XP and sets a recycle date 6 months later.", how: "Click." },
        ],
      },
    ],
    frameworks: [
      {
        term: "Hub piece (hub and spoke)",
        definition:
          "Your one big piece of the week, usually a long video or a newsletter. You then cut it into 5–10 small pieces (the spokes) for other platforms. One idea, many outputs, little extra work.",
        example: "A 12-minute YouTube video on founder-led sales becomes 3 shorts, 1 carousel, 3 LinkedIn posts and 1 X thread.",
        source: "GaryVee content model (pillar content → micro content); Justin Welsh's repurposing system",
      },
      {
        term: "Repurposed children",
        definition:
          "The small pieces cut from a hub. Each child is linked to its hub (its parent), with the same brand, pillar and campaign. The piece editor shows them in the Repurpose tree.",
        example: "“Short video 2 · Why I stopped cold calling” is a child of the hub “Why I stopped cold calling”.",
        source: "bishOS",
      },
      {
        term: "Weekly hub target",
        definition: "How many hub pieces you want to publish each week. You set it in Settings (default 1). The ring on This week's hub and the Cadence chart use it.",
        source: "bishOS",
      },
      {
        term: "Seed",
        definition:
          "An idea you already tested as a short text post. If the test post beat your median, the idea is proven, so it makes a safe hub.",
        example: "You post 3 lines on LinkedIn: “Your first sales hire should be you.” It gets ×2 your median. Turn it into this week's hub video.",
        source: "bishOS (test small, then scale)",
      },
      {
        term: "Idea bank goal of 100",
        definition:
          "Keep about 100 ideas and seeds in the bank. With a full bank you never sit in front of an empty page, and you can pick the best idea instead of the first one.",
        example: "Two minutes a day with the spark chips gets you from 20 to 100 ideas in about a month.",
        source: "bishOS",
      },
      {
        term: "Idea sparks",
        definition: "Eight sentence starters that turn your normal week into ideas: client questions, sales objections, mistakes, lessons, myths, behind the scenes, results and bold opinions.",
        example: "“An objection from a sales call:” → “Your tool is too expensive for a 5-person team.” That is a post.",
        source: "bishOS",
      },
      { term: "Stage: Idea", definition: "A raw idea in one line. Not judged yet.", example: "“Why most founders post for 3 weeks and quit.”", source: "bishOS" },
      { term: "Stage: Seed", definition: "An idea tested as a short post (see Seed).", source: "bishOS" },
      { term: "Stage: Brief", definition: "You decide who it is for, the one idea, the angle and the proof you will use.", source: "bishOS" },
      { term: "Stage: Script", definition: "You write the words of the video or the full post.", source: "bishOS" },
      {
        term: "Stage: Ready to record",
        definition: "The script is done and you can film. Video, story and podcast only. Text formats skip this stage.",
        source: "bishOS",
      },
      { term: "Stage: Recorded", definition: "Filmed and waiting for the edit. Not used by text formats.", source: "bishOS" },
      {
        term: "Stage: Editing",
        definition: "Being edited. A text format dropped on the Production column lands here too, as a final polish step.",
        source: "bishOS",
      },
      { term: "Stage: Ready to publish", definition: "Finished. Waiting for a publish date.", source: "bishOS" },
      { term: "Stage: Scheduled", definition: "It has a publish date and waits for that day.", source: "bishOS" },
      {
        term: "Stage: Published",
        definition:
          "Live. The app stores the publish date, gives 40 XP and sets a recycle date 6 months later. Numbers unlock. Moving the piece back to any stage before Published undoes the publish and removes the XP.",
        source: "bishOS",
      },
      {
        term: "Stage: Repurposing",
        definition: "A published hub that you are cutting into children. Only hubs get this stage. Repurposing a published hub moves it here by itself.",
        source: "bishOS",
      },
      { term: "Stage: Measured", definition: "Numbers are logged and the lesson is written. The piece is done.", source: "bishOS" },
      {
        term: "Stage: Recycle due",
        definition:
          "The piece is ready to come back. A published piece also counts as recycle due when its recycle date has passed, even if you never picked this stage. The → button skips this stage; from here → archives.",
        source: "bishOS",
      },
      { term: "Stage: Archived", definition: "Out of the pipeline, kept for history. An unpublished piece dropped on Done is archived.", source: "bishOS" },
      { term: "Board group: Ideas", definition: "Column for Idea and Seed. Raw ideas and tested seeds.", source: "bishOS" },
      { term: "Board group: Planning", definition: "Column for Brief and Script. Angle, hook and script.", source: "bishOS" },
      { term: "Board group: Production", definition: "Column for Ready to record, Recorded and Editing. Record and edit (video only).", source: "bishOS" },
      { term: "Board group: Ready", definition: "Column for Ready to publish and Scheduled. The checklist gate, then a date.", source: "bishOS" },
      { term: "Board group: Live", definition: "Column for Published and Repurposing. Out there. Cut the hub into shorts.", source: "bishOS" },
      { term: "Board group: Done", definition: "Column for Measured, Recycle due and Archived.", source: "bishOS" },
      {
        term: "The 9 formats",
        definition:
          "Short video (vertical, under ~90 s), Long video (YouTube), Carousel (swipeable slides), Text post (LinkedIn or X), Thread (a chain of X posts), Newsletter (email), Article (blog), Podcast (audio or video talk) and Story (24-hour Instagram story). Carousel, Text post, Thread, Newsletter and Article are text formats: they skip the recording stages.",
        source: "bishOS",
      },
      {
        term: "Your median (×1.8 your median)",
        definition:
          "Every published piece is compared with the median views of your OTHER published pieces at the same snapshot window. The app uses the same format when you have 3+ other pieces in that format, otherwise all formats. ×1.8 means 1.8 times your usual. Green at ×1.2 or more, orange at ×0.7 or less. You compete with yourself, not with famous creators.",
        example: "Your shorts usually get 2,000 views at 7 days. A short with 3,600 views shows ×1.8.",
        source: "bishOS",
      },
      {
        term: "Snapshot windows (24h, 7d, 30d)",
        definition:
          "You log numbers three times per piece: 1 day, 7 days and 30 days after publishing. The app asks only for the most mature missing window that is due (30d is asked until day 75). Comparisons use the most mature window you logged.",
        source: "bishOS",
      },
      {
        term: "Winning hook (×1.2+)",
        definition: "A hook from one of your pieces that reached ×1.2 your median or more. These are your own proven hooks. Save them to the hook library and reuse the pattern.",
        source: "bishOS",
      },
      {
        term: "Publishing streak",
        definition: "The number of weeks in a row with at least one published piece. It counts back from this week (or last week, if you have not published yet this week).",
        source: "bishOS",
      },
      {
        term: "Recycle at 6 months",
        definition:
          "When a piece is published, the app sets a recycle date 6 months later. Then it appears in Recycle due. Recycle makes a fresh copy (title “Recycle · …”, at Script or Brief, with the old lesson in the brief) and sets the next recycle 6 months later. Most of your audience never saw the old one.",
        example: "Your best post from April comes back in October with a new hook.",
        source: "Common creator practice (Justin Welsh reposts his best posts); bishOS rule",
      },
      {
        term: "Content pillars",
        definition:
          "The 3–5 themes you want to be known for, per brand. Every piece belongs to one. Pillars keep your feed coherent, so people (and the algorithm) know what you stand for.",
        example: "Personal: Founder lessons, Building in public, Learning in public. Company: Customer results, How-to & product, Industry myths.",
        source: "Justin Welsh (content pillars); bishOS",
      },
      {
        term: "Learning in public",
        definition: "Share what you are learning while you learn it. Link a learning area to a pillar and your study notes become content ideas.",
        example: "You study pricing. Each week you post one pricing lesson in plain words.",
        source: "Shawn “swyx” Wang",
      },
      { term: "Quiet pillar", definition: "A pillar with no activity for 30 days. One banked idea brings it back to life.", source: "bishOS" },
      {
        term: "Hook type tags",
        definition:
          "16 tags you can put on a hook. Nine are Kallaway's proven spoken-hook formats (Secret reveal, Case study, Comparison, Education, Personal experience, Problem, Contrarian, List, Question; see the video workflow section). Seven more are common types: Curiosity, Result, Mistake, Myth, Story, How-to and Before/after. Tags feed Best hook types in Analytics.",
        source: "Kallaway (9 formats) + bishOS",
      },
      { term: "Hook type: Curiosity", definition: "Opens a knowledge gap the viewer wants to close.", example: "“Nobody talks about this part of fundraising.”", source: "bishOS" },
      { term: "Hook type: Result", definition: "Leads with a specific outcome.", example: "“We booked 40 demos in 30 days with one email.”", source: "bishOS" },
      { term: "Hook type: Mistake", definition: "A costly mistake to avoid.", example: "“The biggest mistake I made building my startup:”", source: "bishOS" },
      { term: "Hook type: Myth", definition: "Breaks a common belief.", example: "“Everyone says you need a co-founder. Here's why that's wrong.”", source: "bishOS" },
      { term: "Hook type: Story", definition: "Drops the viewer into a moment.", example: "“Last Tuesday, a client told me something I can't stop thinking about.”", source: "bishOS" },
      { term: "Hook type: How-to", definition: "Promises a clear method.", example: "“How we got 100 users in 2 weeks with zero ad spend.”", source: "bishOS" },
      { term: "Hook type: Before/after", definition: "Shows a transformation.", example: "“0 inbound leads → 20 a month. Here's exactly what changed.”", source: "bishOS" },
      {
        term: "Publish checklist (publish gate)",
        definition:
          "The list a piece must pass before it can be published. Video formats (short video, long video, story) have 11 items. Text formats and podcasts have 6. Pillar and Repurpose plan tick themselves. You can still choose Publish anyway.",
        source: "Kallaway (publish gate) + bishOS",
      },
      {
        term: "Gate item: Hook passes the audit",
        definition: "Clear subject, one question, speed to value, and curiosity for line 2. Run the Hook audit in workflow step 3 first.",
        source: "Kallaway",
      },
      {
        term: "Gate item: Visual, spoken & text hooks say the same thing",
        definition: "What they see, hear and read in the first seconds must mean the same thing. “Confusion leads to churn.” Watch it with the sound off: is it still clear? Video only.",
        source: "Kallaway",
      },
      {
        term: "Gate item: Lock-in zone confirms the hook",
        definition: "The 5–10 seconds after the hook must confirm the hook's claim (no bait-and-switch) and show a trust anchor (proof, result, credential). Video only.",
        example: "Hook: “This email got us 40 demos.” Lock-in: you show the email and the calendar full of demos.",
        source: "Kallaway",
      },
      {
        term: "Gate item: Eyes-closed pacing test",
        definition: "Listen to your edit without watching. Bored? Cut tighter. Lost? Add breathing room. Video only.",
        source: "Kallaway",
      },
      {
        term: "Gate item: Every visual matches its words",
        definition: "For each sentence, ask: what is the best way to show this? Wrong visuals at the wrong time confuse people. Video only.",
        source: "Kallaway",
      },
      {
        term: "Gate item: Two dopamine hits early",
        definition: "Give two useful insights before the viewer could leave. Two hits and they are locked in. One, maybe. Zero, they bounce.",
        source: "Kallaway",
      },
      {
        term: "Gate item: One CTA ramp, aligned with the topic",
        definition: "One call to action per piece, and it must be the natural answer to the topic, not an ad break.",
        example: "A video on cold email ends with “Comment EMAIL and I'll send you my template.”",
        source: "Kallaway",
      },
      { term: "Gate item: Captions / subtitles", definition: "Most people watch muted. Burn in captions. Video only.", source: "Kallaway" },
      {
        term: "Gate item: Custom cover / thumbnail",
        definition: "Make a real cover. Most shares happen in DMs and group chats, where only the cover shows and the video does not autoplay.",
        source: "Kallaway",
      },
      { term: "Gate item: Tagged with a pillar", definition: "Ticks itself when the piece has a pillar.", source: "bishOS" },
      { term: "Gate item: Repurpose plan", definition: "Ticks itself once the piece has at least one repurposed child.", source: "bishOS" },
      {
        term: "Publish anyway",
        definition: "Publishes with open checklist items. Use it rarely. The checklist exists because each item protects views or trust.",
        source: "bishOS",
      },
      { term: "XP for publishing", definition: "Each first publish of a piece gives 40 XP in the bishOS game layer. Un-publishing or deleting removes it, so XP cannot be farmed.", source: "bishOS" },
      {
        term: "Weekly content review",
        definition: "A 20-minute weekly ritual in 5 steps: log numbers, ask why for the top 3, ask why for the bottom 3, promote winning hooks, pick next week's hub.",
        source: "bishOS (based on Kallaway's “review” step of the loop)",
      },
    ],
    testing: [
      "Open /content. Expected: the header shows This week's hub, the four numbers and a Next move line.",
      "Switch the brand filter to Company, reload the page. Expected: Company is still selected.",
      "Click New piece, type “Test hub”, turn on Hub piece, pick Long video, click Create & open. Expected: the piece editor opens; the hub appears on This week's hub.",
      "On the Board, type “Test idea” in + Capture an idea and press Enter. Expected: a new card in the Ideas column.",
      "Click → on the card three times. Expected: Idea → Seed → Brief → Script, with a toast each time.",
      "Drag a text post card onto Production. Expected: it lands on Editing.",
      "Drag a video card with open checklist items onto Live. Expected: the Publish checklist dialog opens. Click Not yet: the card does not move.",
      "In the dialog, click Publish anyway. Expected: a Published celebration with XP; the card moves to Live.",
      "Open Calendar, drag a chip from Ready to schedule onto a day. Expected: toast “Scheduled for …”; the chip shows on that day.",
      "Drag a chip from a day back onto the tray. Expected: toast “Unscheduled”.",
      "Open Ideas, click two spark chips, finish the lines, press Ctrl + Enter. Expected: toast “2 ideas banked”; the ring count goes up by 2.",
      "On an idea row click the layers button. Expected: toast “Promoted to hub · now in Brief”.",
      "Open Pillars with no pillars, click a suggestion chip. Expected: toast “Pillar … added” and a new card.",
      "Open Analytics, click a window button in Needs numbers, type 1.2k in Views, click Save. Expected: toast “24h numbers saved”; the row disappears.",
      "In Weekly content review click Start 20 min. Expected: the button counts down from 20:00. Click Finish review on step 5. Expected: “Done for this week”.",
      "In Recycle due click Recycle. Expected: toast “Fresh copy created” and the new “Recycle · …” piece opens.",
    ],
    tips: [
      "Keep the Studio open on Board during the week and on Analytics on your review day.",
      "Use Seed for ideas you tested as a short post. Seeds that beat your median are your safest hubs.",
      "If Next move says “Log numbers”, do it first. Without numbers, every comparison is blind.",
    ],
  },
  // ───────────────────────────────────────────────────────────────────────
  // 2. Playbook: hero, 1 · The loop, 2 · Positioning
  // ───────────────────────────────────────────────────────────────────────
  {
    id: "content-playbook-foundations",
    group: "Content",
    title: "Playbook 1–2: the loop and positioning",
    summary:
      "The Playbook tab is a guided program, one per brand, built on Kane Kallaway's content system. This part covers the top of the Playbook, section 1 (The loop: how every piece is made and improved) and section 2 (Positioning: who you are for and how you win).",
    why:
      "Most founders post random content and quit after a few weeks. The Playbook makes you decide your game, your one ideal viewer and your angle first, so the algorithm sends your videos to buyers. Then it tracks your reps so you keep going past the point where most people stop.",
    when: {
      oneTime:
        "Spend your first 2–3 days on Positioning, once per brand. Revisit it each quarter or when your offer changes.",
      weekly: "Check The loop meter and your 3-2-1 plan dots (how many pieces per bucket you published this week).",
      daily: "Every piece you make is one rep of the loop: idea, research, script, record, edit, post, review.",
    },
    pages: [
      {
        route: "/content?tab=playbook",
        title: "Playbook: top card and navigation",
        purpose: "Shows your overall progress for one brand, lets you switch brand, log an outlier, and jump to the next section to do.",
        elements: [
          { name: "% done (ring)", what: "Your overall progress: the average of the seven section percentages." },
          { name: "Kallaway Playbook · Personal", what: "The program name and the brand you are working on." },
          {
            name: "From zero to a content engine that sells",
            what: "The headline. Below it: “Position in 3 days, build your data system in week 1, run a 60-day short-form lab and a weekly YouTube track, then iterate and convert. One step at a time.”",
          },
          {
            name: "Personal / Company",
            what: "The brand of this Playbook. Each brand has its own strategy, lab, YouTube track and progress.",
            how: "Click one. It starts on the brand of the Studio filter (Personal when the filter is Both).",
          },
          { name: "Log an outlier", what: "Opens the Save inspiration dialog so you can log a video that beat its creator's average.", how: "Click it." },
          {
            name: "Section pills (1 Loop … 7 Convert)",
            what: "Seven pills: Loop, Position, Data, Lab, YouTube, Iterate, Convert. Green with a tick when complete. The next section to do has a dark outline. A % shows partial progress.",
            how: "Click a pill to scroll to that section.",
          },
          {
            name: "Up next",
            what: "The first unfinished section in this order: Position, Data, Lab, YouTube, Iterate, Convert, then Loop. It shows the title, phase and summary.",
            how: "Click Continue to scroll there.",
          },
          {
            name: "Section card (all 7 sections)",
            what: "Each section has a ring with its number (a tick when complete), the title, a phase chip (for example “Days 1–3”), a “Complete” chip, a one-line summary with %, and a chevron. A “Why” box with a light bulb gives two plain reasons. Completed sections start folded.",
            how: "Click the title or the chevron to fold or unfold.",
          },
          { name: "Celebration", what: "When a section completes, confetti and a toast appear (“<Section> complete”). All seven: “Kallaway Playbook complete. You built the engine.”" },
          { name: "Credits line", what: "At the bottom: frameworks paraphrased from Kane Kallaway's public material; the YouTube playbook is Paddy Galloway's." },
        ],
        howTo: [
          "Pick the brand.",
          "Click Continue on Up next.",
          "Fill the section until its ring is full, then click Continue again.",
        ],
      },
      {
        route: "/content?tab=playbook#pb-loop",
        title: "1 · The loop (Every rep)",
        purpose: "Shows the 7 steps every piece goes through, the meta-principle behind the system, your rep count and how many pieces you make per batch.",
        elements: [
          {
            name: "Why box",
            what: "“Every piece goes round the same 7 steps. You loop it, rep after rep.” and “The strategy is the easy part. The skill is how much you improve between one rep and the next.”",
          },
          {
            name: "Loop stepper (7 steps)",
            what: "Seven cards with arrows and a loop icon at the end: 1 Idea, 2 Research, 3 Script, 4 Record, 5 Edit, 6 Post, 7 Review. Each has a one-line rule.",
            how: "Read it left to right. Scroll sideways on a phone.",
          },
          {
            name: "The meta-principle: Reps × iteration distance",
            what: "Three rules: Volume negates luck. The sauce is the distance you improve between reps. Expect the quit point at 10–30 reps.",
          },
          {
            name: "Your reps (meter)",
            what: "Your rep count (published pieces of this brand, all formats) on a bar with ticks at 1, 10, 30, 100 and 300. The bar is orange in the quit-point zone (10–30) and green after 30. The text below changes with your count.",
          },
          {
            name: "Reps per batch",
            what: "How many pieces you make before you post and review: “1 at a time”, “2–3” or “5–10”. Hint: one rep at a time for your first ~300; batching lengthens the iteration cycle.",
            how: "Click one. Under 300 reps with a batch above 1, a warning says “Under 300 reps: one at a time iterates faster.”",
          },
        ],
        howTo: [
          "Read the 7 steps once and keep them in mind for every piece.",
          "Set Reps per batch to “1 at a time” while you have fewer than 300 reps.",
          "Watch the meter when you feel like quitting. If you are between 10 and 30, that feeling is normal.",
        ],
      },
      {
        route: "/content?tab=playbook#pb-position",
        title: "2 · Positioning (Days 1–3)",
        purpose: "Fill your positioning canvas: the game, the KPI, your ideal viewer, your niche, your angle and your offer. It decides who the algorithm sends your videos to.",
        elements: [
          { name: "Save status", what: "“Saving…”, “Saved” or “Not saved” at the top right. Every field saves by itself." },
          {
            name: "Why box",
            what: "“Spend your first 2–3 days here. Positioning decides who the algorithm sends your videos to.” and “One topic, one avatar, one game per channel. It's easier to start narrow and widen than the reverse.”",
          },
          { name: "Skill before content.", what: "A note: content amplifies skill. Aim for top 10% (ideally top 1%) in what you teach." },
          {
            name: "The growth system · zero to a plan in 8 steps",
            what: "Eight tiles: Niche interview, Competitor watchlist, Positioning wheel, Audience bullseye, 3-2-1 plan, Topic scanner, Format matrix, Write hooks & scripts by hand. Each shows a number or a tick and a hint. Tiles owned by another section are dashed and say “→ Data system” or “→ The loop”. The count shows n/8.",
            how: "Click a tile to jump to the block where you do it.",
          },
          {
            name: "Positioning canvas",
            what: "A bar and n/15, with 15 chips that turn green when done: Content game, KPI, Authority statement, Audience of one, Max-pain steps, Niche bullseye (2+ rings), Contrarian vault (3+), Terms to own, Signature objects, Uniqueness (3+ axes), Hero platform, Lead magnet, Content formulas (5+), Where you play, 3-2-1 buckets.",
          },
          {
            name: "Your content game",
            what: "Five cards: #1 Entertainment media, #2 Education media, #3 Simple product, #4 Product that needs explaining, #5 Authority / B2B. Each shows a hint, its KPI and how it makes money. A “Suggested” chip marks Authority for Personal, and #4 and #5 for Company. A note explains the usual pick per brand. Picking #1 or #2 shows a warning that the media game is a losing game to start now.",
            how: "Click a card. If your KPI is empty, the game's KPI is set too.",
          },
          {
            name: "Your KPI",
            what: "Five chips: Emails per video, Followers per video, $ per view, Conversions per view, Views. The line below repeats the hint and warns if the KPI does not match your game.",
            how: "Click one.",
          },
          {
            name: "Authority statement",
            what: "A field: “I help [who] with [what] in [your unique way]”. Below: “Before every idea, ask: does this serve X with Y?”",
            how: "Type one sentence. It saves when you pause or click away.",
          },
          {
            name: "Audience of one (niche interview)",
            what: "A big field for your one perfect viewer (the “Frankenstein test”: name, age, what they have tried, their dream outcome).",
            how: "Describe one real-feeling person, stitched from real clients.",
          },
          {
            name: "Their max-pain steps",
            what: "A numbered list: “Their max-pain steps (hard, slow or expensive). Each one is a topic.”",
            how: "Type a pain step and press Enter. Remove items with their delete control.",
          },
          {
            name: "Positioning wheel: points of uniqueness",
            what: "Five fields: Topic, Substance / depth, Avatar, Format, Visuals. Hint: map 5–10 competitors from your watchlist and find the white space. Fill at least 3.",
            how: "Write how you are different on each axis.",
          },
          {
            name: "Where you play (Format Pyramid)",
            what: "A pyramid drawing with four layers (top to bottom: Stories, Application, Explanation, Facts) and a red dashed “saturation line” above Facts. Next to it, the same four layers as buttons with hints. Picking Facts shows a warning; otherwise a tip says to go straight to Application in a crowded niche.",
            how: "Click a layer (in the drawing or the list) to choose where you play.",
          },
          {
            name: "The 4 ways left to stand out (pick the ones you lean on)",
            what: "Four toggle cards: Better ideas, More advanced, Better proof, Better storytelling, each with a hint.",
            how: "Click the ones you will lean on. Click again to remove.",
          },
          {
            name: "Audience bullseye",
            what: "A target drawing and a numbered list of up to 5 rings. Ring 1 (centre, filled) is your narrowest niche. Ring 5 shows in red with ✕: it is banned. An example line shows 5 rings for a SaaS founder audience.",
            how: "Type ring 1 and press Enter (“Ring 1: your narrowest niche…”), then each next ring out (“Next ring out…”).",
          },
          {
            name: "Contrarian take vault",
            what: "A target chip (n/3–5), an input “Most people believe… but actually…”, an Add button and the numbered list of takes. Empty hint: “What do most people in my niche believe that I disagree with?”",
            how: "Type a take and press Enter or Add. Click a take to edit it. Use the trash to remove it.",
          },
          {
            name: "The 3-2-1 plan",
            what: "A counter (n/7 this week) and four cards: Bucket 1 · broad, Bucket 2 · narrow, Bucket 3 · narrow, and Chaos agent (“1 creative bet a week”). Each bucket has dots for this week (2 per bucket, 1 for the chaos agent), a name field and a hint (broad = bullseye ring 4, narrow = rings 2–3). A note lists pieces published this week without a bucket.",
            how: "Name each bucket. Then tag the bucket on each piece in workflow step 2 so the dots fill.",
          },
          {
            name: "Terms to own & signature objects",
            what: "Two tag lists. Terms: niche words you want people to link to you. Signature objects: the same set, look and props in every video.",
            how: "Type a term and press Enter. Remove with the × on a tag.",
          },
          {
            name: "Hero platform",
            what: "Chips: Instagram, TikTok, YouTube Shorts, LinkedIn, YouTube, X. Below: “+ Email” and “Islands, not ecosystems: don't cross-post YouTube links, except by email.”",
            how: "Click your one hero platform.",
          },
          {
            name: "Lead magnet",
            what: "A name field (for example “The 5-step founder sales playbook (PDF)”) and five type chips: PDF / doc / template, 3–5 day email course, Free community, Waitlist / landing page, Form.",
            how: "Name your free resource and pick its type.",
          },
          {
            name: "Content formulas (format matrix)",
            what: "A target chip (live formulas / 5–10), the list of formulas (topic · format · layout) each with a Testing / Winner / Retired switch and a trash button, and three inputs: Topic, Format (suggests story structures), Layout (suggests Talking head, Green screen, Split screen, POV vlog, In-the-world, Faceless text, Whiteboard, Screen recording). Example: barbecue technique · live tutorial · standing at the grill.",
            how: "Fill the three inputs and click Add formula (or Enter in Layout). Mark winners as lab data comes in. Retire formulas that burn out.",
          },
        ],
        howTo: [
          "Day 1: pick the game and the KPI. Write the authority statement and the audience of one with 3–5 max-pain steps.",
          "Day 2: fill the positioning wheel (3+ axes), the bullseye (2+ rings) and 3+ contrarian takes. Pick where you play on the pyramid and the ways you stand out.",
          "Day 3: name the 3-2-1 buckets, add terms and signature objects, pick the hero platform, name the lead magnet, and add 5+ content formulas.",
          "Check the canvas bar reaches 15/15.",
        ],
      },
    ],
    frameworks: [
      {
        term: "Kallaway Playbook",
        definition:
          "A 7-section guided program per brand: 1 The loop (every rep), 2 Positioning (days 1–3), 3 Data system (week 1), 4 The 60-day lab, 5 YouTube long-form (weekly, 50 weeks), 6 Iterate (after every rep), 7 Convert (always on).",
        source: "Kallaway (composite beginner routine), bishOS",
      },
      {
        term: "How section progress is scored",
        definition:
          "Loop: reps out of 30. Positioning: canvas items out of 15. Data system: the average of creators/20, outliers at 5×+/10 and broken-down swipes/3. Lab: reps out of 50. YouTube: weeks shipped out of 50. Iterate: reviewed reps out of 5 (a reviewed rep has numbers plus a weak brick or a next fix). Convert: 3 basics (lead magnet named with a type, a business KPI, at least one rep with leads).",
        source: "bishOS",
      },
      {
        term: "The Kallaway loop (7 steps)",
        definition: "Every piece goes through the same seven steps, and you repeat them for every rep: Idea, Research, Script, Record, Edit, Post, Review.",
        source: "Kallaway",
      },
      { term: "Loop step: Idea", definition: "Start from outliers: first your own winners, then winners of creators with 10K–1M followers.", source: "Kallaway" },
      { term: "Loop step: Research", definition: "Find facts with a high shock score and your contrarian angle.", source: "Kallaway" },
      { term: "Loop step: Script", definition: "Hook, then structure, then the one-question chain. He writes a script in about 20 minutes.", source: "Kallaway" },
      { term: "Loop step: Record", definition: "Record line by line. It keeps your energy up.", source: "Kallaway" },
      { term: "Loop step: Edit", definition: "Run the eyes-closed test and make every visual match its words.", source: "Kallaway" },
      { term: "Loop step: Post", definition: "Post at the same time every day, for your own accountability, not for the algorithm.", source: "Kallaway" },
      { term: "Loop step: Review", definition: "Ask which LEGO brick was weak and fix 1–2 things in the next rep.", source: "Kallaway" },
      {
        term: "Rep",
        definition: "One published piece. In the Playbook, reps are all published pieces of the brand, in any format.",
        source: "Kallaway",
      },
      {
        term: "Reps × iteration distance (meta-principle)",
        definition:
          "Two things make you good: many reps, and how much you improve between one rep and the next. After each rep, break it into its bricks, compare it A vs B with the winner in your niche, and fix 1–2 things.",
        example: "Rep 4 had a slow hook. The winner in your niche shows the result in second 1. Rep 5 shows the result in second 1.",
        source: "Kallaway",
      },
      {
        term: "Volume negates luck",
        definition: "The more reps you post, the more chances you get at a breakout. One video can be unlucky; fifty cannot.",
        source: "Kallaway (credits Alex Hormozi)",
      },
      {
        term: "The quit point (10–30 reps)",
        definition:
          "Around rep 10 to 30 you think “I should be good by now and I still suck.” Most people quit here. It is normal, and the first breakout on a new account usually comes in this zone.",
        source: "Kallaway",
      },
      {
        term: "Rep milestones (1, 10, 30, 100, 300)",
        definition:
          "The ticks on Your reps: 1 = first rep; 10 = the quit zone starts; 30 = past the quit point; 100 = take the stencil off (stop copying outliers closely and find your own lane); 300 = you may start batching.",
        source: "Kallaway",
      },
      {
        term: "One rep at a time vs batching",
        definition:
          "Batching means making several pieces before you post and review. It lengthens the iteration cycle: batch 5 and you repeat rep 1's mistake five times. Make one at a time for your first ~300 reps, then 2–3, later 5–10.",
        source: "Kallaway",
      },
      {
        term: "Skill before content (skill-first)",
        definition:
          "Content only amplifies a skill you already have. Ask: am I top 10% (ideally top 1%) in what I teach? If not, build the skill first. Without real skill you have no non-obvious takes.",
        example: "Kallaway made one short a day for 18 months, about 8 hours each, before he taught short-form.",
        source: "Kallaway",
      },
      {
        term: "The growth system (8 steps)",
        definition:
          "Kallaway's zero-to-plan for a new expert: 1 Niche interview, 2 Competitor watchlist, 3 Positioning wheel, 4 Audience bullseye, 5 3-2-1 plan, 6 Topic scanner, 7 Format matrix, 8 Write hooks & scripts by hand.",
        source: "Kallaway (Open Residency podcast, Oct 2026)",
      },
      {
        term: "Growth step: Niche interview",
        definition: "Answer who you serve, what you sell, your ideal viewer, their dream outcome, their pains and your unfair advantage. Done when Audience of one and Max-pain steps are filled.",
        source: "Kallaway",
      },
      { term: "Growth step: Competitor watchlist", definition: "List ~10 creators to start, 20–30 later. Done at 10+ creators (in the Data system section).", source: "Kallaway" },
      { term: "Growth step: Positioning wheel", definition: "Map competitors on each axis of uniqueness and find the white space. Done at 3+ filled axes.", source: "Kallaway" },
      { term: "Growth step: Audience bullseye", definition: "Rings from your narrowest niche outward. Done at 2+ rings.", source: "Kallaway" },
      { term: "Growth step: 3-2-1 plan", definition: "3 buckets × 2 videos a week + 1 chaos agent. Done when all 3 buckets have a name.", source: "Kallaway" },
      { term: "Growth step: Topic scanner", definition: "Scan competitor outliers and mark the ones you have a non-obvious take on. Done at 5+ outliers of 5× or more.", source: "Kallaway" },
      { term: "Growth step: Format matrix", definition: "Story structure × visual layout. Done at 5+ live content formulas.", source: "Kallaway" },
      {
        term: "Growth step: Write hooks & scripts by hand",
        definition: "AI can get a draft to about 90%. The last 10%, your voice and your take, is you. Done at your first rep.",
        source: "Kallaway",
      },
      {
        term: "Positioning canvas",
        definition: "The 15 items you fill in Positioning. When all 15 are green, the section is complete.",
        source: "Kallaway (personal brand positioning canvas), bishOS",
      },
      {
        term: "The 5 Content Games",
        definition:
          "Five different games you can play with content, each with its own goal and KPI. Pick your game from your business model before any tactic. Only one game per channel.",
        example: "Your founder account plays #5 Authority. Your company account plays #4 if the product needs explaining.",
        source: "Kallaway",
      },
      {
        term: "Game #1: Entertainment media",
        definition: "Maximum views. Money from ad revenue (CPM) and brand deals. KPI: views. Kallaway calls it a losing game to start now: you compete with MrBeast, Netflix and AI.",
        source: "Kallaway",
      },
      {
        term: "Game #2: Education media",
        definition: "Teach things people can apply. Still a media business: money from CPM and brand deals. KPI: followers.",
        source: "Kallaway",
      },
      {
        term: "Game #3: Simple product",
        definition: "A product that needs no explanation (clothes, drinks, a couch). Just show it in a cool context. KPI: conversions.",
        source: "Kallaway",
      },
      {
        term: "Game #4: Product that needs explaining",
        definition: "A product people do not understand at first sight (a SaaS tool, a standing desk). Short education closes the “what is it, why do I need it” gap. KPI: conversions, ideally in one session.",
        example: "A 45-second short that shows how your app saves a clinic 5 hours a week.",
        source: "Kallaway",
      },
      {
        term: "Game #5: Authority / B2B",
        definition: "Services, coaching, info products, B2B SaaS. People must trust you before they buy. Trust is the currency and email is the asset. KPI: emails. Kallaway's specialty, and the usual founder game.",
        source: "Kallaway",
      },
      {
        term: "KPI by game",
        definition: "Entertainment media → views. Education media → followers. Simple product → conversions. Product that needs explaining → conversions. Authority / B2B → emails.",
        source: "Kallaway",
      },
      { term: "KPI: Emails per video", definition: "New email subscribers that one video brings. Kallaway's #1 metric for business games.", source: "Kallaway" },
      { term: "KPI: Followers per video", definition: "New followers that one video brings. His #2 metric. A follow is worth about 5–10 views.", source: "Kallaway" },
      {
        term: "KPI: $ per view",
        definition: "Money earned divided by views. On-target views beat total views.",
        example: "5,000 views that bring $50,000 = $10 per view. That beats 500,000 views that bring nothing.",
        source: "Kallaway",
      },
      { term: "KPI: Conversions per view", definition: "Sales or sign-ups divided by views. For product games.", source: "Kallaway" },
      { term: "KPI: Views", definition: "Total views. Only the right KPI for media games.", source: "Kallaway" },
      {
        term: "Audience matching",
        definition:
          "The algorithm is a matchmaker. It transcribes your video, maps the topic and tests it on about 200 people. If they like it more than usual, it sends it to about 10× more similar people. Keep one topic and one avatar so each new video goes to the right people.",
        example: "A founder who posts sales tips, then a gym video, then crypto news confuses the algorithm. Each video gets a weak first test.",
        source: "Kallaway",
      },
      {
        term: "Anti-views and on-target views",
        definition:
          "On-target views come from people who have the problem your offer solves. Anti-views come from people who will never buy: they do not pay you, and they teach the algorithm to send your next videos to the wrong people. You do not need virality, you need on-target views.",
        example: "A viral meme brings 500K views from students. Your next sales video then flops, because it is tested on students.",
        source: "Kallaway",
      },
      {
        term: "Media game warning",
        definition: "If you pick Entertainment or Education media, the app warns you: products, services and offers pay far more per view, and the media game is crowded.",
        source: "Kallaway",
      },
      {
        term: "Authority statement",
        definition:
          "One sentence: “I help [X] with [Y] in [Z way].” Use it as an avatar filter. Before every idea, ask: does this serve X with Y? It stops viewer drift.",
        example: "“I help seed-stage SaaS founders get their first 20 customers with founder-led sales.”",
        source: "Kallaway",
      },
      {
        term: "Viewer drift",
        definition: "The slow slide toward vanity topics that get views but do not serve your ideal viewer. The authority statement prevents it.",
        source: "Kallaway",
      },
      {
        term: "Audience of one (Frankenstein test)",
        definition:
          "Picture one perfect viewer sitting in a chair in front of you. Stitch them together from real clients: name, age, situation, what they tried, their dream outcome, their fears. Write every video for that one person.",
        example: "“Sam, 34, seed-stage SaaS founder, 2 years in, drowning in sales calls, wants a repeatable pipeline.”",
        source: "Kallaway",
      },
      {
        term: "Max-pain steps",
        definition:
          "Map your viewer's workflow today. The steps that are hard, slow or expensive are their biggest pains. Each one is a topic, and your new, better way to solve it is your content.",
        example: "Pain: “Writing cold emails takes me 2 hours a day.” Topic: “The 10-minute cold email system.”",
        source: "Kallaway (audience of buyers road map)",
      },
      {
        term: "Positioning wheel",
        definition: "Map 5–10 competitors on each axis of uniqueness. Where nobody is strong, that is your white space, your lane.",
        source: "Kallaway",
      },
      {
        term: "The 5 uniqueness axes",
        definition: "The five ways you can be different from other creators: Topic, Substance / depth, Avatar, Format, Visuals. Fill at least 3.",
        source: "Kallaway",
      },
      { term: "Uniqueness axis: Topic", definition: "What you talk about that others don't.", example: "Nobody in your niche talks about pricing for agencies. You do.", source: "Kallaway" },
      { term: "Uniqueness axis: Substance / depth", definition: "How deep and non-obvious you go.", example: "Others say “do cold email”. You show your real reply rates and templates.", source: "Kallaway" },
      { term: "Uniqueness axis: Avatar", definition: "Who exactly it is for.", example: "Not “founders”, but “solo technical founders selling to hospitals”.", source: "Kallaway" },
      { term: "Uniqueness axis: Format", definition: "A story structure or series you own.", example: "A numbered series “Startup lessons 1 of 100”.", source: "Kallaway" },
      { term: "Uniqueness axis: Visuals", definition: "Your signature look, set and objects.", example: "Always filmed at the same whiteboard, in the same black hoodie.", source: "Kallaway" },
      {
        term: "Format Pyramid",
        definition:
          "Four levels of content, from the base up: Facts, Explanation, Application, Stories. Higher is harder to make and reaches fewer people, but nobody can copy it. As a niche fills up, a saturation line rises from the bottom.",
        source: "Kallaway (Open Residency podcast, Oct 2026)",
      },
      {
        term: "Saturation line",
        definition:
          "The red line on the pyramid. Below it, AI and copycats make that content for free, so it no longer cuts through. In a crowded niche the line sits above Facts (and often above Explanation). Play above it.",
        source: "Kallaway",
      },
      {
        term: "Pyramid level: Facts",
        definition: "Raw information with no opinion: lists and rankings. The most saturated level; AI does it now. Skip it in a crowded niche.",
        example: "“The 10 best CRM tools.”",
        source: "Kallaway",
      },
      {
        term: "Pyramid level: Explanation",
        definition: "Facts plus your opinion: why or how something works. Breakdowns, tutorials, how-tos.",
        example: "“Why most CRMs fail in small teams.”",
        source: "Kallaway",
      },
      {
        term: "Pyramid level: Application",
        definition: "Showing how to apply it to their situation and get a result: case studies, scenarios, “if I had to…”. Go here in crowded niches so one video proves you know your stuff.",
        example: "“If I had to get a new SaaS to its first 10 customers, here's exactly what I'd do.”",
        source: "Kallaway",
      },
      {
        term: "Pyramid level: Stories",
        definition: "Your own lived problem → action → result. Least saturated, one-of-one, the final moat. Hard to start with from zero.",
        example: "“We lost our biggest client in month 3. Here's what I did the next morning.”",
        source: "Kallaway",
      },
      {
        term: "The 4 ways to stand out",
        definition: "With so much content, only four ways are left to win: Better ideas, More advanced, Better proof, Better storytelling. Pick the ones you lean on.",
        source: "Kallaway",
      },
      {
        term: "Stand out: Better ideas",
        definition:
          "An idea is topic + angle. Choose a topic with a big audience (topic TAM) and a take with a high shock score. Exploit proven winners for about 6 months before you explore new topics.",
        source: "Kallaway",
      },
      {
        term: "Stand out: More advanced",
        definition: "Pitch your content at 4–6 out of 10 in sophistication. You get fewer views, but the viewers are richer, more serious buyers.",
        source: "Kallaway",
      },
      {
        term: "Stand out: Better proof",
        definition: "Proof that only you have (one-of-one). Audit the proof of competitors in your niche: beat it, or move to a sub-lane where nobody has better proof than you.",
        example: "“We took 3 agencies from $0 to $50K MRR” beats “I read 100 sales books”.",
        source: "Kallaway",
      },
      { term: "Stand out: Better storytelling", definition: "Tell it as problem → action → result. Stories carry emotion, and emotion drives purchase.", source: "Kallaway" },
      {
        term: "Niche bullseye (audience bullseye)",
        definition:
          "Up to five rings, from your narrowest niche (ring 1, your ideal customer) outward. The narrower the ring, the faster you own the lane. Expand outward as proof grows.",
        example: "1 SaaS founders stuck at $20K MRR → 2 B2B founders doing their own sales → 3 all early-stage founders → 4 anyone curious about startups → 5 all business content (banned).",
        source: "Kallaway",
      },
      {
        term: "Why the outer ring is banned",
        definition:
          "Ring 5 is the broadest audience. A video can go viral there, but nobody who comes will buy, and it teaches the algorithm the wrong audience. Your next videos then get tested on the wrong people.",
        example: "A plastic surgeon's video about a celebrity's make-up launch may go viral, but no viewer books a facelift.",
        source: "Kallaway",
      },
      {
        term: "Contrarian take vault",
        definition:
          "A list of things you believe that most people in your niche don't. Log a take every time you strongly disagree with someone. Aim for 3–5 big takes, with smaller takes under each. Every take is a hook.",
        example: "“Most founders think they need a sales hire. Actually, the founder should close the first 20 deals.”",
        source: "Kallaway",
      },
      {
        term: "The 3-2-1 plan",
        definition:
          "Kallaway's best content strategy for business owners: 3 topic buckets × 2 videos a week each, plus 1 chaos agent = 7 videos a week. One bucket is broad (bullseye ring 4), two are narrow (rings 2–3).",
        example: "Broad: “How startups actually grow”. Narrow: “Founder-led sales calls” and “Pricing your first SaaS”. Chaos agent: a wild experiment.",
        source: "Kallaway",
      },
      { term: "Broad bucket", definition: "A bigger topic inside your niche (bullseye ring 4). It brings reach.", source: "Kallaway" },
      { term: "Narrow bucket", definition: "A deep topic with buyer intent (rings 2–3). It brings buyers.", source: "Kallaway" },
      {
        term: "Chaos agent",
        definition: "One creative bet a week. It can sit anywhere from your centre ring to ring 4. A random swing that might be the 1% hit.",
        source: "Kallaway",
      },
      {
        term: "Term ownership",
        definition:
          "People remember only a few hundred creators. Owning a term means people think of you when they hear it. Pick niche terms nobody owns yet and repeat them in every video. Big words like “business” cannot be owned.",
        example: "“Founder-led sales” or “revenue engine”, said in every video until people link it to you.",
        source: "Kallaway",
      },
      {
        term: "Signature objects",
        definition: "The same set, look and props in every video, so people recognise you in one second.",
        example: "Kallaway: a hat, a black hoodie, round sunglasses, the same set.",
        source: "Kallaway",
      },
      {
        term: "Hero platform",
        definition: "Pick one video-native platform plus email and commit for 6 months. Reply to every comment. Ask your customers which platform they use.",
        source: "Kallaway",
      },
      {
        term: "Islands, not ecosystems",
        definition:
          "Treat each platform as its own island. Don't cross-promote (for example YouTube links on LinkedIn): links get suppressed and viewers behave differently on each platform. Only move people from rented platforms to owned email.",
        source: "Kallaway",
      },
      {
        term: "Lead magnet",
        definition: "A free resource you give in exchange for an email. It is the off-ramp from rented attention (followers) to an owned list. Pick the topic first, then the closest magnet.",
        source: "Kallaway",
      },
      { term: "Lead magnet type: PDF / doc / template", definition: "Captures exactly what the video explained.", example: "“My cold email template (Google Doc)”.", source: "Kallaway" },
      { term: "Lead magnet type: 3–5 day email course", definition: "A short email series that teaches one thing.", example: "“5-day founder sales blueprint”.", source: "Kallaway" },
      { term: "Lead magnet type: Free community", definition: "A free group. The email is collected on entry.", example: "A free Skool group for SaaS founders.", source: "Kallaway" },
      { term: "Lead magnet type: Waitlist / landing page", definition: "For an offer that is coming soon.", example: "“Join the waitlist for our sales course.”", source: "Kallaway" },
      { term: "Lead magnet type: Form", definition: "“Want our help? Fill this in.” For done-for-you services.", source: "Kallaway" },
      {
        term: "Content formula (format matrix)",
        definition:
          "Formula = topic + format (story structure) + visual layout. 3–4 topics × 1–3 formats × 1–3 layouts gives 5–10 formulas to test in the lab. In the matrix, you either smash a proven cell with a new angle, or claim an empty cell nobody uses.",
        example: "“Cold outbound · personal narrative · green screen.”",
        source: "Kallaway",
      },
      {
        term: "Formula status (Testing / Winner / Retired)",
        definition: "Testing: still being tried. Winner: performs on your KPI. Retired: burned out or failed. Formulas burn out, so retire them and replace them. Retired formulas do not count toward the 5+.",
        source: "Kallaway",
      },
    ],
    testing: [
      "Open /content?tab=playbook. Expected: the top card shows a % ring, the brand picker and seven section pills.",
      "Switch the brand to Company. Expected: all fields change to the Company strategy (empty if new).",
      "Click Continue on Up next. Expected: the page scrolls to that section.",
      "In Positioning, click the card #5 Authority / B2B. Expected: it gets a tick; the KPI becomes Emails per video if it was empty; Save status shows Saved.",
      "Type an authority statement and click away. Expected: “Saved” and the Authority statement chip turns green.",
      "Add three takes in the Contrarian take vault. Expected: on the third, toast “3 contrarian takes. That's a point of view.” and the chip shows 3/3–5 in green.",
      "Add 5 rings to the bullseye. Expected: ring 5 shows red with ✕; you cannot add a sixth.",
      "Click the Facts layer of the pyramid. Expected: an orange warning says Facts sit under the line.",
      "Name the three 3-2-1 buckets. Expected: the 3-2-1 buckets canvas chip turns green and the growth system tile 3-2-1 plan gets a tick.",
      "Add 5 content formulas. Expected: the target chip turns green; mark one Retired and it drops to 4.",
      "In The loop, choose “2–3” in Reps per batch with fewer than 300 reps. Expected: the orange warning appears.",
      "Fill all 15 canvas items. Expected: confetti and toast “Positioning complete”.",
    ],
    tips: [
      "Do Positioning for your personal brand first. The company version is easier once you have done one.",
      "Your contrarian takes are your best hooks. Add one every time you disagree with a post you read.",
      "Start narrow. You can always widen the bullseye later; going narrow after going broad means starting over.",
    ],
  },
  // ───────────────────────────────────────────────────────────────────────
  // 3. Playbook: 3 · Data system, 4 · The 60-day lab
  // ───────────────────────────────────────────────────────────────────────
  {
    id: "content-playbook-data-lab",
    group: "Content",
    title: "Playbook 3–4: data system and the 60-day lab",
    summary:
      "Section 3 builds your data system: a watchlist of creators and a scanner of their outliers, so data picks your topics. Section 4 is the 60-day short-form lab: about 50 short videos in 8 weeks to find what works and get past the quit point.",
    why:
      "Guessing topics wastes reps. Outliers show you which ideas already won with your audience, so your creativity goes into the angle. The lab then forces enough reps, one at a time, to get your first breakout on purpose.",
    when: {
      oneTime: "Week 1: add 10 creators to your watchlist and log your first outliers. Start the lab on a Monday.",
      daily: "During the lab: ship one short (3, then 5, then 7 a week). Check your watchlist for 5×+ outliers (daily or 4–5 times a week).",
      weekly: "Hit the lab's weekly target. Look at the bar for the week.",
      monthly: "Niche scan every 3–4 weeks: new outliers from your watchlist.",
    },
    pages: [
      {
        route: "/content?tab=playbook#pb-data",
        title: "3 · Data system (Week 1)",
        purpose: "Build the watchlist of creators to study, learn the outlier rules and collect validated topics in the topic scanner.",
        elements: [
          { name: "Log an outlier", what: "A button in the section header. It opens the Save inspiration dialog.", how: "Click it when you find a video that beat its creator's average by 5× or more." },
          {
            name: "Why box",
            what: "“Data-enabled creativity: let the data pick your topics, so your creativity goes into the angle.” and “An outlier is a video that beat its creator's own average by 5× or more. It proves the idea, not the person.”",
          },
          { name: "The growth system", what: "The same 8-step spine as in Positioning. Here the Competitor watchlist and Topic scanner tiles are solid; the others are dashed.", how: "Click a tile to jump." },
          {
            name: "DCT cards",
            what: "Three cards: “Data picks the topic” (outliers decide what to talk about), “Creativity picks the angle” (your non-obvious take), “Transpositioning” (borrow a winning format from another niche).",
          },
          {
            name: "Creator watchlist",
            what: "Your creator count out of 20–30, a progress bar, and chips: “N in range” (10K–1M followers), “N over 1M” (orange), “N checked this week”. Below: your first 4 creators with followers and a size tier chip.",
            how: "Click “Add creator” to open the creator dialog. Click “Manage watchlist” to open the full Watchlist tab in Inspiration.",
          },
          {
            name: "Outlier rules",
            what: "Five rules: Outlier score = views ÷ the creator's average (rolling ~3 months before the post). Research at ≥5×; graduate your own formats at 10×+. Engagement ≥ ~2–5% (screens out paid brand deals). Recent window: 7–14 days for news niches, last 3 months (up to 12) for evergreen. Ask of every outlier: “Do I have something non-obvious to say about this?”",
          },
          {
            name: "Where ideas come from, in priority order",
            what: "Three steps: 1 Your own winners (remake them; audit your channel every 2 weeks). 2 10K–1M creators' winners (remake them holding as many LEGO bricks as possible; change topic + angle). 3 A tool (only if you can't find either).",
          },
          {
            name: "Topic scanner: your outliers",
            what: "Chips: “N at ≥5×” and “N broken down”. Up to 6 outlier tiles, each with its score (for example 7.2×), title or hook, the creator and “n/7 bricks”. Empty state: “No 5×+ outliers logged for your personal brand yet.” with a Log an outlier button.",
            how: "Click “Break down & remix in Inspiration” to open the Library, where you fill the bricks and remix.",
          },
        ],
        howTo: [
          "Click Add creator 10 times this week: creators with 10K–1M followers who make the same kind of content for the same people.",
          "Add their followers and average views, so outlier scores work.",
          "Check their latest videos. Log any video at 5× their average with Log an outlier.",
          "For each outlier ask: do I have a non-obvious take? If yes, break it into bricks and remix it.",
        ],
      },
      {
        route: "/content?tab=playbook#pb-lab",
        title: "4 · The 60-day lab (Days 1–60)",
        purpose: "Run an 8-week short-form experiment: 3 videos in week 1, 5 in week 2, then 7 a week for 6 weeks. The app counts your published short videos per week.",
        elements: [
          { name: "Reset", what: "Shown once the lab has started. It clears the lab start date after a confirm. Your published pieces stay.", how: "Click Reset, then confirm." },
          {
            name: "Why box",
            what: "“About 50 short videos in 60 days: 3 in week 1, 5 in week 2, then 7 a week for 6 weeks.” and “The first breakout on a cold account typically comes after 10–30 videos. The lab gets you there on purpose.”",
          },
          {
            name: "Start my lab",
            what: "Shown before the lab starts. “It runs Monday to Sunday for 8 weeks and counts short videos you mark published in the Studio.”",
            how: "Click “This week” (starts this Monday) or “Next Monday · <date>”.",
          },
          { name: "Reps per week (total)", what: "Your lab reps so far out of 50, and “This week” done / target during the lab." },
          {
            name: "Week bars W1–W8",
            what: "Eight bars. The bar height is the week's target (3, 5, 7, 7, 7, 7, 7, 7). The fill is what you published. A bar turns green when the target is hit. The current week has a dark ring. A past week that missed its target is tinted orange. The label above shows done/target.",
          },
          {
            name: "Lab message",
            what: "A coloured line that changes with your progress. For example: “Week 1: 3 reps to ship. One at a time, iterate between each.”, “N reps in: the quit-point zone. This is exactly where most people stop.”, “Week N target hit. Rest, or bank a buffer for next week.” or “Lab complete: N reps. Phase 2: double down on the formulas that pass all 4 tests.”",
          },
          { name: "Started … · ends …", what: "The lab's first Monday and its last day (55 days later)." },
          {
            name: "Every rep: hold 3, change 2",
            what: "Five rows. Locked (hold): Hook structure, Story structure, Visual format. Dashed (change): Topic, Angle. Hint: “Don't invent formats as a beginner. Stack proven bricks.”",
          },
          {
            name: "Lab rules",
            what: "Four rules: Model outliers closely for your first 30–50 videos, like tracing with a stencil. Ship at 80%. Post at the same time daily, for your accountability, not the algorithm. After the lab, keep formulas that perform on your KPI, attract the ideal viewer, you enjoy, and you are proud of.",
          },
        ],
        howTo: [
          "Bank 2–3 scripts before your start Monday.",
          "Click This week or Next Monday.",
          "Each day, make one short: hold hook structure, story structure and visual format from a proven outlier; change only topic and angle.",
          "Publish it in the Studio (format Short video or Story) so the lab counts it.",
          "After each rep, do its post-mortem and fix one weak brick in the next rep.",
        ],
      },
      {
        route: "Creator dialog (Add creator)",
        title: "Add a creator to watch",
        purpose: "Add or edit one creator on your watchlist. The same dialog opens from the Data system and from the Watchlist tab.",
        elements: [
          { name: "Name or @handle", what: "The creator's name or handle.", how: "Type it. Required." },
          { name: "Profile URL", what: "Link to their profile. The platform is detected from the link.", how: "Paste the link." },
          { name: "Platform", what: "LinkedIn, Instagram, TikTok, YouTube, YouTube Shorts, X, Facebook, Newsletter or Blog.", how: "Pick one (or let the URL fill it)." },
          { name: "For", what: "Both brands, Personal or Company.", how: "Pick which brand this creator is useful for." },
          { name: "Followers", what: "Their follower count. As you type, the hint shows their size tier (for example “50–250K: the sweet spot”).", how: "Type 120k, 1.2m or 12,000." },
          { name: "Average views", what: "Their usual views over the last ~3 months. Needed to compute outlier scores.", how: "Type it, for example 25k." },
          { name: "Notes", what: "What they do well: hooks, visual format, series…", how: "Type a line." },
          { name: "Cancel / Add creator / Save", what: "Dialog buttons.", how: "Click Add creator (new) or Save (edit)." },
        ],
      },
    ],
    frameworks: [
      {
        term: "Data-enabled creativity",
        definition: "Use data (outliers) to choose topics, hooks and formats. Save your creativity for the one place data cannot help: your non-obvious angle. It means more hits per rep.",
        source: "Kallaway",
      },
      {
        term: "Outlier",
        definition: "A video that got far more views than its creator usually gets. It proves the idea worked, not the person, because the same creator's normal videos did not do it.",
        source: "Kallaway",
      },
      {
        term: "Outlier score",
        definition: "Views of one video ÷ the creator's average views (a rolling average of about 3 months before the post). It lets you compare creators of any size.",
        example: "A creator who averages 10K views has a video with 75K views: outlier score 7.5×.",
        source: "Kallaway",
      },
      {
        term: "The 5× rule",
        definition: "Only research outliers at 5× or more. Below that, the video may just be a good day. Graduate one of your own formats (call it a winner) at 10× or more.",
        source: "Kallaway",
      },
      {
        term: "Engagement filter",
        definition: "Only trust outliers with engagement of about 2–5% or more ((likes + comments + shares) ÷ views). Paid brand deals often inflate views with low engagement; this filter removes them.",
        source: "Kallaway (5% in one video, 2% in later sources)",
      },
      {
        term: "Recent window",
        definition: "Look at recent outliers only: 7–14 days in news niches; the last 3 months (up to 12) in evergreen niches.",
        source: "Kallaway",
      },
      {
        term: "The non-obvious take test",
        definition: "For every outlier ask: “Do I have something non-obvious to say about this?” No: skip it. Yes: you have a validated video, with the topic proven and your own angle.",
        source: "Kallaway",
      },
      {
        term: "DCT (Data, Creativity, Transpositioning)",
        definition: "Where data and creativity go. D: data picks the topic. C: creativity picks the angle. T: transpositioning, borrowing a winning format from outside your niche.",
        source: "Kallaway",
      },
      { term: "DCT: Data picks the topic", definition: "Outliers tell you what to talk about. You do not guess.", source: "Kallaway" },
      { term: "DCT: Creativity picks the angle", definition: "Your non-obvious take on a validated topic. This is where your thinking goes.", source: "Kallaway" },
      {
        term: "DCT: Transpositioning",
        definition: "If formats in your niche are saturated, borrow one from another niche.",
        example: "A top-down shot from a hat-making creator, used for a founder explaining a whiteboard plan.",
        source: "Kallaway",
      },
      {
        term: "Creator watchlist",
        definition: "The creators you study for outliers. Start with about 10 who win in your space, talk about what you want to talk about, to the people you want. Grow to 20–30.",
        source: "Kallaway",
      },
      {
        term: "Same content type rule",
        definition: "Study creators who make the same type of content as you. Short-form video to learn short-form video. Tweets and blogs only give a topic seed: hooks, structure and format do not transfer.",
        source: "Kallaway",
      },
      {
        term: "Kallaway's paradox (ignore over 1M)",
        definition: "Big creators' results lie: their brand props up their weak videos, so their outliers are small and noisy. Study creators with 10K–1M followers. A breakout from a small creator means the idea itself won.",
        source: "Kallaway",
      },
      { term: "Size tier: Under 10K", definition: "Tiny sample. Breakouts are noisy. Not in range.", source: "Kallaway" },
      { term: "Size tier: Micro (10–50K)", definition: "In range. A breakout here means the idea won.", source: "Kallaway" },
      { term: "Size tier: Small (50–250K)", definition: "In range. The sweet spot.", source: "Kallaway" },
      { term: "Size tier: Medium (250K–1M)", definition: "In range. Still a clean signal.", source: "Kallaway" },
      { term: "Size tier: Over 1M", definition: "Ignore. Brand equity props up their duds. Shown in orange.", source: "Kallaway" },
      { term: "Size tier: Size?", definition: "You did not enter the follower count yet. Add it so the app can place the creator.", source: "bishOS" },
      {
        term: "Watchlist check cadence",
        definition: "Check your watchlist daily, or 4–5 times a week. Log anything at 5× their average or more with more than 2% engagement.",
        source: "Kallaway",
      },
      {
        term: "Idea priority order",
        definition:
          "Where to take ideas from, in order, for your first ~100 reps: 1 your own past winners (remake them), 2 winners of 10K–1M creators in your space (remake them with as many LEGO bricks held as possible), 3 a tool, only if you cannot find either. “Don't reinvent the wheel before you can ride the bike.”",
        source: "Kallaway",
      },
      {
        term: "Topic scanner",
        definition: "The list of your logged outliers at 5×+. Each is a validated topic. Mark the ones you have a non-obvious take on, break them into the 7 LEGO bricks, then remix them.",
        source: "Kallaway",
      },
      {
        term: "Broken down (bricks)",
        definition: "An outlier is broken down when at least one of its 7 LEGO bricks is filled. The scanner shows how many bricks each one has (n/7). The Data section needs 3 broken-down swipes.",
        source: "bishOS",
      },
      {
        term: "Research cadence",
        definition: "Own-channel audit every 2 weeks (your winners first, remake them). Niche scan every 3–4 weeks (outliers from your watchlist, last 3 months, more than 2% engagement).",
        source: "Kallaway",
      },
      {
        term: "The 60-day lab ramp",
        definition: "A short-form test: 3 videos in week 1, 5 in week 2, then 7 a week for 6 weeks. About 50 videos in 8 weeks (the app's target is exactly 50). The ramp makes daily posting feel easy.",
        source: "Kallaway (personal brand 90-day plan)",
      },
      {
        term: "What the lab counts",
        definition: "Pieces of this brand with format Short video or Story, published between the lab's Monday and the Sunday 8 weeks later. Long videos and text posts do not count. The start date always snaps to a Monday.",
        source: "bishOS",
      },
      {
        term: "Beginner hold rule (hold 3, change 2)",
        definition:
          "As a beginner, hold three bricks from a proven outlier exactly: hook structure, story structure and visual format. Change only two: topic and angle. Don't invent formats until you have done the reps.",
        example: "Keep a winner's split-screen layout, its “I tried X so you don't have to” hook and its listicle structure. Use your own topic (hiring) and your own angle.",
        source: "Kallaway",
      },
      {
        term: "Stencil (model outliers closely)",
        definition: "For your first 30–50 videos, copy the structure of outliers closely, like tracing a drawing with a stencil. After about 100 reps, take the stencil off and find your own lane.",
        source: "Kallaway",
      },
      {
        term: "Ship at 80%",
        definition: "While you are learning, reps beat polish. Publish when it is 80% good and learn from the numbers. Polish more only when you believe a video can be a big hit.",
        source: "Kallaway",
      },
      {
        term: "Same posting time",
        definition: "Post at the same time every day. The algorithm does not care; it is for your own accountability.",
        source: "Kallaway",
      },
      {
        term: "Phase 2: the 4 tests",
        definition:
          "After the lab, keep only formulas that pass all four: 1 it performs on your KPI, 2 it attracts your ideal viewer, 3 you enjoy making it, 4 you are proud of how it looks. Double down on those; formulas burn out, so keep testing new ones.",
        source: "Kallaway",
      },
      {
        term: "Quit-point zone (lab)",
        definition: "When your lab total is between 10 and 30 and you still have reps left this week, the lab message warns you: this is exactly where most people stop.",
        source: "Kallaway",
      },
      {
        term: "Buffer",
        definition: "Scripts or finished videos banked ahead of time. Bank 2–3 before the lab starts, and bank more when you hit a week's target early.",
        source: "Kallaway",
      },
    ],
    testing: [
      "Open the Playbook, Data system. Click Add creator, type a name, 120k followers, 25k average views. Expected: the hint shows “50–250K: the sweet spot”; after saving, toast “… added to your watchlist” and the count goes up.",
      "Add a creator with 2m followers. Expected: an orange “1 over 1M” chip.",
      "Click Log an outlier, enter 200k views and 25k creator's usual views, a why line, and save. Expected: toast “8× outlier saved”; the Topic scanner shows the outlier tile with 8×.",
      "Open the Lab section and click This week. Expected: toast “Lab started. Week 1: 3 reps.”; W1 has a dark ring; the message says “Week 1: 3 reps to ship.”",
      "Publish a Short video piece this week. Expected: W1 shows 1/3 and the total 1/50.",
      "Publish a Text post this week. Expected: the lab total does not change.",
      "Click Reset and confirm. Expected: the Start my lab box comes back; your pieces still exist.",
    ],
    tips: [
      "Fill followers and average views for every creator. Without them there is no outlier score.",
      "Small creators' outliers teach you the most. A 7× on a 20K account is a clean signal.",
      "During the lab, make one video at a time. Review it before you make the next one.",
    ],
  },
  // ───────────────────────────────────────────────────────────────────────
  // 4. Playbook: 5 · YouTube long-form (Kallaway rules + Paddy Galloway)
  // ───────────────────────────────────────────────────────────────────────
  {
    id: "content-playbook-youtube",
    group: "Content",
    title: "Playbook 5: YouTube long-form",
    summary:
      "Section 5 is the weekly YouTube track: one long video a week for 50 weeks. It holds Kallaway's YouTube rules and Paddy Galloway's YouTube playbook in four tabs: Ideas, Packaging, Retention and Mindset.",
    why:
      "One long video builds as much trust as about 20 shorts, and it keeps selling for years. YouTube is a click-and-watch platform, so the idea and the packaging (title and thumbnail) decide most of the result. These frameworks tell you where to put your effort.",
    when: {
      weekly: "Publish one long video every week (Monday to Sunday). Do packaging first: 10 titles and thumbnail concepts before scripting.",
      oneTime: "Start the weekly track on a Monday. Read all four Paddy Galloway tabs once.",
      quarterly: "Look at the 50-week grid and your streak. Judge the channel after 18–24 months, not 18 days.",
    },
    pages: [
      {
        route: "/content?tab=playbook#pb-long",
        title: "5 · YouTube long-form (Weekly · 50 weeks)",
        purpose: "Track your weekly long-video streak and learn the rules for ideas, packaging, retention and mindset on YouTube.",
        elements: [
          { name: "Reset", what: "Shown once the track has started. It clears the start date after a confirm. Your videos stay.", how: "Click Reset and confirm." },
          {
            name: "Why box",
            what: "“You're not a YouTuber. You're an entrepreneur using YouTube as a free traffic source: every video is a sales agent working 24/7.” and “One long video ≈ 20 shorts in trust. Plan for 50 weekly videos with zero traction expected, and a 3–5 year horizon.”",
          },
          {
            name: "Start the weekly track",
            what: "Shown before you start: “Counts weeks (Mon–Sun) where you published at least one long video. Never miss a week.”",
            how: "Click This week or Next Monday.",
          },
          { name: "Week streak", what: "Weeks in a row with at least one long video, with a flame when above zero." },
          { name: "Shipped / 50", what: "How many weeks since the start had at least one published long video. Green at 50." },
          { name: "This week shipped?", what: "Yes (green tick), Not yet, or Soon (when the track starts in the future)." },
          { name: "Week N of 50 · started …", what: "Which week of the track you are in." },
          {
            name: "50 weeks grid",
            what: "50 small squares. Green = a week you shipped. Grey = a week that passed without a long video. Light = future weeks. Note: “~10K subscribers at month 12 is typical; the credibility line is around 10K.”",
          },
          {
            name: "The rules (Kallaway)",
            what: "Eight rules: Packaging first. Thumbnail ≤3 elements. Trigger a desire loop. The intro confirms the click in ~5 seconds. First payoff in 30–60 seconds. 1 video a week for 50 weeks. Think in 3–5 years. Don't post YouTube links on other socials; email is fine.",
          },
          {
            name: "YouTube playbook (Paddy Galloway)",
            what: "A panel credited to YouTube strategist Paddy Galloway (Red Bull, MrBeast), from Open Residency, Sep 2026: a long-form layer on top of the Kallaway system.",
            how: "Switch tabs with Ideas / Packaging / Retention / Mindset.",
          },
          { name: "Ideas tab: core line", what: "“Clicks × watch time × satisfaction. The click (packaging) is half the game.”" },
          { name: "Ideas tab: CCN: every video must work for three viewers", what: "Three cards: Core fans (your regulars still love it), Casual viewers (someone who has seen 1–2 of yours gets it instantly), New viewers (a stranger with zero context would click and stay)." },
          {
            name: "Ideas tab: What the biggest videos have in common",
            what: "Four rules: Works for Core, Casual and New. Passes the 1-second glance test. Universal appeal inside your niche. A question you must click to answer (“click to unpause”).",
          },
          {
            name: "Ideas tab: Where ideas come from, in order",
            what: "1 Your own past hits (remake them, the safest bet). 2 Outliers 3–4×+ a channel's average (your niche and adjacent niches). 3 New combinations (~20% of videos, experiments).",
          },
          {
            name: "Ideas tab: The idea funnel: 100 → 10 → 1",
            what: "A funnel drawing: 100 = write ~100 ideas per video; 10 = cut with elimination tests (“Can we package it?” alone removes two-thirds); 1 = one-page idea slide per finalist, pick the one you'd bet your career on.",
          },
          {
            name: "Ideas tab: Elimination tests (cut 100 to 10)",
            what: "Can we package it? · Glance test · CCN fit · 80% rule · Can we make it great?",
          },
          { name: "Ideas tab: The 80% rule", what: "“Topics should share ~80% of your audience, and you stay there 80% of the time. Experiment with only 1 video in 4–5.”" },
          {
            name: "Packaging tab: Packaging workflow, every video",
            what: "Five steps: ≥10 titles first. Thumbnail brief: ~5 concepts. Shoot 10–30 shots per concept. ≥3 clearly different thumbnails in an A/B test. 10–20% of production time on packaging.",
          },
          { name: "Packaging tab: Title rules", what: "Under ~60 characters. Words everyone knows. Complements the thumbnail, never repeats it. Title Case, no ALL CAPS. Written for people, not SEO (search is only 5–10% of views)." },
          {
            name: "Packaging tab: Test a title",
            what: "A test box (example “I Tried Cold Calling For 30 Days”). Live chips appear: the character count (green under 60, orange above), “Avoid ALL CAPS”, “Use Title Case”, “Write for people, not SEO”.",
            how: "Type a title and read the chips. Nothing is saved.",
          },
          { name: "Retention tab: The 45-second intro", what: "Three steps: Deliver on the promise in the first 10 seconds. Create intrigue with minimal context. Flow straight into the video." },
          {
            name: "Retention tab: Storytelling is useless without stakes. Add one:",
            what: "Five chips: A doubter, A time limit, A reward, A punishment, Cost of not paying attention.",
            how: "Hover a chip to read its hint.",
          },
          {
            name: "Retention tab: Phrases that cause drop-offs",
            what: "Orange chips: “at the end of the day”, “without further ado”, “welcome back”, “before we get started”, “make sure to subscribe”. Note: views and the shape of the retention curve are the two metrics he trusts; drop-off moments are the same for core, casual and new viewers.",
          },
          { name: "Mindset tab: The pendulum: focus in this order as you grow", what: "1 Make it watchable. 2 Ideas + packaging. 3 Production quality." },
          {
            name: "Mindset tab: Expectations",
            what: "“Brands: commit 18–24 months before judging a channel. Kallaway: 1 video a week for 50 weeks, think in 3–5 years. Hire a YouTuber, not a videographer.” Plus: judge each video against what you expected (its 1-of-10 rank), not your channel average.",
          },
        ],
        howTo: [
          "Click This week to start the track.",
          "Each week: pick an idea with the 100 → 10 → 1 funnel, write 10+ titles, then thumbnail concepts, then the script.",
          "Use the piece's video workflow (Packaging step) for the title lab and thumbnail brief.",
          "Publish one Long video piece before Sunday. The grid turns green for that week.",
          "Before publishing, predict the video's 1-of-10 rank in the Post-mortem step.",
        ],
      },
    ],
    frameworks: [
      {
        term: "The YouTube track (50 weeks)",
        definition:
          "Publish one long video every week for 50 weeks, with zero traction expected. The app counts each Monday–Sunday week with at least one published Long video piece of this brand. Make one small improvement per video.",
        source: "Kallaway",
      },
      {
        term: "Entrepreneur, not YouTuber",
        definition: "You use YouTube as a free traffic source, like ads you do not pay for. Every video aligned with your offer is a sales agent that works 24/7 for years.",
        source: "Kallaway",
      },
      {
        term: "One long video ≈ 20 shorts in trust",
        definition: "A 25-minute video watched for 8–10 minutes gives about 10 minutes of trust. A short watched for 30 seconds gives half a minute. So about 20 shorts equal one long video.",
        source: "Kallaway (content minutes)",
      },
      {
        term: "10K credibility line",
        definition: "Around 10,000 subscribers, people start to trust a YouTube channel at first sight. About 10K at month 12 is typical when you post weekly.",
        source: "Kallaway",
      },
      {
        term: "Rule: Packaging first",
        definition: "Lock the title before you script, while you are freshest. Most people edit for 20 hours, then make the title tired. Do the most important thing first.",
        source: "Kallaway",
      },
      {
        term: "Rule: Thumbnail ≤3 elements",
        definition: "A thumbnail has at most 3 elements (for example a face, a big number, an arrow). It adds to the title and never repeats it. It must be readable at 1/16 size and in dark mode.",
        source: "Kallaway",
      },
      {
        term: "Desire loop",
        definition: "The title must trigger a want: solve a pain, FOMO about missing the fix, or a benefit they desire. Or an unanswered question for entertainment.",
        example: "“The Cold Email Mistake Costing You Every Reply” (pain + FOMO).",
        source: "Kallaway",
      },
      {
        term: "Thumbnail → title → thumbnail → click",
        definition: "How people decide: the eye locks on the thumbnail, reads the title for keywords, goes back to the thumbnail to confirm, then clicks. Use it to find which part fails.",
        source: "Kallaway",
      },
      {
        term: "Rule: Confirm the click (~5 seconds)",
        definition: "The first ~5 seconds must restate the title's promise, so viewers know they are in the right place.",
        source: "Kallaway",
      },
      {
        term: "Rule: First payoff in 30–60 seconds",
        definition: "Give the first real value (a dopamine hit) within 30–60 seconds. If your best part is late, move it earlier in the edit.",
        source: "Kallaway",
      },
      {
        term: "Clickbait yes, bait-and-switch never",
        definition: "A strong, curious title is good. Promising something the video does not deliver is not. Bait, then give.",
        source: "Kallaway",
      },
      {
        term: "Rule: No YouTube links on other socials",
        definition: "Posting your YouTube link on LinkedIn or X hurts click-through and watch time (those viewers leave fast). Email is fine because email readers are slower and committed.",
        source: "Kallaway",
      },
      { term: "Rule: Think in 3–5 years", definition: "Do not start YouTube unless you expect to put 3–5 years in. A couple of thousand on-target views is already huge for a business.", source: "Kallaway" },
      {
        term: "YouTube core (clicks × watch time × satisfaction)",
        definition: "YouTube promotes videos that people click, watch long and feel good about. The click, which depends on packaging, is about half of the game.",
        source: "Paddy Galloway",
      },
      {
        term: "CCN (Core, Casual, New)",
        definition: "Every video must work for three kinds of viewers at once: core fans, casual viewers and new viewers. Over-serving fans or chasing strangers both fail. “All roads lead to CCN.”",
        example: "Do not say “as I said last week”. Give new viewers the context inside the action instead.",
        source: "Paddy Galloway",
      },
      { term: "CCN: Core fans", definition: "Your regulars who watch everything. The video must still delight them.", source: "Paddy Galloway" },
      { term: "CCN: Casual viewers", definition: "People who watch 1 in 3 or 1 in 4 of your videos. They must get it instantly. They can become core fans.", source: "Paddy Galloway" },
      { term: "CCN: New viewers", definition: "Everyone in your audience who has never seen you. A stranger with zero context must click and stay.", source: "Paddy Galloway" },
      {
        term: "Glance test",
        definition: "Can the whole idea be understood in one second, in one line? Viewers give each video about 1 second on a feed. If you need a paragraph to explain it, the idea is not good yet.",
        example: "“I Tried Cold Calling For 30 Days” passes. “My thoughts on outbound strategy in 2026” fails.",
        source: "Paddy Galloway",
      },
      {
        term: "Universal appeal",
        definition: "A big idea that interests both the biggest creator in the world and your mother, while staying inside your niche.",
        source: "Paddy Galloway",
      },
      {
        term: "Click to unpause",
        definition: "Pose a question the viewer must click to answer, like a paused moment just before the action. If someone was about to do something important, would this make them watch first?",
        source: "Paddy Galloway",
      },
      {
        term: "Idea sources (in order)",
        definition: "1 Your own past hits: remake them (the safest bet). 2 Outliers at 3–4× or more a channel's average, in your niche and adjacent niches. 3 New combinations of two existing things: about 20% of videos.",
        source: "Paddy Galloway",
      },
      {
        term: "Outlier on YouTube (3–4×) vs short-form (5×)",
        definition: "Paddy counts a YouTube video as an outlier at 3–4× the channel's average. Kallaway uses 5× for short-form research. The idea is the same: a video that beat its own channel.",
        source: "Paddy Galloway / Kallaway",
      },
      {
        term: "100 → 10 → 1",
        definition: "Write about 100 ideas per video. Cut them to about 10 with elimination tests. Make a one-page idea slide for each finalist and pick the one you would bet your career on.",
        source: "Paddy Galloway",
      },
      {
        term: "Idea slide",
        definition: "One page per finalist idea: a rough thumbnail sketch, 2–3 titles, a skeleton outline and a one-line logline.",
        source: "Paddy Galloway",
      },
      {
        term: "Elimination tests",
        definition: "Yes/no gates that cut 100 ideas to about 10. If 30 survive, your tests are too soft; if 1–2 survive, too strict.",
        source: "Paddy Galloway",
      },
      { term: "Elimination test: Can we package it?", definition: "Can you see a title and thumbnail you would click? This one test alone removes about two-thirds of ideas.", source: "Paddy Galloway" },
      { term: "Elimination test: Glance test", definition: "Understood in one second.", source: "Paddy Galloway" },
      { term: "Elimination test: CCN fit", definition: "Core, casual and new viewers all care.", source: "Paddy Galloway" },
      { term: "Elimination test: 80% rule", definition: "The idea shares about 80% of your audience. Only 1 in 4–5 videos may be an experiment outside that.", source: "Paddy Galloway" },
      { term: "Elimination test: Can we make it great?", definition: "Execution is realistic with your time, money and skills.", source: "Paddy Galloway" },
      {
        term: "The 80% rule",
        definition: "Your topics should share about 80% of the same audience, and you stay in that zone 80% of the time. The other 20% (1 video in 4–5) is for experiments. Test: can 80% of people who watch this video also watch that one?",
        source: "Paddy Galloway",
      },
      {
        term: "Packaging flow",
        definition: "The packaging workflow for every video: ≥10 titles first; a thumbnail brief of ~5 concepts; a shoot of 10–30 shots per concept; ≥3 clearly different thumbnails in YouTube's A/B test; 10–20% of production time on packaging.",
        source: "Paddy Galloway",
      },
      { term: "Packaging step: ≥10 titles first", definition: "Write at least 10 titles before anything else. The thumbnail must complement the title, so the title comes first.", source: "Paddy Galloway" },
      { term: "Packaging step: Thumbnail brief", definition: "About 5 thumbnail concepts written before the shoot. Concepts, not designs: sketches, stick figures or AI references are fine.", source: "Paddy Galloway" },
      { term: "Packaging step: Shoot 10–30 shots per concept", definition: "Many photos per concept: angles, faces, emotions, lighting. You choose later.", source: "Paddy Galloway" },
      {
        term: "Packaging step: ≥3 thumbnails in an A/B test",
        definition: "Design at least 3 clearly different thumbnails (a new shirt colour does not count) and load them in YouTube's native Test & Compare.",
        source: "Paddy Galloway",
      },
      {
        term: "Packaging step: 10–20% of production time",
        definition: "Packaging drives about half the result but should take 10–20% of the total time. One thumbnail swap took a video from 1K to 40K views a day.",
        source: "Paddy Galloway",
      },
      {
        term: "Title rules",
        definition: "Under ~60 characters. Words everyone knows (no jargon unless your niche needs it). Complement the thumbnail, never repeat it. Title Case, no ALL CAPS (harder to read). Written for people, not SEO: search is only 5–10% of views.",
        source: "Paddy Galloway",
      },
      {
        term: "Title tester (live title check)",
        definition: "The app checks a title as you type: over 60 characters (warning), words in ALL CAPS longer than 3 letters (tip), more than one word that should be capitalised (Title Case tip), and SEO words like “SEO” or “keyword” (tip). It is a guide; a great long title can still win.",
        source: "bishOS, based on Paddy Galloway",
      },
      {
        term: "The 45-second intro",
        definition: "An intro under about 45 seconds in three moves: deliver on the promise in the first 10 seconds, create intrigue with minimal context, and flow straight into the video. Miss the promise and 60–70% of viewers can leave in 10 seconds.",
        source: "Paddy Galloway",
      },
      { term: "Intro: Deliver on the promise (10 seconds)", definition: "Reaffirm the title and thumbnail, ideally visually: “You made the right choice. Look at this.”", source: "Paddy Galloway" },
      { term: "Intro: Create intrigue with minimal context", definition: "Give only the context they need and drip-feed the rest. Open small curiosity gaps.", example: "“This is an FBI agent. He has 24 hours to catch me. Go.”", source: "Paddy Galloway" },
      { term: "Intro: Flow straight into the video", definition: "No “welcome back”, no throat-clearing. “The best intro doesn't feel like an intro.”", source: "Paddy Galloway" },
      {
        term: "Stakes",
        definition: "“Storytelling is useless without stakes.” A stake makes leaving feel like a loss. Stack more than one. The stake must fit the video; for teaching videos, use the cost of not knowing.",
        source: "Paddy Galloway",
      },
      { term: "Stake: A doubter", definition: "Someone says it cannot be done.", example: "“My co-founder said cold calling is dead. I gave it 30 days.”", source: "Paddy Galloway" },
      { term: "Stake: A time limit", definition: "A ticking clock.", example: "“48 hours to fix our churn before the board meeting.”", source: "Paddy Galloway" },
      { term: "Stake: A reward", definition: "What is won if it works.", example: "“If this works, we hit $10K MRR.”", source: "Paddy Galloway" },
      { term: "Stake: A punishment", definition: "What is lost if it fails.", example: "“If this fails, we shut down the product.”", source: "Paddy Galloway" },
      { term: "Stake: Cost of not paying attention", definition: "What the viewer misses by leaving.", example: "“This one pricing mistake costs most SaaS founders $50K a year.”", source: "Paddy Galloway" },
      {
        term: "Drop-off phrases",
        definition: "Words that make viewers leave because they signal an ending or filler: “at the end of the day”, “without further ado”, “welcome back”, “before we get started”, “make sure to subscribe”. The script check in workflow step 5 flags them.",
        source: "Paddy Galloway",
      },
      {
        term: "The two metrics Paddy trusts",
        definition: "Views (they include the click, the watch and the satisfaction) and the shape of the retention curve (where people drop off). CTR and average view duration can mislead.",
        source: "Paddy Galloway",
      },
      {
        term: "The pendulum",
        definition: "What to focus on, in order, as you grow: 1 make it watchable, 2 ideas + packaging, 3 production quality. Most brands wrongly obsess over “how can I make it look better?”",
        source: "Paddy Galloway",
      },
      { term: "Pendulum 1: Make it watchable", definition: "Clear audio, a clear story, no drop-off traps. Just good enough to watch.", source: "Paddy Galloway" },
      { term: "Pendulum 2: Ideas + packaging", definition: "Where the views actually come from. Master this before buying cameras.", source: "Paddy Galloway" },
      { term: "Pendulum 3: Production quality", definition: "4K, more angles, better sets. Only after steps 1 and 2 work.", source: "Paddy Galloway" },
      {
        term: "YouTube expectations",
        definition: "Brands should commit 18–24 months before judging a channel. Kallaway says 1 video a week for 50 weeks and a 3–5 year view. With a budget, hire a YouTuber (someone who grew a channel), not a classic videographer.",
        source: "Paddy Galloway / Kallaway",
      },
      {
        term: "1-of-10 prediction",
        definition: "Before you publish, predict where the video will rank by views among your last 10 uploads, for hour 1, day 1 and week 1. Then judge it against your prediction, not your channel average.",
        example: "You expect a 2/10. It lands 6/10 on day 1: under expectation, so change the thumbnail.",
        source: "Paddy Galloway",
      },
      {
        term: "Good data vs no data vs bad data",
        definition: "Good data is better than no data: do not touch a video that beats expectation. No data is better than bad data: if it clearly underperforms, change the thumbnail (then the title) now; do not “give it more time”. Never make 10 title changes on day 1.",
        source: "Paddy Galloway",
      },
    ],
    testing: [
      "Open the Playbook, YouTube long-form. Click This week. Expected: toast “Weekly YouTube track started. One video a week, 50 weeks.” and the metrics appear.",
      "Publish a piece with format Long video. Expected: This week shipped? shows Yes, Shipped / 50 shows 1 and the first square turns green.",
      "Open the Paddy Galloway panel and switch through Ideas, Packaging, Retention and Mindset. Expected: each tab shows its content.",
      "On Packaging, type “HOW I GOT 100 CUSTOMERS WITH COLD EMAIL AND LINKEDIN IN 2026 SEO” in Test a title. Expected: an orange character warning and tips for ALL CAPS and SEO.",
      "Type “I Tried Cold Calling For 30 Days”. Expected: a green chip with the character count only.",
      "Click Reset and confirm. Expected: the Start the weekly track box returns.",
    ],
    tips: [
      "Write titles on a Monday when you are fresh. Script on Tuesday. The packaging-first rule is the biggest single lever.",
      "Never skip a week, even with a smaller video. The streak and the reps matter more than one perfect video.",
      "Use the 80% rule: keep 4 of 5 videos inside your proven topics, and let 1 be an experiment.",
    ],
  },
  // ───────────────────────────────────────────────────────────────────────
  // 5. Playbook: 6 · Iterate, 7 · Convert
  // ───────────────────────────────────────────────────────────────────────
  {
    id: "content-playbook-iterate-convert",
    group: "Content",
    title: "Playbook 6–7: iterate and convert",
    summary:
      "Section 6 (Iterate) scores your last reps like a business and shows what to fix next. Section 7 (Convert) explains how attention becomes money: the four funnel switches, the trust ladder, the aligned funnel and content minutes.",
    why:
      "Views are not money. Iterate tells you which brick to fix so each rep is better than the last. Convert makes sure every video has a ramp from rented followers to your owned email list, and then to an offer.",
    when: {
      daily: "After every published rep: log numbers and do its post-mortem (weak brick + next fix).",
      weekly: "Read Your last reps in Iterate. Check the Research cadence reminders.",
      monthly: "Check that every video has one aligned CTA ramp and that leads are logged.",
    },
    pages: [
      {
        route: "/content?tab=playbook#pb-iterate",
        title: "6 · Iterate (After every rep)",
        purpose: "See your last 10 reps with their business numbers, the advice for each, and the order in which to diagnose a flop.",
        elements: [
          {
            name: "Why box",
            what: "“The sauce is the distance between reps. After every rep, name the weak brick and fix 1–2 things next time.” and “Data is a lagging indicator. The leading indicator is following the principles while you make the video.”",
          },
          {
            name: "Score it like a business",
            what: "Three tiles: #1 Emails / video, #2 Followers / video, #3 Views / video. Each is the average over your last reps that have numbers. Your chosen KPI tile has a dark outline. Hint: “Emails per video > followers per video > views.”",
          },
          {
            name: "Your last reps",
            what: "Your last 10 published pieces. Each row: the title (link), format, relative date, and “rank of N” (1-of-10 rank among your last 10 in the same format family). Then emails, follows and views, or “Log numbers →”. Then chips: “72% at 3s” (shorts, coloured by the hold rule), “Study it” / “Mid pack” / “Repackage” (long videos, by rank), “Weak: <brick>”, “Next fix: …”, or “Add post-mortem →”. An advice line explains the chip.",
            how: "Click a title or a “→” link to open the piece and log numbers or write the post-mortem. Empty state: “Publish a rep and log its numbers.” with “Open the board”.",
          },
          {
            name: "Diagnose a flop, in this order, every time",
            what: "Three steps: 1 Was the topic validated? 2 Was the angle non-obvious? 3 Did the hook land? Hint: “Topic first, then angle, then hook. Hook rate and skip rate are icing, not cake.” Under step 3: green chips Transformation, Impossibility, Addiction, A new thing exists; orange chips ✕ Opening with “If you…”, ✕ Fear framing, ✕ Multi-sentence hooks before the point.",
          },
          {
            name: "Research cadence",
            what: "Two reminders: Own-channel audit (every 2 weeks: your winners first, remake them) with Open → Analytics. Niche scan (every 3–4 weeks: outliers from your watchlist, last 3 months, >2% engagement) with “last watchlist check: …” and Open → Watchlist.",
            how: "Click Open.",
          },
          {
            name: "Read the signals right",
            what: "Five rules: No breakout after 3 batches of 10? It's almost always substance or hooks. A smooth retention decline is normal; abnormal drops mean confusion or visuals that don't match the words. Shorts: ≥70% still watching at 3s is a banger; under 50% is a hook problem. YouTube: rank each video among your last 10; bottom 4 means your only live lever is title + thumbnail. Data confirms; it lags. Get a peer one level above you to review your inputs.",
          },
        ],
        howTo: [
          "After each rep, open it from Your last reps and log its numbers.",
          "Read the advice chip (3s hold or rank).",
          "If it flopped, walk the 3 diagnosis steps in order and mark the first one that fails as the weak brick.",
          "Write the next fix. The next rep carries it.",
        ],
      },
      {
        route: "/content?tab=playbook#pb-convert",
        title: "7 · Convert (Always on)",
        purpose: "Make sure attention turns into emails and sales: four multiplied switches, an owned stack, an aligned funnel, the trust ladder and content minutes.",
        elements: [
          {
            name: "Why box",
            what: "“Views aren't money. Value is captured at the offer, so every video needs a ramp from rented attention to an owned email list.” and “Followers are rented; emails are owned. Ramp people from rented to owned as fast as you can.”",
          },
          {
            name: "The attention conversion funnel",
            what: "Four cards joined by × signs: Bullseye signal, Trust, Clear ramp, Aligned offer. Hint: “Four switches, multiplied. Any one at zero makes the whole thing zero.”",
          },
          {
            name: "Your owned stack",
            what: "Short form (the cash cow: broad, eager viewers, the most sign-ups) and Long form (the GOAT: ~10 ideas and ~10 minutes of trust per video) both point to Email (owned): “Each feeds email on its own. Don't cross-promote short ↔ long.” It shows emails logged from your last reps. Footer: “Solo? Start with short form. With a team? Long form.”",
          },
          {
            name: "The aligned funnel",
            what: "Six steps: 1 Content (aggravate one pain in the video), 2 Lead magnet (your magnet's name and type, green when set; else “The band-aid for that exact pain”), 3 Keyword DM / page (“Comment STORY” → collect the email), 4 Email + nurture, 5 Low-ticket (same problem, deeper solve), 6 High-ticket (same problem, done-with-you). Hint: the problem never changes from the first video to the high-ticket offer.",
          },
          {
            name: "Aligned funnel rules",
            what: "Three rules: One lead magnet per video, tightly aligned to that video's pain. Less is more: promise one click to the answer; name it like copy. Native embeds, not ad breaks.",
          },
          { name: "CTA ramp chips", what: "Lead magnet (email), Sales page, Call / DM, Follow / series, None this time, then “· one ramp per video”.", how: "Hover a chip to read its hint." },
          {
            name: "The trust ladder",
            what: "Eight rungs, rung 1 the strongest: 1 Warm endorsement, 2 Proof of audience, 3 Demonstration, 4 Group testimonials, 5 Personal results, 6 Borrowed proof, 7 Cold testimonial, 8 Third-party stat. Hint: stack 2+ rungs in every video; higher pain needs less trust. Note: “No proof yet? Demonstrate ability: ~2 non-obvious light-bulb moments per video, video after video.”",
          },
          {
            name: "Content minutes",
            what: "Three tiles: “4–5 min earns a follow”, “~90 min makes a superfan”, “1 = 20: one long-form ≈ 20 shorts in trust”. Rules: bingeability with numbered series; profile-grid covers; stack a buffer before promising a daily series.",
          },
        ],
        howTo: [
          "Make sure your lead magnet is named and typed (Positioning).",
          "Set a business KPI: Emails per video, $ per view or Conversions per view.",
          "In every piece, pick one CTA ramp in workflow step 6 and stack 2+ trust rungs.",
          "Log leads in each piece's numbers so this section can see them.",
        ],
      },
    ],
    frameworks: [
      {
        term: "Score it like a business (KPI ranking)",
        definition: "For business games, rank results in this order: emails per video, then followers per video, then views. Views alone do not pay.",
        source: "Kallaway",
      },
      {
        term: "Iterate diagnostics",
        definition: "For each recent rep the app gives one chip and one line of advice: shorts get the 3-second hold rule; long videos get the 1-of-10 rank rule. Plus the weak bricks and next fix from the post-mortem.",
        source: "Kallaway / Paddy Galloway, bishOS",
      },
      {
        term: "3s hold benchmark",
        definition: "The share of viewers still watching a short at 3 seconds. ≥70%: banger hook (green). 50–69%: OK, aim for 70%+ (blue). Under 50%: hook problem; check the visual stop, the context and the contrast (orange).",
        source: "Kallaway",
      },
      {
        term: "The 1-of-10 rank rule",
        definition:
          "Rank a long video by views among your last 10 (the app needs at least 3). 1–3: “Study it”, let it run and study what you did. 4–6: “Mid pack”, usually a smaller idea audience, don't beat yourself up. 7–10: “Repackage”, your only live lever is the title and thumbnail.",
        source: "Kallaway (with Paddy Galloway's 1of10 idea)",
      },
      {
        term: "Flop diagnosis order",
        definition: "When a piece flops, check in this order every time: 1 Was the topic validated by an outlier? 2 Was the angle non-obvious (shock score high enough)? 3 Did the hook land (3s hold ≥70% for shorts; CTR and first 30 seconds for YouTube)? The first “no” is your weak brick.",
        source: "Kallaway",
      },
      {
        term: "Icing, not cake",
        definition: "Hook rate, skip rate and small retention blips are icing. If a video flopped, its hook rate will be low anyway. The cake is the topic, the angle and the hook.",
        source: "Kallaway",
      },
      {
        term: "Hooks that work",
        definition: "Four patterns that win in Kallaway's own hook data: Transformation, Impossibility, Addiction, A new thing exists.",
        source: "Kallaway (analysis of his top hooks, Oct 2026)",
      },
      { term: "Hook that works: Transformation", definition: "Before → after: take one thing and turn it into another.", example: "“Here's how to turn a blank page into a sales machine.”", source: "Kallaway" },
      { term: "Hook that works: Impossibility", definition: "Something that sounds impossible.", example: "“Here's how to make your demo so clear it's impossible to say no.”", source: "Kallaway" },
      { term: "Hook that works: Addiction", definition: "Something people cannot stop doing.", example: "“Here's how to get your users addicted to your onboarding.”", source: "Kallaway" },
      { term: "Hook that works: A new thing exists", definition: "Shock that a new thing exists: “This just came out…”.", example: "“OpenAI just released a free tool that writes your sales follow-ups.”", source: "Kallaway" },
      {
        term: "Hooks that fail",
        definition: "Three patterns that lose: opening with “If you…” (conditional openers never win in his data), fear framing (“this will never work for you if…”, lean to optimism instead), and multi-sentence hooks before the point.",
        source: "Kallaway",
      },
      {
        term: "Signals rule: 3 batches of 10",
        definition: "If you shipped 3 batches of 10 and nothing broke out, the cause is almost always the substance (your ideas and angles) or your hooks.",
        source: "Kallaway",
      },
      {
        term: "Smooth decline vs abnormal drops",
        definition: "A retention curve that slowly goes down is normal. A sudden drop means confusion, or visuals that do not match the words at that moment. Fix that moment.",
        source: "Kallaway",
      },
      {
        term: "Data is a lagging indicator",
        definition: "Numbers only confirm, later. The leading indicator is following the principles while you make the video. Get a peer one level above you to review your inputs.",
        source: "Kallaway",
      },
      { term: "Own-channel audit", definition: "Every 2 weeks, look at your own pieces: which topics, hooks and formats won? Remake your winners first.", source: "Kallaway" },
      { term: "Niche scan", definition: "Every 3–4 weeks, scan your watchlist for new outliers (last 3 months, more than 2% engagement).", source: "Kallaway" },
      {
        term: "The attention conversion funnel (4 funnel switches)",
        definition: "Four switches that multiply: Bullseye signal × Trust × Clear ramp × Aligned offer. Any switch at zero makes sales zero, no matter how many views you get.",
        source: "Kallaway",
      },
      {
        term: "Funnel switch: Bullseye signal",
        definition: "Lines 1–2 of the video make it unmistakably a solution to THEIR pain. Viewers sort content into “solution”, “entertainment” or “irrelevant”; only the solution bucket buys.",
        example: "“If you're a founder still doing every sales call yourself, this is for you.”",
        source: "Kallaway",
      },
      { term: "Funnel switch: Trust", definition: "Stack 2 or more rungs of the trust ladder in the video.", source: "Kallaway" },
      { term: "Funnel switch: Clear ramp", definition: "One off-ramp per video, tightly aligned with the topic. Like an exit to New York after an hour of talking about New York.", source: "Kallaway" },
      {
        term: "Funnel switch: Aligned offer",
        definition: "An offer priced below the flip point, that gives the buyer about 10× return within 30 days.",
        source: "Kallaway",
      },
      {
        term: "Flip point",
        definition: "The price where the buyer's risk becomes bigger than the reward they expect. Price below it, or above it with a guarantee.",
        source: "Kallaway",
      },
      { term: "10× rule", definition: "The buyer should get about 10 times what they paid within 30 days. That makes the decision easy.", source: "Kallaway" },
      {
        term: "Owned stack (rented → owned)",
        definition: "Followers on platforms are rented: the platform can cut your reach. Emails are owned. Short form (the cash cow) and long form (the GOAT) each feed email on their own. Then: content → lead magnet (keyword DM) → page → low-ticket → high-ticket, on the same problem. Solo: start short form. With a team: long form.",
        source: "Kallaway",
      },
      { term: "Short form: the cash cow", definition: "Broad, eager viewers. It brings the most email sign-ups, because a short cannot deliver all the value inside the video.", source: "Kallaway" },
      { term: "Long form: the GOAT", definition: "“Greatest of all time.” About 10 ideas and 10 minutes of trust per video. Best for deep trust and high-ticket buyers.", source: "Kallaway" },
      {
        term: "The aligned funnel",
        definition: "Six steps on the SAME problem: content → lead magnet → keyword DM or page → email + nurture → low-ticket → high-ticket. The problem never changes along the way. “That's what the real pros are doing.”",
        example: "Video: “Your cold emails get no replies.” → free “5 cold email templates” → $49 cold email course → done-with-you outbound program.",
        source: "Kallaway",
      },
      { term: "Aligned funnel step: Content", definition: "Aggravate one pain in the video: “cut them, give them the band-aid.”", source: "Kallaway" },
      { term: "Aligned funnel step: Lead magnet", definition: "The band-aid for that exact pain, free, in exchange for an email.", source: "Kallaway" },
      {
        term: "Aligned funnel step: Keyword DM / page",
        definition: "“Comment STORY and I'll send it.” A tool like ManyChat replies with the link and collects the email. Or a simple landing page.",
        source: "Kallaway",
      },
      {
        term: "Aligned funnel step: Email + nurture",
        definition: "Keep sending value. An email is not ownership yet: you earn trust over time, or wait until they have the problem.",
        source: "Kallaway",
      },
      { term: "Aligned funnel step: Low-ticket", definition: "A cheap product: the same problem, a deeper solve.", source: "Kallaway" },
      { term: "Aligned funnel step: High-ticket", definition: "An expensive program: the same problem, done-with-you (or done-for-you).", source: "Kallaway" },
      {
        term: "Lead magnet rules",
        definition: "One lead magnet per video, aligned to that video's pain (“give me your email” gets nothing). Less is more: promise one click to the answer, not a 10-page PDF. Name it with power words, like copywriting.",
        source: "Kallaway",
      },
      {
        term: "Native embeds",
        definition: "Weave your offer or lead magnet into the content as the answer to the current topic, early and often. Not an ad break: cutaways and “we'll be right back” break the spell and viewers leave.",
        example: "“If you want the exact template I use for this, it's free below.”",
        source: "Kallaway",
      },
      {
        term: "Trust Ladder",
        definition: "Eight kinds of proof, from strongest (rung 1) to weakest (rung 8). Stack 2+ rungs in every video. The more painful the problem, the less trust you need.",
        source: "Kallaway",
      },
      { term: "Rung 1: Warm endorsement", definition: "Someone they already know and respect vouches for you.", example: "A well-known founder in your niche says “talk to Bish”.", source: "Kallaway" },
      { term: "Rung 2: Proof of audience", definition: "A real, big following.", example: "“To my 50K LinkedIn followers…”", source: "Kallaway" },
      { term: "Rung 3: Demonstration", definition: "You show your ability inside the video itself.", example: "You rewrite a viewer's cold email live and explain each change.", source: "Kallaway" },
      { term: "Rung 4: Group testimonials", definition: "Named clients and their results.", example: "“Acme, Beta and Gamma each doubled demo bookings with this.”", source: "Kallaway" },
      { term: "Rung 5: Personal results", definition: "Your own numbers or screenshots.", example: "A screenshot of your startup's MRR chart.", source: "Kallaway" },
      { term: "Rung 6: Borrowed proof", definition: "A famous person's framework you use.", example: "“This is Hormozi's value equation, applied to SaaS pricing.”", source: "Kallaway" },
      { term: "Rung 7: Cold testimonial", definition: "One stranger's review.", source: "Kallaway" },
      { term: "Rung 8: Third-party stat", definition: "A study or a statistic.", example: "“A HubSpot study found…”", source: "Kallaway" },
      {
        term: "Demonstration of ability (light-bulb moments)",
        definition: "No proof yet? Give about 2 non-obvious insights per video (“oh wow, I never thought of that”), video after video. Enough of them can equal the trust that proof gives. Copied ideas add zero trust.",
        source: "Kallaway",
      },
      {
        term: "CTA ramps",
        definition: "The five kinds of off-ramp. Use exactly one per video: Lead magnet (email), Sales page, Call / DM, Follow / series, None this time.",
        source: "Kallaway",
      },
      { term: "CTA ramp: Lead magnet (email)", definition: "His favourite: a free resource aligned with the topic, in exchange for an email.", example: "“Comment PLAYBOOK and I'll DM you the free template.”", source: "Kallaway" },
      { term: "CTA ramp: Sales page", definition: "Send them to buy. For a low-ticket offer or when trust is already high.", example: "“The full system is linked in my bio.”", source: "Kallaway" },
      { term: "CTA ramp: Call / DM", definition: "For high-ticket offers: “comment X / DM me”.", example: "“DM me AUDIT if you want us to do this for you.”", source: "Kallaway" },
      { term: "CTA ramp: Follow / series", definition: "Bingeability: “part 2 next”. Builds content minutes.", example: "“Follow for part 2 tomorrow.”", source: "Kallaway" },
      { term: "CTA ramp: None this time", definition: "A pure trust-building rep with no ask.", source: "Kallaway" },
      {
        term: "Content Minutes",
        definition:
          "People must watch a certain number of minutes of your content before they act. One minute watched = one block. About 4–5 minutes earns a follow; about 90 minutes turns a stranger into a superfan; bigger purchases need more minutes. Only minutes watched by people who trust you and have the problem count.",
        example: "A $97 product may need about 8–12 minutes. If a new viewer binges 8 of your shorts in one session, they may buy that day.",
        source: "Kallaway (“the most important framework in all of content”)",
      },
      {
        term: "Bingeability",
        definition: "Make people watch several pieces in one session, so content minutes stack fast. Numbered series (“Day 4 of 30”) make people go back for 1–3.",
        source: "Kallaway",
      },
      {
        term: "Profile-grid covers",
        definition: "Covers on your profile grid tell a visitor what each video is and what to click next. Most shares happen in DMs, where only the cover shows.",
        source: "Kallaway",
      },
    ],
    testing: [
      "Publish a short and log 7d numbers with Views 2,000, Follows 20, Leads 3 and 3s hold % 75. Open the Playbook, Iterate. Expected: the rep shows 3 emails, 20 follows, 2k views and a green “75% at 3s” chip.",
      "Log a short with 3s hold % 40. Expected: an orange chip and the line “Hook problem — under 50% at 3s…”.",
      "Without a post-mortem, the row shows “Add post-mortem →”. Mark a weak brick in that piece's Post-mortem step. Expected: the row shows “Weak: <brick>” and the Iterate summary counts it as reviewed.",
      "Click Open next to Own-channel audit. Expected: the Analytics tab opens.",
      "In Convert, with a lead magnet named in Positioning, check step 2 of The aligned funnel. Expected: it shows your magnet's name and type with a green tint.",
      "Set the KPI to Emails per video and log a rep with leads. Expected: Convert shows 3/3 funnel basics and completes.",
    ],
    tips: [
      "Always log Leads in the numbers. Without them, Convert and Score it like a business cannot see what pays.",
      "Diagnose topic first. Most founders blame the hook when the real problem was an unvalidated topic.",
      "One video, one problem, one magnet. Narrow lead magnets beat one big “everything” PDF.",
    ],
  },
  // ───────────────────────────────────────────────────────────────────────
  // 6. Piece editor (/content/[id])
  // ───────────────────────────────────────────────────────────────────────
  {
    id: "content-piece-editor",
    group: "Content",
    title: "Piece editor",
    summary:
      "Every piece opens in its own editor. The main column has the 8-step Video workflow, the Hook, the Brief and the Script. The sidebar has the details, the publish checklist, performance numbers, the lesson, the repurpose tree, linked inspiration and the source note.",
    why:
      "One page holds everything about a piece, from the first hook to the 30-day numbers. Everything saves by itself, the checklist protects quality, and the numbers and lesson make the next piece better.",
    when: {
      daily: "Open the piece you are working on. Write the hook, brief and script. Publish through the checklist. Log numbers when due.",
      weekly: "Open last week's hub and repurpose it into 5–10 children.",
    },
    pages: [
      {
        route: "/content/[id]",
        title: "Piece editor: header and main column",
        purpose: "Edit the title, change the stage, publish, repurpose, and write the hook, brief, script and call to action.",
        elements: [
          { name: "Title (input)", what: "The working title at the top. Placeholder: “Working title”.", how: "Click and type. It saves when you pause or click away." },
          { name: "← Content Studio", what: "Back link to the Studio.", how: "Click." },
          { name: "Brand, format, Hub and pillar badges", what: "Small badges under the title: the brand, the format, a Hub badge (if hub) and the pillar with its colour." },
          { name: "Save status", what: "“Saving…”, “Saved”, or “Couldn't save. Retrying on next edit.” (orange). Every text field autosaves." },
          { name: "Stage chip", what: "The current stage with six progress dots." },
          {
            name: "Stage (select)",
            what: "All 14 stages. For text formats, Ready to record, Recorded and Editing are greyed out.",
            how: "Pick a stage. A publish stage opens the Publish checklist dialog if items are open.",
          },
          { name: "Next-stage button (for example “Script →”)", what: "Moves one stage forward. Hidden when the next stage would publish (use Publish instead).", how: "Click." },
          { name: "Publish", what: "Shown until the piece is published. Moves it to Published through the checklist gate.", how: "Click. Finish the checklist or choose Publish anyway." },
          { name: "Repurpose", what: "Shown for hubs. Opens the Repurpose dialog. Highlighted once the hub is published.", how: "Click." },
          { name: "Delete piece (trash)", what: "Deletes the piece after a confirm (“This can't be undone.”) and returns to the Studio.", how: "Click, then confirm." },
          { name: "Video workflow", what: "Kallaway's 8-step workflow panel. See the two Video workflow sections of this guide." },
          {
            name: "Hook",
            what: "Section hint: “The first 2 seconds / first line. Worth 10 minutes of your time.” A big box: “Write the line that stops the scroll…”.",
            how: "Type your hook. It saves by itself.",
          },
          {
            name: "Hook library (button)",
            what: "Opens a pop-up of your saved hooks: a search box, type filter chips, and a list (hook text, type, number of uses, note). Empty library: “Add 10 starter templates”. Footer: “Manage library →” (opens the Hooks tab in Inspiration).",
            how: "Click a hook to put it in the Hook box. Its type is set too and its use count goes up by one. Press Escape or click outside to close.",
          },
          {
            name: "Hook type chips",
            what: "16 chips: Secret reveal, Case study, Comparison, Education, Personal experience, Problem, Curiosity, Contrarian, Result, Question, Mistake, Myth, List, Story, How-to, Before/after. Hover shows a hint.",
            how: "Click one to tag the hook. Click again to remove the tag.",
          },
          { name: "10 hook variations", what: "AI: writes 10 new hooks for this piece, leaning toward the tagged type.", how: "Click. Read the AI box that appears." },
          {
            name: "Hook variations (AI box)",
            what: "A numbered list of 10 hooks with their type. Each has Use and a bookmark button (save to hook library).",
            how: "Click Use to replace your hook (and its type). Click the bookmark to save one to your library. Click × to dismiss.",
          },
          { name: "Save to library", what: "Shown when the hook box has text. Saves your hook to the hook library.", how: "Click. Toast: “Hook saved to library” or “Already in your hook library”." },
          {
            name: "Brief",
            what: "Section hint: “Who it's for, the one idea, the angle, the proof you'll use.” A box with the prompts “Audience: … One idea: … Angle: … Proof: …”.",
            how: "Fill the four lines.",
          },
          {
            name: "Simple explanation",
            what: "AI button, shown when a source note is linked or the brief has more than 20 characters. Tooltip: “Explain it simply, flag jargon, draft 3 short posts”.",
            how: "Click it.",
          },
          {
            name: "Simple explanation (AI box)",
            what: "A plain explanation, “Insert into brief” and “Copy”; “Jargon to define (or gaps to learn)” chips; and 3 short post drafts, each with an angle chip (TIL, mistake or myth-bust), “Create as seed” and “Copy”.",
            how: "Insert the explanation into your brief. Click Create as seed to turn a draft into a new Text post at stage Seed (toast: “Seed created · It's in your Ideas column”).",
          },
          {
            name: "Script",
            what: "Section hint: “N words · ≈ X spoken at 150 wpm”. A large writing area: “Write the script here. Pick a template above to start from a proven structure.”",
            how: "Write the script. Use one sentence per line for the best checks.",
          },
          {
            name: "Template… (select)",
            what: "Seven script templates: Kallaway · Personal narrative, Kallaway · Breakdown, Kallaway · YouTube long-form, Hook → Problem → Insight → Proof → CTA, Listicle, Story, Tutorial.",
            how: "Pick one. An empty script gets the template. A full script gets it added below a --- line (toast: “Template added below your script”).",
          },
          { name: "Tighten script", what: "AI: cuts filler, hedges and repeats (about 20–30% shorter), keeps your voice and CTA. Needs at least 30 characters.", how: "Click." },
          {
            name: "Tightened script (AI box)",
            what: "The new word count (and the old one), the spoken time, the tightened text, “Accept & replace” and “Copy”.",
            how: "Click Accept & replace to swap your script (toast: “Script replaced”), or Copy to take parts.",
          },
          {
            name: "Draft repurposed posts",
            what: "AI: drafts 5–10 platform-native posts (short video scripts, LinkedIn or X posts, one carousel, one X thread) from this script. Needs 40+ characters of script or brief.",
            how: "Click.",
          },
          {
            name: "Repurposed drafts (AI box)",
            what: "Each draft has a format badge, a platform chip, a title, the full text, “Create as child piece” and “Copy”.",
            how: "Click Create as child piece: a new piece at stage Script, linked to this one as its child, with the same pillar and campaign. The button then says Created.",
          },
          { name: "Word count line", what: "“N words · ≈ X” at the right under the script." },
          { name: "Call to action", what: "One field for your CTA. Placeholder: “e.g. Comment “TEMPLATE” and I'll send it”.", how: "Type the exact words of your ask." },
        ],
        howTo: [
          "Do the Video workflow steps first (idea gate, angle, hook, structure).",
          "Write or pick the hook. Tag its type.",
          "Fill the brief: audience, one idea, angle, proof.",
          "Pick a template and write the script. Run Tighten script.",
          "Write the call to action.",
        ],
      },
      {
        route: "/content/[id] (sidebar)",
        title: "Piece editor: sidebar",
        purpose: "Set the piece's details, pass the publish checklist, log performance, write the lesson, manage children, link inspiration and the source note.",
        elements: [
          { name: "Details: Brand", what: "Personal or Company.", how: "Click one. It saves at once." },
          { name: "Details: Pillar", what: "Pillars of this brand (plus the current one).", how: "Pick one." },
          { name: "Details: Format", what: "The 9 formats.", how: "Pick one. The checklist and workflow adapt to it." },
          { name: "Details: Platforms", what: "Nine chips: LinkedIn, Instagram, TikTok, YouTube, YouTube Shorts, X, Facebook, Newsletter, Blog.", how: "Click to turn each on or off." },
          { name: "Details: Hub piece", what: "A switch: “The weekly long piece you cut into 5–10 short ones”.", how: "Click to turn on or off." },
          {
            name: "Details: Publish on",
            what: "The planned date with a relative-day hint (or “Pick a day; drag it around in the calendar later.”). An × clears it. After publishing it becomes “Published on”.",
            how: "Pick a date. Change “Published on” if the real day was different.",
          },
          { name: "Details: Live URL", what: "The link to the live post. An open-link button appears when filled.", how: "Paste the link after publishing." },
          { name: "Details: Campaign", what: "Links the piece to a campaign (“None”, or “No campaigns yet”).", how: "Pick one." },
          {
            name: "Publish checklist",
            what: "The count (n/total), a bar and every item for this format with its hint. Auto items say “Done automatically”. Before publishing: a Publish button. After: a green “Published <day>” box with “Recycle <month year>”.",
            how: "Tick items as you finish them. Click Publish.",
          },
          {
            name: "Performance",
            what: "Hint: “Snapshots at 24h, 7d and 30d, compared to your own median.” Before publishing: “Numbers unlock once it's published.” After: the latest views and window, the ratio chip (or “Median appears after 2+ pieces”) and “Your median: N (short videos, 7d)”.",
          },
          {
            name: "Window switch (24h / 7d / 30d)",
            what: "Which snapshot you edit. A green dot marks windows that have data.",
            how: "Click a window.",
          },
          { name: "Views, Likes, Comments, Shares, Saves, Follows, Leads", what: "Number fields for the snapshot. Views is required.", how: "Type numbers. 1.2k and 3m work too. Enter saves." },
          { name: "3s hold %", what: "Shown for every format except Long video: the % of viewers still watching at 3 seconds.", how: "Type a percentage, for example 72." },
          { name: "Avg view", what: "Average view duration.", how: "Type seconds (83) or m:ss (1:23)." },
          { name: "CTR %", what: "Shown for Long video: the impressions click-through rate.", how: "Type a percentage, for example 6.5." },
          {
            name: "Advice note",
            what: "For shorts with a 3s hold: the hold rule (banger, OK or hook problem). For long videos with a rank: “#N of your last M long videos.” and the 1-of-10 advice.",
          },
          { name: "Tip: 1.2k and 3m work too.", what: "A reminder that short number formats are accepted." },
          { name: "Clear 24h", what: "Deletes the snapshot of the selected window.", how: "Click." },
          { name: "Save 24h", what: "Saves the selected window (label follows the window).", how: "Click. Toast: “24h numbers saved”." },
          { name: "Outlier! Save hook to library", what: "Shown at ×1.2 your median or more when the piece has a hook.", how: "Click to save the winning hook with a note like “×1.8 your median”." },
          {
            name: "Lesson",
            what: "One line you will reuse. Hint before publishing: “Fill this in after the 7-day numbers.” After: “Why did it work (or not)? One line you'll reuse.”",
            how: "Type, for example “Specific numbers in the hook doubled the saves”.",
          },
          { name: "Recycle now", what: "Shown after publishing. Creates a fresh copy (“Recycle · <title>”) and opens it.", how: "Click." },
          {
            name: "Repurpose tree",
            what: "The parent hub (if this is a child), this piece (“this”), and its children with stage chips. “+N siblings from the same hub” for children. Empty: “No children yet. Cut this hub into shorts, posts and a thread.” or “Standalone piece. Make it a hub to cut it into 5–10 short pieces.”",
            how: "Click a row to open that piece. Click “Repurpose…” (hub) or “Make it a hub” (turns Hub on and opens the dialog).",
          },
          {
            name: "Inspiration",
            what: "Linked swipes: platform and creator, an “N× outlier” chip (green at 3×+), the hook, “Why:” and “Steal:”. “Library →” opens Inspiration.",
            how: "Pick from “+ Link a saved swipe…” to link one. Click × on a swipe to unlink it.",
          },
          {
            name: "Source",
            what: "The note this piece came from, plus chips for the learning area (“Learning: …”) and the campaign.",
            how: "Pick from “+ Link a source note…”. Click × to remove the note. Click the note title to open it.",
          },
        ],
        howTo: [
          "Set brand, pillar, format and platforms first.",
          "Pick a publish date.",
          "Tick the checklist as you go, then click Publish.",
          "Paste the Live URL.",
          "After 1, 7 and 30 days, log numbers. After the 7-day numbers, write the lesson.",
        ],
      },
      {
        route: "/content/[id] (Repurpose dialog)",
        title: "Repurpose this hub",
        purpose: "Cut a hub into child pieces in one click (hub and spoke).",
        elements: [
          { name: "One hub, many spokes.", what: "Intro: each child is created as a draft linked to the hub, with the same pillar and brand." },
          {
            name: "Format rows",
            what: "One row per format with a count from 0 to 10. Defaults: Short video 3 (TikTok, Instagram, YouTube Shorts), Carousel 1 (Instagram, LinkedIn), Text post 3 (LinkedIn, X), Thread 1 (X), Newsletter 0, Article 0. Rows at 0 are faded.",
            how: "Click − or + to change a count.",
          },
          { name: "Platform chips (per row)", what: "Shown when the count is above 0.", how: "Click to turn platforms on or off for that format." },
          { name: "+ Add another format…", what: "Adds a row for a format not in the list.", how: "Pick a format." },
          { name: "Children start in", what: "Idea or Brief (default Brief). Brief children get a brief “Cut from the hub …” with the hub's hook.", how: "Click one." },
          { name: "Cancel / Create N pieces", what: "Creates the children (max 40). Titles look like “Short video 2 · <hub title>”.", how: "Click Create." },
        ],
        howTo: ["Open a hub and click Repurpose.", "Adjust counts and platforms.", "Pick Brief and click Create N pieces."],
      },
    ],
    frameworks: [
      {
        term: "Autosave",
        definition: "Every text field saves by itself shortly after you stop typing, and when you click away. Dates keep a local draft so typing a date is never garbled.",
        source: "bishOS",
      },
      {
        term: "Brief (Audience, One idea, Angle, Proof)",
        definition: "Four lines that plan a piece: who it is for, the single idea, your angle (your take), and the proof you will show.",
        example: "Audience: seed SaaS founders. One idea: the founder closes the first 20 deals. Angle: a sales hire too early kills learning. Proof: our first 20 deals and what we learned.",
        source: "bishOS",
      },
      {
        term: "Speaking-time estimate (150 wpm)",
        definition: "The app counts words (ignoring markdown headings) and assumes you speak 150 words a minute. 150 words ≈ 1 minute.",
        source: "bishOS",
      },
      {
        term: "Script templates",
        definition: "Seven proven skeletons you can insert into the script. Three are Kallaway's, four are classic structures.",
        source: "Kallaway + bishOS",
      },
      {
        term: "Template: Kallaway · Personal narrative",
        definition: "Hook (lean · but · snapback) → The problem I had → What I tried → Why it failed → What actually worked → If you have this problem… (native CTA) → Last line (write it first). The hottest short-form format now: one-of-one, AI cannot copy it.",
        source: "Kallaway",
      },
      {
        term: "Template: Kallaway · Breakdown",
        definition: "Hook (≤4 seconds to first value) → Context / shock (the highest shock-score fact) → What happened / how it works (each line answers the last question and opens the next) → Why it matters (for THEM) → Outro (last line + CTA).",
        source: "Kallaway",
      },
      {
        term: "Template: Kallaway · YouTube long-form",
        definition: "Packaging (lock title and thumbnail before scripting) → Intro in 5 moves (confirm the click ~5 s, common belief, your contrarian take, proof, the plan) → Point 1: your SECOND-best point (context → how → why + re-hook) → Point 2: your BEST point → Points 3+ toward a climax → Outro (recap, free dessert, native CTA).",
        source: "Kallaway",
      },
      {
        term: "Template: Hook → Problem → Insight → Proof → CTA",
        definition: "The default for short video and posts: the line that stops the scroll, the problem in their words, the one idea that changes how they see it, your proof, one clear next step.",
        source: "bishOS (classic direct-response structure)",
      },
      { term: "Template: Listicle", definition: "Hook (“N things that…”) → 5 numbered tips, each with why it works → Payoff (which one matters most) → CTA.", source: "bishOS" },
      { term: "Template: Story", definition: "Hook (drop into the moment: time, place, something going wrong) → Tension → Turn → Lesson framed for them → CTA (ask about their version).", source: "bishOS" },
      { term: "Template: Tutorial", definition: "Hook (the promise: how to get X in Y time without Z) → Why it matters → Steps → Result → CTA.", source: "bishOS" },
      {
        term: "Second-best point first",
        definition: "In a long video, put your second-best point first and your best point second, then the rest toward a climax. You hook them early and keep a peak for when attention dips.",
        source: "Kallaway",
      },
      { term: "Free dessert", definition: "End a long video with a small unexpected bonus, so viewers leave on a high.", source: "Kallaway" },
      {
        term: "Simple explanation (Feynman technique)",
        definition: "Explain an idea so simply that a 12-year-old understands it. If you cannot, you found a gap in your own understanding. The AI flags jargon to define or learn.",
        source: "Richard Feynman",
      },
      { term: "Post angle: TIL", definition: "“Today I learned”: one lesson you just learned, shared simply.", source: "Learning in public" },
      { term: "Post angle: mistake", definition: "A mistake you made and what it cost. Tagged with hook type Mistake when created as a seed.", source: "bishOS" },
      { term: "Post angle: myth-bust", definition: "A common belief, and why it is wrong. Tagged with hook type Myth when created as a seed.", source: "bishOS" },
      {
        term: "Child piece",
        definition: "A piece linked to a parent hub. Created by the Repurpose dialog, by “Create as child piece” on an AI draft, or by Recycle (a recycled copy is a child of the original).",
        source: "bishOS",
      },
      { term: "Siblings", definition: "Other children of the same hub. The repurpose tree shows how many there are.", source: "bishOS" },
      {
        term: "Live URL",
        definition: "The link to the published post. Store it so you can open the live piece in one click when you log numbers.",
        source: "bishOS",
      },
      { term: "Campaign", definition: "A marketing campaign from the Founder area. Linking pieces to a campaign groups the content that supports it.", source: "bishOS" },
      {
        term: "Median basis",
        definition: "“Your median” uses your other pieces in the same format when you have 3+ of them at that window, otherwise all formats. The ratio needs at least 1 other published piece with views.",
        source: "bishOS",
      },
      {
        term: "3s hold %",
        definition: "The percentage of viewers still watching at 3 seconds (from your platform's analytics). The best single number for a short's hook. ≥70% banger, under 50% problem.",
        source: "Kallaway",
      },
      {
        term: "Avg view (AVD)",
        definition: "Average view duration: how long people watch on average. Paddy Galloway warns it rises just by making longer videos, so read it with the retention curve.",
        source: "Paddy Galloway",
      },
      {
        term: "CTR",
        definition: "Click-through rate on YouTube: the % of people who saw the thumbnail and clicked. Noisy: big audiences have lower CTR. Best-in-class is about 10–12%.",
        source: "Kallaway / Paddy Galloway",
      },
      {
        term: "Lesson",
        definition: "One reusable line on why a piece worked or not, written after the 7-day numbers. Lessons are copied into recycled pieces and next reps.",
        source: "bishOS",
      },
    ],
    testing: [
      "Open any piece. Change the title and wait a second. Expected: “Saved” next to the badges.",
      "Click Hook library with an empty library, then Add 10 starter templates. Expected: toast “10 starter hooks added”. Click one: it fills the Hook box.",
      "Click a hook type chip. Expected: it turns dark. Click again: it clears.",
      "Pick the Template “Story” on an empty script. Expected: the story skeleton fills the script; the word count updates.",
      "With 40+ characters of script, click Draft repurposed posts. Expected: an AI box with drafts; Create as child piece makes a child (toast “Child piece created”) and the Repurpose tree lists it.",
      "Turn on Hub piece and click Repurpose. Set Short video to 2, others to 0, click Create 2 pieces. Expected: a reward toast and two children in the tree.",
      "Publish the piece. Expected: Performance shows the Numbers editor. Type 1.2k views in 24h and Save 24h: toast “24h numbers saved”.",
      "For a short, type 75 in 3s hold % and save. Expected: a green note “Banger hook — ≥70% held at 3s.”",
      "Click Recycle now. Expected: a new “Recycle · <title>” piece opens with the lesson in its brief.",
      "Link a saved swipe from “+ Link a saved swipe…”. Expected: toast “Inspiration linked” and the swipe card in the sidebar.",
    ],
    tips: [
      "Write the hook last-but-one: do the angle first in the workflow, then the hook flows from it.",
      "Paste the Live URL right after publishing. It makes logging numbers much faster later.",
      "Use “Create as seed” on the Simple explanation drafts to test small ideas before making a hub.",
    ],
  },
  // ───────────────────────────────────────────────────────────────────────
  // 7. Video workflow, steps 1–4
  // ───────────────────────────────────────────────────────────────────────
  {
    id: "content-workflow-idea-hook",
    group: "Content",
    title: "Video workflow 1–4: idea gate, angle, hook, structure",
    summary:
      "Every piece has a Video workflow panel: Kallaway's 8-step process as a guided, autosaving checklist. This part explains the panel and steps 1–4: Idea gate, Angle & facts, Hook, Structure.",
    why:
      "Most videos fail before the first word is filmed: a weak idea, an obvious angle or a slow hook. Steps 1–4 test the idea, find your contrarian angle and shock facts, build a hook with the 3-step formula, and pick a proven story shape.",
    when: {
      daily: "For every piece, before you write the script: do steps 1–4 (about 20–30 minutes once you know them).",
    },
    pages: [
      {
        route: "/content/[id] (Video workflow panel)",
        title: "Video workflow panel",
        purpose: "The 8-step panel at the top of every piece. It guides you step by step and shows your progress.",
        elements: [
          { name: "Progress ring (n/8)", what: "Steps done out of 8. Green at 8/8." },
          { name: "Video workflow", what: "The panel title. Below: “Kallaway system”, plus “ + Paddy Galloway for YouTube” on Long video pieces, and the save status." },
          { name: "Collapse / Expand (arrows button)", what: "Folds the panel to a thin bar of 8 segments (green = done). The app remembers your choice in this browser.", how: "Click it." },
          {
            name: "Step row",
            what: "Each step shows a round check, its number, its label and a one-line summary of what you filled (or a hint when empty), plus a chevron.",
            how: "Click the label to open or close the step. Click the round check to mark it done or not done.",
          },
          {
            name: "Steps 1–8",
            what: "1 Idea gate (“Does this idea earn a rep?”), 2 Angle & facts (“Topic, contrarian angle, shock facts, emotion”), 3 Hook (“Visual stop → context → contrast”), 4 Structure (“Pick the story shape, write the last line first”), 5 Script & retention (“Live linter, storylocks, one-question chain”), 6 Convert (“Signal, trust, one ramp, aligned offer”), 7 Packaging (“What earns the click (or the share)”), 8 Post-mortem (“Which brick was weak? Fix it next rep”).",
          },
          { name: "Lock icon (Post-mortem)", what: "Step 8 is locked until the piece is published (“Unlocks after you publish”). On long videos you can still open it to predict your rank." },
          { name: "Mark “<step>” done", what: "A button at the bottom of an open step.", how: "Click it. The step folds and the next unfinished step opens." },
          { name: "Workflow complete", what: "When all 8 are done: a celebration “Workflow complete · that's a full rep”. Board cards show the n/8 ring." },
        ],
        howTo: [
          "Open a piece. The first unfinished step is already open.",
          "Fill the step, then click Mark “<step>” done.",
          "Repeat until step 7. After publishing, do step 8.",
        ],
      },
      {
        route: "/content/[id] (Workflow step 1 · Idea gate)",
        title: "Step 1 · Idea gate",
        purpose: "Six yes/no checks. Nothing else matters if the idea is weak.",
        elements: [
          { name: "Does this idea earn a rep?", what: "The step heading. Hint: “Nothing else matters if the idea is weak. Tick what's true.” A counter shows n/6 (green at 6)." },
          { name: "Passes the avatar filter", what: "“Would my one ideal viewer find this useful or interesting?”", how: "Click the row to tick it." },
          { name: "Validated by an outlier", what: "“A 5×+ video (yours first, then 10K–1M creators) proves the topic.” Pre-ticked when the piece was made with Remix.", how: "Tick when you have the outlier." },
          { name: "Non-obvious contrarian angle", what: "“What do most people believe that I disagree with?”", how: "Tick when you have a take." },
          { name: "A key visual exists", what: "“No good visual for the first 3–5s? Make one or drop the idea.”", how: "Tick when you know what they will see first." },
          { name: "Every point is unique", what: "“Measure twice, cut once.”", how: "Tick when no point is generic." },
          { name: "Worth a $1,000 rep?", what: "“If this video cost $1,000, would you still make it?”", how: "Tick if yes." },
          {
            name: "Outliers first note",
            what: "Shown until “Validated by an outlier” is ticked: “Outliers first: remake your own winners, then 10K–1M creators' winners.” with a link “Open your swipe file”.",
            how: "Click the link to open Inspiration.",
          },
          { name: "This idea passes the gate.", what: "A green note when all 6 are ticked: “Mark the step done and find your angle.”" },
        ],
      },
      {
        route: "/content/[id] (Workflow step 2 · Angle & facts)",
        title: "Step 2 · Angle & facts",
        purpose: "Write the topic and angle, turn a common belief into your contrarian take, collect 5–10 shock facts and pick one target emotion.",
        elements: [
          { name: "Topic", what: "“One sentence: what this video is about”.", how: "Type one sentence." },
          {
            name: "Topic bucket",
            what: "Your 3-2-1 buckets (name · broad or narrow), “Chaos agent (a creative bet)”, or “No bucket”. Note: “3-2-1: 3 buckets × 2 a week + 1 chaos agent.” or, with no buckets, “Set up your 3-2-1 buckets in the Content playbook.”",
            how: "Pick the bucket. The 3-2-1 plan in the Playbook counts it when you publish.",
          },
          { name: "Angle", what: "Hint: “Premise + your take + the key facts.” Placeholder: “The lens only you can bring to this topic”.", how: "Type 1–2 lines." },
          {
            name: "Belief → your take",
            what: "Hint: “What do most people believe that I disagree with?” Two boxes with an arrow: “Common belief: most people think…” → “Your contrarian take: actually…”.",
            how: "Write the belief on the left and your take on the right.",
          },
          { name: "Save take to my vault", what: "Shown when the take box has text. Adds the take to your contrarian take vault (Playbook, Positioning).", how: "Click. Toast: “Added to your contrarian vault”." },
          {
            name: "Shock facts",
            what: "Hint: “Shock Score: out of 100 people, how many haven't heard this? Aim for 5–10 high-shock, true facts.” A counter “n facts · aim 5–10” (green from 5 to 10, orange above 10).",
          },
          {
            name: "Fact row",
            what: "The fact text (editable), a remove ×, a slider from 0 to 100 and the score chip (green at 70+). The list is sorted by score, highest first.",
            how: "Edit the text. Drag the slider to set the shock score; the list re-sorts when you let go.",
          },
          { name: "More than 10 warning", what: "“More than 10: keep the most shocking ones, the rest dilute the script.”" },
          { name: "Add a fact, take or implication… (Enter)", what: "A box to add a fact. New facts start at score 50.", how: "Type and press Enter, or click +." },
          { name: "Find shock facts", what: "AI: proposes 8 shock-fact candidates for your topic. Needs a topic of 4+ characters.", how: "Click." },
          {
            name: "Shock-fact candidates (AI box)",
            what: "An orange warning: “Verify before using. AI facts can be wrong or out of date.” Then each candidate: score, fact, why it shocks, and an Add button (Added after you click).",
            how: "Check each fact against a source. Click Add for the ones you can defend.",
          },
          { name: "Target emotion", what: "Six chips: Awe / inspiration, Amusement / humor, Excitement / joy, Anger / outrage, Surprise / curiosity, Sadness / empathy. Hint: “Write it at the top of the page and reread the script through it.”", how: "Click one (click again to clear)." },
          {
            name: "Sweet spot note",
            what: "“The sweet spot: things people don't believe, but can believe quickly once you say it. That aha is the contrast.”",
          },
        ],
      },
      {
        route: "/content/[id] (Workflow step 3 · Hook)",
        title: "Step 3 · Hook",
        purpose: "Build the hook: pick a shape, write it with the 3-step formula, check power words, write the text hook, plan the key visual and audio, and audit it.",
        elements: [
          {
            name: "The 3 jobs of a hook, in order",
            what: "Three cards with arrows: Job 1 Visual stop, Job 2 Context in the first sentence, Job 3 Contrast. Below: “The 200-point arc: lean them to the common belief (+100), then flip to your take (−100).”",
          },
          { name: "Pick a shape", what: "A switch between “6 archetypes” and “9 formats”.", how: "Click one." },
          {
            name: "Archetype cards",
            what: "Six cards: Fortune Teller, Experimenter, Teacher, Magician, Investigator, Contrarian. Each shows its contrast, its steps (with arrows) and “Best for: …”.",
            how: "Click a card to pick it (click again to clear).",
          },
          {
            name: "Format cards",
            what: "Nine cards: Secret reveal, Case study, Comparison, Question, Education, List, Contrarian, Personal experience, Problem. Each shows an example line. A blue “fits <structure>” chip appears when it fits the structure you picked in step 4.",
            how: "Click a card. It also sets the piece's hook type tag.",
          },
          { name: "3-step hook builder", what: "Hint: “2–4 short lines. Each line makes them need the next one.” If you picked an archetype, a note repeats its steps." },
          {
            name: "Quick-pick a pattern that works (from his own hook data)",
            what: "Four chips: Transformation, Impossibility, Addiction, A new thing exists. Each inserts a starter line into line 1.",
            how: "Click one. If line 1 already has text, the app asks before replacing it.",
          },
          {
            name: "Line 1 · Context lean-in",
            what: "Hint: “Topic in the first sentence, then lean them toward the common belief: common ground, a pain or benefit, a metaphor or a mind-blowing fact.” The placeholder shows your common belief from step 2.",
            how: "Write the first line.",
          },
          { name: "Line 2 · Scroll-stop interjection", what: "Hint: “One stunning line, usually opening with But / However / Yet.”", how: "Write the turn." },
          {
            name: "Line 3 · Contrarian snapback",
            what: "Hint: “Still on topic, the opposite of the lean. The bigger the honest shock, the stronger the snap.” The placeholder shows your contrarian take from step 2.",
            how: "Write the flip.",
          },
          { name: "Start from my belief → take", what: "Shown when step 2 has a belief and a take but lines 1 and 3 are empty. Copies them into lines 1 and 3.", how: "Click." },
          {
            name: "Preview",
            what: "Your 3 lines joined, the word count and the spoken time (about 2.5 words per second). A green chip “The piece's hook” when it matches the Hook box.",
            how: "Click “Use as the piece's hook” to copy it into the piece's Hook (toast: “Piece hook updated”).",
          },
          { name: "“If you…” warning", what: "Shown when the hook starts with “If you…”: conditional openers never win in his data. Lead with the transformation, the impossible thing or the new thing instead." },
          {
            name: "Power words (detected live)",
            what: "Six chips: Subject, Action, Objective, Contrast (required) and Proof, Time (marked “opt”). Green with a tick when the app detects one; orange when a required one is missing. A counter shows “required n/4”. It reads the builder lines, or the piece's hook if the builder is empty.",
            how: "Rewrite until the four required chips are green. It is a smart guess, not a grade.",
          },
          { name: "Avoid: …", what: "“Avoid: Opening with ‘If you…’ · Fear framing · Multi-sentence hooks before the point.”" },
          {
            name: "Text hook",
            what: "Hint: “The on-screen title text: bigger words, not your captions.” A box “3–5 words, max 2 lines”, live checks (word count, more than 2 lines, punctuation, connector words) and the 4 text hook rules.",
            how: "Write 3–5 words and fix what the checks flag.",
          },
          {
            name: "Key visual",
            what: "Hint: “What they SEE in the first 2 seconds: visuals land before words.” Placeholder: “e.g. I pull a $40K invoice off the printer”.",
            how: "Describe the first image.",
          },
          { name: "Visual hook category chips", what: "Graphic / text overlay, Pattern interrupt / visual switch, Subject moves in/out of frame, VFX / transition, Striking visual selection.", how: "Click the category that fits." },
          {
            name: "Minimum viable visual: at least one in the first 2s",
            what: "Four checks: Attractive or unique-looking person; Recognizable person or brand; Atypical visual for the category; Atypical layout. A counter turns green at 1.",
            how: "Tick the ones your first 2 seconds have.",
          },
          { name: "Audio", what: "“Music mood, sound effects, the first sound they hear”.", how: "Type a short note." },
          {
            name: "Hook audit",
            what: "Hint: “Visual, spoken and text hooks should all say the same thing.” Seven checks with hints: Alignment, Speed to value, Clarity, Curiosity, Stakes, Relevance, 100% absorption. A counter n/7.",
            how: "Tick each check that is true.",
          },
          { name: "Write it in all 6 archetypes", what: "AI: writes your topic as a 3-line hook plus a text hook in each of the 6 archetypes. Needs a topic.", how: "Click." },
          {
            name: "Your topic in 6 archetypes (AI box)",
            what: "Six cards: the archetype, its text hook, the three lines, and Use.",
            how: "Click Use to put that hook (and its text hook) into the builder (toast: “<Archetype> hook inserted”).",
          },
          { name: "Audit my hook", what: "AI: scores your spoken hook (with your text hook and key visual) on 7 criteria and writes a better version. Needs 8+ characters.", how: "Click." },
          {
            name: "Hook audit (AI box)",
            what: "A one-line verdict, 7 scores out of 10 with bars and notes, “Failure modes found” chips (delay, confusion, irrelevance, disinterest) with reasons, and an “Improved rewrite” with its text hook.",
            how: "Click “Use rewrite” to put it in the builder. Click “Tick the checks that scored 7+” to tick those audit rows.",
          },
        ],
      },
      {
        route: "/content/[id] (Workflow step 4 · Structure)",
        title: "Step 4 · Structure",
        purpose: "Pick a proven story shape, insert its outline into the script, choose the visual layout, and write the last line first.",
        elements: [
          { name: "From your remix note", what: "Shown when a remix copied a structure text that is not one of the 8: “From your remix: …. Pick the closest structure below.”" },
          {
            name: "Structure cards",
            what: "Eight cards: Personal narrative, Breakdown, Newscaster, Case-study explainer, Listicle, Problem-solver, Tutorial, YouTube long-form (with a “Long-form” chip). On Long video pieces, YouTube long-form comes first.",
            how: "Click a card to pick it (click again to clear).",
          },
          { name: "Blocks", what: "The numbered blocks of the picked structure." },
          {
            name: "Hook formats that fit",
            what: "Chips with the hook formats that suit this structure. An orange line warns when your step 3 format is not a usual fit.",
            how: "Click a chip to set that hook format.",
          },
          {
            name: "Insert outline into script",
            what: "Adds the blocks to your script as headings. It pre-fills the hook block with your 3 lines, the packaging block with your chosen title and thumbnail, and the last block with your last line. After that it says “Outline is in your script”.",
            how: "Click. Then fill each block in the Script section.",
          },
          {
            name: "Visual format",
            what: "Hint: “The layout brick: hold it constant while you're learning.” A box and seven chips: Talking head + captions, Green screen, Split screen, POV vlog, In-the-world, Faceless text + B-roll, Screen recording.",
            how: "Click a chip or type your own layout.",
          },
          {
            name: "Write your last line first",
            what: "Hint: “The memorable ‘last dab’: worth sharing, and in shorts it loops back to your first line.” Placeholder: “The line they'll repeat to a friend”. Below, your first line is shown with “Does the last line loop back to it?”",
            how: "Write the last line before the middle.",
          },
        ],
      },
    ],
    frameworks: [
      {
        term: "The 8-step video workflow",
        definition: "Kallaway's per-video process: 1 Idea gate, 2 Angle & facts, 3 Hook, 4 Structure, 5 Script & retention, 6 Convert, 7 Packaging, 8 Post-mortem. It saves inside the piece.",
        source: "Kallaway (pre-post checklists), bishOS",
      },
      {
        term: "Idea gate",
        definition: "Six checks an idea must pass before you spend a rep on it: avatar filter, validated by an outlier, non-obvious contrarian angle, a key visual exists, every point is unique, worth a $1,000 rep.",
        source: "Kallaway",
      },
      {
        term: "Idea gate: Passes the avatar filter",
        definition: "Would your one ideal viewer find this useful, interesting or valuable? If not, don't make it, even if it could go viral.",
        source: "Kallaway",
      },
      {
        term: "Idea gate: Validated by an outlier",
        definition: "A video at 5× or more (your own first, then 10K–1M creators) already proved people want this topic.",
        source: "Kallaway",
      },
      { term: "Idea gate: Non-obvious contrarian angle", definition: "You disagree with something most people believe, and you can defend it.", source: "Kallaway" },
      {
        term: "Idea gate: A key visual exists",
        definition: "You know the visual for the first 3–5 seconds. No good visual? Make one (graphics, B-roll) or drop the idea.",
        source: "Kallaway",
      },
      { term: "Idea gate: Every point is unique", definition: "No generic points. If a point is not unique, research more or kill the video: “measure twice, cut once”.", source: "Kallaway" },
      {
        term: "Idea gate: Worth a $1,000 rep?",
        definition: "Imagine each video costs $1,000. Would you still pay for this one? It stops you from wasting reps on weak ideas.",
        source: "Kallaway",
      },
      {
        term: "Topic",
        definition: "One sentence on what the video is about. Topic is LEGO brick 1. An idea = topic + angle.",
        example: "“How to close your first 10 B2B customers without a sales team.”",
        source: "Kallaway",
      },
      {
        term: "Topic bucket (on a piece)",
        definition: "Which of your 3-2-1 buckets this piece belongs to, or the chaos agent. Publishing a tagged piece fills a dot in the Playbook's 3-2-1 plan.",
        source: "Kallaway, bishOS",
      },
      {
        term: "Angle",
        definition: "Your unique lens on the topic: the premise, your take and the key facts. LEGO brick 2. Data picks the topic; creativity picks the angle.",
        example: "Topic: first 10 customers. Angle: “Your network is a trap; cold outbound teaches you the market faster.”",
        source: "Kallaway",
      },
      {
        term: "Common belief vs contrarian take",
        definition: "Write what most people think, then what you think instead. The distance between them is the contrast that makes people curious. Your take must be true and pay off.",
        example: "Belief: “You need a big network to get first customers.” Take: “Strangers give more honest feedback than friends, so cold outreach wins early.”",
        source: "Kallaway",
      },
      {
        term: "Law of Interesting",
        definition: "Interesting = shock value = the distance between what the viewer already believes and what you tell them.",
        source: "Kallaway",
      },
      {
        term: "Shock score",
        definition: "A number from 0 to 100 for each fact: out of 100 people in your audience, how many have NOT heard this (or would not have believed it)? Higher is more shocking. Collect 5–10 true facts with high scores.",
        example: "“Most SaaS churn happens in the first 30 days” might score 40. “Our best customers came from our worst cold emails” might score 85.",
        source: "Kallaway",
      },
      {
        term: "The shock sweet spot",
        definition: "Say things people don't believe, but can believe quickly once they hear the reason. Not random trivia, not unbelievable claims. That “aha” is the contrast.",
        source: "Kallaway",
      },
      {
        term: "Target emotions",
        definition: "Pick one emotion you want the viewer to feel and write it at the top of the script. Then reread the script through that emotion. Emotion makes people share and buy.",
        source: "Kallaway",
      },
      { term: "Emotion: Awe / inspiration", definition: "“Wow, that is possible?” Big results, bold journeys.", source: "Kallaway" },
      { term: "Emotion: Amusement / humor", definition: "They laugh or smile. Light, relatable moments.", source: "Kallaway" },
      { term: "Emotion: Excitement / joy", definition: "They feel energy and hope. Wins, launches, new tools.", source: "Kallaway" },
      { term: "Emotion: Anger / outrage", definition: "They feel something is unfair or wrong. Use with care; great for comments.", source: "Kallaway" },
      { term: "Emotion: Surprise / curiosity", definition: "They did not expect that and want to know more. The default for education.", source: "Kallaway" },
      { term: "Emotion: Sadness / empathy", definition: "They feel your struggle. Honest failure stories.", source: "Kallaway" },
      {
        term: "The 3 hook jobs",
        definition: "A great hook does three jobs, in this order: 1 Visual stop, 2 Context in the first sentence, 3 Contrast.",
        source: "Kallaway",
      },
      {
        term: "Hook job 1: Visual stop",
        definition: "A thumb-stopper that looks different from the feed. Visuals land before words, so the first frame must stop the scroll.",
        example: "You walk into frame holding a giant printed invoice, instead of sitting at a desk.",
        source: "Kallaway",
      },
      {
        term: "Hook job 2: Context in the first sentence",
        definition: "Say who or what this is about at once. Dropping people into the middle of a story (“the jump was crazy” — who? what?) confuses them, and confusion makes them leave.",
        source: "Kallaway",
      },
      {
        term: "Hook job 3: Contrast",
        definition: "The difference between what they expect and what you show. Lean them to the common belief, then flip it. Contrast creates curiosity, and curiosity holds attention.",
        source: "Kallaway",
      },
      {
        term: "The 200-point arc",
        definition: "A viewer starts at 0. Jumping straight to your contrarian take moves them 100 points. First lean them to the common belief (+100), then flip to your take (−100): a 200-point arc, twice the surprise.",
        example: "“Everyone says you should hire a salesperson first (+100). But that's the fastest way to kill a startup. The founder must close the first 20 deals (−100).”",
        source: "Kallaway",
      },
      {
        term: "Direct vs implied contrast",
        definition: "Direct contrast states the belief and then flips it (stronger). Implied contrast only states the surprising side and lets the viewer fill in the belief (weaker).",
        source: "Kallaway",
      },
      {
        term: "The 6 hook archetypes",
        definition: "Six ways to create contrast in a hook within about 5 seconds. Any topic can be written in all six. Pick the one that fits your key visual best.",
        source: "Kallaway",
      },
      {
        term: "Archetype: Fortune Teller",
        definition: "Contrast: present vs future. Steps: current reality → how the future changes → tease that future. Best for news, product innovation, authority on the future.",
        example: "“Today you hire SDRs. In 2 years, AI agents will book your demos. Here's what that means for you.”",
        source: "Kallaway",
      },
      {
        term: "Archetype: Experimenter",
        definition: "Contrast: “I tried a new way”. Steps: the base pain → I tried a new method or tool → why it works better. Best for product demos, B2B tools, new frameworks.",
        example: "“I hated writing follow-ups. So I tried a 3-line follow-up for 30 days. Replies went up 2×.”",
        source: "Kallaway",
      },
      {
        term: "Archetype: Teacher",
        definition: "Contrast: a lesson learned. Steps: the pain → my learnings or method → why the steps work. Best for building expert authority.",
        example: "“Pricing was our biggest mistake. Here are the 3 rules we use now, and why they work.”",
        source: "Kallaway",
      },
      {
        term: "Archetype: Magician",
        definition: "A visual or verbal “stun gun”: a signature visual, sound or phrase that stops the scroll. You stack it on any other archetype.",
        example: "You always open by slamming a laptop shut and saying “Check this out.”",
        source: "Kallaway",
      },
      {
        term: "Archetype: Investigator",
        definition: "Contrast: a secret they don't know. Steps: tee up the secret → frame it against their not-knowing. Best for research and leading-edge positioning.",
        example: "“There's a free setting in LinkedIn that 90% of founders never turn on.”",
        source: "Kallaway",
      },
      {
        term: "Archetype: Contrarian",
        definition: "Contrast: the opposite of conventional wisdom. Steps: find what you believe that most don't → say it directly. Best for experts in crowded spaces.",
        example: "“Stop building an MVP. Sell the product before you write a line of code.”",
        source: "Kallaway",
      },
      {
        term: "The 9 hook formats",
        definition: "Nine proven sentence structures for the spoken hook. Archetypes describe the kind of contrast; formats describe the sentence. Each niche usually has 1–2 formats that win; find them in outliers and remix them like a fill-in-the-blank.",
        source: "Kallaway",
      },
      { term: "Format: Secret reveal", definition: "An unknown insight or a new release.", example: "“[Company] just released [N] free [thing] that make [outcome] way faster.”", source: "Kallaway" },
      { term: "Format: Case study", definition: "Someone got a result in an unexpected way. Very strong for educators.", example: "“[Person] just did [result] in [time] using this [N]-step method.”", source: "Kallaway" },
      { term: "Format: Comparison", definition: "A vs B, beginner vs expert, good vs bad.", example: "“Beginner founder vs experienced founder.”", source: "Kallaway" },
      { term: "Format: Question", definition: "Plants the question directly in their head.", example: "“Can you [do X] in under [time] using only [Y]?”", source: "Kallaway" },
      { term: "Format: Education", definition: "Opens a step-by-step for one task. Comes before a tutorial.", example: "“Here's the easiest way to use [tool] to [task].”", source: "Kallaway" },
      { term: "Format: List", definition: "An ordered set of items.", example: "“These are the [N] best [things] for [goal].”", source: "Kallaway" },
      { term: "Format: Contrarian", definition: "A bold take in the first sentence. Drives comments.", example: "“Most people think [belief]. They're wrong.”", source: "Kallaway" },
      { term: "Format: Personal experience", definition: "A first-person story setup.", example: "“When I was [context], I used [technique] to [result].”", source: "Kallaway" },
      { term: "Format: Problem", definition: "Agitates a known pain, then promises a fix.", example: "“If you struggle with [pain], this is one obvious fix.”", source: "Kallaway" },
      {
        term: "3-step hook formula (builder lines)",
        definition: "Kallaway's “mega tip”: a hook of 2–4 short lines that builds a curiosity loop. Line 1 Context lean-in, line 2 Scroll-stop interjection, line 3 Contrarian snapback. Each line makes them need the next one.",
        example: "1 “The Vegas Sphere has the biggest screen on earth.” 2 “But the screen is the least impressive part.” 3 “The real story is the audio.”",
        source: "Kallaway",
      },
      {
        term: "Context lean-in",
        definition: "Line 1. Give the topic in the first sentence so people can opt in or out, then lean them toward the common belief with common ground, a pain or benefit, a metaphor or a mind-blowing fact. Lead with their benefit or pain.",
        source: "Kallaway",
      },
      {
        term: "Scroll-stop interjection",
        definition: "Line 2. One short, stunning line that sets up the flip. It usually starts with a contrast word: But, However, Yet, Turns out.",
        source: "Kallaway",
      },
      {
        term: "Contrarian snapback",
        definition: "Line 3. Still on topic, but the opposite of where line 1 leaned. The bigger the honest shock, the stronger the snap. It must be true and pay off.",
        source: "Kallaway",
      },
      {
        term: "Hook starters (patterns that work)",
        definition: "Four starter lines from his own data: Transformation “Here's how to turn [before] into [after].” Impossibility “Here's how to make your [thing] so [quality] it's impossible to [skip / ignore].” Addiction “Here's how to get [your viewer] addicted to [the thing].” A new thing exists “[Company] just released [new thing] that [outcome].”",
        source: "Kallaway",
      },
      {
        term: "Power words (6 hook power words)",
        definition: "The anatomy of a strong spoken hook. Four are required (Subject, Action, Objective, Contrast), two are optional (Proof, Time). Proof and time can move to lines 2 and 3.",
        example: "“We (subject) grew (action) our SaaS from 0 to 100 customers (objective + contrast) again (proof) in 90 days (time).”",
        source: "Kallaway",
      },
      { term: "Power word: Subject", definition: "Who it is about: I, we, you, or a proper noun. Required.", source: "Kallaway" },
      { term: "Power word: Action", definition: "A verb: what happened. Required.", source: "Kallaway" },
      { term: "Power word: Objective", definition: "The end result. The more shocking and non-obvious, the better. Required.", source: "Kallaway" },
      { term: "Power word: Contrast", definition: "The base state vs the new state (0 → 100K). Often overlaps the objective. Required.", source: "Kallaway" },
      { term: "Power word: Proof", definition: "A word that proves it, like “again”. Matters more for education than entertainment. Optional.", source: "Kallaway" },
      { term: "Power word: Time", definition: "A time frame: “in 5 months”, “in 90 days”. Adds urgency. Optional.", source: "Kallaway" },
      {
        term: "Copy work (hook practice)",
        definition: "Take top hooks from outliers in your niche, label the six power-word slots in each, then swap in your topic. Do 10–30 a week to train your hook instinct.",
        source: "Kallaway",
      },
      {
        term: "Text hook",
        definition: "The big title text on screen in the first seconds. It is not your captions. Text is read faster than speech, so it must say the same thing as the spoken and visual hooks.",
        example: "“Founders sell first”.",
        source: "Kallaway",
      },
      {
        term: "Text hook rules",
        definition: "3–5 words, max 2 lines. On screen about 3 seconds, a third from the top, never over your face. No punctuation (quotes and parentheses are fine), no connector words (and, or, that, but, so…). Formula: the subject word + a pain reminder, a dream-outcome tease or a future change.",
        source: "Kallaway",
      },
      {
        term: "Key visual",
        definition: "The image people see in the first 2 seconds. Find it before you write the hook; if there is no good visual, manufacture one or drop the idea.",
        source: "Kallaway",
      },
      {
        term: "Visual hook categories",
        definition: "Five ways to make the first frame stop the scroll: Graphic / text overlay; Pattern interrupt / visual switch; Subject moves in or out of frame; VFX / transition; Striking visual selection. Principle: motion, colour, contrast, aligned with the words. Start simple: move yourself, the visual or the text.",
        source: "Kallaway",
      },
      { term: "Visual hook: Graphic / text overlay", definition: "A bold graphic or text on top of the video.", source: "Kallaway" },
      { term: "Visual hook: Pattern interrupt / visual switch", definition: "A sudden change of shot, angle or scene that breaks the feed's rhythm.", source: "Kallaway" },
      { term: "Visual hook: Subject moves in/out of frame", definition: "You walk into or out of the shot. The brain notices motion.", source: "Kallaway" },
      { term: "Visual hook: VFX / transition", definition: "A visual effect or a creative transition.", source: "Kallaway" },
      { term: "Visual hook: Striking visual selection", definition: "Simply choosing a very unusual or beautiful image.", source: "Kallaway" },
      {
        term: "Minimum viable visual",
        definition: "The least your first 2 seconds need: at least one of an attractive or unique-looking person, a recognisable person or brand, an atypical visual for the category, or an atypical layout.",
        source: "Kallaway",
      },
      { term: "MVV: Attractive or unique-looking person", definition: "A person people want to look at, or who looks different.", source: "Kallaway" },
      { term: "MVV: Recognizable person or brand", definition: "A face or logo people already know (Elon Musk, Apple).", source: "Kallaway" },
      { term: "MVV: Atypical visual for the category", definition: "Something unusual for your niche, like a founder video shot on a rooftop instead of an office.", source: "Kallaway" },
      { term: "MVV: Atypical layout", definition: "An unusual screen layout, like a split screen or text on a mirror.", source: "Kallaway" },
      { term: "Audio hook", definition: "The first sound they hear: music mood and sound effects. Part of LEGO brick 7.", source: "Kallaway" },
      {
        term: "Hook audit",
        definition: "Seven checks for the finished hook (Kallaway's 4 commandments, 4 S's and final questions, merged): Alignment, Speed to value, Clarity, Curiosity, Stakes, Relevance, 100% absorption.",
        source: "Kallaway",
      },
      { term: "Hook audit: Alignment", definition: "Visual, spoken and text hooks all say the same thing; each predicts the others.", source: "Kallaway" },
      { term: "Hook audit: Speed to value", definition: "The topic in 1–2 seconds and the first value in about 4 seconds (short) or 30–60 seconds (YouTube). No fluff openers.", source: "Kallaway" },
      { term: "Hook audit: Clarity", definition: "One subject, one question. The line can only mean one thing. No wordplay.", source: "Kallaway" },
      { term: "Hook audit: Curiosity", definition: "Am I curious enough to hear sentence two?", source: "Kallaway" },
      { term: "Hook audit: Stakes", definition: "Why should they care: a desired outcome (education) or a curiosity scenario (entertainment).", source: "Kallaway" },
      { term: "Hook audit: Relevance", definition: "“You/your”, not “I/me”. Need-to-have for the viewer, not nice-to-have.", source: "Kallaway" },
      {
        term: "Hook audit: 100% absorption",
        definition: "The viewer understands every word on the first listen: about 6th-grade words, active voice. Cut fluff, not clarity. Absorption rate is “the most important thing in content”.",
        source: "Kallaway",
      },
      {
        term: "Hook failure modes",
        definition: "Four reasons hooks fail: Delay (the topic arrives late), Confusion (too many words, passive voice, more than one meaning), Irrelevance (not about the viewer's problem), Disinterest (no contrast, so no curiosity).",
        source: "Kallaway",
      },
      {
        term: "Story structures (the 8)",
        definition: "Proven story shapes (LEGO brick 4): Personal narrative, Breakdown, Newscaster, Case-study explainer, Listicle, Problem-solver, Tutorial, and YouTube long-form.",
        source: "Kallaway",
      },
      {
        term: "Structure: Personal narrative",
        definition: "Hook → The problem I had → What I tried → Why it failed → What actually worked → If you have this problem… The hottest short-form format: one-of-one, AI can't copy it. Fits: Personal experience, Problem, Contrarian hooks.",
        source: "Kallaway",
      },
      {
        term: "Structure: Breakdown",
        definition: "Hook → Context / shock → What happened / how it works → Why it matters → Outro. Explains how something works. Fits: Secret reveal, Question, Comparison, Contrarian.",
        source: "Kallaway",
      },
      {
        term: "Structure: Newscaster",
        definition: "Hook → Full context → Your short take → Outro. For fresh news in your niche. Fits: Secret reveal, Question, Comparison, Contrarian, Problem.",
        source: "Kallaway",
      },
      {
        term: "Structure: Case-study explainer",
        definition: "Hook → The framework (2–4 parts) → Outro. A reflection on how someone got a result (analysis, not a how-to). Fits: Case study, Question, Comparison.",
        source: "Kallaway",
      },
      {
        term: "Structure: Listicle",
        definition: "Hook → Item 1 → Item 2 → Item 3 → Outro. 3–5 independent items: each stands alone. Fits: List, Problem.",
        source: "Kallaway",
      },
      { term: "Structure: Problem-solver", definition: "Hook → Problem (agitate) → Solution → Outro. One pain, one fix. Fits: Problem, Question, Contrarian.", source: "Kallaway" },
      {
        term: "Structure: Tutorial",
        definition: "Hook → Step 1 → Step 2 → Step 3 → Result + outro. Dependent steps toward one outcome (unlike a list, the steps need each other). Fits: Education.",
        source: "Kallaway",
      },
      {
        term: "Structure: YouTube long-form",
        definition: "Packaging (title locked + thumbnail concept) → Intro: confirm the click (~5 s) → Intro: the common belief → Intro: your contrarian take → Intro: proof + the plan → Point 1 (your second-best) + re-hook → Point 2 (your best) + re-hook → Points 3+ descending to a climax → Outro: recap + free dessert + native CTA. First payoff in 30–60 s, a re-hook every 60–90 s.",
        source: "Kallaway",
      },
      {
        term: "Visual format layouts",
        definition: "LEGO brick 5, the screen layout: Talking head + captions (you on camera), Green screen (you in front of a screenshot or image), Split screen (two videos side by side), POV vlog (filmed from your point of view, moving), In-the-world (filmed on location), Faceless text + B-roll (no face, only text over footage), Screen recording (your screen). Hold it constant while you learn.",
        source: "Kallaway",
      },
      {
        term: "Last line first (the last dab)",
        definition: "Write the ending before the middle. The last line should be memorable enough to repeat to a friend, and in shorts it loops back to the first line so people rewatch.",
        source: "Kallaway",
      },
      {
        term: "Outline insert",
        definition: "“Insert outline into script” turns the structure's blocks into ## headings in your script and pre-fills what you already wrote (hook lines, chosen title and thumbnail, last line).",
        source: "bishOS",
      },
    ],
    testing: [
      "Open a piece. Expected: the Video workflow panel shows 0/8 and step 1 is open.",
      "Tick all 6 Idea gate checks. Expected: a green note “This idea passes the gate.” and the counter 6/6 in green.",
      "Click Mark “Idea gate” done. Expected: step 1 folds, step 2 opens, the ring shows 1/8.",
      "In step 2, type a topic, a belief and a take. Click Save take to my vault. Expected: toast “Added to your contrarian vault”.",
      "Add a fact with Enter. Expected: it appears with score 50. Drag its slider to 80 and release: the list re-sorts and the chip turns green.",
      "Click Find shock facts. Expected: an AI box with up to 8 candidates and a verify warning. Click Add on one: it joins your list.",
      "In step 3, click the Contrarian format card. Expected: it shows a tick; the piece's hook type becomes Contrarian.",
      "Click Start from my belief → take. Expected: lines 1 and 3 fill from step 2; the Preview shows the hook and its word count.",
      "Type “If you want more leads” in line 1. Expected: the orange “If you…” warning.",
      "Click Use as the piece's hook. Expected: toast “Piece hook updated” and the chip “The piece's hook”.",
      "Type “How Founders Close, And Win!” in Text hook. Expected: tips for punctuation and the connector word “and”.",
      "Click Audit my hook. Expected: an AI box with 7 scores. Click Tick the checks that scored 7+: those audit rows get ticked.",
      "In step 4, pick Listicle, then Insert outline into script. Expected: toast “Outline added to your script” and ## headings in the Script section; the button now says “Outline is in your script”.",
      "Collapse the panel, reload the page. Expected: it stays collapsed.",
    ],
    tips: [
      "Spend your time on steps 1–3. A great idea with a great hook survives an average script; the reverse is not true.",
      "Write the hook in all 6 archetypes (AI) and pick the one that matches your best visual.",
      "Keep the four required power words green. Subject, action, objective, contrast: that is most of a hook.",
    ],
  },
  // ───────────────────────────────────────────────────────────────────────
  // 8. Video workflow, steps 5–8
  // ───────────────────────────────────────────────────────────────────────
  {
    id: "content-workflow-script-ship",
    group: "Content",
    title: "Video workflow 5–8: script, convert, packaging, post-mortem",
    summary:
      "Steps 5–8 of the Video workflow: a live script check with retention tricks, the conversion setup (trust and one CTA ramp), packaging for shorts or YouTube, and the post-mortem that turns this rep into a better next rep.",
    why:
      "A good idea still dies if people leave in the middle, if there is no ramp to your email list, or if nobody clicks. The post-mortem closes the loop: you find the weak brick and the app starts the next rep with your strong bricks held.",
    when: {
      daily: "Steps 5–7 while you write and before you publish. Step 8 after the 24h or 7d numbers are in.",
    },
    pages: [
      {
        route: "/content/[id] (Workflow step 5 · Script & retention)",
        title: "Step 5 · Script & retention",
        purpose: "Check the script live as you type, add word-level retention tricks, climb the dopamine ladder and audit the one-question chain.",
        elements: [
          {
            name: "Live script check",
            what: "Hint for shorts: “Short-form rules: loop opener every 20–30s, first value in ~4s.” For long videos: “Long-form rules: loop opener every 60–90s, first payoff in 30–60s.” Before you write: “Write the script in the Script section below. This step checks it live as you type.”",
          },
          { name: "Word, time and grade chips", what: "Word count, spoken time (≈ at 150 words a minute) and the reading grade (orange above grade 8)." },
          {
            name: "Check list (warn / tip / good)",
            what: "Live findings, warnings first: drop-off phrases; “and then” count; hedge words; contrast words (missing or good); loop openers needed vs found; sentence rhythm; reading level; too much I/me and too little you; too long for a short (over ~75 s). Orange triangle = warning, blue bulb = tip, green check = good.",
            how: "Edit the script in the Script section and watch the list update.",
          },
          {
            name: "Storylocks",
            what: "Hint: “Word-level retention tricks. ‘Looks done’ = spotted in your script.” Nine checks: Term branding, Embedded truths, Thought narration, Negative frames, Loop openers, Contrast words, But / therefore never “and then”, Jagged rhythm, Last line written first. A green “looks done” chip appears when the app spots one in your script. Counter n/9.",
            how: "Tick each lock you used.",
          },
          {
            name: "Dopamine ladder",
            what: "Hint: “Levels 1–4 are the message, 5–6 the messenger.” Six numbered buttons: Stimulation, Captivation, Anticipation, Validation, Affection, Revelation, each with a hint. Counter n/6.",
            how: "Click each level your script delivers. It turns green with a tick.",
          },
          {
            name: "One-question chain",
            what: "Hint: “Each line answers the last line's question and opens exactly one new one.” Button “Audit the question chain” (AI). Needs 3+ lines of script: “one sentence per line works best”.",
            how: "Click the button.",
          },
          {
            name: "One-question chain (AI box)",
            what: "A summary and “N lines to fix” (or “No broken links”). A timeline of your lines: each shows “Answers: …” and “Opens: …”, with orange chips “opens 0”, “opens 2+” or “chain broken” and a fix. “Only the first 45 lines were checked.” when the script is long. Then “Loop openers for this script”: 3 phrases with a copy button.",
            how: "Rewrite flagged lines. Copy a loop opener into your script.",
          },
        ],
      },
      {
        route: "/content/[id] (Workflow step 6 · Convert)",
        title: "Step 6 · Convert",
        purpose: "Set up how this piece turns attention into trust and emails: the funnel switches, trust rungs, one CTA ramp and its exact words.",
        elements: [
          {
            name: "The 4 funnel switches",
            what: "Hint: “They multiply: any switch at zero makes sales zero.” Four cards: 1 Bullseye signal, × 2 Trust, × 3 Clear ramp, × 4 Aligned offer.",
          },
          {
            name: "Trust ladder",
            what: "Hint: “Stack 2+ rungs in the video. Rung 1 is the strongest.” Eight checks (rung number + name + hint). Counter “n used · aim 2+” (green at 2).",
            how: "Tick the rungs this piece shows.",
          },
          {
            name: "CTA ramp",
            what: "Hint: “One off-ramp per video, tightly aligned with the topic.” Five chips: Lead magnet (email), Sales page, Call / DM, Follow / series, None this time. The ramp's hint shows below. With Lead magnet picked: “Your <brand> lead magnet: <name>”.",
            how: "Click one ramp.",
          },
          {
            name: "CTA text",
            what: "The exact words of your ask. The placeholder changes with the ramp, for example “Comment “PLAYBOOK” and I'll DM you the free template”.",
            how: "Type it, then click “Use as the piece's CTA” (it becomes “The piece's CTA”). It fills the Call to action field.",
          },
          { name: "Native embed note", what: "“Weave the offer in as the answer to the topic, not an ad break. e.g. ‘If you want the exact template I use for this, it's free below.’ Early and often, wherever it fits naturally.”" },
        ],
      },
      {
        route: "/content/[id] (Workflow step 7 · Packaging)",
        title: "Step 7 · Packaging",
        purpose: "Make sure the piece earns the click (YouTube) or the share (shorts). Short-form and long-form show different tools.",
        elements: [
          { name: "Clickbait yes, bait-and-switch never.", what: "A blue note at the top: “Bait, then give: the intro must confirm the click and pay it off early.”" },
          {
            name: "Short-form packaging (shorts and other formats)",
            what: "Hint: “Short form has no packaging step: the hook IS the package. These three still matter.” Checks: Custom cover; First caption line = curiosity title; Part of a series / grid makes sense. Counter n/3.",
            how: "Tick each one.",
          },
          { name: "First caption line", what: "Hint: “Written like a headline with a curiosity loop: it shows above the fold.” Example: “The $0 hiring trick nobody uses”.", how: "Type it." },
          {
            name: "Series",
            what: "Hint: “Bingeability: seeing part 4 makes a profile visitor go back for parts 1–3. Stack a buffer before you promise a daily series.” A series name and an episode number. Shows “On the cover: <series> · #N”.",
            how: "Type the series name and number.",
          },
          {
            name: "Title lab (Long video)",
            what: "Hint: “≥10 titles first, before anything else. Pick the one you'd bet your career on.” A counter n/10 (green at 10) and a Paddy Galloway chip. Each title shows its character count, live tips (over 60 characters, ALL CAPS, Title Case, SEO) and Use (or “In use”) and remove.",
            how: "Type a title and press Enter. Click Use on the best one.",
          },
          {
            name: "Chosen YouTube title",
            what: "Hint: “Trigger a desire loop: solve a pain, FOMO about missing the fix, or a benefit they want. Shorter wins.” The title field, live checks and the 5 title rules.",
            how: "Type or pick from the lab.",
          },
          {
            name: "Thumbnail brief",
            what: "Hint: “~5 concepts, not designs. Each ≤3 elements and adds to the title instead of repeating it.” A counter n/5. Each concept warns if it has more than 3 elements or repeats the title.",
            how: "Type a concept like “face + big number + arrow” and press Enter. Click Use on the best.",
          },
          {
            name: "Chosen thumbnail concept",
            what: "Hint: “Thumbnail → title → thumbnail → click. Readable at 1/16 size in dark mode, bottom-right corner clear.” A box (one element per line or comma) with the element count and a repeat warning.",
            how: "Write the concept.",
          },
          {
            name: "YouTube packaging checklist",
            what: "Seven checks: Title locked BEFORE scripting; Title triggers a desire loop; Thumbnail ≤3 elements, adds to the title (never repeats it); Readable at 1/16 size, in dark mode; 3 thumbnail variants for A/B test; Intro confirms the click in ~5s; First payoff in 30–60s.",
            how: "Tick each one.",
          },
          { name: "Big-video tests", what: "Paddy Galloway's four checks: Works for Core, Casual and New; Passes the 1-second glance test; Universal appeal inside your niche; A question you must click to answer.", how: "Tick each one." },
          { name: "The 45-second intro", what: "Hint: “60–70% can leave in the first seconds if the promise isn't confirmed.” Three checks: deliver on the promise in 10 seconds, intrigue with minimal context, flow straight into the video.", how: "Tick each one." },
          { name: "Stakes", what: "Hint: “Raise the stakes so leaving feels like a loss.” Chips: A doubter, A time limit, A reward, A punishment, Cost of not paying attention.", how: "Click the stakes your video uses." },
        ],
      },
      {
        route: "/content/[id] (Workflow step 8 · Post-mortem)",
        title: "Step 8 · Post-mortem",
        purpose: "After publishing: read the numbers, find the weak brick in the right order, write the fix and start the next rep. Long videos also predict their 1-of-10 rank before publishing.",
        elements: [
          { name: "Locked note (shorts)", what: "Before publishing: “Unlocks after you publish. Log the numbers (with the 3-second hold %) in Performance, then come back to find the weak brick.”" },
          {
            name: "Predict your 1-of-10 rank (Long video)",
            what: "Hint: “Before you publish: where will it rank among your last 10 uploads? Judge it against expectation, not your average.” Three boxes: Hour 1, Day 1, Week 1 (1–10). After publishing: “Actual now: #N of M · you predicted #P for day 1” (or a note that 3+ long videos with views are needed).",
            how: "Type your predictions before publishing.",
          },
          {
            name: "Prediction gap notes",
            what: "2+ places under your prediction: orange “Under expectation. Let the A/B test pick the thumbnail, then try the title… change it now.” At or above: green “don't touch it. Good data is better than no data.” 1 place under: blue “Don't change things constantly.” Always: “No data is better than bad data. Don't tinker with 10 title changes on day 1.”",
          },
          {
            name: "The numbers",
            what: "Tiles from the latest snapshot: Views, 3s hold (shorts) or CTR (long), Avg view, Follows, Leads. Then the 3s hold advice (shorts) or the 1-of-10 advice (long). Without numbers: a note to log them in Performance.",
          },
          {
            name: "Flop diagnosis",
            what: "Hint: “Diagnose a flop in this order. Tap the first one that fails: it marks that brick weak.” Three rows: 1 Was the topic validated?, 2 Was the angle non-obvious?, 3 Did the hook land? Each has a “This was it” button (it turns into an orange “Weak”).",
            how: "Click “This was it” on the first question that fails. It marks Topic, Angle or Hook structure as weak.",
          },
          {
            name: "Which brick was weak?",
            what: "Hint: “Compare each piece A vs B against the winner in your niche.” Seven chips: Topic, Angle, Hook structure, Story structure, Visual format, Key visuals, Audio.",
            how: "Click every brick that was weaker than the winner's.",
          },
          { name: "Fix for the next rep", what: "Hint: “Close 1–2 gaps per rep. Be egoless about it.” Example: “Show the key visual in the first second, not the third”.", how: "Type the one or two fixes." },
          { name: "Quote", what: "“The distance of iteration between reps is where the sauce is.” — Kane Kallaway." },
          {
            name: "Start next rep",
            what: "Creates a new piece “Next rep · <title>” at Brief, with the same brand, format, pillar and platforms. Note: “Same brand, format and pillar. Strong bricks held, the fix carried into the brief.”",
            how: "Click. The new piece opens; this step is marked done.",
          },
        ],
      },
    ],
    frameworks: [
      {
        term: "Script check (live linter)",
        definition: "The app reads your script as you type and flags retention problems, with no AI. It ignores ## headings and [placeholders].",
        source: "bishOS, based on Kallaway and Paddy Galloway",
      },
      {
        term: "Script check: “and then”",
        definition: "Linking beats with “and then” makes a flat list of events. Link them with “but” (conflict) or “therefore” (consequence) instead. The South Park writers' rule, which Kallaway calls the Dance.",
        example: "Weak: “We launched and then we got users.” Strong: “We launched. But nobody signed up. Therefore we called 50 people.”",
        source: "Kallaway (credits Trey Parker and Matt Stone)",
      },
      {
        term: "Script check: hedges",
        definition: "Hedge words (maybe, might, perhaps, probably, possibly, kind of, sort of, I think, I guess, could be) sound unsure and lose trust. Replace them with embedded truths.",
        source: "Kallaway",
      },
      {
        term: "Script check: contrast words",
        definition: "Contrast words (but, actually, instead, turns out, except, yet, however, although) create the zig-zag that keeps attention. No contrast word is a warning; having some is “good zig-zag”.",
        source: "Kallaway",
      },
      {
        term: "Script check: loop openers needed",
        definition: "The app estimates the spoken length and asks for one loop opener every ~25 seconds (shorts) or ~75 seconds (long videos), and counts the ones it finds.",
        source: "Kallaway",
      },
      {
        term: "Script check: rhythm",
        definition: "If all your sentences have a similar length, the script sounds flat. Mix short, medium and long sentences so the right edge of the script looks jagged.",
        source: "Kallaway (credits Gary Provost)",
      },
      {
        term: "Script check: reading level",
        definition: "A rough Flesch–Kincaid grade. Above grade 8 is a warning: simplify toward grade 6 for 100% absorption. Grade 8 or lower is “easy to absorb”.",
        source: "Kallaway (absorption), Flesch–Kincaid formula",
      },
      {
        term: "Script check: I/me vs you",
        definition: "Lots of I/me and little “you” makes it about you, not the viewer. Fine for a personal narrative; otherwise speak to them.",
        source: "Kallaway",
      },
      {
        term: "Script check: too long for a short",
        definition: "Over about 75 seconds is long for a short. Compress: is every line earning its place? Cut the middle first; that is where fluff lives.",
        source: "Kallaway",
      },
      {
        term: "Script check: drop-off phrases",
        definition: "Paddy Galloway's phrases where viewers leave: “at the end of the day”, “without further ado”, “welcome back”, “before we get started”, “make sure to subscribe”. Each one found is a warning: cut it.",
        source: "Paddy Galloway",
      },
      {
        term: "Storylocks",
        definition: "Word-level tricks that keep people watching. The app lists 9: Term branding, Embedded truths, Thought narration, Negative frames, Loop openers, Contrast words, But / therefore, Jagged rhythm, Last line written first.",
        source: "Kallaway",
      },
      {
        term: "Storylock: Term branding",
        definition: "Give your concept a name. An unknown name creates anticipation (“what is that?”) and makes the idea yours.",
        example: "“I call it the 3-email rule.”",
        source: "Kallaway",
      },
      {
        term: "Storylock: Embedded truths",
        definition: "Drop if / maybe / might. Speak with certainty: “when you…”, “the reason this works…”, “once you…”.",
        example: "Not “This might help you close more”, but “When you use this, you close more.”",
        source: "Kallaway",
      },
      {
        term: "Storylock: Thought narration",
        definition: "Say what the viewer is thinking, right after a big point. It feels personal and builds trust.",
        example: "“You're probably thinking: I don't have time for this.”",
        source: "Kallaway",
      },
      {
        term: "Storylock: Negative frames",
        definition: "People are about 2× more motivated to avoid pain than to gain. Turn positive advice into a warning.",
        example: "Not “How to grow on LinkedIn” but “This is killing your LinkedIn growth.”",
        source: "Kallaway",
      },
      {
        term: "Storylock: Loop openers",
        definition: "A re-hook phrase that closes one question and opens the next, so attention restarts. Every 20–30 seconds in shorts, every 60–90 seconds in long videos. The best ones contain a contrast word.",
        example: "“But that's not even the craziest part.” “Here's the problem.” “Which is exactly why…”",
        source: "Kallaway",
      },
      {
        term: "Storylock: Contrast words",
        definition: "The base layer under all other locks: but, actually, instead, turns out, except, yet. Split key sentences into A, then B. Don't overuse it.",
        source: "Kallaway",
      },
      {
        term: "Storylock: But / therefore, never “and then”",
        definition: "Alternate context and conflict (the Dance). Each beat should be linked by “but” or “therefore”.",
        source: "Kallaway",
      },
      { term: "Storylock: Jagged rhythm", definition: "Mix short, medium and long sentences, one per line.", source: "Kallaway" },
      { term: "Storylock: Last line written first", definition: "A memorable “last dab” that loops back to the first line. Write it before the middle.", source: "Kallaway" },
      {
        term: "“Looks done” detection",
        definition: "The app ticks nothing for you, but shows a green “looks done” chip when it spots a lock: contrast words found; a loop opener found; zero hedge words (embedded truths); no “and then” plus contrast words (but / therefore); varied sentence lengths (rhythm); the last line field is filled.",
        source: "bishOS",
      },
      {
        term: "Dopamine ladder",
        definition: "Six levels of attention and loyalty a viewer climbs. Levels 1–4 are the message; levels 5–6 are the messenger. The goal: seeing your face or name alone makes people expect value.",
        source: "Kallaway",
      },
      { term: "Ladder 1: Stimulation", definition: "Colour, motion and contrast in the first 0–2 seconds. The weakest, shortest level, but it stops the scroll.", source: "Kallaway" },
      {
        term: "Ladder 2: Captivation",
        definition: "An open question pops into their head. Ask it outright or imply it. It must be relevant to your avatar.",
        source: "Kallaway",
      },
      {
        term: "Ladder 3: Anticipation",
        definition: "They guess the answer. Give clues, then a head-fake: a surprise that contradicts their guess but still makes sense. The biggest dopamine spike.",
        source: "Kallaway",
      },
      { term: "Ladder 4: Validation", definition: "A non-obvious payoff closes the loop: the tip, the answer, the resolution.", source: "Kallaway" },
      {
        term: "Ladder 5: Affection",
        definition: "They like the messenger. Levers: look, energy, smiling, and the strongest one, actually solving their problem.",
        source: "Kallaway",
      },
      {
        term: "Ladder 6: Revelation",
        definition: "They realise you are a consistent source of value. Much easier with education than entertainment. It comes from non-obvious value delivered again and again.",
        source: "Kallaway",
      },
      {
        term: "One-question chain",
        definition: "Kallaway's script audit: the first line must open exactly ONE question in the viewer's head. Every next line answers that question and opens exactly one new one. Do that all the way down and the story is perfect. A line that opens no question is dead air; two questions cause confusion; a line that does not answer the last question breaks the chain.",
        example: "“Google just dropped a new model.” (Q: what can it do?) → “It can read a whole contract in seconds.” (Q: how do I use it?) → “Go to …”",
        source: "Kallaway",
      },
      {
        term: "Two dopamine hits",
        definition: "If a viewer gets two useful insights before they would leave, they are locked in. One, maybe. Zero, they bounce.",
        source: "Kallaway",
      },
      {
        term: "Funnel switches in a piece",
        definition: "In step 6 you check the four multiplied switches for this one video: is the pain signal clear in lines 1–2, is there trust, is there one clear ramp, is the offer aligned?",
        source: "Kallaway",
      },
      {
        term: "CTA ramp (in a piece)",
        definition: "The single off-ramp of this video. Picking Lead magnet shows your brand's lead magnet so the ask matches it. The ramp is copied to your next rep.",
        source: "Kallaway",
      },
      {
        term: "Short-form packaging",
        definition: "Short form has no separate packaging step: the feed serves the video, so the hook is the package. Three things still matter: a custom cover, a first caption line written as a curiosity title, and a series that makes the grid make sense.",
        source: "Kallaway",
      },
      { term: "Short packaging: Custom cover", definition: "Shares happen in DMs where only the cover shows. Design it.", source: "Kallaway" },
      {
        term: "Short packaging: First caption line = curiosity title",
        definition: "The first caption line shows above the fold. Write it like a headline with a curiosity loop.",
        example: "“The $0 hiring trick nobody uses”.",
        source: "Kallaway",
      },
      {
        term: "Short packaging: Part of a series / grid makes sense",
        definition: "A profile visitor should know what to click next. A numbered series makes them binge.",
        source: "Kallaway",
      },
      {
        term: "Series (bingeability)",
        definition: "A hard series is numbered (“Founder lessons #12”); a soft series repeats a format or opening line. Seeing part 4 makes people go back for parts 1–3. Stack a buffer before promising a daily series. The next rep copies the series and adds 1 to the number.",
        source: "Kallaway",
      },
      {
        term: "YouTube packaging checklist",
        definition: "Seven checks for long videos: title locked before scripting; title triggers a desire loop; thumbnail ≤3 elements that add to the title; readable at 1/16 size in dark mode (bottom-right corner clear for the timestamp); 3 thumbnail variants for an A/B test; intro confirms the click in ~5 s; first payoff in 30–60 s.",
        source: "Kallaway",
      },
      { term: "Packaging check: Title locked BEFORE scripting", definition: "Most effort while you are freshest, on the most important thing.", source: "Kallaway" },
      { term: "Packaging check: Title triggers a desire loop", definition: "Pain, FOMO or desire, or an unanswered question.", source: "Kallaway" },
      { term: "Packaging check: Thumbnail ≤3 elements", definition: "Adds to the title, never repeats it. Thumbnail → title → thumbnail → click.", source: "Kallaway" },
      { term: "Packaging check: Readable at 1/16 size, in dark mode", definition: "Most viewers use dark mode and small screens. Keep the bottom-right corner clear.", source: "Kallaway" },
      { term: "Packaging check: 3 thumbnail variants for A/B test", definition: "Test 3, then iterate around the winner with two new variants close to it.", source: "Kallaway / Paddy Galloway" },
      { term: "Packaging check: Intro confirms the click in ~5s", definition: "Clickbait yes, bait-and-switch never.", source: "Kallaway" },
      { term: "Packaging check: First payoff in 30–60s", definition: "Reorder in the edit if the best bit is late.", source: "Kallaway" },
      {
        term: "Title lab",
        definition: "Write at least 10 title variants before choosing. Each is checked live. Pick the one you would bet your career on.",
        source: "Paddy Galloway",
      },
      {
        term: "Thumbnail brief",
        definition: "About 5 thumbnail concepts in words, not designs. The app counts elements by lines, commas, semicolons or “+”, and warns when a concept shares 3+ meaningful words with the title (it repeats it).",
        source: "Paddy Galloway, bishOS",
      },
      { term: "Big-video tests (in a piece)", definition: "CCN fit, the glance test, universal appeal and “click to unpause”, ticked for this video.", source: "Paddy Galloway" },
      {
        term: "Post-mortem",
        definition: "The review after publishing. Read the numbers, diagnose a flop in order (topic, angle, hook), mark the weak LEGO bricks, and write 1–2 fixes for the next rep.",
        source: "Kallaway",
      },
      {
        term: "Weak bricks",
        definition: "The LEGO bricks of this piece that were weaker than the winner in your niche. They show on Iterate as “Weak: <brick>”. In the next rep you change the weak bricks and hold the strong ones.",
        source: "Kallaway",
      },
      { term: "Next fix", definition: "The 1–2 concrete changes for the next rep. Carried into the next rep's brief.", source: "Kallaway" },
      {
        term: "Next rep (Start next rep)",
        definition: "A new piece “Next rep · <title>” at Brief, same brand, format, pillar and platforms. Its brief lists the fix, the weak bricks, the held bricks and the lesson. Strong bricks are copied into its workflow: topic; angle with belief, take and emotion; archetype and hook format; structure; visual format; key visual; audio. The CTA ramp and bucket are always copied; a series gets the next number.",
        source: "Kallaway (hold and remix), bishOS",
      },
      {
        term: "Prediction windows (Hour 1, Day 1, Week 1)",
        definition: "You predict the 1-of-10 rank three times. After publishing, the app compares the actual rank with the prediction for the window you are in now (first 24 hours → Hour 1, first week → Day 1, later → Week 1).",
        source: "Paddy Galloway, bishOS",
      },
      {
        term: "Prediction gap rule",
        definition: "Actual rank 2+ places worse than predicted: change it now (thumbnail via A/B test first, then the title). At or better than predicted: don't touch it. 1 place worse: don't change things constantly; only make a big change if it falls well short.",
        source: "Paddy Galloway",
      },
      {
        term: "Distance of iteration",
        definition: "“The distance of iteration between reps is where the sauce is.” The improvement from one rep to the next matters more than any single video.",
        source: "Kallaway",
      },
    ],
    testing: [
      "Write a script with “and then” and “maybe” in the Script section, then open step 5. Expected: warnings for “and then” ×1 and 1 hedge word.",
      "Add “at the end of the day” to the script. Expected: a drop-off phrase warning credited to Paddy Galloway.",
      "Add “but” to a line. Expected: the Contrast words storylock shows “looks done”.",
      "Click three dopamine ladder levels. Expected: they turn green and the counter shows 3/6.",
      "With 3+ lines of script, click Audit the question chain. Expected: an AI box with a numbered timeline and 3 loop openers with copy buttons.",
      "In step 6, tick 2 trust rungs. Expected: “2 used · aim 2+” turns green.",
      "Pick Lead magnet, type a CTA and click Use as the piece's CTA. Expected: toast “Piece CTA updated” and the Call to action field shows it.",
      "On a short, open step 7. Expected: Short-form packaging with 3 checks, First caption line and Series. Type a series name and 3: “On the cover: <name> · #3”.",
      "Change the format to Long video, open step 7. Expected: Title lab, Chosen YouTube title, Thumbnail brief, the checklists and Stakes.",
      "Add a 70-character title in the Title lab. Expected: a warning about the length.",
      "On an unpublished short, open step 8. Expected: the locked note.",
      "Publish the piece, log 24h numbers, open step 8. Click “This was it” on question 3. Expected: it shows “Weak” and the Hook structure chip is selected.",
      "Type a fix and click Start next rep. Expected: toast “Next rep ready” and a new “Next rep · …” piece opens at Brief with the fix in its brief and strong bricks prefilled.",
    ],
    tips: [
      "Write one sentence per line. The script check, the storylocks and the question chain all work better.",
      "Make every loop opener carry a contrast word: “but”, “except”, “turns out”.",
      "Do the post-mortem within a day of the 24h numbers, while the video is fresh in your mind.",
    ],
  },
  // ───────────────────────────────────────────────────────────────────────
  // 9. Inspiration (/swipes): Library, Hooks, Watchlist
  // ───────────────────────────────────────────────────────────────────────
  {
    id: "content-inspiration",
    group: "Content",
    title: "Inspiration, hook library and watchlist",
    summary:
      "Inspiration (/swipes) is your swipe file. Save posts that stopped your scroll, break each one into the 7 LEGO bricks, then Remix it into your own piece. The Hooks tab keeps reusable hook templates. The Watchlist tab holds the creators you study for outliers.",
    why:
      "A saved post without “why it worked” is just a bookmark. Breaking outliers into bricks lets you copy what is proven (hook, structure, layout) and change only your topic and angle. That is the fastest way for a beginner to make videos that work.",
    when: {
      daily: "Check 2–3 watchlist creators. Log any 5×+ outlier with a one-line “why it worked”.",
      weekly: "Remix your best new outlier into a piece. Promote winning hooks to the library.",
      oneTime: "Add 10 creators to the watchlist. Add the 10 starter hooks.",
    },
    pages: [
      {
        route: "/swipes",
        title: "Inspiration: Library tab",
        purpose: "Browse, filter and act on your saved inspiration: remix it, start a piece from it, or save its hook.",
        elements: [
          { name: "Inspiration", what: "The page title. Subtitle: “Saved posts are raw material, not a collection. Break each one down when you save it, then steal the move.”" },
          { name: "Both / Personal / Company", what: "The brand filter, shared with the Content Studio.", how: "Click one." },
          { name: "Studio", what: "Opens the Content Studio.", how: "Click." },
          { name: "Save inspiration", what: "Opens the Save inspiration dialog.", how: "Click." },
          { name: "saved", what: "How many swipes you saved." },
          { name: "used in pieces · N%", what: "How many swipes you used in a piece (Use or Remix), and the share." },
          { name: "median outlier", what: "The median outlier score of your swipes (for example 4.2×)." },
          { name: "hooks in library", what: "How many hooks are in your hook library.", how: "Click to open the Hooks tab." },
          { name: "Library · Hooks · Watchlist", what: "The three tabs, each with a count.", how: "Click a tab. The address changes to ?tab=hooks or ?tab=watchlist." },
          { name: "Search hooks, creators, lessons", what: "Searches hook, creator, title, why it worked, what to steal and structure.", how: "Type a word." },
          { name: "All hook types / All formats / All platforms / All pillars", what: "Four filters. Pillars include “No pillar”.", how: "Pick values." },
          { name: "Newest / Outliers / Most used", what: "Sort order: newest first, highest outlier score first, or most used first.", how: "Click one." },
          { name: "Start your inspiration library", what: "Empty state with “Save your first one”." },
          { name: "Nothing matches", what: "Shown when filters hide everything. “Clear filters” resets them.", how: "Click Clear filters." },
          { name: "Swipe card: header", what: "Platform icon, @creator, views, and an outlier badge “N× outlier” (green at 5×+, blue at 2×+, grey below)." },
          { name: "Swipe card: hook", what: "The hook in quotes (or “No hook text yet.”), then chips: hook type, archetype, format, pillar." },
          { name: "Why it worked / Steal this", what: "A grey box with the reason it worked and the transferable move." },
          {
            name: "LEGO bricks strip",
            what: "Seven small segments: Topic, Angle, Hook, Story, Visual, Key vis., Audio. Dark = broken down. A lock = held when remixing (beginner hold by default). “n/7”. Empty: “Edit to break it into bricks, or use AI analyse.”",
            how: "Hover a segment to read the brick.",
          },
          {
            name: "Hook layers, bricks & structure",
            what: "An expander with Seen, Said, On screen, Structure, each filled brick (lock = held) and the Transcript.",
            how: "Click to open or close.",
          },
          { name: "Remix", what: "Opens the Remix dialog: hold the best bricks, remix the rest into a new piece.", how: "Click." },
          {
            name: "Use",
            what: "Starts a new piece at stage Idea, titled “Inspired by …” or “Riff on: …”, with a brief that copies why it worked, what to steal and the structure. The swipe is linked as inspiration.",
            how: "Click. The new piece opens.",
          },
          { name: "Save hook to library (bookmark)", what: "Shown when the swipe has a hook. Saves it to the hook library (source: From a swipe).", how: "Click." },
          { name: "Open original", what: "Opens the original post.", how: "Click." },
          { name: "used N×", what: "How many times you used this swipe." },
          { name: "Edit / Delete", what: "Edit opens the dialog with the swipe. Delete asks to confirm.", how: "Click." },
        ],
      },
      {
        route: "/swipes (Save inspiration dialog)",
        title: "Save inspiration",
        purpose: "Save a post and break it down while it is fresh: source, outlier score, hook layers, why it worked, and the 7 LEGO bricks.",
        elements: [
          { name: "Intro", what: "“Break it down now, while it's fresh. A saved post without why it worked is just a bookmark.”" },
          { name: "URL", what: "The post link. The platform is detected from it.", how: "Paste the link." },
          { name: "Platform / Creator", what: "The platform and the @handle.", how: "Pick and type." },
          {
            name: "From your watchlist",
            what: "Links the swipe to a watchlist creator. It fills the creator, platform, usual views and brand when they are empty. Disabled if your watchlist is empty (hint tells you where to add creators).",
            how: "Pick a creator.",
          },
          { name: "Views / Creator's usual views", what: "The post's views and the creator's average views.", how: "Type numbers like 1.2m and 80k." },
          {
            name: "Outlier banner",
            what: "Appears when both numbers are set: “N× outlier” with “5× or more: a real outlier, research it” (green), “above their usual, under the 5× research bar” (blue), or “about their usual” (grey).",
          },
          { name: "Title", what: "A short label (optional). An “AI” tag shows if AI filled it.", how: "Type." },
          { name: "Transcript or caption", what: "Hint: “Paste it and let AI pre-fill the breakdown. You confirm everything.”", how: "Paste the spoken words or the caption." },
          {
            name: "Analyse with AI",
            what: "Fills empty breakdown fields, empty bricks and the archetype from the transcript. Needs 15+ characters. It never overwrites what you typed. A toast says how many fields it filled.",
            how: "Click. Review every field marked “AI”.",
          },
          { name: "Hook", what: "“The line that stopped you”.", how: "Type." },
          { name: "Seen / Said / On screen", what: "The three hook layers: frame 1 (visual hook), first words (spoken hook), text overlay (text hook).", how: "Type each." },
          { name: "Hook type", what: "The 16 hook type chips.", how: "Click one." },
          { name: "Format / Pillar", what: "The post's format and your pillar for it.", how: "Pick." },
          { name: "Structure", what: "The beat structure, for example “Hook → Problem → 3 tips → CTA”.", how: "Type." },
          {
            name: "Why it worked *",
            what: "Required. Hint: “The reason, not the topic. This is what you'll reuse.” Turns red with “Required. One honest sentence is enough.” if you try to save without it.",
            how: "Write one honest sentence, for example “Opens on a specific number, then breaks a belief everyone holds”.",
          },
          { name: "What to steal", what: "“The transferable move”.", how: "Type." },
          { name: "For", what: "Both, Personal or Company.", how: "Click one." },
          {
            name: "7 LEGO bricks",
            what: "An expander with a counter n/7 and the archetype chip: “Explode the outlier into 7 pieces. Hold the world-class ones, remix the rest.” Fields: Topic, Angle, Hook structure, Story structure, Visual format, Key visuals, Audio (a lock marks the 3 beginner-hold bricks), plus “Hook archetype”.",
            how: "Click to open. Fill each brick in a short phrase.",
          },
          { name: "Beginner note", what: "“Beginners hold hook structure, story structure and visual format, and change topic + angle every rep.”" },
          { name: "Add “why it worked” to save. / Cancel / Save inspiration", what: "The footer. Save changes when editing.", how: "Click Save inspiration. Toast: “N× outlier saved” (5×+) or “Saved to your inspiration library”." },
        ],
      },
      {
        route: "/swipes (Remix dialog)",
        title: "Remix this outlier",
        purpose: "Hold the bricks that are world class, change the rest, and start your own piece from a proven outlier.",
        elements: [
          { name: "Header", what: "The outlier score (green at 5×+), the swipe's title or hook, and its archetype." },
          { name: "Instruction", what: "“Hold the bricks that are world class, remix the rest. Beginners: hold hook, story and visual format; change topic + angle every rep.”" },
          {
            name: "Brick toggles (7)",
            what: "One row per brick. Hold (dark, lock icon) or Remix (dashed, shuffle icon), with the brick's text or “Not broken down yet (…)”. Starts with the 3 beginner bricks held, plus bricks you held last time.",
            how: "Click a row to switch between Hold and Remix.",
          },
          { name: "You'll write new: …", what: "Lists the bricks you chose to remix." },
          { name: "Working title for your version", what: "Placeholder: “Your topic, your angle”.", how: "Type your title." },
          { name: "Brand / Format", what: "The brand and format of your new piece.", how: "Pick." },
          {
            name: "Cancel / Create remix",
            what: "Creates a piece at Brief. Held bricks are copied into its workflow (topic, angle, structure, visual format, key visual, audio), plus the archetype. Its Idea gate has “Validated by an outlier” ticked. The brief lists the source, the held bricks, the hook structure to reuse, why it worked and what to steal.",
            how: "Click Create remix. The new piece opens. Toast: “Remix started”.",
          },
        ],
      },
      {
        route: "/swipes?tab=hooks",
        title: "Hooks tab (hook library)",
        purpose: "Keep winning hooks as reusable templates, from your swipes, your own outliers and your own ideas.",
        elements: [
          { name: "Add a hook", what: "Hint: use [brackets] for the parts you swap, e.g. “I spent [time] doing [X] so you don't have to.” Fields: the hook text, “Type…”, “Note (optional)”, and Add.", how: "Type and click Add." },
          { name: "Search hooks", what: "Searches hook text and notes.", how: "Type." },
          { name: "Type filter chips", what: "All, each hook type you used, and Untyped, each with a count.", how: "Click one." },
          { name: "Hook row: text", what: "The hook.", how: "Click to edit it in place." },
          { name: "Source chip", what: "“From a swipe”, “Your outlier” (with an “open piece” link) or “Added”, plus the note." },
          { name: "Type (row select)", what: "Change or clear the hook type.", how: "Pick." },
          { name: "N uses", what: "Times you copied or inserted the hook." },
          { name: "Copy", what: "Copies the hook and counts a use.", how: "Click. Toast: “Hook copied · Counted as a use”." },
          { name: "Delete hook", what: "Removes it after a confirm.", how: "Hover, click the trash, confirm." },
          { name: "Your hook library is empty", what: "Empty state with “Add starter hooks” (10 templates)." },
          { name: "Tip line", what: "“In any piece, the Hook library button inserts these in one click.”" },
        ],
      },
      {
        route: "/swipes?tab=watchlist",
        title: "Watchlist tab",
        purpose: "Manage the creators you study, see who needs a check, and log outliers from them.",
        elements: [
          { name: "Your watchlist", what: "Your count out of 20–30, a bar, and chips: “N in the 10K–1M range”, “N over 1M”, “N checked today”. Text: start with ~10 that win in your space; grow to 20–30." },
          {
            name: "Who belongs here",
            what: "Six rules: Same content type. 10K–1M followers (micro 10–50K, small 50–250K, medium 250K–1M). Ignore over 1M. Small creators' outliers count most. Check daily, or 4–5× a week (log anything ≥5× their average with >2% engagement). Find them via your own list, who top creators follow, keyword search, or a database.",
          },
          { name: "Needs a check / Recently added / Most swipes", what: "Sort: longest unchecked first, newest first, or most swipes first.", how: "Click one." },
          { name: "Add creator", what: "Opens the creator dialog.", how: "Click." },
          {
            name: "Creator table",
            what: "Columns: Creator (name, profile link, notes), Platform, Followers (with a size tier chip), Avg views, Brand, Last checked (green when today), Swipes. On a phone, each creator is a card.",
          },
          { name: "Mark checked today (calendar icon)", what: "Records that you checked this creator today. Disabled once done today.", how: "Click. Toast: “Checked <name> today · Log any 5×+ outlier you found”." },
          { name: "Log an outlier (trend icon)", what: "Opens Save inspiration with this creator pre-filled (name, platform, usual views, brand).", how: "Click." },
          { name: "Edit / Remove", what: "Edit opens the creator dialog. Remove asks to confirm.", how: "Click." },
          { name: "Build your creator watchlist", what: "Empty state with “Add your first creator”." },
        ],
      },
    ],
    frameworks: [
      {
        term: "Swipe file",
        definition: "A library of content that worked, saved to learn from (“swipe” = borrow the move). In bishOS a swipe is useless without “why it worked”, so that field is required.",
        source: "Copywriting tradition; Kallaway (thumb-stop swipe folder)",
      },
      {
        term: "Why it worked",
        definition: "One sentence on the psychological reason a post worked: the reason, not the topic. This is what you reuse.",
        example: "“Opens on a specific dollar number, then breaks a belief every founder holds.”",
        source: "bishOS",
      },
      { term: "What to steal", definition: "The transferable move a founder could reuse in any topic.", example: "“Start with the result on screen before saying anything.”", source: "bishOS" },
      {
        term: "Hook layers (Seen, Said, On screen)",
        definition: "The three parts of a hook: Seen = the visual hook (frame 1), Said = the spoken hook (first words), On screen = the text hook (overlay). They must all say the same thing.",
        source: "Kallaway (hook alignment)",
      },
      {
        term: "The 7 LEGO bricks",
        definition: "Every short video idea breaks into seven pieces: Topic, Angle, Hook structure, Story structure, Visual format, Key visuals, Audio. Explode the best videos in your niche into these pieces, hold the world-class ones, improve the rest, and restack them into your own video.",
        source: "Kallaway",
      },
      { term: "Brick 1: Topic", definition: "One sentence: what it is about.", example: "“Why founders should do sales themselves first.”", source: "Kallaway" },
      { term: "Brick 2: Angle", definition: "The premise + the creator's take + the key facts.", example: "“A sales hire too early hides what customers really say.”", source: "Kallaway" },
      {
        term: "Brick 3: Hook structure",
        definition: "The hook as a reusable fill-in-the-blank pattern, across spoken, text and visual.",
        example: "“I spent [time] doing [X] so you don't have to” + text “[X] in [time]” + you walking into frame.",
        source: "Kallaway",
      },
      { term: "Brick 4: Story structure", definition: "The video type: breakdown, listicle, tutorial, personal narrative, case study, newscaster, problem-solver (+ its beats).", source: "Kallaway" },
      { term: "Brick 5: Visual format", definition: "The on-screen layout: green screen, split screen, talking head, POV vlog, in-the-world, faceless text…", source: "Kallaway" },
      { term: "Brick 6: Key visuals", definition: "What fills the layout: A-roll (you talking), B-roll (supporting footage) and graphics.", source: "Kallaway" },
      { term: "Brick 7: Audio", definition: "Music and sound effects.", source: "Kallaway" },
      {
        term: "Hold vs remix",
        definition: "When you remake an outlier, “hold” a brick means you copy it exactly; “remix” means you write your own. Like five-card poker: keep the good cards, redraw the others. Win with 6 of 7 proven bricks and be a first mover on one.",
        source: "Kallaway",
      },
      {
        term: "Beginner hold rule (in Remix)",
        definition: "The Remix dialog starts with hook structure, story structure and visual format held, and topic and angle changed. That is the rule for beginners: don't invent formats, stack proven bricks.",
        source: "Kallaway",
      },
      {
        term: "Use vs Remix",
        definition: "Use starts a light piece at Idea with the swipe's why, steal and structure in the brief. Remix starts a piece at Brief with the held bricks already filled in the workflow and the idea gate's outlier check ticked. Remix is the stronger path for outliers.",
        source: "bishOS",
      },
      {
        term: "Outlier score (on a swipe)",
        definition: "Views ÷ the creator's usual views, rounded to one decimal. 5× or more is a real outlier worth researching (green). 2–5× is above their usual but under the research bar (blue).",
        source: "Kallaway",
      },
      { term: "Median outlier", definition: "The middle outlier score of all your swipes. If it is low, you are saving nice posts, not real outliers.", source: "bishOS" },
      { term: "Used in pieces %", definition: "The share of swipes you actually turned into a piece. Inspiration is raw material; a low % means you collect without making.", source: "bishOS" },
      {
        term: "Hook library",
        definition: "Your saved hook templates. Hooks come from swipes (From a swipe), from your own pieces at ×1.2 your median (Your outlier), from AI variations, or that you added yourself (Added). Insert them in any piece with the Hook library button.",
        source: "bishOS",
      },
      {
        term: "Bracket templates",
        definition: "Write the parts you swap in [brackets], so one hook becomes a template.",
        example: "“The biggest mistake I made building [company]:”",
        source: "bishOS",
      },
      {
        term: "Starter hooks",
        definition: "Ten proven templates you can add in one click: “I spent [time] doing [X] so you don't have to.” · “Stop doing [common practice]. Do this instead.” · “The biggest mistake I made building [company]:” · “Everyone says [belief]. Here's why that's wrong.” · “[N] things I wish I knew before [milestone]:” · “How we got [result] in [timeframe] with [constraint].” · “Why do most [audience] fail at [goal]?” · “Last [day], a client told me something I can't stop thinking about.” · “Nobody talks about this part of [topic].” · “[Before state] → [after state]. Here's exactly what changed.”",
        source: "bishOS",
      },
      { term: "Hook uses", definition: "How many times you copied or inserted a hook. High-use hooks are your go-to patterns.", source: "bishOS" },
      {
        term: "Last checked",
        definition: "The day you last looked at a creator's new videos. Sort by “Needs a check” to see who you have ignored the longest.",
        source: "bishOS",
      },
      {
        term: "Log an outlier from a creator",
        definition: "From the Watchlist, the trend button opens Save inspiration already linked to that creator, with their usual views filled in, so the outlier score is computed as soon as you type the views.",
        source: "bishOS",
      },
    ],
    testing: [
      "Open /swipes. Expected: the stats strip, three tabs and the filter row.",
      "Click Save inspiration. Paste a TikTok link. Expected: Platform becomes TikTok.",
      "Type Views 900k and Creator's usual views 100k. Expected: a green “9× outlier” banner.",
      "Click Save inspiration without Why it worked. Expected: the field turns red with “Required.” and nothing is saved.",
      "Paste a transcript (15+ characters) and click Analyse with AI. Expected: empty fields fill with “AI” tags and a toast with the count; fields you typed are unchanged.",
      "Save. Expected: toast “9× outlier saved” and a card with a green 9× badge.",
      "On the card, click Remix. Toggle Topic to Hold, type a title, click Create remix. Expected: a new piece opens at Brief; its workflow step 2 shows the held topic; step 1 has “Validated by an outlier” ticked.",
      "On the card, click Use. Expected: a new piece at Idea titled “Inspired by …”.",
      "Open the Hooks tab with an empty library and click Add starter hooks. Expected: toast “10 starter hooks added”.",
      "Click Copy on a hook. Expected: toast “Hook copied” and its uses go up by 1.",
      "Open the Watchlist tab, click Add creator, add one with 2m followers. Expected: an “Over 1M” orange chip and “1 over 1M”.",
      "Click the calendar icon on a creator. Expected: toast “Checked … today” and Last checked turns green.",
      "Click the trend icon. Expected: Save inspiration opens with the creator and usual views filled.",
    ],
    tips: [
      "Save fewer, better swipes: only 5×+ outliers from 10K–1M creators, each with a real “why it worked”.",
      "Break every outlier into bricks when you save it. Remix is only as good as the bricks you filled.",
      "Promote your own ×1.2+ hooks from Analytics. Your own winners beat anyone else's.",
    ],
  },
  // ───────────────────────────────────────────────────────────────────────
  // 10. AI content coach (convex/aiContent.ts + convex/aiKallaway.ts)
  // ───────────────────────────────────────────────────────────────────────
  {
    id: "content-ai-coach",
    group: "Content",
    title: "AI content coach",
    summary:
      "Nine AI helpers sit inside the piece editor, the video workflow and the Save inspiration dialog. Each one returns a proposal in a box; nothing is saved until you click Use, Add, Insert or Accept.",
    why:
      "AI gets a draft to about 80–90% fast: hook options, shock facts, a tighter script, repurposed drafts, a hook audit. The last 10–20% (your voice, your take, the facts you can defend) stays yours. That is how Kallaway and Paddy Galloway both use AI.",
    when: {
      daily: "Use the helpers inside the steps you are doing: shock facts in step 2, archetypes and audit in step 3, the question chain in step 5, Tighten script before recording.",
      weekly: "Use Draft repurposed posts on the weekly hub. Use Analyse with AI when you save outliers.",
    },
    pages: [
      {
        route: "/content/[id] and /swipes (AI buttons)",
        title: "Where the AI helpers live",
        purpose: "A map of every AI button, what it sends to the AI and what comes back.",
        elements: [
          {
            name: "AI proposal box",
            what: "Every AI result appears in a grey box with a sparkle, its title and “· AI proposal, nothing saved until you accept”. While it works: grey loading bars. On error: an orange message and “Try again” (when available).",
            how: "Click × to dismiss. Click the action buttons inside to accept parts.",
          },
          { name: "10 hook variations (Hook section)", what: "Sends the piece's title, brand, format, pillar, current hook, brief and script excerpt. Returns 10 hooks with a type.", how: "Click Use on one, or the bookmark to save it to the library." },
          { name: "Simple explanation (Brief section)", what: "Sends the linked source note, or the title and brief. Returns a plain explanation, jargon to define, and 3 short posts.", how: "Insert into brief, Copy, or Create as seed." },
          { name: "Tighten script (Script section)", what: "Sends your script, the format and the CTA to keep. Returns a script about 20–30% shorter.", how: "Accept & replace, or Copy." },
          { name: "Draft repurposed posts (Script section)", what: "Sends the hub's script (or brief), title, brand, format and CTA. Returns 5–10 drafts (7 by default).", how: "Create as child piece, or Copy." },
          { name: "Find shock facts (step 2)", what: "Sends your topic, angle and brief notes, and the common belief. Returns 8 facts with a shock score and why.", how: "Verify, then Add." },
          { name: "Write it in all 6 archetypes (step 3)", what: "Sends your topic, your audience of one (from the Playbook), key visual, belief and take. Returns 6 hooks (3 lines + a text hook each).", how: "Click Use on one." },
          { name: "Audit my hook (step 3)", what: "Sends your spoken hook (builder lines, or the piece's hook), text hook, key visual and topic. Returns 7 scores, notes, failure modes, a verdict and a rewrite.", how: "Use rewrite, or Tick the checks that scored 7+." },
          { name: "Audit the question chain (step 5)", what: "Sends your script split into lines (headings and [placeholders] removed, first 45 lines). Returns, per line, the question it opens and answers, issues, 3 loop openers and a summary.", how: "Fix flagged lines. Copy loop openers." },
          { name: "Analyse with AI (Save inspiration)", what: "Sends the transcript or caption (up to 12,000 characters), URL, platform and creator. Returns the title, hook layers, hook type, format, structure, why it worked, what to steal, archetype and 7 bricks.", how: "Review the fields marked “AI”." },
        ],
        howTo: [
          "Fill the inputs the helper needs first (topic, hook, script or transcript).",
          "Click the AI button and wait for the box.",
          "Read critically. Accept only what is true and sounds like you.",
          "Edit the accepted text in your own words.",
        ],
      },
    ],
    frameworks: [
      {
        term: "AI proposal (nothing saved until you accept)",
        definition: "The AI helpers never write to your data. They return a proposal; you decide what to insert. Dismissing the box loses nothing.",
        source: "bishOS",
      },
      {
        term: "Creator context",
        definition: "Most helpers send a short context about you: your name, role and company from your Profile, “a startup co-founder building a personal brand and company content with very little time”, and your pillars. Fill your Profile and pillars for better results.",
        source: "bishOS",
      },
      {
        term: "AI model",
        definition: "The helpers use the AI model set for the app, through OpenRouter. If the key is missing you see “AI isn't configured yet (OPENROUTER_API_KEY is missing).”; if the service is busy, “The AI is busy right now. Try again in a minute.”",
        source: "bishOS",
      },
      {
        term: "Hook variations (AI)",
        definition: "10 hooks for the first 2 seconds / first line, in plain, specific words: no clickbait, no emojis, no hashtags. It mixes types (curiosity, contrarian, result, question, mistake, myth, list, story, how-to, before/after) and leans toward the type you tagged.",
        source: "bishOS",
      },
      {
        term: "Repurposed drafts (AI)",
        definition: "Cuts one hub into 5–10 platform-native posts (hub and spoke). Each carries ONE idea, opens with a strong hook and ends with a light CTA. The mix: short video scripts (hook + 3 beats + CTA, about 45 seconds), LinkedIn or X text posts, one carousel (slide by slide) and one X thread. Needs 40+ characters of script or brief.",
        source: "bishOS (GaryVee / Justin Welsh repurposing)",
      },
      {
        term: "Tighten script (AI)",
        definition: "A sharp script editor: keeps your voice and structure, cuts filler, hedges and repetition, sharpens the first line, keeps one idea and a clear CTA. Aims for about 20–30% shorter without losing substance. Needs 30+ characters.",
        source: "bishOS",
      },
      {
        term: "Simple explanation (AI, Feynman)",
        definition: "Turns a note into a plain explanation a 12-year-old can follow (120–200 words), a list of jargon to define or learn, and exactly 3 short posts (60–120 words) with angles TIL, mistake and myth-bust. Needs 20+ characters of note or brief.",
        source: "Feynman technique; learning in public",
      },
      {
        term: "Shock facts (AI, Law of Interesting)",
        definition: "8 candidate facts or contrarian takes for your topic, each with a shock score (0–100) and why it is shocking but believable. It aims for the sweet spot, prefers facts you could defend, and is told never to invent precise statistics. You must verify every fact before using it.",
        source: "Kallaway",
      },
      {
        term: "Archetype hooks (AI)",
        definition: "Your topic written in all 6 archetypes with the 3-step formula: lean (topic first, toward the common belief), interjection (usually a contrast word), snapback (the true, on-topic flip), plus a 3–5 word text hook with no punctuation or connector words. Lines are ideally under 14 words, the whole hook under ~5 seconds, about 6th-grade level, “you” over “I”. Needs a topic of 4+ characters.",
        source: "Kallaway",
      },
      {
        term: "Hook audit (AI)",
        definition: "A strict auditor scores your hook 0–10 on alignment, speed, clarity, curiosity, stakes, relevance and absorption, names the failure modes present (delay, confusion, irrelevance, disinterest), gives a one-line verdict, and writes one improved 3-step rewrite with a text hook. Checks scoring 7+ can be ticked in one click. Needs 8+ characters.",
        source: "Kallaway",
      },
      {
        term: "Question chain audit (AI)",
        definition: "Checks the one-question chain line by line: the question each line opens, what it answers, and flags lines that open 0 questions (dead air), 2+ questions (confusion) or don't answer the previous one (broken chain). The last line may just close the loop. It also suggests 3 loop openers for your script. Needs 3+ lines; checks up to 45.",
        source: "Kallaway",
      },
      {
        term: "Swipe analysis (AI)",
        definition: "Reverse-engineers why a post worked from its transcript or caption: a short title, the hook line, the three hook layers, the hook type, the format, the beat structure, one sentence on why it worked, one on what to steal, the archetype, and the 7 LEGO bricks. It only fills empty fields.",
        source: "Kallaway (LEGO bricks), bishOS",
      },
      {
        term: "AI to ~90%, the last 10% is you",
        definition: "Kallaway lets AI get a draft to about 90% and edits the rest by hand; Paddy Galloway says AI gets you 80% and “the 20% is always still human”. Hooks and takes written only by AI sound like everyone else.",
        source: "Kallaway / Paddy Galloway",
      },
    ],
    testing: [
      "Open a piece with a title and click 10 hook variations. Expected: a box “Hook variations · AI proposal…” with grey bars, then up to 10 hooks.",
      "Click Use on one. Expected: toast “Hook updated”; the Hook box changes.",
      "Type a brief of 30+ characters and click Simple explanation. Expected: an explanation, jargon chips and 3 drafts. Click Create as seed: toast “Seed created”.",
      "Write a 30+ character script and click Tighten script. Expected: the new word count and “Accept & replace”. Click it: toast “Script replaced”.",
      "In step 2 with a topic, click Find shock facts. Expected: an orange verify warning and up to 8 scored facts.",
      "In step 3, click Write it in all 6 archetypes. Expected: up to 6 cards. Click Use: the builder lines fill.",
      "Click Audit my hook. Expected: a verdict, 7 scores with bars and an Improved rewrite.",
      "In step 5 with 3+ lines, click Audit the question chain. Expected: a numbered timeline and loop openers.",
      "In Save inspiration, paste a transcript and click Analyse with AI. Expected: fields with “AI” tags.",
      "Turn off your network and click any AI button. Expected: an orange error in the box, with Try again where available.",
    ],
    tips: [
      "Give the AI good inputs: a one-sentence topic, your belief and take, and a filled Profile and pillars.",
      "Never publish an AI fact you have not checked. A wrong number kills trust faster than a slow hook.",
      "Use AI for options, not decisions. Generate many, then choose with the checklists.",
    ],
  },
];
