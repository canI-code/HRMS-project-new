"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.testLeaveRequest = exports.testAttendanceRecord = exports.testEmployee = exports.testUser = exports.testOrganization = exports.testEmployeeId = exports.testUserId = exports.testOrganizationId = void 0;
const mongoose_1 = require("mongoose");
const common_1 = require("@/shared/types/common");
exports.testOrganizationId = new mongoose_1.Types.ObjectId();
exports.testUserId = new mongoose_1.Types.ObjectId();
exports.testEmployeeId = new mongoose_1.Types.ObjectId();
exports.testOrganization = {
    _id: exports.testOrganizationId,
    name: 'Test Organization',
    domain: 'test.com',
    settings: {
        timezone: 'UTC',
        dateFormat: 'YYYY-MM-DD',
        currency: 'USD',
        workingDays: [1, 2, 3, 4, 5],
        workingHours: { start: '09:00', end: '17:00' },
    },
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
};
exports.testUser = {
    _id: exports.testUserId,
    organizationId: exports.testOrganizationId,
    email: 'test@test.com',
    passwordHash: '$2b$12$hashedpassword',
    roles: [common_1.UserRole.EMPLOYEE],
    isActive: true,
    mfaEnabled: false,
    createdAt: new Date(),
    updatedAt: new Date(),
};
exports.testEmployee = {
    _id: exports.testEmployeeId,
    organizationId: exports.testOrganizationId,
    employeeId: 'EMP001',
    userId: exports.testUserId,
    personalInfo: {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@test.com',
        phone: '+1234567890',
        dateOfBirth: new Date('1990-01-01'),
        address: {
            street: '123 Test St',
            city: 'Test City',
            state: 'Test State',
            zipCode: '12345',
            country: 'Test Country',
        },
    },
    professionalInfo: {
        designation: 'Software Engineer',
        department: 'Engineering',
        joiningDate: new Date(),
        employmentType: 'full-time',
        workLocation: 'office',
    },
    reportingStructure: {
        managerId: new mongoose_1.Types.ObjectId(),
    },
    status: 'active',
    createdAt: new Date(),
    updatedAt: new Date(),
};
exports.testAttendanceRecord = {
    _id: new mongoose_1.Types.ObjectId(),
    organizationId: exports.testOrganizationId,
    employeeId: exports.testEmployeeId,
    date: new Date(),
    checkIn: new Date(),
    checkOut: new Date(),
    breakDuration: 60,
    totalHours: 8,
    overtimeHours: 0,
    status: 'present',
    createdAt: new Date(),
    updatedAt: new Date(),
};
exports.testLeaveRequest = {
    _id: new mongoose_1.Types.ObjectId(),
    organizationId: exports.testOrganizationId,
    employeeId: exports.testEmployeeId,
    leaveTypeId: new mongoose_1.Types.ObjectId(),
    startDate: new Date(),
    endDate: new Date(),
    totalDays: 1,
    reason: 'Personal work',
    status: 'pending',
    approvalWorkflow: [],
    createdAt: new Date(),
    updatedAt: new Date(),
};
//# sourceMappingURL=index.js.map