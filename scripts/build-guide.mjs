// Builds the bishOS manual (HTML + PDF) from the same content the in-app
// Guide page uses: lib/guide/sections/*.ts + lib/guide/routine.ts.
//
//   node --experimental-strip-types scripts/build-guide.mjs
//
// Output: docs/bishOS-Guide.html and docs/bishOS-Guide.pdf (PDF via headless
// Microsoft Edge / Chrome, whichever exists).
import { readdirSync, writeFileSync, mkdirSync, existsSync, statSync, rmSync, copyFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { execFileSync } from "node:child_process";

const root = resolve(import.meta.dirname, "..");
const secDir = join(root, "lib", "guide", "sections");
const ORDER = ["Start here", "Today", "Direction", "Founder", "Content", "Mind", "Work", "System"];
const FILE_ORDER = ["core", "direction", "founder", "finance", "content", "mind", "work"];

const files = readdirSync(secDir)
  .filter((f) => f.endsWith(".ts"))
  .sort((a, b) => {
    const ia = FILE_ORDER.indexOf(a.replace(/\.ts$/, ""));
    const ib = FILE_ORDER.indexOf(b.replace(/\.ts$/, ""));
    return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
  });
let sections = [];
for (const f of files) {
  const m = await import(pathToFileURL(join(secDir, f)).href);
  sections.push(...(m.sections ?? []));
}
sections.sort((a, b) => ORDER.indexOf(a.group) - ORDER.indexOf(b.group));
const routine = await import(pathToFileURL(join(root, "lib", "guide", "routine.ts")).href);

const esc = (s = "") =>
  String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/`([^`]+)`/g, "<code>$1</code>");

// ── stats + glossary ──────────────────────────────────────────────────────
const pageCount = sections.reduce((n, s) => n + s.pages.length, 0);
const elementCount = sections.reduce((n, s) => n + s.pages.reduce((m, p) => m + p.elements.length, 0), 0);
const glossaryMap = new Map();
for (const s of sections)
  for (const t of s.frameworks ?? []) {
    const k = t.term.trim().toLowerCase();
    if (!glossaryMap.has(k)) glossaryMap.set(k, { ...t, module: s.title });
  }
const glossary = [...glossaryMap.values()].sort((a, b) => a.term.localeCompare(b.term));

// ── HTML ──────────────────────────────────────────────────────────────────
const toc = ORDER.filter((g) => sections.some((s) => s.group === g))
  .map(
    (g) => `<li class="toc-group"><span>${esc(g)}</span><ol>${sections
      .filter((s) => s.group === g)
      .map((s) => `<li><a href="#${s.id}">${esc(s.title)}</a> <em>${s.pages.map((p) => esc(p.route)).join(" · ")}</em></li>`)
      .join("")}</ol></li>`,
  )
  .join("");

const rhythmHtml = routine.RHYTHM.map(
  (b) => `<section class="block" id="r-${b.id}">
    <h3>${esc(b.title)} <small>${esc(b.when)}</small></h3>
    <p>${esc(b.summary)}</p>
    <table class="steps"><thead><tr><th>#</th><th>Step</th><th>Where</th><th>Time</th><th>What to do</th></tr></thead><tbody>
    ${b.steps
      .map(
        (s, i) => `<tr><td>${i + 1}</td><td><b>${esc(s.title)}</b></td><td><code>${esc(s.where)}</code></td><td>${s.minutes ? `${s.minutes} min` : "—"}</td><td>${esc(s.detail)}</td></tr>`,
      )
      .join("")}
    </tbody></table></section>`,
).join("");

const firstWeek = `<table class="steps"><thead><tr><th>Day</th><th>Focus</th><th>Tasks</th></tr></thead><tbody>${routine.FIRST_WEEK.map(
  (d) => `<tr><td><b>${esc(d.day)}</b></td><td>${esc(d.focus)}</td><td><ul>${d.tasks.map((t) => `<li>${esc(t)}</li>`).join("")}</ul></td></tr>`,
).join("")}</tbody></table>`;

const whenHtml = (w = {}) => {
  const rows = [
    ["One-time", w.oneTime],
    ["Daily", w.daily],
    ["Weekly", w.weekly],
    ["Monthly", w.monthly],
    ["Quarterly", w.quarterly],
  ].filter((r) => r[1]);
  return rows.length ? `<dl class="when">${rows.map(([k, v]) => `<dt>${k}</dt><dd>${esc(v)}</dd>`).join("")}</dl>` : "";
};

const sectionHtml = (s) => `<article class="module" id="${s.id}">
  <div class="module-head"><span class="group">${esc(s.group)}</span><h2>${esc(s.title)}</h2>
  <p class="lead">${esc(s.summary)}</p><p class="why"><b>Why it helps:</b> ${esc(s.why)}</p>${whenHtml(s.when)}</div>
  ${s.pages
    .map(
      (p) => `<section class="page"><h3>${esc(p.title)} <code>${esc(p.route)}</code></h3><p>${esc(p.purpose)}</p>
      ${
        p.howTo?.length
          ? `<h4>How to use it</h4><ol class="howto">${p.howTo.map((h) => `<li>${esc(h)}</li>`).join("")}</ol>`
          : ""
      }
      <h4>Every element on this page</h4>
      <table class="elements"><thead><tr><th>Element</th><th>What it is</th><th>How to use it</th></tr></thead><tbody>
      ${p.elements.map((e) => `<tr><td><b>${esc(e.name)}</b></td><td>${esc(e.what)}</td><td>${esc(e.how ?? "")}</td></tr>`).join("")}
      </tbody></table></section>`,
    )
    .join("")}
  ${
    s.frameworks?.length
      ? `<section class="terms"><h3>Frameworks &amp; terms in this module</h3>${s.frameworks
          .map(
            (t) => `<div class="term"><p><b>${esc(t.term)}</b>${t.source ? ` <span class="src">${esc(t.source)}</span>` : ""}</p><p>${esc(t.definition)}</p>${
              t.example ? `<p class="ex"><i>Example:</i> ${esc(t.example)}</p>` : ""
            }</div>`,
          )
          .join("")}</section>`
      : ""
  }
  <section class="testing"><h3>How to test it</h3><ol>${s.testing.map((t) => `<li>${esc(t)}</li>`).join("")}</ol></section>
  ${s.tips?.length ? `<section class="tips"><h3>Tips</h3><ul>${s.tips.map((t) => `<li>${esc(t)}</li>`).join("")}</ul></section>` : ""}
