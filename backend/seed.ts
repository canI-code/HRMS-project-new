import { connectDatabase, disconnectDatabase } from '@/config/database';
import { User } from '@/domains/auth/models/User';
import { Organization } from '@/domains/auth/models/Organization';
import { EmployeeModel } from '@/domains/employees/models/Employee';
import { logger } from '@/shared/utils/logger';
import bcrypt from 'bcryptjs';

async function seedDatabase() {
  try {
    await connectDatabase();
    logger.info('Connected to database');

    // Clear existing data
    await User.deleteMany({});
    await Organization.deleteMany({});
    await EmployeeModel.deleteMany({});
    logger.info('Cleared existing data');

    // Create organization
    const organization = await Organization.create({
      name: 'Test Organization',
      displayName: 'Test Organization',
      domain: 'testorg', // lowercase, no dots
      industry: 'Technology',
      size: 'enterprise',
      country: 'US', // ISO 3166-1 alpha-2 code
      timezone: 'UTC',
      currency: 'USD',
      fiscalYearStart: 1,
      contactInfo: {
        email: 'contact@testorg.com',
        phone: '+1-555-0000',
        website: 'https://testorg.com',
      },
      subscription: {
        plan: 'enterprise',
        status: 'active',
        startDate: new Date(),
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
        maxEmployees: 1000,
        maxUsers: 500,
      },
      settings: {
        workWeek: {
          monday: true,
          tuesday: true,
          wednesday: true,
          thursday: true,
          friday: true,
          saturday: false,
          sunday: false,
        },
        workingHours: {
          start: '09:00',
          end: '17:00',
        },
        leavePolicies: {
          allowNegativeBalance: false,
          requireManagerApproval: true,
          autoApprovalThreshold: 1,
          carryForwardLimit: 5,
        },
        attendancePolicies: {
          lateArrivalGracePeriod: 5,
          earlyDepartureGracePeriod: 5,
          overtimeEnabled: true,
          overtimeMultiplier: 1.5,
        },
        payrollSettings: {
          payrollCycle: 'monthly',
          payrollDay: 25,
          taxCalculationEnabled: true,
        },
        securitySettings: {
          passwordMinLength: 8,
          passwordRequireUppercase: true,
          passwordRequireLowercase: true,
          passwordRequireNumbers: true,
          passwordRequireSpecialChars: true,
          passwordExpiryDays: 90,
          mfaRequired: false,
          sessionTimeoutMinutes: 30,
          ipWhitelist: [],
        },
      },
      isActive: true,
      activatedAt: new Date(),
    });
    logger.info('Organization created', { organizationId: organization._id });

    // Create admin user
    const hashedPassword = await bcrypt.hash('Admin123!', 12);
    const adminUser = await User.create({
      organizationId: organization._id,
      email: 'admin@example.com',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: 'hr_admin',
      isActive: true,
      mfaEnabled: false,
      failedLoginAttempts: 0,
    });
    logger.info('Admin user created', { userId: adminUser._id, email: adminUser.email });

    // Create manager user
    const managerPassword = await bcrypt.hash('Manager123!', 12);
    const managerUser = await User.create({
      organizationId: organization._id,
      email: 'manager@example.com',
      password: managerPassword,
      firstName: 'Manager',
      lastName: 'User',
      role: 'manager',
      isActive: true,
      mfaEnabled: false,
      failedLoginAttempts: 0,
    });
    logger.info('Manager user created', { userId: managerUser._id, email: managerUser.email });

    // Create employee user
    const employeePassword = await bcrypt.hash('Employee123!', 12);
    const employeeUser = await User.create({
      organizationId: organization._id,
      email: 'employee@example.com',
      password: employeePassword,
      firstName: 'John',
      lastName: 'Doe',
      role: 'employee',
      isActive: true,
      mfaEnabled: false,
      failedLoginAttempts: 0,
    });
    logger.info('Employee user created', { userId: employeeUser._id, email: employeeUser.email });

    // Create admin employee profile
    const adminEmployee = await EmployeeModel.create({
      organizationId: organization._id,
      userId: adminUser._id,
      employeeCode: 'EMP001',
      personal: {
        firstName: 'Admin',
        lastName: 'User',
        contact: {
          email: 'admin@example.com',
          phone: '+1234567890',
        },
        addresses: {
          current: {
            line1: '123 Test Street',
            city: 'Test City',
            country: 'Test Country',
          },
        },
      },
      professional: {
        department: 'Human Resources',
        title: 'HR Administrator',
        employmentType: 'full_time',
        startDate: new Date(),
        status: 'active',
      },
    });
    logger.info('Admin employee created', { employeeId: adminEmployee._id });

    // Create manager employee profile
    const managerEmployee = await EmployeeModel.create({
      organizationId: organization._id,
      userId: managerUser._id,
      employeeCode: 'EMP002',
      personal: {
        firstName: 'Manager',
        lastName: 'User',
        contact: {
          email: 'manager@example.com',
          phone: '+1234567891',
        },
        addresses: {
          current: {
            line1: '456 Test Avenue',
            city: 'Test City',
            country: 'Test Country',
          },
        },
      },
      professional: {
        department: 'Engineering',
        title: 'Project Manager',
        employmentType: 'full_time',
        startDate: new Date(),
        status: 'active',
        managerId: adminEmployee._id,
      },
    });
    logger.info('Manager employee created', { employeeId: managerEmployee._id });

    // Create regular employee profile
    const regularEmployee = await EmployeeModel.create({
      organizationId: organization._id,
      userId: employeeUser._id,
      employeeCode: 'EMP003',
      personal: {
        firstName: 'John',
        lastName: 'Doe',
        contact: {
          email: 'employee@example.com',
          phone: '+1234567892',
        },
        addresses: {
          current: {
            line1: '789 Test Boulevard',
            city: 'Test City',
            country: 'Test Country',
          },
        },
      },
      professional: {
        department: 'Engineering',
        title: 'Software Engineer',
        employmentType: 'full_time',
        startDate: new Date(),
        status: 'active',
        managerId: managerEmployee._id,
      },
    });
    logger.info('Employee created', { employeeId: regularEmployee._id });

    logger.info('✅ Database seeded successfully');
    logger.info('📝 You can now login with:');
    logger.info('   Email: admin@example.com, Password: Admin123!');
    logger.info('   Email: manager@example.com, Password: Manager123!');
    logger.info('   Email: employee@example.com, Password: Employee123!');
  } catch (error) {
    logger.error('Seed failed', error);
    process.exit(1);
  } finally {
    await disconnectDatabase();
  }
}

seedDatabase();
