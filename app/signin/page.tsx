"use client";

import { useState } from "react";
import { useAuthActions } from "@convex-dev/auth/react";
import { useRouter } from "next/navigation";
import { ConvexError } from "convex/values";
import { Sparkles } from "lucide-react";

export default function SignInPage() {
  const { signIn } = useAuthActions();
  const router = useRouter();
  const [step, setStep] = useState<"signIn" | "signUp">("signIn");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  return (
    <div className="glow-grid flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-8">
        <div className="mb-6 flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Sparkles className="h-4 w-4" />
          </div>
          <span className="text-xl font-bold tracking-tight">bishOS</span>
        </div>
        <h1 className="text-lg font-semibold">
          {step === "signIn" ? "Welcome back" : "Create your account"}
        </h1>
        <p className="mb-6 mt-1 text-sm text-muted-foreground">
          Your lifelong second brain. Private and single-user.
        </p>

        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setError(null);
            setLoading(true);
            const formData = new FormData(e.currentTarget);
            formData.set("flow", step);
            try {
              await signIn("password", formData);
              router.push("/dashboard");
            } catch (err) {
              // Surface the real reason (ConvexError messages reach the client).
              const msg =
                err instanceof ConvexError
                  ? String(err.data)
                  : err instanceof Error && err.message && !/Server Error/i.test(err.message)
                    ? err.message
                    : "";
              setError(
                msg ||
                  (step === "signIn"
                    ? "Invalid email or password."
                    : "Could not create account. The email may already be registered."),
              );
            } finally {
              setLoading(false);
            }
          }}
          className="space-y-3"
        >
          <input
            name="email"
            type="email"
            required
            placeholder="Email"
            className="w-full rounded-lg border border-border bg-muted/30 px-4 py-2.5 text-sm outline-none focus:border-primary/60"
          />
          <input
            name="password"
            type="password"
            required
            minLength={step === "signUp" ? 6 : undefined}
            placeholder="Password"
            className="w-full rounded-lg border border-border bg-muted/30 px-4 py-2.5 text-sm outline-none focus:border-primary/60"
          />
          {step === "signUp" && (
            <p className="text-xs text-muted-foreground">At least 6 characters.</p>
          )}
          {error && <p className="text-sm text-warning">{error}</p>}
          <button
            disabled={loading}
            className="w-full rounded-lg bg-primary py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-50"
          >
            {loading ? "…" : step === "signIn" ? "Sign in" : "Create account"}
          </button>
        </form>

        <button
          onClick={() => setStep(step === "signIn" ? "signUp" : "signIn")}
          className="mt-4 w-full text-center text-xs text-muted-foreground hover:text-foreground"
        >
          {step === "signIn"
            ? "First time? Create your account"
            : "Already have an account? Sign in"}
        </button>
      </div>
    </div>
  );
}
