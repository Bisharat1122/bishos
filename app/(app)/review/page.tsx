import { redirect } from "next/navigation";

/** The old weekly review moved to the Reviews hub. */
export default function ReviewRedirect() {
  redirect("/reviews");
}
