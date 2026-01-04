"use client";

import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/lib/auth/context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { payrollApi } from "@/lib/payroll/api";
import { employeeApi } from "@/lib/employees/api";
import { leaveApi } from "@/lib/leave/api";
import { attendanceApi } from "@/lib/attendance/api";
import { DepartmentReport } from "@/lib/payroll/types";
import { Clock, Briefcase } from "lucide-react";

export default function AdminDashboard() {
    const { state } = useAuth();
    const tokens = state.tokens;
    const user = state.user;

    const [stats, setStats] = useState({
        employees: 0,
        pendingLeaves: 0,
        totalSalaryDisbursed: 0,
        workingDays: 0
    });

    const [myStats, setMyStats] = useState({
        leaveBalance: 0,
        attendanceStatus: "Not Checked In",
        lastSalary: 0,
        checkInTime: "--:--",
        checkOutTime: "--:--",
        totalHours: "--"
    });

    const [weeklyData, setWeeklyData] = useState<number[]>([0, 0, 0, 0, 0, 0, 0]);
    const [departmentStats, setDepartmentStats] = useState<DepartmentReport[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    // Calculate working days in current month
    const workingDays = useMemo(() => {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        let days = 0;
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            const wd = d.getDay();
            if (wd !== 0 && wd !== 6) days++;
        }
        return days;
    }, []);

    useEffect(() => {
        const load = async () => {
            if (!tokens) return;
            setLoading(true);
            try {
                const todayStr = new Date().toISOString().split('T')[0];

                // Resolve employeeId (admins may still have employee profile)
                let employeeId: string | null = null;
                try {
                    const me = await employeeApi.me(tokens);
                    employeeId = me._id;
                } catch (e) {
                    console.warn("Could not resolve employee profile for attendance", e);
                }

                // Parallel fetching of dashboard data
                const [
                    payrollSummary,
                    deptReport,
                    employeesRes,
                    leavesRes,
                    // Personal Stats
                    myLeaves,
                    myAttendance,
                    myPayslips
                ] = await Promise.allSettled([
                    payrollApi.getPayrollSummary(tokens, {}),
                    payrollApi.getDepartmentReport(tokens, {}),
                    employeeApi.list({ page: 1, limit: 1 }, tokens),
                    leaveApi.listLeaves({ status: "pending", showAll: true }, tokens),
                    leaveApi.getBalances(tokens),
                    employeeId ? attendanceApi.getByDate(employeeId, todayStr, tokens) : Promise.reject("NO_EMPLOYEE_ID"),
                    payrollApi.listMyPayslips(tokens)
                ]);

                // --- Org Stats Processing ---
                let totalEmployees = 0;
                let pendingLeaves = 0;
                let totalSalary = 0;

                if (employeesRes.status === "fulfilled") {
                    const res = employeesRes.value;
                    totalEmployees = (res as any)?.total ?? (res as any)?.meta?.total ?? (res as any)?.count ?? 0;
                }

                if (leavesRes.status === "fulfilled") {
                    pendingLeaves = leavesRes.value.length;
                }

                if (payrollSummary.status === "fulfilled") {
                    totalSalary = payrollSummary.value.totalNet;
                }

                if (deptReport.status === "fulfilled") {
                    setDepartmentStats(deptReport.value);
                }

                setStats({
                    employees: totalEmployees,
                    pendingLeaves,
                    totalSalaryDisbursed: totalSalary,
                    workingDays
                });

                // --- Personal Stats Processing ---
                let personalLeaveBalance = 0;
                let personalStatus = "Not Checked In";
                let personalCheckIn = "--:--";
                let personalCheckOut = "--:--";
                let personalLastSalary = 0;
                let personalTotalHours = "--";

                if (myLeaves.status === "fulfilled") {
                    personalLeaveBalance = myLeaves.value.reduce((acc, curr) => acc + curr.available, 0);
                }

                if (myAttendance.status === "fulfilled" && myAttendance.value) {
                    const record = myAttendance.value;
                    if (record.checkIn) {
                        personalStatus = record.checkOut ? "Checked Out" : "Checked In";
                        personalCheckIn = new Date(record.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                        if (record.checkOut) {
                            personalCheckOut = new Date(record.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                            const hours = ((new Date(record.checkOut).getTime() - new Date(record.checkIn).getTime()) / (1000 * 60 * 60)).toFixed(1);
                            personalTotalHours = hours;
                        }
                    }
                }

                if (myPayslips.status === "fulfilled" && myPayslips.value.length > 0) {
                    personalLastSalary = myPayslips.value[0].netRounded;
                }

                setMyStats({
                    leaveBalance: personalLeaveBalance,
                    attendanceStatus: personalStatus,
                    checkInTime: personalCheckIn,
                    checkOutTime: personalCheckOut,
                    lastSalary: personalLastSalary,
                    totalHours: personalTotalHours
                });

                // Fetch weekly attendance for the chart
                if (employeeId) {
                    const monday = new Date();
                    const dayOfWeek = monday.getDay();
                    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
                    monday.setDate(monday.getDate() + diff);
                    monday.setHours(0, 0, 0, 0);

                    const hours: number[] = [];
                    for (let i = 0; i < 7; i++) {
                        const date = new Date(monday);
                        date.setDate(date.getDate() + i);
                        const dateStr = date.toISOString().split('T')[0];
                        try {
                            const record = await attendanceApi.getByDate(employeeId, dateStr, tokens);
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
                }

            } catch (e) {
                console.error("Dashboard fetch error", e);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [tokens, workingDays, user?.id]);

    const formatCurrency = (val: number) => new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
    }).format(val / 100);

    const statCards = [
        { label: "Total Employees", value: stats.employees, subtext: "Active Staff", color: "text-blue-600" },
        { label: "Pending Leaves", value: stats.pendingLeaves, subtext: "Action Required", color: "text-amber-600" },
        { label: "Total Salary Disbursed", value: formatCurrency(stats.totalSalaryDisbursed), subtext: "All Time", color: "text-green-600" },
        { label: "Working Days", value: stats.workingDays, subtext: "This Month", color: "text-zinc-600" },
    ];

    return (
        <div className="space-y-8 animate-fade-in">
            {/* My Personal Overview Section */}
            <div>
                <h2 className="text-lg font-semibold mb-4 text-zinc-800">My Personal Overview</h2>
                <div className="grid gap-4 md:grid-cols-2">
                    {/* Today's Attendance */}
                    <Card className="bg-gradient-to-br from-white to-blue-50/50 border-blue-100">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-blue-700">Today's Attendance</CardTitle>
                            <Clock className="h-4 w-4 text-blue-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-zinc-800">{myStats.attendanceStatus}</div>
                            <div className="flex justify-between text-xs text-blue-600/80 mt-2">
                                <span>In: {myStats.checkInTime}</span>
                                <span>Out: {myStats.checkOutTime}</span>
                            </div>
                            {myStats.totalHours !== "--" && (
                                <p className="text-xs text-green-600 mt-1">{myStats.totalHours} Hrs Working</p>
                            )}
                        </CardContent>
                    </Card>

                    {/* My Leave Balance */}
                    <Card className="bg-gradient-to-br from-white to-purple-50/50 border-purple-100">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-purple-700">My Leave Balance</CardTitle>
                            <Briefcase className="h-4 w-4 text-purple-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-zinc-800">{myStats.leaveBalance} <span className="text-sm font-normal text-muted-foreground">Days</span></div>
                            <p className="text-xs text-purple-600/80 mt-1">Available Annual Leave</p>
                        </CardContent>
                    </Card>
                </div>
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

            {/* Organization Overview Section */}
            <div>
                <h2 className="text-lg font-semibold mb-4 text-zinc-800">Organization Overview</h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {statCards.map((stat, i) => (
                        <Card key={i} className="hover:shadow-md transition-shadow">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">{stat.label}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
                                <p className="text-xs text-muted-foreground">{stat.subtext}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Department Distribution */}
                <Card>
                    <CardHeader>
                        <CardTitle>Employee Distribution</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {departmentStats.length === 0 ? (
                            <div className="flex items-center justify-center h-40 text-muted-foreground">
                                No department data available
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {departmentStats.map((dept) => {
                                    const percentage = stats.employees > 0 ? Math.round((dept.employeeCount / stats.employees) * 100) : 0;
                                    return (
                                        <div key={dept.department} className="space-y-1">
                                            <div className="flex justify-between text-sm">
                                                <span className="font-medium">{dept.department}</span>
                                                <span className="text-muted-foreground">{dept.employeeCount} Staff ({percentage}%)</span>
                                            </div>
                                            <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                                                <div
                                                    className="h-full rounded-full bg-blue-500"
                                                    style={{ width: `${percentage}%` }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Salary Spend by Department */}
                <Card>
                    <CardHeader>
                        <CardTitle>Salary Spend by Department</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {departmentStats.length === 0 ? (
                            <div className="flex items-center justify-center h-40 text-muted-foreground">
                                No payroll data available
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {departmentStats.map((dept) => (
                                    <div key={dept.department} className="flex items-center justify-between border-b border-zinc-100 last:border-0 pb-2 last:pb-0">
                                        <div className="flex flex-col">
                                            <span className="font-medium text-sm">{dept.department}</span>
                                            <span className="text-xs text-muted-foreground">Avg: {formatCurrency(dept.averageNet)}</span>
                                        </div>
                                        <div className="font-semibold text-sm">
                                            {formatCurrency(dept.totalNet)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
