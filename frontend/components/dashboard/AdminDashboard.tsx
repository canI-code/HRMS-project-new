"use client";

import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/lib/auth/context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { payrollApi } from "@/lib/payroll/api";
import { employeeApi } from "@/lib/employees/api";
import { leaveApi } from "@/lib/leave/api";
import { attendanceApi } from "@/lib/attendance/api";
import { DepartmentReport } from "@/lib/payroll/types";

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
        checkOutTime: "--:--"
    });

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
                    lastSalary: personalLastSalary
                });

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
                <div className="grid gap-4 md:grid-cols-3">
                    <Card className="bg-gradient-to-br from-white to-blue-50/50 border-blue-100">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-blue-700">My Leave Balance</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-zinc-800">{myStats.leaveBalance} <span className="text-sm font-normal text-muted-foreground">Days</span></div>
                            <p className="text-xs text-blue-600/80 mt-1">Available Annual Leave</p>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-white to-purple-50/50 border-purple-100">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-purple-700">My Attendance</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-zinc-800">{myStats.attendanceStatus}</div>
                            <div className="flex justify-between text-xs text-purple-600/80 mt-1">
                                <p>Check-in: {myStats.checkInTime}</p>
                                <p>Check-out: {myStats.checkOutTime}</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-white to-green-50/50 border-green-100">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-green-700">Last Salary</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-zinc-800">{formatCurrency(myStats.lastSalary)}</div>
                            <p className="text-xs text-green-600/80 mt-1">Net Pay (Last Month)</p>
                        </CardContent>
                    </Card>
                </div>
            </div>

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
