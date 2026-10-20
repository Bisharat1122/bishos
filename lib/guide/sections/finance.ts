import type { GuideSection } from "../types";

/**
 * Finance — personal + business money (Founder group).
 * Two chapters: (1) cash, spending & runway; (2) budgets, bills, invoices & goals.
 * Pure data (no runtime imports). Text matches the real UI labels and the rules
 * in convex/finance.ts and components/finance/*.
 */
export const sections: GuideSection[] = [
  // ───────────────────────────────────────────────────────────────────────
  // FINANCE 1 — CASH, SPENDING & RUNWAY
  // ───────────────────────────────────────────────────────────────────────
  {
    id: "finance",
    group: "Founder",
    title: "Finance · cash, spending & runway",
    summary:
      "One calm place for personal and business money. You log what comes in and what goes out, and Finance shows where it went, how much you kept, and how many months your business cash will last.",
    why:
      "Most founders look at money only when it is already a problem. Here one expense takes about 10 seconds, and the app does the math for you: net, savings rate, burn and runway. You see a cash problem months early. You keep personal and business money apart. Founder HQ, the Today page and your weekly scorecard get real numbers without extra work.",
    when: {
      oneTime:
        "About 10 minutes. Open Finance and run “Set up finance”: pick your currency, name one personal and one business account, and type today's balances. Then, in Accounts & goals, add every other place money lives (cash wallet, savings, credit card, loan) with its opening balance.",
      daily:
        "Log every spend and every payment on the same day. On Overview, type “45 groceries” or “1.2k Figma” in the quick add bar and press Enter. If the Today page shows a Money card, deal with it (pay the bill, chase the invoice).",
      weekly:
        "Money check in your weekly review (about 10 minutes): log anything you missed, mark bills and invoices paid, read the Business runway card and the budget bars. Compare each account balance with your real bank app. The scorecard number “Cash collected” fills itself.",
      monthly:
        "On the 1st, click last month in the cashflow chart. Read the four tiles, the insights and “Where it went”. Export the month as CSV for your accountant if you need it.",
    },
    pages: [
      // ── First-run setup ──────────────────────────────────────────────
      {
        route: "/finance (first visit)",
        title: "Set up your money (first-run screen)",
        purpose:
          "Finance shows this card until you have at least one account. In one click it saves your currency, creates one personal and one business bank account, and adds ready-made categories.",
        elements: [
          {
            name: "Set up your money in 30 seconds (card title)",
            what: "A wallet icon, the title and the line “One calm place for personal and business money: what comes in, what goes out, your runway, bills and invoices. We'll add ready-made categories (rent, food, SaaS, contractors, client revenue…) and one account for each side.”",
          },
          {
            name: "Currency",
            what: "A list of 15 currencies, shown as “USD · US dollar”, “PKR · Pakistani rupee”, “EUR · Euro” and so on. Hint: “You can change it any time from the Finance header.”",
            how: "Pick the currency you think in. If you change it here, it is saved to your settings when you click Set up finance. All amounts use one currency; nothing is converted.",
          },
          {
            name: "Personal · Account name",
            what: "The name of your first personal account. Default: “Personal account”.",
            how: "Type the real name, for example “Meezan Personal”. It becomes a bank account on the Personal side.",
          },
          {
            name: "Personal · Balance today",
            what: "The money in that personal account right now. The label shows your currency symbol, e.g. “Balance today ($)”. Hint: “Optional”.",
            how: "Type a plain number like 2000 or 2,000 (no “k” here). Empty means 0. It becomes the account's opening balance.",
          },
          {
            name: "Business · Account name",
            what: "The name of your first business account. Default: “Business account”.",
            how: "Type your business bank's name, for example “Meezan Business”.",
          },
          {
            name: "Business · Balance today",
            what: "The money in the business account right now. Hint: “Optional · powers your runway”.",
            how: "Fill it in. Runway is business cash divided by net burn, so without this number runway is wrong.",
          },
          {
            name: "Set up finance (button)",
            what: "Creates everything. It adds the 21 default categories only if you have no categories yet, and an account only for a side that has none, so it is safe to click twice.",
            how: "Click it. You see the toast “Finance is ready. Log your first transaction!” and confetti, then the tabs appear. If a balance is not a number you see “Balances must be numbers”.",
          },
          {
            name: "Ready-made categories (created by setup)",
            what: "Personal spending: Rent/Housing, Food & Groceries, Transport, Utilities, Health & Fitness, Learning, Entertainment, Family. Business spending: Software/SaaS, Contractors, Marketing/Ads, Office, Taxes, Bank fees, Salaries. Both sides: Other. Income: Salary/Owner draw (personal), Client revenue, Retainers, Product sales (business), Other (both).",
            how: "Rename, re-scope or archive them later in Accounts & goals → Categories.",
          },
        ],
        howTo: [
          "Open Finance from the sidebar (Founder group → Finance).",
          "Pick your currency.",
          "Type the names of your main personal and business bank accounts.",
          "Type today's real balance of each. Take the number from your bank app.",
          "Click “Set up finance”.",
          "Go to Accounts & goals and add your other accounts: cash wallet, savings, credit card (negative balance), loan (negative balance).",
        ],
      },

      // ── Header, tabs and filters ─────────────────────────────────────
      {
        route: "/finance",
        title: "Finance header, tabs and filters",
        purpose:
          "The top part of every Finance tab: currency, the Add transaction button, the six tabs, the month picker and the All / Personal / Business switch.",
        elements: [
          {
            name: "Finance (page header)",
            what: "Page title with a wallet icon and the line “Personal and business money in one calm place: cash, runway, bills and invoices.”",
          },
          {
            name: "Currency picker (coin icon)",
            what: "A small drop-down at the top right with the 15 currency codes and “Other…”. It is the same currency as in Settings, so Pipeline deal values and money metrics in the scorecard use it too.",
            how: "Pick a code. Toast: “Currency set to EUR. Amounts aren't converted.” (only the symbol changes). For “Other…” type a 3-letter code in the box “3-letter currency code (e.g. NOK, JPY, KES)”. A wrong code shows ““XYZ” isn't a currency code we recognise”.",
          },
          {
            name: "Add transaction (button)",
            what: "Opens the “Log money in or out” dialog. It appears after setup. A new entry starts on the Business side if the scope switch is on Business, otherwise on Personal.",
            how: "Click it from any tab. Shortcut link: /finance?add=1 opens the same dialog (then the link cleans itself).",
          },
          {
            name: "Tabs: Overview · Transactions · Budgets · Recurring · Invoices · Accounts & goals",
            what: "The six parts of Finance. The web address remembers the tab, e.g. /finance?tab=budgets. Overview has no tab in the address.",
            how: "Click a tab. Changing tabs by hand clears a category filter that came from clicking “Where it went”.",
          },
          {
            name: "Month picker (‹ October 2026 ›)",
            what: "Shown in the header on Overview (Transactions and Budgets have their own copy). The month is shared, so Overview, Transactions and Budgets always show the same month.",
            how: "Click ‹ to go back one month and › to go forward. › is disabled on the current month. A “This month” button appears when you look at another month. If you are on the current month at midnight on the 1st, it moves to the new month by itself.",
          },
          {
            name: "Scope switch: All · Personal · Business",
            what: "Chooses whose money you see. All = everything. Personal = personal accounts, entries and categories. Business = business only. Hidden on Invoices (invoices are always business). Your choice is remembered in this browser.",
            how: "Click a side. In Personal or Business, a transfer between the two sides counts as money out for one side and money in for the other (owner draw / owner funding). In All it nets to zero.",
          },
          {
            name: "Loading blocks",
            what: "Grey placeholder blocks while your data loads. They keep the layout still.",
          },
        ],
        howTo: [
          "Leave the scope on All for the big picture.",
          "Switch to Business before you read runway, burn and the business cashflow.",
          "Switch to Personal to see your household spending and savings rate.",
        ],
      },

      // ── Overview ─────────────────────────────────────────────────────
      {
        route: "/finance",
        title: "Overview tab",
        purpose:
          "Your money dashboard for one month and one scope: quick add, four key numbers, smart insights, 12-month cashflow, business runway, where the money went, budgets, cash, bills, money owed to you and savings goals.",
        elements: [
          {
            name: "Quick add bar",
            what: "A one-line form at the top. It shows only when you look at the current month. It has an Out / In switch, a text box, a category list, a Personal / Business switch and an Add (+) button. The date is always today.",
            how: "Type the amount and what it was for, e.g. “45 groceries”, “groceries 45”, “1.2k Figma” or “1,200 rent”, then press Enter. Placeholders: “45 groceries · 1.2k Figma” (Out) and “1200 client payment” (In). The app guesses the category, side and account; change them before you press Enter if needed. Toast: “Expense logged · $45” with +2 XP.",
          },
          {
            name: "Quick add preview line",
            what: "Under the bar. Before you type: “Type an amount and what it was for. We guess the category from your history.” While you type it shows what will be saved, e.g. “−$45 · groceries · Food & Groceries · Personal account · Today · Enter to add”.",
            how: "Check the category and account here before you press Enter. Without an amount you get “Start with an amount, like “45 groceries””.",
          },
          {
            name: "Income · Oct (tile)",
            what: "All money in for the month and scope. The small line compares with last month: “▲ 12% vs Sep” in green when income went up, amber when it went down. Other texts: “Nothing logged yet”, “First month with data”, “Same as Sep”.",
          },
          {
            name: "Expenses · Oct (tile)",
            what: "All money out for the month and scope, with the same comparison line. Here green means spending went down; amber means it went up.",
          },
          {
            name: "Net (tile)",
            what: "Income minus expenses. Green with a + when positive, amber when negative. Line: “Money kept this month” or “Spent more than came in”.",
          },
          {
            name: "Savings rate (tile)",
            what: "Net ÷ income × 100. “—” with “Log income to see it” when there is no income. Green with “Healthy: 20%+ kept” at 20% or more; amber when negative; otherwise “Share of income you kept”.",
          },
          {
            name: "Insight cards",
            what: "Up to 4 short tips, most important first: runway under 6 months (“Runway is 4.5 months. Collections and revenue first this week”), overdue invoices (“2 overdue invoices ($3,000): a quick nudge could bring in cash”), budgets over (“Food & Groceries is over budget this month”), a category up 20%+ (“Transport spend up 35% vs last month”), savings (“You kept 28% of what came in so far this month” or “Spending is ahead of income by $400 this month”), pace (from day 7 of the current month: “At this pace you'll spend 18% more than last month” / “On pace to spend 20% less than last month”), a category down 25%+ (past months only), “All 4 budgets on track so far” (current month), and “Subscriptions cost $85/month ($1,020/year)”.",
            how: "Cards about categories open Transactions, budget cards open Budgets, invoice cards open Invoices, the subscriptions card opens Recurring. The others are just information.",
          },
          {
            name: "Cashflow · last 12 months (chart)",
            what: "12 months that end at the selected month. Each month has two columns, Income (teal) and Expenses (rose), and a dark Net line that can go below zero. The selected month has a grey background. Hint: “Click a month to open it.” With no data: “Your 12-month cashflow appears here once you log income and expenses.”",
            how: "Hover a month (or Tab to it) to see a box with exact Income, Expenses and Net. Click a month (or press Enter) to move the whole page to that month.",
          },
          {
            name: "Table / Chart (toggle)",
            what: "A small button above the chart. Table shows the same 12 months as rows (newest first) with Month, Income, Expenses and Net; negative net is amber and the selected month is shaded.",
            how: "Click “Table” to read exact numbers, “Chart” to go back.",
          },
          {
            name: "Business runway (card)",
            what: "A ring with the main number and a short message. The ring is full at 12 months. Headline: “Profitable” (business income covers spending), “8.5 mo”, “99+ mo”, or “—” (no data). Ring colour: green at 12+ months or profitable, normal from 6 to 12, amber under 6. The hint says “Avg of the last 3 months” (or 1–2 months for a young business) or “Based on this month so far” when you have no older business data.",
          },
          {
            name: "Runway message",
            what: "One line that changes with the runway: “Comfortable. A year or more of cash at this burn.” (12+), “Healthy. Keep revenue moving and watch big new costs.” (6–12), “Getting short. Prioritise collections and closing deals.” (3–6), “Tight. Make cash this week's #1 focus: invoices, deals, cuts.” (under 3), “Business income covers spending. Every month adds to the bank.” (profitable), “Log business income and expenses to see how long your cash lasts.” (no data).",
          },
          {
            name: "Business cash · Burn / month · Income / month · Net burn",
            what: "Four numbers under the ring. Business cash = balances of open business bank, cash, wallet and savings accounts (amber if negative). Burn / month = average business money out (expenses + owner draws). Income / month = average business income (money moved in from personal does not count). Net burn = burn − income; when you earn more than you spend it shows “+$1,200” in green.",
          },
          {
            name: "Runway rule (info line)",
            what: "“Runway = business cash ÷ net burn. Owner draws count as burn; money you move in doesn't count as income.”",
          },
          {
            name: "Log business money (button)",
            what: "Shown in the runway card only when you have no business entries yet.",
            how: "Click it to open the Transactions tab and log business income and expenses.",
          },
          {
            name: "Where it went · Oct",
            what: "Spending by category for the month: name, amount, share of the month's spending (e.g. “32.5%”), a bar, and the change vs last month (“new”, “same”, “▲ 15% vs Sep”). Top 9 rows, then “+3 more categories”. In Personal or Business view you can also see transfer rows: “Owner draw (to personal)”, “Moved to business”. Empty: “No spending logged this month”.",
            how: "Click a category row to open Transactions filtered to that category and month. “Uncategorised” and transfer rows cannot be clicked. “All transactions” at the top right opens the Transactions tab.",
          },
          {
            name: "Budget vs actual",
            what: "Up to 7 categories that have a budget, highest % used first: “$120 / $300”, a bar, and “$180 left · 40% used” or “$50 over budget”. The bar is green under 80%, amber from 80% to 100%, red above 100% (a dark tick marks the budget line). Empty: “No budgets yet” with “Set budgets”.",
            how: "Click “Budgets” or “Set budgets” to open the Budgets tab.",
          },
          {
            name: "Cash by account",
            what: "A big number “Cash on hand” (with “· personal” or “· business” in a scoped view). In All view, “Net worth” shows on the right when it differs from cash. Below: every open account in the view with its type, side and balance (amber when negative). Empty: “No accounts in this view.”",
            how: "Click “Accounts” to manage accounts.",
          },
          {
            name: "Bills · next 14 days",
            what: "Active money-out recurring items that are late or due in the next 14 days (up to 6). Each row: name, a chip “3 days late” (amber) or “Today” (blue) or the day (“Tomorrow”, “Thursday”, “Oct 30”), the amount and a “Paid” button. The hint shows “Subscriptions: $85/month”. Empty: “Nothing due soon”.",
            how: "Click “Paid” (it is filled when the bill is late or due today). It logs the payment with today's date, moves the due date one cycle forward and shows “Figma paid · next due on Nov 20” with +2 XP. “Recurring” opens the Recurring tab.",
          },
          {
            name: "Money owed to you",
            what: "Shown in All and Business view. Sent invoices that are not paid, earliest due first (up to 8): client name (or the invoice title), “12d overdue” in amber or “Due in 3 days”, the amount and a “Paid” button. Hint: “$4,000 outstanding · $1,500 overdue”. Empty: “No unpaid invoices”.",
            how: "Click “Paid” when the money lands. It logs business income, gives +15 XP with confetti and shows “Paid: Website build: milestone 1”. “Invoices” opens the Invoices tab.",
          },
          {
            name: "Savings goals (card)",
            what: "In Personal view it takes the third column. In All or Business view it shows as a wide card under the row, only when you have goals. Each goal: name (side chip in the wide card), %, a bar (green at 100%), and “$2,000 of $6,000 · by Mar 1 · Savings account”. Empty: “No savings goals yet” with “Add a goal”.",
            how: "Click “Goals” or “Add a goal” to open Accounts & goals.",
          },
        ],
        howTo: [
          "Every day: type each spend in the quick add bar and press Enter.",
          "Once a week: switch to Business and read the runway card. Under 6 months means cash is this week's #1 priority.",
          "Click “Paid” on bills and invoices as money moves.",
          "On the 1st: click last month in the chart, read the tiles, insights and Where it went.",
          "Click a big category in Where it went to see every entry behind it.",
        ],
      },

      // ── Transaction dialog ───────────────────────────────────────────
      {
        route: "/finance?add=1",
        title: "Log money in or out (dialog)",
        purpose:
          "The full form for one entry: an expense, an income or a transfer between your accounts. The same form edits an entry (title “Edit transaction”, or inline in the Transactions list).",
        elements: [
          {
            name: "Expense · Income · Transfer (type switch)",
            what: "What kind of money movement this is. Expense = money out, Income = money in, Transfer = money moving between two of your own accounts.",
            how: "Click one. Changing the type clears a category that does not fit.",
          },
          {
            name: "Amount (USD)",
            what: "A big field that is focused when the dialog opens. It accepts 45, 1,200, 12.50, 1.2k (1,200) and 2m (2,000,000).",
            how: "Type the amount. It must be above zero, otherwise you see “Enter an amount above zero”.",
          },
          {
            name: "Date",
            what: "The day the money moved. Default: today.",
            how: "Pick another day for an older entry.",
          },
          {
            name: "Paid from / Into account",
            what: "Shown for Expense (“Paid from”) and Income (“Into account”). A list of open accounts like “Meezan Business · Business”.",
            how: "Pick the account. The “For” switch then jumps to that account's side.",
          },
          {
            name: "Category",
            what: "“Uncategorised” plus the categories that fit the type and the side (a “Both” category fits either side).",
            how: "Pick one so reports and budgets work. If you leave it empty and type a payee, the app guesses one when you leave the payee box.",
          },
          {
            name: "For: Personal · Business",
            what: "Which side this money belongs to. It decides where it counts (personal savings rate or business burn).",
            how: "Click a side. On a new entry, the account switches to that side's default account (its first bank account).",
          },
          {
            name: "Payee / From (payer)",
            what: "Who you paid (Expense) or who paid you (Income). Placeholders: “e.g. Figma, landlord, grocery store” and “e.g. Acme Inc.”. Suggestions come from your last 80 payees.",
            how: "Start typing and pick a suggestion. A payee you used before brings back its category.",
          },
          {
            name: "From / To (transfer accounts)",
            what: "Shown for Transfer instead of account, category, side and payee. Hint under To: “Business → personal counts as an owner draw in scoped views.” A transfer has no category; its side is the From account's side.",
            how: "Pick From, then pick To (“Pick an account…”). Two different accounts are required, otherwise “Pick a different account to move money to”.",
          },
          {
            name: "Note (optional)",
            what: "Free text, placeholder “Anything to remember”. It is searchable and shows on the row.",
          },
          {
            name: "Link to a deal, company or project",
            what: "A small link button. It opens the “Linked to” list with groups Deals (won deals marked “· won”), Companies and Projects. Hint: “Ties this money to your pipeline, a client or a project.”",
            how: "Click it, then pick one. Linking a deal also links that deal's company. The linked name shows on the row with a link icon.",
          },
          {
            name: "Add another after this (checkbox)",
            what: "Only on a new entry. Keeps the dialog open after saving.",
            how: "Tick it to log many receipts in a row. Amount, payee, note and category clear; type, date and account stay.",
          },
          {
            name: "Cancel · Add expense / Add income / Add transfer / Save",
            what: "The save button names the type (“Save” when editing). Enter also saves.",
            how: "Click it or press Enter. Toast: “Expense logged · $45” with +2 XP (editing: “Transaction updated”). An archived account is refused: “Meezan is archived. Pick another account.”",
          },
          {
            name: "Close (×)",
            what: "Top right of the dialog.",
            how: "Click ×, press Esc or click outside the dialog to close without saving.",
          },
        ],
        howTo: [
          "Click “Add transaction”.",
          "Choose Expense, Income or Transfer.",
          "Type the amount; change the date if it was not today.",
          "Pick the account and category; check the For side.",
          "Type the payee. Link a deal or project if it is client money.",
          "Press Enter.",
        ],
      },

      // ── Transactions ─────────────────────────────────────────────────
      {
        route: "/finance?tab=transactions",
        title: "Transactions tab",
        purpose: "Every entry, newest first and grouped by day. Filter, search, edit, delete and export to CSV.",
        elements: [
          {
            name: "Month picker",
            what: "The same ‹ month › control as on Overview, with “This month” when you look at another month.",
            how: "Click the arrows to change month.",
          },
          {
            name: "All time (button)",
            what: "Shows every month at once (the newest 2,000 entries). The button then reads “All time ×”.",
            how: "Click “All time”. Click “All time ×” to go back to one month.",
          },
          {
            name: "All · In · Out · Transfers (type filter)",
            what: "Shows only one kind of entry.",
            how: "Click a kind. Changing it clears the category filter.",
          },
          {
            name: "All accounts (filter)",
            what: "Every account, archived ones marked “(archived)”. A transfer matches when either side is that account.",
            how: "Pick an account to see only its entries.",
          },
          {
            name: "All categories (filter)",
            what: "Hidden when the type is Transfers. When the type is All, names end with “ · in” or “ · out”. It is pre-filled when you click a row in Overview → Where it went.",
            how: "Pick a category to see only its entries.",
          },
          {
            name: "Search payee, note, amount…",
            what: "Searches payee, note, category name, account name, amount and tags. It waits a quarter second after you stop typing.",
            how: "Type part of a word, e.g. “figma” or “1200”.",
          },
          {
            name: "Clear",
            what: "Appears when a type, account, category or search filter is on. It does not change the month or All time.",
            how: "Click it to remove those filters.",
          },
          {
            name: "CSV (button)",
            what: "Downloads the entries in the current view. Columns: Date, Type, Amount, Signed amount, Currency, Account, To account, Category, Scope, Payee, Note, Deal, Company, Project. File name like “finance-2026-10-business.csv” or “finance-all.csv”.",
            how: "Click it. Toast: “Exported 42 transactions”. With nothing in view: “Nothing to export in this view”.",
          },
          {
            name: "Add (button)",
            what: "Opens the “Log money in or out” dialog.",
          },
          {
            name: "Summary line",
            what: "“42 transactions” (plus “(showing 1000)” if there are more than 1,000), then In +…, Out −… and Net. In Personal or Business view, transfers between the sides count as in or out.",
          },
          {
            name: "Day header",
            what: "A grey bar per day: “Today”, “Yesterday”, “3 days ago” or the date, then the full date (“Tue, Oct 20”), and the day's net on the right.",
          },
          {
            name: "Transaction row",
            what: "An icon (green arrow in, arrow out, two arrows for transfer). Title: the payee, else the category, else “Income”/“Expense”; for a transfer “Personal account → Business account”. A ↻ icon means it came from a recurring item; an “Invoice” chip means it is an invoice payment. Second line: category, “Uncategorised” in italics, “· account”, the side chip, a link icon with the linked deal/project/company, and the note. Amount: “+1,200” in green, “−45”, or a plain number for a transfer.",
            how: "Click the row to edit it.",
          },
          {
            name: "Edit (pencil)",
            what: "Shows on hover (always on phones). Opens the full form inline under the row, with “Save” and “Cancel”.",
            how: "Change any field and click Save. If you change the date of an invoice payment, the invoice's paid date changes too.",
          },
          {
            name: "Delete (trash)",
            what: "Asks first, e.g. “Delete this expense of $45 (Figma)?”. The 2 XP is taken back.",
            how: "Click and confirm. Toast: “Transaction deleted”. If it was an invoice payment, the invoice goes back to unpaid: “Deleted. The invoice is unpaid again.” If it was a bill paid with “Mark paid”, the bill becomes due again on that date.",
          },
          {
            name: "Empty states",
            what: "No entries: “Nothing logged in October 2026” (or “Nothing logged yet”) with “Log a transaction”. With filters: “No transactions match these filters” with “Clear filters”.",
          },
        ],
        howTo: [
          "To fix a mistake: click the row, change it, click Save.",
          "To find one payment: type the payee or amount in Search; click All time if you don't know the month.",
          "For your accountant: pick the month, choose Business, click CSV.",
          "To check a category: pick it in All categories, or click it in Overview → Where it went.",
        ],
      },

      // ── Finance in other places ──────────────────────────────────────
      {
        route: "/founder · /today · /scorecard",
        title: "Finance in other places",
        purpose: "Other pages read your Finance numbers, so you see cash and money tasks without opening Finance.",
        elements: [
          {
            name: "Cash & runway tile (Founder HQ → Revenue engine)",
            what: "The first row of Revenue engine. Four numbers: Business cash, Runway (“7.4 mo”, amber from 3 to 6 months, red under 3, or “Not burning”), This month net (all money, personal and business; green or red) and Receivables (sent, unpaid invoices, with a red chip showing the overdue amount). Before setup: “Set up Finance to see cash, burn and runway here.”",
            how: "Click the tile to open Finance.",
          },
          {
            name: "Money (card on Today)",
            what: "In the right column of Today. It shows only when a bill is due today or late, or an invoice is overdue. Up to 3 bills (name, then “$15 · due today”, or “$15 · overdue” in red) and up to 3 overdue invoices (“Invoice: Website build” with “$2,000 overdue” in red). A “Finance ↗” link sits at the top.",
            how: "Click a bill to open the Recurring tab, an invoice to open the Invoices tab.",
          },
          {
            name: "Scorecard metric “⚡ Auto: Cash collected”",
            what: "An automatic weekly number. Hint: “Business income logged in Finance that week. Calculated for you every week.” It adds every Business income entry dated Monday to Sunday: invoice payments, retainers marked Received and business income you log by hand. Transfers (money you move in from personal) and personal income do not count. Default unit is your currency, default target 1,000.",
            how: "Scorecard → add a metric → Source → “⚡ Auto: Cash collected”. Put it next to “⚡ Auto: Won revenue” to see sales vs cash.",
          },
          {
            name: "Sidebar and search",
            what: "Finance sits in the Founder group of the sidebar. Search finds it with words like money, cash, runway, budget, expenses, income, invoices, subscriptions.",
          },
          {
            name: "XP from Finance",
            what: "+2 XP for each logged entry (also when you mark a bill paid), +15 XP for each invoice paid. Deleting the entry or un-paying the invoice takes the XP back.",
          },
          {
            name: "Data export",
            what: "Settings → full export includes all Finance data: accounts, categories, transactions, budgets, recurring items, invoices and goals.",
          },
        ],
      },
    ],
    frameworks: [
      {
        term: "Personal vs business scope",
        definition: "Every account, entry, category, bill and goal belongs to one side: Personal or Business (a category can be “Both”). The switch at the top shows one side or All. Keeping the two apart is the base of clean books.",
        example: "Your Figma plan is Business. Your groceries are Personal. In Business view only the Figma cost shows, so burn and runway are about the company only.",
        source: "Profit First (Mike Michalowicz); basic small-business bookkeeping",
      },
      {
        term: "Account",
        definition: "A place where money lives. Types: Bank account, Cash, Wallet / mobile money, Savings, Credit card, Investment, Loan.",
        example: "“Meezan Business” (bank, business), “Cash wallet” (cash, personal), “Visa” (credit card, personal).",
        source: "Personal finance basics",
      },
      {
        term: "Cash on hand",
        definition: "The money you can spend now: the balances of open Bank, Cash, Wallet and Savings accounts. Cards, loans and investments are not cash.",
        example: "Bank $8,000 + wallet $200 + savings $3,000 = $11,200 cash on hand. Your Visa debt does not lower it.",
        source: "bishOS rule (liquid accounts)",
      },
      {
        term: "Balance",
        definition: "What an account holds now: opening balance + income − expenses − transfers out + transfers in.",
        example: "Opening $10,000, income $3,000, expenses $1,500, transfer out $500 → balance $11,000.",
        source: "Bookkeeping basics; bishOS rule",
      },
      {
        term: "Opening balance",
        definition: "The money in an account on the day you start tracking it, before anything you log. For a credit card or loan, type what you owe as a negative number.",
        example: "Your bank app says 250,000 PKR today, so the opening balance is 250000. Your Visa owes $1,200, so its opening balance is -1200.",
        source: "Bookkeeping practice",
      },
      {
        term: "Income",
        definition: "Money that comes in to one of your accounts from outside: client payments, salary, sales.",
        example: "A client pays $3,000 into the business account → Income, Business, category Client revenue.",
      },
      {
        term: "Expense",
        definition: "Money that goes out to someone else: rent, food, software, contractors, taxes.",
        example: "You pay $15 for Figma from the business account → Expense, Business, category Software/SaaS.",
      },
      {
        term: "Transfer",
        definition: "Money moving between two of your own accounts. It is not income or expense in the All view. Between the two sides it counts as an owner draw or owner funding in the scoped views.",
        example: "Moving $1,000 from personal bank to personal savings changes nothing in income or expenses; both balances change.",
        source: "bishOS rule",
      },
      {
        term: "Owner draw",
        definition: "Money you move from a business account to a personal account to pay yourself. In Business view it counts as money out and as burn; in Personal view it counts as money in (“From business”).",
        example: "On the 1st you transfer $2,000 from Meezan Business to Meezan Personal. Business burn goes up by $2,000; your personal income goes up by $2,000.",
        source: "Small-business accounting (owner's equity)",
      },
      {
        term: "Owner funding",
        definition: "Money you move from a personal account into the business. In Business view it counts as money in (“Owner funding (from personal)”). For runway it is financing, not revenue: it raises business cash, so runway gets longer, but it never counts as business income, so burn and net burn do not change.",
        example: "You put $5,000 of savings into the business. Business cash goes up by $5,000, but Income / month in the runway card stays the same.",
        source: "Startup finance (capital contribution)",
      },
      {
        term: "Payee",
        definition: "The person or company on the other side of an expense or income. The app remembers your last 80 payees and their categories.",
        example: "Next time you type “Figma”, the category Software/SaaS and the business account come back by themselves.",
      },
      {
        term: "Category",
        definition: "A label for what money was for (spending) or where it came from (income). Categories power “Where it went” and budgets.",
        example: "Food & Groceries, Software/SaaS, Client revenue.",
      },
      {
        term: "Uncategorised",
        definition: "An income or expense with no category. It still counts in totals but shows as one grey row in “Where it went” and is missing from budgets.",
        example: "Ten small uncategorised expenses hide a real food problem. Give them a category in Transactions.",
      },
      {
        term: "Quick add shorthand",
        definition: "Type the amount and the words in one line. “k” means thousand, “m” means million, commas are fine, the number can be first or last.",
        example: "“45 groceries”, “groceries 45”, “1.2k Figma” (1,200), “1,200 rent”.",
        source: "bishOS",
      },
      {
        term: "Smart category guess",
        definition: "When you type a payee, the app picks a category in this order: the same payee you used before (with its side and account), then known words (rent, uber, figma, salary, client…), then a category whose name contains your word.",
        example: "“1.2k figma” → Software/SaaS, Business, business account. “500 uber” → Transport, Personal.",
        source: "bishOS",
      },
      {
        term: "Net",
        definition: "Income minus expenses for a period. Positive means you kept money; negative means you spent more than came in.",
        example: "Income $5,000 − expenses $3,800 = net +$1,200.",
      },
      {
        term: "Savings rate",
        definition: "The share of income you kept: net ÷ income × 100. 20% or more is shown as healthy.",
        example: "Income $5,000, net $1,200 → savings rate 24%.",
        source: "50/30/20 rule (Elizabeth Warren, All Your Worth); FIRE movement",
      },
      {
        term: "Cashflow",
        definition: "Money in and money out over time. The chart shows 12 months of income, expenses and net, so you see trends and seasons, not one lucky month.",
        example: "Income jumps every 3rd month (a quarterly client) while expenses stay flat. Plan big costs for those months.",
      },
      {
        term: "Burn rate",
        definition: "How much money the business spends per month: business expenses plus owner draws. bishOS averages the last 3 full months (fewer for a young business, or this month so far if there is no older data).",
        example: "Business expenses $3,000 + owner draw $2,000 = burn $5,000 / month.",
        source: "Startup finance (gross burn)",
      },
      {
        term: "Net burn",
        definition: "Burn minus business income. It is how fast cash really goes down. If income is bigger, net burn is negative and the card shows “+” in green.",
        example: "Burn $5,000 − income $3,500 = net burn $1,500 / month.",
        source: "Startup finance",
      },
      {
        term: "Runway",
        definition: "How many months the business can keep going at today's speed: business cash ÷ net burn. Under 6 months is a warning; under 3 is tight.",
        example: "Business cash $9,000 ÷ net burn $1,500 = 6 months of runway.",
        source: "Startup finance; Paul Graham, “Default Alive or Default Dead?”",
      },
      {
        term: "Profitable (default alive)",
        definition: "Business income is equal to or bigger than business spending, so cash grows every month. The runway card shows “Profitable” instead of months.",
        example: "Income / month $6,000, burn / month $5,000 → net burn “+$1,000”, headline “Profitable”.",
        source: "Paul Graham, “Default Alive or Default Dead?”",
      },
      {
        term: "Net worth",
        definition: "Everything you own minus everything you owe: the sum of all open accounts, including investments and negative card or loan balances.",
        example: "Cash $11,200 + investments $4,000 − Visa $1,200 = net worth $14,000.",
        source: "Personal finance basics",
      },
      {
        term: "Insights",
        definition: "Up to four short automatic tips on Overview, chosen by importance: runway, overdue invoices, budgets over, big category changes, savings, spending pace, subscriptions.",
        example: "“At this pace you'll spend 18% more than last month” on day 10 tells you to slow down before the month is gone.",
        source: "bishOS",
      },
      {
        term: "Cash collected (scorecard)",
        definition: "An automatic weekly scorecard number: all Business income logged in Finance from Monday to Sunday. It measures money that really arrived, not promises.",
        example: "This week two invoices were paid ($1,500 + $800) → Cash collected = $2,300.",
        source: "EOS Scorecard (Gino Wickman, Traction); cash-basis accounting",
      },
    ],
    testing: [
      "Fresh account: open Finance from the sidebar (Founder → Finance). Expected: the card “Set up your money in 30 seconds” with Currency, Personal and Business boxes. No tabs yet.",
      "Type “abc” in Business · Balance today and click “Set up finance”. Expected: “Balances must be numbers”. Fix it to 10000, type 2000 for Personal, click again. Expected: “Finance is ready. Log your first transaction!”, confetti, the six tabs and the quick add bar.",
      "Open Accounts & goals. Expected: “Personal account” $2,000 and “Business account” $10,000, and under Categories 16 Spending and 5 Income categories.",
      "Back on Overview, type “45 groceries” in the quick add bar. Expected preview: “−$45 · groceries · Food & Groceries · Personal account · Today · Enter to add”. Press Enter. Expected: toast “Expense logged · $45” with +2 XP; Expenses tile $45; Where it went shows Food & Groceries 100%.",
      "Click “In”, type “3000 client payment”. Expected: the category Client revenue and the Business side are picked by themselves. Press Enter. Expected: Income $3,000, Net +$2,955, Savings rate 99% in green with “Healthy: 20%+ kept”.",
      "Click “Add transaction” → Transfer → 500 → From “Business account” → To “Personal account” → Add transfer. Expected (All view): Income and Expenses tiles do not change. Switch the scope to Business. Expected: Where it went shows “Owner draw (to personal)” $500. Switch to Personal. Expected: Income now includes the $500.",
      "Switch to Business and read Business runway. Expected: hint “Based on this month so far”, Business cash $12,500, Burn / month $500, Income / month $3,000, Net burn “+$2,500” in green, headline “Profitable”.",
      "Log a business expense of 4000 (category Contractors). Expected: Burn / month $4,500, Net burn $1,500, runway “5.7 mo”, amber ring, message “Getting short. Prioritise collections and closing deals.” and an insight “Runway is 5.7 months. Collections and revenue first this week”.",
      "Hover the current month in the cashflow chart. Expected: a box with Income, Expenses and Net. Click “Table”. Expected: a table of 12 months, newest first. Click “Chart”, then click last month's column. Expected: the month picker shows last month, the quick add bar disappears and a “This month” button appears. Click “This month”.",
      "Click the Food & Groceries row in Where it went. Expected: the Transactions tab opens with the category filter set to Food & Groceries.",
      "In Transactions click Clear, type “groc” in Search. Expected: only the groceries row. Click the row, change 45 to 50, click Save. Expected: “Transaction updated” and the new amount.",
      "Click the trash icon on that row and confirm. Expected: “Transaction deleted”; the XP total goes down by 2.",
      "Click CSV. Expected: a file like finance-2026-10.csv downloads and the toast “Exported N transactions”. Pick a type/account filter with no rows and click CSV. Expected: “Nothing to export in this view”.",
      "Click “All time”. Expected: the button becomes “All time ×” and older months show too. Click it again to go back.",
      "Open /finance?add=1 in the address bar. Expected: the “Log money in or out” dialog opens and the address becomes /finance.",
      "In the dialog leave Amount empty and press Enter. Expected: “Enter an amount above zero”. Choose Transfer, type 100 and leave To on “Pick an account…”, then save. Expected: “Pick a different account to move money to”. (The To list never offers the From account.)",
      "Tick “Add another after this”, log one expense. Expected: the dialog stays open, amount and payee are empty, the date and account stay.",
      "Use the currency picker: choose EUR. Expected: “Currency set to EUR. Amounts aren't converted.” and € everywhere (numbers unchanged). Choose “Other…”, type XYZ. Expected: “XYZ isn't a currency code we recognise”. Switch back to your currency.",
      "Set the scope to Business, reload the page. Expected: Business is still selected. Open the Invoices tab. Expected: the scope switch is hidden.",
      "Open Founder HQ. Expected: in Revenue engine the tile shows Business cash, Runway, This month net and Receivables. Click it. Expected: Finance opens.",
      "Open Scorecard → add a metric → Source “⚡ Auto: Cash collected”. Expected: this week's value equals the business income you logged this week ($3,000 here).",
    ],
    tips: [
      "Log on the same day. A missed $20 here and there is how budgets and runway stop being true.",
      "Pay yourself with a Transfer from business to personal (owner draw), not with a business expense. Then business burn and your personal income are both right.",
      "Once a week compare each account balance with your real bank app. If they differ, a transaction is missing. Change the opening balance only to fix a setup mistake.",
      "Read runway in the Business view, at least weekly. Under 6 months: collections and closing deals come first.",
      "Use the payee box. After two or three entries, the app fills the category and account by itself.",
      "Link client money to its deal or project. Later you can see what each client really paid.",
    ],
  },

  // ───────────────────────────────────────────────────────────────────────
  // FINANCE 2 — BUDGETS, BILLS, INVOICES & GOALS
  // ───────────────────────────────────────────────────────────────────────
  {
    id: "finance-planning",
    group: "Founder",
    title: "Finance · budgets, bills, invoices & goals",
    summary:
      "The planning side of Finance: monthly budgets per category, recurring bills, subscriptions and retainers, invoices that clients owe you, your accounts, savings goals and categories.",
    why:
      "Money problems usually come from three places: small costs that grow, bills you forget, and clients who pay late. Budgets warn you at 80%. Recurring items show the true monthly cost and remind you when something is due. Invoices track every receivable until the cash lands, and one click books the income. Savings goals give your extra money a job, like an emergency fund.",
    when: {
      oneTime:
        "About 20 minutes after setup: add every recurring item once (rent, SaaS tools, payroll, loan payments, client retainers), give 3–6 big spending categories a monthly budget, add any unpaid invoices, add your card and loan accounts, and create an “Emergency fund” goal.",
      daily: "Nothing big. When Today shows the Money card, click it: mark the bill paid or send a nudge on the overdue invoice.",
      weekly:
        "In the money check: open Recurring and mark due items paid (or skip them), open Invoices and mark received payments paid, nudge overdue clients, and bill every new won deal from “Won deals to bill”.",
      monthly:
        "On the 1st open Budgets, go to last month, compare budget vs actual and change limits that were wrong. Look at Subscriptions / month and cancel tools you don't use. Add money to manual savings goals.",
      quarterly: "Check that your emergency fund target is still 3–6 months of personal costs, and that your business runway goal still fits your plans.",
    },
    pages: [
      // ── Budgets ──────────────────────────────────────────────────────
      {
        route: "/finance?tab=budgets",
        title: "Budgets tab",
        purpose:
          "Give spending categories a monthly limit and see how much of each limit you used this month. Budgets repeat every month.",
        elements: [
          {
            name: "Month picker",
            what: "‹ month › with “This month”. Shared with Overview and Transactions.",
            how: "Go back to see how last month went.",
          },
          {
            name: "Budgets repeat every month (note)",
            what: "“Budgets repeat every month. Heads-up at 80%, over at 100%.”",
          },
          {
            name: "Spent of budget · October 2026 (card)",
            what: "Total spent in categories that have a budget, out of the total of those budgets: “$640 / $1,000”. On the right: “$360 left” (green), amber from 80% used, or “$120 over” (red). A bar under it uses the same colours.",
          },
          {
            name: "Spent outside budgets (card)",
            what: "Money spent this month in categories with no limit. Line: “Categories with no limit set”. Uncategorised spending is not counted here.",
          },
          {
            name: "Monthly budgets (section)",
            what: "Hint: “Click an amount to change it. Clear it to remove the budget.” In Personal or Business view you see that side's categories plus “Both” categories.",
          },
          {
            name: "Budget row",
            what: "For each category with a budget: name, side chip, “$120 of [$300]”, a bar, and “$180 left · 40% used”. From 80% to 100% the text is amber and ends with “· heads-up”. Above 100% it is red: “$50 over · 117% used”, and a dark tick on the bar marks the limit.",
            how: "Click the budget amount, type a new one and press Enter (Esc cancels). Toast: “Budget set · $300/month”. Clear the box (or type 0) to remove it: “Budget removed”. A change applies to every month, also past months you look back at.",
          },
          {
            name: "No budget yet (list)",
            what: "Categories without a limit, in two columns: name, side chip (in All view), “$85 spent” if you spent in it, and a dashed “Set” button.",
            how: "Click “Set”, type the monthly limit, press Enter. The row moves up into the budget list.",
          },
          {
            name: "New expense category, e.g. Travel",
            what: "A small form at the bottom: a name box, a side list (Personal, Business, Both) and “Add category”. It creates a spending category. The side starts as Business if the scope switch is Business, else Personal.",
            how: "Type the name, pick the side, click “Add category”. Toast: “Category added”. It appears in “No budget yet”.",
          },
          {
            name: "Empty state",
            what: "“No expense categories in this view” with the hint “Add a category below, then give it a monthly limit.”",
          },
        ],
        howTo: [
          "Pick 3–6 categories where money leaks (food, transport, software, ads).",
          "Look at the last 1–3 months in Transactions to see what you really spend.",
          "Click “Set” and type a limit a bit below that real number.",
          "During the month, watch for amber “heads-up” rows and slow down.",
          "On the 1st, go back one month and change limits that were clearly wrong.",
        ],
      },

      // ── Recurring ────────────────────────────────────────────────────
      {
        route: "/finance?tab=recurring",
        title: "Recurring tab",
        purpose:
          "All money that repeats: subscriptions, bills, payroll, loan payments and client retainers. See what is due, what it really costs per month, and log each payment in one click.",
        elements: [
          {
            name: "Subscriptions / month (tile)",
            what: "The monthly cost of active money-out items of kind Subscription, with the yearly total under it (“$1,020 a year”).",
          },
          {
            name: "All recurring costs / month (tile)",
            what: "The monthly cost of every active money-out item. Line: “Bills, payroll, subscriptions”.",
          },
          {
            name: "Recurring income / month (tile)",
            what: "The monthly total of active money-in items, green when above zero. Line: “Retainers and salaries”.",
          },
          {
            name: "Due now (tile)",
            what: "How many active items are late or due within 3 days, amber when above zero. Line: “Overdue or due in 3 days” or “You're all caught up”.",
          },
          {
            name: "Due now (section)",
            what: "Shown when something is late or due within 3 days, with an amber border. Hint: “Mark paid to log it and roll the date forward.” Each card: name, a green “Income” chip for money in, “2 days late” (amber) or “Due today / tomorrow / in 3 days”, and the amount.",
          },
          {
            name: "Skip this time (⏭ button)",
            what: "Moves the due date one cycle forward without logging money.",
            how: "Use it for a free month, a paused client or a bill you will not pay this cycle. Toast: “Skipped. Next due on Nov 20”.",
          },
          {
            name: "Mark paid / Received (button)",
            what: "Logs this cycle's payment as a transaction (today's date, the item's amount, account, category, side and company, payee = the item name) and moves the due date one cycle forward from the old due date. +2 XP.",
            how: "Click it when the money moves. Toast: “Paid Figma · next due on Nov 20” or “Received Acme retainer · next due …”. A late item needs one click per missed cycle (or a skip).",
          },
          {
            name: "Subscriptions, bills & retainers (section)",
            what: "The full list of items that are not due now: active ones first, by next due date, then paused ones. If everything is due: “Everything here is due now (above).”",
          },
          {
            name: "Add recurring (button)",
            what: "Opens the dialog “Add a subscription, bill or retainer”.",
          },
          {
            name: "Recurring row",
            what: "Name, a kind chip (Subscription, Bill, Salary / payroll, Retainer, Loan payment, Other; green for income), a side chip (All view), a “Paused” chip if paused. Second line: “Due in 5 days · Mon, Oct 26” (or “Not running” when paused), then category, account and company. Right side: the amount per cycle (“$15/mo”, “$120/yr”, “$50/wk”, “$300/qtr”; green + for income) and “≈ $10/mo” when the cycle is not monthly.",
            how: "Click the name to edit it.",
          },
          {
            name: "Paid / Received · Skip · Pause / Resume · Edit · Delete (row buttons)",
            what: "Paid and Skip work like in Due now (hidden while paused). Pause stops the item: it leaves the totals, Bills and Today. Resume turns it back on. Delete asks “Delete “Figma”? Past payments stay in your transactions.”",
            how: "Toasts: “Figma paused”, “Figma resumed”, “Deleted”.",
          },
          {
            name: "Empty state",
            what: "“No recurring money yet” with the hint “Add rent, SaaS tools, payroll or a client retainer once. You'll see what's due, the true monthly cost, and log each payment in one tap.” and “Add the first one”.",
          },
        ],
        howTo: [
          "Go through last month's bank statement and add every repeating payment once.",
          "Add client retainers and your salary as “Money in”.",
          "Each week open Recurring and click “Mark paid” or “Received” on everything in Due now.",
          "Skip a cycle you don't pay. Pause a tool you stopped for now. Delete it when it is gone for good.",
          "Once a month read Subscriptions / month and cancel what you don't use.",
        ],
      },

      // ── Recurring dialog ─────────────────────────────────────────────
      {
        route: "/finance?tab=recurring",
        title: "Add a subscription, bill or retainer (dialog)",
        purpose: "Create or edit one recurring item (title “Edit recurring” when editing).",
        elements: [
          {
            name: "Money out · Money in",
            what: "Is this a cost or an income?",
            how: "Click one. Money in sets Kind to Retainer, Money out to Subscription, and clears the category.",
          },
          {
            name: "Name",
            what: "Placeholder: “e.g. Figma, office rent” (out) or “e.g. Acme monthly retainer” (in). Required: “Give it a name”.",
          },
          {
            name: "Kind",
            what: "Subscription, Bill, Salary / payroll, Retainer, Loan payment or Other. Only Subscription counts in “Subscriptions / month”.",
          },
          {
            name: "Amount (USD)",
            what: "The amount per cycle. Must be above zero.",
          },
          {
            name: "Every",
            what: "The cadence: Weekly, Monthly, Quarterly or Yearly.",
          },
          {
            name: "Next due",
            what: "The next date it must be paid. Default: today.",
            how: "Pick the real next payment date. After “Mark paid” or “Skip” it moves forward by itself.",
          },
          {
            name: "For: Personal · Business",
            what: "The side. Changing it clears the category.",
          },
          {
            name: "Account (optional)",
            what: "Default “Default personal account” / “Default business account”. Hint: “Used when you mark it paid.”",
            how: "Pick the card or bank it is paid from. If the account is archived later, the side's default account is used.",
          },
          {
            name: "Category",
            what: "“Uncategorised” plus categories that fit the type and side.",
          },
          {
            name: "Vendor company (optional) / Client (optional)",
            what: "A company from Customers. The label is “Client (optional)” for money in.",
          },
          {
            name: "Note (optional)",
            what: "Placeholder: “Plan, login hint, renewal terms…”.",
          },
          {
            name: "Cancel · Add / Save",
            what: "Cancel closes without saving. Add creates the item (“Save” when editing). A missing name or a zero amount is refused (“Give it a name”, “Enter an amount above zero”).",
            how: "Click Add. Toast: “Figma added · $15/mo”. Editing: “Saved”.",
          },
        ],
      },

      // ── Invoices ─────────────────────────────────────────────────────
      {
        route: "/finance?tab=invoices",
        title: "Invoices tab",
        purpose:
          "Track money clients owe you, from draft to paid. Turn won deals into invoices in one click. Marking an invoice paid books the income in your business account.",
        elements: [
          {
            name: "Outstanding (tile)",
            what: "The total of sent invoices that are not paid yet. Line: “3 sent, not paid”.",
          },
          {
            name: "Overdue (tile)",
            what: "The total of sent invoices past their due date, amber when above zero. Line: “2 past due · send a nudge” or “Nothing late”.",
          },
          {
            name: "Paid this month (tile)",
            what: "The total of invoices paid this calendar month, green when above zero. Line: “Cash collected”.",
          },
          {
            name: "Drafts (tile)",
            what: "How many invoices are still drafts. Line: “Ready to send?” or “No drafts”.",
          },
          {
            name: "Won deals to bill (section)",
            what: "Deals in Pipeline marked Won that have no invoice yet (a void invoice does not count). Hint: “Turn a won deal into an invoice in one click. Amount, client and title are filled in.” Up to 8 cards in a row: deal title, company (or “No company”) and value.",
            how: "Click “Create invoice” on a card. The New invoice dialog opens filled in.",
          },
          {
            name: "Open · Paid · All (filter)",
            what: "Open = drafts and sent invoices. Paid = paid ones. All = everything including void. Order: overdue first, then sent by due date, then drafts, then paid (newest first), then void.",
          },
          {
            name: "New invoice (button)",
            what: "Opens the New invoice dialog.",
          },
          {
            name: "Invoice row",
            what: "Number (e.g. INV-0003), title (struck through when void), and a status chip: “Paid today” / “Paid 3 days ago” (green), “Void”, “Draft”, “5d overdue” (amber) or “Due in 3 days” (blue). Second line: company (or contact, or “No client set”), “deal: …”, project, “issued Oct 1 · due Oct 15”. The amount is green when paid.",
            how: "Click the row to edit the invoice.",
          },
          {
            name: "Sent (button)",
            what: "Only on drafts. Marks the invoice as sent; from now on it can become overdue.",
            how: "Click after you email the invoice. Toast: “Marked as sent”.",
          },
          {
            name: "Paid (button)",
            what: "On drafts and sent invoices; filled when overdue. Logs a Business income transaction: the invoice amount, today's date, your default business account, category “Client revenue” (created if missing), payee = company name or title, note “Invoice INV-0003 · title”, and links to the deal, company and project. +15 XP and confetti.",
            how: "Click when the money is in your bank. Toast: “Cash in: Website build · $2,000”. The entry shows in Transactions with an “Invoice” chip.",
          },
          {
            name: "Mark unpaid (↺ on paid invoices)",
            what: "Asks “Mark this invoice unpaid? Its payment transaction will be removed.” The invoice goes back to sent, the income entry is deleted and the 15 XP is taken back.",
            how: "Use it if you clicked Paid by mistake. Toast: “Marked unpaid”.",
          },
          {
            name: "Void (⊘) and Re-open as draft (↺ on void invoices)",
            what: "Void cancels an invoice you will not collect (it stays in All, faded and struck through, and cannot be paid). Re-open turns a void invoice back into a draft.",
            how: "Toasts: “Invoice voided”, “Back to draft”.",
          },
          {
            name: "Edit (pencil) · Delete (trash)",
            what: "Edit opens the invoice dialog. Delete asks “Delete invoice “…”?”; for a paid invoice it adds “The recorded payment stays in your transactions.”",
            how: "Toast: “Invoice deleted”. Changing the amount of a paid invoice also changes its payment entry.",
          },
          {
            name: "Empty state",
            what: "“No open invoices”, “No paid invoices yet” or “No invoices yet”, with the hint “Track what clients owe you until the cash lands. Marking one paid logs the income in your business books.” and “New invoice”.",
          },
        ],
        howTo: [
          "When a deal is won, open Invoices and click “Create invoice” on its card.",
          "Check the amount and due date, then “Save as sent” after you email the real invoice.",
          "Every week look at Overdue. Send a short, friendly nudge to each late client.",
          "When the money lands, click “Paid”. Income, runway and Cash collected update by themselves.",
        ],
      },

      // ── Invoice dialog ───────────────────────────────────────────────
      {
        route: "/finance?tab=invoices",
        title: "New invoice (dialog)",
        purpose:
          "Create an invoice from scratch or from a won deal, or edit one (title “Edit invoice”). bishOS tracks the invoice; you still send the real document to the client from your own tool.",
        elements: [
          {
            name: "From a won deal (optional)",
            what: "Only on a new invoice when you have won deals. Options like “Website redesign · Acme · $2,000”; deals already billed end with “(invoiced)”. Hint: “Prefills title, amount, client and project.”",
            how: "Pick a deal, or leave “Start from scratch”.",
          },
          {
            name: "Title",
            what: "What the invoice is for. Placeholder: “e.g. Website build: milestone 1”. Required: “Give the invoice a title”.",
          },
          {
            name: "Number",
            what: "Pre-filled with the next free number, e.g. “INV-0004”. You can type your own. If you clear it, the next number is added when you save.",
          },
          {
            name: "Amount (USD)",
            what: "The invoice total. Must be above zero.",
          },
          {
            name: "Issued",
            what: "The issue date. Default: today.",
          },
          {
            name: "Due",
            what: "The due date. Default: 14 days after today. It cannot be before the issue date: “The due date can't be before the issue date.”",
          },
          {
            name: "Net 7 · Net 14 · Net 30 (buttons)",
            what: "Payment terms shortcuts.",
            how: "Click one to set Due to 7, 14 or 30 days after the Issued date.",
          },
          {
            name: "Client company",
            what: "A company from Customers, or “None”.",
          },
          {
            name: "Contact (optional)",
            what: "A person from People. When a company is chosen, only people at that company are listed.",
          },
          {
            name: "Project (optional)",
            what: "A project from Projects; finished ones end with “(done)”.",
          },
          {
            name: "Notes (optional)",
            what: "Placeholder: “Line items, payment details, PO number…”.",
          },
          {
            name: "Cancel · Save draft · Save as sent (new) / Save (edit)",
            what: "Save draft keeps it as a draft (never overdue). Save as sent marks it sent (it counts in Outstanding and can go overdue). Enter = Save as sent.",
            how: "Toasts: “Draft saved”, “Invoice sent · $2,000”, “Invoice saved”.",
          },
        ],
      },

      // ── Accounts & goals ─────────────────────────────────────────────
      {
        route: "/finance?tab=accounts",
        title: "Accounts & goals tab",
        purpose: "Manage where your money lives, track savings goals, and edit your categories.",
        elements: [
          {
            name: "Cash on hand (tile)",
            what: "Balances of open Bank, Cash, Wallet and Savings accounts in the view. Line: “Bank, cash, wallets, savings”.",
          },
          {
            name: "Net worth (tile)",
            what: "The sum of all open accounts in the view, including investments and negative cards or loans. Line: “All open accounts”. Amber when negative.",
          },
          {
            name: "Owed (cards, loans) (tile)",
            what: "The total of accounts with a negative balance, shown as a positive number. Line: “Negative balances” or “Nothing owed”.",
          },
          {
            name: "Accounts (section)",
            what: "Hint: “Balance = opening balance + income − expenses ± transfers.” Button “Add account”. Empty: “No accounts in this view” with “Add the places your money lives: bank accounts, cash, cards, wallets.”",
          },
          {
            name: "Account card",
            what: "Name, type (e.g. “Credit card”), side chip (All view), the balance (amber when negative) and “Opening $10,000 · 12 transactions”.",
            how: "Click the name to edit. Buttons on hover: Edit (pencil), Archive (box icon), and Delete (trash) only when the account has no transactions.",
          },
          {
            name: "Archive / Restore",
            what: "Archive hides an account from pickers and totals but keeps its history. Toast: “Meezan archived. History kept.” / “Meezan restored”.",
            how: "Use it for a closed account. A link “Show 2 archived” / “Hide 2 archived” shows them again; restore with the same button.",
          },
          {
            name: "Delete account",
            what: "Asks “Delete the account “…”?”. Only for accounts with no history. Recurring items and goals that used it lose the link.",
            how: "Toast: “Account deleted”. With history you get “This account has transactions. Archive it instead to keep your history.”",
          },
          {
            name: "Savings goals (section)",
            what: "Hint: “Track a target by a linked account's balance, or by what you've set aside.” Button “Add goal”. Empty: “No savings goals yet” with “Emergency fund (3–6 months of costs), 6 months of business runway, a new laptop. Name it, set a target, watch it fill.”",
          },
          {
            name: "Goal card",
            what: "A ring with the % (green at 100%), the name, side chip (All view), “$2,000 of $6,000”, then “$4,000 to go · by Mar 1 · $667/mo” (the monthly amount you need to hit the date) or “Reached. Nice work.” The footer says “Tracks Savings account” for an account goal.",
            how: "Click the name to edit the goal.",
          },
          {
            name: "Add money (manual goals)",
            what: "Opens a small box “Amount (negative to withdraw)” with “Add”. It only changes the goal's saved number; it does not move money between accounts.",
            how: "Type 500 and click Add. Toast: “$500 added to Emergency fund”. When you pass the target: “Goal reached: Emergency fund” with confetti. Esc closes the box.",
          },
          {
            name: "Categories (section)",
            what: "Hint: “Rename, re-scope or archive. Archived ones stay on old transactions.” Two columns: Spending and Income. Button “Show archived (2)” / “Hide archived” when you have archived ones.",
          },
          {
            name: "Category row",
            what: "The name (click to rename), a side list (Personal, Business, Both) and an Archive / Restore button on hover.",
            how: "Click the name, type, press Enter. Change the side in the small list. Archive: “Category archived. Past transactions keep it.” Restore: “Category restored”.",
          },
          {
            name: "Add spending category… / Add income category…",
            what: "A box, a side list (default Both) and a + button under each column. A name that already exists for that type is not created twice.",
            how: "Type the name and press Enter or +. Toast: “Category added”.",
          },
        ],
        howTo: [
          "Add every account once with today's balance; cards and loans as negative numbers.",
          "Archive an account you closed; never delete one with history.",
          "Create an “Emergency fund” goal with a target of 3–6 months of personal costs and a date.",
          "Link a goal to a savings account if the money sits there; otherwise use “What I set aside” and Add money each month.",
          "Clean up categories: rename to your words, archive the ones you never use.",
        ],
      },

      // ── Account dialog ───────────────────────────────────────────────
      {
        route: "/finance?tab=accounts",
        title: "Add an account (dialog)",
        purpose: "Create or edit one account (title “Edit account” when editing).",
        elements: [
          {
            name: "Name",
            what: "Placeholder: “e.g. Meezan Business, Cash wallet, Visa”. Required: “Name the account”.",
          },
          {
            name: "Type",
            what: "Bank account, Cash, Wallet / mobile money, Savings, Credit card, Investment or Loan. The first four count as cash on hand.",
          },
          {
            name: "For: Personal · Business",
            what: "The side. It decides where the account's money counts (business cash powers runway).",
          },
          {
            name: "Opening balance (USD)",
            what: "Hint for most types: “What's in it today, before anything you log here.” For Credit card and Loan: “What you owe today, as a negative number (e.g. -1200).”",
            how: "Type the number from your bank app. Default 0.",
          },
          {
            name: "Cancel · Add account / Save",
            what: "Cancel closes without saving. Add account creates it (“Save” when editing). A wrong balance is refused: “Enter a valid opening balance”.",
            how: "Toasts: “Visa added”, “Account saved”.",
          },
        ],
      },

      // ── Goal dialog ──────────────────────────────────────────────────
      {
        route: "/finance?tab=accounts",
        title: "Add a savings goal (dialog)",
        purpose: "Create or edit one savings goal (title “Edit goal” when editing).",
        elements: [
          {
            name: "Name",
            what: "Placeholder: “e.g. Emergency fund”. Required: “Name the goal”.",
          },
          {
            name: "Target (USD)",
            what: "How much you want. Must be above zero: “Set a target above zero”.",
          },
          {
            name: "By (optional)",
            what: "A deadline. With a date the card shows the amount needed per month.",
          },
          {
            name: "For: Personal · Business",
            what: "The side. Changing it clears the chosen account.",
          },
          {
            name: "Track progress by: What I set aside · An account's balance",
            what: "What I set aside = you type the saved amount and use Add money. An account's balance = progress equals one account's live balance.",
          },
          {
            name: "Account / Saved so far (USD)",
            what: "For account mode: a list of open accounts on that side with their balance (“Pick an account…”; required: “Pick the account to track”). For manual mode: the amount already saved (default 0).",
          },
          {
            name: "Delete · Cancel · Add goal / Save",
            what: "Delete is only shown when editing and asks “Delete the goal “…”?”.",
            how: "Toasts: “Goal added · $6,000”, “Goal saved”, “Goal deleted”.",
          },
        ],
      },
    ],
    frameworks: [
      {
        term: "Monthly budget",
        definition: "A spending limit for one category for one month. In bishOS a budget repeats every month until you change or clear it.",
        example: "Food & Groceries: $300 per month. Marketing/Ads: $500 per month.",
        source: "Zero-based and envelope budgeting (YNAB, envelope method)",
      },
      {
        term: "Budget vs actual",
        definition: "Comparing what you planned to spend with what you really spent. The gap tells you to change the habit or change the plan.",
        example: "Budget $300, actual $360 → $60 over. Either cook more or set a realistic $350.",
        source: "Management accounting (variance analysis)",
      },
      {
        term: "Heads-up at 80%, over at 100%",
        definition: "Budget colours: green under 80% used, amber from 80% to 100% (“heads-up”), red above 100% (“over”).",
        example: "$250 of $300 = 83% → amber “heads-up” on the 20th. You still have 10 days to slow down.",
        source: "bishOS",
      },
      {
        term: "Spent outside budgets",
        definition: "Spending in categories that have no limit. If this number is big, your budgets cover too little.",
        example: "Budgets $1,000, but $900 spent outside them → add budgets to the biggest of those categories.",
        source: "bishOS",
      },
      {
        term: "Recurring item",
        definition: "A payment that repeats on a schedule. Kinds: Subscription, Bill, Salary / payroll, Retainer, Loan payment, Other. Each has an amount, a cadence and a next due date.",
        example: "Office rent $400 monthly, due on the 1st.",
      },
      {
        term: "Subscription",
        definition: "A tool or service you pay for again and again, often by card. Small alone, big together.",
        example: "Figma $15 + Notion $10 + ChatGPT $20 + Canva $13 = $58/month, $696/year.",
      },
      {
        term: "Bill",
        definition: "A repeating cost for a basic need or service: rent, electricity, internet, phone.",
        example: "K-Electric bill about $40 monthly.",
      },
      {
        term: "Retainer",
        definition: "A client pays a fixed amount every period for ongoing work. It is recurring income and makes cashflow predictable.",
        example: "Acme pays $1,500 every month for maintenance → Money in, Retainer, Business.",
        source: "Agency and consulting practice",
      },
      {
        term: "Cadence",
        definition: "How often a recurring item repeats: Weekly, Monthly, Quarterly or Yearly.",
        example: "Domain renewal: Yearly. Payroll: Monthly. Cleaner: Weekly.",
      },
      {
        term: "Monthly equivalent (≈/mo)",
        definition: "Any cadence turned into a monthly cost so you can compare: weekly × 52 ÷ 12, quarterly ÷ 3, yearly ÷ 12.",
        example: "A $120 yearly tool shows “≈ $10/mo”. A $50 weekly cleaner shows “≈ $217/mo”.",
        source: "bishOS",
      },
      {
        term: "Next due",
        definition: "The next date a recurring item must be paid. Mark paid and Skip move it forward one cycle from the old due date, keeping the original day of the month (Jan 31 → Feb 28 → Mar 31). If you delete the payment that 'Mark paid' created, the item becomes due again on that date.",
        example: "Figma next due Oct 20 → after “Mark paid” it is Nov 20.",
        source: "bishOS",
      },
      {
        term: "Due now",
        definition: "An active recurring item that is late or due within the next 3 days.",
        example: "Rent due in 2 days and a tool 1 day late → Due now = 2.",
        source: "bishOS",
      },
      {
        term: "Mark paid / Received",
        definition: "One click that logs this cycle's payment as a real transaction and rolls the due date forward. Received is the same for money in.",
        example: "You click “Received” on the Acme retainer → a $1,500 Business income entry appears and the next due date moves one month.",
        source: "bishOS",
      },
      {
        term: "Skip and Pause",
        definition: "Skip moves the due date one cycle without logging money. Pause stops the item completely until you resume it (it leaves all totals and reminders).",
        example: "Skip: a client takes August off. Pause: you stop Canva for three months but may come back.",
        source: "bishOS",
      },
      {
        term: "Receivables (money owed to you)",
        definition: "Money clients owe you for work you already billed. In bishOS: invoices with status Sent.",
        example: "Two sent invoices of $2,000 and $1,500 → receivables $3,500.",
        source: "Accounting (accounts receivable)",
      },
      {
        term: "Invoice",
        definition: "A request for payment you send a client, with a number, amount, issue date and due date. bishOS tracks it; you send the real document from your own tool.",
        example: "INV-0004 “Website build: milestone 1”, $2,000, issued Oct 1, due Oct 15.",
      },
      {
        term: "Invoice statuses",
        definition: "Draft = not sent yet (never overdue). Sent = waiting for money (counts in Outstanding). Paid = money received and booked as income. Void = cancelled, will not be collected.",
        example: "Draft on Monday, Sent on Tuesday, Paid two weeks later. A cancelled project's invoice → Void.",
        source: "Invoicing practice",
      },
      {
        term: "Overdue",
        definition: "A sent invoice whose due date is before today. Drafts are never overdue. bishOS shows “5d overdue”, adds it to the Overdue tile, an Overview insight and the Today Money card.",
        example: "Due Oct 15, today Oct 20 → “5d overdue”. Send a friendly reminder today.",
        source: "Accounts receivable practice",
      },
      {
        term: "Payment terms (Net 7 / 14 / 30)",
        definition: "How many days after the issue date the client has to pay.",
        example: "Issued Oct 1 with Net 14 → due Oct 15.",
        source: "Standard invoicing terms",
      },
      {
        term: "Invoice number",
        definition: "A unique number for each invoice, so you and the client can refer to it. bishOS suggests the next one: INV-0001, INV-0002…",
        example: "Your last invoice was INV-0009 → the next suggestion is INV-0010.",
      },
      {
        term: "Mark unpaid",
        definition: "Undo for a paid invoice: it goes back to Sent, its income entry is deleted and the XP is taken back. Deleting the payment entry in Transactions does the same.",
        example: "You clicked Paid on the wrong invoice → ↺ Mark unpaid fixes it in one click.",
        source: "bishOS",
      },
      {
        term: "Won deal to bill",
        definition: "A deal marked Won in Pipeline that has no invoice yet. Billing it the same day shortens the time until cash.",
        example: "You win “Clinic app · $4,000” on Monday → Monday afternoon click “Create invoice” on its card.",
        source: "bishOS (Pipeline → Finance link)",
      },
      {
        term: "Cash collected vs won revenue",
        definition: "Won revenue is the value of deals you closed (a promise). Cash collected is the money that really arrived. A business can win a lot and still run out of cash if clients pay late.",
        example: "This month: won revenue $8,000, cash collected $2,500. Runway follows the $2,500, so chase invoices.",
        source: "Accrual vs cash-basis accounting",
      },
      {
        term: "Savings goal",
        definition: "A named target amount, optionally with a date. Progress comes from an account's balance or from the amount you set aside by hand.",
        example: "“New laptop”, target $1,500, by March, what I set aside $600 → 40%, $900 to go.",
        source: "Goal-based saving (sinking funds)",
      },
      {
        term: "Emergency fund",
        definition: "Cash kept only for bad surprises (illness, a lost client, a broken laptop). The usual target is 3–6 months of your personal costs.",
        example: "Personal costs $1,200/month → emergency fund target $3,600 to $7,200.",
        source: "Standard personal finance advice (e.g. Dave Ramsey, Ramit Sethi)",
      },
      {
        term: "Archive",
        definition: "Hide an account or category you no longer use, without losing history. Archived accounts leave the totals and pickers; archived categories leave pickers and budgets but stay on old entries.",
        example: "You close an old bank account → archive it. Its past transactions still show in Transactions.",
        source: "bishOS",
      },
    ],
    testing: [
      "Set the scope switch to All. Open Budgets. Expected: the note “Budgets repeat every month. Heads-up at 80%, over at 100%.”, the two summary cards, and every spending category under “No budget yet”.",
      "Click “Set” next to Food & Groceries, type 100, press Enter. Expected: “Budget set · $100/month”; the row moves up into the budget list with a green bar.",
      "Log an 85 expense in Food & Groceries. Expected: the row is amber, “$15 left · 85% used · heads-up”. Log 30 more. Expected: red “$15 over · 115% used”, a dark tick on the bar, and on Overview the insight “Food & Groceries is over budget this month”.",
      "Click the $100 amount, clear it, press Enter. Expected: “Budget removed” and the row goes back to “No budget yet”. Press Esc while editing another amount. Expected: nothing changes.",
      "Type “Travel” in “New expense category, e.g. Travel”, choose Business, click “Add category”. Expected: “Category added” and Travel in “No budget yet”.",
      "Open Recurring → “Add recurring”. Money out, Name “Figma”, Kind Subscription, Amount 15, Every Monthly, Next due = today, For Business, Category Software/SaaS → Add. Expected: “Figma added · $15/mo”; Due now section shows Figma “Due today”; tiles show Subscriptions / month $15 ($180 a year) and Due now 1.",
      "Open Today. Expected: the Money card shows Figma with “$15 · due today”. Click it. Expected: the Recurring tab opens.",
      "Click “Mark paid” on Figma. Expected: “Paid Figma · next due on …” one month later, +2 XP; Figma leaves Due now; Transactions has a Figma row with the ↻ icon.",
      "Click Skip (⏭) on Figma. Expected: “Skipped. Next due …” one more month later and no new transaction.",
      "Click Pause on Figma. Expected: “Figma paused”, the row is faded with “Paused” and “Not running”, Paid and Skip disappear, Subscriptions / month drops to $0. Click Resume.",
      "Add a Yearly money-out item of 120. Expected: the row shows “$120/yr” and “≈ $10/mo”. Add a Money in item “Acme retainer” 1500 monthly. Expected: Kind turns to Retainer, the green chip, Recurring income / month $1,500.",
      "Delete the yearly item. Expected: the question “Delete “…”? Past payments stay in your transactions.” and the toast “Deleted”.",
      "In Pipeline, move a deal with value 2,000 to Won. Open Finance → Invoices. Expected: the card in “Won deals to bill”. Click “Create invoice”. Expected: title, amount, company and project are filled, Number “INV-0001”, Due 14 days from today.",
      "Click “Net 30”. Expected: Due = Issued + 30 days. Set Due before Issued and save. Expected: “The due date can't be before the issue date.” Fix it and click “Save as sent”. Expected: “Invoice sent · $2,000”; Outstanding $2,000; the won-deal card disappears.",
      "Edit the invoice: set Issued and Due to dates in the past. Expected: chip “Nd overdue”, the Overdue tile turns amber with “1 past due · send a nudge”, an overdue insight on Overview, and the invoice in the Today Money card.",
      "Click “Paid”. Expected: confetti, “Cash in: … · $2,000”, +15 XP; Paid this month $2,000; in Transactions a Business income row with the “Invoice” chip, category Client revenue and note “Invoice INV-0001 · …”; Business runway and the scorecard “Cash collected” go up.",
      "Click ↺ (Mark unpaid) and confirm. Expected: “Marked unpaid”, the invoice is overdue again and the income row is gone. Click Paid again, then delete that income row in Transactions. Expected: “Deleted. The invoice is unpaid again.”",
      "Click “New invoice”, fill a title and amount, click “Save draft”. Expected: “Draft saved”, Drafts tile 1 “Ready to send?”. Click “Sent” on it. Expected: “Marked as sent”. Click Void (⊘). Expected: “Invoice voided”, it leaves Open; in All it is faded and struck through. Click ↺. Expected: “Back to draft”.",
      "Open Accounts & goals → “Add account”: Name “Visa”, Type Credit card, opening -1200. Expected: the hint asks for a negative number; after saving, “Owed (cards, loans)” shows $1,200, Net worth drops by $1,200, Cash on hand does not change.",
      "Add “Cash wallet”, Type Cash, opening 300. Expected: Cash on hand goes up by $300. Archive it. Expected: “Cash wallet archived. History kept.”, totals drop, “Show 1 archived” appears. Restore it. Expected: the trash icon shows only on accounts with 0 transactions.",
      "Click “Add goal”: “Emergency fund”, Target 6000, By = 6 months from today, “What I set aside”, Saved so far 1000. Expected: “Goal added · $6,000”; the card shows 17% and “$5,000 to go · by … · $…/mo” (the $5,000 spread over the months left, about $715–$834).",
      "Click “Add money”, type 5000, click Add. Expected: “Goal reached: Emergency fund”, confetti, 100% green ring and “Reached. Nice work.” Edit the goal and switch to “An account's balance”, pick an account. Expected: the footer says “Tracks …” and progress follows that balance.",
      "In Categories click a name, rename it, press Enter. Expected: the new name everywhere. Change its side to Both. Archive it. Expected: “Category archived. Past transactions keep it.”, it disappears from the pickers, and “Show archived (1)” appears. Restore it.",
    ],
    tips: [
      "Start with only 3–6 budgets on the categories that leak. Too many budgets are ignored.",
      "Add recurring items for everything with a card on file. The subscriptions total is often a surprise.",
      "Bill a won deal the same day. Every day you wait is a day later the cash arrives.",
      "Send the reminder the day an invoice turns overdue. Be friendly and short; attach the invoice again.",
      "A late recurring item needs one “Mark paid” per missed cycle. If you missed a cycle on purpose, use Skip.",
      "Your emergency fund is not runway. Keep it in a separate savings account and link the goal to it.",
    ],
  },
];
