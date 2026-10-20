"use client";

import { useState } from "react";
import { useAuthActions } from "@convex-dev/auth/react";
import { useRouter } from "next/navigation";
import { ConvexError } from "convex/values";
import { Logo } from "@/components/ui";
import { buttonVariants, inputClass } from "@/lib/variants";
import { cn } from "@/lib/utils";

export default function SignInPage() {
  const { signIn } = useAuthActions();
  const router = useRouter();
  const [step, setStep] = useState<"signIn" | "signUp">("signIn");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm rounded-xl border border-border bg-card p-8 shadow-card">
        <Logo className="mb-6" />
        <h1 className="text-xl font-semibold tracking-tight">
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
              router.push("/today");
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
            className={cn(inputClass, "h-9 w-full")}
          />
          <input
            name="password"
            type="password"
            required
            minLength={step === "signUp" ? 6 : undefined}
            placeholder="Password"
            className={cn(inputClass, "h-9 w-full")}
          />
          {step === "signUp" && (
            <p className="text-xs text-muted-foreground">At least 6 characters.</p>
          )}
          {error && <p role="alert" className="rounded-md bg-danger-soft px-3 py-2 text-sm text-danger">{error}</p>}
          <button
            disabled={loading}
            className={cn(buttonVariants(), "w-full")}
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
