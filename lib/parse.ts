import { addDaysYmd, todayYmd, weekdayOf } from "./day";

/**
 * Natural-language quick add:
 *   "Send proposal to Ali tomorrow #sales !high ~45m"
 *   → { title: "Send proposal to Ali", plannedFor: <tomorrow>, area: sales, priority: high, estimate: 45 }
 * Tokens: today/tonight · tomorrow/tmr · mon…sun · next week · in 3 days · someday
 *         #area (prefix or word match) · !high !med !low (also !!! / !!) · ~30m ~1h ~1.5h
 */

export type ParsedTask = {
  title: string;
  plannedFor?: string;
  someday?: boolean;
  priority?: "low" | "med" | "high";
  estimateMin?: number;
  areaId?: string;
  areaName?: string;
  chips: { kind: "date" | "area" | "priority" | "estimate" | "someday"; label: string }[];
};

const DAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
const SHORT = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

export function parseQuickTask(
  input: string,
  areas: { _id: string; name: string }[] = [],
  today = todayYmd(),
): ParsedTask {
  let text = ` ${input} `;
  const chips: ParsedTask["chips"] = [];
  const out: ParsedTask = { title: "", chips };

  const take = (re: RegExp, fn: (m: RegExpMatchArray) => void) => {
    const m = text.match(re);
    if (m) {
      fn(m);
      text = text.replace(m[0], " ");
    }
  };

  // estimate ~30m ~1h ~1.5h
  take(/\s~(\d+(?:\.\d+)?)\s*(m|min|h|hr|hrs)?(?=\s)/i, (m) => {
    const n = parseFloat(m[1]);
    const unit = (m[2] ?? "m").toLowerCase();
    out.estimateMin = Math.round(unit.startsWith("h") ? n * 60 : n);
    chips.push({ kind: "estimate", label: out.estimateMin >= 60 ? `${+(out.estimateMin / 60).toFixed(1)}h` : `${out.estimateMin}m` });
  });

  // priority
  take(/\s(!high|!h|!!!)(?=\s)/i, () => {
    out.priority = "high";
    chips.push({ kind: "priority", label: "High" });
  });
  if (!out.priority)
    take(/\s(!med|!m|!!)(?=\s)/i, () => {
      out.priority = "med";
      chips.push({ kind: "priority", label: "Medium" });
    });
  if (!out.priority)
    take(/\s(!low|!l)(?=\s)/i, () => {
      out.priority = "low";
      chips.push({ kind: "priority", label: "Low" });
    });

  // area #token — only consumed when it matches an area, so "Fix bug #123" keeps its "#123".
  {
    const m = text.match(/\s#([\p{L}\p{N}_-]+)(?=\s)/iu);
    if (m) {
      const q = m[1].toLowerCase();
      const hit =
        areas.find((a) => a.name.toLowerCase().startsWith(q)) ??
        areas.find((a) => a.name.toLowerCase().split(/[\s&,/-]+/).some((w) => w.startsWith(q))) ??
        areas.find((a) => a.name.toLowerCase().includes(q));
      if (hit) {
        out.areaId = hit._id;
        out.areaName = hit.name;
        chips.push({ kind: "area", label: hit.name });
        text = text.replace(m[0], " ");
      }
    }
  }

  // dates
  const setDate = (d: string, label: string) => {
    if (out.plannedFor || out.someday) return;
    out.plannedFor = d;
    chips.push({ kind: "date", label });
  };
  // ("tom" is deliberately not a token — "Call Tom" must keep the name.)
  take(/\s(today|tonight|tdy)(?=\s)/i, () => setDate(today, "Today"));
  take(/\s(tomorrow|tmrw|tmr)(?=\s)/i, () => setDate(addDaysYmd(today, 1), "Tomorrow"));
  take(/\snext week(?=\s)/i, () => {
    const wd = weekdayOf(today);
    const toMon = ((8 - wd) % 7) || 7;
    setDate(addDaysYmd(today, toMon), "Next week");
  });
  take(/\sin (\d{1,2}) days?(?=\s)/i, (m) => setDate(addDaysYmd(today, Number(m[1])), `In ${m[1]} days`));
  take(new RegExp(`\\s(on\\s)?(${DAYS.join("|")}|${SHORT.join("|")})(?=\\s)`, "i"), (m) => {
    const name = m[2].toLowerCase();
    let idx = DAYS.indexOf(name);
    if (idx < 0) idx = SHORT.indexOf(name);
    if (idx < 0) return;
    const wd = weekdayOf(today);
    const delta = ((idx - wd + 7) % 7) || 7;
    const label = DAYS[idx][0].toUpperCase() + DAYS[idx].slice(1);
    setDate(addDaysYmd(today, delta), label);
  });
  // Someday after the explicit dates, so "later today" means today (not someday).
  take(/\s(someday|later|sometime)(?=\s)/i, () => {
    if (out.plannedFor) return;
    out.someday = true;
    chips.push({ kind: "someday", label: "Someday" });
  });

  out.title = text.replace(/\s+/g, " ").trim();
  return out;
}