</article>`;

const today = new Date().toISOString().slice(0, 10);
const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>bishOS — The Complete Guide</title>
<style>
  @page { size: A4; margin: 16mm 14mm 18mm; }
  :root { --ink:#141820; --muted:#5a6170; --line:#e1e5eb; --soft:#f3f5f8; --accent:#2563eb; --violet:#7c3aed; --green:#15803d; }
  * { box-sizing: border-box; }
  body { font-family: "Segoe UI", "Geist", system-ui, -apple-system, sans-serif; color: var(--ink); font-size: 10.5pt; line-height: 1.5; margin: 0; }
  h1,h2,h3,h4 { line-height: 1.2; margin: 0 0 .4em; }
  h2 { font-size: 19pt; } h3 { font-size: 12.5pt; margin-top: 1.1em; } h4 { font-size: 10.5pt; margin-top: .9em; color: var(--muted); text-transform: uppercase; letter-spacing: .04em; }
  code { font-family: Consolas, "Cascadia Code", monospace; font-size: 9pt; background: var(--soft); border: 1px solid var(--line); padding: 0 4px; border-radius: 4px; }
  small { color: var(--muted); font-weight: 400; font-size: 9.5pt; margin-left: 6px; }
  a { color: var(--accent); text-decoration: none; }
  table { width: 100%; border-collapse: collapse; margin: .4em 0 .8em; page-break-inside: auto; }
  tr { page-break-inside: avoid; }
  th, td { text-align: left; vertical-align: top; padding: 5px 7px; border-bottom: 1px solid var(--line); }
  th { font-size: 8.5pt; text-transform: uppercase; letter-spacing: .04em; color: var(--muted); background: var(--soft); }
  table.elements td:first-child { width: 24%; } table.elements td:nth-child(2) { width: 42%; }
  ul, ol { margin: .3em 0 .6em 1.2em; padding: 0; }
  .cover { height: 260mm; display: flex; flex-direction: column; justify-content: center; page-break-after: always; }
  .logo { width: 64px; height: 64px; border-radius: 16px; background: linear-gradient(#2b313d,#11141a); display:flex; align-items:center; justify-content:center; margin-bottom: 24px; }
  .cover h1 { font-size: 40pt; letter-spacing: -.02em; }
  .cover .sub { font-size: 14pt; color: var(--muted); max-width: 140mm; }
  .stats { display: flex; gap: 14px; margin-top: 28px; }
  .stat { border: 1px solid var(--line); border-radius: 12px; padding: 10px 14px; min-width: 32mm; }
  .stat b { display: block; font-size: 18pt; }
  .part { page-break-before: always; }
  .part > h1 { font-size: 26pt; margin-bottom: .2em; } .part > p.lead { color: var(--muted); font-size: 12pt; }
  .toc ol { list-style: none; margin-left: 0; } .toc-group > span { font-weight: 700; display: block; margin-top: 10px; text-transform: uppercase; font-size: 9pt; letter-spacing: .05em; color: var(--muted); }
  .toc li li { padding: 2px 0; border-bottom: 1px dotted var(--line); } .toc em { color: var(--muted); font-size: 8.5pt; font-style: normal; margin-left: 6px; }
  .module { page-break-before: always; }
  .module-head { border: 1px solid var(--line); background: var(--soft); border-radius: 14px; padding: 14px 16px; margin-bottom: 10px; }
  .group { display: inline-block; font-size: 8pt; text-transform: uppercase; letter-spacing: .06em; color: var(--violet); font-weight: 700; margin-bottom: 4px; }
  .lead { font-size: 11.5pt; } .why { margin-top: .3em; }
  dl.when { display: grid; grid-template-columns: 26mm 1fr; gap: 2px 10px; margin: .6em 0 0; } dl.when dt { font-weight: 700; color: var(--muted); } dl.when dd { margin: 0; }
  .page { margin-top: 8px; }
  .terms { margin-top: 10px; } .term { border-left: 3px solid var(--accent); padding: 4px 10px; margin: 6px 0; page-break-inside: avoid; }
  .term p { margin: 2px 0; } .src { font-size: 8pt; color: var(--muted); border: 1px solid var(--line); border-radius: 6px; padding: 0 5px; margin-left: 4px; }
  .ex { color: var(--muted); }
  .testing ol li, .howto li { margin: 2px 0; }
  .testing { border: 1px dashed var(--line); border-radius: 12px; padding: 4px 14px 8px; margin-top: 12px; }
  .glossary .term { border-left-color: var(--violet); } .glossary .mod { font-size: 8pt; color: var(--muted); }
  .block { margin-top: 10px; page-break-inside: auto; }
  .note { background: var(--soft); border: 1px solid var(--line); border-radius: 12px; padding: 10px 14px; }
</style></head><body>
<section class="cover">
  <div class="logo"><svg width="38" height="38" viewBox="0 0 32 32"><polygon fill="#fff" points="15.04,6.72 16.74,14.30 24.32,16.00 16.74,17.70 15.04,25.28 13.34,17.70 5.76,16.00 13.34,14.30"/></svg></div>
  <h1>bishOS — The Complete Guide</h1>
  <p class="sub">Your founder Life OS: every module, page and element explained in simple words — with your daily routine, one-time setup, the frameworks behind it, and a full testing guide.</p>
  <div class="stats">
    <div class="stat"><b>${sections.length}</b>modules</div>
    <div class="stat"><b>${pageCount}</b>pages</div>
    <div class="stat"><b>${elementCount}</b>elements explained</div>
    <div class="stat"><b>${glossary.length}</b>terms defined</div>
  </div>
  <p class="sub" style="margin-top:28px;font-size:10pt">Generated ${today}. The same content lives in the app at <code>/guide</code>.</p>
</section>

<section class="part toc"><h1>Contents</h1>
  <ol>
    <li class="toc-group"><span>Part 1 · Your rhythm</span><ol>${routine.RHYTHM.map((b) => `<li><a href="#r-${b.id}">${esc(b.title)}</a> <em>${esc(b.when)}</em></li>`).join("")}<li><a href="#first-week">Your first week</a></li></ol></li>
    <li class="toc-group"><span>Part 2 · Modules</span></li>${toc}
    <li class="toc-group"><span>Part 3 · Glossary</span><ol><li><a href="#glossary">All ${glossary.length} terms A–Z</a></li></ol></li>
    <li class="toc-group"><span>Part 4 · Testing guide</span><ol><li><a href="#testing">30-minute test + per-module tests</a></li></ol></li>
  </ol>
</section>

<section class="part"><h1>Part 1 · Your rhythm</h1>
  <p class="lead">What to do once, every day, every week, every month, every 12 weeks and every year. Follow this and the system runs itself.</p>
  <div class="note"><b>The whole system in one sentence:</b> Life Areas are the spine → a 12-week cycle holds at most 3 goals → each goal has weekly tactics → projects and tasks serve them → every Monday you set a Weekly Big 3 → every morning you pick a Top 3 and every evening you shut down → every Friday the weekly review closes the loop.</div>
  ${rhythmHtml}
  <section class="block" id="first-week"><h3>Your first week</h3>${firstWeek}</section>
</section>

<section class="part"><h1>Part 2 · Modules</h1><p class="lead">Every module, page and element — what it is, how it works, how it helps you, and how to test it.</p></section>
${sections.map(sectionHtml).join("")}

<section class="part glossary" id="glossary"><h1>Part 3 · Glossary</h1><p class="lead">Every framework, method and term used in bishOS, A–Z.</p>
${glossary
  .map(
    (t) => `<div class="term"><p><b>${esc(t.term)}</b>${t.source ? ` <span class="src">${esc(t.source)}</span>` : ""} <span class="mod">· ${esc(t.module)}</span></p><p>${esc(t.definition)}</p>${
      t.example ? `<p class="ex"><i>Example:</i> ${esc(t.example)}</p>` : ""
    }</div>`,
  )
  .join("")}
</section>

<section class="part" id="testing"><h1>Part 4 · Testing guide</h1>
  <p class="lead">First the 30-minute end-to-end test, then the detailed tests for each module.</p>
  <h3>30-minute end-to-end test</h3><ol>${routine.QUICK_TEST.map((t) => `<li>${esc(t)}</li>`).join("")}</ol>
  ${sections.map((s) => `<h3>${esc(s.title)}</h3><ol>${s.testing.map((t) => `<li>${esc(t)}</li>`).join("")}</ol>`).join("")}
</section>
</body></html>`;

