import { registerPayrollProcessors } from '@/jobs/processors/payrollProcessor';
import { registerNotificationProcessors } from '@/jobs/processors/notificationProcessor';

// Ensure required env vars and skip DB for these unit tests
process.env['SKIP_DB_TESTS'] = 'true';
process.env['JWT_SECRET'] = process.env['JWT_SECRET'] || 'test-secret';
process.env['JWT_REFRESH_SECRET'] = process.env['JWT_REFRESH_SECRET'] || 'test-refresh-secret';
process.env['MONGODB_URI'] = process.env['MONGODB_URI'] || 'mongodb://localhost:27017/enterprise-hrms-test';

type Handler = (job: any) => Promise<any>;

class FakeQueue {
  handlers: Record<string, Handler> = {};
  process(name: string, handler: Handler) {
    this.handlers[name] = handler;
  }
}

jest.mock('@/domains/payroll/services/PayrollService', () => ({
  payrollService: {
    startPayrollRun: jest.fn(async (
      _organizationId: string,
      _periodStart: Date,
      _periodEnd: Date,
      _employees: Array<{ employeeId: string; baseSalaryMinor: number }>,
      _userId: string,
      _requestId?: string
    ) => ({ _id: { toString: () => 'run123' }, status: 'started' })),
  },
}));

jest.mock('@/domains/notifications/services/NotificationService', () => ({
  notificationService: {
    sendWorkflowNotification: jest.fn(async (
      _organizationId: string,
      _dispatch: any,
      _requestorId: string,
      _requestId?: string
    ) => [{ _id: 'log1' }, { _id: 'log2' }]),
  },
}));

describe('Job processors', () => {
  test('payroll processor handles start-run and returns run metadata', async () => {
    const q = new FakeQueue();
    registerPayrollProcessors(q as any);

    const handler = q.handlers['start-run']!;
    expect(handler).toBeDefined();

    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();

    const result = await handler({
      id: 42,
      data: {
        organizationId: '000000000000000000000000',
        periodStart: start,
        periodEnd: end,
        employees: [{ employeeId: 'emp1', baseSalaryMinor: 500000 }],
        userId: '000000000000000000000000',
        requestId: 'req-42',
      },
    });

    expect(result).toEqual({ runId: 'run123', status: 'started' });
  });

  test('notification processor handles send-notification and returns count', async () => {
    const q = new FakeQueue();
    registerNotificationProcessors(q as any);

    const handler = q.handlers['send-notification']!;
    expect(handler).toBeDefined();

    const result = await handler({
      id: 99,
      data: {
        organizationId: '000000000000000000000000',
        dispatch: {
          templateName: 'generic-info',
          category: 'demo',
          recipients: [{ userId: '000000000000000000000000' }],
          payload: { message: 'Hello' },
        },
        requestorId: '000000000000000000000000',
        requestId: 'req-99',
      },
    });

    expect(result).toEqual({ count: 2 });
  });
});
