"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../../lib/auth/context";
import { leaveApi } from "../../lib/leave/api";
import type { LeaveRecord } from "../../lib/leave/types";

export function LeaveCalendar() {
  const { state } = useAuth();
  const [leaves, setLeaves] = useState<LeaveRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  useEffect(() => {
    if (state.tokens) {
      fetchLeaves();
    }
  }, [state.tokens, currentDate]);

  const fetchLeaves = async () => {
    if (!state.tokens) return;
    try {
      setLoading(true);
      const data = await leaveApi.listLeaves({ status: "approved" }, state.tokens);
      setLeaves(data || []);
    } catch (err: any) {
      setError(err.message || "Failed to fetch leaves");
    } finally {
      setLoading(false);
    }
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay();

  const previousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
    setSelectedDay(null);
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
    setSelectedDay(null);
  };

  const getLeavesForDay = (day: number) => {
    const date = new Date(year, month, day);
    date.setHours(0, 0, 0, 0);
    return leaves.filter((leave) => {
      const start = new Date(leave.startDate);
      const end = new Date(leave.endDate);
      start.setHours(0, 0, 0, 0);
      end.setHours(0, 0, 0, 0);
      return date >= start && date <= end;
    });
  };

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  if (loading) return <div className="loading loading-spinner"></div>;
  if (error) return <div className="alert alert-error">{error}</div>;

  const calendarDays = [];
  for (let i = 0; i < startingDayOfWeek; i++) {
    calendarDays.push(<div key={`empty-${i}`} className="p-3 border border-gray-200 bg-gray-50"></div>);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const dayLeaves = getLeavesForDay(day);
    const hasLeave = dayLeaves.length > 0;

    calendarDays.push(
      <div
        key={day}
        onClick={() => setSelectedDay(day)}
        className={`p-3 border border-gray-200 min-h-[100px] cursor-pointer hover:bg-gray-50 ${hasLeave ? "bg-blue-50" : ""
          } ${selectedDay === day ? "ring-2 ring-blue-500" : ""}`}
      >
        <div className="font-semibold text-sm mb-2">{day}</div>
        {dayLeaves.length > 0 && (
          <div className="text-xs text-blue-700 font-medium">
            {dayLeaves.length} {dayLeaves.length === 1 ? "person" : "people"} on leave
          </div>
        )}
      </div>
    );
  }

  const selectedDayLeaves = selectedDay ? getLeavesForDay(selectedDay) : [];

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <button onClick={previousMonth} className="btn btn-sm btn-outline">
            ← Previous
          </button>
          <h2 className="text-xl font-semibold">
            {monthNames[month]} {year}
          </h2>
          <button onClick={nextMonth} className="btn btn-sm btn-outline">
            Next →
          </button>
        </div>

        <div className="grid grid-cols-7 gap-0 mb-6">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div key={day} className="p-3 font-semibold text-center bg-gray-100 border border-gray-300 text-gray-700">
              {day}
            </div>
          ))}
          {calendarDays}
        </div>

        <div className="flex items-center gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <span className="inline-block w-4 h-4 bg-blue-50 border border-gray-300"></span>
            <span>Days with approved leave</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block w-4 h-4 ring-2 ring-blue-500 border border-gray-300"></span>
            <span>Selected day</span>
          </div>
        </div>
      </div>

      {selectedDay && selectedDayLeaves.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">
            Employees on Leave - {monthNames[month]} {selectedDay}, {year}
          </h3>
          <div className="space-y-3">
            {selectedDayLeaves.map((leave) => (
              <div key={leave._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-medium">
                    {leave.employeeId ? (
                      <>
                        {leave.employeeId.firstName} {leave.employeeId.lastName}
                        <span className="ml-2 text-xs text-gray-500 bg-gray-200 px-2 py-0.5 rounded">
                          {leave.employeeId.employeeCode || 'No ID'}
                        </span>
                      </>
                    ) : 'Unknown Employee'}
                  </div>
                  {leave.employeeId?.professional?.title && (
                    <div className="text-sm text-gray-600">{leave.employeeId.professional.title}</div>
                  )}
                  {leave.reason && (
                    <div className="text-xs text-gray-500 mt-1 italic">"{leave.reason}"</div>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium capitalize">{leave.leaveType}</div>
                  <div className="text-xs text-gray-600">
                    {new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
