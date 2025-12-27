import { Types } from 'mongoose';
import { UserRole } from '@/shared/types/common';

export const testOrganizationId = new Types.ObjectId();
export const testUserId = new Types.ObjectId();
export const testEmployeeId = new Types.ObjectId();

export const testOrganization = {
  _id: testOrganizationId,
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

export const testUser = {
  _id: testUserId,
  organizationId: testOrganizationId,
  email: 'test@test.com',
  passwordHash: '$2b$12$hashedpassword',
  roles: [UserRole.EMPLOYEE],
  isActive: true,
  mfaEnabled: false,
  createdAt: new Date(),
  updatedAt: new Date(),
};

export const testEmployee = {
  _id: testEmployeeId,
  organizationId: testOrganizationId,
  employeeId: 'EMP001',
  userId: testUserId,
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
    managerId: new Types.ObjectId(),
  },
  status: 'active',
  createdAt: new Date(),
  updatedAt: new Date(),
};

export const testAttendanceRecord = {
  _id: new Types.ObjectId(),
  organizationId: testOrganizationId,
  employeeId: testEmployeeId,
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

export const testLeaveRequest = {
  _id: new Types.ObjectId(),
  organizationId: testOrganizationId,
  employeeId: testEmployeeId,
  leaveTypeId: new Types.ObjectId(),
  startDate: new Date(),
  endDate: new Date(),
  totalDays: 1,
  reason: 'Personal work',
  status: 'pending',
  approvalWorkflow: [],
  createdAt: new Date(),
  updatedAt: new Date(),
};