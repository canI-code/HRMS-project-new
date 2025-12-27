import * as fc from 'fast-check';
import { Types } from 'mongoose';
import { UserRole, Status } from '@/shared/types/common';
export declare const objectIdArbitrary: () => fc.Arbitrary<Types.ObjectId>;
export declare const emailArbitrary: () => fc.Arbitrary<string>;
export declare const phoneArbitrary: () => fc.Arbitrary<string>;
export declare const passwordArbitrary: () => fc.Arbitrary<string>;
export declare const userRoleArbitrary: () => fc.Arbitrary<UserRole>;
export declare const statusArbitrary: () => fc.Arbitrary<Status>;
export declare const pastDateArbitrary: () => fc.Arbitrary<Date>;
export declare const futureDateArbitrary: () => fc.Arbitrary<Date>;
export declare const dateRangeArbitrary: () => fc.Arbitrary<{
    start: Date;
    end: Date;
}>;
export declare const userArbitrary: () => fc.Arbitrary<{
    _id: Types.ObjectId;
    organizationId: Types.ObjectId;
    email: string;
    role: UserRole;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}>;
export declare const personalInfoArbitrary: () => fc.Arbitrary<{
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
}>;
export declare const professionalInfoArbitrary: () => fc.Arbitrary<{
    designation: string;
    department: string;
    joiningDate: Date;
    employmentType: string;
    workLocation: string;
}>;
export declare const employeeArbitrary: () => fc.Arbitrary<{
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
        secondaryManagerId: Types.ObjectId | null;
        hrPartnerId: Types.ObjectId | null;
    };
    status: string;
    createdAt: Date;
    updatedAt: Date;
}>;
export declare const attendanceRecordArbitrary: () => fc.Arbitrary<{
    _id: Types.ObjectId;
    organizationId: Types.ObjectId;
    employeeId: Types.ObjectId;
    date: Date;
    checkIn: Date;
    checkOut: Date | null;
    breakDuration: number;
    totalHours: number;
    overtimeHours: number;
    status: string;
    createdAt: Date;
    updatedAt: Date;
}>;
export declare const leaveRequestArbitrary: () => fc.Arbitrary<{
    _id: Types.ObjectId;
    organizationId: Types.ObjectId;
    employeeId: Types.ObjectId;
    leaveTypeId: Types.ObjectId;
    startDate: Date;
    endDate: Date;
    totalDays: number;
    reason: string;
    status: string;
    createdAt: Date;
    updatedAt: Date;
}>;
export declare const salaryStructureArbitrary: () => fc.Arbitrary<{
    _id: Types.ObjectId;
    organizationId: Types.ObjectId;
    employeeId: Types.ObjectId;
    effectiveFrom: Date;
    effectiveTo: Date | null;
    basicSalary: number;
    allowances: {
        type: string;
        amount: number;
        isPercentage: boolean;
    }[];
    deductions: {
        type: string;
        amount: number;
        isPercentage: boolean;
    }[];
    grossSalary: number;
    createdAt: Date;
    updatedAt: Date;
}>;
export declare const nonEmptyStringArbitrary: (maxLength?: number) => fc.Arbitrary<string>;
export declare const validEmailArbitrary: () => fc.Arbitrary<string>;
export declare const invalidEmailArbitrary: () => fc.Arbitrary<string>;
//# sourceMappingURL=generators.d.ts.map