"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "convex/react";
import { Clapperboard } from "lucide-react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { EmptyHint, PageShell, buttonVariants } from "@/components/os/kit";
import { PieceEditor } from "@/components/content/PieceEditor";

export default function ContentPiecePage() {
  const params = useParams<{ id: string }>();
  const id = params.id as Id<"contentPieces">;
  const piece = useQuery(api.content.get, { id });

  if (piece === undefined) {
    return (
      <PageShell title={<span className="skeleton inline-block h-7 w-64 align-middle" />} icon={Clapperboard}>
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-4">
            <div className="skeleton h-36" />
            <div className="skeleton h-32" />
            <div className="skeleton h-[460px]" />
          </div>
          <div className="space-y-4">
            <div className="skeleton h-72" />
            <div className="skeleton h-64" />
          </div>
        </div>
      </PageShell>
    );
  }

  if (piece === null) {
    return (
      <PageShell title="Piece not found" icon={Clapperboard}>
        <EmptyHint
          icon={Clapperboard}
          title="This piece doesn't exist anymore"
          hint="It may have been deleted. Your other pieces are safe in the Studio."
          action={
            <Link href="/content" className={buttonVariants({ size: "sm" })}>
              Back to Content Studio
            </Link>
          }
        />
      </PageShell>
    );
  }

  return <PieceEditor key={piece._id} piece={piece} />;
}
