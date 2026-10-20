/**
 * Guide content — the Mind group (Notes, Learning, Library, Recall, AI helpers)
 * plus Delegation and Energy & Wellbeing (System group).
 * Pure data: only `import type`, so Node can load it with --experimental-strip-types.
 */
import type { GuideSection } from "../types";

export const sections: GuideSection[] = [
  // ═══════════════════════════════════════════════════════════════════════
  // NOTES
  // ═══════════════════════════════════════════════════════════════════════
  {
    id: "notes",
    group: "Mind",
    title: "Notes",
    summary:
      "Notes is your second brain. You capture quick thoughts, turn them into one-idea notes in your own words, and link them to each other with a reason.",
    why:
      "Good ideas get lost when they live only in your head or in random chats. Notes keeps them in one place. Linked notes become reusable thinking: you find them fast, and they turn into recall cards, posts, tasks and better decisions.",
    when: {
      daily:
        "Capture any idea with the Fleeting button (10 seconds). Before your evening shutdown, clear the Process inbox: keep each thought as an idea, turn it into a task, or discard it. Nothing should stay older than 48 hours.",
      weekly:
        "Run Review mode once (10 notes, about 10 minutes). Act on any “Suggest maps” card. Add a “why” to every link that has none.",
      oneTime:
        "Write 3–5 idea notes about your business (offer, pricing, ideal client). Link them with [[ ]] and write why they connect. Set a learning area on notes that belong to one.",
    },
    pages: [
      {
        route: "/notes",
        title: "Notes — list, graph and review",
        purpose:
          "See all your notes, process quick captures, spot clusters that need a map, see your knowledge as a graph, and test yourself on what you wrote.",
        elements: [
          {
            name: "Notes (page header)",
            what: "The page title with a short rule: one idea per note, in your own words. Type / in a note for blocks and [[ to link notes — and say why they link.",
          },
          {
            name: "New note",
            what: "Creates an empty note called “Untitled note” and opens it.",
            how: "Click New note in the top bar. Rename the title first, then write.",
          },
          {
            name: "Fleeting",
            what: "Creates a quick-capture note called “Quick thought” with type Fleeting and status Inbox, and opens it.",
            how: "Click Fleeting, type the thought, and leave. It waits in the Process inbox until you process it (within 48 hours).",
          },
          {
            name: "List / Graph / Review",
            what: "Switches between three views: List (a table of notes), Graph (a map of how notes link) and Review (test yourself on your notes).",
            how: "Click one of the three buttons.",
          },
          {
            name: "All · Fleeting · Source · Idea · Map · Project · Daily",
            what: "Type filter chips. Each chip shows how many notes have that type. Notes with no type count as Idea. Hover a chip to see what the type means. Hidden in Review view.",
            how: "Click a chip to show only that type. Click it again (or click All) to show everything.",
          },
          {
            name: "Process inbox",
            what: "A box that lists your fleeting (and Inbox-status) notes, oldest first. The count chip turns orange when some are older than 48 hours, and the hint tells you how many. It only appears when the inbox is not empty.",
            how: "Work through each row with Keep as idea, Turn into task or Discard.",
          },
          {
            name: "Title (rename as you keep it)",
            what: "The title field on each inbox row.",
            how: "Rewrite the title as one clear idea before you keep it, e.g. “Clients buy outcomes, not hours”.",
          },
          {
            name: "Age chip (just now · 5h · 3d · process me)",
            what: "Shows how old the fleeting note is. Under 1 hour = “just now”, under 48 hours = hours, after that = days plus “process me” in orange.",
          },
          {
            name: "Keep as idea",
            what: "Turns the note into an Idea note with status Processed (and saves your new title). Gives +2 XP, once per note.",
            how: "Click it when the thought is worth keeping. Open the note later to write it out in your own words.",
          },
          {
            name: "Turn into task",
            what: "Shows a life-area picker. “Create task” makes a task (status Not started, priority Medium) in that life area, copies the note text into the task description, then deletes the note. +2 XP.",
            how: "Click Turn into task, choose a life area (empty = your first life area), then click Create task. Click Cancel to go back.",
          },
          {
            name: "Discard",
            what: "Deletes the fleeting note. Letting go also counts as processing (+2 XP). There is no confirm step.",
            how: "Click Discard for thoughts that no longer matter.",
          },
          {
            name: "Open",
            what: "Opens the full note so you can rewrite it before deciding.",
          },
          {
            name: "Suggest maps",
            what: "Appears when 5 or more notes keep linking to each other but no Map of Content covers them (the “mental squeeze point”). Shows up to 6 suggestions. Map and Daily notes are not counted.",
            how: "Read each suggestion and decide: create a map or skip it.",
          },
          {
            name: "N linked notes around “title”",
            what: "The size of the cluster and its hub (the most-connected note). Chips list up to 14 note titles; “+N” means more.",
          },
          {
            name: "Map title",
            what: "The name for the new map. It is pre-filled with the most common tag in the cluster (if 2+ notes share it) or the hub title, plus “— map”.",
            how: "Edit the name before you click Create map.",
          },
          {
            name: "Create map",
            what: "Creates a Map note (status Processed) that lists every note in the cluster as a [[link]], with an intro line and an “Open questions” section. It gets the most common life area of those notes. The new map opens.",
            how: "Click Create map, then add one line under each link on how the notes connect.",
          },
          {
            name: "Not now",
            what: "Hides that suggestion until you reload the page.",
          },
          {
            name: "Notes table",
            what: "One row per note, newest first. Columns: Title, Type, Life area, Tags, Links, Updated.",
            how: "Click any row to open the note.",
          },
          {
            name: "Title column",
            what: "The note title. A paperclip icon means it has attachments. A green megaphone means you made it public (it became a content seed).",
          },
          {
            name: "Type column",
            what: "The note type chip. Unprocessed fleeting notes older than 48 hours also show an orange “48h+” chip.",
          },
          {
            name: "Life area column",
            what: "The life area the note belongs to, or “—”.",
          },
          {
            name: "Tags column",
            what: "The note's tags as small grey labels.",
          },
          {
            name: "Links column",
            what: "How many other notes this note links to with [[ ]], or “—”.",
          },
          {
            name: "Updated column",
            what: "A date for the note (today it shows the day the note was created).",
          },
          {
            name: "All life areas (graph filter)",
            what: "In Graph view: shows only notes of one life area.",
            how: "Pick a life area from the dropdown. Pick “All life areas” to reset.",
          },
          {
            name: "N notes · N links",
            what: "In Graph view: how many notes and links are on screen.",
          },
          {
            name: "Zoom out · zoom % · Zoom in · Reset view",
            what: "Graph zoom controls (40% to 300%). Reset view goes back to 100% and the centre.",
            how: "Click the – or + magnifier, or the square icon to reset.",
          },
          {
            name: "Graph canvas",
            what: "Each dot is a note. Bigger dots have more links. Dot colour = life area colour. Lines are links. Hovering a dot highlights it and its neighbours and fades the rest.",
            how: "Drag a dot to move it. Drag the empty background to pan. Click a dot (without dragging) to open the note.",
          },
          {
            name: "Graph legend",
            what: "A colour key for the life areas on screen, plus the hint “drag node to move · drag background to pan · click to open”.",
          },
          {
            name: "Review mode",
            what: "In Review view the page explains: each note's body is hidden; recall it from the title, then reveal. Practice testing beats rereading. Below it is the note review card (see Recall → Notes tab for every element).",
            how: "Click Review, read the title, say or jot what the note says, press Space to reveal, then press 1 (Hard) or 2 (Easy).",
          },
          {
            name: "✦ notes assistant",
            what: "A round floating button (bottom right) on every Notes page. It opens a chat called “notes assistant” that can create notes, append text to a note, or answer questions about your notes. It always shows a Confirm button before it saves anything.",
            how: "Click ✦. Pick a model chip (gpt-oss, Owl, Nemotron, Hunyuan), click an example prompt or type your own, press Enter. Click Confirm on the proposed action, or Cancel. The trash icon clears the conversation; X closes the panel.",
          },
        ],
        howTo: [
          "When an idea pops up, click Fleeting, type one line, and go back to work.",
          "Once a day, open Notes and clear the Process inbox: Keep as idea, Turn into task, or Discard.",
          "Open each kept idea and rewrite it in your own words, one idea per note.",
          "Link it to 1–3 related notes with [[ ]] and write why they connect.",
          "When a “Suggest maps” card appears, create the map and add a line under each link.",
          "Once a week, switch to Review and test yourself on 10 notes.",
        ],
      },
      {
        route: "/notes/[id]",
        title: "A single note (editor)",
        purpose:
          "Write one idea well: give it a type, a status and a summary, link it with reasons, attach files, and turn it into recall cards or a content seed.",
        elements: [
          {
            name: "Notes › title (breadcrumb)",
            what: "Shows where you are. Click “Notes” to go back to the list.",
          },
          {
            name: "Title",
            what: "The note title. It saves when you click outside the field. Other notes link to this note by this exact title.",
            how: "Write the title as a full idea, e.g. “Price anchoring makes the middle plan look cheap”.",
          },
          {
            name: "Momentum",
            what: "Opens a small “Moved the needle” box: choose Impact 1–5, write why (optional), then click “Add to Momentum”. The note is logged as a win on the Momentum page. A small number shows how many times it was added.",
          },
          {
            name: "Edit / Preview",
            what: "Switches between writing mode and reading mode. A new empty note opens in Edit mode.",
            how: "Click Preview to read with formatting and clickable links. Click Edit (or click the preview) to write.",
          },
          {
            name: "Delete (trash icon)",
            what: "Deletes the note right away and returns to the list. There is no confirm step.",
          },
          {
            name: "Note type chips (Fleeting · Source · Idea · Map · Project · Daily)",
            what: "Sets what kind of note this is. Hover a chip to read its meaning. Choosing Fleeting puts the note in the Inbox. Moving a note away from Fleeting changes Inbox to Processed.",
            how: "Click one chip. Only one can be active.",
          },
          {
            name: "Note status",
            what: "A dropdown: No status, Inbox (not processed yet), Processed (in your own words, linked), Evergreen (mature, reused often).",
            how: "Move a note to Evergreen when you have used it several times and it is polished.",
          },
          {
            name: "Learning area",
            what: "Links the note to a learning area (or “No learning area”). Linked notes show up first when you draft cards in that area, review mode can filter by area, and a public seed from this note goes to the area's content pillar.",
          },
          {
            name: "Open area",
            what: "Appears when a learning area is set. Opens that learning area.",
          },
          {
            name: "Public seed",
            what: "A green chip that shows the note was turned into a content seed with “Make it public”.",
          },
          {
            name: "Summary",
            what: "A short box above the text: “the gist in one or two lines, in your own words (top layer)”. It saves when you click outside. Review mode shows it after you reveal; AI cards use it too.",
            how: "Write the main point in 1–2 lines after you finish the note.",
          },
          {
            name: "Note editor",
            what: "The writing area (placeholder: “Write, / for blocks, [[ to link a note…”). It saves on its own about 0.7 seconds after you stop typing.",
            how: "Type / for the block menu: Text, Heading 1, Heading 2, Bullet list, Numbered list, To-do, Divider, Upload PDF / doc / image. Type [[ to pick another note by title; the link is saved when the title matches a note (capital letters do not matter).",
          },
          {
            name: "Preview",
            what: "The formatted note. [[Links]] are clickable. If a linked note does not exist yet, clicking it creates that note and opens it.",
          },
          {
            name: "Attachments · Upload",
            what: "Files attached to the note (PDF, doc, image…). Each row shows the file name (click to open) and an X to remove it. Empty: “No files attached.”",
            how: "Click Upload (or use the Upload item in the / menu) and choose a file.",
          },
          {
            name: "Learn & share",
            what: "A card with two buttons: Recall cards and Make it public. Below it: “N recall cards from this note →” (opens Recall → Browse) or the hint “Test yourself on this note, or turn it into a content seed.”",
          },
          {
            name: "Recall cards",
            what: "Opens the “Create recall cards” dialog: AI drafts 3–6 question → answer cards from this note; you approve each one; they join your daily Recall queue.",
            how: "Click “Draft 5 cards with AI” (or “Write by hand”). Edit or untick cards, use “Add another” if needed, then click “Add N cards”. Cancel closes without saving.",
          },
          {
            name: "Keep this card (checkbox) · Question · Answer · X",
            what: "Each proposed card in the dialog. Untick to skip it, edit the text, or remove it with X. Nothing is saved until you click Add.",
          },
          {
            name: "Make it public / Public",
            what: "Opens the “Make it public” dialog that turns this private note into a content seed for your personal brand. After that the button shows “Public”.",
          },
          {
            name: "From your note",
            what: "In the Make it public dialog: the note title, plus an “Already public” chip if a seed exists.",
          },
          {
            name: "Draft a simple explanation (AI)",
            what: "The Feynman step. AI writes a simple explanation (up to 150 words), lists jargon you still lean on, writes a hook and 3 short post ideas: TIL, Mistake I made, Myth-bust.",
            how: "Click it and wait a few seconds. If AI fails, you can still plant the seed without a draft.",
          },
          {
            name: "Simple explanation · TIL · Mistake I made · Myth-bust",
            what: "Pick rows. The one you click becomes the Seed draft text.",
            how: "Click the version you like best, then edit it in Seed draft.",
          },
          {
            name: "Jargon you still lean on",
            what: "Orange chips with words the explanation could not avoid. These are your learning gaps.",
            how: "Click “Add to “Things I don't know”” to add them to the note's learning area gaps list. (Only shown when the note has a learning area.)",
          },
          {
            name: "Hook (first line)",
            what: "Optional. The first line of the post — what makes someone stop scrolling.",
          },
          {
            name: "Seed draft",
            what: "Optional. Saved as the content piece's script. Leave it empty to start from the note itself.",
          },
          {
            name: "Create content seed",
            what: "Creates a content piece in Content Studio (stage Seed, brand Personal, format text post, pillar from the learning area) and marks the note public. The footer reminds you: notes stay private; this only creates a draft seed. If a seed already exists, it tells you and does not create a second one.",
            how: "Click it. On the “Seed planted” screen click “Open Content Studio” or “Done”.",
          },
          {
            name: "AI",
            what: "A card with two buttons. “Summarize” writes 3–5 bullet points and one key takeaway. “Find related” lists up to 5 of your notes that truly relate, each as a clickable [[link]] with a reason. The result shows in a box; it is not saved into the note.",
            how: "Click a button and wait. If you see “AI unavailable (rate limit). Try again.”, wait a minute and retry. Copy useful lines into the note or Summary.",
          },
          {
            name: "Organize",
            what: "Project, life area, section and tags for this note.",
          },
          {
            name: "Project (No project)",
            what: "Links the note to a project. When you pick a project, the note takes the project's life area and the section is cleared.",
          },
          {
            name: "Life area",
            what: "A dropdown (No life area / your areas). When a project is set, it shows the project's life area as read-only text instead.",
          },
          {
            name: "Section (No section)",
            what: "A section inside the note's life area.",
          },
          {
            name: "Tags · Add tag…",
            what: "Tag chips with an X to remove. The “Add tag…” field adds a new tag.",
            how: "Type a tag and press Enter.",
          },
          {
            name: "Linked notes",
            what: "The notes this note links to with [[ ]]. If some links have no reason, an orange line says “N links without a “why” — the reason is the knowledge.” Empty: “Type [[ in the note to link others.”",
          },
          {
            name: "Why does this connect?",
            what: "The reason field under each linked note (up to 280 characters). It has an orange underline while empty. Saving shows the toast “Link reason saved”. If you delete the [[link]] from the text, its reason is removed too.",
            how: "Type one sentence, e.g. “Both explain why clients pay for certainty”, then press Enter or click away.",
          },
          {
            name: "Backlinks",
            what: "Notes that link to this note. Click one to open it. Empty: “No notes link here yet.”",
          },
          {
            name: "✦ notes assistant",
            what: "The same floating AI chat as on the Notes list (see above).",
          },
        ],
        howTo: [
          "Pick the type (most notes are Idea or Source).",
          "Write the idea in your own words. Use / for headings and lists.",
          "Type [[ to link 1–3 related notes, then fill “Why does this connect?” for each.",
          "Write a 1–2 line Summary at the top.",
          "Set the life area, learning area and tags.",
          "For important notes: click Recall cards to make 3–6 cards, or Make it public to plant a content seed.",
        ],
      },
    ],
    frameworks: [
      {
        term: "Zettelkasten",
        definition:
          "German for “slip box”. A note system where each note holds one idea in your own words, and notes are linked to each other. Over time the links create new ideas for you.",
        example:
          "Your note “Clients buy outcomes, not hours” links to “Price anchoring” and “Retainer vs project pricing”. When you write your pricing page, the thinking is already done.",
        source: "Niklas Luhmann; Sönke Ahrens, How to Take Smart Notes",
      },
      {
        term: "Second brain",
        definition: "A trusted place outside your head where you store ideas, so your mind is free to think instead of remember.",
        example: "Instead of trying to remember a client insight from a call, you capture it as a fleeting note and process it tonight.",
        source: "Tiago Forte, Building a Second Brain",
      },
      {
        term: "Fleeting note",
        definition: "A quick, rough capture of a thought. It is temporary. You process it within 48 hours: keep it as an idea, make it a task, or throw it away.",
        example: "In a taxi you type “offer a 2-week paid pilot instead of free trial” with the Fleeting button.",
        source: "Sönke Ahrens, How to Take Smart Notes",
      },
      {
        term: "Source note",
        definition: "Notes on a book, video, podcast or article — written in your own words, not copied. Also called a literature note.",
        example: "Your notes on $100M Offers: the value equation in your words, with one example from your agency.",
        source: "Sönke Ahrens (literature notes)",
      },
      {
        term: "Idea note",
        definition: "The main kind of note: one idea, fully written in your own words, so you understand it months later without the source. Notes with no type count as Idea.",
        example: "“A paid pilot filters out tyre-kickers and still lets the client test us.”",
        source: "Sönke Ahrens (permanent notes)",
      },
      {
        term: "Map note (Map of Content)",
        definition: "A hub note that links many related notes and explains how they fit together. It helps you find and think with a whole topic.",
        example: "A “Pricing — map” note links your 8 notes on anchoring, retainers, pilots and discounts, with one line on each.",
        source: "Nick Milo, Linking Your Thinking (LYT)",
      },
      {
        term: "Project note",
        definition: "Working notes for one project: decisions, ideas, open questions. They can be messy and are tied to the project's life.",
        example: "“Website relaunch — working notes” with the sitemap ideas and copy drafts.",
        source: "Tiago Forte (PARA)",
      },
      {
        term: "Daily note",
        definition: "A simple log of one day. Daily notes are left out of Review mode and map suggestions.",
        example: "“Oct 20 — calls with 2 leads, pricing objection came up twice.”",
        source: "Common practice in Obsidian / LYT",
      },
      {
        term: "Inbox (note status)",
        definition: "The note is not processed yet. Fleeting notes start here and appear in the Process inbox.",
        example: "A fleeting “Quick thought” from this morning.",
        source: "bishOS",
      },
      {
        term: "Processed (note status)",
        definition: "The note is written in your own words and linked. It is part of your knowledge base and can appear in Review mode.",
        example: "After “Keep as idea”, the note becomes Idea + Processed.",
        source: "bishOS (Zettelkasten processing)",
      },
      {
        term: "Evergreen (note status)",
        definition: "A mature note you keep improving and reuse often — in posts, pitches and decisions.",
        example: "Your note on your positioning statement, used in 5 posts and the sales deck.",
        source: "Andy Matuschak (evergreen notes)",
      },
      {
        term: "Wiki link [[ ]]",
        definition: "Type two square brackets and a note title to link to that note. The link works when the title matches (capital letters do not matter).",
        example: "In your pricing note you write “see [[Paid pilot]]”.",
        source: "Wiki / Obsidian convention",
      },
      {
        term: "Link reason (the “why”)",
        definition: "One sentence that says why two notes connect. The link alone is weak; the reason is the real knowledge.",
        example: "Link “Paid pilot” → “Loss aversion”, reason: “Paying a little makes the client commit and use the pilot.”",
        source: "Luhmann / Ahrens",
      },
      {
        term: "Backlink",
        definition: "A link that comes into this note from another note. Backlinks show where an idea is used.",
        example: "Your “Loss aversion” note shows backlinks from “Paid pilot” and “Annual billing discount”.",
        source: "Wiki / Obsidian convention",
      },
      {
        term: "Mental squeeze point",
        definition: "The moment a topic has so many linked notes that it feels hard to hold in your head. That is the right time to make a Map of Content. bishOS suggests a map when 5+ notes link to each other without a map.",
        example: "You have 6 linked notes on hiring a VA — “Suggest maps” offers “VA — map”.",
        source: "Nick Milo, Linking Your Thinking",
      },
      {
        term: "Progressive summarization",
        definition: "Summarize a note in layers, so future-you can get the point in seconds. In bishOS the Summary box is the top layer: 1–2 lines.",
        example: "A long source note on a podcast gets the summary “Sell the outcome in the first sentence of every call.”",
        source: "Tiago Forte",
      },
      {
        term: "Collector's fallacy",
        definition: "The feeling that saving something means you know it. Collecting is not learning; processing and using is.",
        example: "50 saved LinkedIn posts in a folder you never open teach you nothing. Two processed idea notes do.",
        source: "Christian Tietze (zettelkasten.de)",
      },
      {
        term: "48-hour rule",
        definition: "Process every fleeting note within 48 hours, while you still remember the context. After 48 hours bishOS marks it “48h+” and “process me”.",
        example: "A Monday idea from a client call is kept, tasked or discarded by Wednesday morning.",
        source: "Sönke Ahrens (process within a day or two)",
      },
      {
        term: "Review mode",
        definition: "Practice testing on your own notes: you see only the title, you recall what the note says, then you reveal it and rate it Hard or Easy. It uses processed notes with 40+ characters (not Inbox, not Daily, not “Untitled note”).",
        example: "You see “Paid pilot” and say the 3 reasons out loud before revealing.",
        source: "Dunlosky et al. 2013 (practice testing); Roediger & Karpicke 2006",
      },
      {
        term: "Hard / Easy (note review rating)",
        definition: "After revealing a note, Hard (key 1) means you could not recall it well; Easy (key 2) means you could. Hard notes and the notes you reviewed longest ago come back first next time.",
        example: "You mark “Retainer pricing” Hard — it comes back first next week. Consider making recall cards from it.",
        source: "bishOS",
      },
      {
        term: "Content seed",
        definition: "A draft content idea in Content Studio (stage Seed) made from a note. It is not published; you test it later as a short post.",
        example: "Your “Paid pilot” note becomes a seed with the hook “I stopped offering free trials. Here's why.”",
        source: "bishOS / learn in public (swyx)",
      },
      {
        term: "XP (experience points)",
        definition: "Small points bishOS gives for good habits. In Notes: +2 XP for each fleeting note you process (keep, task or discard), once per note.",
        example: "Clearing 5 fleeting notes tonight gives +10 XP.",
        source: "bishOS",
      },
      {
        term: "Momentum",
        definition: "A log of things that moved the needle, with an impact score 1–5. Any note can be added.",
        example: "You add the note with your new offer idea to Momentum with impact 4.",
        source: "bishOS",
      },
    ],
    testing: [
      "Go to /notes and click Fleeting. Expected: a note “Quick thought” opens; the Fleeting chip is active and the status says Inbox.",
      "Type one line, then click “Notes” in the breadcrumb. Expected: “Process inbox” shows the note with the chip “just now”.",
      "Click “Keep as idea”. Expected: a toast “Kept as an idea note” with +2 XP; the row disappears; in the table the note now has the Idea chip.",
      "Create another fleeting note. In the inbox click “Turn into task”, pick a life area, click “Create task”. Expected: toast “Turned into a task”; the note is gone; the task is in /tasks with the note text as description.",
      "Create a third fleeting note and click Discard. Expected: toast “Let it go”; the note is deleted.",
      "Open an idea note. In Edit mode type [[ and pick another note. Expected: “Linked notes” lists it with the orange warning “1 link without a “why””. Type a reason and press Enter. Expected: toast “Link reason saved”; the warning disappears.",
      "Open the other note. Expected: its Backlinks card lists the first note.",
      "Click Preview and click a [[Link]] to a title that does not exist. Expected: a new note with that title is created and opens.",
      "Type a Summary, click outside, reload the page. Expected: the summary is still there.",
      "Click Upload and choose a PDF. Expected: it shows under Attachments; back in the list the title has a paperclip icon.",
      "Switch the list to Graph. Expected: dots for notes and a line between linked notes; “N notes · N links” is correct; zoom buttons change the %; clicking a dot opens the note.",
      "Create 5 notes that link to each other in a chain. Expected: a “Suggest maps” card appears. Click “Create map”. Expected: toast “Map of Content created”; a Map note opens listing all 5 as [[links]]; the suggestion disappears.",
      "Switch to Review (you need processed notes with 40+ characters). Press Space, then 1 or 2. Expected: the progress bar moves; after the last note you see “Notes reviewed: N” and “New set”.",
      "In a note click Summarize. Expected: 3–5 bullets and a key takeaway appear in the AI box (or “AI unavailable (rate limit). Try again.”).",
      "Click Recall cards → “Draft 5 cards with AI”, untick one, click “Add 4 cards”. Expected: a toast; the Learn & share card shows “4 recall cards from this note →”; Recall's due count goes up by 4.",
      "Click “Make it public” → “Draft a simple explanation (AI)”, pick a post version, click “Create content seed”. Expected: “Seed planted”; the note shows the “Public seed” chip; the list shows a green megaphone; the seed is in Content Studio.",
      "Leave a fleeting note unprocessed for 48 hours. Expected: the table shows an orange “48h+” chip and the inbox shows “2d · process me”.",
    ],
    tips: [
      "The trash icon on a note deletes it at once — there is no undo.",
      "Write titles as full statements, not topics: “Paid pilots filter tyre-kickers” beats “Pilots”.",
      "One idea per note. If you need “and” in the title, split it into two notes.",
      "A link without a reason is half a link. Always fill “Why does this connect?”.",
      "Use the ✦ notes assistant to append meeting notes to a running “Work Log” note.",
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════
  // LEARNING
  // ═══════════════════════════════════════════════════════════════════════
  {
    id: "learning",
    group: "Mind",
    title: "Learning",
    summary:
      "Learning turns a topic into a project with a goal you can check. You map the skills, log practice, track what you don't know yet, and turn what you learn into idea notes, recall cards and posts.",
    why:
      "Founders learn under time pressure. A target performance and a weekly minutes budget keep learning tied to real results. Practice, self-testing and explaining build skill — rereading and highlighting do not. And everything you learn can become content.",
    when: {
      daily:
        "After each practice block, log the session (2 minutes): kind, minutes, what you practised, gaps found, and “What can you now explain?” in 1–2 lines.",
      weekly:
        "In the weekly review, look at the “This week” strip on /learning: minutes vs target, sessions, ideas explained, gaps found/closed, recall retention. Close one gap. Move one skill forward.",
      monthly: "Pause areas you are not pushing right now, mark finished ones Done, and re-check each target performance.",
      oneTime:
        "Create 1–2 learning areas with a target performance, a why and weekly minutes. Fill the Map from the Ultralearning template. Build the skill tree (AI can suggest one). Link a goal and a content pillar.",
    },
    pages: [
      {
        route: "/learning",
        title: "Learning — all learning areas",
        purpose: "See every learning area at a glance and how this week's practice compares with your targets.",
        elements: [
          {
            name: "Learning (page header)",
            what: "Title and the rule: learn by doing, test yourself, then teach it. Practice turns into skill — and into content.",
          },
          {
            name: "Recall",
            what: "Opens the Recall page. An orange chip shows how many cards are due now.",
          },
          {
            name: "Learning area",
            what: "The + button that opens the “New learning area” dialog.",
          },
          {
            name: "Practice this week (ring)",
            what: "A ring with the % of your total weekly target done (all active areas, Monday–Sunday), plus practice time “of” the target, or “no target yet”.",
          },
          {
            name: "Sessions",
            what: "How many practice sessions you logged this week.",
          },
          {
            name: "Ideas explained",
            what: "How many sessions this week produced an idea note (you filled “What can you now explain?”).",
          },
          {
            name: "Gaps (found / closed)",
            what: "Gaps added this week / gaps closed this week, across all areas.",
          },
          {
            name: "Recall",
            what: "Recall reviews this week, with the retention % (answers that were not “Again”).",
          },
          {
            name: "Learning area card",
            what: "One card per area. Shows a colour dot, the name, a status chip if Paused or Done, and the life area below.",
            how: "Click the card to open the area.",
          },
          {
            name: "Target performance (on the card)",
            what: "The goal line with a target icon. If empty: “Set a target performance — what will you be able to do?”",
          },
          {
            name: "Minutes ring",
            what: "Minutes practised this week over the weekly target (e.g. 45/120m). Colour shows progress. Grey when no target is set.",
          },
          {
            name: "Skills (bar)",
            what: "Skill progress: “N/M solid · P%”, or “no skills mapped”.",
          },
          {
            name: "Active resources",
            what: "Up to 2 books/courses in progress, each with a small progress bar. If none: “N queued — start one” or “Nothing in progress”.",
          },
          {
            name: "N active · max 2",
            what: "An orange warning chip when more than 2 resources are active in this area. Finishing 1–2 at a time beats starting many.",
          },
          {
            name: "Card chips (due · sessions · gaps · done · cards)",
            what: "Recall cards due (orange when > 0), sessions this week, open gaps, finished resources, and total cards (shown when nothing is due).",
          },
          {
            name: "Paused & done",
            what: "A second group below with areas that are Paused or Done (shown lighter).",
          },
          {
            name: "Start your first learning area",
            what: "Empty state when you have no areas, with a Learning area button.",
          },
        ],
        howTo: [
          "Click “+ Learning area” and fill the dialog.",
          "Open the area and finish the setup (Map, skills, links).",
          "Each week, check the rings: are you on pace for your weekly minutes?",
        ],
      },
      {
        route: "/learning",
        title: "New learning area (dialog)",
        purpose: "Create a learning area as a project with a performance goal.",
        elements: [
          {
            name: "Tip box",
            what: "Reminds you: treat it like a project with a performance goal — what will you be able to DO? Then map skills, practise and test yourself.",
          },
          {
            name: "Name",
            what: "The area name, e.g. “Short-form video”. Required.",
          },
          {
            name: "Target performance",
            what: "Something you can do and check, e.g. “Record a 60-second explainer with no notes.”",
          },
          {
            name: "Why it matters",
            what: "Your reason, e.g. “Content is our cheapest lead source and I'm the face of it.”",
          },
          {
            name: "Weekly minutes",
            what: "Your weekly time budget. Quick chips 1h, 2h, 3h, 5h, or type minutes (steps of 15). Default 2h (120 minutes).",
          },
          {
            name: "Life area",
            what: "The life area it belongs to. bishOS pre-selects an area whose name contains “learn” or “content”. You can pick None.",
          },
          {
            name: "Cancel · Create area",
            what: "Create area saves it (status Active), shows a toast and opens the new area page.",
          },
        ],
      },
      {
        route: "/learning/[id]",
        title: "Learning area — header and Overview tab",
        purpose: "Set the goal, the why and the learning map, watch this week's minutes, track your gaps and link the area to goals and content.",
        elements: [
          {
            name: "Area name",
            what: "The title. Click it to rename.",
          },
          {
            name: "Learning › name (breadcrumb)",
            what: "Click “Learning” to go back to all areas.",
          },
          {
            name: "Active · Paused · Done",
            what: "The area status. Done shows a celebration. Paused and Done areas move to “Paused & done” on /learning.",
          },
          {
            name: "Review N due / Recall",
            what: "Opens Recall filtered to this area. Shows “Review N due” (filled button) when cards are due.",
          },
          {
            name: "This week (tile)",
            what: "Practice time this week with a small ring, “of” your target, or “set a target”.",
          },
          {
            name: "Skills (tile)",
            what: "Skill progress % and “N/M solid”.",
          },
          {
            name: "Recall (tile)",
            what: "Cards due now and total cards in this area.",
          },
          {
            name: "Gaps (tile)",
            what: "Open gaps and the total minutes ever practised in this area.",
          },
          {
            name: "Overview · Skills · Practice · Resources · Cards",
            what: "The tabs. Numbers show how many skills, sessions, resources and cards the area has.",
          },
          {
            name: "Target performance",
            what: "What you will be able to DO — make it checkable. Click to edit.",
          },
          {
            name: "Why",
            what: "Your reasons. They keep you going when it gets hard. Click to edit.",
          },
          {
            name: "Map",
            what: "A free-text plan: what to learn (concepts, facts, procedures), how (direct practice, drill, feedback) and the benchmark. [[Links]] open notes (or create them).",
            how: "Click Edit, write, click away (it saves). Click Preview to read.",
          },
          {
            name: "Start from the Ultralearning template",
            what: "Shown when the Map is empty in Edit mode. Fills in the headings: What to learn (Concepts, Facts, Procedures), How (Direct practice, Drill, Feedback from), Benchmark.",
          },
          {
            name: "This week (ring + Weekly target)",
            what: "A big ring with minutes vs target, a “Weekly target (minutes)” field, and a status line: “Target hit — anything more is a bonus.”, “Xm to go”, or “A small weekly budget beats big intentions.”",
            how: "Type a new number and click away to save it.",
          },
          {
            name: "Week bars",
            what: "One bar per day, Monday to Sunday. Green = practised. The dashed line is the daily pace you need for your weekly target. Today's letter is bold. Hover a bar for exact minutes.",
          },
          {
            name: "Things I don't know",
            what: "Your gaps list (Feynman's notebook). Write where your explanation stalls, then close it.",
          },
          {
            name: "Gap checkbox",
            what: "Tick to mark a gap closed (toast “Gap closed”). It moves to the closed list.",
          },
          {
            name: "Gap text",
            what: "Click the text to edit it. The X (on hover) deletes the gap.",
          },
          {
            name: "Add a gap… (Enter)",
            what: "Type a gap and press Enter. Duplicates are ignored. Gaps also come in from “Gaps found” in practice and from jargon in “Make it public”.",
          },
          {
            name: "Show N closed / Hide",
            what: "Shows closed gaps (crossed out). Untick one to reopen it.",
          },
          {
            name: "Links",
            what: "Connects learning to the rest of bishOS.",
          },
          {
            name: "Life area",
            what: "The life area of this learning area.",
          },
          {
            name: "Goal it serves",
            what: "Pick a goal (12-week and annual goals are labelled). Dropped goals are hidden.",
          },
          {
            name: "Content pillar (learn in public)",
            what: "Seeds you make from this area's notes land in this pillar in Content Studio. If you have no pillars, a link sends you to Content Studio.",
          },
          {
            name: "Delete learning area",
            what: "Asks to confirm. Deletes the area, its skills and its practice log. Notes, cards and resources are kept (just unlinked).",
          },
        ],
      },
      {
        route: "/learning/[id]",
        title: "Learning area — Skills tab",
        purpose: "Break the area into skills you can practise and track each one from “To learn” to “Solid”.",
        elements: [
          {
            name: "Skill progress",
            what: "The overall % (Solid = 100%, Practicing = ⅔, Learning = ⅓, To learn = 0, averaged), “N of M solid”, a coloured bar by status and a legend with counts.",
          },
          {
            name: "Suggest a skill map (AI)",
            what: "AI proposes 4–7 top-level skills, each with 2–5 sub-skills, from foundation to advanced. It reads your target, why, map and gaps, and skips skills you already have.",
            how: "Click it and wait (“Mapping the subject…”).",
          },
          {
            name: "Suggested skill map",
            what: "The AI proposal with a checkbox per skill and sub-skill. Only ticked skills are added. Unticking a parent also skips its sub-skills.",
            how: "Untick what does not fit, then click “Add selected” (toast “N skills added to the tree”) or “Dismiss”.",
          },
          {
            name: "Map the skill first",
            what: "Empty state when there are no skills yet.",
          },
          {
            name: "Expand / Collapse arrow",
            what: "Shows or hides a skill's sub-skills.",
          },
          {
            name: "Status dot",
            what: "A coloured circle: empty grey (To learn), small blue dot (Learning), bigger orange dot (Practicing), green tick (Solid).",
            how: "Click it to move to the next status. After Solid it goes back to To learn. Reaching Solid shows a small celebration.",
          },
          {
            name: "Skill name",
            what: "Click to rename. Top-level skills are bold; Solid skills are greyed.",
          },
          {
            name: "N/M (sub-skill count)",
            what: "How many sub-skills are Solid out of all sub-skills.",
          },
          {
            name: "Skill status",
            what: "A dropdown to set the status directly: To learn, Learning, Practicing, Solid.",
          },
          {
            name: "Add sub-skill (+)",
            what: "Opens a field under the skill: “Sub-skill… (Enter to add, Esc to close)”.",
          },
          {
            name: "Move up · Move down",
            what: "Changes the order among sibling skills.",
          },
          {
            name: "Delete",
            what: "Asks to confirm. If the skill has sub-skills, they move up one level. Practice sessions linked to it stay (unlinked).",
          },
          {
            name: "Add a top-level skill… · Add",
            what: "Adds a new skill at the top level, e.g. “Write hooks”.",
          },
        ],
      },
      {
        route: "/learning/[id]",
        title: "Learning area — Practice tab",
        purpose: "Log practice sessions. Credit goes to practice, recall and explaining — not rereading.",
        elements: [
          {
            name: "Log a session",
            what: "The form to record one practice block.",
          },
          {
            name: "Practice · Project · Study · Recall · Teach",
            what: "The session kind. A hint under it explains each one (e.g. Practice: drill the skill directly — the highest-value minutes).",
          },
          {
            name: "Minutes",
            what: "Quick chips 10, 15, 25, 45, 60, 90 or a custom number (1–600). Default 25.",
          },
          {
            name: "Skill (optional)",
            what: "Which skill you practised, or “Whole area”. Sub-skills are indented with ↳.",
          },
          {
            name: "What did you practise?",
            what: "A short description, e.g. “Recorded 3 takes of a 60-second explainer on pricing”.",
          },
          {
            name: "Gaps found",
            what: "One gap per line. They are added to “Things I don't know” (a toast tells you how many). Drill your weakest point next time.",
          },
          {
            name: "What can you now explain?",
            what: "Explain what you learned in your own words, as if to a smart 12-year-old. It is saved as an Idea note (status Processed, tag “learning”, linked to this area). Its first sentence becomes the title.",
          },
          {
            name: "Log session",
            what: "Saves the session. Toast “Practice logged · 25m <area>” with +10 XP. Sessions of 45+ minutes get confetti.",
          },
          {
            name: "Idea note saved",
            what: "A green box after logging (only when you filled “What can you now explain?”). “Open note” opens the idea note. “Make it public” opens the content-seed dialog.",
          },
          {
            name: "This week",
            what: "The week bars (Monday–Sunday) with the daily pace line, and minutes of target in the hint.",
          },
          {
            name: "History",
            what: "Your sessions, newest first (up to 60). Each shows the day (Today, Yesterday…), kind, minutes, skill, what you practised and “Gaps:”.",
          },
          {
            name: "Idea note link · Public / Make it public →",
            what: "Under a session that created an idea note: the note title (click to open), and either a green “Public” chip or “Make it public →”.",
          },
          {
            name: "Delete session (trash icon)",
            what: "Asks to confirm. Removes the session and its XP. The idea note stays.",
          },
          {
            name: "No sessions yet",
            what: "Empty state: practice and recall earn credit here — rereading and highlighting don't.",
          },
        ],
      },
      {
        route: "/learning/[id]",
        title: "Learning area — Resources tab",
        purpose: "Manage the books, courses and videos for this area only.",
        elements: [
          {
            name: "Keep 1–2 active at a time…",
            what: "The rule line: finish, write takeaways, then turn them into cards. An orange chip shows “N active” when more than 2 are active.",
          },
          {
            name: "Library",
            what: "Opens the full Library page.",
          },
          {
            name: "Resource",
            what: "Opens “Save a resource” with this area already selected.",
          },
          {
            name: "Queued · Active · Done groups",
            what: "Resources grouped by status, each with a colour dot and count. Dropped ones are hidden.",
          },
          {
            name: "Resource card",
            what: "Same card as in the Library (see Library). Click it to open the resource drawer.",
          },
          {
            name: "Show N dropped / Hide dropped",
            what: "Shows or hides the Dropped group.",
          },
          {
            name: "Done bar",
            what: "A green bar showing the share of this area's resources that are done.",
          },
          {
            name: "No resources for this area",
            what: "Empty state with a Resource button.",
          },
        ],
      },
      {
        route: "/learning/[id]",
        title: "Learning area — Cards tab",
        purpose: "See, create and generate the recall cards for this area.",
        elements: [
          {
            name: "Cards in this area",
            what: "The card browser filtered to this area (filters, search, edit, suspend, reset, delete). See Recall → Browse tab for every control.",
          },
          {
            name: "Generate cards from a note",
            what: "Pick a “Source note” (notes of this area are listed first; only notes with 20+ characters). AI drafts 3–6 cards; tick the ones worth keeping.",
          },
          {
            name: "New card",
            what: "Question (front) and Answer (back). The area is locked to this one. Ctrl+Enter or “Add card” saves.",
          },
        ],
      },
    ],
    frameworks: [
      {
        term: "Learning area",
        definition: "A topic you treat like a project: a target performance, a weekly time budget, a skill tree, practice sessions, resources, recall cards and a gaps list.",
        example: "“Sales calls” with the target “Run a discovery call and book a next step without a script.”",
        source: "Scott Young, Ultralearning",
      },
      {
        term: "Target performance",
        definition: "What you will be able to DO when you have learned it — something you can test, not “know more about X”.",
        example: "Not “learn video”, but “Record a 60-second explainer with no notes in under 3 takes.”",
        source: "Scott Young, Ultralearning (directness)",
      },
      {
        term: "Ultralearning",
        definition: "A method for learning hard skills fast and on your own: map the subject first, practise the real thing (directness), drill your weakest point, test yourself, get feedback.",
        example: "To learn cold email, you write 10 real emails a week (directness) and drill subject lines (drill).",
        source: "Scott Young, Ultralearning",
      },
      {
        term: "Map (learning map)",
        definition: "Your plan for the area: the concepts, facts and procedures to learn, how you will practise, who gives feedback, and the benchmark that proves you can do it.",
        example: "Concepts: hooks, retention. Procedures: script → record → edit. Benchmark: 3 videos above 1,000 views.",
        source: "Scott Young, Ultralearning (metalearning)",
      },
      {
        term: "Weekly minutes target",
        definition: "A small, fixed weekly time budget for the area. A small weekly budget beats big intentions.",
        example: "120 minutes a week for “Short-form video” = about 17 minutes a day.",
        source: "bishOS",
      },
      {
        term: "Daily pace line",
        definition: "The dashed line on the week bars: your weekly target divided by 7. Bars above it mean you are ahead.",
        example: "Target 140 min → pace line at 20 min a day.",
        source: "bishOS",
      },
      {
        term: "Skill tree",
        definition: "The area broken into skills and sub-skills you can practise, ordered from foundation to advanced.",
        example: "“Short-form video” → Write hooks (Curiosity hooks, Contrarian hooks), Record on camera, Edit fast.",
        source: "Ultralearning (map the subject first)",
      },
      {
        term: "To learn (skill status)",
        definition: "You have not started this skill. Counts 0% in skill progress.",
        example: "“Edit with captions” before you open the editing app.",
        source: "bishOS",
      },
      {
        term: "Learning (skill status)",
        definition: "You are studying how it works. Counts ⅓ (33%).",
        example: "You are watching tutorials on hooks.",
        source: "bishOS",
      },
      {
        term: "Practicing (skill status)",
        definition: "You are doing it for real and getting better. Counts ⅔ (67%).",
        example: "You write 5 hooks a day and test them in posts.",
        source: "bishOS",
      },
      {
        term: "Solid (skill status)",
        definition: "You can do it reliably without help. Counts 100%.",
        example: "Your hooks hit your median views or better most of the time.",
        source: "bishOS",
      },
      {
        term: "Skill progress",
        definition: "The average of all skills, where Solid = 1, Practicing = ⅔, Learning = ⅓, To learn = 0.",
        example: "3 skills: Solid, Practicing, To learn → (1 + 0.67 + 0) ÷ 3 = 56%.",
        source: "bishOS",
      },
      {
        term: "Practice session",
        definition: "One logged block of learning: kind, minutes, skill, what you did, gaps found and what you can now explain. +10 XP each.",
        example: "25 minutes, Practice, “Write hooks”, 10 hooks written, gap: “how long a hook should be”.",
        source: "bishOS",
      },
      {
        term: "Practice (session kind)",
        definition: "Drilling the skill directly — the highest-value minutes.",
        example: "Recording the same 30-second intro 5 times.",
        source: "K. Anders Ericsson (deliberate practice)",
      },
      {
        term: "Project (session kind)",
        definition: "Doing the real thing: ship, record, pitch.",
        example: "Publishing a real video, or running a real sales call.",
        source: "Ultralearning (directness)",
      },
      {
        term: "Study (session kind)",
        definition: "Reading, watching and taking notes in your own words.",
        example: "Reading a chapter of a sales book and writing source notes.",
        source: "bishOS",
      },
      {
        term: "Recall (session kind)",
        definition: "Testing yourself from memory.",
        example: "Writing the 5 steps of your discovery call without looking.",
        source: "Retrieval practice (Roediger & Karpicke)",
      },
      {
        term: "Teach (session kind)",
        definition: "Explaining it simply out loud or in writing, to find where you get stuck.",
        example: "Explaining your pricing model to your co-founder in 2 minutes.",
        source: "Richard Feynman (Feynman technique)",
      },
      {
        term: "“What can you now explain?” (Feynman technique)",
        definition: "After practice, explain what you learned in plain words, as if to a smart 12-year-old. Where you stall, you found a gap. bishOS saves the explanation as an Idea note.",
        example: "“Price anchoring works because people judge price by comparison, not by value alone. Show the big plan first.”",
        source: "Richard Feynman",
      },
      {
        term: "Gaps list (“Things I don't know”)",
        definition: "A running list of questions you could not answer. You add them while practising and close them one by one.",
        example: "Gap: “How to handle the ‘too expensive’ objection.” Closed after 2 role-play sessions.",
        source: "Richard Feynman (his “notebook of things I don't know about”)",
      },
      {
        term: "Drill your weakest point",
        definition: "Spend practice time on the sub-skill that holds you back most, instead of what you already do well.",
        example: "Your videos lose viewers at second 3 → drill hooks, not editing.",
        source: "Scott Young, Ultralearning (drill)",
      },
      {
        term: "Learn in public",
        definition: "Share what you learn while you learn it. It forces clear thinking, builds your audience and attracts help.",
        example: "After a practice session on pricing, you post “3 things I got wrong about pricing our agency”.",
        source: "Shawn Wang (swyx)",
      },
      {
        term: "Content pillar",
        definition: "A main topic of your content. A learning area can feed one pillar, so seeds from its notes land there.",
        example: "Learning area “Sales calls” feeds the pillar “Founder-led sales”.",
        source: "bishOS Content Studio",
      },
      {
        term: "Jargon as gaps",
        definition: "Words you use but cannot explain simply are signs you don't fully understand yet. The Feynman draft lists them so you can add them to your gaps.",
        example: "AI flags “LTV:CAC” — you add it to Things I don't know.",
        source: "Feynman technique",
      },
      {
        term: "Hook",
        definition: "The first line of a post or video that makes people stop scrolling.",
        example: "“I stopped offering free trials. Revenue went up.”",
        source: "Content marketing practice",
      },
      {
        term: "Area status (Active · Paused · Done)",
        definition: "Active = you practise it now. Paused = on hold. Done = target reached. Only areas you push should be Active.",
        example: "Pause “Spanish” during a launch month; mark “Cold email” Done after you hit the target.",
        source: "bishOS",
      },
    ],
    testing: [
      "Go to /learning and click “+ Learning area”. Enter a name, a target performance, choose 2h, click “Create area”. Expected: a toast; the area page opens with status Active and all tiles at 0.",
      "On Overview, click Edit on Map, then “Start from the Ultralearning template”. Click outside. Expected: the template saves; Preview shows the headings.",
      "In “Things I don't know” type a gap and press Enter. Expected: it appears; the Gaps tile shows 1 open. Tick it. Expected: toast “Gap closed”; “Show 1 closed” appears.",
      "Set “Weekly target (minutes)” to 140 and click away. Expected: the ring and the dashed pace line update.",
      "Open Skills and click “Suggest a skill map (AI)”. Untick a few, click “Add selected”. Expected: toast “N skills added to the tree”; the tree shows them as To learn.",
      "Click one status dot 3 times. Expected: To learn → Learning → Practicing → Solid, with a small celebration at Solid; Skill progress % goes up.",
      "Open Practice. Choose Practice, 25, a skill; fill all three text fields (two gaps on two lines); click “Log session”. Expected: toast “Practice logged · 25m …” with +10 XP; toast “2 gaps added…”; the green “Idea note saved” box; History shows the session; the This week bar for today is green.",
      "Click “Open note” in the green box. Expected: an Idea note (Processed, tag learning, learning area set) opens.",
      "Back on /learning. Expected: the area card ring shows 25/140m; the This week strip shows Sessions 1, Ideas explained 1, Gaps 2/1 (or similar).",
      "Delete the session in History and confirm. Expected: it disappears and its XP is removed; the idea note still exists.",
      "Open Resources, click Resource, add 3 resources with “Start now”. Expected: on the third a warning toast “3 active in this area — finishing 1–2 at a time works better”; on /learning the card shows “3 active · max 2”.",
      "Open Cards → “Generate cards from a note”, choose the idea note, draft and add cards. Expected: the Cards tab count goes up; the header button shows “Review N due”.",
      "Click “Review N due”. Expected: Recall opens with “Filtered to <area>”.",
      "Set status to Done. Expected: a celebration; on /learning the card moves to “Paused & done”.",
      "Click “Delete learning area” and confirm. Expected: back to /learning; the area is gone; its notes, cards and resources still exist without the area.",
    ],
    tips: [
      "Write the target performance as a test you could fail. If you can't fail it, it is not a target.",
      "Log “What can you now explain?” every time — it is the cheapest way to create content ideas.",
      "Keep at most 2 learning areas Active during busy months.",
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════
  // LIBRARY
  // ═══════════════════════════════════════════════════════════════════════
  {
    id: "library",
    group: "Mind",
    title: "Library",
    summary:
      "Library is your learning queue for books, courses, videos, articles, podcasts, papers and tools. Every resource needs a reason, you keep only 1–2 active per learning area, and you finish with takeaways and recall cards.",
    why:
      "Saving is not learning. The Library stops the guilt pile: a “why saved” line keeps the queue honest, the max-2-active rule gets things finished, and takeaways plus recall cards make a book something you actually use.",
    when: {
      daily: "Move the progress slider of the resource you are working on. Write takeaways while they are fresh.",
      weekly:
        "Look at the board. Drop what you no longer need (guilt-free). Make sure no learning area has more than 2 active resources. Start the next queued one only when one is done.",
      oneTime: "Add the books and courses you are reading now and the top 5 you want next — each with a one-line reason.",
    },
    pages: [
      {
        route: "/library",
        title: "Library — board and list",
        purpose: "See every resource by status, filter them, and move them from Queued to Active to Done.",
        elements: [
          {
            name: "Library (page header)",
            what: "Title and rule: save with a reason, keep 1–2 active per area, finish with takeaways — then recall them.",
          },
          {
            name: "Board / List",
            what: "Switches between a Kanban board and a table.",
          },
          {
            name: "Resource",
            what: "The + button that opens “Save a resource”. If a learning area filter is set, it is pre-selected.",
          },
          {
            name: "Search title, why, takeaways…",
            what: "Filters by title, author, why saved and takeaways.",
          },
          {
            name: "All learning areas",
            what: "Area filter: All learning areas, No area, or one area.",
          },
          {
            name: "Show dropped",
            what: "A checkbox. When ticked, Dropped resources appear (a 4th board column, or rows in the list).",
          },
          {
            name: "Format chips (All formats · Book N · Course N …)",
            what: "Filter by format. Only formats you have used appear, each with a count.",
            how: "Click a chip to filter; click it again or “All formats” to reset.",
          },
          {
            name: "Overload banner",
            what: "An orange bar when a learning area has more than 2 active: “<area> has N active — finish or drop one; 1–2 at a time gets things finished.”",
          },
          {
            name: "Queued column",
            what: "Hint: “Saved with a reason”. Resources you plan to start. The “+ Add” button at the bottom opens Save a resource.",
          },
          {
            name: "Active column",
            what: "Hint: “Keep 1–2 per area”. What you are working on now.",
          },
          {
            name: "Done column",
            what: "Hint: “Takeaways → recall cards”. Finished resources.",
          },
          {
            name: "Dropped column",
            what: "Hint: “Let go, guilt-free”. Only when Show dropped is ticked.",
          },
          {
            name: "Drag between columns",
            what: "Moving a card changes its status. Moving to Active warns if the area now has more than 2. Moving to Done opens “Finished — lock it in”.",
            how: "Drag a card to another column.",
          },
          {
            name: "Resource card",
            what: "Format icon, title, author, the “why saved” line in quotes, a progress bar (Active only), and chips: area, format, star rating (Done), number of recall cards, and an orange “add takeaways” chip if Done without takeaways.",
            how: "Click the card to open the resource drawer.",
          },
          {
            name: "List table",
            what: "Columns: Title (with format icon and author), Why saved, Area, Progress (% or stars or “Done”), Status. Click a row to open the drawer.",
          },
          {
            name: "Status (list)",
            what: "A dropdown in each row: Queued, Active, Done, Dropped. Works like dragging on the board.",
          },
          {
            name: "Counts footer",
            what: "“N queued · N active · N done”, plus “drag cards between columns” on the board.",
          },
          {
            name: "Your library is empty",
            what: "Empty state with “Save a resource”.",
          },
        ],
        howTo: [
          "Click “+ Resource”, write the title and why you are saving it, choose Queue it.",
          "When you start it, drag it to Active (max 2 per area).",
          "Open it while reading and move the progress slider; write takeaways in your own words.",
          "When finished, drag it to Done, write your 3 takeaways from memory, rate it, and create 3 recall cards.",
          "Drop anything you no longer need.",
        ],
      },
      {
        route: "/library",
        title: "Save a resource (dialog)",
        purpose: "Add a book, course or video to the queue — with a reason.",
        elements: [
          { name: "Title", what: "Required, e.g. “$100M Offers”." },
          {
            name: "Format chips",
            what: "Book, Course, Video, Article, Podcast, Paper, Tool, Other. Default Book.",
          },
          {
            name: "Why are you saving this? (required)",
            what: "What you hope to be able to do after it. A reason keeps the queue from becoming a guilt pile. If empty, the box turns red: “Add a reason — one line is enough.”",
          },
          { name: "Link (optional)", what: "A web address." },
          { name: "Author (optional)", what: "The author or creator." },
          { name: "Learning area", what: "The area it serves, or None." },
          {
            name: "Start (Queue it / Start now)",
            what: "Queue it = status Queued. Start now = status Active (with a warning if the area now has more than 2 active).",
          },
          {
            name: "Cancel · Save resource",
            what: "Save shows “Saved to your library” (Queued or Started).",
          },
        ],
      },
      {
        route: "/library",
        title: "Resource drawer",
        purpose: "Edit everything about one resource, track progress, write takeaways and make recall cards.",
        elements: [
          {
            name: "Queued · Active · Done · Dropped",
            what: "Status switch. Done sets progress to 100% and opens “Finished — lock it in”.",
          },
          { name: "Title", what: "Saves when you click away." },
          {
            name: "Why saved",
            what: "Required. If you empty it, it goes back to the old text with the warning “Why saved can't be empty”.",
          },
          { name: "Format", what: "Change the format." },
          { name: "Learning area", what: "Change or remove the area." },
          { name: "Author", what: "Saves when you click away." },
          {
            name: "Link",
            what: "The web address, with an open-in-new-tab icon when set.",
          },
          {
            name: "Progress · N%",
            what: "A slider from 0 to 100% in steps of 5. It saves when you let go.",
          },
          {
            name: "Takeaways (in your own words)",
            what: "A text box for your key lessons (one per line works best). Edit / Preview switches modes. Saves when you click away.",
          },
          {
            name: "Rating",
            what: "1–5 stars. Click the same star again to clear it.",
          },
          {
            name: "Recall cards · Create from takeaways",
            what: "Shows how many cards come from this resource. “Create from takeaways” (needs takeaways) opens the card proposals: “Draft 3 cards with AI” or “Write questions myself” (answers are pre-filled from your takeaway lines).",
          },
          {
            name: "Delete resource",
            what: "Asks to confirm. Cards and notes made from it are kept.",
          },
        ],
      },
      {
        route: "/library",
        title: "Finished — lock it in (dialog)",
        purpose: "When you mark a resource Done, capture the value before you forget it.",
        elements: [
          {
            name: "Trophy banner",
            what: "The resource title in green, plus a small celebration (“Finished …”).",
          },
          {
            name: "Your 3 biggest takeaways",
            what: "Write them from memory first — that retrieval is the learning.",
          },
          { name: "Rating", what: "1–5 stars." },
          {
            name: "Create 3 recall cards from your takeaways?",
            what: "Explains that spaced recall is how a book becomes something you use. Warns “Write at least one takeaway first.” when empty.",
          },
          {
            name: "Save, no cards",
            what: "Saves takeaways and rating, then closes.",
          },
          {
            name: "Yes, create cards",
            what: "Saves, then shows the card proposals: let AI draft 3 questions from your takeaways, or write the questions yourself (answers pre-filled).",
          },
        ],
      },
    ],
    frameworks: [
      {
        term: "Queued (resource status)",
        definition: "Saved with a reason, not started yet.",
        example: "“$100M Offers — to build a grand-slam offer before the Q4 push.”",
        source: "bishOS",
      },
      {
        term: "Active (resource status)",
        definition: "You are working on it now. Keep 1–2 per learning area.",
        example: "One sales book and one cold-email course active in “Sales”.",
        source: "bishOS",
      },
      {
        term: "Done (resource status)",
        definition: "Finished. Write takeaways and turn them into recall cards.",
        example: "Done: “Never Split the Difference” with 3 takeaways and 3 cards.",
        source: "bishOS",
      },
      {
        term: "Dropped (resource status)",
        definition: "Let go, guilt-free. Not every resource deserves to be finished.",
        example: "You drop a course after module 2 because it is too basic.",
        source: "bishOS",
      },
      {
        term: "Why saved",
        definition: "A required one-line reason for every resource: what you want to be able to do after it. No reason = no save.",
        example: "“To write a proposal template that closes 30%+ of calls.”",
        source: "bishOS; guards against the Collector's fallacy (Christian Tietze)",
      },
      {
        term: "Max 2 active per area",
        definition: "A soft limit: if a learning area has more than 2 active resources, bishOS warns you (it never blocks). Finishing beats starting.",
        example: "You try to start a 3rd marketing book — a warning asks you to finish or drop one first.",
        source: "bishOS (work-in-progress limit idea from Kanban)",
      },
      {
        term: "Takeaways from memory",
        definition: "Write the key lessons without looking at the book first. Pulling them from memory is itself the learning.",
        example: "Close the book and write: 1) mirror the last words, 2) label emotions, 3) ask calibrated questions.",
        source: "Retrieval practice (Roediger & Karpicke)",
      },
      {
        term: "Format",
        definition: "The type of resource: Book, Course, Video, Article, Podcast, Paper, Tool or Other.",
        example: "Notion = Tool; a YouTube talk = Video.",
        source: "bishOS",
      },
    ],
    testing: [
      "Go to /library, click “+ Resource”, type a title, leave “Why” empty and click “Save resource”. Expected: the Why box turns red with “Add a reason — one line is enough.” and nothing is saved.",
      "Add a reason, pick a learning area, choose “Queue it”, save. Expected: toast “Saved to your library · Queued”; the card is in the Queued column with the reason in quotes.",
      "Drag it to Active. Expected: it moves; a progress bar appears on the card.",
      "Start two more resources in the same area. Expected: a warning toast on the 3rd and the orange overload banner at the top.",
      "Open a card, move the progress slider to 40%, let go. Expected: the card shows 40%.",
      "Write two takeaway lines and click away. Click “Create from takeaways” → “Write questions myself”. Expected: two cards with answers pre-filled; write questions and click Add. The card shows a brain chip with 2.",
      "Drag a resource to Done. Expected: a celebration and the “Finished — lock it in” dialog. Write takeaways, rate 4 stars, click “Save, no cards”. Expected: the card shows 4 stars in Done.",
      "Mark another resource Done without takeaways. Expected: its card shows the orange “add takeaways” chip.",
      "Switch to List. Change a status with the dropdown. Expected: same behaviour as dragging.",
      "Tick “Show dropped” after dropping one. Expected: a Dropped column appears.",
      "Search for a word from a takeaway. Expected: only matching resources show.",
    ],
    tips: [
      "If you can't write a “why” in one line, you probably don't need to save it.",
      "Rate resources honestly — later you will know which authors are worth your time.",
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════
  // RECALL
  // ═══════════════════════════════════════════════════════════════════════
  {
    id: "recall",
    group: "Mind",
    title: "Recall",
    summary:
      "Recall is your daily flashcard session. Cards are scheduled with FSRS, a modern memory model, so each card comes back just before you would forget it. You can also test yourself on your notes.",
    why:
      "Testing yourself and spacing your reviews are the two study habits with the strongest evidence. 10–15 minutes a day keeps what you learned from books, notes and practice usable for years — with the fewest reviews.",
    when: {
      daily:
        "Open Recall when the sidebar badge shows due cards. Press Start session and go until “Session complete” (up to 30 cards, about 12 seconds each). Rate honestly with keys 1–4.",
      weekly:
        "Check Retention 30d (target 90%) and the 7-day forecast. In Browse, fix or suspend confusing cards (look at “Learning” and cards with many lapses). Use the Notes tab once.",
      oneTime: "Create your first 10–20 cards: from a note (AI draft), from book takeaways, or by hand in the Create tab.",
    },
    pages: [
      {
        route: "/recall",
        title: "Recall — Review tab (daily session)",
        purpose: "Run today's flashcard session in a focused, game-like screen.",
        elements: [
          {
            name: "Recall (page header)",
            what: "Title and rule: test yourself, spaced out over time — 10–15 minutes a day.",
          },
          {
            name: "Review · Notes · Browse · Create",
            what: "The four tabs. The tab is kept in the web address (?tab=…), so you can bookmark it.",
          },
          {
            name: "Due now",
            what: "Cards due right now, and “N today” (due before midnight). Shown on every tab except Create.",
          },
          {
            name: "Reviewed today",
            what: "How many ratings you gave today and how many different cards.",
          },
          {
            name: "Retention 30d",
            what: "A ring with the % of answers in the last 30 days that were not “Again” (review-stage cards when you have 5+ of them). Target 90%. “—” until there is data.",
          },
          {
            name: "Streak",
            what: "Days in a row with at least one review (a flame icon), plus “N cards · N mature”.",
          },
          {
            name: "7-day forecast",
            what: "Small bars: how many cards come due today and each of the next 6 days. Hover a bar for the number.",
          },
          {
            name: "Filtered to <area> ✕",
            what: "Shown when you came from a learning area (?area=…). The session, browse and create only use that area. Click ✕ to remove the filter.",
          },
          {
            name: "Session intro",
            what: "A big number of cards ready, “about N min” (12 seconds per card), how many are new, and chips per learning area.",
          },
          {
            name: "Start session (Space)",
            what: "Starts the session. You can also press Space or Enter.",
          },
          {
            name: "Streak · retention · reviewed today line",
            what: "Under the start button: your streak, “N% retention (30d)” and “N reviewed today”.",
          },
          {
            name: "Shortcut line",
            what: "“Space reveal · 1–4 rate · Ctrl+Z undo”. Shortcuts do not fire while you type in a text field.",
          },
          {
            name: "All caught up",
            what: "Shown when nothing is due. It tells you when the next cards are due (or that nothing is due this week). Buttons: “Create a card” and “Review notes instead”.",
          },
          {
            name: "Progress bar · N left · +N XP",
            what: "During the session: how far you are, how many cards remain, and XP earned (+1 per card per day).",
          },
          {
            name: "Card front",
            what: "The question, with chips for the learning area and the card state (New, Learning, Relearning, Review). Text: “Answer in your head, then flip.”",
            how: "Say or think the answer first. Then click the card or press Space.",
          },
          {
            name: "Show answer (Space)",
            what: "Flips the card.",
          },
          {
            name: "Card back",
            what: "The question (small), a line, then the answer. If the card came from a note, a link to the source note shows at the top right.",
          },
          {
            name: "Again · Hard · Good · Easy",
            what: "Four rating buttons. Each shows when you will see the card next (the interval preview, e.g. 1m, 6m, 10m, 14d) and a hint: Forgot · 1, Struggled · 2, Recalled · 3, Instant · 4.",
            how: "Click a button or press 1, 2, 3 or 4. Cards still in short steps (minutes) come back later in the same session.",
          },
          {
            name: "Undo",
            what: "Takes back your last rating (also Ctrl+Z). The card comes back revealed and its schedule is restored.",
          },
          {
            name: "N reviewed",
            what: "How many ratings you gave in this session.",
          },
          {
            name: "End session",
            what: "Stops now and shows the done screen. Unrated cards stay due.",
          },
          {
            name: "Session complete",
            what: "The done screen with a trophy and confetti (+ XP toast).",
          },
          {
            name: "Reviews · First-try recall · XP earned · Time",
            what: "Number of ratings (and cards), % of cards you got right the first time (green 85%+, blue 70%+, orange below), XP earned and time spent.",
          },
          {
            name: "Rating bar",
            what: "A coloured bar with how many Again, Hard, Good and Easy you pressed.",
          },
          {
            name: "Tomorrow: N cards due · N-day streak",
            what: "What tomorrow looks like.",
          },
          {
            name: "Keep going · N more",
            what: "Shown if more cards became due. Starts another round.",
          },
          {
            name: "Review notes too / Back to Today / Undo last",
            what: "Go to the Notes tab, go to Today, or undo the last rating.",
          },
        ],
        howTo: [
          "Open Recall. Press Space to start.",
          "Read the question and answer in your head (or out loud).",
          "Press Space to flip. Compare honestly.",
          "Press 1 (Again) if you forgot, 2 (Hard) if it was a struggle, 3 (Good) if you recalled it, 4 (Easy) if it was instant.",
          "Continue until “Session complete”. Misclick? Press Ctrl+Z.",
        ],
      },
      {
        route: "/recall?tab=notes",
        title: "Recall — Notes tab (note review mode)",
        purpose: "Practice testing on your own notes: see a title, recall the idea, reveal, rate.",
        elements: [
          {
            name: "Review mode text",
            what: "Explains: see a note's title, recall what it says, then reveal it. Browsing becomes practice testing.",
          },
          {
            name: "Progress bar · i / n",
            what: "Where you are in the set (10 notes per set).",
          },
          {
            name: "Shuffle a new set",
            what: "The circular-arrows icon. Starts over with a new random set.",
          },
          {
            name: "Type chip · Open",
            what: "The note type, and a link to open the note.",
          },
          {
            name: "Note title",
            what: "The only thing you see before revealing. Prompt: “What does this note say? Recall it before you look.”",
          },
          {
            name: "Jot what you remember (optional)…",
            what: "A box to write your recall attempt. After revealing it shows as “You recalled”, so you can compare.",
          },
          {
            name: "Reveal note (Space)",
            what: "Shows the Summary (if any) and the note body. [[Links]] in the body are clickable.",
          },
          {
            name: "Hard (1) · Easy (2)",
            what: "Rate how well you recalled it. Hard notes come back first next time; then the notes you reviewed longest ago.",
          },
          {
            name: "N notes in rotation · hard ones come back first",
            what: "How many notes qualify for review.",
          },
          {
            name: "Notes reviewed: N · New set",
            what: "The end screen. If some felt hard, it suggests turning them into recall cards. “New set” starts again.",
          },
          {
            name: "No notes to review yet",
            what: "Empty state: write a few idea notes (40+ characters) and come back. “Go to notes” button.",
          },
        ],
      },
      {
        route: "/recall?tab=browse",
        title: "Recall — Browse tab (card browser)",
        purpose: "Find, fix, pause, reset or delete cards.",
        elements: [
          {
            name: "All · Due · New · Learning · Review · Suspended",
            what: "State filter, each with a count. Learning includes Relearning. Suspended cards only show under All and Suspended.",
          },
          {
            name: "All areas",
            what: "Learning-area filter (hidden when you are inside a learning area).",
          },
          {
            name: "Search cards…",
            what: "Searches the question and answer text.",
          },
          {
            name: "Card row",
            what: "The question in bold and the answer below (2 lines).",
          },
          {
            name: "State chip",
            what: "New, Learning, Relearning, Review — or Suspended.",
          },
          {
            name: "Due chip",
            what: "“due now”, “due 3d ago” (orange) or “in 4d”.",
          },
          {
            name: "S Nd",
            what: "For Review cards: the stability in days (how long the memory lasts at 90% recall). “S <1d” means under a day.",
          },
          {
            name: "N lapses",
            what: "How many times you forgot the card after it was learned.",
          },
          {
            name: "Area chip · note link",
            what: "The learning area, and a link to the source note if the card came from one.",
          },
          {
            name: "Edit",
            what: "Opens “Edit card”: change question, answer and learning area, then “Save card”.",
          },
          {
            name: "Suspend / Resume",
            what: "Suspend pauses a card: it is never due and not counted. Resume brings it back.",
          },
          {
            name: "Reset schedule",
            what: "Asks to confirm. The card starts over as New and is due now.",
          },
          {
            name: "Delete",
            what: "Asks to confirm, then deletes the card.",
          },
          {
            name: "No recall cards yet / No cards match",
            what: "Empty states. “Create card” goes to the Create tab.",
          },
        ],
      },
      {
        route: "/recall?tab=create",
        title: "Recall — Create tab",
        purpose: "Write cards by hand or let AI draft them from a note.",
        elements: [
          {
            name: "New card",
            what: "Hint: one idea per card; phrase the front as a question you must answer from memory.",
          },
          {
            name: "Question (front)",
            what: "The question, e.g. “Why do spaced reviews beat cramming?”",
          },
          {
            name: "Answer (back)",
            what: "A short answer (1–2 sentences).",
          },
          {
            name: "Learning area",
            what: "Optional area for the card (pre-set when you came from an area).",
          },
          {
            name: "N added this round · Ctrl+Enter to save",
            what: "A counter of cards added since you opened the tab, and the shortcut.",
          },
          {
            name: "Add card",
            what: "Saves the card. Toast: “Card added — it's due now.” The fields clear for the next card.",
          },
          {
            name: "Draft cards from a note",
            what: "Pick a “Source note” (“Choose a note…”). AI proposes 3–6 cards; you approve each one before it is saved (same proposal list as in Notes).",
          },
        ],
      },
    ],
    frameworks: [
      {
        term: "Spaced repetition",
        definition: "Review information at growing gaps (1 day, 4 days, 2 weeks, 2 months…), right before you would forget it. Each successful recall makes the memory last longer.",
        example: "Your card “3 parts of the value equation” comes back after 1 day, then 4, then 15, then 36.",
        source: "Hermann Ebbinghaus (forgetting curve); Piotr Wozniak (SuperMemo)",
      },
      {
        term: "Retrieval practice (testing effect)",
        definition: "Pulling an answer from memory strengthens it much more than rereading.",
        example: "Answering “What are the 5 steps of our onboarding?” beats rereading the onboarding doc.",
        source: "Roediger & Karpicke 2006; Dunlosky et al. 2013",
      },
      {
        term: "FSRS",
        definition: "Free Spaced Repetition Scheduler — a modern memory model trained on hundreds of millions of reviews. It predicts when you will forget each card and schedules it just before. bishOS uses FSRS-4.5 with the default settings. It needs fewer reviews than older methods (like SM-2) for the same memory.",
        example: "Two cards you both rated Good can get different intervals, because FSRS tracks how hard each one is for you.",
        source: "Jarrett Ye / Open Spaced Repetition (also used in Anki)",
      },
      {
        term: "Stability",
        definition: "In plain words: how long a memory lasts. Stability of 15 days means that after 15 days you still have a 90% chance to remember. Good answers raise it; forgetting lowers it. Shown as “S Nd” in Browse.",
        example: "A new card answered Good starts around 4 days; after a few good reviews it can reach months.",
        source: "FSRS",
      },
      {
        term: "Difficulty",
        definition: "In plain words: how hard this card is for you, on a scale of 1 to 10. Hard cards grow their intervals more slowly. Again and Hard push it up; Good and Easy pull it down.",
        example: "A card with a long list answer becomes “difficult” and comes back more often.",
        source: "FSRS",
      },
      {
        term: "Retrievability",
        definition: "The chance you can recall the card right now. It drops over time since the last review. When it falls to 90%, the card is due.",
        example: "15 days after a review with stability 15, retrievability is about 90% — the card is due.",
        source: "FSRS",
      },
      {
        term: "Again (rating 1)",
        definition: "You forgot. The card goes back to short steps (1 minute for a new card, 10 minutes for a learned card) and counts as a lapse if it was already learned.",
        example: "You could not recall the price of your middle plan → Again → it comes back in the same session.",
        source: "Anki / FSRS rating scale",
      },
      {
        term: "Hard (rating 2)",
        definition: "You recalled it, but with real effort. The next interval is shorter than Good.",
        example: "You remembered 2 of the 3 objection answers after a long pause → Hard.",
        source: "Anki / FSRS rating scale",
      },
      {
        term: "Good (rating 3)",
        definition: "You recalled it correctly with normal effort. This should be your most common answer.",
        example: "You answered “mirror, label, calibrated question” after a second → Good.",
        source: "Anki / FSRS rating scale",
      },
      {
        term: "Easy (rating 4)",
        definition: "You knew it instantly. The card jumps far ahead (a new card skips the short steps and goes to about 14 days).",
        example: "“What does CAC stand for?” → instant → Easy.",
        source: "Anki / FSRS rating scale",
      },
      {
        term: "Interval preview",
        definition: "The time shown on each rating button: when you will see the card again if you press it. A new card shows Again 1m · Hard 6m · Good 10m · Easy 14d. A review card might show 10m · 6d · 15d · 36d.",
        example: "You see Good = 15d and Easy = 36d, and choose honestly.",
        source: "bishOS (FSRS)",
      },
      {
        term: "Learning steps",
        definition: "Short practice steps for a new card before it moves to day intervals: 1 minute, then 10 minutes. After you forget a learned card, there is one relearning step of 10 minutes.",
        example: "New card → Good (10m) → Good again → it graduates to about 4 days.",
        source: "bishOS (FSRS with Anki-style steps)",
      },
      {
        term: "Card states (New · Learning · Relearning · Review)",
        definition: "New = never studied. Learning = in its first short steps. Relearning = forgotten and back in short steps. Review = graduated, coming back after days.",
        example: "A card you just created is New; after Good twice it is Review.",
        source: "Anki / FSRS",
      },
      {
        term: "Mature card",
        definition: "A Review card with stability of 21 days or more. A sign the memory is strong.",
        example: "“120 cards · 40 mature” means 40 cards last at least 3 weeks.",
        source: "Anki convention",
      },
      {
        term: "Lapse",
        definition: "Forgetting a card (pressing Again) after it had graduated to Review. Many lapses mean the card should be rewritten or split.",
        example: "A card with 5 lapses: “List all 9 steps of our sales process” → split into 3 cards.",
        source: "Anki / FSRS",
      },
      {
        term: "Retention",
        definition: "The share of reviews you got right (not “Again”) over the last 30 days. bishOS aims for 90%. Much lower means cards are too hard; near 100% may mean they are too easy.",
        example: "Retention 30d: 88% — close to the 90% target.",
        source: "FSRS (requested retention 0.9)",
      },
      {
        term: "First-try recall",
        definition: "On the done screen: the % of cards you got right the first time you saw them in this session.",
        example: "20 cards, 17 right first time → 85%.",
        source: "bishOS",
      },
      {
        term: "Due queue",
        definition: "Today's session list: up to 30 due cards. First cards in short steps, then review cards (most overdue first), then new cards. Topics are mixed across learning areas.",
        example: "Your 30-card session mixes Sales, Video and Finance cards instead of 30 sales cards in a row.",
        source: "bishOS",
      },
      {
        term: "Interleaving",
        definition: "Mixing topics in one session instead of blocking one topic. It feels harder but builds stronger memory.",
        example: "A sales card, then a finance card, then a video card.",
        source: "Learning science (Rohrer & Taylor)",
      },
      {
        term: "Learn ahead",
        definition: "If only cards in short steps remain (due in a few minutes), the session shows them now instead of making you wait.",
        example: "Your last card is due again in 10 minutes — the session shows it right away.",
        source: "bishOS",
      },
      {
        term: "Streak (recall)",
        definition: "Days in a row with at least one review, counting today or yesterday.",
        example: "You reviewed every day this week → 7-day streak.",
        source: "bishOS",
      },
      {
        term: "7-day forecast",
        definition: "How many cards come due on each of the next 7 days, so you can plan.",
        example: "Saturday shows 40 cards — you do a few extra on Friday.",
        source: "bishOS",
      },
      {
        term: "Suspend",
        definition: "Pause a card so it never comes due, without deleting it.",
        example: "You suspend cards about a tool you stopped using.",
        source: "Anki convention",
      },
      {
        term: "Reset schedule",
        definition: "Forget a card's history and start it again as New.",
        example: "You rewrote a card completely — reset it.",
        source: "bishOS",
      },
      {
        term: "Minimum information principle",
        definition: "One fact or idea per card, with a short answer. Small cards are easier to remember than big ones. bishOS AI follows this rule.",
        example: "Not “Explain our pricing” but “Why is the middle plan our anchor?”",
        source: "Piotr Wozniak, 20 rules of formulating knowledge",
      },
    ],
    testing: [
      "Open Recall → Create. Type a question and answer, press Ctrl+Enter. Expected: toast “Card added — it's due now”; “1 added this round”.",
      "Open the Review tab. Expected: the stats strip shows Due now ≥ 1; the intro says “1 card ready · about 1 min · 1 new”; the sidebar Recall badge shows the count.",
      "Press Space. Expected: the card front appears with a “New” chip.",
      "Press Space again. Expected: the card flips; the buttons show Again 1m, Hard 6m, Good 10m, Easy 14d.",
      "Press 3. Expected: “+1 XP” in the top bar; because the card is in a short step, it comes back in this session (learn ahead).",
      "Flip and press 3 again. Expected: the card graduates (about 4 days) and “Session complete” shows Reviews 2, 1 card, XP +1, a time, and the rating bar.",
      "Press Ctrl+Z. Expected: toast “Last rating undone”; the card returns flipped; you can rate again.",
      "Open Browse. Expected: the card shows state Review, “in 4d” (or similar) and “S 4d”. Click Suspend. Expected: toast “Card suspended”; it is greyed; the Suspended filter count is 1; Due does not count it. Click Resume.",
      "Click Reset schedule and confirm. Expected: toast “Card reset”; state New; due now.",
      "Open the Notes tab (with processed notes of 40+ characters). Press Space, then 2. Expected: next note; at the end “Notes reviewed: N”.",
      "From a learning area click “Review N due”. Expected: “Filtered to <area>” chip; only that area's cards; ✕ removes the filter.",
      "Review on two days in a row. Expected: Streak shows 2 with a flame.",
      "After 5+ reviews of graduated cards in 30 days. Expected: Retention 30d shows a % instead of “—”.",
    ],
    tips: [
      "Rate honestly. Pressing Good when you forgot only hides the problem — FSRS needs the truth.",
      "If a card keeps lapsing, rewrite it smaller or suspend it.",
      "Do Recall at a fixed moment, e.g. right after the morning start-up.",
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════
  // AI HELPERS (Mind)
  // ═══════════════════════════════════════════════════════════════════════
  {
    id: "mind-ai",
    group: "Mind",
    title: "AI helpers for notes and learning",
    summary:
      "In the Mind group, AI drafts and you decide. It suggests recall cards, a Feynman explanation with post ideas, a skill map, note summaries and related notes. Nothing is saved until you approve it.",
    why:
      "AI removes blank-page friction: cards, skill maps and post drafts take seconds instead of an hour. Because you tick and edit every item, the quality and the voice stay yours.",
    when: {
      daily: "After writing an important note, click Recall cards → “Draft 5 cards with AI”.",
      weekly: "Run “Make it public” → “Draft a simple explanation (AI)” on your best note of the week.",
      oneTime: "When you create a learning area, run “Suggest a skill map (AI)”.",
    },
    pages: [
      {
        route: "/notes/[id]",
        title: "AI on a note",
        purpose: "Summarize a note, find related notes, draft recall cards and draft learn-in-public material.",
        elements: [
          {
            name: "Summarize",
            what: "Writes 3–5 tight bullet points and one key takeaway, faithful to the note. Shown in the AI box, not saved.",
          },
          {
            name: "Find related",
            what: "Looks at your other notes and lists up to 5 that truly relate, as clickable [[links]] with a short reason. If none relate, it says so.",
          },
          {
            name: "Draft 5 cards with AI",
            what: "In the Recall cards dialog. Makes 3–6 question → answer cards from the note's summary and text. Rules: one idea per card, answerable from memory, “why/how” questions, short answers, no yes/no questions, no invented facts. Needs at least 20 characters of text.",
          },
          {
            name: "Draft a simple explanation (AI)",
            what: "In the Make it public dialog. Returns a simple explanation (up to 150 words, with one example), jargon you still use (up to 8), a hook, and 3 short posts (TIL, Mistake I made, Myth-bust; up to 80 words each). First person, plain words, no hashtags or emojis.",
          },
          {
            name: "✦ notes assistant",
            what: "A chat that can create or change notes. It shows each action with Confirm / Cancel before saving.",
          },
        ],
      },
      {
        route: "/learning/[id]",
        title: "AI in a learning area",
        purpose: "Map the skills of a new area and turn notes into cards.",
        elements: [
          {
            name: "Suggest a skill map (AI)",
            what: "Skills tab. Proposes 4–7 top-level skills with 2–5 sub-skills each, ordered foundation → advanced, as things you can DO and practise. It reads the name, target performance, why, map and open gaps, and skips skills you already have.",
          },
          {
            name: "Generate cards from a note",
            what: "Cards tab. Choose a source note; AI drafts 3–6 cards; you tick the ones to keep.",
          },
        ],
      },
      {
        route: "/library",
        title: "AI on a finished resource",
        purpose: "Turn your takeaways into recall cards.",
        elements: [
          {
            name: "Draft 3 cards with AI",
            what: "From “Create from takeaways” in the drawer or “Yes, create cards” in the finish dialog. Uses your takeaways and your “why saved” line.",
          },
          {
            name: "Write questions myself",
            what: "The no-AI path: each takeaway line becomes an answer; you write the questions.",
          },
        ],
      },
      {
        route: "/recall?tab=create",
        title: "AI in Recall",
        purpose: "Draft cards from any note without leaving Recall.",
        elements: [
          {
            name: "Draft cards from a note",
            what: "Choose a source note, then “Draft 5 cards with AI” or “Write by hand”. Approve with checkboxes, then “Add N cards”.",
          },
        ],
      },
    ],
    frameworks: [
      {
        term: "AI proposal (approve before save)",
        definition: "Every Mind AI feature returns suggestions only. You see them with checkboxes or as text, edit them, and only what you approve is saved.",
        example: "AI drafts 5 cards; you untick 1 and fix 1 — 4 cards are saved.",
        source: "bishOS",
      },
      {
        term: "AI unavailable / rate limit",
        definition: "The free AI service sometimes limits requests. You see a friendly message; wait a moment and try again, or use the manual path (Write by hand, Write questions myself, plant the seed without a draft).",
        example: "“AI is unavailable right now (rate limit?). Try again, or write cards by hand.”",
        source: "bishOS",
      },
      {
        term: "Feynman draft",
        definition: "The AI version of the Feynman step: a simple explanation of your note plus the jargon it could not avoid — your next gaps.",
        example: "From your note on unit economics, AI flags “contribution margin” as jargon.",
        source: "Richard Feynman; swyx (learn in public)",
      },
    ],
    testing: [
      "Open a note with a few lines. Click Summarize. Expected: bullets and a key takeaway in the AI box within a few seconds.",
      "Click Find related. Expected: up to 5 [[links]] with reasons; clicking one opens that note.",
      "Click Recall cards → “Draft 5 cards with AI”. Expected: about 5 editable cards with checkboxes. Untick one and click “Add 4 cards”. Expected: toast “4 recall cards added”.",
      "Open a note with fewer than 20 characters and try to draft cards. Expected: the message “There isn't enough text to make cards from yet. Write a few lines first.”",
      "Click Make it public → “Draft a simple explanation (AI)”. Expected: Simple explanation plus TIL, Mistake I made and Myth-bust rows; jargon chips; the Hook field is filled.",
      "In a learning area, Skills tab → “Suggest a skill map (AI)”. Expected: 4–7 skills with sub-skills and checkboxes; “Add selected” adds only ticked ones.",
      "Turn off the internet (or wait for a rate limit) and try any AI button. Expected: a clear warning message, and nothing is saved.",
    ],
    tips: ["Always edit AI cards into your own words — cards you shape yourself are easier to remember."],
  },

  // ═══════════════════════════════════════════════════════════════════════
  // DELEGATION (System)
  // ═══════════════════════════════════════════════════════════════════════
  {
    id: "delegation",
    group: "System",
    title: "Delegation",
    summary:
      "Delegation helps you buy back your time. You audit how you spend your hours, sort them in the DRIP matrix, see what to hand off at your Buyback Rate, write SOPs (step-by-step processes), and climb the Replacement Ladder.",
    why:
      "As a founder, your hours are the company's scarcest resource. Every hour of low-value, draining work you hand off becomes an hour for sales, product and strategy — and less burnout. This page shows exactly what to hand off first and makes the handover easy.",
    when: {
      daily:
        "During your 2-week time audit: log a block every 15–30 minutes (activity, minutes, $ value, energy — a few taps). Any day: when a task feels like “this shouldn't be me”, tick “Should not be me” on the task.",
      weekly:
        "Look at DRIP and Buyback. Write or finish one SOP. Click “Ran it” when you run a process, and record the next run (Camcorder Method).",
      monthly: "Open the Ladder. Hand off one documented SOP to a VA or contractor and mark it Delegated. Repeat the 2-week audit every quarter.",
      oneTime:
        "Set your annual income (or target) in the Buyback tab. Run the 2-week time audit. Write your first two SOPs — client onboarding and lead-to-close are the best first two.",
    },
    pages: [
      {
        route: "/delegation",
        title: "Delegation — header and Time audit tab",
        purpose: "Log what you actually do, what it is worth and how it feels, for two weeks.",
        elements: [
          {
            name: "Delegation (page header)",
            what: "Title and rule: buy back your time — audit it, sort it, document it, hand it off.",
          },
          {
            name: "New SOP",
            what: "Opens an empty SOP editor from any tab.",
          },
          {
            name: "Time audit · DRIP · Buyback · Processes · Ladder",
            what: "The five tabs. Processes shows how many SOPs you have. Your last tab is remembered in this browser.",
          },
          {
            name: "Log a block",
            what: "The audit form. Hint: every 15–30 minutes, jot what you did, what it's worth and how it felt.",
          },
          {
            name: "What did you just do?",
            what: "The activity name (up to 120 characters), e.g. “Invoices”, “Client call”, “LinkedIn post”. It suggests your recent activities as you type.",
          },
          {
            name: "Log",
            what: "Saves the block. Toast: “Logged · <activity>” and which quadrant it landed in.",
          },
          {
            name: "Recent activity chips",
            what: "Up to 8 recent activities (history icon). Clicking one fills the activity, $ value, energy, area and minutes from last time.",
            how: "Click a chip, check the values, click Log — two taps for a repeat task.",
          },
          {
            name: "How long (Minutes / Start – end)",
            what: "Choose how to enter time. Minutes: quick chips 15m, 30m, 45m, 1h, 1h 30m, 2h, or type 1–1440. Start – end: two time pickers (blocks across midnight work). After logging, the next start time is set to the last end time.",
          },
          {
            name: "Area (optional)",
            what: "The life area of the block (archived areas are hidden).",
          },
          {
            name: "What's it worth?",
            what: "Four buttons $, $$, $$$, $$$$. The label shows the meaning: ≈ minimum wage, ≈ assistant rate, ≈ skilled pro, ≈ founder-only. Ask: if I hired someone for this, what would they cost?",
          },
          {
            name: "How did it feel?",
            what: "Energizing, Neutral or Draining. Neutral counts as energizing in the DRIP matrix.",
          },
          {
            name: "Lands in …",
            what: "A live preview line with a colour dot: which DRIP quadrant this block will land in, and what to do with it (e.g. “Lands in Delegation — hand these off first”).",
          },
          {
            name: "Day",
            what: "A date picker (up to today) to log blocks for an earlier day.",
          },
          {
            name: "Error box",
            what: "Shows problems, e.g. “Add a start and end time (e.g. 09:00 – 09:45).”",
          },
          {
            name: "Logged blocks",
            what: "Your entries for the last 14 days, grouped by day with the day total. Each row: quadrant colour dot, activity, start time · duration, life area, $ value, energy icon, and X to delete (no confirm).",
          },
          {
            name: "2-week audit",
            what: "Progress to a full audit: “N / 14 days”, a “Complete” or “N to go” chip, a bar, 14 small squares (darker = more minutes logged that day; today has a ring), and the total time logged.",
          },
          {
            name: "How to rate",
            what: "A reminder: $–$$$$ = what you'd pay someone to do it; Energy = did it leave you more or less charged; rough and fast beats precise.",
          },
          {
            name: "Nothing logged yet",
            what: "Empty state: the time audit is how you find what to hand off.",
          },
        ],
        howTo: [
          "Pick two normal work weeks.",
          "Every 15–30 minutes (or at each task switch), type what you did and click Log.",
          "Rate $ value and energy with one tap each. Don't overthink.",
          "Use the recent chips for repeat tasks.",
          "Missed some? Use Start – end and the Day picker to backfill at lunch or in the evening.",
          "After 14 days, open DRIP and Buyback.",
        ],
      },
      {
        route: "/delegation",
        title: "DRIP tab",
        purpose: "See your logged time sorted into four quadrants by money value and energy.",
        elements: [
          {
            name: "Your DRIP matrix fills from the time audit",
            what: "Empty state with “Start the time audit” (switches to the audit tab).",
          },
          {
            name: "N% of your logged time energizes you",
            what: "The share of time in Production + Investment. A note says EOS's Delegate & Elevate suggests getting about 80% of your work into the energizing quadrants. Also shows total time logged in the last 14 days.",
          },
          {
            name: "Quadrant bar",
            what: "A stacked bar with each quadrant's share in its colour. Hover a part for its name and %.",
          },
          {
            name: "Draining · Energizing (column labels)",
            what: "Left column = draining work, right column = energizing work. Top row = high $ ($$$–$$$$), bottom row = low $ ($–$$).",
          },
          {
            name: "Replacement",
            what: "Top left: high $ · draining. Valuable but it drains you. Action: document it, then train someone to replace you.",
          },
          {
            name: "Production",
            what: "Top right: high $ · energizing. Your zone of genius — the work only you should do. Action: protect and expand it.",
          },
          {
            name: "Delegation",
            what: "Bottom left: low $ · draining. Costs you energy and earns little. Action: hand these off first.",
          },
          {
            name: "Investment",
            what: "Bottom right: low $ · energizing. Learning, strategy and health that pay off later. Action: keep it, on purpose.",
          },
          {
            name: "Quadrant card details",
            what: "Each card shows hours and %, the hint and action, the top 5 activities (with $ value, energy icon and time) and “+N more”. Activities with the same name are grouped.",
          },
          {
            name: "Write SOP: <activity>",
            what: "On Delegation and Replacement cards: opens a new SOP named after the biggest activity there (rung Admin), ready to fill.",
          },
        ],
      },
      {
        route: "/delegation",
        title: "Buyback tab",
        purpose: "Know your Buyback Rate and see which hours you can buy back and what it costs.",
        elements: [
          {
            name: "Your Buyback Rate",
            what: "Formula: annual income ÷ 2,000 hours ÷ 4.",
          },
          {
            name: "Annual income (or target)",
            what: "Your yearly income, or the income you aim for.",
          },
          {
            name: "Currency",
            what: "A currency code (suggestions: USD, EUR, GBP, PKR, INR, AED, SAR, CAD, AUD). Up to 6 letters.",
          },
          {
            name: "Your hour · Buyback rate",
            what: "Live preview: your hourly value (income ÷ 2,000) and your Buyback Rate (a quarter of that).",
          },
          {
            name: "Example line",
            what: "Explains: if someone could do a task for your Buyback Rate per hour or less, it's a candidate to buy back. At 100,000 a year that's 12.50 an hour.",
          },
          {
            name: "Save",
            what: "Saves income and currency (only active when you changed something). Toast: “Buyback rate updated”.",
          },
          {
            name: "Hours to buy back",
            what: "Estimated hours per week of low-$ work ($ or $$) from your audit.",
          },
          {
            name: "Cost at buyback rate",
            what: "What those hours would cost per week if you paid your Buyback Rate.",
          },
          {
            name: "Your time's worth",
            what: "What those same hours are worth per week at your own hourly value — the gap is your gain.",
          },
          {
            name: "Delegate candidates",
            what: "Low-$ activities from the last 14 days, grouped by name. Delegation-quadrant items (low $ + draining) come first, then by hours. Each row: quadrant dot, activity, $ · energy · time logged, hours per week, cost per week (or “set income”), and “Write SOP”.",
          },
          {
            name: "No low-$ work logged yet",
            what: "Empty state with “Open the time audit”.",
          },
          {
            name: "Tasks you flagged “delegate”",
            what: "Open tasks marked “Should not be me”, with their time estimate and cost at your Buyback Rate.",
          },
        ],
      },
      {
        route: "/delegation",
        title: "Processes tab",
        purpose: "Your SOP library, plus the queue of tasks you want to record the next time you do them.",
        elements: [
          {
            name: "All · Admin · Delivery · Marketing · Sales · Leadership",
            what: "Filter SOPs by ladder rung, with counts.",
          },
          {
            name: "New SOP",
            what: "Opens a new SOP (pre-set to the filtered rung).",
          },
          {
            name: "SOP card",
            what: "Title (click to edit) and “Starts when: <trigger>”.",
          },
          {
            name: "Card chips",
            what: "Rung, status (Draft, Documented, Delegated), step count (green when 7–15 steps) and frequency (daily, weekly, monthly, as needed).",
          },
          {
            name: "Owner · ran …",
            what: "“Owner: you” (or the person's name) and when it was last run (e.g. “ran yesterday”).",
          },
          {
            name: "Video",
            what: "Opens the Camcorder recording link (only safe http/https links are shown).",
          },
          {
            name: "Ran it / Ran today",
            what: "Logs that you ran this process today. Toast “Logged a run” (with a tip to record the next run if there is no video). Disabled after you clicked it today.",
          },
          {
            name: "Your process library is empty / Nothing on this rung yet",
            what: "Empty state: an SOP is the 7–15 steps that produce 80% of the result. “Write your first SOP” button.",
          },
          {
            name: "Record this next time",
            what: "Tasks you marked “delegate” that have no SOP yet. Each shows a done/open icon, the title, a guessed rung and life area.",
          },
          {
            name: "Create SOP from task",
            what: "Creates a Draft SOP from the task (title, life area, guessed rung, frequency “as needed”, notes from the task description) and opens it. Toast: “Draft SOP created”.",
          },
        ],
      },
      {
        route: "/delegation",
        title: "SOP editor (New SOP / Edit SOP)",
        purpose: "Write a process so someone else can run it: the trigger, the 7–15 key steps, the video, tools and owner.",
        elements: [
          { name: "Process name", what: "Required, e.g. “Client onboarding”." },
          {
            name: "Ladder rung",
            what: "1. Admin, 2. Delivery, 3. Marketing, 4. Sales, 5. Leadership.",
          },
          {
            name: "How often",
            what: "—, Daily, Weekly, Monthly, As needed.",
          },
          {
            name: "Status (Draft · Documented · Delegated)",
            what: "Where the SOP stands. When you edit an existing SOP and move it up to Documented or Delegated, saving shows a celebration (“SOP documented: …” or “Handed off: … 🙌”).",
          },
          {
            name: "Trigger",
            what: "What starts this process, e.g. “A client signs the proposal”.",
          },
          {
            name: "Steps",
            what: "Numbered steps you can edit in place, move up/down or remove (X).",
          },
          {
            name: "Step counter",
            what: "“Write the 7–15 major steps” (none yet), “N steps · aim for 7–15”, “N steps · sweet spot” (green, 7–15), or “N steps · trim to the 20% that gives 80%” (orange, 16+).",
          },
          {
            name: "Step N… · Add",
            what: "Type a step and press Enter or Add. Text still in this box is also saved when you click Save.",
          },
          {
            name: "Camcorder recording",
            what: "A link to a video of you doing the task once (Loom, screen recording). Whoever takes it over writes the steps from the video. An open icon appears for valid links.",
          },
          {
            name: "Tools",
            what: "Comma-separated, e.g. “Notion, Stripe, Gmail”.",
          },
          {
            name: "Owner",
            what: "“me” until it is handed off; then the person's name.",
          },
          { name: "Life Area (optional)", what: "The life area of the process." },
          {
            name: "Notes",
            what: "Gotchas, quality bar, what “done” looks like.",
          },
          {
            name: "Last performed · Did it today",
            what: "For existing SOPs: when it was last run, and a button to log a run today.",
          },
          {
            name: "Created from task: “…”",
            what: "Shown when the SOP came from a delegate-flagged task.",
          },
          {
            name: "Delete (Tap again)",
            what: "For existing SOPs. First click arms it (“Tap again”), second click deletes.",
          },
          {
            name: "Cancel · Save",
            what: "Save needs a name. New SOP toast: “SOP created — Record the next run to fill in the steps.”",
          },
        ],
      },
      {
        route: "/delegation",
        title: "Ladder tab",
        purpose: "See which business area to hand off next, in the right order.",
        elements: [
          {
            name: "What to hand off first",
            what: "A tip that changes with your data: start with admin, finish documenting a rung, or hand off a documented rung.",
          },
          {
            name: "Rung circles 1–5",
            what: "Admin, Delivery, Marketing, Sales, Leadership. A circle turns solid green when everything on that rung is delegated. The next rung to work on has a highlighted border.",
          },
          {
            name: "Next",
            what: "A chip on the rung you should focus on now: the first rung that is empty or not fully delegated.",
          },
          {
            name: "Rung description",
            what: "Examples per rung, e.g. Admin: inbox, calendar, invoices, bookkeeping, travel.",
          },
          {
            name: "Readiness %",
            what: "Documented or delegated processes ÷ everything on the rung. The bar turns green at 80%+.",
          },
          {
            name: "Rung chips",
            what: "N delegated, N documented, N draft, N tasks to record — or “No processes yet.”",
          },
          {
            name: "Open SOPs",
            what: "Jumps to the Processes tab filtered to that rung.",
          },
          {
            name: "Readiness footnote",
            what: "Explains the formula: SOPs plus tasks flagged “delegate” without one. When a rung is ready, a first assistant or contractor can take it over.",
          },
        ],
      },
      {
        route: "/tasks",
        title: "Flag a task for delegation (task detail)",
        purpose: "Mark any task that should not be done by you, so it feeds the record queue, the Buyback list and the Ladder.",
        elements: [
          {
            name: "Should not be me — record it next time (Delegation)",
            what: "A checkbox in the task detail panel. Flagged tasks appear in “Record this next time”, in “Tasks you flagged delegate” (Buyback), and count toward Ladder readiness until they get an SOP.",
            how: "Open a task, tick the box. The next time you do it, record your screen and create the SOP from the task.",
          },
        ],
      },
    ],
    frameworks: [
      {
        term: "Buy Back Your Time",
        definition: "A method for founders: stop trading time for money and use money to buy back your time, so you can focus on the work that grows the company.",
        example: "You pay a VA 8/hour for inbox and invoices and use the 6 hours a week for sales calls.",
        source: "Dan Martell, Buy Back Your Time",
      },
      {
        term: "Time audit",
        definition: "Two weeks of logging what you actually do, every 15–30 minutes, with a $ value and an energy rating. It shows the truth about your week.",
        example: "You discover you spend 7 hours a week on invoices and scheduling.",
        source: "Dan Martell; Peter Drucker (“know thy time”)",
      },
      {
        term: "$ value (1–4)",
        definition: "What a task is worth per hour if you hired someone for it. $ ≈ minimum wage, $$ ≈ assistant rate, $$$ ≈ skilled professional, $$$$ ≈ founder-only. $$$ and up count as high $.",
        example: "Booking meetings = $. Writing ad copy = $$$. Closing a big client = $$$$.",
        source: "Dan Martell, Buy Back Your Time",
      },
      {
        term: "Energizing / Neutral / Draining",
        definition: "How a task leaves you: more charged, the same, or tired. In the DRIP matrix Neutral counts as energizing.",
        example: "A strategy session energizes you; reconciling expenses drains you.",
        source: "Dan Martell, Buy Back Your Time",
      },
      {
        term: "DRIP matrix",
        definition: "A 2×2 grid that sorts every task by money value (high/low) and energy (energizing/draining): Delegation, Replacement, Investment, Production.",
        example: "Your audit shows 30% Delegation — the first thing to hand off.",
        source: "Dan Martell, Buy Back Your Time",
      },
      {
        term: "Delegation quadrant",
        definition: "Low $ and draining. These tasks cost energy and earn little. Hand them off first.",
        example: "Inbox cleanup, invoicing, scheduling.",
        source: "Dan Martell (DRIP)",
      },
      {
        term: "Replacement quadrant",
        definition: "High $ but draining. Valuable work that wears you out. Document it, then train someone to replace you.",
        example: "Project management of client delivery.",
        source: "Dan Martell (DRIP)",
      },
      {
        term: "Investment quadrant",
        definition: "Low $ right now but energizing — learning, strategy, health. Keep it on purpose; it pays off later.",
        example: "Reading, gym, planning the quarter.",
        source: "Dan Martell (DRIP)",
      },
      {
        term: "Production quadrant",
        definition: "High $ and energizing — your zone of genius. Protect it and expand it.",
        example: "Sales calls with ideal clients, product vision, key partnerships.",
        source: "Dan Martell (DRIP)",
      },
      {
        term: "Energizing % (Delegate & Elevate)",
        definition: "The share of your logged time in Production + Investment. EOS suggests getting about 80% of your work into what you love and are great at.",
        example: "52% energizing → hand off two draining tasks this month.",
        source: "Gino Wickman, EOS / Traction (Delegate and Elevate)",
      },
      {
        term: "Buyback Rate",
        definition: "The hourly price under which you should buy back a task. Formula: annual income ÷ 2,000 work hours ÷ 4.",
        example: "Income 60,000 → your hour = 30 → Buyback Rate = 7.50/hour. Any task someone can do for 7.50/hour or less is a candidate.",
        source: "Dan Martell, Buy Back Your Time",
      },
      {
        term: "Your hour (hourly value)",
        definition: "Annual income ÷ 2,000 hours. What one hour of your time is worth today.",
        example: "100,000 a year → 50 per hour.",
        source: "Dan Martell",
      },
      {
        term: "Delegate candidate",
        definition: "An activity rated $ or $$ in your audit. bishOS estimates its hours per week (minutes logged ÷ weeks in the audit) and the weekly cost at your Buyback Rate.",
        example: "“Invoices: 2.5h/wk, 18.75/wk at buyback rate.”",
        source: "bishOS",
      },
      {
        term: "Camcorder Method",
        definition: "Record yourself doing a task once (screen + voice). The new person watches it and writes the SOP. You never have to write it from scratch.",
        example: "You record your weekly invoicing on Loom; your VA turns it into 9 steps.",
        source: "Dan Martell, Buy Back Your Time",
      },
      {
        term: "SOP (Standard Operating Procedure)",
        definition: "A written checklist of how a recurring task is done, so anyone can do it the same way.",
        example: "“Client onboarding”: send welcome email, create Slack channel, book kickoff call…",
        source: "Business operations practice; EOS Process Documenter",
      },
      {
        term: "7–15 major steps (20/80 rule)",
        definition: "Document only the main steps — the 20% of steps that give 80% of the result. 7–15 steps is the sweet spot; more means trim.",
        example: "Not 40 micro-steps for onboarding, but 10 key ones.",
        source: "Gino Wickman, EOS / Traction (document the 20/80)",
      },
      {
        term: "Trigger",
        definition: "The event that starts a process.",
        example: "“When a new client signs the proposal.”",
        source: "Process design practice",
      },
      {
        term: "Draft (SOP status)",
        definition: "Started but not complete yet — steps missing or not checked.",
        example: "A draft created from a task, with no steps yet.",
        source: "bishOS",
      },
      {
        term: "Documented (SOP status)",
        definition: "The steps are written and checked. Someone else could run it.",
        example: "“Weekly invoicing” with 9 steps and a video.",
        source: "bishOS",
      },
      {
        term: "Delegated (SOP status)",
        definition: "Someone else now owns and runs this process.",
        example: "Your VA runs weekly invoicing; Owner = “Sara”.",
        source: "bishOS",
      },
      {
        term: "Replacement Ladder",
        definition: "The order in which founders hand off work: Admin → Delivery → Marketing → Sales → Leadership. Climb one rung at a time.",
        example: "First hire an assistant for admin; later a delivery manager; leadership stays with you longest.",
        source: "Dan Martell, Buy Back Your Time",
      },
      {
        term: "Admin (rung 1)",
        definition: "Inbox, calendar, invoices, bookkeeping, travel. The first and easiest rung to hand off.",
        example: "A VA manages your calendar and books calls.",
        source: "Dan Martell (Replacement Ladder)",
      },
      {
        term: "Delivery (rung 2)",
        definition: "Doing the work for clients: onboarding, kickoff, milestones, handover.",
        example: "A project manager runs client kickoffs from your SOP.",
        source: "Dan Martell (Replacement Ladder)",
      },
      {
        term: "Marketing (rung 3)",
        definition: "Content production, posting, campaigns, design.",
        example: "An editor cuts your videos and schedules posts.",
        source: "Dan Martell (Replacement Ladder)",
      },
      {
        term: "Sales (rung 4)",
        definition: "Prospecting, follow-ups, proposals, lead-to-close.",
        example: "An SDR books discovery calls from your outreach SOP.",
        source: "Dan Martell (Replacement Ladder)",
      },
      {
        term: "Leadership (rung 5)",
        definition: "Hiring, strategy, vision — the last rung.",
        example: "Years later, a COO runs operations and hiring.",
        source: "Dan Martell (Replacement Ladder)",
      },
      {
        term: "Ladder readiness",
        definition: "For each rung: (documented + delegated SOPs) ÷ (all SOPs on the rung + open tasks flagged “delegate” without an SOP), as a %. 80%+ shows green.",
        example: "Admin: 3 documented, 1 draft, 1 task to record → 3 ÷ 5 = 60%.",
        source: "bishOS",
      },
      {
        term: "Next rung (focus)",
        definition: "The first rung that is empty or not fully delegated. bishOS marks it “Next” and writes a tip for it.",
        example: "Admin is fully delegated → “Next” moves to Delivery.",
        source: "bishOS",
      },
      {
        term: "Delegate flag (“Should not be me”)",
        definition: "A checkbox on any task. It means “someone else should do this”. The task enters the record queue until you create an SOP from it.",
        example: "You tick it on “Send monthly invoices”.",
        source: "bishOS",
      },
      {
        term: "Record queue (“Record this next time”)",
        definition: "The list of delegate-flagged tasks without an SOP. The next time you do one, record it and create the SOP.",
        example: "“Update CRM after calls” waits in the queue until Thursday's run is recorded.",
        source: "bishOS + Camcorder Method",
      },
      {
        term: "Ran it (performed log)",
        definition: "A one-click log that you ran a process today. It shows how often a process really happens.",
        example: "“Ran yesterday” on your weekly reporting SOP.",
        source: "bishOS",
      },
    ],
    testing: [
      "Go to /delegation. Expected: five tabs; the Time audit tab opens (or the last tab you used).",
      "Type “Invoices”, choose 30m, $, Draining, click Log. Expected: the preview said “Lands in Delegation”; toast “Logged · Invoices — Delegation quadrant”; the block appears under Today in Logged blocks; 2-week audit shows 1 / 14 days.",
      "Switch to “Start – end”, enter 09:00 and 09:45, log “Client call”, $$$$, Energizing. Expected: a 45m block; the next start time is now 09:45.",
      "Click the recent chip “Invoices”. Expected: value, energy and minutes fill in from last time.",
      "Change Day to yesterday and log a block. Expected: it shows under Yesterday; 2-week audit shows 2 / 14 days.",
      "Open DRIP. Expected: “N% of your logged time energizes you”; Invoices in Delegation, Client call in Production; a “Write SOP: Invoices” button on the Delegation card.",
      "Click “Write SOP: Invoices”. Expected: the SOP editor opens with the name “Invoices” and rung Admin.",
      "Add 7 steps. Expected: the counter turns green “7 steps · sweet spot”. Paste a Loom link and click Save. Expected: toast “SOP created”; the card is in the Processes tab with “7 steps” in green and a Video link.",
      "Open that SOP again, set Status to Documented, click Save. Expected: celebration “SOP documented: Invoices”.",
      "Open Buyback. Enter 100000 and USD. Expected: Your hour = $50.00, Buyback rate = $12.50. Click Save. Expected: toast “Buyback rate updated”; Delegate candidates lists Invoices with h/wk and a weekly cost.",
      "Open a task in /tasks and tick “Should not be me — record it next time (Delegation)”. Back in Processes. Expected: the task is in “Record this next time”. Click “Create SOP from task”. Expected: toast “Draft SOP created”; the editor opens with the task title.",
      "On an SOP card click “Ran it”. Expected: toast “Logged a run”; the button changes to “Ran today” and is disabled.",
      "Open Ladder. Expected: Admin shows a readiness % and chips (documented, draft, tasks to record); the focus rung has the “Next” chip; “Open SOPs” jumps to Processes filtered to that rung.",
      "Set an SOP to Delegated and Owner to a name, save. Expected: celebration “Handed off: … 🙌”; the card says “Owner: <name>”; readiness rises.",
      "In the editor click Delete once. Expected: it shows “Tap again”; a second click deletes with toast “SOP deleted”.",
    ],
    tips: [
      "Rough and fast beats precise in the audit. One tap for $ and one for energy.",
      "Start with Admin, even if it feels small — it is the easiest first hire.",
      "Never write an SOP from scratch: record the next run, then write the steps from the video.",
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════
  // ENERGY & WELLBEING (System)
  // ═══════════════════════════════════════════════════════════════════════
  {
    id: "energy-wellbeing",
    group: "System",
    title: "Energy & Wellbeing",
    summary:
      "Energy & Wellbeing turns your morning check-ins, focus sessions, calendar blocks and shutdowns into your own energy curve and gentle early-warning signals for burnout. When signals rise, it suggests protective actions — less, not more.",
    why:
      "Founders burn out quietly. Seeing your real sleep–energy link, your best focus hours and early warning signs helps you put hard work at your peak and rest before it is too late. Observations, not diagnoses.",
    when: {
      daily:
        "Do the morning check-in on Today (sleep, sleep quality, energy, mood — about 10 seconds). Use the focus timer for deep work. Run the evening shutdown.",
      weekly: "Open this page during the weekly review. Read Observations and act on one “Suggested” card in the Protective toolkit.",
      monthly: "On the 1st, answer the 3-question burnout pulse (it is also part of the monthly review).",
      oneTime:
        "Check “Weekly work-hours warning” in Settings → Wellbeing (default 55). Do 14 check-ins so your curve is ready, and 10 focus sessions so your best hours appear.",
    },
    pages: [
      {
        route: "/insights",
        title: "Energy & Wellbeing",
        purpose: "Learn your own energy curve, spot burnout signals early and protect recovery.",
        elements: [
          {
            name: "Energy & Wellbeing (page header)",
            what: "Title and rule: learn your own curve and protect recovery. Observations, not diagnoses.",
          },
          {
            name: "Energy · 7d",
            what: "Your average energy (1–5) over the last 7 days, compared with your 4-week baseline: “steady vs 4-week baseline”, “▲ 0.5 vs baseline” (green) or “▼ 0.5 vs baseline”.",
          },
          {
            name: "Mood · 7d",
            what: "Your average mood (1–5) over the last 7 days, with the same baseline comparison.",
          },
          {
            name: "Sleep · 7d",
            what: "Average hours of sleep per night over the last 7 days.",
          },
          {
            name: "Check-ins",
            what: "Total morning check-ins, with “N more to learn your curve” (under 14) or “your curve is ready”.",
          },
          {
            name: "Low mood banner",
            what: "A blue support box when you logged mood 2 or lower on 5 or more of the last 7 check-ins. It asks you to talk to someone you trust — and a professional if it continues — and links to Support resources.",
          },
          {
            name: "Learning your curve · N of 14 check-ins",
            what: "Shown until you have 14 check-ins. Explains that chronotype quizzes are unreliable and your own data is better. A bar shows progress. “Check in today →” opens Today.",
          },
          {
            name: "Observations",
            what: "Eight burnout signals. These are design heuristics from founder-burnout research — not clinical cutoffs. A headline says “No warning signs right now. Keep protecting your recovery.” or “A missed day is normal; restart today. Here's what your data suggests protecting.”",
          },
          {
            name: "Observation card",
            what: "Active signals come first with an orange background and an eye icon, plus a kind message. Inactive ones show a check: “· all clear” (green) or “· not enough data” (grey). Each shows the numbers behind it.",
          },
          {
            name: "55+ hour weeks",
            what: "Active when you worked your weekly cap or more (default 55h, from Settings) in 2 of the last 3 weeks. Hours = focus sessions + calendar blocks marked done (not free blocks, not counted twice).",
          },
          {
            name: "Short sleep",
            what: "Active when your average sleep is under 6.5 hours, with at least 3 nights logged in the last 7 days.",
          },
          {
            name: "No full day off",
            what: "Active when none of the last 14 finished days was a rest day. A rest day = a day marked Free, or under 30 minutes of logged work. Today counts only if it is marked Free. Needs 7+ worked days.",
          },
          {
            name: "Shutdown skipped",
            what: "Active when the evening shutdown (the Today shutdown ritual or a shutdown routine) was done on 2 or fewer of the last 5 workdays (Mon–Fri). Needs 3+ active days.",
          },
          {
            name: "Energy or mood dip",
            what: "Active when your 7-day average energy or mood is 1 point or more below your 4-week baseline (days 7–34 ago). Needs 3+ recent check-ins and 7+ baseline check-ins.",
          },
          {
            name: "Effort not converting",
            what: "Active when last week's execution score (12-week tactics done ÷ planned) fell 15+ points below the two weeks before, while you still worked 80%+ of your hours cap.",
          },
          {
            name: "Low mood for several days",
            what: "Active when mood was 2 or lower on 5+ of the last 7 check-ins.",
          },
          {
            name: "Burnout pulse",
            what: "Active when your latest monthly pulse (within 45 days) has exhaustion 4+, detachment 4+, or efficacy 2 or lower.",
          },
          {
            name: "Hours (focus + done blocks)",
            what: "Chips for the last 3 weeks: “wk of <date> · Nh”. Orange when at or above your cap.",
          },
          {
            name: "Protective toolkit",
            what: "Seven protective actions. When signals rise, the answer is less — not more. Cards linked to an active signal show a “Suggested” chip and come first. Click a card to go to the right page.",
          },
          {
            name: "Run a lighter week: Top 1, not Top 3",
            what: "Pick one outcome a day for the next few days. Link: Plan today (/today).",
          },
          {
            name: "Propose a Free Day",
            what: "Block one full day with no work — plan it first. Link: Open week plan (/week).",
          },
          {
            name: "Enforce the shutdown",
            what: "Pick a hard stop, run the 10-minute shutdown, close the laptop. Link: Open routines.",
          },
          {
            name: "Switch habits to their minimum versions",
            what: "Log the 2-minute version this week — it counts fully and keeps streaks alive. Link: Open habits.",
          },
          {
            name: "What can I delegate, automate or drop?",
            what: "Find one low-$ draining task in the time audit and hand it off, automate it or delete it. Link: Open delegation.",
          },
          {
            name: "Protect tonight's sleep",
            what: "Screens off 30 minutes earlier and run the evening routine. Link: Evening routine.",
          },
          {
            name: "Talk to someone",
            what: "Share how the last weeks felt with your co-founder, a partner or a friend; a professional if low mood persists. Link: Support resources.",
          },
          {
            name: "Energy & mood · 30 days",
            what: "Two lines (Energy and Mood, 1–5) for the last 30 days, with gaps on days without a check-in. Hover to see the day's values.",
          },
          {
            name: "Sleep · 30 days",
            what: "A line of hours slept per night (up to 10h). Empty: “Add sleep hours to your check-in.”",
          },
          {
            name: "Energy by weekday",
            what: "Average energy for each weekday over the last 90 days. The best day is darker. Hover for the number of check-ins.",
          },
          {
            name: "Sleep vs energy",
            what: "Each dot is a check-in: hours slept (left to right) vs energy (bottom to top). The dashed line marks 7 hours. With 3+ nights on each side it says: “After 7h+ sleep your energy averages X vs Y on shorter nights.”",
          },
          {
            name: "Your best focus hours",
            what: "Focus minutes by start hour over the last 60 days. Your top 3 hours are darker. After 10 sessions it names your peak 2-hour window (e.g. “9a–11a”) — protect it for maker work. Before that: “Learning your curve · N of 10 sessions.”",
          },
          {
            name: "Monthly burnout pulse",
            what: "Three questions once a month, each 1–5: how often work left you drained (exhaustion: Rarely → Constantly), how often you felt detached or negative about work (detachment: Rarely → Constantly), and how confident you are that you're accomplishing worthwhile things (efficacy: Not at all → Very).",
            how: "Tap a number for each question, then click “Save this month's pulse”.",
          },
          {
            name: "Pulse result",
            what: "After saving: three tiles (exhaustion, detachment, efficacy as N/5) and “Done for this month. Next pulse opens on the 1st — fresh starts work best on landmarks.” “Retake” lets you answer again (Cancel to stop).",
          },
          {
            name: "Pulse history",
            what: "Up to 6 past months: “E · D · Ef” scores per month.",
          },
          {
            name: "This is not a clinical tool",
            what: "The support section. These are simple heuristics that can be wrong. If low mood, exhaustion or hopelessness lasts two weeks or more, talk to a doctor or mental-health professional. In crisis, call your local emergency number or find a free helpline at findahelpline.com.",
          },
        ],
        howTo: [
          "Do the morning check-in on Today every workday.",
          "Use the focus timer for deep work so your focus hours are tracked.",
          "Once a week, read Observations from top to bottom.",
          "If a signal is active, open one “Suggested” card and do that action this week.",
          "On the 1st of each month, answer the pulse honestly.",
        ],
      },
      {
        route: "/today",
        title: "Morning check-in (where the data comes from)",
        purpose: "The check-in inside the morning start-up ritual feeds every chart on Energy & Wellbeing.",
        elements: [
          {
            name: "How are you, really?",
            what: "The check-in step of “Start my day”. Ten seconds. Your energy decides how ambitious today should be.",
          },
          {
            name: "Sleep last night",
            what: "A slider from 3 to 11 hours in half-hour steps.",
          },
          {
            name: "Sleep quality",
            what: "Five faces: Awful, Poor, OK, Good, Great.",
          },
          {
            name: "Energy",
            what: "Five levels: Empty, Low, OK, Good, Charged (1–5).",
          },
          {
            name: "Mood",
            what: "Five levels: Rough, Meh, Fine, Good, Great (1–5).",
          },
          {
            name: "Low-energy day",
            what: "A checkbox: Top 1 only, habits at their minimum version.",
          },
        ],
      },
      {
        route: "/settings",
        title: "Wellbeing setting",
        purpose: "Set the weekly hours number used by the long-hours signal.",
        elements: [
          {
            name: "Weekly work-hours warning",
            what: "In Settings → Wellbeing (20–90, default 55). 55h+ a week is linked to real health risk (WHO/ILO). The “55+ hour weeks” observation uses this number.",
          },
        ],
      },
    ],
    frameworks: [
      {
        term: "Energy curve",
        definition: "Your personal pattern of energy across the day and the week, learned from your own check-ins and focus sessions — not from a quiz.",
        example: "Your data shows Tuesdays are your best days and 9–11am your best focus window — you put sales calls in the afternoon.",
        source: "bishOS; chronotype research (quizzes show weak effects)",
      },
      {
        term: "4-week baseline",
        definition: "Your normal level: the average of your check-ins from 7 to 34 days ago. The last 7 days are compared with it.",
        example: "Baseline energy 3.8, this week 2.6 → a 1.2-point dip.",
        source: "bishOS",
      },
      {
        term: "Peak focus window",
        definition: "The 2-hour block of the day where you logged the most focus minutes (needs 10+ sessions). Protect it for maker work.",
        example: "“Your peak window: 9a–11a” → no meetings before 11.",
        source: "bishOS (your own data)",
      },
      {
        term: "Burnout signals (observations)",
        definition: "Simple warning signs computed from your data. They are design heuristics from founder-burnout research, not a diagnosis. An active signal suggests protective actions.",
        example: "Two signals active this week → you run a lighter week and plan a Free Day.",
        source: "bishOS; founder-burnout research",
      },
      {
        term: "Long-hours signal (55+ hour weeks)",
        definition: "Working your cap (default 55 hours) or more in 2 of the last 3 weeks. Long weeks are linked to real health risk.",
        example: "58h, 61h, 44h → active.",
        source: "WHO/ILO 2021 study on long working hours",
      },
      {
        term: "Short-sleep signal",
        definition: "Average sleep under 6.5 hours over the last 7 days (with at least 3 nights logged). Less sleep blurs judgement.",
        example: "6h, 5.5h, 6h, 7h → average 6.1h → active.",
        source: "Sleep research (adults need 7+ hours)",
      },
      {
        term: "No-day-off signal",
        definition: "None of the last 14 days was a real rest day (marked Free, or under 30 minutes of work).",
        example: "You worked every day for two weeks, even “just an hour” on Sundays → active.",
        source: "Dan Sullivan, Strategic Coach (Free Days); recovery research",
      },
      {
        term: "Shutdown signal",
        definition: "The evening shutdown was done on 2 or fewer of the last 5 workdays. Mentally leaving work at night (detachment) lowers exhaustion.",
        example: "You skipped shutdown Mon, Tue, Thu → active.",
        source: "Cal Newport, Deep Work (shutdown ritual); Sabine Sonnentag (psychological detachment)",
      },
      {
        term: "Mood/energy dip signal",
        definition: "Your 7-day average energy or mood is at least 1 point below your 4-week baseline.",
        example: "Mood baseline 4.0, this week 2.9 → active.",
        source: "bishOS",
      },
      {
        term: "Effort-not-converting signal",
        definition: "Your weekly execution score dropped 15+ points while your hours stayed high (80%+ of your cap). More hours are not helping; less and more focused is the fix.",
        example: "Execution 85% → 62% with 50 hours worked → active.",
        source: "bishOS; execution score from The 12 Week Year (Moran & Lennington)",
      },
      {
        term: "Low-mood signal",
        definition: "Mood 2 or lower on 5+ of the last 7 check-ins. bishOS shows a support banner and suggests talking to someone.",
        example: "Five “Rough”/“Meh” mornings this week → banner appears.",
        source: "bishOS; mental-health guidance (seek help if it lasts 2+ weeks)",
      },
      {
        term: "Burnout pulse",
        definition: "A 3-question monthly check, 1–5 each, on the three dimensions of burnout: exhaustion, cynicism (detachment) and efficacy. It is not a validated test. A score of exhaustion 4+, detachment 4+ or efficacy 2 or lower turns the pulse signal on.",
        example: "Exhaustion 4, detachment 2, efficacy 4 → the signal is active because of exhaustion.",
        source: "WHO ICD-11 burnout definition; Christina Maslach (Maslach Burnout Inventory)",
      },
      {
        term: "Exhaustion",
        definition: "Feeling drained of energy by work. Question: “How often did work leave you drained of energy this month?” (1 Rarely – 5 Constantly; higher is worse).",
        example: "You end most days unable to think → 4 or 5.",
        source: "WHO ICD-11; Maslach",
      },
      {
        term: "Cynicism (detachment)",
        definition: "Feeling distant from, or negative about, your work. Question: “How often did you feel detached from, or negative about, your work?” (1 Rarely – 5 Constantly; higher is worse).",
        example: "Client messages make you roll your eyes all week → 4.",
        source: "WHO ICD-11 (mental distance); Maslach",
      },
      {
        term: "Efficacy",
        definition: "Feeling that you accomplish worthwhile things. Question: “How confident are you that you're accomplishing worthwhile things?” (1 Not at all – 5 Very; lower is worse).",
        example: "You feel busy but useless → 2.",
        source: "WHO ICD-11 (reduced efficacy); Maslach",
      },
      {
        term: "Protective actions",
        definition: "Seven responses to rising signals that reduce load instead of adding pressure: a lighter week (Top 1), a Free Day, a hard shutdown, minimum-version habits, delegate/automate/drop, protect sleep, and talk to someone.",
        example: "Long hours + no day off active → “Propose a Free Day” and “Run a lighter week” are Suggested.",
        source: "bishOS; recovery research",
      },
      {
        term: "Top 1, not Top 3",
        definition: "On a low week, pick only one outcome per day. Everything else is a bonus, not a debt.",
        example: "Today's Top 1: send the proposal. Nothing else is required.",
        source: "bishOS",
      },
      {
        term: "Free Day",
        definition: "A full day with no work at all — no email, no Slack, no “quick check”. Plan it first, then plan the week around it.",
        example: "Saturday is your Free Day; it never breaks your streaks.",
        source: "Dan Sullivan, Strategic Coach",
      },
      {
        term: "Minimum version (habit)",
        definition: "The 2-minute version of a habit. On hard weeks it counts fully and keeps the streak alive.",
        example: "Instead of a 45-minute workout, 10 push-ups.",
        source: "James Clear, Atomic Habits (two-minute rule)",
      },
      {
        term: "Weekly work-hours warning (cap)",
        definition: "Your personal weekly hours limit in Settings. Weeks at or above it count as long weeks.",
        example: "You set 50 because you want more margin than the default 55.",
        source: "WHO/ILO (55+ hours linked to health risk)",
      },
    ],
    testing: [
      "Go to /today, click “Start my day”, fill “How are you, really?” (sleep, sleep quality, energy, mood) and finish. Open /insights. Expected: Check-ins goes up by 1; today's dot appears in “Energy & mood · 30 days”.",
      "With fewer than 14 check-ins. Expected: the “Learning your curve · N of 14 check-ins” card with a progress bar and “Check in today →”.",
      "Open “Monthly burnout pulse”, choose 4 / 2 / 4, click “Save this month's pulse”. Expected: toast “Pulse saved — thank you for checking in”; tiles 4/5 exhaustion, 2/5 detachment, 4/5 efficacy; “Done for this month…”.",
      "Reload. Expected: in Observations, “Burnout pulse” is active (orange, eye icon) and shows “Exhaustion 4/5 · Detachment 2/5 · Efficacy 4/5”; in the Protective toolkit “Talk to someone”, “Run a lighter week” and “What can I delegate…” show “Suggested” and come first.",
      "Click “Retake”, answer 2 / 2 / 4, save. Expected: the pulse signal turns “all clear”.",
      "Click any toolkit card. Expected: it opens the right page (e.g. “Open delegation” → /delegation).",
      "Log sleep under 6.5h on 3 of the last 7 days. Expected: “Short sleep” becomes active with the average.",
      "Run 10 focus sessions over a few days. Expected: “Your best focus hours” shows bars and “Your peak window: …”.",
      "Log 3+ check-ins with 7h+ sleep and 3+ with less. Expected: “Sleep vs energy” shows dots and the sentence comparing rested vs short nights.",
      "In Settings → Wellbeing change “Weekly work-hours warning” to 30. Expected: the observation title becomes “30+ hour weeks” and hour chips at or above 30 turn orange.",
      "Click “Support resources” in the low-mood banner or toolkit. Expected: the page scrolls to “This is not a clinical tool” with the findahelpline.com link.",
    ],
    tips: [
      "A missed day is normal; restart today.",
      "When signals rise, do less — not more. Pick one Suggested action, not all seven.",
      "This page is not a doctor. If you feel low for two weeks or more, talk to a professional.",
    ],
  },
];
