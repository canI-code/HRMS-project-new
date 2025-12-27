import { Job, Queue } from 'bull';
import { PayrollRunJobData } from '@/jobs/queues';
import { payrollService } from '@/domains/payroll/services/PayrollService';
import { logger } from '@/shared/utils/logger';

export const registerPayrollProcessors = (queue: Queue): void => {
  queue.process('start-run', async (job: Job<PayrollRunJobData>) => {
    const { organizationId, periodStart, periodEnd, employees, userId, requestId } = job.data;
    logger.info(`Processing payroll run job ${job.id} for org ${organizationId}`);

    const run = await payrollService.startPayrollRun(
      organizationId,
      new Date(periodStart),
      new Date(periodEnd),
      employees,
      userId,
      requestId || `job-${job.id}`
    );

    return { runId: run._id.toString(), status: run.status };
  });
};