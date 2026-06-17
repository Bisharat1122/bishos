# Spec: Desktop Task Start/End Notifications (Web Push)

| | |
|---|---|
| **Status** | Draft |
| **Created** | 2026-06-16 |
| **Author** | Bish / Claude Code |
| **Area** | `convex/` (push + cron), `public/sw.js`, `app/(app)/layout.tsx`, Profile/settings UI |

## 1. Problem & context
Today bishOS notifications are **pull-based** — computed in [convex/notifications.ts](convex/notifications.ts) and only seen if you open the in-app bell. There's no way to be *interrupted* when a task is starting or ending. Bish wants an OS-level popup that appears over whatever window/app is focused, at a task's **start time** and **end (due) time**, even when the bishOS tab isn't open.

## 2. Goals
- Deliver a **native OS desktop notification** at each task's `startAt` and `dueDate` (end) moment.
- Notifications fire **even when no bishOS tab is open**, as long as the browser is running in the background (Web Push + Service Worker).
- Clicking a notification opens bishOS focused on the relevant task.
- Bish can **enable/disable** desktop notifications and see permission status from the app.

## 3. Non-goals (out of scope)
- Firing when the **browser is fully closed** or the OS is asleep (requires a native/Electron app — explicitly excluded per product decision).
- **Lead-time "heads-up"** notifications (e.g. "5 min before"). Start/end only for v1.
- **Schedule-block** start/end notifications (tasks only for v1).
- Notifications for goals, habits, projects, check-ins (the in-app bell already covers these).
- Quiet hours / do-not-disturb windows, snooze, notification history.
- Mobile push (iOS/Android). Desktop browser only for v1.

## 4. User stories
- As **Bish**, I want a desktop popup the moment a task is scheduled to **start**, so I begin on time regardless of what app I'm in.
- As **Bish**, I want a desktop popup at a task's **end/due** time, so I wrap up or notice I've run over.
- As **Bish**, I want to **click** the popup and land directly on that task in bishOS.
- As **Bish**, I want to **turn desktop notifications on/off** and know whether the browser has granted permission.

## 5. Functional requirements
1. The system MUST let Bish grant browser **Notification + Push permission** from an in-app control, registering a Service Worker and a `PushManager` subscription.
2. The system MUST persist each push subscription (endpoint + keys + user agent) in Convex, supporting **multiple devices/browsers** per user.
3. The system MUST fire a notification at a task's `startAt` time titled with the task and labeled "Starting now" (only if the task is not `done`).
4. The system MUST fire a notification at a task's `dueDate` time labeled "Due now / ending" (only if the task is not `done`).
5. Notifications MUST be delivered via **Web Push** so they appear when the bishOS tab is backgrounded **or closed** (browser still running).
6. The system MUST NOT fire **retroactively** — only for start/end times that arrive *after* the task's time was set (no backfill of past-due tasks on first enable).
7. The system MUST **not double-send** the same task-start or task-end event; rescheduling a task to a new time MUST re-arm a fresh notification.
8. Clicking a notification MUST focus an existing bishOS window (or open one) at `/tasks` with the task surfaced.
9. The system SHOULD **prune dead subscriptions** automatically when the push endpoint returns 404/410.
10. The system SHOULD fall back gracefully to the existing in-app bell when permission is denied/unsupported (no errors, clear messaging).

## 6. UI / UX decisions
- **Enable control:** a "Desktop notifications" toggle on the **Profile page** ([app/(app)/profile/page.tsx](app/(app)/profile/page.tsx)), reusing existing card/toggle styling (dark-first, lime primary). States:
  - *Default (not enabled):* toggle off + "Get notified on your desktop when a task starts or ends."
  - *Requesting:* triggers the browser permission prompt on toggle-on.
  - *Granted/enabled:* toggle on, subtle "On — this browser" + a "Send test notification" link.
  - *Denied:* toggle disabled with helper text "Blocked in browser settings — re-enable to use." (link/explainer).
  - *Unsupported:* hidden or shown disabled with "Not supported in this browser."
- **The notification itself (OS-rendered):**
  - Title: the task title. Body: `Starting now` or `Due now` + optional life area / time. Icon: app icon ([app/icon.svg](app/icon.svg) / a 192px PNG in `public/`).
  - `tag` per task-event so a repeat replaces rather than stacks.
- No in-app modal/dialog in v1 (style decision = native OS notification only). The existing **NotificationBell** stays unchanged as the in-app channel.
- Responsive/mobile: control is visible but may show "Not supported" on browsers without Push; no layout change required.

