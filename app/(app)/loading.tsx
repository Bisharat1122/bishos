import { PageSkeleton } from "@/components/os/PageSkeleton";

/** Instant route-switch frame: shown only if a page isn't already prefetched. */
export default function Loading() {
  return <PageSkeleton />;
}
