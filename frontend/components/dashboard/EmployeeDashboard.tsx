"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth/context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { attendanceApi } from "@/lib/attendance/api";
import { Loader2, Clock, CalendarCheck, Briefcase } from "lucide-react";
import { AttendanceRecord } from "@/lib/attendance/types";

import { leaveApi } from "@/lib/leave/api";
import { employeeApi } from "@/lib/employees/api";

export default function EmployeeDashboard() {
    const { state } = useAuth();
    const tokens = state.tokens;
    const user = state.user;

    const [todayRecord, setTodayRecord] = useState<AttendanceRecord | null>(null);
    const [employeeId, setEmployeeId] = useState<string | null>(null);
    const [leaveBalance, setLeaveBalance] = useState<number>(0);
    const [loading, setLoading] = useState(true);
    const [weeklyData, setWeeklyData] = useState<number[]>([]);

    useEffect(() => {
        const fetchEmployeeId = async () => {
            if (!tokens) return null;
            try {
                const me = await employeeApi.me(tokens);
                setEmployeeId(me._id);
                return me._id;
            } catch (e) {
                console.error("Failed to fetch employee profile", e);
                return null;
            }
        };

        const fetchToday = async () => {
            if (!tokens) return;
            setLoading(true);
            try {
                const id = employeeId || await fetchEmployeeId();
                if (!id) return;
                const dateStr = new Date().toISOString().split('T')[0];
                const record = await attendanceApi.getByDate(id, dateStr, tokens);
                setTodayRecord(record);
            } catch (e) {
                console.log("No attendance record for today or error", e);
            } finally {
                setLoading(false);
            }
        };

        const fetchBalance = async () => {
            if (!tokens) return;
            try {
                const balances = await leaveApi.getBalances(tokens);
                // Sum up all available leaves or just show Annual/Earned?
                // Usually dashboard shows total available leave days.
                const total = balances.reduce((acc, curr) => acc + curr.available, 0);
                setLeaveBalance(total);
            } catch (e) {
                console.error("Failed to fetch leave balances", e);
            }
        };

        const fetchWeeklyAttendance = async () => {
            if (!tokens) return;
            try {
                const id = employeeId;
                if (!id) return;
                
                // Get the current week (Monday to Sunday)
                const today = new Date();
                const firstDay = today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1); // Adjust for Sunday
                const monday = new Date(today.setDate(firstDay));
                
                // Fetch this week's attendance
                const hours: number[] = [];
                for (let i = 0; i < 7; i++) {
                    const date = new Date(monday);
                    date.setDate(date.getDate() + i);
                    const dateStr = date.toISOString().split('T')[0];
                    try {
                        const record = await attendanceApi.getByDate(id, dateStr, tokens);
                        if (record && record.workingMinutes) {
                            hours.push(record.workingMinutes / 60);
                        } else {
                            hours.push(0);
                        }
                    } catch (e) {
                        hours.push(0);
                    }
                }
                setWeeklyData(hours);
            } catch (e) {
                console.error("Failed to fetch weekly attendance", e);
                setWeeklyData([0, 0, 0, 0, 0, 0, 0]);
            }
        };

        fetchToday();
        fetchBalance();
        fetchWeeklyAttendance();
    }, [tokens, employeeId]);

    const checkInTime = todayRecord?.checkIn
        ? new Date(todayRecord.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : "--:--";

    const checkOutTime = todayRecord?.checkOut
        ? new Date(todayRecord.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : "--:--";

    const totalHours = todayRecord?.checkIn && todayRecord?.checkOut
        ? ((new Date(todayRecord.checkOut).getTime() - new Date(todayRecord.checkIn).getTime()) / (1000 * 60 * 60)).toFixed(1)
        : "--";


    return (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Today's Attendance</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{todayRecord ? (todayRecord.checkOut ? "Checked Out" : "Checked In") : "Not Started"}</div>
                        <div className="flex justify-between text-xs text-muted-foreground mt-2">
                            <span>In: {checkInTime}</span>
                            <span>Out: {checkOutTime}</span>
                        </div>
                        {totalHours !== "--" && (
                            <p className="text-xs text-green-600 mt-1">{totalHours} Hrs Working</p>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Leave Balance</CardTitle>
                        <Briefcase className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{leaveBalance} Days</div>
                        <p className="text-xs text-muted-foreground">Total Available Leave</p>
                    </CardContent>
                </Card>
            </div>

            {/* Weekly Attendance Chart */}
            <Card>
                <CardHeader>
                    <CardTitle>Weekly Attendance</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">Your working hours for this week</p>
                </CardHeader>
                <CardContent>
                    <div className="h-56 flex items-end justify-between gap-3 px-4">
                        {weeklyData.map((h, i) => {
                            const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
                            const maxHeight = Math.max(...weeklyData, 8); // At least 8 hours for scale
                            const heightPercent = maxHeight > 0 ? (h / maxHeight) * 100 : 0;
                            
                            return (
                                <div key={i} className="flex flex-col items-center gap-3 flex-1">
                                    <div className="w-full bg-gray-100 rounded-t-lg relative group h-48 flex items-end">
                                        <div 
                                            className={`w-full rounded-t-lg transition-all ${
                                                h > 0 ? 'bg-primary hover:bg-primary/80' : 'bg-gray-200'
                                            }`} 
                                            style={{ height: `${heightPercent}%` }}
                                        >
                                            {h > 0 && (
                                                <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap font-medium">
                                                    {h.toFixed(1)}h
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-xs font-medium text-foreground">{dayLabels[i]}</p>
                                        <p className="text-xs text-muted-foreground">{h > 0 ? `${h.toFixed(1)}h` : '-'}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