## 7. Data & technical considerations
- **New env vars:** `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` (mailto), plus `NEXT_PUBLIC_VAPID_PUBLIC_KEY` for the client subscribe call. Must be set in dev (`neat-jackal-591`) **and** prod (`helpful-iguana-196`) Convex deployments + Vercel.
- **New Service Worker:** `public/sw.js` — handles `push` (show notification) and `notificationclick` (focus/open window). Registered from [app/(app)/layout.tsx](app/(app)/layout.tsx) (client component context).
- **New Convex schema tables** (in [convex/schema.ts](convex/schema.ts)):
  - `pushSubscriptions`: `userId`, `endpoint`, `keys: { p256dh, auth }`, `userAgent?`, `createdAt`. Index `by_user`, `by_endpoint`.
  - `sentPushes` (dedup): `userId`, `key` (e.g. `task-start-<taskId>-<startAt>`), `sentAt`. Index `by_user`. (Mirrors the `dismissedNotifications` pattern.)
- **New Convex module `convex/push.ts`:**
  - `subscribe` / `unsubscribe` mutations (upsert/delete by endpoint).
  - `sendDuePushes` **Node action** (`"use node";`) using the `web-push` npm package: scans tasks whose `startAt`/`dueDate` fell within the last cron window and are not `done`, builds the dedup `key` (task + event + timestamp), skips already-sent, sends to all of the user's subscriptions, records `sentPushes`, prunes 404/410 endpoints.
- **New `convex/crons.ts`:** interval cron every **1 minute** invoking `sendDuePushes`. (⇒ ~1-minute delivery resolution — acceptable.)
- **Dependency:** add `web-push` (and dev types). The action file must be a Convex Node action.
- **Reuses:** task time fields already exist (`tasks.startAt`, `tasks.dueDate` in [convex/schema.ts](convex/schema.ts)); absolute ms timestamps ⇒ timezone-agnostic.

## 8. Acceptance criteria
- [ ] Given Bish toggles "Desktop notifications" on and grants permission, when he reloads, then the toggle shows "On — this browser" and a subscription row exists in Convex.
- [ ] Given a task with `startAt` 2 minutes in the future and status ≠ done, when that time passes with **no bishOS tab open** (browser running), then an OS notification "Starting now" appears within ~1 minute.
- [ ] Given a task with `dueDate` in the near future and status ≠ done, when that time passes, then an OS notification "Due now" appears once.
- [ ] Given a fired notification, when Bish clicks it, then a bishOS window focuses/opens on `/tasks` with that task surfaced.
- [ ] Given the cron runs repeatedly, when a task-start has already been sent, then it is **not** sent again (dedup), unless `startAt` is changed to a new time.
- [ ] Given a task is marked `done` before its time, when that time arrives, then **no** notification fires.
- [ ] Given Bish has two browsers subscribed, when an event fires, then both receive it; if one endpoint is dead (410), that subscription is removed.
- [ ] Given permission is denied/unsupported, when Bish opens Profile, then he sees clear status and the app still works (in-app bell unaffected).

## 9. Edge cases & error handling
- **Past-due / past-start tasks at enable time** → no backfire; only future crossings fire (requirement 6).
- **Rescheduling a task** → dedup key embeds the timestamp, so the new time re-arms; the old key is abandoned (never fired).
- **Task with no `startAt` / no `dueDate`** → only the present time field notifies.
- **Browser closed at fire time** → not delivered (known limit, matches chosen reach); not retried/queued.
- **Duplicate subscriptions (same endpoint)** → upsert by `endpoint`, never duplicate rows.
- **Send failure 404/410** → delete that subscription; other status → log, keep.
- **Clock skew / cron miss** → window query should cover "since last run" not just the exact minute, to avoid dropped events on a delayed cron tick.
- **Missing VAPID env in a deployment** → action no-ops with a logged warning rather than throwing every minute.

## 10. Assumptions
- Bish uses a desktop browser that supports the Push API (Chrome/Edge/Firefox). Safari support is best-effort, not guaranteed for v1.
- ~1-minute delivery precision is acceptable (cron granularity).
- "End" = the task's `dueDate` field (per existing model where due = end).
- The 192×192 PNG icon needed by the Notification API can be derived from the existing brand mark.
- A Convex cron + Node action is the chosen scheduler (vs. per-task scheduled functions), for resilience to edits without bookkeeping.

## 11. Open questions (resolve during planning/implementation)
- [ ] Should the **end** notification fire if the task is `in_progress` but not `done` (assumed yes), and should it read differently when overdue vs. exactly due?
- [ ] Do we want a **"Send test notification"** affordance in v1 (recommended for trust), or defer?
- [ ] Should enabling on a new device **replace** or **add to** existing subscriptions (assumed add — multi-device)?
- [ ] Any concern with a **1-minute cron** cost on Convex, or prefer per-task scheduled functions despite the re-arm bookkeeping?
- [ ] Confirm we can add the `web-push` dependency and a Node action to the Convex deployment (no platform restriction).
```
