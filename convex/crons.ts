import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Deliver desktop notifications for task start/end times every minute.
crons.interval(
  "desktop task notifications",
  { minutes: 1 },
  internal.pushSend.sendDue,
  {},
);

export default crons;
