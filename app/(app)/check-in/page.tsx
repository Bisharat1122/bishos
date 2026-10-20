import { redirect } from "next/navigation";

/** The daily check-in now lives in the morning start-up ritual on Today. */
export default function CheckInPage() {
  redirect("/today");
}
