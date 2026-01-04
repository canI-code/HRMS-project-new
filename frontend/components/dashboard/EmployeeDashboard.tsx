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

        fetchToday();
        fetchBalance();
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
            <div className="grid gap-4 md:grid-cols-3">
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

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Next Holiday</CardTitle>
                        <CalendarCheck className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">New Year</div>
                        <p className="text-xs text-muted-foreground">Jan 1, 2026</p>
                    </CardContent>
                </Card>
            </div>

            {/* Visual Chart for Weekly Attendance (Mocked) */}
            <Card>
                <CardHeader>
                    <CardTitle>Weekly Attendance</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="h-40 flex items-end justify-between gap-2 px-4">
                        {[8.5, 9.0, 8.2, 8.8, 4.0].map((h, i) => (
                            <div key={i} className="flex flex-col items-center gap-2 w-full">
                                <div className="w-full bg-primary/20 rounded-t-sm relative group h-full flex items-end">
                                    <div className="w-full bg-primary rounded-t-sm transition-all hover:bg-primary/80" style={{ height: `${(h / 10) * 100}%` }}></div>
                                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                        {h} hours
                                    </div>
                                </div>
                                <span className="text-xs text-muted-foreground">{['M', 'T', 'W', 'T', 'F'][i]}</span>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
