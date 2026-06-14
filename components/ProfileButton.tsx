"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

/** Topbar avatar — shows the profile photo or initials, links to the profile page. */
export function ProfileButton() {
  const profile = useQuery(api.profile.get);
  const initials = (profile?.name || "B").trim().slice(0, 1).toUpperCase();
  return (
    <Link
      href="/profile"
      title="Your profile"
      className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-warning text-sm font-semibold text-background transition hover:opacity-90"
    >
      {profile?.avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={profile.avatarUrl} alt="" className="h-full w-full object-cover" />
      ) : (
        initials
      )}
    </Link>
  );
}
