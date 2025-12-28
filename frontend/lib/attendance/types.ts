export type AttendanceStatus = "present" | "absent" | "late" | "half-day" | "on-leave";

export interface AttendanceRecord {
  _id: string;
  employeeId: string;
  organizationId: string;
  date: string; // ISO date
  checkIn?: string; // ISO datetime
  checkOut?: string; // ISO datetime
  workingMinutes?: number;
  breakMinutes?: number;
  overtimeMinutes?: number;
  status: AttendanceStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MonthlyAttendanceSummary {
  totalDays: number;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  halfDays: number;
  totalWorkingMinutes: number;
  totalOvertimeMinutes: number;
}

export interface MonthlyAttendanceResponse {
  records: AttendanceRecord[];
  summary: MonthlyAttendanceSummary;
}

export interface AttendancePolicy {
  _id: string;
  organizationId: string;
  name: string;
  standardWorkingMinutes: number;
  halfDayThresholdMinutes: number;
  lateArrivalGraceMinutes: number;
  lateArrivalThresholdMinutes: number;
  overtimeStartsAfterMinutes: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type UpsertPolicyPayload = Partial<Omit<AttendancePolicy, "_id" | "organizationId" | "isActive" | "createdAt" | "updatedAt">> & {
  name: string;
  standardWorkingMinutes: number;
  halfDayThresholdMinutes: number;
  lateArrivalGraceMinutes: number;
  lateArrivalThresholdMinutes: number;
  overtimeStartsAfterMinutes: number;
};
