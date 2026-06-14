import { Topbar } from "@/components/ui";

export function ComingSoon({
  title,
  phase,
  description,
}: {
  title: string;
  phase: string;
  description: string;
}) {
  return (
    <div>
      <Topbar />
      <div className="px-8 py-7">
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        <div className="mt-8 flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-24 text-center">
          <span className="rounded-full bg-primary/15 px-3 py-1 text-xs font-medium text-primary">
            {phase}
          </span>
          <p className="mt-3 font-medium">Coming soon</p>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            This module is scaffolded and on the roadmap. See implementation.md
            for the build plan.
          </p>
        </div>
      </div>
    </div>
  );
}
