"use node";

import webpush from "web-push";
import { action, internalAction } from "./_generated/server";
import { internal } from "./_generated/api";

/** Send a real Web Push to the current user's devices — validates the full
 * server→browser pipeline (VAPID + endpoint), not just local showNotification. */
export const sendTestToMe = action({
  args: {},
  handler: async (ctx): Promise<{ sent: number; failed: number; error?: string }> => {
    const pub = process.env.VAPID_PUBLIC_KEY;
    const priv = process.env.VAPID_PRIVATE_KEY;
    const subject = process.env.VAPID_SUBJECT || "mailto:devzelo.solutions@gmail.com";
    if (!pub || !priv) return { sent: 0, failed: 0, error: "Server push keys not configured." };
    webpush.setVapidDetails(subject, pub, priv);

    const subs = await ctx.runQuery(internal.push.mySubsInternal, {});
    if (subs.length === 0) {
      return { sent: 0, failed: 0, error: "No subscribed device on the server. Toggle off, then on again." };
    }

    const payload = JSON.stringify({
      title: "bishOS test ✅",
      body: "Server push works — task alerts will arrive like this.",
      href: "/tasks",
      tag: "bishos-test",
    });
    let sent = 0;
    let failed = 0;
    let error: string | undefined;
    for (const s of subs) {
      try {
        await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload);
        sent++;
      } catch (e) {
        failed++;
        const code = (e as { statusCode?: number }).statusCode;
        error = `${code ?? ""} ${(e as Error).message}`.trim();
        if (code === 404 || code === 410) {
          await ctx.runMutation(internal.push.pruneSub, { endpoint: s.endpoint });
        }
      }
    }
    return { sent, failed, error };
  },
});

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
