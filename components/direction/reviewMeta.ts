/**
 * Review wizard metadata (step keys mirror convex/periodicReviews.ts STEPS).
 * `essential` steps make up the minimum mode.
 */
export type ReviewKind = "weekly" | "monthly" | "quarterly" | "annual";

export type StepMeta = { key: string; title: string; essential: boolean; prompt: string; ai?: string };

export const REVIEW_KINDS: ReviewKind[] = ["weekly", "monthly", "quarterly", "annual"];

export const REVIEWS: Record<
  ReviewKind,
  { title: string; short: string; blurb: string; minutes: string; minMinutes: string; xp: number; steps: StepMeta[] }
> = {
  weekly: {
    title: "Weekly review",
    short: "Weekly",
    blurb: "Look back, get current, score the week, then commit to next week's Big 3. The ritual that keeps the system true.",
    minutes: "60–90 min",
    minMinutes: "20 min",
    xp: 120,
    steps: [
      { key: "celebrate", title: "Celebrate wins", essential: true, prompt: "Progress you made — big or small. Name the three you're proudest of." },
      { key: "score", title: "Score the week", essential: true, prompt: "Big 3, execution and habits. No judgement — just the numbers." },
      { key: "reflect", title: "Reflect", essential: false, prompt: "Keep · Improve · Start · Stop.", ai: "reflect" },
      { key: "clear", title: "Get clear", essential: true, prompt: "Empty every inbox so nothing is living in your head." },
      { key: "current", title: "Get current", essential: false, prompt: "Calendar, projects, pipeline and promises — every loose end gets a next step." },
      { key: "scorecard", title: "Scorecard & issues", essential: false, prompt: "Your weekly numbers on or off track, the top issues and someday ideas." },
      { key: "plan", title: "Plan next week", essential: true, prompt: "Three outcomes, your tactics, a protected Free Day and one if-then for the riskiest item.", ai: "plan" },
      { key: "share", title: "Share", essential: false, prompt: "Optional: send the score to your co-founder. Public reporting strengthens follow-through.", ai: "share" },
    ],
  },
  monthly: {
    title: "Monthly review",
    short: "Monthly",
    blurb: "Re-rate your life areas, check goals, tune habits and compare hours with targets. A fresh start every month.",
    minutes: "30–45 min",
    minMinutes: "15 min",
    xp: 150,
    steps: [
      { key: "rate", title: "Re-rate life areas", essential: true, prompt: "Wheel of Life: 1–10 for each area. Be honest, not harsh." },
      { key: "goals", title: "Goal status", essential: true, prompt: "On track, at risk or off track? One line on why." },
      { key: "habits", title: "Habits", essential: false, prompt: "Graduate the automatic ones, shrink the hard ones, drop what no longer serves." },
      { key: "time", title: "Time by area", essential: false, prompt: "Where did the hours actually go versus your targets?" },
      { key: "migrate", title: "Migrate stale tasks", essential: false, prompt: "Anything waiting 30+ days gets a decision: schedule, someday or drop." },
      { key: "pulse", title: "Energy pulse", essential: false, prompt: "Three quick questions to catch burnout early." },
      { key: "next", title: "Next month", essential: true, prompt: "One focus for the month ahead and the adjustments you'll make.", ai: "next" },
    ],
  },
  quarterly: {
    title: "Quarterly review",
    short: "Quarterly",
    blurb: "Close the 12-week cycle: grade key results, read your execution, check for burnout, prune, then plan the next three goals.",
    minutes: "2–3 h",
    minMinutes: "45 min",
    xp: 300,
    steps: [
      { key: "grade", title: "Grade key results", essential: true, prompt: "Score each goal 0–1. 0.6–0.7 on a stretch goal is a win." },
      { key: "execution", title: "Execution & lessons", essential: true, prompt: "Average execution, key successes and key mistakes.", ai: "execution" },
      { key: "scan", title: "Life scan & burnout check", essential: true, prompt: "How are you, really? Three questions." },
      { key: "prune", title: "Prune", essential: false, prompt: "Archive projects, habits and areas that no longer serve you." },
      { key: "next", title: "Next cycle", essential: true, prompt: "Close this cycle and launch the next: ≤3 goals with tactics and a WOOP." },
    ],
  },
  annual: {
    title: "Annual review",
    short: "Annual",
    blurb: "Past Year Review: peaks and valleys, what went well and badly, the goal hit-rate, next year's theme — and Free Days first.",
    minutes: "Half a day",
    minMinutes: "1 h",
    xp: 500,
    steps: [
      { key: "peaks", title: "Past year peaks", essential: true, prompt: "Top positive and negative peaks. Book more of the good; put the bad on your Not-To-Do list.", ai: "peaks" },
      { key: "lists", title: "Went well / went badly", essential: true, prompt: "6–8 of each. Specific beats general.", ai: "lists" },
      { key: "goals", title: "Goals for next year", essential: false, prompt: "About 80% achieved is healthy. Set up to 8 annual goals across your areas." },
      { key: "theme", title: "Year theme", essential: true, prompt: "Pick the theme last — one word or line that ties it together." },
      { key: "freedays", title: "Free Days first", essential: true, prompt: "Put holidays and Free Days on next year's calendar before anything else." },
    ],
  },
};

export const BURNOUT_QS = [
  { key: "exhaustion", q: "How drained do you feel at the end of a typical day?", low: "Fresh", high: "Empty" },
  { key: "detachment", q: "How cynical or detached do you feel about your work?", low: "Engaged", high: "Detached" },
  { key: "efficacy", q: "How often do you feel ineffective, even when busy?", low: "Rarely", high: "Constantly" },
] as const;
