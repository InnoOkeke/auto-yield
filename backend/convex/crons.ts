import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Daily Deduction: Run at midnight UTC
crons.daily(
    "daily-deduction",
    { hourUTC: 0, minuteUTC: 0 },
    internal.actions.processDailyDeductions
);

// Yield Snapshot: Run every 4 hours
crons.interval(
    "yield-snapshot",
    { hours: 4 },
    internal.actions.snapshotYield
);

// Health Check: Run every hour
crons.interval(
    "health-check",
    { hours: 1 },
    internal.actions.checkHealth
);

export default crons;
