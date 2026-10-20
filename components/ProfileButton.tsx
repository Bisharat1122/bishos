"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "convex/react";
import { Check, Monitor, Moon, Sun, UserCircle } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { useTheme, type ThemePreference } from "./theme";
import { cn } from "@/lib/utils";

const THEMES: { value: ThemePreference; label: string; icon: typeof Sun }[] = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
];

const item = "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm outline-none hover:bg-accent hover:text-accent-foreground focus-visible:bg-accent";

/** Topbar avatar — profile photo or initials; opens the profile & theme menu. */
export function ProfileButton() {
  const profile = useQuery(api.profile.get);
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useTheme();
  const initials = (profile?.name || "B").trim().slice(0, 1).toUpperCase();

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Open profile menu"
        aria-expanded={open}
        className="flex size-8 items-center justify-center overflow-hidden rounded-full bg-primary text-xs font-semibold text-primary-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {profile?.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={profile.avatarUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          initials
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div role="menu" className="absolute right-0 z-50 mt-2 w-60 rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-raised">
            {profile?.name && (
              <>
                <p className="truncate px-2 py-1.5 text-sm font-medium">{profile.name}</p>
                <div className="-mx-1 my-1 h-px bg-border" />
              </>
            )}
            <Link href="/profile" role="menuitem" onClick={() => setOpen(false)} className={item}>
              <UserCircle className="h-4 w-4 text-muted-foreground" /> Profile
            </Link>
            <div className="-mx-1 my-1 h-px bg-border" />
            <p className="px-2 py-1.5 text-xs font-medium text-muted-foreground">Theme</p>
            {THEMES.map((t) => (
              <button
                key={t.value}
                role="menuitemradio"
                aria-checked={theme === t.value}
                onClick={() => setTheme(t.value)}
                className={item}
              >
                <t.icon className="h-4 w-4 text-muted-foreground" />
                <span className="flex-1">{t.label}</span>
                <Check className={cn("h-4 w-4", theme === t.value ? "opacity-100" : "opacity-0")} />
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
