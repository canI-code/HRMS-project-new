import { Job, Queue } from 'bull';
import { NotificationJobData } from '@/jobs/queues';
import { notificationService } from '@/domains/notifications/services/NotificationService';
import { logger } from '@/shared/utils/logger';

export const registerNotificationProcessors = (queue: Queue): void => {
  queue.process('send-notification', async (job: Job<NotificationJobData>) => {
    const { organizationId, dispatch, requestorId, requestId } = job.data;
    logger.info(`Processing notification job ${job.id} for org ${organizationId}`);

    const logs = await notificationService.sendWorkflowNotification(
      organizationId,
      dispatch,
      requestorId,
      requestId || `job-${job.id}`
    );

    return { count: logs.length };
  });
};