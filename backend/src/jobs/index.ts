import { logger } from '@/shared/utils/logger';
import { config } from '@/config/environment';
import { registerPayrollProcessors } from '@/jobs/processors/payrollProcessor';
import { registerNotificationProcessors } from '@/jobs/processors/notificationProcessor';
import { initQueues, payrollQueue, notificationQueue } from '@/jobs/queues';

export const initJobs = (): void => {
  if (!config.jobsEnabled) {
    logger.info('Background jobs are disabled (set JOBS_ENABLED=true to enable).');
    return;
  }

  try {
    initQueues();
    if (payrollQueue) registerPayrollProcessors(payrollQueue);
    if (notificationQueue) registerNotificationProcessors(notificationQueue);
    logger.info('Job processors initialized.');
  } catch (err) {
    logger.warn(`Failed to initialize job processors: ${(err as Error).message}`);
  }
};