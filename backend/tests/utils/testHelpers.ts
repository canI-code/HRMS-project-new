import { Types } from 'mongoose';
import jwt from 'jsonwebtoken';
import { config } from '@/config/environment';
import { UserRole } from '@/shared/types/common';

export interface TestUser {
  _id: Types.ObjectId;
  email: string;
  role: UserRole;
  organizationId: Types.ObjectId;
}

export const createTestUser = (overrides: Partial<TestUser> = {}): TestUser => {
  return {
    _id: new Types.ObjectId(),
    email: 'test@example.com',
    role: UserRole.EMPLOYEE,
    organizationId: new Types.ObjectId(),
    ...overrides,
  };
};

export const createTestToken = (user: TestUser): string => {
  return jwt.sign(
    {
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      organizationId: user.organizationId.toString(),
    },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn }
  );
};

export const createTestOrganization = () => {
  return {
    _id: new Types.ObjectId(),
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
};

export const createTestEmployee = (organizationId: Types.ObjectId, overrides: Record<string, unknown> = {}) => {
  return {
    _id: new Types.ObjectId(),
    organizationId,
    employeeId: 'EMP001',
    userId: new Types.ObjectId(),
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
    ...overrides,
  };
};

export const delay = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

export const expectValidationError = (error: unknown, field?: string): void => {
  expect(error).toHaveProperty('name', 'ValidationError');
  if (field) {
    expect(error).toHaveProperty('errors');
    expect((error as any).errors).toHaveProperty(field);
  }
};