const outDir = join(root, "docs");
mkdirSync(outDir, { recursive: true });
const htmlPath = join(outDir, "bishOS-Guide.html");
const pdfPath = join(outDir, "bishOS-Guide.pdf");
writeFileSync(htmlPath, html);
console.log(`HTML: ${htmlPath} (${sections.length} modules, ${pageCount} pages, ${elementCount} elements, ${glossary.length} terms)`);

const browsers = [
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
];
const bin = browsers.find((b) => existsSync(b));
if (!bin) {
  console.log("No Edge/Chrome found — open the HTML and print to PDF.");
} else {
  if (existsSync(pdfPath)) rmSync(pdfPath);
  const profile = join(tmpdir(), "bishos-guide-pdf-profile");
  execFileSync(
    bin,
    ["--headless=new", "--disable-gpu", "--no-pdf-header-footer", `--user-data-dir=${profile}`, `--print-to-pdf=${pdfPath}`, pathToFileURL(htmlPath).href],
    { stdio: "ignore", timeout: 180000 },
  );
  // Edge may finish writing after the process returns — wait for a stable file.
  let last = -1;
  for (let i = 0; i < 120; i++) {
    const size = existsSync(pdfPath) ? statSync(pdfPath).size : 0;
    if (size > 0 && size === last) break;
    last = size;
    await new Promise((r) => setTimeout(r, 1000));
  }
  if (existsSync(pdfPath)) {
    // Serve it from the app too (Guide → Download PDF).
    copyFileSync(pdfPath, join(root, "public", "bishOS-Guide.pdf"));
    console.log(`PDF:  ${pdfPath} (${Math.round(statSync(pdfPath).size / 1024)} KB) — also copied to public/`);
  } else console.log("PDF was not produced — open the HTML and print to PDF.");
}
