import { initQueues, payrollQueue, notificationQueue, defaultJobOptions, PayrollRunJobData, NotificationJobData } from '@/jobs/queues';
import { logger } from '@/shared/utils/logger';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function main() {
  initQueues();

  // Enqueue a payroll run demo job (requires an active salary structure to succeed)
  const now = new Date();
  const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const payrollData: PayrollRunJobData = {
    organizationId: process.env['DEMO_ORG_ID'] || '000000000000000000000000',
    periodStart: periodStart.toISOString(),
    periodEnd: periodEnd.toISOString(),
    employees: [
      { employeeId: process.env['DEMO_EMP_ID'] || '000000000000000000000000', baseSalaryMinor: 500000 },
    ],
    userId: process.env['DEMO_USER_ID'] || '000000000000000000000000',
    requestId: 'demo-enqueue',
  };

  if (payrollQueue) {
    const job = await payrollQueue.add('start-run', payrollData, defaultJobOptions);
    logger.info(`Enqueued payroll job id=${job.id}`);
  } else {
    logger.warn('Payroll queue not initialized (JOBS_ENABLED might be false).');
  }

  const notificationData: NotificationJobData = {
    organizationId: process.env['DEMO_ORG_ID'] || '000000000000000000000000',
    dispatch: {
      templateName: process.env['DEMO_TEMPLATE'] || 'generic-info',
      category: 'demo',
      recipients: [
        { userId: process.env['DEMO_USER_ID'] || '000000000000000000000000' },
      ],
      payload: { message: 'Hello from demo job!' },
    },
    requestorId: process.env['DEMO_USER_ID'] || '000000000000000000000000',
    requestId: 'demo-enqueue',
  };

  if (notificationQueue) {
    const job = await notificationQueue.add('send-notification', notificationData, defaultJobOptions);
    logger.info(`Enqueued notification job id=${job.id}`);
  } else {
    logger.warn('Notification queue not initialized (JOBS_ENABLED might be false).');
  }

  // Give Redis a brief moment to accept the job then close connections
  await sleep(250);
  await payrollQueue?.close();
  await notificationQueue?.close();
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
