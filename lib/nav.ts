import {
  Sun, Inbox, CalendarDays, CalendarRange, BookOpenText, Compass, Target, Repeat, ListChecks, ClipboardCheck,
  Gauge, Kanban, Users, Building2, Handshake, Gift, Megaphone, Clapperboard, Lightbulb, BarChart3, Scale,
  StickyNote, GraduationCap, Library, Brain, FolderKanban, CheckSquare, Rocket, Timer, Layers, Trophy,
  Network, HeartPulse, LayoutDashboard, Sparkles, Settings, BookMarked, Wallet,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type NavItem = { href: string; label: string; icon: LucideIcon; keywords?: string; badge?: "inbox" | "recall" };
export type NavGroup = { key: string; label: string; items: NavItem[] };

/** The Life OS navigation — one source for Sidebar + command palette. */
export const NAV_GROUPS: NavGroup[] = [
  {
    key: "today",
    label: "Today",
    items: [
      { href: "/today", label: "Today", icon: Sun, keywords: "home cockpit top 3 day" },
      { href: "/inbox", label: "Inbox", icon: Inbox, keywords: "capture triage", badge: "inbox" },
      { href: "/week", label: "Week", icon: CalendarDays, keywords: "big 3 ideal week plan" },
      { href: "/schedule", label: "Calendar", icon: CalendarRange, keywords: "schedule time block" },
      { href: "/journal", label: "Journal", icon: BookOpenText, keywords: "days log reflection" },
    ],
  },
  {
    key: "direction",
    label: "Direction",
    items: [
      { href: "/compass", label: "Compass", icon: Compass, keywords: "purpose vision values wheel of life" },
      { href: "/goals", label: "Goals · 12 weeks", icon: Target, keywords: "12 week year okr key results tactics" },
      { href: "/habits", label: "Habits", icon: Repeat, keywords: "streak atomic" },
      { href: "/routines", label: "Routines", icon: ListChecks, keywords: "morning evening start-up shutdown checklist" },
      { href: "/reviews", label: "Reviews", icon: ClipboardCheck, keywords: "weekly monthly quarterly annual review" },
    ],
  },
  {
    key: "founder",
    label: "Founder",
    items: [
      { href: "/founder", label: "Founder HQ", icon: Gauge, keywords: "ceo dashboard business" },
      { href: "/pipeline", label: "Pipeline", icon: Kanban, keywords: "sales deals crm" },
      { href: "/people", label: "People", icon: Users, keywords: "crm contacts relationships" },
      { href: "/customers", label: "Customers", icon: Building2, keywords: "clients companies accounts" },
      { href: "/commitments", label: "Commitments", icon: Handshake, keywords: "promises waiting for owe" },
      { href: "/finance", label: "Finance", icon: Wallet, keywords: "money cash runway budget expenses income invoices subscriptions" },
      { href: "/offers", label: "Offers", icon: Gift, keywords: "offer creation value equation pricing" },
      { href: "/campaigns", label: "Campaigns", icon: Megaphone, keywords: "marketing campaign launch" },
      { href: "/content", label: "Content Studio", icon: Clapperboard, keywords: "content social media posts videos calendar" },
      { href: "/swipes", label: "Inspiration", icon: Lightbulb, keywords: "swipe file hooks saved videos" },
      { href: "/scorecard", label: "Scorecard", icon: BarChart3, keywords: "metrics kpi weekly numbers" },
      { href: "/decisions", label: "Decisions & Issues", icon: Scale, keywords: "decision journal issues ids" },
    ],
  },
  {
    key: "mind",
    label: "Mind",
    items: [
      { href: "/notes", label: "Notes", icon: StickyNote, keywords: "second brain zettelkasten" },
      { href: "/learning", label: "Learning", icon: GraduationCap, keywords: "skills courses practice" },
      { href: "/library", label: "Library", icon: Library, keywords: "books courses resources reading" },
      { href: "/recall", label: "Recall", icon: Brain, keywords: "spaced repetition flashcards review", badge: "recall" },
    ],
  },
  {
    key: "work",
    label: "Work",
    items: [
      { href: "/tasks", label: "Tasks", icon: CheckSquare, keywords: "todo board next actions gtd today upcoming anytime someday overdue" },
      { href: "/projects", label: "Projects", icon: FolderKanban, keywords: "sprints delivery next action wip kanban" },
      { href: "/focus", label: "Focus", icon: Timer, keywords: "pomodoro deep work timer maker manager hours" },
      { href: "/life-areas", label: "Life Areas", icon: Layers, keywords: "areas sections standard rating hub spine" },
      { href: "/momentum", label: "Wins", icon: Trophy, keywords: "wins momentum progress streak log celebrate" },
      { href: "/challenges", label: "Challenges", icon: Rocket, keywords: "challenge sprint days journal" },
    ],
  },
  {
    key: "system",
    label: "System",
    items: [
      { href: "/delegation", label: "Delegation", icon: Network, keywords: "time audit drip buyback sop process" },
      { href: "/insights", label: "Energy & Wellbeing", icon: HeartPulse, keywords: "energy sleep burnout insights" },
      { href: "/dashboard", label: "Analytics", icon: LayoutDashboard, keywords: "dashboard stats" },
      { href: "/chat", label: "AI", icon: Sparkles, keywords: "chat assistant" },
      { href: "/settings", label: "Settings", icon: Settings, keywords: "preferences export caps quota" },
      { href: "/guide", label: "Guide", icon: BookMarked, keywords: "help how it works playbook" },
    ],
  },
];

export const ALL_NAV: NavItem[] = NAV_GROUPS.flatMap((g) => g.items);
