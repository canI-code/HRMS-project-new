import * as fc from 'fast-check';
import { Types } from 'mongoose';
import { UserRole, Status } from '@/shared/types/common';

// Basic generators
export const objectIdArbitrary = (): fc.Arbitrary<Types.ObjectId> =>
  fc.hexaString({ minLength: 24, maxLength: 24 }).map(hex => new Types.ObjectId(hex));

export const emailArbitrary = (): fc.Arbitrary<string> =>
  fc.tuple(
    fc.stringOf(fc.char().filter(c => /[a-zA-Z0-9]/.test(c)), { minLength: 1, maxLength: 20 }),
    fc.constantFrom('gmail.com', 'yahoo.com', 'outlook.com', 'company.com')
  ).map(([local, domain]) => `${local}@${domain}`);

export const phoneArbitrary = (): fc.Arbitrary<string> =>
  fc.tuple(
    fc.constantFrom('+1', '+44', '+91', '+86'),
    fc.stringOf(fc.char().filter(c => /[0-9]/.test(c)), { minLength: 10, maxLength: 10 })
  ).map(([code, number]) => `${code}${number}`);

export const passwordArbitrary = (): fc.Arbitrary<string> =>
  fc.stringOf(
    fc.char().filter(c => /[a-zA-Z0-9!@#$%^&*]/.test(c)),
    { minLength: 8, maxLength: 50 }
  );

export const userRoleArbitrary = (): fc.Arbitrary<UserRole> =>
  fc.constantFrom(...Object.values(UserRole));

export const statusArbitrary = (): fc.Arbitrary<Status> =>
  fc.constantFrom(...Object.values(Status));

// Date generators
export const pastDateArbitrary = (): fc.Arbitrary<Date> =>
  fc.date({ max: new Date() });

export const futureDateArbitrary = (): fc.Arbitrary<Date> =>
  fc.date({ min: new Date() });

export const dateRangeArbitrary = (): fc.Arbitrary<{ start: Date; end: Date }> =>
  fc.tuple(pastDateArbitrary(), futureDateArbitrary())
    .filter(([start, end]) => start < end)
    .map(([start, end]) => ({ start, end }));

// User generators
export const userArbitrary = () =>
  fc.record({
    _id: objectIdArbitrary(),
    organizationId: objectIdArbitrary(),
    email: emailArbitrary(),
    role: userRoleArbitrary(),
    isActive: fc.boolean(),
    createdAt: pastDateArbitrary(),
    updatedAt: pastDateArbitrary(),
  });

// Employee generators
export const personalInfoArbitrary = () =>
  fc.record({
    firstName: fc.string({ minLength: 1, maxLength: 50 }),
    lastName: fc.string({ minLength: 1, maxLength: 50 }),
    email: emailArbitrary(),
    phone: phoneArbitrary(),
    dateOfBirth: pastDateArbitrary(),
    address: fc.record({
      street: fc.string({ minLength: 1, maxLength: 100 }),
      city: fc.string({ minLength: 1, maxLength: 50 }),
      state: fc.string({ minLength: 1, maxLength: 50 }),
      zipCode: fc.string({ minLength: 5, maxLength: 10 }),
      country: fc.string({ minLength: 1, maxLength: 50 }),
    }),
  });

export const professionalInfoArbitrary = () =>
  fc.record({
    designation: fc.string({ minLength: 1, maxLength: 100 }),
    department: fc.string({ minLength: 1, maxLength: 50 }),
    joiningDate: pastDateArbitrary(),
    employmentType: fc.constantFrom('full-time', 'part-time', 'contract', 'intern'),
    workLocation: fc.constantFrom('office', 'remote', 'hybrid'),
  });

export const employeeArbitrary = () =>
  fc.record({
    _id: objectIdArbitrary(),
    organizationId: objectIdArbitrary(),
    employeeId: fc.string({ minLength: 3, maxLength: 20 }),
    userId: objectIdArbitrary(),
    personalInfo: personalInfoArbitrary(),
    professionalInfo: professionalInfoArbitrary(),
    reportingStructure: fc.record({
      managerId: objectIdArbitrary(),
      secondaryManagerId: fc.option(objectIdArbitrary()),
      hrPartnerId: fc.option(objectIdArbitrary()),
    }),
    status: fc.constantFrom('active', 'inactive', 'terminated'),
    createdAt: pastDateArbitrary(),
    updatedAt: pastDateArbitrary(),
  });

// Attendance generators
export const attendanceRecordArbitrary = () =>
  fc.record({
    _id: objectIdArbitrary(),
    organizationId: objectIdArbitrary(),
    employeeId: objectIdArbitrary(),
    date: pastDateArbitrary(),
    checkIn: pastDateArbitrary(),
    checkOut: fc.option(futureDateArbitrary()),
    breakDuration: fc.integer({ min: 0, max: 120 }), // minutes
    totalHours: fc.float({ min: 0, max: 24, noNaN: true }),
    overtimeHours: fc.float({ min: 0, max: 8, noNaN: true }),
    status: fc.constantFrom('present', 'absent', 'late', 'half-day'),
    createdAt: pastDateArbitrary(),
    updatedAt: pastDateArbitrary(),
  });

// Leave generators
export const leaveRequestArbitrary = () =>
  fc.record({
    _id: objectIdArbitrary(),
    organizationId: objectIdArbitrary(),
    employeeId: objectIdArbitrary(),
    leaveTypeId: objectIdArbitrary(),
    startDate: futureDateArbitrary(),
    endDate: futureDateArbitrary(),
    totalDays: fc.integer({ min: 1, max: 30 }),
    reason: fc.string({ minLength: 10, maxLength: 500 }),
    status: fc.constantFrom('pending', 'approved', 'rejected', 'cancelled'),
    createdAt: pastDateArbitrary(),
    updatedAt: pastDateArbitrary(),
  });

// Payroll generators
export const salaryStructureArbitrary = () =>
  fc.record({
    _id: objectIdArbitrary(),
    organizationId: objectIdArbitrary(),
    employeeId: objectIdArbitrary(),
    effectiveFrom: pastDateArbitrary(),
    effectiveTo: fc.option(futureDateArbitrary()),
    basicSalary: fc.float({ min: 1000, max: 100000, noNaN: true }),
    allowances: fc.array(
      fc.record({
        type: fc.string({ minLength: 1, maxLength: 50 }),
        amount: fc.float({ min: 0, max: 10000, noNaN: true }),
        isPercentage: fc.boolean(),
      }),
      { maxLength: 10 }
    ),
    deductions: fc.array(
      fc.record({
        type: fc.string({ minLength: 1, maxLength: 50 }),
        amount: fc.float({ min: 0, max: 5000, noNaN: true }),
        isPercentage: fc.boolean(),
      }),
      { maxLength: 10 }
    ),
    grossSalary: fc.float({ min: 1000, max: 150000, noNaN: true }),
    createdAt: pastDateArbitrary(),
    updatedAt: pastDateArbitrary(),
  });

// Validation helpers
export const nonEmptyStringArbitrary = (maxLength = 100): fc.Arbitrary<string> =>
  fc.string({ minLength: 1, maxLength });

export const validEmailArbitrary = (): fc.Arbitrary<string> =>
  emailArbitrary();

export const invalidEmailArbitrary = (): fc.Arbitrary<string> =>
  fc.oneof(
    fc.string().filter(s => !s.includes('@')),
    fc.string().filter(s => s.includes('@') && !s.includes('.')),
    fc.constant(''),
    fc.constant('@'),
    fc.constant('test@'),
    fc.constant('@test.com')
  );