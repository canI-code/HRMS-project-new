"use client";

import { LeaveCalendar } from "../../../components/leave/LeaveCalendar";

export default function LeaveCalendarPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-6">Leave Calendar</h1>
      <LeaveCalendar />
    </div>
  );
}
