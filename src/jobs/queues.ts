import Queue from 'bull';
import { config } from '@/config/environment';
import { logger } from '@/shared/utils/logger';
import { NotificationDispatchPayload } from '@/domains/notifications/services/NotificationService';

export let payrollQueue: Queue.Queue | undefined;
export let notificationQueue: Queue.Queue | undefined;

export const initQueues = (): void => {
  if (!config.jobsEnabled) return;
  if (!payrollQueue) {
    payrollQueue = new Queue('payroll', config.redisUrl);
    payrollQueue.on('error', (err) => {
      logger.warn(`Payroll queue error: ${err.message}`);
    });
  }
  if (!notificationQueue) {
    notificationQueue = new Queue('notifications', config.redisUrl);
    notificationQueue.on('error', (err) => {
      logger.warn(`Notification queue error: ${err.message}`);
    });
  }
};

export type PayrollRunJobData = {
  organizationId: string;
  periodStart: string; // ISO string
  periodEnd: string;   // ISO string
  employees: Array<{ employeeId: string; baseSalaryMinor: number }>;
  userId: string;
  requestId?: string;
};

export type NotificationJobData = {
  organizationId: string;
  dispatch: NotificationDispatchPayload;
  requestorId: string;
  requestId?: string;
};

export const defaultJobOptions = {
  attempts: 3,
  backoff: { type: 'exponential', delay: 5000 },
  removeOnComplete: true,
  removeOnFail: false,
};