export type LeaveType = "casual" | "sick" | "earned" | "unpaid";
export type LeaveStatus = "pending" | "approved" | "rejected" | "cancelled";

export interface LeaveRecord {
  _id: string;
  organizationId: string;
  employeeId: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    employeeCode?: string;
    title?: string;
    designation?: string;
    professional?: {
      title?: string;
    };
  };
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  status: LeaveStatus;
  reason?: string;
  comments?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateLeavePayload {
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  reason?: string;
}

export interface ApproveLeavePayload {
  comments?: string;
}

export interface RejectLeavePayload {
  comments: string;
}

export interface CancelLeavePayload {
  reason?: string;
}

export interface LeaveListQuery {
  status?: LeaveStatus;
  employeeId?: string;
  leaveType?: LeaveType;
  showAll?: boolean;
}
