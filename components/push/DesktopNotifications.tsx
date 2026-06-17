"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Bell, BellOff, Loader2, Send, Volume2, VolumeX, Play } from "lucide-react";
import { playChime, isChimeEnabled, setChimeEnabled, unlockChime } from "@/lib/chime";
import { cn } from "@/lib/utils";

/** VAPID public key (base64url) → Uint8Array for PushManager.subscribe. */
function urlBase64ToUint8Array(base64: string) {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

type Support = "checking" | "unsupported" | "supported";

export function DesktopNotifications() {
  const publicKey = useQuery(api.push.publicKey);
  const status = useQuery(api.push.myStatus);
  const subscribeMut = useMutation(api.push.subscribe);
  const unsubscribeMut = useMutation(api.push.unsubscribe);
  const sendServerTest = useAction(api.pushSend.sendTestToMe);

  const [support, setSupport] = useState<Support>("checking");
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [subscribed, setSubscribed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [testMsg, setTestMsg] = useState<string | null>(null);
  const [soundOn, setSoundOn] = useState(true);

  useEffect(() => setSoundOn(isChimeEnabled()), []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const ok =
      "serviceWorker" in navigator &&
      "PushManager" in window &&
      "Notification" in window;
    setSupport(ok ? "supported" : "unsupported");
    if (!ok) return;
    setPermission(Notification.permission);
    navigator.serviceWorker.ready
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => setSubscribed(!!sub))
      .catch(() => {});
  }, []);

  async function enable() {
    setError(null);
    if (!publicKey) {
      setError("Push isn't configured on the server yet.");
      return;
    }
    setBusy(true);
    try {
      const reg = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== "granted") {
        setBusy(false);
        return;
      }
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });
      const json = sub.toJSON();
      await subscribeMut({
        endpoint: sub.endpoint,
        p256dh: json.keys?.p256dh ?? "",
        auth: json.keys?.auth ?? "",
        userAgent: navigator.userAgent,
      });
      setSubscribed(true);
    } catch (e) {
      setError((e as Error).message || "Couldn't enable notifications.");
    } finally {
      setBusy(false);
    }
  }

  async function disable() {
    setBusy(true);
    setError(null);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await unsubscribeMut({ endpoint: sub.endpoint });
        await sub.unsubscribe();
      }
      setSubscribed(false);
    } catch (e) {
      setError((e as Error).message || "Couldn't disable notifications.");
    } finally {
      setBusy(false);
    }
  }

  async function sendTest() {
    setError(null);
    setTestMsg("Testing…");
    unlockChime();
    if (soundOn) void playChime(); // hear the bishOS chime immediately
    // 1) Local notification — proves the OS/browser will display at all.
    let localOk = false;
    try {
      const reg = await navigator.serviceWorker.ready;
      await reg.showNotification("bishOS test (local)", {
        body: "If you can see this, OS notifications are on.",
        icon: "/icon-192.png",
        badge: "/icon-192.png",
        tag: "bishos-test-local",
      });
      localOk = true;
    } catch {
      /* handled below */
    }
    // 2) Real server push — proves the full task-alert pipeline.
    try {
      const r = await sendServerTest({});
      if (r.sent > 0) {
        setTestMsg(
          `Sent ✓ — local ${localOk ? "shown" : "blocked"}, server push to ${r.sent} device${r.sent === 1 ? "" : "s"}. If nothing appeared, the OS is hiding it (see below).`,
        );
      } else {
        setTestMsg(`Server push didn't send: ${r.error ?? "unknown"}. ${localOk ? "Local test was shown." : ""}`);
      }
    } catch (e) {
      setTestMsg(
        `Server test failed: ${(e as Error).message}.${localOk ? " Local test was shown." : " Local test also failed."}`,
      );
    }
  }

  const on = support === "supported" && permission === "granted" && subscribed;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
              on ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground",
            )}
          >
            {on ? <Bell className="h-5 w-5" /> : <BellOff className="h-5 w-5" />}
          </div>
          <div>
            <p className="font-medium">Desktop notifications</p>
            <p className="text-sm text-muted-foreground">
              {support === "unsupported"
                ? "Not supported in this browser."
                : permission === "denied"
                  ? "Blocked in your browser settings — re-enable there to use."
                  : on
                    ? `On — this browser${status && status.devices > 1 ? ` (+${status.devices - 1} other)` : ""}.`
                    : "Get a popup when a task starts or ends — even when bishOS is closed (browser running)."}
            </p>
          </div>
        </div>

        {support === "supported" && permission !== "denied" && (
          <button
            onClick={() => (on ? disable() : enable())}
            disabled={busy}
            className={cn(
              "relative h-6 w-11 shrink-0 rounded-full transition disabled:opacity-50",
              on ? "bg-primary" : "bg-muted",
            )}
            aria-pressed={on}
          >
            <span
              className={cn(
                "absolute top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-white transition-all",
                on ? "left-[1.375rem]" : "left-0.5",
              )}
            >
              {busy && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
            </span>
          </button>
        )}
      </div>

      {on && (
        <div className="flex flex-col gap-2">
          {/* Custom bishOS sound */}
          <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/20 px-3 py-2">
            <div className="flex items-center gap-2 text-sm">
              {soundOn ? <Volume2 className="h-4 w-4 text-primary" /> : <VolumeX className="h-4 w-4 text-muted-foreground" />}
              <span>bishOS chime</span>
              <button
                onClick={() => {
                  unlockChime();
                  void playChime();
                }}
                className="flex items-center gap-1 rounded-md border border-border px-2 py-0.5 text-[11px] text-muted-foreground hover:text-foreground"
              >
                <Play className="h-3 w-3" /> Preview
              </button>
            </div>
            <button
              onClick={() => {
                const next = !soundOn;
                setSoundOn(next);
                setChimeEnabled(next);
                if (next) {
                  unlockChime();
                  void playChime();
                }
              }}
              className={cn(
                "relative h-5 w-9 shrink-0 rounded-full transition",
                soundOn ? "bg-primary" : "bg-muted",
              )}
              aria-pressed={soundOn}
            >
              <span
                className={cn(
                  "absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all",
                  soundOn ? "left-[1.125rem]" : "left-0.5",
                )}
              />
            </button>
          </div>

          <button
            onClick={() => void sendTest()}
            className="flex w-fit items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <Send className="h-3.5 w-3.5" /> Send a test notification
          </button>
          {testMsg && <p className="text-xs text-muted-foreground">{testMsg}</p>}
          <p className="text-[11px] leading-relaxed text-muted-foreground/80">
            The bishOS chime plays when a bishOS tab is open; when it&apos;s fully closed, Windows&apos; own
            notification sound is used. Not seeing the popup? On Windows, open{" "}
            <span className="text-foreground">Settings → System → Notifications</span>, make sure notifications are on
            for your browser and <span className="text-foreground">Do not disturb / Focus</span> is off.
          </p>
        </div>
      )}
      {error && <p className="text-xs text-warning">{error}</p>}
    </div>
  );
}
