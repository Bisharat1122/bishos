import {
  convexAuthNextjsMiddleware,
  createRouteMatcher,
  nextjsMiddlewareRedirect,
} from "@convex-dev/auth/nextjs/server";

const isSignInPage = createRouteMatcher(["/signin"]);

/**
 * Speed: decide "signed in?" locally from the JWT's expiry instead of
 * `convexAuth.isAuthenticated()`, which made an HTTP round-trip to Convex on
 * EVERY navigation and prefetch. This only drives the redirect UX — Convex
 * still verifies the token's signature on every query and mutation, and the
 * pages are client shells that hold no data. Near-expiry tokens are refreshed
 * by the wrapper below before this handler runs.
 */
function hasLiveToken(token: string | undefined): boolean {
  if (!token) return false;
  try {
    const part = token.split(".")[1]!.replace(/-/g, "+").replace(/_/g, "/");
    const { exp } = JSON.parse(atob(part)) as { exp?: number };
    return typeof exp === "number" && exp * 1000 > Date.now();
  } catch {
    return false;
  }
}

export default convexAuthNextjsMiddleware(async (request, { convexAuth }) => {
  const authed = hasLiveToken(await convexAuth.getToken());
  if (isSignInPage(request) && authed) {
    return nextjsMiddlewareRedirect(request, "/today");
  }
  if (!isSignInPage(request) && !authed) {
    return nextjsMiddlewareRedirect(request, "/signin");
  }
});

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
