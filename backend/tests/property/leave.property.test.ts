import fc from 'fast-check';
import { Types } from 'mongoose';
import { LeaveStatus, LeaveType } from '@/domains/leave/models/Leave';
import { LeaveService } from '@/domains/leave/services/LeaveService';
import { auditLogStore } from '@/shared/middleware/auditLogger';

// Configure DB-less behavior if flag is set; mimic in-memory via jest mocks
jest.mock('@/domains/leave/models/Leave', () => {
  const actual = jest.requireActual('@/domains/leave/models/Leave');
  const store: any[] = [];
  return {
    ...actual,
    LeaveModel: {
      create: jest.fn(async (doc: any) => {
        const _id = new Types.ObjectId();
        const created = { ...doc, _id };
        store.push(created);
        return created;
      }),
      findOne: jest.fn(async (q: any) => {
        return store.find((d) => {
          const org = !q.organizationId || d.organizationId.equals(q.organizationId);
          const emp = !q.employeeId || d.employeeId.equals(q.employeeId);
          const status = !q.status || d.status === q.status;
          const notDeleted = d.isDeleted !== true;
          // simple overlap logic
          const overlap = q.$or ? q.$or.some((c: any) => {
            const cond = c.startDate && c.endDate;
            if (!cond) return false;
            return (d.startDate <= c.endDate.$gte) && (d.endDate >= c.startDate.$lte);
          }) : true;
          return org && emp && status && notDeleted && overlap;
        }) || null;
      }),
      find: jest.fn(async (q: any) => {
        return store.filter((d) => {
          const org = !q.organizationId || d.organizationId.equals(q.organizationId);
          const emp = !q.employeeId || d.employeeId.equals(q.employeeId);
          const status = !q.status || d.status === q.status;
          return org && emp && status;
        });
      }),
      findOneAndUpdate: jest.fn(async (q: any, update: any) => {
        const idx = store.findIndex((d) => d._id.equals(q._id));
        if (idx === -1) return null;
        store[idx] = { ...store[idx], ...update.$set };
        return store[idx];
      }),
    },
  };
});

const ctx = {
  organizationId: new Types.ObjectId(),
  userId: new Types.ObjectId(),
  requestId: 'prop-test',
  ipAddress: '127.0.0.1',
  userAgent: 'jest',
} as any;

describe('Leave Property Tests', () => {
  beforeEach(() => {
    // clear audit logs
    auditLogStore.clear();
  });

  test('Property: endDate must be >= startDate and days computed inclusive', () => {
    return fc.assert(
      fc.asyncProperty(
        fc.date({ min: new Date('2000-01-01'), max: new Date('2030-12-31') }),
        fc.integer({ min: 0, max: 30 }),
        async (start, offset) => {
          const end = new Date(start.getTime() + offset * 24 * 60 * 60 * 1000);
          const leave = await LeaveService.requestLeave(ctx, {
            organizationId: ctx.organizationId,
            employeeId: new Types.ObjectId(),
            type: LeaveType.ANNUAL,
            startDate: start,
            endDate: end,
            reason: 'test',
          });
          expect(leave.days).toBe(Math.max(1, offset + 1));
        }
      ), { numRuns: 10 }
    );
  });

  test('Property: approving pending leave writes audit entry', async () => {
    const empId = new Types.ObjectId();
    const leave = await LeaveService.requestLeave(ctx, {
      organizationId: ctx.organizationId,
      employeeId: empId,
      type: LeaveType.SICK,
      startDate: new Date(),
      endDate: new Date(),
      reason: 'cold',
    });
    const updated = await LeaveService.approveLeave(ctx, leave._id);
    expect(updated.status).toBe(LeaveStatus.APPROVED);
    const logs = auditLogStore.getAll();
    expect(logs.some(l => l.resource === 'leaves' && l.action === 'UPDATE' && l.success)).toBe(true);
  });
});
