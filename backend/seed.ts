import { connectDatabase, disconnectDatabase } from '@/config/database';
import { User } from '@/domains/auth/models/User';
import { Organization } from '@/domains/auth/models/Organization';
import { EmployeeModel } from '@/domains/employees/models/Employee';
import { DocumentModel } from '@/domains/documents/models/Document';
import { LeaveModel } from '@/domains/leave/models/Leave';
import { LeavePolicyModel } from '@/domains/leave/models/LeavePolicy';
import { AttendanceModel } from '@/domains/attendance/models/Attendance';
import { AttendancePolicyModel } from '@/domains/attendance/models/AttendancePolicy';
import { NotificationTemplateModel, NotificationPreferenceModel, NotificationLogModel } from '@/domains/notifications/models/Notification';
import { PayrollRunModel } from '@/domains/payroll/models/PayrollRun';
import { PayslipModel } from '@/domains/payroll/models/Payslip';
import { SalaryStructureModel } from '@/domains/payroll/models/SalaryStructure';
import { EmployeeSalaryModel } from '@/domains/payroll/models/EmployeeSalary';
import { PerformanceGoalModel } from '@/domains/performance/models/PerformanceGoal';
import { PerformanceReviewModel } from '@/domains/performance/models/PerformanceReview';
import { logger } from '@/shared/utils/logger';
import { UserRole } from '@/shared/types/common';
import bcrypt from 'bcryptjs';

async function seedDatabase() {
  try {
    await connectDatabase();
    logger.info('Connected to database');

    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      Organization.deleteMany({}),
      EmployeeModel.deleteMany({}),
      DocumentModel.deleteMany({}),
      LeaveModel.deleteMany({}),
      LeavePolicyModel.deleteMany({}),
      AttendanceModel.deleteMany({}),
      AttendancePolicyModel.deleteMany({}),
      NotificationTemplateModel.deleteMany({}),
      NotificationPreferenceModel.deleteMany({}),
      NotificationLogModel.deleteMany({}),
      PayrollRunModel.deleteMany({}),
      PayslipModel.deleteMany({}),
      SalaryStructureModel.deleteMany({}),
      EmployeeSalaryModel.deleteMany({}),
      PerformanceGoalModel.deleteMany({}),
      PerformanceReviewModel.deleteMany({}),
    ]);
    logger.info('Cleared existing data from all models');

    // Create organization
    const organization = await Organization.create({
      name: 'NexusHR Enterprise',
      displayName: 'NexusHR Enterprise',
      domain: 'nexushr',
      industry: 'Technology',
      size: 'enterprise',
      country: 'IN',
      timezone: 'Asia/Kolkata',
      currency: 'INR',
      fiscalYearStart: 4, // April
      contactInfo: {
        email: 'contact@nexushr.com',
        phone: '+91 7219510168',
        website: 'https://nexushr.com',
      },
      subscription: {
        plan: 'enterprise',
        status: 'active',
        startDate: new Date(),
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
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
          end: '18:00',
        },
        leavePolicies: {
          allowNegativeBalance: false,
          requireManagerApproval: true,
          autoApprovalThreshold: 1,
          carryForwardLimit: 5,
        },
        attendancePolicies: {
          lateArrivalGracePeriod: 15,
          earlyDepartureGracePeriod: 15,
          overtimeEnabled: true,
          overtimeMultiplier: 1.5,
        },
        payrollSettings: {
          payrollCycle: 'monthly',
          payrollDay: 1,
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
          sessionTimeoutMinutes: 60,
          ipWhitelist: [],
        },
      },
      isActive: true,
      activatedAt: new Date(),
    });
    logger.info('Organization created', { organizationId: organization._id });

    // Create super admin user
    const hashedPassword = await bcrypt.hash('superadmin@123!', 12);
    const superAdminUser = await User.create({
      organizationId: organization._id,
      email: 'vipulmayekar25@gmail.com',
      password: hashedPassword,
      firstName: 'Vipul',
      lastName: 'Mayekar',
      role: UserRole.SUPER_ADMIN,
      isActive: true,
      mfaEnabled: false,
      failedLoginAttempts: 0,
    });
    logger.info('Super Admin user created', { userId: superAdminUser._id, email: superAdminUser.email });

    // Create super admin employee profile
    const superAdminEmployee = await EmployeeModel.create({
      organizationId: organization._id,
      userId: superAdminUser._id,
      employeeCode: 'ADMIN001',
      personal: {
        firstName: 'Vipul',
        lastName: 'Mayekar',
        contact: {
          email: 'vipulmayekar25@gmail.com',
          phone: '+91 7219510168',
        },
        addresses: {
          current: {
            line1: 'Corporate Office',
            city: 'Mumbai',
            country: 'India',
          },
        },
      },
      professional: {
        department: 'Executive Management',
        title: 'Super Administrator',
        employmentType: 'full_time',
        startDate: new Date(),
        status: 'active',
      },
    });
    logger.info('Super Admin employee profile created', { employeeId: superAdminEmployee._id });

    logger.info('✅ Database seeded successfully');
    logger.info('📝 You can now login with:');
    logger.info('   Email: vipulmayekar25@gmail.com, Password: superadmin@123!');
  } catch (error) {
    logger.error('Seed failed', error);
    process.exit(1);
  } finally {
    await disconnectDatabase();
  }
}

seedDatabase();
