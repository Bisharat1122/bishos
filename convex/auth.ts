import { Password } from "@convex-dev/auth/providers/Password";
import { convexAuth } from "@convex-dev/auth/server";

/**
 * Single-user, private auth. Password provider — register once with your own
 * email/password, then sign in. No public sign-up flow is exposed in the UI.
 */
export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [Password],
});
