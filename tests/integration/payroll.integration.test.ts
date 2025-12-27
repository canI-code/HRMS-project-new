import request from 'supertest';
import { Types } from 'mongoose';
import { app } from '../../src/server';
import { generateAccessToken } from '../../src/shared/utils/jwt';
import { UserRole } from '../../src/shared/types/common';
import { payrollService } from '../../src/domains/payroll/services/PayrollService';
import { auditLogStore } from '../../src/shared/middleware/auditLogger';

jest.mock('../../src/domains/payroll/services/PayrollService');

describe('Integration: Payroll endpoints', () => {
  const orgId = new Types.ObjectId();
  const userId = new Types.ObjectId();
  const accessToken = generateAccessToken({
    userId,
    organizationId: orgId,
    userRole: UserRole.HR_ADMIN,
  });

  beforeEach(() => {
    jest.clearAllMocks();
    auditLogStore.clear();
  });

  test('should create salary structure', async () => {
    const mockStructure = { _id: new Types.ObjectId(), version: 1, name: 'Base', components: [] };
    (payrollService.createSalaryStructure as jest.Mock).mockResolvedValue(mockStructure);

    const res = await request(app)
      .post('/api/payroll/structures')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'Base', components: [{ name: 'Basic', code: 'BASIC', type: 'earning', calculationType: 'fixed', value: 100000 }] });

    expect(res.status).toBe(201);
    expect(payrollService.createSalaryStructure).toHaveBeenCalled();
  });

  test('should start payroll run and lock on completion', async () => {
    const run = {
      _id: new Types.ObjectId(),
      status: 'completed',
      locked: true,
      structureVersion: 2,
    };
    (payrollService.startPayrollRun as jest.Mock).mockResolvedValue(run);

    const res = await request(app)
      .post('/api/payroll/runs')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        periodStart: '2024-01-01',
        periodEnd: '2024-01-31',
        employees: [{ employeeId: new Types.ObjectId().toString(), baseSalaryMinor: 120000 }],
      });

    expect(res.status).toBe(201);
    expect(res.body.locked).toBe(true);
    expect(payrollService.startPayrollRun).toHaveBeenCalled();
  });
});
