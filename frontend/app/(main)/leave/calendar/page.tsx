"use client";

import { LeaveCalendar } from "@/components/leave/LeaveCalendar";

export default function LeaveCalendarPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Leave Calendar</h1>
        <p className="text-muted-foreground">View team leave schedule.</p>
      </div>
      <LeaveCalendar />
    </div>
  );
}
