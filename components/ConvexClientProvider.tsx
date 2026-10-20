"use client";

import { ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import { ConvexProviderWithAuth, ConvexReactClient } from "convex/react";
// The client half of `ConvexAuthNextjsServerProvider` (not in the package's
// public exports). Using it directly keeps the root layout free of cookie
// reads, so every page is static and served from the CDN — no per-click
// server render.
import { ConvexAuthNextjsClientProvider, type ConvexAuthServerState } from "../node_modules/@convex-dev/auth/dist/nextjs/client.js";
import { useAuth } from "../node_modules/@convex-dev/auth/dist/react/client.js";

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL!;
const convex = new ConvexReactClient(CONVEX_URL);

// Same storage keys Convex Auth writes (`${key}_${namespace}`).
const NS = CONVEX_URL.replace(/[^a-zA-Z0-9]/g, "");
const JWT_KEY = `__convexAuthJWT_${NS}`;
const REFRESH_KEY = `__convexAuthRefreshToken_${NS}`;

/**
 * The token the auth library already keeps in localStorage, handed over as
 * "server state" so it is present on the very first client render — Convex
 * then authenticates before any page query subscribes (no unauthenticated
 * first pass). Refreshes still go through the /api/auth cookie proxy.
 */
function storedState(): ConvexAuthServerState {
  let token: string | null = null;
  try {
    token = typeof window === "undefined" ? null : window.localStorage.getItem(JWT_KEY);
  } catch {
    /* storage blocked — treated as signed out */
  }
  // `_timeFetched: 0` never overrides newer stored state; a null token is the
  // library's own "signed out" shape.
  return { _state: { token, refreshToken: token ? "dummy" : null }, _timeFetched: 0 };
}

/** Seconds left on a JWT (decoded locally; -1 if unreadable). */
function secondsLeft(token: string): number {
  try {
    const { exp } = JSON.parse(atob(token.split(".")[1]!.replace(/-/g, "+").replace(/_/g, "/"))) as { exp?: number };
    return typeof exp === "number" ? exp - Date.now() / 1000 : -1;
  } catch {
    return -1;
  }
}

/**
 * The library's auth hook, plus one fix: if the stored token has expired (app
 * reopened after an idle hour), refresh it BEFORE Convex authenticates, so the
 * first connection uses a good token instead of failing and backing off.
 */
function useFreshAuth() {
  const auth = useAuth();
  const { fetchAccessToken: fetchLib } = auth;
  const fetchAccessToken = useCallback(
    async ({ forceRefreshToken }: { forceRefreshToken: boolean }) => {
      const token = await fetchLib({ forceRefreshToken });
      if (!forceRefreshToken && token && secondsLeft(token) < 30) return fetchLib({ forceRefreshToken: true });
      return token;
    },
    [fetchLib],
  );
  return useMemo(() => ({ ...auth, fetchAccessToken }), [auth, fetchAccessToken]);
}

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState(storedState);
  const [gen, setGen] = useState(0);

  // Rare: signed-in cookie but no stored token (e.g. site storage cleared).
  // Mint a token through the cookie proxy once, then remount with it.
  useEffect(() => {
    if (state._state.token || window.location.pathname.startsWith("/signin")) return;
    let live = true;
    void fetch("/api/auth", { method: "POST", body: JSON.stringify({ action: "auth:signIn", args: { refreshToken: "dummy" } }) })
      .then((r) => r.json())
      .then((res: { tokens?: { token: string; refreshToken: string } | null }) => {
        if (!live || !res?.tokens?.token) return;
        window.localStorage.setItem(JWT_KEY, res.tokens.token);
        window.localStorage.setItem(REFRESH_KEY, "dummy");
        setState(storedState());
        setGen((g) => g + 1);
      })
      .catch(() => {});
    return () => {
      live = false;
    };
    // Only on first mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <ConvexAuthNextjsClientProvider key={gen} serverState={state}>
      <ConvexProviderWithAuth client={convex} useAuth={useFreshAuth}>
        {children}
      </ConvexProviderWithAuth>
    </ConvexAuthNextjsClientProvider>
  );
}
