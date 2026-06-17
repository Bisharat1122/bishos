# Implementation Plan — Desktop Task Start/End Notifications (Web Push)

Source spec: [specs/2026-06-16-desktop-task-notifications.md](2026-06-16-desktop-task-notifications.md)

## Architecture at a glance

```
Browser (any tab, even closed*)        Convex (cloud)                         Push service (FCM/Mozilla)
─────────────────────────────         ──────────────────────────            ───────────────────────────
public/sw.js  ◄── push event ──────────────────────────────────────────────  delivers encrypted payload
   │  showNotification()                cron every 1 min                            ▲
   │  notificationclick → focus app     → action pushSend.sendDue (use node)        │ web-push POST (VAPID)
   ▼                                       ├ runQuery push.dueEvents (cursor scan)   │
Profile toggle → register SW           →   ├ runQuery push.subsForUsers ────────────┘
  → PushManager.subscribe(VAPID pub)       ├ web-push.sendNotification(sub, payload)
  → mutation push.subscribe (store)        ├ runMutation push.recordSent (dedup)
                                           └ runMutation push.pruneSub (on 404/410)
```
*Tab closed but **browser still running** — matches the chosen reach. Browser fully closed = not delivered (out of scope).

---

## Phase 0 — Dependencies, VAPID keys, env

1. Add deps: `web-push` (runtime, used by the Node action) and `@types/web-push` (dev). Confirm Convex bundles it for a `"use node"` action.
2. Generate VAPID keys once: `npx web-push generate-vapid-keys`.
3. Set env in **both** Convex deployments (dev `neat-jackal-591`, prod `helpful-iguana-196`) via `npx convex env set`:
   - `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` (e.g. `mailto:devzelo.solutions@gmail.com`).
4. **No `NEXT_PUBLIC_*` needed** — the client fetches the public key from a Convex query (`push.publicKey`), so it stays a single source of truth and works without a Vercel build var.

> ⚠️ Guard: the send action must **no-op with a logged warning** if `VAPID_*` is missing, so a deployment without keys doesn't throw every minute.

---

## Phase 1 — Schema + Convex data layer (regular functions)

**[convex/schema.ts](../convex/schema.ts)** — add three tables (mirror existing `dismissedNotifications` style):
```ts
pushSubscriptions: defineTable({
  userId: v.id("users"),
  endpoint: v.string(),
  p256dh: v.string(),
  auth: v.string(),
  userAgent: v.optional(v.string()),
  createdAt: v.number(),
}).index("by_user", ["userId"]).index("by_endpoint", ["endpoint"]),

sentPushes: defineTable({          // dedup ledger
  userId: v.id("users"),
  key: v.string(),                 // `task-start-<taskId>-<startAt>` | `task-end-<taskId>-<dueDate>`
  sentAt: v.number(),
}).index("by_key", ["key"]),

pushState: defineTable({           // singleton scan cursor (no retroactive firing)
  lastScanAt: v.number(),
}),
```

**New [convex/push.ts](../convex/push.ts)** (regular queries/mutations + internal helpers):
- `publicKey = query` → `process.env.VAPID_PUBLIC_KEY ?? null`.
- `subscribe = mutation({endpoint, p256dh, auth, userAgent?})` → `requireUser`, upsert by `endpoint` (delete existing same-endpoint rows first, then insert) so re-subscribing never duplicates.
- `unsubscribe = mutation({endpoint})` → delete the current user's row for that endpoint.
- `myStatus = query` → `{ subscribed: boolean }` for this browser is determined client-side (the SW subscription), so this query just returns whether the user has **any** subscription (for "On — N devices").
- `internalQuery dueEvents()` → the heart. Reads `pushState` cursor (seed to `now` on first ever run → no backfill), scans **all** tasks with `startAt`/`dueDate` in `(lastScanAt, now]`, `status !== "done"`, builds event rows `{ userId, key, title, body, href }` (body: "Starting now" / "Due now"), filters out keys already in `sentPushes`, returns `{ events, scanNow }`.
- `internalMutation commitScan({scanNow})` → set cursor `lastScanAt = scanNow`.
- `internalMutation recordSent({userId, key})` and `internalMutation pruneSub({endpoint})`.
- `internalQuery subsForUsers({userIds})` → subscriptions grouped per user.

> Cursor + `sentPushes` dedup together satisfy spec reqs 6 (no backfill) and 7 (no double-send; re-arm on reschedule because the key embeds the timestamp).

---

## Phase 2 — Node send action + cron

**New [convex/pushSend.ts](../convex/pushSend.ts)** — must start with `"use node";` (a node file can only hold actions):
- `internalAction sendDue()`:
  1. Read `VAPID_*`; if missing → warn + return.
  2. `web-push.setVapidDetails(subject, pub, priv)`.
  3. `const { events, scanNow } = await ctx.runQuery(internal.push.dueEvents, {})`.
  4. If no events → still `commitScan({scanNow})` and return.
  5. Load subs for the affected users (`internal.push.subsForUsers`).
  6. For each event × each of that user's subs: `web-push.sendNotification(sub, JSON.stringify(payload))`.
     - On 404/410 → `runMutation(internal.push.pruneSub)`.
     - On success (per event, once) → `runMutation(internal.push.recordSent)`.
  7. `commitScan({scanNow})` last.

