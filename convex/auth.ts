import { Password } from "@convex-dev/auth/providers/Password";
import { convexAuth } from "@convex-dev/auth/server";
import { ConvexError } from "convex/values";

/**
 * Single-user, private auth. Password provider — register once with your own
 * email/password, then sign in. The sign-up flow is exposed in the UI so you
 * can create your account on first run.
 *
 * `validatePasswordRequirements` throws a ConvexError (whose message DOES reach
 * the browser) so account-creation failures show a clear reason instead of a
 * generic error.
 */
const password = Password({
  validatePasswordRequirements: (pwd: string) => {
    if (!pwd || pwd.length < 6) {
      throw new ConvexError("Password must be at least 6 characters.");
    }
  },
});

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [password],
});
