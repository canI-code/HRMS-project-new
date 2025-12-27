import request from 'supertest';
import { Types } from 'mongoose';
import { app } from '@/server';
import { generateAccessToken } from '@/shared/utils/jwt';
import { UserRole } from '@/shared/types/common';
import { auditLogStore } from '@/shared/middleware/auditLogger';
import { EmployeeModel } from '@/domains/employees/models/Employee';

/**
 * Integration Smoke Test
 * Verifies: authenticated HR admin can create an employee and an audit log is written.
 */
describe('Integration: Employee creation audit logging', () => {
  const orgId = new Types.ObjectId();
  const userId = new Types.ObjectId();
  const accessToken = generateAccessToken({
    userId,
    organizationId: orgId,
    userRole: UserRole.HR_ADMIN,
  });

  beforeEach(() => {
    auditLogStore.clear();
    jest.spyOn(EmployeeModel, 'findOne').mockResolvedValue(null as any);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    auditLogStore.clear();
  });

  it('should allow HR admin to create employee and log audit entry', async () => {
    const fakeEmployeeId = new Types.ObjectId();

    // Mock creation to avoid DB dependency
    jest.spyOn(EmployeeModel, 'create').mockResolvedValue({
      _id: fakeEmployeeId,
      organizationId: orgId,
      employeeCode: 'EMP123',
      personal: { firstName: 'Jane', lastName: 'Doe', contact: { email: 'jane.doe@example.com' } },
      professional: { department: 'Engineering', title: 'Developer', employmentType: 'full_time', startDate: new Date() },
      documents: [],
      payroll: {},
    } as any);

    const res = await request(app)
      .post('/api/employees')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        organizationId: orgId.toString(),
        employeeCode: 'EMP123',
        personal: { firstName: 'Jane', lastName: 'Doe', contact: { email: 'jane.doe@example.com' } },
        professional: { department: 'Engineering', title: 'Developer', employmentType: 'full_time', startDate: new Date().toISOString() },
      });

    expect(res.status).toBe(201);
    expect(res.body?.success).toBe(true);

    const logs = auditLogStore.getByResource('employees', fakeEmployeeId);
    expect(logs.length).toBeGreaterThan(0);
    expect(logs[0]!.action).toBe('CREATE');
  });
});