**New [convex/crons.ts](../convex/crons.ts)**:
```ts
import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";
const crons = cronJobs();
crons.interval("desktop task notifications", { minutes: 1 }, internal.pushSend.sendDue, {});
export default crons;
```

---

## Phase 3 — Service worker

**New `public/sw.js`** (plain JS, served from origin root):
- `self.addEventListener("push", ...)` → parse JSON, `self.registration.showNotification(title, { body, icon: "/icon-192.png", badge, tag, data: { href } })`.
- `self.addEventListener("notificationclick", ...)` → `clients.matchAll()`, focus an existing bishOS window or `clients.openWindow(href)`. Close the notification.
- Add `**/sw.js` is auto-served from `public/`; no Next config needed.

**Add `public/icon-192.png`** — a 192×192 PNG of the brand mark (derive from [app/icon.svg](../app/icon.svg)). Needed because the Notification API can't use SVG reliably.

---

## Phase 4 — Client subscribe + Profile UI

**New `components/push/DesktopNotifications.tsx`** (`"use client"`):
- Reads `Notification.permission` + `navigator.serviceWorker`/`PushManager` support.
- `enable()`: register `/sw.js` → `Notification.requestPermission()` → `reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(publicKey) })` → call `push.subscribe` mutation with endpoint + keys + `navigator.userAgent`.
- `disable()`: `reg.pushManager.getSubscription()` → `unsubscribe()` + `push.unsubscribe` mutation.
- "Send test notification": local `reg.showNotification(...)` (no server round-trip) to confirm OS delivery. *(Pending open-question approval; recommended.)*
- States per spec §6: default / requesting / granted / denied / unsupported.

**[app/(app)/profile/page.tsx](../app/(app)/profile/page.tsx)** — add a new `Card` ("Desktop notifications") rendering `<DesktopNotifications/>`, styled with the existing `Card`/`Labeled` primitives and lime/dark tokens.

**[app/(app)/layout.tsx](../app/(app)/layout.tsx)** — register the SW once on mount (`navigator.serviceWorker.register("/sw.js")` inside a `useEffect`), so the worker is alive even before the user visits Profile. Guard for SSR/unsupported.

---

## Phase 5 — Verification

**Local (`npm run dev` + `npx convex dev`):**
- [ ] Toggle on in Profile → browser prompt → granted; a `pushSubscriptions` row appears (Convex dashboard).
- [ ] "Send test notification" shows an OS notification over other windows.
- [ ] Create a task with `startAt` ~2 min out; close the bishOS tab (keep browser open); within ~1 min of the time an OS "Starting now" notification arrives; clicking it focuses bishOS on `/tasks`.
- [ ] Repeat for `dueDate` ("Due now"); mark a task done before its time → no notification.
- [ ] Reschedule a task's `startAt` → fires again at the new time (new dedup key); never fires twice for the same time.
- [ ] Subscribe a second browser → both receive; kill one subscription server-side returns 410 → row pruned.

**Pre-push gate (per project rule):** `npx tsc --noEmit` **and** full `npm run build` must pass before committing. Run `npx convex dev --once` first to regenerate `_generated` (new `internal.push*`, cron) or tsc fails.

**Prod:** set `VAPID_*` env on `helpful-iguana-196` **before** the first deploy (else cron no-ops harmlessly). Push → Vercel runs `npx convex deploy` which registers the cron + node action. Re-test on https://bishos.vercel.app.

---

## Risks & decisions
- **`web-push` inside a Convex Node action** — confirm the lib bundles/runs there (Open Question in spec). Fallback if not: a Convex `httpAction` calling a tiny external sender, or generate the VAPID-signed request manually. Validate in Phase 2 first — it gates the design.
- **Node file split** — queries/mutations/internalQueries live in `push.ts`; only the action lives in `pushSend.ts` with `"use node"` (Convex forbids mixing).
- **1-min cron cost/precision** — acceptable per spec; cursor scan means at most one scan/min regardless of task count.
- **Permission UX** — denial is sticky in the browser; copy must point to site settings. In-app bell remains the always-available fallback.
- **`public/` didn't exist** — creating it for `sw.js` + `icon-192.png` is new but standard for Next.

## Suggested commits
1. `feat(push): schema + subscribe/unsubscribe + publicKey query`
2. `feat(push): node send action + 1-min cron`
3. `feat(push): service worker + client subscribe component`
4. `feat(push): Profile toggle + SW registration + 192px icon`

## Out-of-scope follow-ups (noted, not built)
Lead-time heads-up (5 min before), schedule-block notifications, quiet hours/snooze, mobile push, notification history.
