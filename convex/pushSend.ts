"use node";

import webpush from "web-push";
import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";

/** Runs every minute (see crons.ts). Sends a native desktop notification for
 * every task start/end event that just came due, to all of the user's
 * subscribed browsers. */
export const sendDue = internalAction({
  args: {},
  handler: async (ctx) => {
    const pub = process.env.VAPID_PUBLIC_KEY;
    const priv = process.env.VAPID_PRIVATE_KEY;
    const subject = process.env.VAPID_SUBJECT || "mailto:devzelo.solutions@gmail.com";
    if (!pub || !priv) {
      console.warn("[push] VAPID keys missing — skipping send.");
      return;
    }
    webpush.setVapidDetails(subject, pub, priv);

    const { events, scanNow } = await ctx.runQuery(internal.push.dueEvents, {});
    if (events.length === 0) {
      await ctx.runMutation(internal.push.commitScan, { scanNow });
      return;
    }

    const userIds = [...new Set(events.map((e) => e.userId))];
    const subs = await ctx.runQuery(internal.push.subsForUsers, {
      userIds: userIds as never,
    });
    const subsByUser = new Map<string, typeof subs>();
    for (const s of subs) {
      const arr = subsByUser.get(s.userId) ?? [];
      arr.push(s);
      subsByUser.set(s.userId, arr);
    }

    for (const e of events) {
      const targets = subsByUser.get(e.userId) ?? [];
      if (targets.length === 0) continue;
      const payload = JSON.stringify({ title: e.title, body: e.body, href: e.href, tag: e.key });
      let delivered = false;
      for (const t of targets) {
        try {
          await webpush.sendNotification(
            { endpoint: t.endpoint, keys: { p256dh: t.p256dh, auth: t.auth } },
            payload,
          );
          delivered = true;
        } catch (err) {
          const code = (err as { statusCode?: number }).statusCode;
          if (code === 404 || code === 410) {
            await ctx.runMutation(internal.push.pruneSub, { endpoint: t.endpoint });
          } else {
            console.warn("[push] send failed", code, (err as Error).message);
          }
        }
      }
      // Mark sent if it reached at least one device, so we don't retry forever.
      if (delivered) {
        await ctx.runMutation(internal.push.recordSent, { userId: e.userId as never, key: e.key });
      }
    }

    await ctx.runMutation(internal.push.commitScan, { scanNow });
  },
});
