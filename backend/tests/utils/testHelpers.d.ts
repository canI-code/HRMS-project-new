import { Types } from 'mongoose';
import { UserRole } from '@/shared/types/common';
export interface TestUser {
    _id: Types.ObjectId;
    email: string;
    role: UserRole;
    organizationId: Types.ObjectId;
}
export declare const createTestUser: (overrides?: Partial<TestUser>) => TestUser;
export declare const createTestToken: (user: TestUser) => string;
export declare const createTestOrganization: () => {
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
export declare const createTestEmployee: (organizationId: Types.ObjectId, overrides?: Record<string, unknown>) => {
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
export declare const delay: (ms: number) => Promise<void>;
export declare const expectValidationError: (error: unknown, field?: string) => void;
//# sourceMappingURL=testHelpers.d.ts.map