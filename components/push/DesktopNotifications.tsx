"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Bell, BellOff, Loader2 } from "lucide-react";
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

  const [support, setSupport] = useState<Support>("checking");
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [subscribed, setSubscribed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

      {error && <p className="text-xs text-warning">{error}</p>}
    </div>
  );
}
