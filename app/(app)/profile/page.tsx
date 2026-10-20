"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Camera, Check, Loader2, Sparkles } from "lucide-react";
import { Topbar, Card } from "@/components/ui";
import { DesktopNotifications } from "@/components/push/DesktopNotifications";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/lib/variants";
import { toast, errorMessage } from "@/components/os/celebrate";

type Fields = {
  name: string; city: string; occupation: string; business: string;
  situation: string; about: string; preferences: string;
};
const EMPTY: Fields = { name: "", city: "", occupation: "", business: "", situation: "", about: "", preferences: "" };

export default function ProfilePage() {
  const profile = useQuery(api.profile.get);
  const upsert = useMutation(api.profile.upsert);
  const setAvatar = useMutation(api.profile.setAvatar);
  const genUploadUrl = useMutation(api.files.generateUploadUrl);

  const [f, setF] = useState<Fields>(EMPTY);
  const [seeded, setSeeded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (profile && !seeded) {
      setF({
        name: profile.name ?? "", city: profile.city ?? "", occupation: profile.occupation ?? "",
        business: profile.business ?? "", situation: profile.situation ?? "",
        about: profile.about ?? "", preferences: profile.preferences ?? "",
      });
      setSeeded(true);
    }
    if (profile === null && !seeded) setSeeded(true);
  }, [profile, seeded]);

  const set = (k: keyof Fields) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setF((p) => ({ ...p, [k]: e.target.value }));

  async function save() {
    // Never save before the stored profile has loaded — that would overwrite it with blanks.
    if (!seeded) return;
    setSaving(true);
    try {
      await upsert(f);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      toast(errorMessage(err, "Couldn't save your profile"), { tone: "warning" });
    } finally {
      setSaving(false);
    }
  }

  async function onPickAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast("Pick an image file", { tone: "warning" });
      if (fileRef.current) fileRef.current.value = "";
      return;
    }
    setUploading(true);
    try {
      const url = await genUploadUrl();
      const res = await fetch(url, { method: "POST", headers: { "Content-Type": file.type }, body: file });
      if (!res.ok) throw new Error("Upload failed — try a smaller image.");
      const { storageId } = await res.json();
      await setAvatar({ avatarId: storageId });
      toast("Photo updated", { tone: "success" });
    } catch (err) {
      toast(errorMessage(err, "Couldn't update your photo"), { tone: "warning" });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  const initials = (f.name || "B").trim().slice(0, 1).toUpperCase();
  const inp = "w-full rounded-md border border-input bg-card shadow-xs px-3 py-2.5 text-sm outline-none focus:border-ring focus:ring-[3px] focus:ring-ring/30";

  return (
    <div>
      <Topbar />
      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <h1 className="text-2xl font-semibold tracking-tight">Profile</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Tell bishOS who you are. Your AI chat reads this to address you by name and tailor every answer to your life and business.
        </p>

        {!seeded ? (
          <div className="mt-6 space-y-4" aria-busy="true" aria-label="Loading profile">
            <div className="skeleton h-[118px] rounded-xl" />
            <div className="skeleton h-[196px] rounded-xl" />
            <div className="skeleton h-[420px] rounded-xl" />
          </div>
        ) : (
        <>
        {/* Avatar + identity */}
        <Card className="mt-6 flex flex-col items-center gap-4 sm:flex-row sm:items-center">
          <div className="relative">
            <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-xl bg-primary/15 text-2xl font-semibold text-primary">
              {profile?.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profile.avatarUrl} alt="avatar" className="h-full w-full object-cover" />
              ) : (
                initials
              )}
            </div>
            <button
              onClick={() => fileRef.current?.click()}
              className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-xs hover:bg-primary/90"
              title="Change photo"
            >
              {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
            </button>
            <input ref={fileRef} type="file" accept="image/*" onChange={onPickAvatar} className="hidden" />
          </div>
          <div className="flex-1 text-center sm:text-left">
            <p className="font-semibold">{f.name || "Your name"}</p>
            <p className="text-sm text-muted-foreground">
              {[f.occupation, f.city].filter(Boolean).join(" · ") || "Add your role and city below"}
            </p>
          </div>
        </Card>

        {/* Identity fields */}
        <Card className="mt-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Labeled label="Name"><input value={f.name} onChange={set("name")} placeholder="e.g. Bish" className={inp} /></Labeled>
            <Labeled label="City"><input value={f.city} onChange={set("city")} placeholder="e.g. Dubai" className={inp} /></Labeled>
            <Labeled label="What you do"><input value={f.occupation} onChange={set("occupation")} placeholder="e.g. UI/UX designer & founder" className={inp} /></Labeled>
            <Labeled label="Business"><input value={f.business} onChange={set("business")} placeholder="e.g. Devzelo Solutions" className={inp} /></Labeled>
          </div>
          <Labeled label="Current situation" className="mt-3">
            <input value={f.situation} onChange={set("situation")} placeholder="e.g. Scaling my agency while learning to code" className={inp} />
          </Labeled>
        </Card>

        {/* About + preferences */}
        <Card className="mt-4">
          <Labeled label="About you" hint="Write freely — multiple paragraphs. Background, goals, what drives you, context the AI should always know.">
            <textarea value={f.about} onChange={set("about")} rows={8}
              placeholder="I'm a designer and entrepreneur based in…&#10;&#10;My main focus right now is…&#10;&#10;What matters to me is…"
              className={cn(inp, "resize-y leading-6")} />
          </Labeled>
          <Labeled label="Preferences & needs" hint="How should the AI help you? Tone, what to focus on, what to avoid." className="mt-3">
            <textarea value={f.preferences} onChange={set("preferences")} rows={4}
              placeholder="Be direct and practical. Push me on deadlines. Tie advice back to my business goals…"
              className={cn(inp, "resize-y leading-6")} />
          </Labeled>

          <div className="mt-4 flex items-center gap-3">
            <button onClick={() => void save()} disabled={saving}
              className={buttonVariants({ size: "lg" })}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <Check className="h-4 w-4" /> : null}
              {saving ? "Saving…" : saved ? "Saved" : "Save profile"}
            </button>
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5 text-primary" /> Your AI chat updates instantly with this.
            </span>
          </div>
        </Card>
        </>
        )}

        {/* Notifications */}
        <Card className="mt-4">
          <DesktopNotifications />
        </Card>
      </div>
    </div>
  );
}

function Labeled({ label, hint, className, children }: { label: string; hint?: string; className?: string; children: React.ReactNode }) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      {hint && <span className="mb-1.5 block text-xs text-muted-foreground/80">{hint}</span>}
      {children}
    </label>
  );
}
