import { Types } from 'mongoose';
import { UserRole } from '@/shared/types/common';
export declare const testOrganizationId: Types.ObjectId;
export declare const testUserId: Types.ObjectId;
export declare const testEmployeeId: Types.ObjectId;
export declare const testOrganization: {
    _id: Types.ObjectId;
    name: string;
    domain: string;
    settings: {
        timezone: string;
        dateFormat: string;
        currency: string;
        workingDays: number[];
        workingHours: {
            start: string;
            end: string;
        };
    };
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
};
export declare const testUser: {
    _id: Types.ObjectId;
    organizationId: Types.ObjectId;
    email: string;
    passwordHash: string;
    roles: UserRole[];
    isActive: boolean;
    mfaEnabled: boolean;
    createdAt: Date;
    updatedAt: Date;
};
export declare const testEmployee: {
    _id: Types.ObjectId;
    organizationId: Types.ObjectId;
    employeeId: string;
    userId: Types.ObjectId;
    personalInfo: {
        firstName: string;
        lastName: string;
        email: string;
        phone: string;
        dateOfBirth: Date;
        address: {
            street: string;
            city: string;
            state: string;
            zipCode: string;
            country: string;
        };
    };
    professionalInfo: {
        designation: string;
        department: string;
        joiningDate: Date;
        employmentType: string;
        workLocation: string;
    };
    reportingStructure: {
        managerId: Types.ObjectId;
    };
    status: string;
    createdAt: Date;
    updatedAt: Date;
};
export declare const testAttendanceRecord: {
    _id: Types.ObjectId;
    organizationId: Types.ObjectId;
    employeeId: Types.ObjectId;
    date: Date;
    checkIn: Date;
    checkOut: Date;
    breakDuration: number;
    totalHours: number;
    overtimeHours: number;
    status: string;
    createdAt: Date;
    updatedAt: Date;
};
export declare const testLeaveRequest: {
    _id: Types.ObjectId;
    organizationId: Types.ObjectId;
    employeeId: Types.ObjectId;
    leaveTypeId: Types.ObjectId;
    startDate: Date;
    endDate: Date;
    totalDays: number;
    reason: string;
    status: string;
    approvalWorkflow: never[];
    createdAt: Date;
    updatedAt: Date;
};
//# sourceMappingURL=index.d.ts.map